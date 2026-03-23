#!/usr/bin/env python3
"""
request_starter.py — Socle commun pour toutes les requêtes SWOM Must G5
========================================================================

Ce fichier est la base de tous les scripts de requête vers l'API SWOM.
Il centralise :

    • Configuration (URLs, credentials via variables d'environnement)
    • Mapping complet de tous les services SWOM
    • Création de client Zeep (SSL bypass, retry, override d'URL de service)
    • Authentification
    • Gestion des erreurs de réponse API
    • Sérialisation des objets Zeep en Python natif
    • Helpers de manipulation de données (listes, dates, chaînes, CSV)
    • Pagination automatique
    • Logging configurable
    • Template CLI (argparse) prêt à l'emploi

Usage type dans un script enfant
---------------------------------
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    from request_starter import (
        create_client,
        get_auth_params,
        check_response_or_raise,
        extract_zeep_data,
        to_list,
        to_iso,
        safe_get,
        export_csv,
        paginate,
        setup_logging,
    )

Toutes les fonctions sont documentées et testées unitairement (cf. bloc
``if __name__ == "__main__"`` en bas de fichier).
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Callable, Dict, Generator, Iterable, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Résolution du chemin racine du projet
# ---------------------------------------------------------------------------
_HERE: str = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT: str = _HERE
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


# =============================================================================
# CONFIGURATION
# =============================================================================

API_CONFIG: Dict[str, str] = {
    # URL de base — surcharger via SWOM_BASE_URL pour staging / VPN
    "base_url": os.getenv(
        "SWOM_BASE_URL",
        "https://hdsweb2.mustinformatique.fr:444/APIWCF/1167/",
    ),
    "origine":  os.getenv("SWOM_ORIGINE",  "API_G5"),
    "username": os.getenv("SWOM_USERNAME", "API_G5"),
    "password": os.getenv("SWOM_PASSWORD", "k7LU97xd"),
}


# =============================================================================
# MAPPING COMPLET DES SERVICES
# =============================================================================

def _svc(name: str) -> Dict[str, str]:
    """Construit l'entrée svc/wsdl pour un service à partir de son nom."""
    base = "https://hdsweb2.mustinformatique.fr:444/APIWCF/1167/"
    svc = f"{base}{name}.svc"
    return {"svc": svc, "wsdl": f"{svc}?wsdl"}


SWOM_SERVICES: Dict[str, Dict[str, str]] = {
    "SWOM_Appareils":        _svc("SWOM_Appareils"),
    "SWOM_Articles":         _svc("SWOM_Articles"),
    "SWOM_AssuranceMaladie": _svc("SWOM_AssuranceMaladie"),
    "SWOM_Clients":          _svc("SWOM_Clients"),
    "SWOM_Contacts":         _svc("SWOM_Contacts"),
    "SWOM_Documents":        _svc("SWOM_Documents"),
    "SWOM_Dossier3CE":       _svc("SWOM_Dossier3CE"),
    "SWOM_Dossiers":         _svc("SWOM_Dossiers"),
    "SWOM_Factures":         _svc("SWOM_Factures"),
    "SWOM_Fournisseurs":     _svc("SWOM_Fournisseurs"),
    "SWOM_Interventions":    _svc("SWOM_Interventions"),
    "SWOM_Medecins":         _svc("SWOM_Medecins"),
    "SWOM_Parametrage":      _svc("SWOM_Parametrage"),
    "SWOM_Telesuivi":        _svc("SWOM_Telesuivi"),
    "SWOM_Utilitaire":       _svc("SWOM_Utilitaire"),
}


def get_service_info(service_name: str) -> Optional[Dict[str, str]]:
    """Retourne les URLs svc/wsdl d'un service ou None s'il est inconnu."""
    return SWOM_SERVICES.get(service_name)


def get_all_services() -> Dict[str, Dict[str, str]]:
    """Retourne une copie du mapping complet des services."""
    return SWOM_SERVICES.copy()


# =============================================================================
# AUTHENTIFICATION
# =============================================================================

