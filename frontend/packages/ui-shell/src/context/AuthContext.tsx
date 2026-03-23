import * as React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { starterApi } from "@/services/api"

interface AuthContextType {
  isAuthenticated: boolean
  isSessionExpired: boolean
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Lance une promesse avec un délai maximum (timeout).
 * Utile pour éviter qu'une Promise infinie (retournée par api.ts sur 401)
 * ne bloque indéfiniment le polling de checkSession.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  return Promise.race([promise, timeout])
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const checkSession = useCallback(async () => {
    try {
      // Timeout 10s : si api.ts retourne une Promise infinie (401 intercepté),
      // on ne bloque pas le polling indéfiniment.
      const result = await withTimeout(starterApi.me(), 10_000)
      if (result !== null) {
        // La requête a abouti → session valide
        setIsAuthenticated(true)
        setIsSessionExpired(false)
      }
      // Si result === null → timeout (401 en cours de traitement par api.ts)
      // L'event auth-unauthorized sera dispatché par api.ts si le refresh échoue.
    } catch {
      // Erreur réseau ou autre → ne pas changer l'état (on réessaiera au prochain tick)
    }
  }, [])

  useEffect(() => {
    // Écouter les événements d'expiration de session dispatché depuis api.ts
    // (déclenché après un 401 si le refresh silencieux a échoué)
    const handleUnauthorized = () => {
      setIsAuthenticated(false)
      setIsSessionExpired(true)
    }

    window.addEventListener('auth-unauthorized' as any, handleUnauthorized)

    // Déconnexion depuis un autre onglet (via localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-status' && e.newValue === 'logged-out') {
        setIsAuthenticated(false)
        setIsSessionExpired(true)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Polling toutes les 90 secondes pour détecter les sessions expirées
    // (le refresh silencieux dans api.ts conserve la session si le refresh_token est valide)
    const interval = setInterval(checkSession, 90_000)

    return () => {
      window.removeEventListener('auth-unauthorized' as any, handleUnauthorized)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [checkSession])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSessionExpired, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
