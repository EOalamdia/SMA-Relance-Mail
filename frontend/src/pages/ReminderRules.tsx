import { useEffect, useState } from "react"
import { Bell, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { ReminderRule, TrainingCourse, EmailTemplate } from "../types/sma"
import { reminderRulesApi, trainingCoursesApi, emailTemplatesApi } from "../services/api"

type EditState = {
  id: string; label: string; course_id: string; offset_value: string; offset_unit: string
  trigger_type: string; recipient_strategy: string; fallback_email: string; template_id: string
}

export default function ReminderRulesPage() {
  const [items, setItems] = useState<ReminderRule[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newLabel, setNewLabel] = useState("")
  const [newOffset, setNewOffset] = useState("30")
  const [newUnit, setNewUnit] = useState("days")
  const [newTrigger, setNewTrigger] = useState("before_due")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [r, c, t] = await Promise.all([
        reminderRulesApi.list(),
        trainingCoursesApi.list(),
        emailTemplatesApi.list(),
      ])
      setItems(r.items); setCourses(c.items); setTemplates(t.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function courseName(id: string | null) { return id ? courses.find(c => c.id === id)?.label ?? "—" : "Toutes" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newLabel.trim()) return
    setCreating(true)
    try {
      const c = await reminderRulesApi.create({
        label: newLabel.trim(),
        offset_value: parseInt(newOffset),
        offset_unit: newUnit as "days" | "weeks" | "months",
        trigger_type: newTrigger as "before_due" | "after_due",
      })
      setItems(p => [c, ...p]); setNewLabel("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver cette règle ?")) return
    try { await reminderRulesApi.archive(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await reminderRulesApi.update(id, {
        label: editState.label.trim(),
        course_id: editState.course_id || null,
        offset_value: parseInt(editState.offset_value),
        offset_unit: editState.offset_unit as "days" | "weeks" | "months",
        trigger_type: editState.trigger_type as "before_due" | "after_due",
        recipient_strategy: editState.recipient_strategy as "primary_contact" | "fallback_email" | "both",
        fallback_email: editState.fallback_email.trim() || null,
        template_id: editState.template_id || null,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Parametrage</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Règles de relance
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Configurez quand et comment envoyer les relances. Chaque règle définit un décalage par rapport à l'échéance.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle règle</CardTitle>
          <CardDescription>Créer une règle de relance rapide.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Libellé <span className="text-destructive">*</span></label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} required maxLength={255} placeholder="Relance J-30"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-sm font-medium">Décalage</label>
              <input type="number" min={1} value={newOffset} onChange={e => setNewOffset(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-28 space-y-1">
              <label className="text-sm font-medium">Unité</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="days">Jours</option><option value="weeks">Semaines</option><option value="months">Mois</option>
              </select>
            </div>
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Déclencheur</label>
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="before_due">Avant échéance</option><option value="after_due">Après échéance</option>
              </select>
            </div>
            <Button type="submit" disabled={creating || !newLabel.trim()}>{creating ? "…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune règle de relance.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <input value={editState.label} onChange={e => setEditState(p => p && { ...p, label: e.target.value })} placeholder="Libellé"
                  className="col-span-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <select value={editState.course_id} onChange={e => setEditState(p => p && { ...p, course_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Toutes les formations</option>
                  {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.label}</option>)}
                </select>
                <select value={editState.template_id} onChange={e => setEditState(p => p && { ...p, template_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Template par défaut</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input type="number" min={1} value={editState.offset_value} onChange={e => setEditState(p => p && { ...p, offset_value: e.target.value })} placeholder="Décalage"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <select value={editState.offset_unit} onChange={e => setEditState(p => p && { ...p, offset_unit: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="days">Jours</option><option value="weeks">Semaines</option><option value="months">Mois</option>
                </select>
                <select value={editState.trigger_type} onChange={e => setEditState(p => p && { ...p, trigger_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="before_due">Avant échéance</option><option value="after_due">Après échéance</option>
                </select>
                <select value={editState.recipient_strategy} onChange={e => setEditState(p => p && { ...p, recipient_strategy: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="primary_contact">Contact principal</option><option value="fallback_email">Email fallback</option><option value="both">Les deux</option>
                </select>
                <input type="email" value={editState.fallback_email} onChange={e => setEditState(p => p && { ...p, fallback_email: e.target.value })} placeholder="Email fallback" className="col-span-full w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.offset_value} {item.offset_unit} {item.trigger_type === "before_due" ? "avant" : "après"} échéance
                  · Formation : {courseName(item.course_id)}
                  · Destinataire : {item.recipient_strategy.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({
                  id: item.id, label: item.label, course_id: item.course_id ?? "",
                  offset_value: item.offset_value.toString(), offset_unit: item.offset_unit,
                  trigger_type: item.trigger_type, recipient_strategy: item.recipient_strategy,
                  fallback_email: item.fallback_email ?? "", template_id: item.template_id ?? "",
                })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleArchive(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
