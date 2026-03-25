-- ============================================================================
-- Migration: sma_relance schema (consolidé)
-- Inclut : schéma de base + unsubscribe + course_applicability par org-type
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS sma_relance;

-- ============================================================================
-- ENUMs
-- ============================================================================

CREATE TYPE sma_relance.session_status      AS ENUM ('planned', 'completed', 'cancelled');
CREATE TYPE sma_relance.session_source      AS ENUM ('manual', 'import');
CREATE TYPE sma_relance.scope_type          AS ENUM ('organization', 'employee');
CREATE TYPE sma_relance.due_status          AS ENUM (
    'ok', 'due_soon', 'due', 'overdue', 'closed', 'no_reminder', 'missing_policy', 'never_done'
);
CREATE TYPE sma_relance.offset_unit         AS ENUM ('day', 'month');
CREATE TYPE sma_relance.trigger_type        AS ENUM ('before', 'on', 'after');
CREATE TYPE sma_relance.recipient_strategy  AS ENUM ('primary', 'role', 'fallback');
CREATE TYPE sma_relance.job_status          AS ENUM ('pending', 'ready', 'sent', 'failed', 'cancelled', 'skipped');
CREATE TYPE sma_relance.delivery_status     AS ENUM ('sent', 'failed', 'bounced', 'rejected');
CREATE TYPE sma_relance.unsub_scope_type    AS ENUM ('global', 'topic', 'organization', 'campaign');
CREATE TYPE sma_relance.unsub_source        AS ENUM ('link_click', 'admin', 'import', 'api', 'manual', 'one_click_header');
CREATE TYPE sma_relance.unsub_event_type    AS ENUM (
    'unsubscribe_clicked', 'unsubscribe_confirmed', 'unsubscribe_already_done',
    'resubscribe', 'admin_override'
);

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
    address              text,
    phone                text,
    email                text,
    notes                text,
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
-- 5. communication_topics
-- ============================================================================

