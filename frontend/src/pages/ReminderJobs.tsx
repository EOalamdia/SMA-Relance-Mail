import { useEffect, useState } from "react"
import { Send, RefreshCw, XCircle, Play } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { ReminderJob, JobStatus } from "../types/sma"
import { reminderJobsApi } from "../services/api"

export default function ReminderJobsPage() {
  const [items, setItems] = useState<ReminderJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [filterStatus])

  async function load() {
    setLoading(true); setError(null)
    try { const d = await reminderJobsApi.list(filterStatus || undefined); setItems(d.items) }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await reminderJobsApi.generate()
      alert(`${res.generated} jobs de relance générés.`)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setGenerating(false) }
  }

  async function handleSendPending() {
    setSending(true)
    try {
      const res = await reminderJobsApi.sendPending()
      alert(`${res.sent} envoyés, ${res.failed} échoués.`)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSending(false) }
  }

  async function handleCancel(id: string) {
    if (!confirm("Annuler ce job de relance ?")) return
    try {
      const u = await reminderJobsApi.cancel(id)
      setItems(p => p.map(i => i.id === id ? u : i))
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  const statusColors: Record<JobStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    ready: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
    skipped: "bg-orange-100 text-orange-700",
  }

  const statuses: JobStatus[] = ["pending", "ready", "sent", "failed", "cancelled", "skipped"]

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Relances</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" /> Jobs de relance
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Les jobs sont générés automatiquement par le scheduler. Vous pouvez aussi les déclencher manuellement.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleGenerate} disabled={generating} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Génération…" : "Générer les jobs"}
        </Button>
        <Button onClick={handleSendPending} disabled={sending}>
          <Play className={`h-4 w-4 mr-2 ${sending ? "animate-pulse" : ""}`} />
          {sending ? "Envoi…" : "Envoyer les relances en attente"}
        </Button>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous les statuts</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun job de relance.</CardContent></Card>}

        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.recipient_email}</p>
                <p className="text-xs text-muted-foreground">
                  Prévu le {new Date(item.scheduled_for).toLocaleDateString("fr-FR")}
                  · Tentatives : {item.attempt_count}
                  {item.last_error && ` · Erreur : ${item.last_error}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}>
                  {item.status}
                </span>
                {item.status === "pending" && (
                  <Button size="icon" variant="ghost" title="Annuler" onClick={() => handleCancel(item.id)}>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
