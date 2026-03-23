/**
 * Items — page de demonstration CRUD pour le schema app_starter.
 *
 * PLACEHOLDER: Renommer cette page, son titre et ses appels API
 * pour correspondre au domaine metier de la nouvelle app.
 */
import { useEffect, useState } from "react"
import { Database, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Badge } from "@ui-core/components/ui/badge"
import { Button } from "@ui-core/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui-core/components/ui/card"

import { type ItemOut, itemsApi } from "../services/api"

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type EditState = {
  id: string
  name: string
  description: string
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function ItemsPage() {
  const [items, setItems] = useState<ItemOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulaire de creation
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edition inline
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  // -------------------------------------------------------------------------
  // Chargement initial
  // -------------------------------------------------------------------------

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    setError(null)
    try {
      const data = await itemsApi.list()
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement.")
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await itemsApi.create({
        name: newName.trim(),
        description: newDescription.trim() || null,
      })
      setItems((prev) => [created, ...prev])
      setNewName("")
      setNewDescription("")
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur lors de la creation.")
    } finally {
      setCreating(false)
    }
  }

  // -------------------------------------------------------------------------
  // Suppression
  // -------------------------------------------------------------------------

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet item ?")) return
    try {
      await itemsApi.remove(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression.")
    }
  }

  // -------------------------------------------------------------------------
  // Edition inline
  // -------------------------------------------------------------------------

  function startEdit(item: ItemOut) {
    setEditState({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
    })
  }

  function cancelEdit() {
    setEditState(null)
  }

  async function handleSaveEdit(id: string) {
    if (!editState) return
    setSaving(true)
    try {
      const updated = await itemsApi.update(id, {
        name: editState.name.trim(),
        description: editState.description.trim() || null,
      })
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
      setEditState(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.")
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <header className="space-y-2">
        {/* PLACEHOLDER: adapter le badge et le titre au domaine metier */}
        <Badge variant="gradient">Demo CRUD</Badge>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Items — demo Supabase
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Demonstration du CRUD complet sur le schema{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">app_starter.items</code>.{" "}
          {/* PLACEHOLDER: remplacer cette description par le contexte metier reel */}
          Ce schema et cette table sont des <strong>placeholders</strong> a renommer lors du clonage.
        </p>
      </header>

      {/* Formulaire de creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvel item
          </CardTitle>
          <CardDescription>
            {/* PLACEHOLDER: adapter le libelle au domaine */}
            Ajouter un item dans la base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label htmlFor="new-name" className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </label>
              <input
                id="new-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de l'item…"
                maxLength={255}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label htmlFor="new-description" className="text-sm font-medium">
                Description
              </label>
              <input
                id="new-description"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optionnel)…"
                maxLength={2000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" disabled={creating || !newName.trim()}>
              {creating ? "Création…" : "Créer"}
            </Button>
          </form>
          {createError && (
            <p className="mt-2 text-sm text-destructive">{createError}</p>
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        )}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadItems}>
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}
        {!loading && !error && items.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Aucun item pour l'instant. Créez-en un avec le formulaire ci-dessus.
            </CardContent>
          </Card>
        )}
        {items.map((item) =>
          editState?.id === item.id ? (
            /* Mode edition */
            <Card key={item.id} className="border-primary/40">
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nom</label>
                  <input
                    type="text"
                    value={editState.name}
                    onChange={(e) =>
                      setEditState((prev) => prev && { ...prev, name: e.target.value })
                    }
                    maxLength={255}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <input
                    type="text"
                    value={editState.description}
                    onChange={(e) =>
                      setEditState((prev) => prev && { ...prev, description: e.target.value })
                    }
                    maxLength={2000}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={saving || !editState.name.trim()}
                    onClick={() => handleSaveEdit(item.id)}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Sauvegarde…" : "Sauvegarder"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Mode affichage */
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">Pas de description</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 font-mono">{item.id}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Modifier"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Supprimer"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
