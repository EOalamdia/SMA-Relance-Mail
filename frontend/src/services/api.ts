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
// Items API — demo CRUD (schema app_starter)
// PLACEHOLDER: renommer itemsApi et adapter les types au domaine metier cible
// ---------------------------------------------------------------------------

export type ItemOut = {
  id: string
  name: string
  description: string | null
  // PLACEHOLDER: typer metadata selon le schema defini dans le backend
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ItemsListResponse = {
  items: ItemOut[]
  count: number
}

export type ItemCreate = {
  name: string
  description?: string | null
  metadata?: Record<string, unknown>
}

export type ItemUpdate = {
  name?: string
  description?: string | null
  metadata?: Record<string, unknown>
}

export const itemsApi = {
  /** Recupere la liste complete des items. */
  list(): Promise<ItemsListResponse> {
    return apiRequest<ItemsListResponse>("/v1/items")
  },

  /** Recupere un item par son UUID. */
  get(id: string): Promise<ItemOut> {
    return apiRequest<ItemOut>(`/v1/items/${id}`)
  },

  /** Cree un nouvel item. */
  create(data: ItemCreate): Promise<ItemOut> {
    return apiRequest<ItemOut>("/v1/items", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /** Met a jour partiellement un item. */
  update(id: string, data: ItemUpdate): Promise<ItemOut> {
    return apiRequest<ItemOut>(`/v1/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  /** Supprime un item (retourne void). */
  remove(id: string): Promise<void> {
    return apiRequest<void>(`/v1/items/${id}`, { method: "DELETE" })
  },
}
