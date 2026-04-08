-- ============================================================================
-- Migration: sma_relance schema
-- Application de relance automatique de formations
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sma_relance;

-- ============================================================================
-- 1. organization_types
-- ============================================================================

CREATE TABLE sma_relance.organization_types (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    description text,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz
);

CREATE INDEX idx_org_types_active ON sma_relance.organization_types (is_active) WHERE archived_at IS NULL;

-- ============================================================================
-- 2. organizations
-- ============================================================================

CREATE TABLE sma_relance.organizations (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 text NOT NULL,
    normalized_name      text GENERATED ALWAYS AS (lower(trim(name))) STORED,
    organization_type_id uuid REFERENCES sma_relance.organization_types(id),
    total_employees      int,
    is_active            boolean NOT NULL DEFAULT true,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    archived_at          timestamptz
);

CREATE INDEX idx_orgs_type      ON sma_relance.organizations (organization_type_id);
CREATE INDEX idx_orgs_active    ON sma_relance.organizations (is_active) WHERE archived_at IS NULL;
CREATE INDEX idx_orgs_norm_name ON sma_relance.organizations (normalized_name);

-- ============================================================================
-- 3. organization_contacts
-- ============================================================================

CREATE TABLE sma_relance.organization_contacts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES sma_relance.organizations(id),
    first_name      text NOT NULL,
    last_name       text NOT NULL,
    email           text NOT NULL,
    role            text,
    is_primary      boolean NOT NULL DEFAULT false,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    archived_at     timestamptz
);

CREATE INDEX idx_contacts_org     ON sma_relance.organization_contacts (organization_id);
CREATE INDEX idx_contacts_primary ON sma_relance.organization_contacts (organization_id) WHERE is_primary = true AND archived_at IS NULL;
CREATE INDEX idx_contacts_email   ON sma_relance.organization_contacts (email);

-- ============================================================================
-- 4. training_courses
-- ============================================================================

CREATE TABLE sma_relance.training_courses (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code                      text NOT NULL UNIQUE,
    title                     text NOT NULL,
    reminder_frequency_months int,
    reminder_disabled         boolean NOT NULL DEFAULT false,
    is_active                 boolean NOT NULL DEFAULT true,
    price_ht                  numeric,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    archived_at               timestamptz
);

CREATE INDEX idx_courses_active ON sma_relance.training_courses (is_active) WHERE archived_at IS NULL;
CREATE INDEX idx_courses_code   ON sma_relance.training_courses (code);

-- ============================================================================
-- 5. course_applicability
-- ============================================================================

CREATE TABLE sma_relance.course_applicability (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES sma_relance.organizations(id),
    course_id       uuid NOT NULL REFERENCES sma_relance.training_courses(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, course_id)
);

CREATE INDEX idx_applicability_org    ON sma_relance.course_applicability (organization_id);
CREATE INDEX idx_applicability_course ON sma_relance.course_applicability (course_id);

-- ============================================================================
-- 6. training_sessions
-- ============================================================================

CREATE TYPE sma_relance.session_status AS ENUM ('planned', 'completed', 'cancelled');
CREATE TYPE sma_relance.session_source AS ENUM ('manual', 'import');

CREATE TABLE sma_relance.training_sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES sma_relance.organizations(id),
    course_id       uuid NOT NULL REFERENCES sma_relance.training_courses(id),
    session_date    date NOT NULL,
    status          sma_relance.session_status NOT NULL DEFAULT 'completed',
    source          sma_relance.session_source NOT NULL DEFAULT 'manual',
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_org_course_date ON sma_relance.training_sessions (organization_id, course_id, session_date DESC);
CREATE INDEX idx_sessions_status          ON sma_relance.training_sessions (status);

-- ============================================================================
-- 7. training_due_items (entite centrale)
-- ============================================================================

CREATE TYPE sma_relance.scope_type AS ENUM ('organization', 'employee');
CREATE TYPE sma_relance.due_status AS ENUM (
    'ok', 'due_soon', 'due', 'overdue', 'closed', 'no_reminder', 'missing_policy', 'never_done'
);

CREATE TABLE sma_relance.training_due_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type      sma_relance.scope_type NOT NULL DEFAULT 'organization',
    organization_id uuid NOT NULL REFERENCES sma_relance.organizations(id),
    employee_id     uuid,
    course_id       uuid NOT NULL REFERENCES sma_relance.training_courses(id),
    last_session_id uuid REFERENCES sma_relance.training_sessions(id),
    reference_date  date,
    due_date        date,
    status          sma_relance.due_status NOT NULL DEFAULT 'ok',
    computed_at     timestamptz NOT NULL DEFAULT now(),
    closed_at       timestamptz,
    close_reason    text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, course_id, scope_type)
);

