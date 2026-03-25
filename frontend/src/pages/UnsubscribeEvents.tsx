import { useEffect, useState } from "react"
import { ClipboardList, Search } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { UnsubscribeEvent, UnsubEventType } from "../types/sma"
import { unsubscribeEventsApi } from "../services/api"

const EVENT_COLORS: Record<string, string> = {
  unsubscribe_clicked: "bg-yellow-100 text-yellow-800",
  unsubscribe_confirmed: "bg-red-100 text-red-800",
  unsubscribe_already_done: "bg-blue-100 text-blue-800",
  resubscribe: "bg-green-100 text-green-800",
  admin_override: "bg-purple-100 text-purple-800",
}

const EVENT_LABELS: Record<string, string> = {
  unsubscribe_clicked: "Clic",
  unsubscribe_confirmed: "Confirmé",
  unsubscribe_already_done: "Déjà fait",
  resubscribe: "Réabonnement",
  admin_override: "Admin",
}

export default function UnsubscribeEventsPage() {
  const [items, setItems] = useState<UnsubscribeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState("")
  const [searchEmail, setSearchEmail] = useState("")

  useEffect(() => { load() }, [filterType])

  async function load() {
    setLoading(true); setError(null)
    try {
      const params: Record<string, string> = {}
      if (filterType) params.event_type = filterType
      if (searchEmail) params.email = searchEmail
      const d = await unsubscribeEventsApi.list(params)
      setItems(d.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  const eventTypes: UnsubEventType[] = ["unsubscribe_clicked", "unsubscribe_confirmed", "unsubscribe_already_done", "resubscribe", "admin_override"]

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Désinscription</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" /> Journal des désinscriptions
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Historique complet de tous les événements de désinscription et réabonnement.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous les types</option>
          {eventTypes.map(t => <option key={t} value={t}>{EVENT_LABELS[t] || t}</option>)}
        </select>
        <div className="flex gap-1">
          <input placeholder="Rechercher par email…" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64" />
          <Button variant="outline" size="sm" onClick={load}><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Événements ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Aucun événement enregistré.</p>
          )}

          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2">IP</th>
                </tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-xs">{new Date(item.created_at).toLocaleString("fr-FR")}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{item.email_normalized}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_COLORS[item.event_type] ?? "bg-gray-100 text-gray-700"}`}>
                          {EVENT_LABELS[item.event_type] || item.event_type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{item.source}</td>
                      <td className="py-2 text-xs text-muted-foreground">{item.ip_address ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
