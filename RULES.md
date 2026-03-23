# App-Starter Rules

Ces regles sont obligatoires pour toute evolution de `apps/App-Starter`.

## 1. Fondation et scope

- `apps/App-Starter` est la base de reference pour les futures apps.
- Toute decision structurelle doit privilegier la reutilisabilite sur le besoin ponctuel.
- Si une regle semble bloquante, documenter l'exception dans la PR et dans `docs/AI-HANDOFF.md`.

## 2. Base de donnees

- Une app = un fichier de migration principal tant que possible.
- Un fichier seed unique uniquement si des donnees initiales sont necessaires.
- RLS n'est pas imposee par defaut dans le starter.

## 2b. Placeholders schema/table (OBLIGATOIRE)

- Le schema `app_starter` est un **placeholder** — il doit etre renomme en `app_<slug>` avant tout deploiement.
- La table `items` est un **placeholder** — renommer selon l'entite metier reelle.
- La route `/v1/items` est un **placeholder** — adapter au domaine.
- La page `Items.tsx` et la route `/items` sont des **placeholders** — renommer et adapter.
- `itemsApi` dans `services/api.ts` est un **placeholder** — renommer.
- La migration `20260220000000_app_starter_demo.sql` et le seed `005_app_starter.sql` sont des **placeholders** — renommer avec un nouveau timestamp et slug lors du clonage.
- Un agent qui livre une app derivee du starter sans avoir renomme ces elements livre une tache incomplete.

## 3. Placeholders et personnalisation

- Aucun placeholder ne doit rester en production (`__APP_NAME__`, `__APP_SLUG__`, etc.).
- `APP_SLUG` et `FRONTEND_BASE_PATH` doivent toujours etre personnalises.
- Les URLs publiques doivent etre coherentes avec le slug de l'app.

## 4. Securite backend

- Pas de login local dans le starter.
- Toute route metier doit utiliser `Depends(get_current_user)`.
- Les endpoints debug sont autorises uniquement en developpement.
- En production:
1. CSRF active pour les requetes mutantes.
2. Cookies securises.
3. CORS sans wildcard/localhost.

## 5. UI source unique

- La source UI unique est locale au starter:
1. `apps/App-Starter/frontend/packages/ui-core`
2. `apps/App-Starter/frontend/packages/ui-shell`
3. `apps/App-Starter/frontend/packages/ui-tokens`
- Ne pas recreer ces briques dans `src/components`.
- Toute brique UI generique doit d'abord etre ajoutee dans `packages/ui-*`.
- Toute page metier doit etre composee avec ces briques.

## 6. Contrat app shell

- Le logo d'app doit venir de `public.apps.icon_url` via `GET /v1/starter/app-shell`.
- Ne pas revenir a un fallback base sur l'initiale de l'app pour le logo principal.
- Le fallback visuel autorise est un symbole neutre (`puzzle`) si `icon_url` absent.

## 7. Documentation et passation

- Toute modif d'architecture, de securite, ou de contrat API doit mettre a jour:
1. `apps/App-Starter/README.md`
2. `apps/App-Starter/docs/AI-HANDOFF.md`
- Un agent qui livre une feature sans mise a jour de documentation livre une tache incomplete.
