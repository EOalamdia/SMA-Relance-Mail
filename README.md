# App-Starter

`apps/App-Starter` est la base de reference pour creer de nouvelles apps du hub.
Le but: garder une fondation unique, securisee, et simple a cloner/customiser.

## Scope

- Backend FastAPI aligne sur la securite globale du hub.
- Frontend React + shell standard (menu lateral + sous-pages).
- Framework UI local a l'app dans `frontend/packages/ui-*` (source unique).
- Integration Traefik + Supabase + scripts hub.

## Architecture

```text
apps/App-Starter/
  backend/
    core/                 # config, auth headers ForwardAuth, middleware, supabase, csrf, cache
    features/
      health/             # GET /health
      starter/            # endpoints de base (/v1/starter/*)
    main.py               # bootstrap FastAPI
  frontend/
    packages/
      ui-core/            # composants UI generiques
      ui-shell/           # shell applicatif (sidebar, nav, user menu)
      ui-tokens/          # design tokens + preset tailwind
    src/
      config/nav.ts       # navigation de reference
      pages/              # pages de demonstration
      services/api.ts     # client API + CSRF
      MainLayout.tsx      # integration shell + user + icon_url
  docker-compose.yml
  .env.example
  RULES.md
  docs/AI-HANDOFF.md
```

## Contrats de securite (invariants)

- Auth locale interdite: l'identite vient de Traefik ForwardAuth.
- Tous les endpoints metier doivent dependre de `get_current_user`.
- Endpoints debug actifs uniquement hors production (`API_DEBUG=true`).
- CSRF active en production pour `POST/PUT/PATCH/DELETE` via `X-CSRF-Token`.
- RLS non imposee par la starter (decision produit): acces gere par hub auth + backend.
- Les placeholders (`__APP_*__`, `FRONTEND_BASE_PATH`) doivent etre remplaces avant deploiement.

## Base de donnees demo (PLACEHOLDER)

> **Ces elements sont des placeholders a renommer obligatoirement** lors du clonage
> du starter vers une nouvelle app.

Le starter inclut un schema et un CRUD de demonstration :

| Element | Valeur placeholder | A remplacer par |
|---|---|---|
| Schema Postgres | `app_starter` | `app_<votre_slug>` |
| Table principale | `items` | `<votre_entite>` |
| Route backend | `/v1/items` | `/v1/<votre_slug>/<entite>` |
| Page frontend | `/items` | `/<entite>` |
| Fichier migration | `20260220000000_app_starter_demo.sql` | `<timestamp>_<app_slug>_schema.sql` |
| Fichier seed | `005_app_starter.sql` | `<N>_<app_slug>.sql` |

### Structure CRUD incluse

```
backend/features/items/
  __init__.py
  schemas.py   ← ItemOut, ItemCreate, ItemUpdate, ItemsListResponse
  endpoints.py ← GET/POST /v1/items, GET/PATCH/DELETE /v1/items/{id}
frontend/src/pages/Items.tsx        ← page liste + creation + edition inline
frontend/src/services/api.ts        ← itemsApi (list, get, create, update, remove)
supabase/migrations/20260220000000_app_starter_demo.sql
supabase/seeds/005_app_starter.sql  ← 4 items de demonstration
```

### Checklist migration schema

1. Renommer le schema dans `supabase/migrations/<ts>_<slug>_schema.sql`
2. Mettre a jour `supabase/config.toml` → `api.schemas` (remplacer `app_starter`)
3. Renommer `_SCHEMA` et `_TABLE` dans `backend/features/items/endpoints.py`
4. Renommer les types dans `backend/features/items/schemas.py`
5. Renommer `itemsApi` dans `frontend/src/services/api.ts`
6. Renommer la page `Items.tsx` et la route dans `App.tsx`
7. Mettre a jour la nav dans `config/nav.ts`

### RLS

RLS non activee par defaut (conforme `RULES.md`) : l'acces est controle par
ForwardAuth Traefik + les verifications backend (`Depends(get_current_user)`).

## Integration hub + Supabase

Variables minimales:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Metadonnees app attendues dans `public.apps`:

- `name`
- `link` (`https://<domain>/<slug>`)
- `docker_service_name` (`<slug>-frontend`)
- `icon_url` (image URL, chemin, data URI ou emoji/glyphe)

Endpoint backend de shell:

- `GET /v1/starter/app-shell`
- Priorite de resolution:
1. `public.apps.link` (avec/sans slash final)
2. `public.apps.docker_service_name`
3. `public.apps.name`
- Fallback: `APP_NAME` + icone par defaut cote frontend.

## Frontend shell: logo, user, navigation

- `MainLayout.tsx` charge:
1. `GET /v1/starter/me` pour l'utilisateur courant
2. `GET /v1/starter/app-shell` pour `app_name` + `icon_url`
- Le logo n'utilise plus l'initiale de l'app.
- `icon_url`:
1. rendu image si URL/chemin/data URI
2. sinon rendu texte (ex: emoji)
3. fallback visuel `puzzle`

## Checklist pour creer une nouvelle app

1. Copier `apps/App-Starter` vers `apps/<NewApp>`.
2. Remplacer toutes les valeurs placeholder de `.env`.
3. Verifier `APP_SLUG` et `FRONTEND_BASE_PATH` (pas de valeur par defaut).
4. Enregistrer l'app dans la base hub:
   - `./scripts/create_app.sh "<Nom>" "<Description>" "<URL>" "<service-frontend>" "<icon>"`
5. Donner les droits:
   - `./scripts/grant_app_to_all_users.sh "<Nom>"`
6. Lancer:
   - `docker compose -f apps/<NewApp>/docker-compose.yml up -d --build`

## Runbook rapide

```bash
cp apps/App-Starter/.env.example apps/App-Starter/.env
docker compose -f apps/App-Starter/docker-compose.yml up -d --build
docker compose -f apps/App-Starter/docker-compose.yml logs -f app-starter-backend
docker compose -f apps/App-Starter/docker-compose.yml logs -f app-starter-frontend
```

## Troubleshooting

`icon_url` ne s'affiche pas:

1. Verifier `GET /v1/starter/app-shell` retourne bien `icon_url`.
2. Verifier la ligne `public.apps` (link, docker_service_name, name).
3. Rebuild frontend si ancien bundle en cache:
   - `docker compose -f apps/App-Starter/docker-compose.yml up -d --build`

Email user vide:

1. Verifier les headers Traefik: `X-User-Email`, `X-Forwarded-User`.
2. Verifier `GET /v1/starter/me`.

## Documentation de passation

- Regles projet: `apps/App-Starter/RULES.md`
- Handoff agent AI: `apps/App-Starter/docs/AI-HANDOFF.md`
