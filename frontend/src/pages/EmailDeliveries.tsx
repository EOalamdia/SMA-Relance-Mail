import { useEffect, useState } from "react"
import { MailCheck } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { EmailDelivery } from "../types/sma"
import { emailDeliveriesApi } from "../services/api"

const PAGE_SIZE = 25

export default function EmailDeliveriesPage() {
  const [items, setItems] = useState<EmailDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, page])

  async function load() {
    setLoading(true); setError(null)
    try {
      const d = await emailDeliveriesApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setItems(d.items); setTotalCount(d.count)
    }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  const statusColors: Record<string, string> = {
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    bounced: "bg-orange-100 text-orange-800",
  }
  const statusLabels: Record<string, string> = {
    sent: "Envoyé",
    failed: "Échec",
    bounced: "Rejeté",
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Relances</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MailCheck className="h-6 w-6 text-primary" /> Historique des envois
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Journal de tous les e-mails envoyés par le système de relance.
        </p>
      </header>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher un fournisseur ou ID message…"
      />

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun envoi enregistré.</CardContent></Card>}

        <Card>
          <CardHeader><CardTitle className="text-lg">Envois récents</CardTitle></CardHeader>
          <CardContent>
            {items.length > 0 && (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Fournisseur</th>
                    <th className="pb-2 pr-4">ID du message</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Erreur</th>
                </tr></thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{new Date(item.sent_at).toLocaleString("fr-FR")}</td>
                        <td className="py-2 pr-4">{item.provider}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{item.provider_message_id ?? "—"}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] ?? ""}`}>
                            {statusLabels[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">{item.error_detail ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
