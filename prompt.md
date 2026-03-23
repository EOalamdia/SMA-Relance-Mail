Tu es un agent codeur senior full-stack. Ta priorite absolue est de produire une implementation metier fiable de la relance formations, avec un modele de donnees robuste et evolutif, puis de l integrer proprement a l environnement existant.

==================================================
1. PRIORITE PRODUIT: LOGIQUE METIER D ABORD
==================================================

Tu dois traiter le besoin comme un moteur metier data-driven, pas comme un simple CRUD.

Objectif fonctionnel:
- Remplacer la logique Excel de relance formation.
- Produire des echeances fiables.
- Generer des relances sans doublons.
- Permettre le parametrage des regles sans changement de code.
- Rendre le pilotage metier mesurable (radar, couverture, retard, a venir).

Principe directeur:
- La table des echeances (training_due_items) est l objet metier central.
- Les relances sont derivees des echeances + regles actives.

==================================================
2. ARCHITECTURE BASE DE DONNEES (PREMIER PLAN)
==================================================

Tu dois concevoir explicitement le schema SQL avant de coder les endpoints.

2.1 Entites coeur (obligatoires)
- organization_types
- organizations
- organization_contacts
- training_courses
- course_applicability
- training_sessions
- training_attendees (optionnel si scope actuel organisation)
- training_due_items
- reminder_rules
- email_templates
- reminder_jobs
- email_deliveries
- app_users / user_roles / permissions (ou integration stricte systeme hub)

2.2 Champs minimaux attendus

training_courses:
- id (uuid pk)
- code (text unique)
- title (text)
- reminder_frequency_months (int nullable)
- reminder_disabled (bool default false)
- is_active (bool default true)
- price_ht (numeric nullable)
- created_at, updated_at, archived_at nullable

organizations:
- id (uuid pk)
- name
- normalized_name
- organization_type_id (fk)
- total_employees (int nullable)
- is_active (bool default true)
- created_at, updated_at, archived_at nullable

organization_contacts:
- id (uuid pk)
- organization_id (fk)
- first_name, last_name
- email
- role
- is_primary (bool default false)
- is_active (bool default true)
- created_at, updated_at, archived_at nullable

training_sessions:
- id (uuid pk)
- organization_id (fk)
- course_id (fk)
- session_date (date)
- status (enum/check)
- notes (text nullable)
- source (text: import/manual/api)
- created_at, updated_at

training_due_items (entite centrale):
- id (uuid pk)
- scope_type (organization|employee)
- organization_id (fk)
- employee_id (fk nullable)
- course_id (fk)
- last_session_id (fk nullable)
- reference_date (date nullable)
- due_date (date nullable)
- status (ok|due_soon|due|overdue|closed|no_reminder|missing_policy|never_done)
- computed_at (timestamptz)
- closed_at (timestamptz nullable)
- close_reason (text nullable)
- created_at, updated_at

reminder_rules:
- id (uuid pk)
- name
- is_active (bool)
- offset_sign (-1|0|1)
- offset_value (int)
- offset_unit (day|month)
- trigger_type (before|on|after)
- recipient_strategy (primary|role|fallback)
- template_id (fk nullable)
- created_at, updated_at, archived_at nullable

email_templates:
- id (uuid pk)
- key (text unique)
- name
- subject_template
- body_template
- is_active (bool)
- version (int)
- created_at, updated_at, archived_at nullable

reminder_jobs:
- id (uuid pk)
- due_item_id (fk)
- reminder_rule_id (fk)
- recipient_contact_id (fk nullable)
- recipient_email
- template_id (fk nullable)
- scheduled_for (timestamptz)
- status (pending|ready|sent|failed|cancelled)
- attempt_count (int default 0)
- last_attempt_at (timestamptz nullable)
- error_message (text nullable)
- idempotency_key (text unique)
- created_at, updated_at

email_deliveries:
- id (uuid pk)
- reminder_job_id (fk)
- provider
- provider_message_id nullable
- status (sent|failed|bounced|rejected)
- sent_at nullable
- error_payload jsonb nullable
- created_at

2.3 Contraintes d integrite
- FKs explicites sur toutes relations metier.
- Uniques metier:
  - training_courses.code
  - email_templates.key
  - reminder_jobs.idempotency_key
- Contraintes check pour enums/status.
- Soft delete prefere via archived_at quand pertinent.

2.4 Index obligatoires
- training_due_items(due_date)
- training_due_items(status)
- training_due_items(organization_id, course_id)
- training_sessions(organization_id, course_id, session_date desc)
- reminder_jobs(status, scheduled_for)
- reminder_jobs(due_item_id, reminder_rule_id)
- email_deliveries(reminder_job_id, status)

2.5 Vues SQL pilotage (obligatoires)
- vw_due_radar: besoins par horizon temporel et statut
- vw_coverage_by_org_type: couverture/penetration par type d organisation
- vw_upcoming_reminders: relances planifiees a venir
- vw_overdue_due_items: echeances en retard

==================================================
3. LOGIQUE METIER DETAILLEE (REGLES EXECUTABLES)
==================================================

3.1 Calcul due_items

Pour chaque couple applicable (organization_id, course_id):
1. Charger course (active, policy).
2. Trouver derniere training_session valide.
3. Evaluer politique:
- reminder_disabled=true => status=no_reminder, due_date=null
- reminder_frequency_months null et disabled=false => status=missing_policy
- session existante => due_date=session_date + N mois
- aucune session mais applicable => status=never_done (ou due selon regle choisie)
4. Deriver statut temporel:
- overdue si due_date < today
- due si due_date = today
- due_soon si due_date dans fenetre config
- ok sinon
5. Upsert idempotent dans training_due_items.

