import { useEffect, useState } from "react"
import { Building2, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"

import type { Organization, OrganizationType } from "../types/sma"
import { organizationsApi, organizationTypesApi } from "../services/api"

type EditState = { id: string; name: string; type_id: string; address: string; phone: string; email: string; notes: string }

export default function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([])
  const [types, setTypes] = useState<OrganizationType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState("")

  const [newName, setNewName] = useState("")
  const [newTypeId, setNewTypeId] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [filterType])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [orgs, ts] = await Promise.all([
        organizationsApi.list(filterType || undefined),
        organizationTypesApi.list(),
      ])
      setItems(orgs.items); setTypes(ts.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function typeName(id: string) { return types.find(t => t.id === id)?.name ?? "—" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!newName.trim() || !newTypeId) return
    setCreating(true)
    try {
      const c = await organizationsApi.create({ name: newName.trim(), type_id: newTypeId, email: newEmail.trim() || null })
      setItems(p => [c, ...p]); setNewName(""); setNewEmail("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archiver cet organisme ?")) return
    try { await organizationsApi.archive(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return; setSaving(true)
    try {
      const u = await organizationsApi.update(id, {
        name: editState.name.trim(),
        type_id: editState.type_id,
        address: editState.address.trim() || null,
        phone: editState.phone.trim() || null,
        email: editState.email.trim() || null,
        notes: editState.notes.trim() || null,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Referentiels</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Organismes
        </h1>
      </header>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Filtrer par type :</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvel organisme</CardTitle>
          <CardDescription>Ajouter un organisme au referentiel.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Nom <span className="text-destructive">*</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} required maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="w-48 space-y-1">
              <label className="text-sm font-medium">Type <span className="text-destructive">*</span></label>
              <select value={newTypeId} onChange={e => setNewTypeId(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Choisir…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Email</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" disabled={creating || !newName.trim() || !newTypeId}>{creating ? "Création…" : "Créer"}</Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" className="mt-2" onClick={load}>Réessayer</Button></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun organisme.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={editState.name} onChange={e => setEditState(p => p && { ...p, name: e.target.value })} placeholder="Nom" maxLength={255}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <select value={editState.type_id} onChange={e => setEditState(p => p && { ...p, type_id: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input value={editState.email} onChange={e => setEditState(p => p && { ...p, email: e.target.value })} placeholder="Email"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={editState.phone} onChange={e => setEditState(p => p && { ...p, phone: e.target.value })} placeholder="Téléphone"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input value={editState.address} onChange={e => setEditState(p => p && { ...p, address: e.target.value })} placeholder="Adresse" className="col-span-full w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea value={editState.notes} onChange={e => setEditState(p => p && { ...p, notes: e.target.value })} placeholder="Notes" rows={2} className="col-span-full w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <p className="text-xs text-muted-foreground">{typeName(item.type_id)} {item.email ? `· ${item.email}` : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, name: item.name, type_id: item.type_id, address: item.address ?? "", phone: item.phone ?? "", email: item.email ?? "", notes: item.notes ?? "" })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleArchive(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
