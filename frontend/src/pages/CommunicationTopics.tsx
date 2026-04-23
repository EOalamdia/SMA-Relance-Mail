import { useEffect, useState } from "react"
import { MessageSquare, Plus, Pencil } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui-core/components/ui/card"
import { TableToolbar, TablePagination } from "@ui-core/components/ui/table"

import type { CommunicationTopic, CommunicationTopicCreate, CommunicationTopicUpdate } from "../types/sma"
import { communicationTopicsApi } from "../services/api"

const PAGE_SIZE = 25

export default function CommunicationTopicsPage() {
  const [items, setItems] = useState<CommunicationTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Form state
  const [formCode, setFormCode] = useState("")
  const [formLabel, setFormLabel] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formUnsubscribable, setFormUnsubscribable] = useState(true)

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, page])

  async function load() {
    setLoading(true); setError(null)
    try {
      const d = await communicationTopicsApi.list({ search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      setItems(d.items); setTotalCount(d.count)
    }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur") }
    finally { setLoading(false) }
  }

  function resetForm() {
    setFormCode(""); setFormLabel(""); setFormDescription(""); setFormUnsubscribable(true)
    setShowCreate(false); setEditing(null)
  }

  function startEdit(item: CommunicationTopic) {
    setEditing(item.id)
    setFormCode(item.code)
    setFormLabel(item.label)
    setFormDescription(item.description ?? "")
    setFormUnsubscribable(item.is_unsubscribable)
    setShowCreate(false)
  }

  async function handleCreate() {
    try {
      const data: CommunicationTopicCreate = {
        code: formCode,
        label: formLabel,
        description: formDescription || undefined,
        is_unsubscribable: formUnsubscribable,
      }
      await communicationTopicsApi.create(data)
      resetForm()
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleUpdate(id: string) {
    try {
      const data: CommunicationTopicUpdate = {
        label: formLabel,
        description: formDescription || undefined,
        is_unsubscribable: formUnsubscribable,
      }
      await communicationTopicsApi.update(id, data)
      resetForm()
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleSetActive(item: CommunicationTopic, isActive: boolean) {
    const action = isActive ? "activer" : "désactiver"
    if (!confirm(`${action.charAt(0).toUpperCase()}${action.slice(1)} ce sujet de communication ?`)) return
    try {
      await communicationTopicsApi.setActive(item.id, isActive)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  async function handleDelete(item: CommunicationTopic) {
    if (!confirm(`Supprimer définitivement le sujet "${item.label}" ?`)) return
    try {
      await communicationTopicsApi.remove(item.id)
      load()
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur") }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge variant="gradient">Désinscription</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Sujets de communication
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Catégories d'e-mails permettant de gérer les désinscriptions par type de message.
        </p>
      </header>

      <div className="flex items-center gap-3">
        <Button onClick={() => { resetForm(); setShowCreate(true) }} variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Nouveau sujet
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Nouveau sujet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="new-topic-code" className="text-sm font-medium">Code <span className="text-destructive">*</span></label>
              <input id="new-topic-code" name="code" placeholder="Code (ex : rappels_formation)" value={formCode} onChange={e => setFormCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-topic-label" className="text-sm font-medium">Libellé <span className="text-destructive">*</span></label>
              <input id="new-topic-label" name="label" placeholder="Libellé" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-topic-description" className="text-sm font-medium">Description</label>
              <input id="new-topic-description" name="description" placeholder="Description (optionnel)" value={formDescription} onChange={e => setFormDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_unsubscribable" checked={formUnsubscribable} onChange={e => setFormUnsubscribable(e.target.checked)} />
              Désinscriptible
            </label>
            <div className="flex gap-2">
              <Button onClick={handleCreate} size="sm">Créer</Button>
              <Button onClick={resetForm} size="sm" variant="ghost">Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <TableToolbar
        onSearch={(v) => { setSearch(v); setPage(0) }}
        searchPlaceholder="Rechercher un sujet de communication…"
      />

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {error && <Card className="border-destructive/50"><CardContent className="pt-4"><p className="text-sm text-destructive">{error}</p></CardContent></Card>}
        {!loading && !error && items.length === 0 && <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">Aucun sujet de communication.</CardContent></Card>}

        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="pt-4">
              {editing === item.id ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="edit-topic-label" className="text-sm font-medium">Libellé</label>
                    <input id="edit-topic-label" name="label" value={formLabel} onChange={e => setFormLabel(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edit-topic-description" className="text-sm font-medium">Description</label>
                    <input id="edit-topic-description" name="description" value={formDescription} onChange={e => setFormDescription(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="is_unsubscribable" checked={formUnsubscribable} onChange={e => setFormUnsubscribable(e.target.checked)} />
                    Désinscriptible
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(item.id)} size="sm">Enregistrer</Button>
                    <Button onClick={resetForm} size="sm" variant="ghost">Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{item.code}</span>
                      {item.is_unsubscribable ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">Désinscriptible</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">Transactionnel</span>
                      )}
                      {!item.is_active && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Inactif</span>
                      )}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    {item.is_active ? (
                      <Button variant="ghost" size="sm" onClick={() => handleSetActive(item, false)} className="text-destructive">Désactiver</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleSetActive(item, true)}>Activer</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="text-destructive">Supprimer</Button>
                  </div>
                </div>
              )}
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
