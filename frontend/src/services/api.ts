import type {
  OrganizationType, OrganizationTypeCreate, OrganizationTypeUpdate,
  Organization, OrganizationCreate, OrganizationUpdate,
  Contact, ContactCreate, ContactUpdate,
  TrainingCourse, TrainingCourseCreate, TrainingCourseUpdate,
  CourseApplicability, CourseApplicabilityCreate,
  TrainingSession, TrainingSessionCreate, TrainingSessionUpdate,
  DueItem,
  ReminderRule, ReminderRuleCreate, ReminderRuleUpdate,
  EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate,
  ReminderJob, EmailDelivery,
  CommunicationTopic, CommunicationTopicCreate, CommunicationTopicUpdate,
  EmailSubscription, UnsubscribeEvent,
  DashboardSummary, DueRadarRow, CoverageRow, UpcomingReminderRow, OverdueRow,
  ListResponse, ImportResult,
} from "../types/sma"

const API_BASE_URL = import.meta.env.VITE_API_URL

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is required. Configure it from app slug/path placeholders.")
}

function getCsrfTokenFromCookie(): string | null {
  try {
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === "__Host-csrf_token" || name === "csrf_token") {
        return decodeURIComponent(value)
      }
    }
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Silent token refresh — évite d'afficher la modal si le refresh_token est valide
// ---------------------------------------------------------------------------

let _isRefreshing = false
let _refreshSubscribers: Array<(ok: boolean) => void> = []

function _subscribeTokenRefresh(cb: (ok: boolean) => void) {
  _refreshSubscribers.push(cb)
}

function _notifySubscribers(ok: boolean) {
  _refreshSubscribers.forEach((cb) => cb(ok))
  _refreshSubscribers = []
}

/**
 * Tente un refresh silencieux du JWT via le cookie refresh_token (HttpOnly).
 * Retourne true si le refresh a réussi, false sinon.
 * Plusieurs appels concurrents partagent la même promesse de refresh (pas de race condition).
 */
async function tryRefreshToken(): Promise<boolean> {
  if (_isRefreshing) {
    // Une tentative de refresh est déjà en cours — attendre son résultat
    return new Promise<boolean>((resolve) => {
      _subscribeTokenRefresh(resolve)
    })
  }

  _isRefreshing = true

  try {
    // L'endpoint /auth/refresh est sur le backend Hub central (pas sous le préfixe app)
    const refreshUrl = `${window.location.origin}/api/auth/refresh`
    const refreshResponse = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })

    const success = refreshResponse.ok
    _notifySubscribers(success)
    return success
  } catch {
    _notifySubscribers(false)
    return false
  } finally {
    _isRefreshing = false
  }
}

/** Dispatche l'événement de session expirée et retourne une Promise infinie. */
function _dispatchUnauthorized<T>(): Promise<T> {
  window.dispatchEvent(new CustomEvent('auth-unauthorized', {
    detail: { returnUrl: window.location.pathname + window.location.search }
  }))
  return new Promise<T>(() => {})
}

async function apiRequest<T>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  const method = (options.method || "GET").toUpperCase()
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrfTokenFromCookie()
    if (csrf) {
      headers.set("X-CSRF-Token", csrf)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  // ── Détection d'une session expirée ─────────────────────────────────────
  // Cas 1 : Traefik redirige vers /login (JWT expiré ou révoqué)
  const isRedirectToLogin = response.redirected && response.url.includes('/login')
  // Cas 2 : Backend retourne explicitement 401
  const is401 = !response.ok && response.status === 401

  if (isRedirectToLogin || is401) {
    // Ne pas re-tenter le refresh si on est déjà dans une boucle de retry
    if (!_isRetry) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        // Refresh réussi → rejouer la requête originale (session conservée)
        return apiRequest<T>(path, options, true)
      }
    }
    // Refresh échoué ou déjà en retry → afficher la modal de reconnexion
    return _dispatchUnauthorized<T>()
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: `${response.status} ${response.statusText}` }))
    const errorMessage = typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail, null, 2)
    throw new Error(errorMessage || "API error")
  }

  if (response.status === 204) {
    return {} as T
  }

  try {
    return await response.json() as T
  } catch (err) {
    // Si JSON invalide → vraisemblablement une page HTML de login
    const text = await response.text().catch(() => "")
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      if (!_isRetry) {
        const refreshed = await tryRefreshToken()
        if (refreshed) {
          return apiRequest<T>(path, options, true)
        }
      }
      return _dispatchUnauthorized<T>()
    }
    throw err
  }
}

