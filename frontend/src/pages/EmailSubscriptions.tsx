import { useEffect, useState } from "react"
import { MailX, RefreshCw } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { EmailSubscription } from "../types/sma"
import { emailSubscriptionsApi } from "../services/api"

const PAGE_SIZE = 25

export default function EmailSubscriptionsPage() {
  const [items, setItems] = useState<EmailSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterSubscribed, setFilterSubscribed] = useState<string>("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, page, filterSubscribed])

  async function load() {
    setLoading(true); setError(null)
    try {
      const params: Parameters<typeof emailSubscriptionsApi.list>[0] = { limit: PAGE_SIZE, offset: page * PAGE_SIZE }
      if (filterSubscribed === "true") params.is_subscribed = true
      if (filterSubscribed === "false") params.is_subscribed = false
      if (search) params.email = search
      const d = await emailSubscriptionsApi.list(params)
      setItems(d.items); setTotalCount(d.count)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleResubscribe(id: string) {
    const reason = prompt("Motif du réabonnement (optionnel) :")
    if (reason === null) return
    try {
      const updated = await emailSubscriptionsApi.resubscribe(id, reason || undefined)
      setItems(p => p.map(i => i.id === id ? updated : i))
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  function scopeTypeLabel(scopeType: string): string {
    if (scopeType === "individual") return "Individuel"
    if (scopeType === "group") return "Groupe"
    if (scopeType === "global") return "Global"
    if (scopeType === "topic") return "Sujet"
    if (scopeType === "organization") return "Organisme"
    if (scopeType === "campaign") return "Campagne"
    return scopeType
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Désinscription</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MailX className="h-6 w-6 text-primary" /> Abonnements e-mail
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Liste de blocage — état d'abonnement par contact et par type de communication.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterSubscribed} onChange={e => { setFilterSubscribed(e.target.value); setPage(0) }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous les états</option>
          <option value="false">Désinscrits uniquement</option>
          <option value="true">Abonnés uniquement</option>
        </select>
      </div>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher par e-mail…"
      />

      <Card>
        <CardHeader><CardTitle className="text-lg">Abonnements ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Aucun abonnement enregistré.</p>
          )}

          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Adresse e-mail</th>
                  <th className="pb-2 pr-4">Portée</th>
                  <th className="pb-2 pr-4">Statut</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2 pr-4">Date désinscription</th>
                  <th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {item.email_normalized}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                          {scopeTypeLabel(item.scope_type)}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {item.is_subscribed ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">Abonné</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Désinscrit</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{item.source ?? "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {item.unsubscribed_at ? new Date(item.unsubscribed_at).toLocaleString("fr-FR") : "—"}
                      </td>
                      <td className="py-2">
                        {!item.is_subscribed && (
                          <Button variant="ghost" size="sm" onClick={() => handleResubscribe(item.id)}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Réabonner
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TablePagination
        pageIndex={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        pageCount={Math.ceil(totalCount / PAGE_SIZE)}
        onPageChange={setPage}
      />
    </div>
  )
}
