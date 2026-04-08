import { useEffect, useState } from "react"
import { Mail, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { EmailTemplate } from "../types/sma"
import { emailTemplatesApi } from "../services/api"

type EditState = { id: string; key: string; name: string; subject_template: string; body_template: string }

const PAGE_SIZE = 25

export default function EmailTemplatesPage() {
  const [items, setItems] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newKey, setNewKey] = useState("")
  const [newName, setNewName] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newBody, setNewBody] = useState("")
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
      const d = await emailTemplatesApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setItems(d.items); setTotalCount(d.count)
    }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newKey.trim() || !newName.trim() || !newSubject.trim() || !newBody.trim()) return
    setCreating(true)
    try {
      const c = await emailTemplatesApi.create({ key: newKey.trim(), name: newName.trim(), subject_template: newSubject.trim(), body_template: newBody })
      setItems(p => [c, ...p]); setNewKey(""); setNewName(""); setNewSubject(""); setNewBody("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver ce modèle ?")) return
    try { await emailTemplatesApi.archive(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await emailTemplatesApi.update(id, {
        key: editState.key.trim(), name: editState.name.trim(),
        subject_template: editState.subject_template.trim(),
        body_template: editState.body_template,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Paramétrage</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Modèles d'e-mail
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Variables disponibles : {"{{organization_name}}"}, {"{{course_label}}"}, {"{{due_date}}"}, {"{{contact_name}}"}.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau modèle</CardTitle>
          <CardDescription>Créer un modèle d'e-mail de relance.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Clé <span className="text-destructive">*</span></label>
                <input value={newKey} onChange={e => setNewKey(e.target.value)} required maxLength={100} placeholder="relance_standard"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Libellé <span className="text-destructive">*</span></label>
                <input value={newName} onChange={e => setNewName(e.target.value)} required maxLength={255}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Sujet <span className="text-destructive">*</span></label>
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)} required maxLength={500}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Corps (texte brut ou HTML) <span className="text-destructive">*</span></label>
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} required rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating}>{creating ? "Création…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher un modèle…"
      />

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun modèle.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={editState.key} onChange={e => setEditState(p => p && { ...p, key: e.target.value })} placeholder="Clé"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={editState.name} onChange={e => setEditState(p => p && { ...p, name: e.target.value })} placeholder="Libellé"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <input value={editState.subject_template} onChange={e => setEditState(p => p && { ...p, subject_template: e.target.value })} placeholder="Sujet"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea value={editState.body_template} onChange={e => setEditState(p => p && { ...p, body_template: e.target.value })} rows={6} placeholder="Corps"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <p className="text-xs text-muted-foreground">
                  <code className="bg-muted px-1 py-0.5 rounded">{item.key}</code> · Sujet : {item.subject_template}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({
                  id: item.id, key: item.key, name: item.name,
                  subject_template: item.subject_template, body_template: item.body_template,
                })}><Pencil className="h-4 w-4" /></Button>
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
