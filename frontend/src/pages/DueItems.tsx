import { useEffect, useState } from "react"
import { Target, RefreshCw, XCircle } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TablePagination } from "@ui-core/components/ui/table"

import type { DueItem, DueStatus } from "../types/sma"
import { dueItemsApi, organizationsApi, trainingCoursesApi } from "../services/api"
import type { Organization, TrainingCourse } from "../types/sma"

function normalizeStatusKey(status: string): string {
  return (status || "").trim().toLowerCase().replace(/[\s-]+/g, "_")
}

const PAGE_SIZE = 25

export default function DueItemsPage() {
  const [items, setItems] = useState<DueItem[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [computing, setComputing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => { load() }, [filterStatus, page])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [d, o, c] = await Promise.all([
        dueItemsApi.list(filterStatus || undefined, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        organizationsApi.list(),
        trainingCoursesApi.list(),
      ])
      setItems(d.items); setTotalCount(d.count); setOrgs(o.items); setCourses(c.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function orgName(id: string) { return orgs.find(o => o.id === id)?.name ?? "—" }
  function courseName(id: string) { return courses.find(c => c.id === id)?.title ?? "—" }

  async function handleCompute() {
    setComputing(true)
    try {
      const res = await dueItemsApi.compute()
      alert(`${res.computed} échéances calculées.`)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setComputing(false) }
  }

  async function handleClose(id: string) {
    if (!confirm("Clôturer cette échéance ?")) return
    try {
      const u = await dueItemsApi.close(id)
      setItems(p => p.map(i => i.id === id ? u : i))
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  const statusVariants: Record<string, string> = {
    ok: "bg-green-100 text-green-800",
    due_soon: "bg-yellow-100 text-yellow-800",
    due: "bg-orange-100 text-orange-800",
    overdue: "bg-red-100 text-red-800",
    never_done: "bg-gray-100 text-gray-800",
    missing_policy: "bg-purple-100 text-purple-800",
    no_reminder: "bg-slate-100 text-slate-600",
    closed: "bg-gray-200 text-gray-800",
  }
  const statusLabels: Record<string, string> = {
    ok: "À jour",
    due_soon: "Bientôt due",
    due: "À échéance",
    overdue: "En retard",
    never_done: "Jamais réalisée",
    missing_policy: "Politique manquante",
    no_reminder: "Sans relance",
    closed: "Clôturée",
  }

  const statuses: DueStatus[] = ["overdue", "due", "due_soon", "ok", "never_done", "missing_policy", "no_reminder"]

  function getStatusLabel(status: string): string {
    const key = normalizeStatusKey(status)
    return statusLabels[key] ?? status
  }

  function getStatusClass(status: string): string {
    const key = normalizeStatusKey(status)
    return statusVariants[key] ?? "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Échéances</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> Échéances de formation
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Les échéances sont calculées automatiquement à partir des applicabilités et des sessions enregistrées.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleCompute} disabled={computing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${computing ? "animate-spin" : ""}`} />
          {computing ? "Calcul…" : "Recalculer les échéances"}
        </Button>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous les statuts</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune échéance. Cliquez « Recalculer » pour générer les échéances.</CardContent></Card>}

        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{orgName(item.organization_id)} — {courseName(item.course_id)}</p>
                <p className="text-xs text-muted-foreground">
                  Échéance : {item.due_date ?? "—"}
                  {item.last_session_date && ` · Dernière session : ${item.last_session_date}`}
                  {item.closed_at && ` · Clôturée le ${item.closed_at.slice(0, 10)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.closed_at ? statusVariants.closed : getStatusClass(item.status)}`}>
                  {item.closed_at ? statusLabels.closed : getStatusLabel(item.status)}
                </span>
                {!item.closed_at && (
                  <Button size="icon" variant="ghost" title="Clôturer" onClick={() => handleClose(item.id)}>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
