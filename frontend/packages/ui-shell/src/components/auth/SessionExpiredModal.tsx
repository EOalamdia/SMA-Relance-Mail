import * as React from "react"
import { useAuth } from "../../context/AuthContext"

export const SessionExpiredModal: React.FC = () => {
  const { isSessionExpired } = useAuth()

  if (!isSessionExpired) return null

  const handleReconnect = () => {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/login?returnUrl=${returnUrl}&message=${encodeURIComponent("Veuillez vous reconnecter pour continuer.")}`
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight">Session Expirée</h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Votre session a expiré pour des raisons de sécurité. 
            <br />
            Veuillez vous reconnecter pour continuer à utiliser l'application sans perdre votre travail.
          </p>
          <button
            onClick={handleReconnect}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
