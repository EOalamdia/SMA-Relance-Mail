import { useEffect, useState } from "react"
import { CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { TrainingSession, Organization, TrainingCourse } from "../types/sma"
import { trainingSessionsApi, organizationsApi, trainingCoursesApi } from "../services/api"

type EditState = { id: string; session_date: string; expiry_date: string; status: string; provider: string; notes: string }

export default function TrainingSessionsPage() {
  const [items, setItems] = useState<TrainingSession[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOrg, setFilterOrg] = useState("")
  const [filterCourse, setFilterCourse] = useState("")

  const [newOrgId, setNewOrgId] = useState("")
  const [newCourseId, setNewCourseId] = useState("")
  const [newDate, setNewDate] = useState("")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [filterOrg, filterCourse])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [s, o, c] = await Promise.all([
        trainingSessionsApi.list(filterOrg || undefined, filterCourse || undefined),
        organizationsApi.list(),
        trainingCoursesApi.list(),
      ])
      setItems(s.items); setOrgs(o.items); setCourses(c.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function orgName(id: string) { return orgs.find(o => o.id === id)?.name ?? "—" }
  function courseName(id: string) { return courses.find(c => c.id === id)?.label ?? "—" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newOrgId || !newCourseId || !newDate) return
    setCreating(true)
    try {
      const c = await trainingSessionsApi.create({ organization_id: newOrgId, course_id: newCourseId, session_date: newDate })
      setItems(p => [c, ...p]); setNewDate("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette session ?")) return
    try { await trainingSessionsApi.remove(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await trainingSessionsApi.update(id, {
        session_date: editState.session_date,
        expiry_date: editState.expiry_date || null,
        status: editState.status as "planned" | "completed" | "cancelled",
        provider: editState.provider.trim() || null,
        notes: editState.notes.trim() || null,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  const statusColors: Record<string, string> = {
    planned: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Formations</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Sessions de formation
        </h1>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous les organismes</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Toutes les formations</option>
          {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.label}</option>)}
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle session</CardTitle>
          <CardDescription>Enregistrer une session de formation.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Organisme <span className="text-destructive">*</span></label>
              <select value={newOrgId} onChange={e => setNewOrgId(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Choisir…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Formation <span className="text-destructive">*</span></label>
              <select value={newCourseId} onChange={e => setNewCourseId(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Choisir…</option>
                {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.label}</option>)}
              </select>
            </div>
            <div className="w-44 space-y-1">
              <label className="text-sm font-medium">Date <span className="text-destructive">*</span></label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating || !newOrgId || !newCourseId || !newDate}>{creating ? "…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune session.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1"><label className="text-xs font-medium">Date session</label><input type="date" value={editState.session_date} onChange={e => setEditState(p => p && { ...p, session_date: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                <div className="space-y-1"><label className="text-xs font-medium">Date expiration</label><input type="date" value={editState.expiry_date} onChange={e => setEditState(p => p && { ...p, expiry_date: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
                <div className="space-y-1"><label className="text-xs font-medium">Statut</label><select value={editState.status} onChange={e => setEditState(p => p && { ...p, status: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="planned">Planifiée</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option>
                </select></div>
                <input value={editState.provider} onChange={e => setEditState(p => p && { ...p, provider: e.target.value })} placeholder="Prestataire"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea value={editState.notes} onChange={e => setEditState(p => p && { ...p, notes: e.target.value })} placeholder="Notes" rows={2} className="col-span-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave(item.id)} disabled={saving}><Save className="h-3 w-3 mr-1" />{saving ? "…" : "Enregistrer"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditState(null)}><X className="h-3 w-3 mr-1" />Annuler</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{orgName(item.organization_id)} — {courseName(item.course_id)}</p>
                <p className="text-xs text-muted-foreground">
                  {item.session_date}
                  {item.expiry_date && ` → ${item.expiry_date}`}
                  {item.provider && ` · ${item.provider}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status] ?? ""}`}>{item.status}</span>
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, session_date: item.session_date, expiry_date: item.expiry_date ?? "", status: item.status, provider: item.provider ?? "", notes: item.notes ?? "" })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
