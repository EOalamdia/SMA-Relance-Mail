// ---------------------------------------------------------------------------
// SMA – TypeScript types aligned with backend Pydantic schemas
// ---------------------------------------------------------------------------

// ── Enums ─────────────────────────────────────────────────────────────────

export type SessionStatus = "planned" | "completed" | "cancelled"
export type SessionSource = "manual" | "import" | "api"
export type ScopeType = "individual" | "group"
export type DueStatus = "ok" | "due_soon" | "due" | "overdue" | "missing_policy" | "never_done" | "no_reminder"
export type OffsetUnit = "day" | "month"
export type TriggerType = "before" | "on" | "after"
export type RecipientStrategy = "primary" | "role" | "fallback"
export type JobStatus = "pending" | "ready" | "sent" | "failed" | "cancelled" | "skipped"
export type DeliveryStatus = "sent" | "failed" | "bounced"

// ── Organization Types ────────────────────────────────────────────────────

export interface OrganizationType {
  id: string
  name: string
  description: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationTypeCreate {
  name: string
  description?: string | null
}

export interface OrganizationTypeUpdate {
  name?: string
  description?: string | null
  is_active?: boolean
}

// ── Organizations ─────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  organization_type_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationCreate {
  name: string
  organization_type_id?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface OrganizationUpdate {
  name?: string
  organization_type_id?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
  is_active?: boolean
}

// ── Contacts ──────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ContactCreate {
  organization_id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}

export interface ContactUpdate {
  first_name?: string
  last_name?: string
  email?: string | null
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}

// ── Training Courses ──────────────────────────────────────────────────────

