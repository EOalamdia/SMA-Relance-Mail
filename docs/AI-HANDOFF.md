# AI Handoff — SMA (Systeme de Management Automatique)

Ce document sert de memo operationnel pour tout agent AI qui reprend `apps/SMA`.

## 1. Intent produit

- Application de relance automatique de formations (remplace logique Excel).
- Pipeline : referentiels → echeances → relances → envoi email.
- `training_due_items` est l'objet metier central.
- Les relances sont derivees de `due_items + reminder_rules actives`.

## 2. Invariants critiques

### Auth et securite

- Auth centralisee par Traefik ForwardAuth (`X-User-Id`, `X-User-Email` headers).
- Pas de formulaire de login local.
- Tous les endpoints metier passent par `Depends(get_current_user)`.
- Endpoints debug uniquement en dev (`API_DEBUG=true`).
- CSRF active en production pour les requetes mutantes.

### Donnees et acces

- Schema `sma_relance` — 11 tables, 4 vues, 6 enums.
- RLS non activee — acces controle par hub auth + backend.
- Soft delete via `archived_at` sur tables de reference.
- Idempotence SHA256 pour les reminder_jobs.

### UI framework

- Source unique UI: `apps/SMA/frontend/packages/ui-*`.
- Ne pas dupliquer des composants generiques dans `src/components`.

## 3. Architecture backend

### Modules (sous `backend/features/`)

| Module | Prefix API | Pattern |
|---|---|---|
| `organization_types` | `/v1/organization-types` | CRUD + soft delete |
| `organizations` | `/v1/organizations` | CRUD + soft delete + type filter |
| `contacts` | `/v1/contacts` | CRUD + org filter + is_primary |
| `training_courses` | `/v1/training-courses` | CRUD + soft delete |
| `course_applicability` | `/v1/course-applicability` | Create/List/Delete |
| `training_sessions` | `/v1/training-sessions` | CRUD + org/course filters |
| `due_items` | `/v1/due-items` | List/Compute/Close + `service.py` |
| `reminder_rules` | `/v1/reminder-rules` | CRUD + soft delete |
| `email_templates` | `/v1/email-templates` | CRUD + soft delete |
| `reminder_jobs` | `/v1/reminder-jobs` | List/Generate/Send/Cancel + `service.py` |
| `email_deliveries` | `/v1/email-deliveries` | Read-only |
| `dashboard` | `/v1/dashboard/*` | 5 endpoints (summary, radar, coverage, upcoming, overdue) |

### Services critiques

- `due_items/service.py` — §6.1 : derive due_date/status depuis sessions + courses, upsert idempotent.
- `reminder_jobs/service.py` — §6.2 : SHA256 idempotency_key, generate + send_pending.
- `core/email_sender.py` — §6.3 : SMTP Gmail, template `{{var}}` rendering, delivery logging, log-only fallback.

### Acces DB

```python
from core.supabase import get_schema_table
table = get_schema_table("sma_relance", "table_name")
```

## 4. Architecture frontend

### Pages (sous `frontend/src/pages/`)

Dashboard, OrganizationTypes, Organizations, Contacts, TrainingCourses,
CourseApplicability, TrainingSessions, DueItems, ReminderRules, EmailTemplates,
ReminderJobs, EmailDeliveries, Home.

### API client (`services/api.ts`)

API objects : organizationTypesApi, organizationsApi, contactsApi,
trainingCoursesApi, courseApplicabilityApi, trainingSessionsApi, dueItemsApi,
reminderRulesApi, emailTemplatesApi, reminderJobsApi, emailDeliveriesApi,
dashboardApi.

### Types (`types/sma.ts`)

Toutes les interfaces TypeScript pour les entites, enums, et vues dashboard.

### Navigation (`config/nav.ts`)

5 sections : Accueil, Referentiels, Formation, Relances, Parametrage.

## 5. Scheduler (`scheduler/`)

Container Docker independant, 3 threads daemon :
- **compute** : `POST /v1/due-items/compute` a 06h00
- **generate** : `POST /v1/reminder-jobs/generate` a 06h30
- **send** : `POST /v1/reminder-jobs/send-pending` toutes les 15min

## 6. Contrat "App Shell"

- `GET /v1/starter/app-shell` retourne `app_name` + `icon_url`.
- `GET /v1/starter/me` retourne user info.
- Le frontend affiche image si URL, glyphe si texte, fallback `puzzle`.

## 7. Procedure de reprise recommandee

1. Lire `apps/SMA/README.md` puis `apps/SMA/RULES.md`.
2. Verifier l'etat courant : `git -C apps/SMA status --short`
3. Verifier contrats backend : `GET /health`, `GET /v1/starter/me`
4. Verifier le dashboard : `GET /v1/dashboard/summary`
5. Si doute : `docker compose -f apps/SMA/docker-compose.yml up -d --build`

## 8. Checklist avant livraison

- Aucune regression sur auth headers et endpoints non-prod.
- README + RULES + ce document sont a jour.
- Les variables SMTP sont configurees dans `.env` (ou log-only mode actif).
- Le scheduler demarre correctement et atteint le backend.
- Les 4 vues SQL retournent des donnees coherentes apres compute.

## 9. Decisions prises

- Schema `sma_relance` (pas `app_sma`) — choix utilisateur.
- Pas de table `employees` ni `training_attendees` au MVP.
- Email via Gmail SMTP avec fallback log-only.
- Scheduler par container cron (pas Celery/APScheduler).
- RBAC simple via ForwardAuth (pas de roles granulaires).