CREATE INDEX idx_due_items_due_date   ON sma_relance.training_due_items (due_date);
CREATE INDEX idx_due_items_status     ON sma_relance.training_due_items (status);
CREATE INDEX idx_due_items_org_course ON sma_relance.training_due_items (organization_id, course_id);

-- ============================================================================
-- 8. reminder_rules
-- ============================================================================

CREATE TYPE sma_relance.offset_unit AS ENUM ('day', 'month');
CREATE TYPE sma_relance.trigger_type AS ENUM ('before', 'on', 'after');
CREATE TYPE sma_relance.recipient_strategy AS ENUM ('primary', 'role', 'fallback');

CREATE TABLE sma_relance.reminder_rules (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    offset_sign         int NOT NULL CHECK (offset_sign IN (-1, 0, 1)),
    offset_value        int NOT NULL CHECK (offset_value >= 0),
    offset_unit         sma_relance.offset_unit NOT NULL DEFAULT 'day',
    trigger_type        sma_relance.trigger_type NOT NULL DEFAULT 'before',
    recipient_strategy  sma_relance.recipient_strategy NOT NULL DEFAULT 'primary',
    template_id         uuid,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    archived_at         timestamptz
);

CREATE INDEX idx_rules_active ON sma_relance.reminder_rules (is_active) WHERE archived_at IS NULL;

-- ============================================================================
-- 9. email_templates
-- ============================================================================

CREATE TABLE sma_relance.email_templates (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key              text NOT NULL UNIQUE,
    name             text NOT NULL,
    subject_template text NOT NULL,
    body_template    text NOT NULL,
    is_active        boolean NOT NULL DEFAULT true,
    version          int NOT NULL DEFAULT 1,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    archived_at      timestamptz
);

CREATE INDEX idx_templates_active ON sma_relance.email_templates (is_active) WHERE archived_at IS NULL;

-- FK de reminder_rules.template_id vers email_templates (ajout apres creation des 2 tables)
ALTER TABLE sma_relance.reminder_rules
    ADD CONSTRAINT fk_rules_template FOREIGN KEY (template_id) REFERENCES sma_relance.email_templates(id);

-- ============================================================================
-- 10. reminder_jobs
-- ============================================================================

CREATE TYPE sma_relance.job_status AS ENUM ('pending', 'ready', 'sent', 'failed', 'cancelled');

