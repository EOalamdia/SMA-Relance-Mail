import { useEffect, useState } from "react"
import { Link2, Plus, Trash2 } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { CourseApplicability, Organization, TrainingCourse } from "../types/sma"
import { courseApplicabilityApi, organizationsApi, trainingCoursesApi } from "../services/api"

export default function CourseApplicabilityPage() {
  const [items, setItems] = useState<CourseApplicability[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newOrgId, setNewOrgId] = useState("")
  const [newCourseId, setNewCourseId] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [a, o, c] = await Promise.all([
        courseApplicabilityApi.list(),
        organizationsApi.list(),
        trainingCoursesApi.list(),
      ])
      setItems(a.items); setOrgs(o.items); setCourses(c.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function orgName(id: string) { return orgs.find(o => o.id === id)?.name ?? "—" }
  function courseName(id: string) { return courses.find(c => c.id === id)?.label ?? "—" }
  function courseCode(id: string) { return courses.find(c => c.id === id)?.code ?? "" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newOrgId || !newCourseId) return
    setCreating(true)
    try {
      const c = await courseApplicabilityApi.create({ organization_id: newOrgId, course_id: newCourseId })
      setItems(p => [c, ...p])
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Retirer cette applicabilité ?")) return
    try { await courseApplicabilityApi.remove(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Formations</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" /> Applicabilité des formations
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Associe chaque organisme aux formations qui lui sont applicables. Seules les paires présentes ici génèrent des échéances.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle association</CardTitle>
          <CardDescription>Lier un organisme à une formation.</CardDescription></CardHeader>
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
            <Button type="submit" disabled={creating || !newOrgId || !newCourseId}>{creating ? "…" : "Associer"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune association.</CardContent></Card>}

        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{orgName(item.organization_id)}</p>
                <p className="text-xs text-muted-foreground">
                  <code className="bg-muted px-1 py-0.5 rounded">{courseCode(item.course_id)}</code> {courseName(item.course_id)}
                  <span className="ml-2">· {item.scope_type}</span>
                </p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
