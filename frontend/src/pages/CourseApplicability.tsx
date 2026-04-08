import { useEffect, useState } from "react"
import { Link2, Plus, Trash2 } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TablePagination } from "@ui-core/components/ui/table"

import type { CourseApplicability, Organization, OrganizationType, TrainingCourse } from "../types/sma"
import { courseApplicabilityApi, organizationsApi, organizationTypesApi, trainingCoursesApi } from "../services/api"

type ScopeMode = "organization" | "organization_type"

const PAGE_SIZE = 25

export default function CourseApplicabilityPage() {
  const [items, setItems] = useState<CourseApplicability[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [scopeMode, setScopeMode] = useState<ScopeMode>("organization")
  const [newOrgId, setNewOrgId] = useState("")
  const [newOrgTypeId, setNewOrgTypeId] = useState("")
  const [newCourseId, setNewCourseId] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => { load() }, [page])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [a, o, ot, c] = await Promise.all([
        courseApplicabilityApi.list(undefined, undefined, undefined, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        organizationsApi.list(),
        organizationTypesApi.list(),
        trainingCoursesApi.list(),
      ])
      setItems(a.items); setTotalCount(a.count); setOrgs(o.items); setOrgTypes(ot.items); setCourses(c.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function orgName(id: string | null) { return id ? orgs.find(o => o.id === id)?.name ?? "—" : "—" }
  function orgTypeName(id: string | null) { return id ? orgTypes.find(t => t.id === id)?.name ?? "—" : "—" }
  function courseName(id: string) { return courses.find(c => c.id === id)?.title ?? "—" }
  function courseCode(id: string) { return courses.find(c => c.id === id)?.code ?? "" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const targetId = scopeMode === "organization" ? newOrgId : newOrgTypeId
    if (!targetId || !newCourseId) return
    setCreating(true)
    try {
      const data = scopeMode === "organization"
        ? { organization_id: newOrgId, course_id: newCourseId }
        : { organization_type_id: newOrgTypeId, course_id: newCourseId }
      const c = await courseApplicabilityApi.create(data)
      setItems(p => [c, ...p]); setNewOrgId(""); setNewOrgTypeId(""); setNewCourseId("")
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
          Associe chaque organisme ou type d'organisme aux formations qui lui sont applicables. Seules les paires présentes ici génèrent des échéances.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle association</CardTitle>
          <CardDescription>Lier un organisme ou un type d'organisme à une formation.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="scope" checked={scopeMode === "organization"} onChange={() => { setScopeMode("organization"); setNewOrgTypeId("") }} />
                Organisme
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="scope" checked={scopeMode === "organization_type"} onChange={() => { setScopeMode("organization_type"); setNewOrgId("") }} />
                Type d'organisme
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {scopeMode === "organization" ? (
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium">Organisme <span className="text-destructive">*</span></label>
                  <select value={newOrgId} onChange={e => setNewOrgId(e.target.value)} required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Choisir…</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium">Type d'organisme <span className="text-destructive">*</span></label>
                  <select value={newOrgTypeId} onChange={e => setNewOrgTypeId(e.target.value)} required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Choisir…</option>
                    {orgTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Formation <span className="text-destructive">*</span></label>
                <select value={newCourseId} onChange={e => setNewCourseId(e.target.value)} required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Choisir…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.title}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={creating || !(scopeMode === "organization" ? newOrgId : newOrgTypeId) || !newCourseId}>{creating ? "…" : "Associer"}</Button>
            </div>
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
                {item.organization_id ? (
                  <p className="font-medium">{orgName(item.organization_id)}</p>
                ) : (
                  <p className="font-medium">
                    <Badge variant="outline" className="mr-2 text-xs">Type</Badge>
                    {orgTypeName(item.organization_type_id)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  <code className="bg-muted px-1 py-0.5 rounded">{courseCode(item.course_id)}</code> {courseName(item.course_id)}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