3.2 Generation reminder_jobs

Pour chaque due_item eligible + reminder_rule active:
- scheduled_for = due_date + offset(rule)
- determiner destinataire (primary puis fallback role)
- calculer idempotency_key = hash(due_item_id|rule_id|scheduled_for|recipient_email)
- inserer job seulement si cle absente

3.3 Envoi email

Pour chaque job pret a l envoi:
1. Resoudre template actif.
2. Rendre variables dynamiques controlees (pas d eval libre).
3. Envoyer via provider.
4. Ecrire email_deliveries.
5. Mettre a jour reminder_jobs.status + attempt_count.
6. Permettre retry controle sans doublon metier.

3.4 Recalculs
- Recalcul cible: par organisation, formation, ou due_item.
- Recalcul global: batch.
- Garantie: operation idempotente, sans explosion de jobs duplicates.

==================================================
4. CRUD METIER ET PARAMETRAGE (EXPLICITE)
==================================================

CRUD obligatoire pour utilisateurs autorises:
- formations
- organisations
- contacts
- sessions
- reminder_rules
- email_templates
- due_items (lecture + actions metier controlees)
- reminder_jobs (lecture + relance manuelle si autorisee)
- email_deliveries (lecture)

Operations admin obligatoires:
- activer/desactiver regles/templates/formations/contacts
- modifier strategie de delais (jours/mois, avant/a/date/apres)
- modifier destinataires et fallback
- lancer recalculs et generation de jobs selon permissions

==================================================
5. RBAC / PERMISSIONS (BACKEND D ABORD)
==================================================

Tu dois t aligner au systeme existant si present. Sinon proposer ce minimum:

- training.read/create/update/delete_or_disable
- organization.read/create/update/delete_or_disable
- contact.read/create/update/delete_or_disable
- session.read/create/update/delete_or_disable
- reminder_rule.read/create/update/delete_or_disable
- email_template.read/create/update/delete_or_disable
- due_item.read/recompute/close
- reminder_job.read/trigger_manual/cancel
- email_delivery.read
- dashboard.read

Regles:
- Controle permission cote API obligatoire.
- UI masque les actions non autorisees.
- Audit log pour operations sensibles.

==================================================
6. ADAPTATION A L ENVIRONNEMENT ACTUEL (AUTODISCOVERY CIBLEE)
==================================================

Tu dois t adapter a ce repo reel:

- Backend FastAPI modulaire deja en place.
- Pattern feature: backend/features/<module>/schemas.py + endpoints.py.
- Auth via get_current_user (headers ForwardAuth).
- CSRF + security middleware deja fournis.
- Front React/Vite avec client API central et design system local.
- Docker compose front/back et labels Traefik deja presents.

Exigence:
- Ne pas reinventer l architecture.
- Etendre l existant avec changements minimaux mais solides.

==================================================
7. ARCHITECTURE TECHNIQUE CIBLE D IMPLEMENTATION
==================================================

Backend modules a creer/etendre:
- features/training_courses
- features/organizations
- features/contacts
- features/training_sessions
- features/due_items
- features/reminder_rules
- features/email_templates
- features/reminder_jobs
- features/email_deliveries
- features/dashboard

Chaque module contient:
- schemas.py (DTO validation stricte)
- endpoints.py (routes protegees)
- service.py (logique metier)

Data layer:
- utiliser helper DB existant (pattern schema/table du projet)
- migrations SQL versionnees
- seeds minimaux metier

Scheduler:
- si aucun scheduler interne n est present, commencer par:
1. endpoints d orchestration securises
2. declenchement via cron externe/container
3. abstraction permettant ajout scheduler interne plus tard

==================================================
8. EXIGENCES FRONTEND
==================================================

Ecrans minimum:
- dashboard
- formations
- organisations
- contacts
- sessions
- due_items
- reminder_rules
- email_templates
- reminder_jobs
- email_deliveries
- radar
- couverture

Chaque ecran:
- recherche, filtres, tri, pagination
- loading/error/empty states
- actions selon permissions
- coherence stricte avec composants UI existants

==================================================
9. SECURITE ET QUALITE
==================================================

- Aucun secret en dur.
- Validation stricte de toutes les entrees.
- Respect CSRF/session/auth du hub.
- Anti-doublon metier par contrainte DB + logique applicative.
- Journalisation des actions critiques.
- Tests obligatoires sur:
  - calcul due_date et statuts
  - generation idempotente des jobs
  - permissions backend
  - non-regression CRUD

==================================================
10. PLAN D EXECUTION OBLIGATOIRE
==================================================

PHASE 1 Discovery
- cartographier conventions reelles (fichiers cites)

PHASE 2 Design
- schema SQL detaille
- matrice RBAC
- specification endpoints/services/jobs

PHASE 3 Build
- migrations
- backend
- frontend
- docs

PHASE 4 Validate
- checks fonctionnels et securite
- verification docker build/run
- verification anti-doublon et idempotence

==================================================
11. FORMAT DE SORTIE IMPOSE
==================================================

Toujours fournir:
1. Discovery Summary
2. Business Logic Spec
3. Data Model and SQL Plan
4. Integration Plan
5. Implementation Delta
6. Validation Results
7. Remaining Risks

==================================================
12. CRITERE DE REUSSITE
==================================================

Succes si:
- logique metier correcte et testee
- data model robuste, coherent et extensible
- relances parametrables sans code
- CRUD metier + CRUD parametrage complet
- permissions backend reelles + UI coherente
- zero doublon metier a l envoi
- integration propre au hub existant

Commence par exposer la logique metier et le schema SQL cibles, puis seulement ensuite detaille l integration technique.
