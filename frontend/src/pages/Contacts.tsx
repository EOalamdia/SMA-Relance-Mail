import { useEffect, useState } from "react"
import { Users, Pencil, Plus, Save, Trash2, X, Star } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { Contact, Organization } from "../types/sma"
import { contactsApi, organizationsApi } from "../services/api"

type EditState = { id: string; first_name: string; last_name: string; email: string; phone: string; role: string; is_primary: boolean }

const PAGE_SIZE = 25

export default function ContactsPage() {
  const [items, setItems] = useState<Contact[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterOrg, setFilterOrg] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [newFirst, setNewFirst] = useState("")
  const [newLast, setNewLast] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newOrgId, setNewOrgId] = useState("")
  const [creating, setCreating] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, page, filterOrg])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [cs, os] = await Promise.all([
        contactsApi.list(filterOrg || undefined, { search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
        organizationsApi.list(),
      ])
      setItems(cs.items); setTotalCount(cs.count); setOrgs(os.items)
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function orgName(id: string) { return orgs.find(o => o.id === id)?.name ?? "—" }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const email = newEmail.trim()
    const phone = newPhone.trim()
    if (!newFirst.trim() || !newLast.trim() || !newOrgId || (!email && !phone)) return
    setCreating(true)
    try {
      const c = await contactsApi.create({
        organization_id: newOrgId,
        first_name: newFirst.trim(),
        last_name: newLast.trim(),
        email: email || null,
        phone: phone || null,
      })
      setItems(p => [c, ...p]); setNewFirst(""); setNewLast(""); setNewEmail(""); setNewPhone("")
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setCreating(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce contact ?")) return
    try { await contactsApi.remove(id); setItems(p => p.filter(i => i.id !== id)) }
    catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSave(id: string) {
    if (!editState) return
    const email = editState.email.trim()
    const phone = editState.phone.trim()
    if (!email && !phone) {
      alert("Renseignez au moins un e-mail ou un téléphone.")
      return
    }
    setSaving(true)
    try {
      const u = await contactsApi.update(id, {
        first_name: editState.first_name.trim(), last_name: editState.last_name.trim(),
        email: email || null, phone: phone || null,
        role: editState.role.trim() || null, is_primary: editState.is_primary,
      })
      setItems(p => p.map(i => i.id === id ? u : i)); setEditState(null)
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Référentiels</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Contacts
        </h1>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="filter-contact-org" className="text-sm font-medium">Organisme :</label>
        <select id="filter-contact-org" name="filter-contact-org" value={filterOrg} onChange={e => { setFilterOrg(e.target.value); setPage(0) }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Tous</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher un contact…"
      />

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="h-4 w-4" /> Nouveau contact</CardTitle>
          <CardDescription>Ajouter un contact à un organisme.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3 items-end">
            <div className="space-y-1">
              <label htmlFor="new-contact-first" className="text-sm font-medium">Prénom <span className="text-destructive">*</span></label>
              <input id="new-contact-first" name="first_name" value={newFirst} onChange={e => setNewFirst(e.target.value)} required maxLength={100}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-contact-last" className="text-sm font-medium">Nom <span className="text-destructive">*</span></label>
              <input id="new-contact-last" name="last_name" value={newLast} onChange={e => setNewLast(e.target.value)} required maxLength={100}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-contact-email" className="text-sm font-medium">E-mail</label>
              <input id="new-contact-email" name="email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} maxLength={255}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-contact-phone" className="text-sm font-medium">Téléphone</label>
              <input id="new-contact-phone" name="phone" type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} maxLength={50}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-contact-org" className="text-sm font-medium">Organisme <span className="text-destructive">*</span></label>
              <select id="new-contact-org" name="organization_id" value={newOrgId} onChange={e => setNewOrgId(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Choisir…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={creating || !newFirst.trim() || !newLast.trim() || !newOrgId || (!newEmail.trim() && !newPhone.trim())}>{creating ? "…" : "Créer"}</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Au moins un champ est requis: e-mail ou téléphone.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun contact.</CardContent></Card>}

        {items.map(item => editState?.id === item.id ? (
          <Card key={item.id} className="border-primary/40">
            <CardContent className="pt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <input name="first_name" value={editState.first_name} onChange={e => setEditState(p => p && { ...p, first_name: e.target.value })} placeholder="Prénom"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input name="last_name" value={editState.last_name} onChange={e => setEditState(p => p && { ...p, last_name: e.target.value })} placeholder="Nom"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input type="email" name="email" value={editState.email} onChange={e => setEditState(p => p && { ...p, email: e.target.value })} placeholder="E-mail"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input name="phone" type="tel" value={editState.phone} onChange={e => setEditState(p => p && { ...p, phone: e.target.value })} placeholder="Téléphone"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input name="role" value={editState.role} onChange={e => setEditState(p => p && { ...p, role: e.target.value })} placeholder="Rôle"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_primary" checked={editState.is_primary} onChange={e => setEditState(p => p && { ...p, is_primary: e.target.checked })} /> Contact principal</label>
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
                <p className="font-medium flex items-center gap-1">
                  {item.is_primary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                  {item.first_name} {item.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {orgName(item.organization_id)}
                  {item.phone ? ` · ${item.phone}` : ""}
                  {item.email ? ` · ${item.email}` : ""}
                  {item.role ? ` · ${item.role}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditState({ id: item.id, first_name: item.first_name, last_name: item.last_name, email: item.email ?? "", phone: item.phone ?? "", role: item.role ?? "", is_primary: item.is_primary })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
