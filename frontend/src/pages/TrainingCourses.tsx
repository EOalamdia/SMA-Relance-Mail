import { useEffect, useState } from "react"
import { GraduationCap, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { TrainingCourse } from "../types/sma"
import { trainingCoursesApi } from "../services/api"

type EditState = { id: string; code: string; title: string; reminder_frequency_months: string; reminder_disabled: boolean }

export default function TrainingCoursesPage() {
  const [items, setItems] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCode, setNewCode] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newValidity, setNewValidity] = useState("")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try { const d = await trainingCoursesApi.list(); setItems(d.items) }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newCode.trim() || !newTitle.trim()) return
    setCreating(true)
    try {
      const c = await trainingCoursesApi.create({
        code: newCode.trim(), title: newTitle.trim(),
        reminder_frequency_months: newValidity ? parseInt(newValidity) : null,
      })
      setItems(p => [c, ...p]); setNewCode(""); setNewTitle(""); setNewValidity("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver cette formation ?")) return
    try { await trainingCoursesApi.archive(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await trainingCoursesApi.update(id, {
        code: editState.code.trim(), title: editState.title.trim(),
        reminder_frequency_months: editState.reminder_frequency_months ? parseInt(editState.reminder_frequency_months) : null,
        reminder_disabled: editState.reminder_disabled,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Formations</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Catalogue de formations
        </h1>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle formation</CardTitle>
          <CardDescription>Ajouter une formation au catalogue.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Code <span className="text-destructive">*</span></label>
              <input value={newCode} onChange={e => setNewCode(e.target.value)} required maxLength={50} placeholder="SST"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Libellé <span className="text-destructive">*</span></label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-36 space-y-1">
              <label className="text-sm font-medium">Validité (mois)</label>
              <input type="number" min={1} value={newValidity} onChange={e => setNewValidity(e.target.value)} placeholder="24"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating || !newCode.trim() || !newTitle.trim()}>{creating ? "…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={load}>Réessayer</Button></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune formation.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={editState.code} onChange={e => setEditState(p => p && { ...p, code: e.target.value })} placeholder="Code"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={editState.title} onChange={e => setEditState(p => p && { ...p, title: e.target.value })} placeholder="Libellé" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input type="number" min={1} value={editState.reminder_frequency_months} onChange={e => setEditState(p => p && { ...p, reminder_frequency_months: e.target.value })} placeholder="Validité (mois)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!editState.reminder_disabled} onChange={e => setEditState(p => p && { ...p, reminder_disabled: !e.target.checked })} /> Relance activée</label>
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
                <p className="font-medium"><code className="text-xs bg-muted px-1 py-0.5 rounded mr-2">{item.code}</code>{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.reminder_frequency_months ? `${item.reminder_frequency_months} mois` : "Pas de validité"}
                  {!item.reminder_disabled ? " · Relance activée" : " · Relance désactivée"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, code: item.code, title: item.title, reminder_frequency_months: item.reminder_frequency_months?.toString() ?? "", reminder_disabled: item.reminder_disabled })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleArchive(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