CREATE TABLE sma_relance.reminder_jobs (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    due_item_id          uuid NOT NULL REFERENCES sma_relance.training_due_items(id),
    reminder_rule_id     uuid NOT NULL REFERENCES sma_relance.reminder_rules(id),
    recipient_contact_id uuid REFERENCES sma_relance.organization_contacts(id),
    recipient_email      text NOT NULL,
    template_id          uuid REFERENCES sma_relance.email_templates(id),
    scheduled_for        timestamptz NOT NULL,
    status               sma_relance.job_status NOT NULL DEFAULT 'pending',
    attempt_count        int NOT NULL DEFAULT 0,
    last_attempt_at      timestamptz,
    error_message        text,
    idempotency_key      text NOT NULL UNIQUE,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status_sched   ON sma_relance.reminder_jobs (status, scheduled_for);
CREATE INDEX idx_jobs_due_rule       ON sma_relance.reminder_jobs (due_item_id, reminder_rule_id);
CREATE INDEX idx_jobs_idempotency    ON sma_relance.reminder_jobs (idempotency_key);

-- ============================================================================
-- 11. email_deliveries
-- ============================================================================

CREATE TYPE sma_relance.delivery_status AS ENUM ('sent', 'failed', 'bounced', 'rejected');

CREATE TABLE sma_relance.email_deliveries (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_job_id     uuid NOT NULL REFERENCES sma_relance.reminder_jobs(id),
    provider            text NOT NULL,
    provider_message_id text,
    status              sma_relance.delivery_status NOT NULL,
    sent_at             timestamptz,
    error_payload       jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_job_status ON sma_relance.email_deliveries (reminder_job_id, status);

-- ============================================================================
-- Triggers: updated_at automatique
-- ============================================================================

CREATE OR REPLACE FUNCTION sma_relance.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'organization_types', 'organizations', 'organization_contacts',
            'training_courses', 'training_sessions', 'training_due_items',
            'reminder_rules', 'email_templates', 'reminder_jobs'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON sma_relance.%I FOR EACH ROW EXECUTE FUNCTION sma_relance.set_updated_at()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================================
-- 12. unsubscribe + communication topics
-- ============================================================================

CREATE TABLE IF NOT EXISTS sma_relance.communication_topics (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code              text NOT NULL UNIQUE,
    label             text NOT NULL,
    description       text,
    is_unsubscribable boolean NOT NULL DEFAULT true,
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_topics_code
    ON sma_relance.communication_topics (code);

CREATE INDEX IF NOT EXISTS idx_comm_topics_active
    ON sma_relance.communication_topics (is_active);

DO $$
BEGIN
    IF to_regproc('sma_relance.set_updated_at') IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_communication_topics_updated_at'
              AND tgrelid = 'sma_relance.communication_topics'::regclass
        ) THEN
            EXECUTE '
                CREATE TRIGGER trg_communication_topics_updated_at
                BEFORE UPDATE ON sma_relance.communication_topics
                FOR EACH ROW
                EXECUTE FUNCTION sma_relance.set_updated_at()
            ';
        END IF;
    END IF;
END;
$$;

INSERT INTO sma_relance.communication_topics (id, code, label, description, is_unsubscribable, is_active)
VALUES
    ('30000001-0000-0000-0000-000000000001', 'training_reminders',   'Relances formations',             'Emails automatiques de rappel de formations a echeance.', true,  true),
    ('30000001-0000-0000-0000-000000000002', 'training_campaigns',   'Campagnes formations',            'Campagnes de sensibilisation / relance commerciale.',       true,  true),
    ('30000001-0000-0000-0000-000000000003', 'newsletters',          'Newsletters',                     'Newsletters informatives.',                                true,  true),
    ('30000001-0000-0000-0000-000000000004', 'transactional_notice', 'Notifications transactionnelles', 'Messages transactionnels obligatoires (confirmations).',   false, true)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'sma_relance' AND t.typname = 'unsub_scope_type'
    ) THEN
        CREATE TYPE sma_relance.unsub_scope_type AS ENUM ('global', 'topic', 'organization', 'campaign');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'sma_relance' AND t.typname = 'unsub_source'
    ) THEN
        CREATE TYPE sma_relance.unsub_source AS ENUM ('link_click', 'admin', 'import', 'api', 'manual', 'one_click_header');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'sma_relance' AND t.typname = 'unsub_event_type'
    ) THEN
        CREATE TYPE sma_relance.unsub_event_type AS ENUM (
            'unsubscribe_clicked',
            'unsubscribe_confirmed',
            'unsubscribe_already_done',
            'resubscribe',
            'admin_override'
        );
    END IF;
END;
$$;

ALTER TABLE sma_relance.email_templates
    ADD COLUMN IF NOT EXISTS communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    ADD COLUMN IF NOT EXISTS include_unsubscribe_link boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS unsubscribe_footer_variant text;

ALTER TABLE sma_relance.reminder_jobs
    ADD COLUMN IF NOT EXISTS communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    ADD COLUMN IF NOT EXISTS unsubscribe_token_id uuid,
    ADD COLUMN IF NOT EXISTS unsubscribable boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS recipient_email_normalized text,
    ADD COLUMN IF NOT EXISTS skipped_reason text;

ALTER TABLE sma_relance.email_deliveries
    ADD COLUMN IF NOT EXISTS communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    ADD COLUMN IF NOT EXISTS unsubscribe_link_rendered boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS unsubscribe_link_clicked_at timestamptz;

