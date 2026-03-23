# SMA — Systeme de Management Automatique

Application de relance automatique de formations. Remplace la logique Excel
historique par un pipeline complet : referentiels → echeances → relances → envoi email.

## Scope

- **Backend** FastAPI (schema `sma_relance`, 11 tables, 4 vues SQL).
- **Frontend** React 18 + TypeScript + Vite, 12 pages metier + dashboard.
- **Scheduler** container cron (compute echeances, generation jobs, envoi emails).
- Integration Traefik + Supabase + Docker multi-stage.

## Architecture

```text
apps/SMA/
  backend/
    core/                         # config, auth ForwardAuth, middleware, supabase, csrf, cache, email_sender
    features/
      health/                     # GET /health
      starter/                    # /v1/starter/* (app-shell, me, debug)
      organization_types/         # CRUD /v1/organization-types
      organizations/              # CRUD /v1/organizations
      contacts/                   # CRUD /v1/contacts
      training_courses/           # CRUD /v1/training-courses
      course_applicability/       # Create/List/Delete /v1/course-applicability
      training_sessions/          # CRUD /v1/training-sessions
      due_items/                  # List/Compute/Close /v1/due-items
      reminder_jobs/              # List/Generate/Send/Cancel /v1/reminder-jobs
      reminder_rules/             # CRUD /v1/reminder-rules
      email_templates/            # CRUD /v1/email-templates
      email_deliveries/           # Read-only /v1/email-deliveries
      dashboard/                  # 5 endpoints /v1/dashboard/*
      import_data/                # CSV upload /v1/import/*
    main.py
  frontend/
    packages/
      ui-core/                    # composants UI generiques
      ui-shell/                   # shell applicatif (sidebar, nav, user menu)
      ui-tokens/                  # design tokens + preset tailwind
    src/
      config/nav.ts               # 5 sections: Accueil, Referentiels, Formation, Relances, Parametrage
      pages/                      # 12 pages metier + Home + Dashboard
      services/api.ts             # 13 API objects + apiUpload
      types/sma.ts                # interfaces TypeScript pour toutes les entites
      MainLayout.tsx
  scheduler/
    scheduler.py                  # 3 threads cron (compute 06h, generate 06h30, send 15min)
    Dockerfile
    requirements.txt
  docker-compose.yml
  docs/AI-HANDOFF.md
```

## Schema SQL `sma_relance`

11 tables, 6 enums, 4 vues, trigger `set_updated_at()`.

| Table | Role |
|---|---|
| `organization_types` | Types d'organismes (OPCO, CCI, etc.) |
| `organizations` | Organismes rattaches a un type |
| `organization_contacts` | Contacts email par organisme |
| `training_courses` | Catalogue formations (code, label, validite, renouvellement) |
| `course_applicability` | Lien N-N formation ↔ type d'organisme |
| `training_sessions` | Sessions de formation realisees |
| `training_due_items` | **Objet central** — echeances calculees |
| `reminder_rules` | Regles de relance parametrables (J-30, J-7, J, J+7…) |
| `email_templates` | Templates Jinja with `{{variables}}` |
| `reminder_jobs` | Jobs de relance generes (idempotent via SHA256 key) |
| `email_deliveries` | Log d'envoi email |

Vues: `vw_due_radar`, `vw_coverage_by_org_type`, `vw_upcoming_reminders`, `vw_overdue_due_items`.

Migration: `supabase/migrations/20260323080000_sma_relance.sql`
Seed: `supabase/seeds/010_sma_relance.sql`

## Pipeline metier

1. **Compute** (`POST /v1/due-items/compute`) — dérive les echeances depuis sessions + courses.
2. **Generate** (`POST /v1/reminder-jobs/generate`) — cree les jobs de relance selon les regles actives.
3. **Send** (`POST /v1/reminder-jobs/send-pending`) — envoie les emails via SMTP (ou log si non configure).

Le scheduler execute ce pipeline automatiquement (06h00, 06h30, toutes les 15min).

## Contrats de securite

- Auth via Traefik ForwardAuth (headers `X-User-Id`, `X-User-Email`).
- Tous les endpoints metier dependent de `get_current_user`.
- CSRF active en production pour les requetes mutantes.
- Soft delete via `archived_at` sur les tables de reference.
- Idempotence SHA256 pour les reminder_jobs.
- RLS non activee — acces controle par hub auth + backend.

## Variables d'environnement

Heritees du hub :
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT`
- `CORS_ORIGINS`, `DOMAIN_FRONTEND`, `DOMAIN_API`

Specifiques SMA :
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `SCHEDULER_KEY` (pour auth interne scheduler → backend)

## Integration hub + Supabase

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
