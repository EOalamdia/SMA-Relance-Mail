# AI Handoff - App-Starter

Ce document sert de memo operationnel pour tout agent AI qui reprend `apps/App-Starter`.

## 1. Intent produit

- Cette app est une fondation, pas une app metier finale.
- Toute decision doit favoriser:
1. Reutilisabilite.
2. Coherence avec le hub.
3. Securite par defaut.

## 2. Invariants critiques

### Auth et securite

- Auth centralisee par Traefik ForwardAuth.
- Pas de formulaire de login local dans le starter.
- Les routes metier doivent passer par `get_current_user`.
- Endpoints debug uniquement en dev (`API_DEBUG=true`).
- CSRF active en production pour les requetes mutantes.

### Donnees et acces

- RLS non imposee dans le starter (decision explicite).
- Le controle d'acces principal passe par le hub (`public.access` + middleware auth).

### UI framework

- Source unique UI: `apps/App-Starter/frontend/packages/ui-*`.
- Ne pas dupliquer des composants generiques dans `src/components`.

## 3. Contrat "App Shell"

Fichiers de reference:

- `apps/App-Starter/backend/features/starter/endpoints.py`
- `apps/App-Starter/frontend/src/services/api.ts`
- `apps/App-Starter/frontend/src/MainLayout.tsx`

Comportement attendu:

- `GET /v1/starter/app-shell` retourne `app_name` + `icon_url`.
- `icon_url` vient de `public.apps.icon_url`.
- Priorite de resolution DB:
1. `link`
2. `docker_service_name`
3. `name`
- Le frontend affiche:
1. image si `icon_url` est une URL/chemin/data URI
2. glyphe si `icon_url` est un texte
3. fallback `puzzle` sinon

## 4. Procedure de reprise recommandee

1. Lire `apps/App-Starter/README.md` puis `apps/App-Starter/RULES.md`.
2. Verifier l'etat courant:
   - `git -C apps/App-Starter status --short`
3. Verifier contrats backend:
   - `GET /health`
   - `GET /v1/starter/me`
   - `GET /v1/starter/app-shell`
4. Verifier shell frontend:
   - user email visible
   - logo `icon_url` visible
5. Si doute de cache/bundle:
   - `docker compose -f apps/App-Starter/docker-compose.yml up -d --build`

## 5. Checklist avant livraison

- Les references de chemin pointent vers `apps/App-Starter`, pas `App-Starter-Hub`.
- Aucune regression sur auth headers et endpoints non-prod.
- README + RULES + ce document sont a jour si contrat modifie.
- Les placeholders critiques ne restent pas dans une config de deploiement.

## 6. Decisions deja prises

- Suppression du slug/path "par defaut": le slug doit etre personnalise.
- Endpoints debug conserves uniquement en dev.
- Aucune contrainte RLS imposee par le starter.
- Logo du shell base sur `public.apps.icon_url`, plus sur une initiale.

---

## 7. Demo CRUD Supabase — architecture de reference

### Pourquoi cette demo existe

Elle illustre le **pattern complet backend ↔ DB ↔ frontend** que tout agent doit
reproduire pour chaque nouvelle entite metier. Le schema `app_starter` et la table
`items` sont des **placeholders** — l'idee est de les renommer, pas de les garder.

### Etat en base (applique à chaud le 2026-02-20)

```sql
-- Schema cree:
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app_starter';
-- Table cree avec trigger updated_at verifie:
\d app_starter.items
-- 4 items seedes (UUIDs fixes, idempotent ON CONFLICT DO NOTHING):
SELECT id, name FROM app_starter.items ORDER BY created_at;
```

Pour appliquer sur un environnement vierge (sans `supabase db reset`) :
```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20260220000000_app_starter_demo.sql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/seeds/005_app_starter.sql
```

### Fichiers impliques (tous marques PLACEHOLDER)