CREATE TABLE IF NOT EXISTS sma_relance.email_subscriptions (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id             uuid REFERENCES sma_relance.organization_contacts(id),
    email_normalized       text NOT NULL,
    email_hash             text NOT NULL,
    communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    scope_type             sma_relance.unsub_scope_type NOT NULL DEFAULT 'global',
    organization_id        uuid REFERENCES sma_relance.organizations(id),
    is_subscribed          boolean NOT NULL DEFAULT true,
    unsubscribed_at        timestamptz,
    unsubscribed_reason    text,
    source                 sma_relance.unsub_source,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sma_relance.unsubscribe_tokens (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash             text NOT NULL UNIQUE,
    contact_id             uuid REFERENCES sma_relance.organization_contacts(id),
    email_normalized       text NOT NULL,
    communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    reminder_job_id        uuid REFERENCES sma_relance.reminder_jobs(id),
    expires_at             timestamptz,
    used_at                timestamptz,
    revoked_at             timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sma_relance.unsubscribe_events (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id        uuid REFERENCES sma_relance.email_subscriptions(id),
    contact_id             uuid REFERENCES sma_relance.organization_contacts(id),
    email_normalized       text NOT NULL,
    email_hash             text NOT NULL,
    communication_topic_id uuid REFERENCES sma_relance.communication_topics(id),
    event_type             sma_relance.unsub_event_type NOT NULL,
    source                 sma_relance.unsub_source NOT NULL DEFAULT 'link_click',
    ip_address             text,
    user_agent             text,
    metadata               jsonb,
    created_at             timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'sma_relance' AND c.conname = 'fk_jobs_unsub_token'
    ) THEN
        ALTER TABLE sma_relance.reminder_jobs
            ADD CONSTRAINT fk_jobs_unsub_token
            FOREIGN KEY (unsubscribe_token_id)
            REFERENCES sma_relance.unsubscribe_tokens(id);
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_subs_unique
    ON sma_relance.email_subscriptions (
        email_hash,
        COALESCE(communication_topic_id, '00000000-0000-0000-0000-000000000000'::uuid),
        scope_type,
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

CREATE INDEX IF NOT EXISTS idx_email_subs_hash
    ON sma_relance.email_subscriptions (email_hash);

CREATE INDEX IF NOT EXISTS idx_email_subs_contact
    ON sma_relance.email_subscriptions (contact_id);

CREATE INDEX IF NOT EXISTS idx_email_subs_topic
    ON sma_relance.email_subscriptions (communication_topic_id);

CREATE INDEX IF NOT EXISTS idx_email_subs_subscribed
    ON sma_relance.email_subscriptions (is_subscribed)
    WHERE is_subscribed = false;

CREATE INDEX IF NOT EXISTS idx_unsub_tokens_hash
    ON sma_relance.unsubscribe_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_unsub_tokens_expires
    ON sma_relance.unsubscribe_tokens (expires_at)
    WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_unsub_events_email
    ON sma_relance.unsubscribe_events (email_hash);

CREATE INDEX IF NOT EXISTS idx_unsub_events_type
    ON sma_relance.unsubscribe_events (event_type);

CREATE INDEX IF NOT EXISTS idx_unsub_events_date
    ON sma_relance.unsubscribe_events (created_at);

DO $$
BEGIN
    IF to_regproc('sma_relance.set_updated_at') IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_email_subscriptions_updated_at'
              AND tgrelid = 'sma_relance.email_subscriptions'::regclass
        ) THEN
            EXECUTE '
                CREATE TRIGGER trg_email_subscriptions_updated_at
                BEFORE UPDATE ON sma_relance.email_subscriptions
                FOR EACH ROW
                EXECUTE FUNCTION sma_relance.set_updated_at()
            ';
        END IF;
    END IF;
END;
$$;

-- ============================================================================
-- Vues SQL (pilotage)
-- ============================================================================

-- Vue radar : tous les due_items avec infos enrichies
CREATE OR REPLACE VIEW sma_relance.vw_due_radar AS
SELECT
    di.id AS due_item_id,
    di.status,
    di.due_date,
    di.reference_date,
    di.scope_type,
    o.id AS organization_id,
    o.name AS organization_name,
    ot.name AS organization_type,
    c.id AS course_id,
    c.code AS course_code,
    c.title AS course_title,
    c.reminder_frequency_months,
    di.computed_at
FROM sma_relance.training_due_items di
JOIN sma_relance.organizations o ON o.id = di.organization_id
LEFT JOIN sma_relance.organization_types ot ON ot.id = o.organization_type_id
JOIN sma_relance.training_courses c ON c.id = di.course_id
WHERE di.status NOT IN ('closed');

-- Vue couverture par type d'organisation
CREATE OR REPLACE VIEW sma_relance.vw_coverage_by_org_type AS
SELECT
    ot.id AS org_type_id,
    ot.name AS org_type_name,
    count(DISTINCT o.id) AS total_organizations,
    count(DISTINCT ca.id) AS total_applicabilities,
    count(DISTINCT di.id) FILTER (WHERE di.status = 'ok') AS ok_count,
    count(DISTINCT di.id) FILTER (WHERE di.status = 'due_soon') AS due_soon_count,
    count(DISTINCT di.id) FILTER (WHERE di.status IN ('due', 'overdue')) AS overdue_count,
    count(DISTINCT di.id) FILTER (WHERE di.status = 'never_done') AS never_done_count,
    count(DISTINCT di.id) FILTER (WHERE di.status = 'missing_policy') AS missing_policy_count,
    CASE WHEN count(DISTINCT di.id) > 0
        THEN round(100.0 * count(DISTINCT di.id) FILTER (WHERE di.status = 'ok') / count(DISTINCT di.id), 1)
        ELSE 0
    END AS coverage_pct
FROM sma_relance.organization_types ot
LEFT JOIN sma_relance.organizations o ON o.organization_type_id = ot.id AND o.archived_at IS NULL
LEFT JOIN sma_relance.course_applicability ca ON ca.organization_id = o.id
LEFT JOIN sma_relance.training_due_items di ON di.organization_id = o.id AND di.course_id = ca.course_id
WHERE ot.archived_at IS NULL
GROUP BY ot.id, ot.name;

-- Vue relances a venir (30 prochains jours)
CREATE OR REPLACE VIEW sma_relance.vw_upcoming_reminders AS
SELECT
    rj.id AS job_id,
    rj.status AS job_status,
    rj.scheduled_for,
    rj.recipient_email,
    rr.name AS rule_name,
    di.due_date,
    di.status AS due_status,
    o.name AS organization_name,
    c.title AS course_title,
    et.name AS template_name
FROM sma_relance.reminder_jobs rj
JOIN sma_relance.training_due_items di ON di.id = rj.due_item_id
JOIN sma_relance.reminder_rules rr ON rr.id = rj.reminder_rule_id
JOIN sma_relance.organizations o ON o.id = di.organization_id
JOIN sma_relance.training_courses c ON c.id = di.course_id
LEFT JOIN sma_relance.email_templates et ON et.id = rj.template_id
WHERE rj.status IN ('pending', 'ready')
  AND rj.scheduled_for <= (now() + interval '30 days')
ORDER BY rj.scheduled_for ASC;

-- Vue echeances en retard
CREATE OR REPLACE VIEW sma_relance.vw_overdue_due_items AS
SELECT
    di.id AS due_item_id,
    di.due_date,
    di.status,
    (current_date - di.due_date) AS days_overdue,
    o.id AS organization_id,
    o.name AS organization_name,
    ot.name AS organization_type,
    c.id AS course_id,
    c.code AS course_code,
    c.title AS course_title,
    oc.email AS primary_contact_email,
    oc.first_name AS primary_contact_first_name,
    oc.last_name AS primary_contact_last_name
FROM sma_relance.training_due_items di
JOIN sma_relance.organizations o ON o.id = di.organization_id
LEFT JOIN sma_relance.organization_types ot ON ot.id = o.organization_type_id
JOIN sma_relance.training_courses c ON c.id = di.course_id
LEFT JOIN sma_relance.organization_contacts oc
    ON oc.organization_id = o.id AND oc.is_primary = true AND oc.archived_at IS NULL
WHERE di.status = 'overdue'
ORDER BY di.due_date ASC;

-- ============================================================================
-- Grant usage to authenticator (PostgREST)
-- ============================================================================

GRANT USAGE ON SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA sma_relance TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA sma_relance
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sma_relance
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================================
-- Performance : index trigrammes pour la recherche ILIKE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_sma_org_types_name_trgm
    ON sma_relance.organization_types USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_organizations_name_trgm
    ON sma_relance.organizations USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_contacts_fullname_trgm
    ON sma_relance.organization_contacts USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_contacts_email_trgm
    ON sma_relance.organization_contacts USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_courses_code_trgm
    ON sma_relance.training_courses USING GIN (code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_courses_title_trgm
    ON sma_relance.training_courses USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_reminder_rules_name_trgm
    ON sma_relance.reminder_rules USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_email_templates_name_trgm
    ON sma_relance.email_templates USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_reminder_jobs_email_trgm
    ON sma_relance.reminder_jobs USING GIN (recipient_email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_comm_topics_code_trgm
    ON sma_relance.communication_topics USING GIN (code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sma_comm_topics_label_trgm
    ON sma_relance.communication_topics USING GIN (label gin_trgm_ops);
