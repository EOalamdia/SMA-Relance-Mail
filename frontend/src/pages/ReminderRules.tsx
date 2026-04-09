import { useEffect, useState } from "react"
import { Bell, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { ReminderRule, EmailTemplate } from "../types/sma"
import { reminderRulesApi, emailTemplatesApi } from "../services/api"

type EditState = {
  id: string; name: string; offset_sign: string; offset_value: string; offset_unit: string
  trigger_type: string; recipient_strategy: string; template_id: string
}

const PAGE_SIZE = 25

export default function ReminderRulesPage() {
  const [items, setItems] = useState<ReminderRule[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [newName, setNewName] = useState("")
  const [newSign, setNewSign] = useState("-1")
  const [newOffset, setNewOffset] = useState("30")
  const [newUnit, setNewUnit] = useState("day")
  const [newTrigger, setNewTrigger] = useState("before")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, page])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [r, t] = await Promise.all([
        reminderRulesApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        emailTemplatesApi.list(),
      ])
      setItems(r.items); setTotalCount(r.count); setTemplates(t.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newName.trim()) return
    setCreating(true)
    try {
      const c = await reminderRulesApi.create({
        name: newName.trim(),
        offset_sign: parseInt(newSign) as -1 | 0 | 1,
        offset_value: parseInt(newOffset),
        offset_unit: newUnit as "day" | "month",
        trigger_type: newTrigger as "before" | "on" | "after",
      })
      setItems(p => [c, ...p]); setNewName("")
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
        name: editState.name.trim(),
        offset_sign: parseInt(editState.offset_sign) as -1 | 0 | 1,
        offset_value: parseInt(editState.offset_value),
        offset_unit: editState.offset_unit as "day" | "month",
        trigger_type: editState.trigger_type as "before" | "on" | "after",
        recipient_strategy: editState.recipient_strategy as "primary" | "role" | "fallback",
        template_id: editState.template_id || null,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  function recipientStrategyLabel(strategy: string): string {
    if (strategy === "primary") return "Contact principal"
    if (strategy === "role") return "Par rôle"
    if (strategy === "fallback") return "Secours"
    return strategy
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Paramétrage</Badge>
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
              <input value={newName} onChange={e => setNewName(e.target.value)} required maxLength={255} placeholder="Relance J-30"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-sm font-medium">Signe</label>
              <select value={newSign} onChange={e => setNewSign(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="-1">- (avant)</option><option value="0">0 (jour J)</option><option value="1">+ (après)</option>
              </select>
            </div>
            <div className="w-24 space-y-1">
              <label className="text-sm font-medium">Décalage</label>
              <input type="number" min={0} value={newOffset} onChange={e => setNewOffset(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-28 space-y-1">
              <label className="text-sm font-medium">Unité</label>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="day">Jours</option><option value="month">Mois</option>
              </select>
            </div>
            <div className="w-32 space-y-1">
              <label className="text-sm font-medium">Déclencheur</label>
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="before">Avant échéance</option><option value="on">Jour J</option><option value="after">Après échéance</option>
              </select>
            </div>
            <Button type="submit" disabled={creating || !newName.trim()}>{creating ? "…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher une règle…"
      />

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucune règle de relance.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <input value={editState.name} onChange={e => setEditState(p => p && { ...p, name: e.target.value })} placeholder="Libellé"
                  className="col-span-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <select value={editState.template_id} onChange={e => setEditState(p => p && { ...p, template_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Modèle par défaut</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={editState.recipient_strategy} onChange={e => setEditState(p => p && { ...p, recipient_strategy: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="primary">Contact principal</option><option value="role">Par rôle</option><option value="fallback">Secours</option>
                </select>
                <select value={editState.offset_sign} onChange={e => setEditState(p => p && { ...p, offset_sign: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="-1">- (avant)</option><option value="0">0 (jour J)</option><option value="1">+ (après)</option>
                </select>
                <input type="number" min={0} value={editState.offset_value} onChange={e => setEditState(p => p && { ...p, offset_value: e.target.value })} placeholder="Décalage"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <select value={editState.offset_unit} onChange={e => setEditState(p => p && { ...p, offset_unit: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="day">Jours</option><option value="month">Mois</option>
                </select>
                <select value={editState.trigger_type} onChange={e => setEditState(p => p && { ...p, trigger_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="before">Avant échéance</option><option value="on">Jour J</option><option value="after">Après échéance</option>
                </select>
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
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.offset_sign < 0 ? "-" : item.offset_sign > 0 ? "+" : ""}{item.offset_value} {item.offset_unit === "day" ? "j" : "mois"}
                  · {item.trigger_type === "before" ? "avant" : item.trigger_type === "after" ? "après" : "jour J"} échéance
                  · {recipientStrategyLabel(item.recipient_strategy)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({
                  id: item.id, name: item.name,
                  offset_sign: item.offset_sign.toString(), offset_value: item.offset_value.toString(),
                  offset_unit: item.offset_unit, trigger_type: item.trigger_type,
                  recipient_strategy: item.recipient_strategy, template_id: item.template_id ?? "",
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