export type PingResponse = {
  message: string
  user_id: string
  user_email?: string
  timestamp: string
}

export type CurrentUserResponse = {
  user_id: string
  user_email?: string
  forwarded_user?: string
}

export type AppShellResponse = {
  app_name: string
  icon_url?: string | null
}

export type EchoResponse = {
  echoed_text: string
  user_id: string
  timestamp: string
}

export const starterApi = {
  appShell() {
    return apiRequest<AppShellResponse>("/v1/starter/app-shell")
  },
  me() {
    return apiRequest<CurrentUserResponse>("/v1/starter/me")
  },
  debugPing() {
    return apiRequest<PingResponse>("/v1/starter/debug/ping")
  },
  debugEcho(text: string) {
    return apiRequest<EchoResponse>("/v1/starter/debug/echo", {
      method: "POST",
      body: JSON.stringify({ text }),
    })
  },
}

// ---------------------------------------------------------------------------
// SMA – Organization Types
// ---------------------------------------------------------------------------

export const organizationTypesApi = {
  list(): Promise<ListResponse<OrganizationType>> {
    return apiRequest<ListResponse<OrganizationType>>("/v1/organization-types")
  },
  get(id: string): Promise<OrganizationType> {
    return apiRequest<OrganizationType>(`/v1/organization-types/${id}`)
  },
  create(data: OrganizationTypeCreate): Promise<OrganizationType> {
    return apiRequest<OrganizationType>("/v1/organization-types", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: OrganizationTypeUpdate): Promise<OrganizationType> {
    return apiRequest<OrganizationType>(`/v1/organization-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  archive(id: string): Promise<void> {
    return apiRequest<void>(`/v1/organization-types/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Organizations
// ---------------------------------------------------------------------------

export const organizationsApi = {
  list(typeId?: string): Promise<ListResponse<Organization>> {
    const qs = typeId ? `?type_id=${typeId}` : ""
    return apiRequest<ListResponse<Organization>>(`/v1/organizations${qs}`)
  },
  get(id: string): Promise<Organization> {
    return apiRequest<Organization>(`/v1/organizations/${id}`)
  },
  create(data: OrganizationCreate): Promise<Organization> {
    return apiRequest<Organization>("/v1/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: OrganizationUpdate): Promise<Organization> {
    return apiRequest<Organization>(`/v1/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  archive(id: string): Promise<void> {
    return apiRequest<void>(`/v1/organizations/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Contacts
// ---------------------------------------------------------------------------

export const contactsApi = {
  list(orgId?: string): Promise<ListResponse<Contact>> {
    const qs = orgId ? `?organization_id=${orgId}` : ""
    return apiRequest<ListResponse<Contact>>(`/v1/contacts${qs}`)
  },
  get(id: string): Promise<Contact> {
    return apiRequest<Contact>(`/v1/contacts/${id}`)
  },
  create(data: ContactCreate): Promise<Contact> {
    return apiRequest<Contact>("/v1/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: ContactUpdate): Promise<Contact> {
    return apiRequest<Contact>(`/v1/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/v1/contacts/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Training Courses
// ---------------------------------------------------------------------------

export const trainingCoursesApi = {
  list(): Promise<ListResponse<TrainingCourse>> {
    return apiRequest<ListResponse<TrainingCourse>>("/v1/training-courses")
  },
  get(id: string): Promise<TrainingCourse> {
    return apiRequest<TrainingCourse>(`/v1/training-courses/${id}`)
  },
  create(data: TrainingCourseCreate): Promise<TrainingCourse> {
    return apiRequest<TrainingCourse>("/v1/training-courses", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: TrainingCourseUpdate): Promise<TrainingCourse> {
    return apiRequest<TrainingCourse>(`/v1/training-courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  archive(id: string): Promise<void> {
    return apiRequest<void>(`/v1/training-courses/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Course Applicability
// ---------------------------------------------------------------------------

export const courseApplicabilityApi = {
  list(orgId?: string, courseId?: string, orgTypeId?: string): Promise<ListResponse<CourseApplicability>> {
    const params = new URLSearchParams()
    if (orgId) params.set("organization_id", orgId)
    if (orgTypeId) params.set("organization_type_id", orgTypeId)
    if (courseId) params.set("course_id", courseId)
    const qs = params.toString() ? `?${params}` : ""
    return apiRequest<ListResponse<CourseApplicability>>(`/v1/course-applicability${qs}`)
  },
  create(data: CourseApplicabilityCreate): Promise<CourseApplicability> {
    return apiRequest<CourseApplicability>("/v1/course-applicability", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/v1/course-applicability/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Training Sessions
// ---------------------------------------------------------------------------

export const trainingSessionsApi = {
  list(orgId?: string, courseId?: string): Promise<ListResponse<TrainingSession>> {
    const params = new URLSearchParams()
    if (orgId) params.set("organization_id", orgId)
    if (courseId) params.set("course_id", courseId)
    const qs = params.toString() ? `?${params}` : ""
    return apiRequest<ListResponse<TrainingSession>>(`/v1/training-sessions${qs}`)
  },
  get(id: string): Promise<TrainingSession> {
    return apiRequest<TrainingSession>(`/v1/training-sessions/${id}`)
  },
  create(data: TrainingSessionCreate): Promise<TrainingSession> {
    return apiRequest<TrainingSession>("/v1/training-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: TrainingSessionUpdate): Promise<TrainingSession> {
    return apiRequest<TrainingSession>(`/v1/training-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/v1/training-sessions/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Due Items
// ---------------------------------------------------------------------------

export const dueItemsApi = {
  list(status?: string): Promise<ListResponse<DueItem>> {
    const qs = status ? `?status=${status}` : ""
    return apiRequest<ListResponse<DueItem>>(`/v1/due-items${qs}`)
  },
  get(id: string): Promise<DueItem> {
    return apiRequest<DueItem>(`/v1/due-items/${id}`)
  },
  compute(): Promise<{ computed: number }> {
    return apiRequest<{ computed: number }>("/v1/due-items/compute", { method: "POST" })
  },
  close(id: string): Promise<DueItem> {
    return apiRequest<DueItem>(`/v1/due-items/${id}/close`, { method: "POST" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Reminder Rules
// ---------------------------------------------------------------------------

export const reminderRulesApi = {
  list(): Promise<ListResponse<ReminderRule>> {
    return apiRequest<ListResponse<ReminderRule>>("/v1/reminder-rules")
  },
  get(id: string): Promise<ReminderRule> {
    return apiRequest<ReminderRule>(`/v1/reminder-rules/${id}`)
  },
  create(data: ReminderRuleCreate): Promise<ReminderRule> {
    return apiRequest<ReminderRule>("/v1/reminder-rules", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: ReminderRuleUpdate): Promise<ReminderRule> {
    return apiRequest<ReminderRule>(`/v1/reminder-rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  archive(id: string): Promise<void> {
    return apiRequest<void>(`/v1/reminder-rules/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Email Templates
// ---------------------------------------------------------------------------

export const emailTemplatesApi = {
  list(): Promise<ListResponse<EmailTemplate>> {
    return apiRequest<ListResponse<EmailTemplate>>("/v1/email-templates")
  },
  get(id: string): Promise<EmailTemplate> {
    return apiRequest<EmailTemplate>(`/v1/email-templates/${id}`)
  },
  create(data: EmailTemplateCreate): Promise<EmailTemplate> {
    return apiRequest<EmailTemplate>("/v1/email-templates", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: EmailTemplateUpdate): Promise<EmailTemplate> {
    return apiRequest<EmailTemplate>(`/v1/email-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  archive(id: string): Promise<void> {
    return apiRequest<void>(`/v1/email-templates/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Reminder Jobs
// ---------------------------------------------------------------------------

export const reminderJobsApi = {
  list(status?: string): Promise<ListResponse<ReminderJob>> {
    const qs = status ? `?status=${status}` : ""
    return apiRequest<ListResponse<ReminderJob>>(`/v1/reminder-jobs${qs}`)
  },
  get(id: string): Promise<ReminderJob> {
    return apiRequest<ReminderJob>(`/v1/reminder-jobs/${id}`)
  },
  generate(): Promise<{ generated: number }> {
    return apiRequest<{ generated: number }>("/v1/reminder-jobs/generate", { method: "POST" })
  },
  sendPending(): Promise<{ sent: number; failed: number }> {
    return apiRequest<{ sent: number; failed: number }>("/v1/reminder-jobs/send-pending", { method: "POST" })
  },
  cancel(id: string): Promise<ReminderJob> {
    return apiRequest<ReminderJob>(`/v1/reminder-jobs/${id}/cancel`, { method: "POST" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Email Deliveries
// ---------------------------------------------------------------------------

export const emailDeliveriesApi = {
  list(jobId?: string): Promise<ListResponse<EmailDelivery>> {
    const qs = jobId ? `?job_id=${jobId}` : ""
    return apiRequest<ListResponse<EmailDelivery>>(`/v1/email-deliveries${qs}`)
  },
  get(id: string): Promise<EmailDelivery> {
    return apiRequest<EmailDelivery>(`/v1/email-deliveries/${id}`)
  },
}

// ---------------------------------------------------------------------------
// SMA – Dashboard
// ---------------------------------------------------------------------------

export const dashboardApi = {
  summary(): Promise<DashboardSummary> {
    return apiRequest<DashboardSummary>("/v1/dashboard/summary")
  },
  radar(): Promise<DueRadarRow[]> {
    return apiRequest<DueRadarRow[]>("/v1/dashboard/radar")
  },
  coverage(): Promise<CoverageRow[]> {
    return apiRequest<CoverageRow[]>("/v1/dashboard/coverage")
  },
  upcomingReminders(): Promise<UpcomingReminderRow[]> {
    return apiRequest<UpcomingReminderRow[]>("/v1/dashboard/upcoming-reminders")
  },
  overdue(): Promise<OverdueRow[]> {
    return apiRequest<OverdueRow[]>("/v1/dashboard/overdue")
  },
}

// ---------------------------------------------------------------------------
// SMA – Import (multipart/form-data – no JSON Content-Type)
// ---------------------------------------------------------------------------

async function apiUpload<T>(path: string, file: File): Promise<T> {
  const headers = new Headers()
  const csrf = getCsrfTokenFromCookie()
  if (csrf) headers.set("X-CSRF-Token", csrf)

  const form = new FormData()
  form.append("file", file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: form,
    credentials: "include",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: `${response.status}` }))
    throw new Error(typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail))
  }

  return response.json() as Promise<T>
}

export const importApi = {
  organizations(file: File): Promise<ImportResult> {
    return apiUpload<ImportResult>("/v1/import/organizations", file)
  },
  sessions(file: File): Promise<ImportResult> {
    return apiUpload<ImportResult>("/v1/import/sessions", file)
  },
}

// ---------------------------------------------------------------------------
// SMA – Communication Topics
// ---------------------------------------------------------------------------

export const communicationTopicsApi = {
  list(): Promise<ListResponse<CommunicationTopic>> {
    return apiRequest<ListResponse<CommunicationTopic>>("/v1/communication-topics")
  },
  get(id: string): Promise<CommunicationTopic> {
    return apiRequest<CommunicationTopic>(`/v1/communication-topics/${id}`)
  },
  create(data: CommunicationTopicCreate): Promise<CommunicationTopic> {
    return apiRequest<CommunicationTopic>("/v1/communication-topics", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
  update(id: string, data: CommunicationTopicUpdate): Promise<CommunicationTopic> {
    return apiRequest<CommunicationTopic>(`/v1/communication-topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
  deactivate(id: string): Promise<void> {
    return apiRequest<void>(`/v1/communication-topics/${id}`, { method: "DELETE" })
  },
}

// ---------------------------------------------------------------------------
// SMA – Email Subscriptions
// ---------------------------------------------------------------------------

export const emailSubscriptionsApi = {
  list(params?: { is_subscribed?: boolean; communication_topic_id?: string; email?: string }): Promise<ListResponse<EmailSubscription>> {
    const qs = new URLSearchParams()
    if (params?.is_subscribed !== undefined) qs.set("is_subscribed", String(params.is_subscribed))
    if (params?.communication_topic_id) qs.set("communication_topic_id", params.communication_topic_id)
    if (params?.email) qs.set("email", params.email)
    const query = qs.toString() ? `?${qs}` : ""
    return apiRequest<ListResponse<EmailSubscription>>(`/v1/email-subscriptions${query}`)
  },
  get(id: string): Promise<EmailSubscription> {
    return apiRequest<EmailSubscription>(`/v1/email-subscriptions/${id}`)
  },
  resubscribe(id: string, reason?: string): Promise<EmailSubscription> {
    return apiRequest<EmailSubscription>(`/v1/email-subscriptions/${id}/resubscribe`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  },
}

// ---------------------------------------------------------------------------
// SMA – Unsubscribe Events
// ---------------------------------------------------------------------------

export const unsubscribeEventsApi = {
  list(params?: { event_type?: string; email?: string }): Promise<ListResponse<UnsubscribeEvent>> {
    const qs = new URLSearchParams()
    if (params?.event_type) qs.set("event_type", params.event_type)
    if (params?.email) qs.set("email", params.email)
    const query = qs.toString() ? `?${qs}` : ""
    return apiRequest<ListResponse<UnsubscribeEvent>>(`/v1/unsubscribe-events${query}`)
  },
}