| Couche | Fichier | Ce qui est placeholder |
|---|---|---|
| DB migration | `supabase/migrations/20260220000000_app_starter_demo.sql` | schema `app_starter`, table `items` |
| DB seed | `supabase/seeds/005_app_starter.sql` | les 4 items demo |
| Config | `supabase/config.toml` → `api.schemas` | `"app_starter"` dans la liste |
| Backend schemas | `backend/features/items/schemas.py` | `ItemOut`, `ItemCreate`, `ItemUpdate` |
| Backend endpoints | `backend/features/items/endpoints.py` | `_SCHEMA`, `_TABLE`, prefix `/v1/items` |
| Backend router | `backend/main.py` | `items_router` |
| Frontend types | `frontend/src/services/api.ts` | `ItemOut`, `itemsApi` |
| Frontend page | `frontend/src/pages/Items.tsx` | tout le composant |
| Frontend router | `frontend/src/App.tsx` | route `/items` |
| Frontend nav | `frontend/src/config/nav.ts` | entree "Items (demo)" |

### Pattern a reproduire pour une nouvelle entite

1. **Migration** : creer `supabase/migrations/<timestamp>_<slug>.sql`
   - `CREATE SCHEMA IF NOT EXISTS app_<slug>;`
   - Table avec `id UUID PK`, colonnes metier, `created_at`, `updated_at`
   - Trigger `public.update_updated_at_column()` reutilise
   - Pas de RLS (decision starter)
   - Ajouter le schema a `supabase/config.toml → api.schemas`

2. **Seed** : `supabase/seeds/<N>_<slug>.sql`
   - UUIDs fixes pour idempotence (`ON CONFLICT DO NOTHING`)

3. **Backend** : `features/<entite>/`
   - `schemas.py` : `<Entite>Out`, `<Entite>Create`, `<Entite>Update`, `<Entite>sListResponse`
   - `endpoints.py` : router avec `_SCHEMA`/`_TABLE`, `get_schema_table()`, tous les endpoints avec `Depends(get_current_user)`
   - Enregistrer le router dans `main.py`

4. **Frontend** :
   - Types + API object dans `services/api.ts`
   - Page dans `pages/<Entite>.tsx` (liste + creation + edition inline + suppression)
   - Route dans `App.tsx`
   - Entree dans `config/nav.ts`

5. **Appliquer a chaud** (pas de db reset necessaire) :
   ```bash
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/migrations/<fichier>.sql
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/seeds/<fichier>.sql
   ```
   Puis rebuild docker si necessaire :
   ```bash
   docker compose -f apps/App-Starter/docker-compose.yml up -d --build
   ```

### Utilitaire cle : `get_schema_table()`

```python
# apps/App-Starter/backend/core/supabase.py
from core.supabase import get_schema_table

table = get_schema_table("app_<slug>", "<entite>")
rows  = table.select("*").order("created_at", desc=True).execute().data
```

C'est le point d'entree unique pour tout acces DB schema-specifique.
Ne pas recreer de client Supabase manuel dans les endpoints.

### Checklist complete avant clonage / livraison d'une nouvelle app

- [ ] Schema renomme : `app_starter` → `app_<slug>` (migration + config.toml + endpoints)
- [ ] Table renommee : `items` → `<entite>` (migration + endpoints + schemas + frontend)
- [ ] Prefixe route renomme : `/v1/items` → `/v1/<slug>/<entite>`
- [ ] `itemsApi` renomme dans `services/api.ts`
- [ ] Page `Items.tsx` renommee et contenu adapte
- [ ] Route `/items` renommee dans `App.tsx`
- [ ] Entree nav mise a jour dans `config/nav.ts`
- [ ] UUIDs seed remplaces par de nouveaux UUIDs fixes metier
- [ ] Fichiers migration/seed renommes avec nouveau timestamp + slug
- [ ] `README.md` + `RULES.md` + ce document mis a jour