export interface TrainingCourse {
  id: string
  code: string
  title: string
  reminder_frequency_months: number | null
  reminder_disabled: boolean
  is_active: boolean
  price_ht: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingCourseCreate {
  code: string
  title: string
  reminder_frequency_months?: number | null
  reminder_disabled?: boolean
  price_ht?: number | null
}

export interface TrainingCourseUpdate {
  code?: string
  title?: string
  reminder_frequency_months?: number | null
  reminder_disabled?: boolean
  is_active?: boolean
  price_ht?: number | null
}

// ── Course Applicability ──────────────────────────────────────────────────

export interface CourseApplicability {
  id: string
  organization_id: string | null
  organization_type_id: string | null
  course_id: string
  created_at: string
}

export interface CourseApplicabilityCreate {
  organization_id?: string | null
  organization_type_id?: string | null
  course_id: string
}

// ── Training Sessions ─────────────────────────────────────────────────────

export interface TrainingSession {
  id: string
  organization_id: string
  course_id: string
  session_date: string
  expiry_date: string | null
  status: SessionStatus
  source: SessionSource
  provider: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TrainingSessionCreate {
  organization_id: string
  course_id: string
  session_date: string
  expiry_date?: string | null
  status?: SessionStatus
  source?: SessionSource
  provider?: string | null
  notes?: string | null
}

export interface TrainingSessionUpdate {
  session_date?: string
  expiry_date?: string | null
  status?: SessionStatus
  provider?: string | null
  notes?: string | null
}

// ── Due Items ─────────────────────────────────────────────────────────────

export interface DueItem {
  id: string
  organization_id: string
  course_id: string
  scope_type: ScopeType
  last_session_date: string | null
  due_date: string | null
  status: DueStatus
  closed_at: string | null
  created_at: string
  updated_at: string
}

// ── Reminder Rules ────────────────────────────────────────────────────────

export interface ReminderRule {
  id: string
  name: string
  is_active: boolean
  offset_sign: number
  offset_value: number
  offset_unit: OffsetUnit
  trigger_type: TriggerType
  recipient_strategy: RecipientStrategy
  template_id: string | null
  suppress_if_unsubscribed: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface ReminderRuleCreate {
  name: string
  is_active?: boolean
  offset_sign: number
  offset_value: number
  offset_unit: OffsetUnit
  trigger_type: TriggerType
  recipient_strategy?: RecipientStrategy
  template_id?: string | null
  suppress_if_unsubscribed?: boolean
}

export interface ReminderRuleUpdate {
  name?: string
  is_active?: boolean
  offset_sign?: number
  offset_value?: number
  offset_unit?: OffsetUnit
  trigger_type?: TriggerType
  recipient_strategy?: RecipientStrategy
  template_id?: string | null
  suppress_if_unsubscribed?: boolean
}

// ── Email Templates ───────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string
  key: string
  name: string
  subject_template: string
  body_template: string
  is_active: boolean
  version: number
  communication_topic_id: string | null
  include_unsubscribe_link: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailTemplateCreate {
  key: string
  name: string
  subject_template: string
  body_template: string
  communication_topic_id?: string | null
  include_unsubscribe_link?: boolean
}

export interface EmailTemplateUpdate {
  key?: string
  name?: string
  subject_template?: string
  body_template?: string
  is_active?: boolean
  communication_topic_id?: string | null
  include_unsubscribe_link?: boolean
}

// ── Reminder Jobs ─────────────────────────────────────────────────────────

export interface ReminderJob {
  id: string
  due_item_id: string
  rule_id: string
  recipient_email: string
  template_id: string | null
  scheduled_for: string
  status: JobStatus
  attempt_count: number
  last_error: string | null
  idempotency_key: string
  created_at: string
  updated_at: string
}

// ── Email Deliveries ──────────────────────────────────────────────────────

export interface EmailDelivery {
  id: string
  job_id: string
  provider: string
  provider_message_id: string | null
  status: DeliveryStatus
  error_detail: string | null
  sent_at: string
}

// ── Communication Topics ──────────────────────────────────────────────────

export interface CommunicationTopic {
  id: string
  code: string
  label: string
  description: string | null
  is_unsubscribable: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunicationTopicCreate {
  code: string
  label: string
  description?: string | null
  is_unsubscribable?: boolean
  is_active?: boolean
}

export interface CommunicationTopicUpdate {
  label?: string
  description?: string | null
  is_unsubscribable?: boolean
  is_active?: boolean
}

// ── Email Subscriptions ───────────────────────────────────────────────────

export type UnsubScopeType = "global" | "topic" | "organization" | "campaign"
export type UnsubSource = "link_click" | "admin" | "import" | "api" | "manual" | "one_click_header"
export type UnsubEventType = "unsubscribe_clicked" | "unsubscribe_confirmed" | "unsubscribe_already_done" | "resubscribe" | "admin_override"

export interface EmailSubscription {
  id: string
  contact_id: string | null
  email_normalized: string
  email_hash: string
  communication_topic_id: string | null
  scope_type: UnsubScopeType
  organization_id: string | null
  is_subscribed: boolean
  unsubscribed_at: string | null
  unsubscribed_reason: string | null
  source: UnsubSource | null
  created_at: string
  updated_at: string
}

// ── Unsubscribe Events ────────────────────────────────────────────────────

export interface UnsubscribeEvent {
  id: string
  subscription_id: string | null
  contact_id: string | null
  email_normalized: string
  email_hash: string
  communication_topic_id: string | null
  event_type: UnsubEventType
  source: UnsubSource
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ── Dashboard Views ───────────────────────────────────────────────────────

export interface DashboardSummary {
  total_organizations: number
  total_courses: number
  total_due_items: number
  overdue_count: number
  due_soon_count: number
  ok_count: number
  pending_jobs: number
}

export interface DueRadarRow {
  organization_id: string
  organization_name: string
  course_id: string
  course_label: string
  due_date: string | null
  status: DueStatus
  last_session_date: string | null
}

export interface CoverageRow {
  type_name: string
  course_label: string
  total_organizations: number
  covered_count: number
  coverage_pct: number
}

export interface UpcomingReminderRow {
  job_id: string
  organization_name: string
  course_label: string
  recipient_email: string
  scheduled_for: string
  status: JobStatus
}

export interface OverdueRow {
  organization_name: string
  course_label: string
  due_date: string
  status: DueStatus
  days_overdue: number
}

// ── Generic list response ─────────────────────────────────────────────────

export interface ListResponse<T> {
  items: T[]
  count: number
}
