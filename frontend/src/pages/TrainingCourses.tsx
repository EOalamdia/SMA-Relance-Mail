import { useEffect, useState } from "react"
import { GraduationCap, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { TrainingCourse } from "../types/sma"
import { trainingCoursesApi } from "../services/api"

type EditState = { id: string; code: string; label: string; description: string; validity_months: string; reminder_enabled: boolean }

export default function TrainingCoursesPage() {
  const [items, setItems] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCode, setNewCode] = useState("")
  const [newLabel, setNewLabel] = useState("")
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
    e.preventDefault(); if (!newCode.trim() || !newLabel.trim()) return
    setCreating(true)
    try {
      const c = await trainingCoursesApi.create({
        code: newCode.trim(), label: newLabel.trim(),
        validity_months: newValidity ? parseInt(newValidity) : null,
      })
      setItems(p => [c, ...p]); setNewCode(""); setNewLabel(""); setNewValidity("")
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
        code: editState.code.trim(), label: editState.label.trim(),
        description: editState.description.trim() || null,
        validity_months: editState.validity_months ? parseInt(editState.validity_months) : null,
        reminder_enabled: editState.reminder_enabled,
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
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} required maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-36 space-y-1">
              <label className="text-sm font-medium">Validité (mois)</label>
              <input type="number" min={1} value={newValidity} onChange={e => setNewValidity(e.target.value)} placeholder="24"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating || !newCode.trim() || !newLabel.trim()}>{creating ? "…" : "Créer"}</Button>
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
              <div className="grid gap-3 sm:grid-cols-4">
                <input value={editState.code} onChange={e => setEditState(p => p && { ...p, code: e.target.value })} placeholder="Code"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={editState.label} onChange={e => setEditState(p => p && { ...p, label: e.target.value })} placeholder="Libellé" className="col-span-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input type="number" min={1} value={editState.validity_months} onChange={e => setEditState(p => p && { ...p, validity_months: e.target.value })} placeholder="Validité (mois)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea value={editState.description} onChange={e => setEditState(p => p && { ...p, description: e.target.value })} placeholder="Description" rows={2} className="col-span-full w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editState.reminder_enabled} onChange={e => setEditState(p => p && { ...p, reminder_enabled: e.target.checked })} /> Relance activée</label>
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
                <p className="font-medium"><code className="text-xs bg-muted px-1 py-0.5 rounded mr-2">{item.code}</code>{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.validity_months ? `${item.validity_months} mois` : "Pas de validité"}
                  {item.reminder_enabled ? " · Relance activée" : " · Relance désactivée"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, code: item.code, label: item.label, description: item.description ?? "", validity_months: item.validity_months?.toString() ?? "", reminder_enabled: item.reminder_enabled })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleArchive(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
