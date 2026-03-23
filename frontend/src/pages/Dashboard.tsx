import { useEffect, useState } from "react"
import { BarChart3, AlertTriangle, CheckCircle2, Clock, Building2, GraduationCap, Bell } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import {
  dashboardApi,
} from "../services/api"
import type { DashboardSummary, DueRadarRow, OverdueRow, UpcomingReminderRow } from "../types/sma"

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [radar, setRadar] = useState<DueRadarRow[]>([])
  const [overdue, setOverdue] = useState<OverdueRow[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingReminderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      const [s, r, o, u] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.radar(),
        dashboardApi.overdue(),
        dashboardApi.upcomingReminders(),
      ])
      setSummary(s)
      setRadar(r)
      setOverdue(o)
      setUpcoming(u)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement du tableau de bord…</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!summary) return null

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Tableau de bord</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Tableau de bord SMA
        </h1>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4" /> Organismes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total_organizations}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Formations</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total_courses}</p></CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> En retard</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{summary.overdue_count}</p></CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600"><Clock className="h-4 w-4" /> Bientot dues</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{summary.due_soon_count}</p></CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> A jour</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{summary.ok_count}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Echeances totales</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total_due_items}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Relances en attente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.pending_jobs}</p></CardContent>
        </Card>
      </div>

      {/* Overdue table */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Formations en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Organisme</th>
                  <th className="pb-2 pr-4">Formation</th>
                  <th className="pb-2 pr-4">Echeance</th>
                  <th className="pb-2">Jours de retard</th>
                </tr></thead>
                <tbody>
                  {overdue.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.organization_name}</td>
                      <td className="py-2 pr-4">{r.course_label}</td>
                      <td className="py-2 pr-4">{r.due_date}</td>
                      <td className="py-2 font-semibold text-destructive">{r.days_overdue}j</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming reminders */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Prochaines relances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Organisme</th>
                  <th className="pb-2 pr-4">Formation</th>
                  <th className="pb-2 pr-4">Destinataire</th>
                  <th className="pb-2 pr-4">Prevue le</th>
                  <th className="pb-2">Statut</th>
                </tr></thead>
                <tbody>
                  {upcoming.slice(0, 20).map((r) => (
                    <tr key={r.job_id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.organization_name}</td>
                      <td className="py-2 pr-4">{r.course_label}</td>
                      <td className="py-2 pr-4">{r.recipient_email}</td>
                      <td className="py-2 pr-4">{new Date(r.scheduled_for).toLocaleDateString("fr-FR")}</td>
                      <td className="py-2"><Badge variant="outline">{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Radar */}
      {radar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Radar des echeances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Organisme</th>
                  <th className="pb-2 pr-4">Formation</th>
                  <th className="pb-2 pr-4">Echeance</th>
                  <th className="pb-2">Statut</th>
                </tr></thead>
                <tbody>
                  {radar.slice(0, 30).map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4">{r.organization_name}</td>
                      <td className="py-2 pr-4">{r.course_label}</td>
                      <td className="py-2 pr-4">{r.due_date ?? "—"}</td>
                      <td className="py-2"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ok: "bg-green-100 text-green-800",
    due_soon: "bg-yellow-100 text-yellow-800",
    due: "bg-orange-100 text-orange-800",
    overdue: "bg-red-100 text-red-800",
    never_done: "bg-gray-100 text-gray-800",
    missing_policy: "bg-purple-100 text-purple-800",
    no_reminder: "bg-slate-100 text-slate-600",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}
