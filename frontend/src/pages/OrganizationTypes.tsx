import { useEffect, useState } from "react"
import { Tags, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { OrganizationType } from "../types/sma"
import { organizationTypesApi } from "../services/api"

type EditState = { id: string; name: string; description: string }

const PAGE_SIZE = 25

export default function OrganizationTypesPage() {
  const [items, setItems] = useState<OrganizationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
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
      const d = await organizationTypesApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setItems(d.items); setTotalCount(d.count)
    }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await organizationTypesApi.create({ name: newName.trim(), description: newDesc.trim() || null })
      setItems(p => [c, ...p]); setNewName(""); setNewDesc("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver ce type ?")) return
    try { await organizationTypesApi.archive(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await organizationTypesApi.update(id, { name: editState.name.trim(), description: editState.description.trim() || null })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Référentiels</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Tags className="h-6 w-6 text-primary" /> Types d'organismes
        </h1>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau type</CardTitle>
          <CardDescription>Ajouter un type d'organisme (ex: EHPAD, Clinique…).</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label htmlFor="new-orgtype-name" className="text-sm font-medium">Nom <span className="text-destructive">*</span></label>
              <input id="new-orgtype-name" name="name" value={newName} onChange={e => setNewName(e.target.value)} required maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="new-orgtype-desc" className="text-sm font-medium">Description</label>
              <input id="new-orgtype-desc" name="description" value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={2000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating || !newName.trim()}>{creating ? "Création…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher un type…"
      />

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={load}>Réessayer</Button></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun type d'organisme. Créez-en un ci-dessus.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <input name="name" value={editState.name} onChange={e => setEditState(p => p && { ...p, name: e.target.value })} maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input name="description" value={editState.description} onChange={e => setEditState(p => p && { ...p, description: e.target.value })} maxLength={2000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <p className="font-medium">{item.name}</p>
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, name: item.name, description: item.description ?? "" })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleArchive(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
