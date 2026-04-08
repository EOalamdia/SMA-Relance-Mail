import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { MailX, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react"

import { Card, CardContent } from "@ui-core/components/ui/card"

const API_BASE_URL = import.meta.env.VITE_API_URL

type UnsubStatus = "loading" | "success" | "already_done" | "expired" | "invalid" | "revoked" | "error"

const STATUS_CONFIG: Record<UnsubStatus, { icon: typeof CheckCircle2; color: string; title: string }> = {
  loading: { icon: Loader2, color: "text-muted-foreground", title: "Traitement en cours…" },
  success: { icon: CheckCircle2, color: "text-green-600", title: "Désinscription confirmée" },
  already_done: { icon: CheckCircle2, color: "text-blue-600", title: "Déjà désinscrit(e)" },
  expired: { icon: AlertTriangle, color: "text-orange-600", title: "Lien expiré" },
  invalid: { icon: XCircle, color: "text-red-600", title: "Lien invalide" },
  revoked: { icon: XCircle, color: "text-red-600", title: "Lien révoqué" },
  error: { icon: AlertTriangle, color: "text-red-600", title: "Erreur" },
}

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<UnsubStatus>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      setMessage("Aucun token de désinscription fourni.")
      return
    }

    const processUnsubscribe = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/v1/public/unsubscribe?token=${encodeURIComponent(token)}`,
          { method: "GET" },
        )
        const data = await response.json()

        if (data.status === "success") {
          setStatus("success")
        } else if (data.status === "already_done") {
          setStatus("already_done")
        } else if (data.status === "expired") {
          setStatus("expired")
        } else if (data.status === "revoked") {
          setStatus("revoked")
        } else {
          setStatus("invalid")
        }
        setMessage(data.message || "")
      } catch {
        setStatus("error")
        setMessage("Une erreur est survenue lors du traitement de votre désinscription.")
      }
    }

    processUnsubscribe()
  }, [token])

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className={`rounded-full p-3 ${status === "success" ? "bg-green-50" : status === "already_done" ? "bg-blue-50" : "bg-gray-50"}`}>
            <Icon className={`h-10 w-10 ${config.color} ${status === "loading" ? "animate-spin" : ""}`} />
          </div>

          <h1 className="text-xl font-bold tracking-tight">{config.title}</h1>

          <p className="text-sm text-muted-foreground max-w-sm">
            {message}
          </p>

          {(status === "success" || status === "already_done") && (
            <p className="text-xs text-muted-foreground mt-2">
              Vous ne recevrez plus d'e-mails de ce type. Si cette action a été faite par erreur, contactez l'administrateur.
            </p>
          )}

          {status === "expired" && (
            <p className="text-xs text-muted-foreground mt-2">
              Ce lien a expiré. Veuillez contacter l'administrateur si vous souhaitez vous désinscrire.
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <MailX className="h-4 w-4" />
            <span>Gestion des abonnements e-mail</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
