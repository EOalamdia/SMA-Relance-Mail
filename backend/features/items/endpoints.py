"""Items CRUD endpoints — demonstration du schema app_starter.

PLACEHOLDER: Renommer le prefix, le schema et la table lors du clonage.
Tous les endpoints sont proteges par ForwardAuth (get_current_user).
RLS volontairement absent : l'acces est controle au niveau backend.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Response

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import ItemCreate, ItemOut, ItemsListResponse, ItemUpdate

# PLACEHOLDER: remplacer prefix + tags lors du clonage
router = APIRouter(prefix="/v1/items", tags=["Items"])

# Constantes schema/table — adapter lors du clonage
_SCHEMA = "app_starter"   # PLACEHOLDER: "app_<votre_slug>"
_TABLE = "items"           # PLACEHOLDER: "<votre_entite>"


def _items_table():
    """Retourne le handle PostgREST pour app_starter.items."""
    return get_schema_table(_SCHEMA, _TABLE)


# ---------------------------------------------------------------------------
# GET /v1/items
# ---------------------------------------------------------------------------

@router.get("", response_model=ItemsListResponse, summary="Lister tous les items")
def list_items(
    _user: UserContext = Depends(get_current_user),
) -> ItemsListResponse:
    """Retourne la liste complete des items, triee par date de creation desc."""
    response = (
        _items_table()
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    rows = response.data or []
    return ItemsListResponse(items=[ItemOut(**r) for r in rows], count=len(rows))


# ---------------------------------------------------------------------------
# GET /v1/items/{item_id}
# ---------------------------------------------------------------------------

@router.get("/{item_id}", response_model=ItemOut, summary="Recuperer un item par ID")
def get_item(
    item_id: UUID,
    _user: UserContext = Depends(get_current_user),
) -> ItemOut:
    """Retourne un item par son UUID. Retourne 404 si absent."""
    response = (
        _items_table()
        .select("*")
        .eq("id", str(item_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item non trouve.")
    return ItemOut(**response.data[0])


# ---------------------------------------------------------------------------
# POST /v1/items
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ItemOut,
    status_code=status.HTTP_201_CREATED,
    summary="Creer un item",
)
def create_item(
    payload: ItemCreate,
    _user: UserContext = Depends(get_current_user),
) -> ItemOut:
    """Insere un nouvel item et retourne l'enregistrement cree."""
    response = (
        _items_table()
        .insert(payload.model_dump())
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Echec de la creation de l'item.",
        )
    return ItemOut(**response.data[0])


# ---------------------------------------------------------------------------
# PATCH /v1/items/{item_id}
# ---------------------------------------------------------------------------

@router.patch("/{item_id}", response_model=ItemOut, summary="Mettre a jour partiellement un item")
def update_item(
    item_id: UUID,
    payload: ItemUpdate,
    _user: UserContext = Depends(get_current_user),
) -> ItemOut:
    """Mise a jour partielle : seuls les champs fournis sont modifies."""
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aucun champ a mettre a jour.",
        )

    # Verification existence
    exists = (
        _items_table()
        .select("id")
        .eq("id", str(item_id))
        .limit(1)
        .execute()
    )
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item non trouve.")

    response = (
        _items_table()
        .update(changes)
        .eq("id", str(item_id))
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Echec de la mise a jour de l'item.",
        )
    return ItemOut(**response.data[0])


# ---------------------------------------------------------------------------
# DELETE /v1/items/{item_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un item",
)
def delete_item(
    item_id: UUID,
    _user: UserContext = Depends(get_current_user),
) -> Response:
    """Supprime un item par son UUID. Retourne 404 si absent."""
    exists = (
        _items_table()
        .select("id")
        .eq("id", str(item_id))
        .limit(1)
        .execute()
    )
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item non trouve.")

    _items_table().delete().eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
