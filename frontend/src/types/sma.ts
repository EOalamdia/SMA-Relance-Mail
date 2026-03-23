// ---------------------------------------------------------------------------
// SMA – TypeScript types aligned with backend Pydantic schemas
// ---------------------------------------------------------------------------

// ── Enums ─────────────────────────────────────────────────────────────────

export type SessionStatus = "planned" | "completed" | "cancelled"
export type SessionSource = "manual" | "import" | "api"
export type ScopeType = "individual" | "group"
export type DueStatus = "ok" | "due_soon" | "due" | "overdue" | "missing_policy" | "never_done" | "no_reminder"
export type OffsetUnit = "days" | "weeks" | "months"
export type TriggerType = "before_due" | "after_due"
export type RecipientStrategy = "primary_contact" | "fallback_email" | "both"
export type JobStatus = "pending" | "sent" | "failed" | "cancelled"
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
  type_id: string
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
  type_id: string
  address?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface OrganizationUpdate {
  name?: string
  type_id?: string
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
  email: string
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
  email: string
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}

export interface ContactUpdate {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}

// ── Training Courses ──────────────────────────────────────────────────────

export interface TrainingCourse {
  id: string
  code: string
  label: string
  description: string | null
  validity_months: number | null
  reminder_enabled: boolean
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingCourseCreate {
  code: string
  label: string
  description?: string | null
  validity_months?: number | null
  reminder_enabled?: boolean
}

export interface TrainingCourseUpdate {
  code?: string
  label?: string
  description?: string | null
  validity_months?: number | null
  reminder_enabled?: boolean
  is_active?: boolean
}

// ── Course Applicability ──────────────────────────────────────────────────

export interface CourseApplicability {
  id: string
  organization_id: string
  course_id: string
  scope_type: ScopeType
  created_at: string
}

export interface CourseApplicabilityCreate {
  organization_id: string
  course_id: string
  scope_type?: ScopeType
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
  course_id: string | null
  label: string
  offset_value: number
  offset_unit: OffsetUnit
  trigger_type: TriggerType
  recipient_strategy: RecipientStrategy
  fallback_email: string | null
  template_id: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface ReminderRuleCreate {
  label: string
  course_id?: string | null
  offset_value: number
  offset_unit: OffsetUnit
  trigger_type: TriggerType
  recipient_strategy?: RecipientStrategy
  fallback_email?: string | null
  template_id?: string | null
}

export interface ReminderRuleUpdate {
  label?: string
  course_id?: string | null
  offset_value?: number
  offset_unit?: OffsetUnit
  trigger_type?: TriggerType
  recipient_strategy?: RecipientStrategy
  fallback_email?: string | null
  template_id?: string | null
  is_active?: boolean
}

// ── Email Templates ───────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string
  key: string
  label: string
  subject: string
  body_html: string
  body_text: string | null
  is_active: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailTemplateCreate {
  key: string
  label: string
  subject: string
  body_html: string
  body_text?: string | null
}

export interface EmailTemplateUpdate {
  key?: string
  label?: string
  subject?: string
  body_html?: string
  body_text?: string | null
  is_active?: boolean
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

// ── Import response ───────────────────────────────────────────────────────

export interface ImportResult {
  inserted: number
  skipped: number
  errors: string[]
}