def get_auth_params() -> Dict[str, Any]:
    """
    Retourne le dictionnaire d'authentification minimal pour toute requête SWOM.

    Exemple d'utilisation ::

        params = get_auth_params()
        params["ControleMax"] = False
        params["Recherche"] = {"NumeroParc": "380197"}
        response = client.service.FindParc(paramFindParc=params)
    """
    return {
        "Authentification": "",          # Toujours vide — auth par credentials
        "Origine":   API_CONFIG["origine"],
        "Username":  API_CONFIG["username"],
        "Password":  API_CONFIG["password"],
    }


# =============================================================================
# CRÉATION DU CLIENT ZEEP
# =============================================================================

def create_client(
    service_name: str,
    timeout: int = 30,
    verify_ssl: bool = False,
) -> Any:
    """
    Crée et retourne un client Zeep configuré pour un service SWOM.

    Fonctionnalités incluses
    ------------------------
    - Résolution du service depuis ``SWOM_SERVICES`` avec fallback sur
      ``API_CONFIG["base_url"]`` si le service est inconnu.
    - Désactivation de la vérification SSL (nécessaire sur VPN interne).
    - Stratégie de retry (3 tentatives, backoff exponentiel).
    - Réécriture de l'adresse de service depuis le WSDL pour éviter les
      redirections vers des adresses internes inaccessibles.
    - Support des variables d'environnement ``SWOM_BASE_URL`` et
      ``SWOM_DOSSIERS_BASE_URL`` pour les overrides par service.

    Args:
        service_name: Nom du service SWOM (ex. ``"SWOM_Articles"``).
        timeout:      Timeout de connexion en secondes (défaut : 30).
        verify_ssl:   Vérifier le certificat SSL (défaut : False).

    Returns:
        Instance ``zeep.Client`` prête à l'emploi.

    Raises:
        ConnectionError: Si la connexion au WSDL échoue.
    """
    from zeep import Client
    from zeep.transports import Transport
    from requests import Session
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    log = logging.getLogger(__name__)

    # 1) Résolution des URLs
    service_info = get_service_info(service_name)
    if service_info:
        wsdl_url    = service_info["wsdl"]
        service_url = service_info["svc"]
        log.debug("Service trouvé dans SWOM_SERVICES : %s", service_name)
    else:
        base = API_CONFIG.get("base_url", "https://hdsweb2.mustinformatique.fr:444/APIWCF/1167/")
        if not base.endswith("/"):
            base += "/"
        wsdl_url    = f"{base}{service_name}.svc?wsdl"
        service_url = f"{base}{service_name}.svc"
        log.warning(
            "Service '%s' absent de SWOM_SERVICES — fallback sur base_url.",
            service_name,
        )

    # 2) Override global de base URL (utile pour staging ou proxy local)
    base_override = os.getenv("SWOM_BASE_URL")
    if base_override:
        if not base_override.endswith("/"):
            base_override += "/"
        for svc_name, urls in SWOM_SERVICES.items():
            leaf = urls["svc"].rsplit("/", 1)[-1]
            urls["svc"]  = f"{base_override}{leaf}"
            urls["wsdl"] = f"{urls['svc']}?wsdl"
        # Recalculer pour le service courant
        if service_name in SWOM_SERVICES:
            wsdl_url    = SWOM_SERVICES[service_name]["wsdl"]
            service_url = SWOM_SERVICES[service_name]["svc"]

    # 3) Override spécifique SWOM_Dossiers
    dossiers_override = os.getenv("SWOM_DOSSIERS_BASE_URL")
    if dossiers_override and "SWOM_Dossiers" in SWOM_SERVICES:
        if not dossiers_override.endswith("/"):
            dossiers_override += "/"
        leaf = SWOM_SERVICES["SWOM_Dossiers"]["svc"].rsplit("/", 1)[-1]
        SWOM_SERVICES["SWOM_Dossiers"]["svc"]  = f"{dossiers_override}{leaf}"
        SWOM_SERVICES["SWOM_Dossiers"]["wsdl"] = (
            f"{SWOM_SERVICES['SWOM_Dossiers']['svc']}?wsdl"
        )

    # 4) Endpoint canonique SWOM_Dossiers (garde-fou — ne jamais laisser dériver)
    SWOM_SERVICES["SWOM_Dossiers"]["svc"] = (
        "https://hdsweb2.mustinformatique.fr:444/APIWCF/1167/SWOM_Dossiers.svc"
    )
    SWOM_SERVICES["SWOM_Dossiers"]["wsdl"] = (
        f"{SWOM_SERVICES['SWOM_Dossiers']['svc']}?wsdl"
    )
    if service_name == "SWOM_Dossiers":
        wsdl_url    = SWOM_SERVICES["SWOM_Dossiers"]["wsdl"]
        service_url = SWOM_SERVICES["SWOM_Dossiers"]["svc"]

    # 5) Session HTTP avec retry
    session = Session()
    session.verify  = verify_ssl
    session.timeout = timeout

    retry_strategy = Retry(
        total=3,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
        backoff_factor=1,
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    transport = Transport(session=session)

    # 6) Création du client Zeep
    try:
        client = Client(wsdl_url, transport=transport)
    except Exception as exc:
        raise ConnectionError(
            f"Impossible de créer le client SOAP pour '{service_name}'.\n"
            f"WSDL       : {wsdl_url}\n"
            f"Service URL: {service_url}\n"
            f"Erreur     : {exc}\n"
            "Vérifiez la connectivité réseau, votre VPN et "
            "la variable d'environnement SWOM_BASE_URL si nécessaire."
        ) from exc

    # 7) Réécriture de l'adresse de service (contournement adresses internes WSDL)
    try:
        for svc in client.wsdl.services.values():
            for port in svc.ports.values():
                if hasattr(port, "binding_options") and port.binding_options:
                    port.binding_options["address"] = service_url
    except Exception as exc:
        log.warning("Impossible de forcer l'URL du service : %s", exc)

    return client


# =============================================================================
# GESTION DES ERREURS DE RÉPONSE
# =============================================================================

def check_response_errors(response: Any) -> Tuple[bool, str]:
    """
    Inspecte la réponse SWOM et retourne ``(has_error, message)``.

    Returns:
        Tuple[bool, str]:
            - ``(True, message)``  si une erreur est présente.
            - ``(False, message)`` si seulement un avertissement.
            - ``(False, "")``      si la réponse est propre.
    """
    if hasattr(response, "Erreur"):
        err = response.Erreur
        if getattr(err, "HasError", False):
            return True, getattr(err, "Message", None) or "Erreur inconnue"
        if getattr(err, "HasWarning", False):
            warnings: List[str] = list(getattr(err, "Avertissements", None) or [])
            return False, f"Avertissements : {', '.join(warnings)}"
    return False, ""


def check_response_or_raise(
    response: Any,
    nested_result_field: Optional[str] = None,
) -> Any:
    """
    Vérifie la réponse et lève une ``RuntimeError`` si elle contient une erreur.

    Args:
        response:             Objet de réponse SWOM.
        nested_result_field:  Si fourni, retourne ``getattr(response, field)``.

    Returns:
        La réponse (ou le champ imbriqué) si aucune erreur.

    Raises:
        RuntimeError: Si ``HasError`` est vrai dans la réponse.
    """
    has_error, msg = check_response_errors(response)
    if has_error:
        raise RuntimeError(f"Erreur API SWOM : {msg}")
    if msg:
        logging.getLogger(__name__).warning(msg)
    if nested_result_field:
        return getattr(response, nested_result_field, response)
    return response


# =============================================================================
# SÉRIALISATION DES OBJETS ZEEP
# =============================================================================

def extract_zeep_data(obj: Any, max_depth: int = 15) -> Any:
    """
    Convertit récursivement un objet Zeep (XSD complexe) en types Python natifs.

    Zeep encapsule les types complexes dans des objets dont ``serialize_object``
    ne retourne que le nom du type (ex. ``"Article"``). Cette fonction explore
    les éléments XSD définis pour extraire toutes les valeurs.

    Args:
        obj:        Objet Zeep ou valeur Python quelconque.
        max_depth:  Profondeur maximale de récursion (garde-fou).

    Returns:
        ``dict``, ``list``, ou valeur primitive Python.
    """
    if max_depth <= 0:
        return {"_truncated": str(type(obj))}

    if obj is None:
        return None

    # Types primitifs — passer directement
    if isinstance(obj, (str, int, float, bool)):
        return obj

    # datetime → str ISO
    if isinstance(obj, datetime):
        return obj.isoformat()

    # Listes / tuples natifs
    if isinstance(obj, (list, tuple)):
        return [extract_zeep_data(item, max_depth - 1) for item in obj]

    # Dictionnaires natifs
    if isinstance(obj, dict):
        return {k: extract_zeep_data(v, max_depth - 1) for k, v in obj.items()}

    # Objets Zeep complexes (possèdent _xsd_type avec des éléments XSD)
    if hasattr(obj, "_xsd_type") and hasattr(obj._xsd_type, "elements"):
        result: Dict[str, Any] = {}
        try:
            for elem_name, _elem_type in obj._xsd_type.elements:
                if hasattr(obj, elem_name):
                    result[elem_name] = extract_zeep_data(
                        getattr(obj, elem_name), max_depth - 1
                    )
        except Exception:
            # Fallback : exploration par dir()
            for attr in dir(obj):
                if attr.startswith("_"):
                    continue
                try:
                    val = getattr(obj, attr)
                    if not callable(val):
                        result[attr] = extract_zeep_data(val, max_depth - 1)
                except Exception:
                    pass
        return result

    # Tentative de conversion en dict (ex. CompoundValue Zeep)
    try:
        return {k: extract_zeep_data(v, max_depth - 1) for k, v in dict(obj).items()}
    except (TypeError, ValueError):
        pass

    # Objet itérable non-string
    try:
        if hasattr(obj, "__iter__"):
            return [extract_zeep_data(item, max_depth - 1) for item in obj]
    except Exception:
        pass

    return str(obj)


# =============================================================================
# HELPERS DE MANIPULATION DE DONNÉES
# =============================================================================

def to_list(obj: Any) -> List[Any]:
    """
    Force n'importe quel objet en liste Python.

    - ``None``      → ``[]``
    - liste/tuple   → ``list(obj)``
    - objet itérable non-string → ``list(obj)``
    - scalaire      → ``[obj]``
    """
    if obj is None:
        return []
    if isinstance(obj, list):
        return obj
    if isinstance(obj, tuple):
        return list(obj)
    if hasattr(obj, "__iter__") and not isinstance(obj, (str, bytes)):
        try:
            return list(obj)
        except TypeError:
            pass
    return [obj]


def safe_get(obj: Any, attr: str, default: str = "") -> str:
    """
    Retourne la valeur d'un attribut sous forme de chaîne nettoyée (strip).

    Args:
        obj:     Objet source (peut être None).
        attr:    Nom de l'attribut à lire.
        default: Valeur par défaut si l'attribut est absent ou None.
    """
    value = getattr(obj, attr, None) if obj is not None else None
    return str(value or default).strip()


def to_iso(value: Any) -> str:
    """
    Convertit une date/datetime en chaîne ISO ``YYYY-MM-DD``.

    Gère les valeurs nulles SWOM (``None``, ``""``, ``"0001-01-01 00:00:00"``).
    """
    SWOM_NULL_DATES = {None, "", "0001-01-01 00:00:00", "0001-01-01T00:00:00"}
    if value in SWOM_NULL_DATES:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    try:
        return (
            datetime.fromisoformat(str(value).replace(" 00:00:00", ""))
            .date()
            .isoformat()
        )
    except Exception:
        return str(value)


# =============================================================================
# PAGINATION
# =============================================================================

def paginate(
    fetch_fn: Callable[[int, int], Any],
    extract_fn: Callable[[Any], List[Any]],
    page_size: int = 200,
    max_pages: int = 1000,
) -> Generator[Any, None, None]:
    """
    Itérateur de pagination générique pour les API SWOM.

    Args:
        fetch_fn:   Fonction ``(page_num, page_size) → response``.
                    Elle doit lever une exception en cas d'erreur.
        extract_fn: Fonction ``response → List[item]`` extrayant les items
                    depuis la réponse d'une page.
        page_size:  Nombre d'items par page (défaut : 200).
        max_pages:  Garde-fou contre les boucles infinies (défaut : 1000).

    Yields:
        Chaque item individuellement.

    Example::

        def fetch(page_num, page_size):
            params = get_auth_params()
            params["Recherche"] = {"PageNum": page_num, "PageSize": page_size}
            return client.service.FindArticle(paramFindArticle=params)

        def extract(response):
            articles = getattr(response, "Articles", None) or []
            return to_list(getattr(articles, "Article", articles))

        for article in paginate(fetch, extract, page_size=500):
            print(article.Code)
    """
    log = logging.getLogger(__name__)
    for page_num in range(1, max_pages + 1):
        response = fetch_fn(page_num, page_size)
        items = extract_fn(response)
        if not items:
            log.debug("Pagination terminée à la page %d (aucun item).", page_num)
            break
        yield from items
        if len(items) < page_size:
            log.debug(
                "Pagination terminée à la page %d (%d items < page_size=%d).",
                page_num,
                len(items),
                page_size,
            )
            break
    else:
        log.warning("Pagination interrompue au garde-fou max_pages=%d.", max_pages)


# =============================================================================
# EXPORT CSV
# =============================================================================

def export_csv(
    rows: List[Dict[str, Any]],
    output_path: str,
    fieldnames: Optional[List[str]] = None,
    encoding: str = "utf-8",
) -> None:
    """
    Écrit une liste de dictionnaires dans un fichier CSV.

    Args:
        rows:        Données à écrire.
        output_path: Chemin du fichier CSV de sortie.
        fieldnames:  Ordre des colonnes. Si None, déduit depuis ``rows[0]``.
        encoding:    Encodage du fichier (défaut : utf-8).

    Raises:
        ValueError: Si ``rows`` est vide et ``fieldnames`` est None.
    """
    if not rows:
        logging.getLogger(__name__).warning(
            "export_csv : aucune donnée à écrire dans '%s'.", output_path
        )
        return

    cols = fieldnames or list(rows[0].keys())
    with open(output_path, "w", newline="", encoding=encoding) as f:
        writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    logging.getLogger(__name__).info(
        "✅ CSV exporté : %s (%d ligne(s))", output_path, len(rows)
    )


def export_json(
    data: Any,
    output_path: str,
    indent: int = 2,
    encoding: str = "utf-8",
) -> None:
    """
    Sérialise ``data`` en JSON dans ``output_path``.

    Args:
        data:        Objet sérialisable en JSON.
        output_path: Chemin du fichier JSON de sortie.
        indent:      Indentation (défaut : 2).
        encoding:    Encodage du fichier (défaut : utf-8).
    """
    with open(output_path, "w", encoding=encoding) as f:
        json.dump(data, f, indent=indent, ensure_ascii=False, default=str)

    logging.getLogger(__name__).info(
        "✅ JSON exporté : %s", output_path
    )


# =============================================================================
# LOGGING
# =============================================================================

def setup_logging(
    level: int = logging.INFO,
    fmt: str = "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt: str = "%H:%M:%S",
) -> None:
    """
    Configure le logging de base pour les scripts de requête.

    Args:
        level:   Niveau de log (défaut : ``logging.INFO``).
        fmt:     Format du message (défaut : timestamp + niveau + logger + message).
        datefmt: Format de la date dans les logs.

    Appeler en début de ``main()`` ::

        setup_logging()                              # INFO
        setup_logging(level=logging.DEBUG)           # DEBUG verbose
    """
    logging.basicConfig(level=level, format=fmt, datefmt=datefmt)
    # Réduire le bruit de zeep/urllib3 sauf si DEBUG
    if level > logging.DEBUG:
        logging.getLogger("zeep").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("requests").setLevel(logging.WARNING)


# =============================================================================
# HELPERS MÉTIER COURANTS
# =============================================================================

def load_numbers_from_file(path: str, col_names: Optional[List[str]] = None) -> List[int]:
    """
    Charge des entiers depuis un CSV ou un fichier texte (un nombre par ligne).

    Args:
        path:      Chemin du fichier source.
        col_names: Noms de colonnes CSV à inspecter, dans l'ordre de priorité.
                   Défaut : ``["dossier_num", "num", "NumeroDossier", "code"]``.

    Returns:
        Liste d'entiers (doublons conservés).
    """
    if not path:
        return []

    col_candidates = col_names or ["dossier_num", "num", "NumeroDossier", "code"]
    numbers: List[int] = []

    if path.lower().endswith(".csv"):
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw = next(
                    (row[c] for c in col_candidates if c in row and row[c]),
                    None,
                )
                if raw:
                    try:
                        numbers.append(int(raw))
                    except ValueError:
                        continue
    else:
        with open(path, encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped:
                    continue
                try:
                    numbers.append(int(stripped))
                except ValueError:
                    continue

    return numbers


def dedup_ordered(items: Iterable[Any]) -> List[Any]:
    """Supprime les doublons en conservant l'ordre d'apparition."""
    seen: set = set()
    result: List[Any] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


# =============================================================================
# TEMPLATE CLI — À COPIER-COLLER DANS CHAQUE SCRIPT ENFANT
# =============================================================================
# Le bloc ci-dessous montre le squelette minimal recommandé pour un script
# de requête. Il n'est PAS exécuté lors de l'import du module.

_CLI_TEMPLATE = """
#!/usr/bin/env python3
\"\"\"Description courte du script.\"\"\"
from __future__ import annotations

import argparse, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from request_starter import (
    create_client,
    get_auth_params,
    check_response_or_raise,
    extract_zeep_data,
    to_list,
    to_iso,
    safe_get,
    export_csv,
    export_json,
    paginate,
    setup_logging,
)


def run(args: argparse.Namespace) -> int:
    \"\"\"Logique métier principale.\"\"\"
    client = create_client("SWOM_Articles")  # ← adapter le service

    def fetch(page_num: int, page_size: int):
        params = get_auth_params()
        params["ControleMax"] = False
        params["Recherche"] = {
            "PageNum": page_num,
            "PageSize": page_size,
            # ... critères métier
        }
        response = client.service.FindXxx(paramFindXxx=params)
        return check_response_or_raise(response)

    def extract(response):
        container = getattr(response, "Items", None) or []
        return to_list(getattr(container, "Item", container))

    rows = []
    for item in paginate(fetch, extract, page_size=200):
        rows.append(extract_zeep_data(item))

    if args.output:
        ext = os.path.splitext(args.output)[-1].lower()
        if ext == ".json":
            export_json(rows, args.output)
        else:
            export_csv(rows, args.output)

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", "-o", help="Fichier de sortie (.csv ou .json).")
    parser.add_argument("--verbose", "-v", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    import logging
    setup_logging(level=logging.DEBUG if args.verbose else logging.INFO)
    try:
        return run(args)
    except Exception as exc:
        import logging as _log
        _log.getLogger(__name__).error("Erreur fatale : %s", exc, exc_info=args.verbose)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
"""


# =============================================================================
# VÉRIFICATION AUTONOME (python request_starter.py)
# =============================================================================

if __name__ == "__main__":
    import pprint

    setup_logging(level=logging.DEBUG)
    log = logging.getLogger("request_starter.selftest")

    print("\n" + "=" * 70)
    print("  request_starter.py — Auto-diagnostic")
    print("=" * 70 + "\n")

    # --- 1. Services disponibles
    services = get_all_services()
    print(f"✅ {len(services)} services enregistrés :\n")
    for name in sorted(services):
        print(f"   • {name}")

    # --- 2. Paramètres d'auth (masquer le mot de passe)
    auth = get_auth_params()
    masked = {**auth, "Password": "***"}
    print(f"\n✅ get_auth_params() → {masked}")

    # --- 3. Helpers
    assert to_list(None)       == [],        "to_list(None)"
    assert to_list([1, 2])     == [1, 2],    "to_list(list)"
    assert to_list(42)         == [42],      "to_list(scalar)"
    assert to_iso(None)        == "",        "to_iso(None)"
    assert to_iso("")          == "",        "to_iso('')"
    assert to_iso(datetime(2026, 2, 19)) == "2026-02-19", "to_iso(datetime)"
    assert dedup_ordered([1, 2, 1, 3, 2]) == [1, 2, 3], "dedup_ordered"
    print("\n✅ Tous les helpers unitaires ont passé.\n")

    # --- 4. Test de connexion optionnel
    print("Test de connexion à SWOM_Articles (nécessite VPN/réseau)...")
    try:
        client = create_client("SWOM_Articles", timeout=10)
        print("✅ Client SWOM_Articles créé avec succès.\n")
    except ConnectionError as ce:
        print(f"⚠️  Connexion impossible (normal hors VPN) : {ce}\n")

    print("=" * 70)
    print("  Fin du diagnostic — request_starter.py est opérationnel.")
    print("=" * 70 + "\n")