CREATE TABLE sma_relance.communication_topics (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code              text NOT NULL UNIQUE,
    label             text NOT NULL,
    description       text,
    is_unsubscribable boolean NOT NULL DEFAULT true,
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comm_topics_code   ON sma_relance.communication_topics (code);
CREATE INDEX idx_comm_topics_active ON sma_relance.communication_topics (is_active);

-- ============================================================================
-- 6. email_templates
-- ============================================================================

CREATE TABLE sma_relance.email_templates (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key                        text NOT NULL UNIQUE,
    name                       text NOT NULL,
    subject_template           text NOT NULL,
    body_template              text NOT NULL,
    is_active                  boolean NOT NULL DEFAULT true,
    version                    int NOT NULL DEFAULT 1,
    communication_topic_id     uuid REFERENCES sma_relance.communication_topics(id),
    include_unsubscribe_link   boolean NOT NULL DEFAULT true,
    unsubscribe_footer_variant text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now(),
    archived_at                timestamptz
);

CREATE INDEX idx_templates_active ON sma_relance.email_templates (is_active) WHERE archived_at IS NULL;

-- ============================================================================
-- 7. reminder_rules
-- ============================================================================

CREATE TABLE sma_relance.reminder_rules (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     text NOT NULL,
    is_active                boolean NOT NULL DEFAULT true,
    offset_sign              int NOT NULL CHECK (offset_sign IN (-1, 0, 1)),
    offset_value             int NOT NULL CHECK (offset_value >= 0),
    offset_unit              sma_relance.offset_unit NOT NULL DEFAULT 'day',
    trigger_type             sma_relance.trigger_type NOT NULL DEFAULT 'before',
    recipient_strategy       sma_relance.recipient_strategy NOT NULL DEFAULT 'primary',
    template_id              uuid REFERENCES sma_relance.email_templates(id),
    communication_topic_id   uuid REFERENCES sma_relance.communication_topics(id),
    suppress_if_unsubscribed boolean NOT NULL DEFAULT true,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    archived_at              timestamptz
);

CREATE INDEX idx_rules_active ON sma_relance.reminder_rules (is_active) WHERE archived_at IS NULL;

-- ============================================================================
-- 8. course_applicability
--    organization_id OU organization_type_id (exactement un)
-- ============================================================================

CREATE TABLE sma_relance.course_applicability (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid REFERENCES sma_relance.organizations(id),
    organization_type_id uuid REFERENCES sma_relance.organization_types(id),
    course_id            uuid NOT NULL REFERENCES sma_relance.training_courses(id),
    created_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_applicability_scope CHECK (
        (organization_id IS NOT NULL AND organization_type_id IS NULL) OR
        (organization_id IS NULL AND organization_type_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_applicability_org_course
    ON sma_relance.course_applicability (organization_id, course_id)
    WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX idx_applicability_type_course
    ON sma_relance.course_applicability (organization_type_id, course_id)
    WHERE organization_type_id IS NOT NULL;

CREATE INDEX idx_applicability_org      ON sma_relance.course_applicability (organization_id);
CREATE INDEX idx_applicability_course   ON sma_relance.course_applicability (course_id);
CREATE INDEX idx_applicability_org_type ON sma_relance.course_applicability (organization_type_id);

-- ============================================================================
-- 9. training_sessions
-- ============================================================================

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
-- 10. training_due_items
-- ============================================================================

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
-- 11. email_subscriptions (suppression list)
-- ============================================================================

CREATE TABLE sma_relance.email_subscriptions (
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

CREATE UNIQUE INDEX idx_email_subs_unique
    ON sma_relance.email_subscriptions (
        email_hash,
        COALESCE(communication_topic_id, '00000000-0000-0000-0000-000000000000'::uuid),
        scope_type,
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
    );

CREATE INDEX idx_email_subs_hash       ON sma_relance.email_subscriptions (email_hash);
CREATE INDEX idx_email_subs_contact    ON sma_relance.email_subscriptions (contact_id);
CREATE INDEX idx_email_subs_topic      ON sma_relance.email_subscriptions (communication_topic_id);
CREATE INDEX idx_email_subs_subscribed ON sma_relance.email_subscriptions (is_subscribed) WHERE is_subscribed = false;

-- ============================================================================
-- 12. reminder_jobs
-- ============================================================================

CREATE TABLE sma_relance.reminder_jobs (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    due_item_id                uuid NOT NULL REFERENCES sma_relance.training_due_items(id),
    reminder_rule_id           uuid NOT NULL REFERENCES sma_relance.reminder_rules(id),
    recipient_contact_id       uuid REFERENCES sma_relance.organization_contacts(id),
    recipient_email            text NOT NULL,
    template_id                uuid REFERENCES sma_relance.email_templates(id),
    scheduled_for              timestamptz NOT NULL,
    status                     sma_relance.job_status NOT NULL DEFAULT 'pending',
    attempt_count              int NOT NULL DEFAULT 0,
    last_attempt_at            timestamptz,
    error_message              text,
    idempotency_key            text NOT NULL UNIQUE,
    communication_topic_id     uuid REFERENCES sma_relance.communication_topics(id),
    unsubscribe_token_id       uuid,
    unsubscribable             boolean NOT NULL DEFAULT true,
    recipient_email_normalized text,
    skipped_reason             text,
    created_at                 timestamptz NOT NULL DEFAULT now(),
    updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status_sched ON sma_relance.reminder_jobs (status, scheduled_for);
CREATE INDEX idx_jobs_due_rule     ON sma_relance.reminder_jobs (due_item_id, reminder_rule_id);
CREATE INDEX idx_jobs_idempotency  ON sma_relance.reminder_jobs (idempotency_key);

-- ============================================================================
-- 13. unsubscribe_tokens
-- ============================================================================

CREATE TABLE sma_relance.unsubscribe_tokens (
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

CREATE INDEX idx_unsub_tokens_hash    ON sma_relance.unsubscribe_tokens (token_hash);
CREATE INDEX idx_unsub_tokens_expires ON sma_relance.unsubscribe_tokens (expires_at) WHERE used_at IS NULL AND revoked_at IS NULL;

-- FK différée : reminder_jobs → unsubscribe_tokens
ALTER TABLE sma_relance.reminder_jobs
    ADD CONSTRAINT fk_jobs_unsub_token FOREIGN KEY (unsubscribe_token_id)
    REFERENCES sma_relance.unsubscribe_tokens(id);

-- ============================================================================
-- 14. unsubscribe_events
-- ============================================================================

CREATE TABLE sma_relance.unsubscribe_events (
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

CREATE INDEX idx_unsub_events_email ON sma_relance.unsubscribe_events (email_hash);
CREATE INDEX idx_unsub_events_type  ON sma_relance.unsubscribe_events (event_type);
CREATE INDEX idx_unsub_events_date  ON sma_relance.unsubscribe_events (created_at);

-- ============================================================================
-- 15. email_deliveries
-- ============================================================================

CREATE TABLE sma_relance.email_deliveries (
    id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_job_id              uuid NOT NULL REFERENCES sma_relance.reminder_jobs(id),
    provider                     text NOT NULL,
    provider_message_id          text,
    status                       sma_relance.delivery_status NOT NULL,
    sent_at                      timestamptz,
    error_payload                jsonb,
    communication_topic_id       uuid REFERENCES sma_relance.communication_topics(id),
    unsubscribe_link_rendered    boolean NOT NULL DEFAULT false,
    unsubscribe_link_clicked_at  timestamptz,
    created_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliveries_job_status ON sma_relance.email_deliveries (reminder_job_id, status);

-- ============================================================================
-- Triggers : updated_at automatique
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
            'communication_topics', 'email_templates', 'reminder_rules',
            'email_subscriptions', 'reminder_jobs'
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
-- Vues SQL
-- ============================================================================

-- Vue étendue : associations cours <-> org-type -> orgs individuels
CREATE OR REPLACE VIEW sma_relance.v_course_applicability_expanded AS
    SELECT ca.organization_id, ca.course_id
    FROM sma_relance.course_applicability ca
    WHERE ca.organization_id IS NOT NULL
    UNION
    SELECT o.id AS organization_id, ca.course_id
    FROM sma_relance.course_applicability ca
    JOIN sma_relance.organizations o ON o.organization_type_id = ca.organization_type_id
    WHERE ca.organization_type_id IS NOT NULL
      AND o.archived_at IS NULL;

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
-- Grants
-- ============================================================================

GRANT USAGE ON SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sma_relance TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA sma_relance TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA sma_relance
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sma_relance
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
