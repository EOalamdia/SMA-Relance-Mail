"""CRUD endpoints for organization_contacts."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    ContactCreate,
    ContactListResponse,
    ContactOut,
    ContactUpdate,
)

router = APIRouter(prefix="/v1/contacts", tags=["Contacts"])

_SCHEMA = "sma_relance"
_TABLE = "organization_contacts"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=ContactListResponse)
def list_contacts(
    organization_id: UUID | None = Query(None, description="Filtrer par organisation"),
    search: str | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*", count="exact").is_("archived_at", "null")
    if organization_id:
        query = query.eq("organization_id", str(organization_id))
    if search:
        query = query.or_(f"first_name.ilike.%{search}%,last_name.ilike.%{search}%,email.ilike.%{search}%,role.ilike.%{search}%")
    query = query.order("last_name")
    if limit > 0:
        query = query.range(offset, offset + limit - 1)
    response = query.execute()
    rows = response.data or []
    return ContactListResponse(items=[ContactOut(**r) for r in rows], count=response.count or 0)


@router.get("/{item_id}", response_model=ContactOut)
def get_contact(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact non trouve.")
    return ContactOut(**response.data[0])


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, _user: UserContext = Depends(get_current_user)):
    data = payload.model_dump()
    data["organization_id"] = str(data["organization_id"])

    # If marking as primary, unmark existing primary for this org
    if data.get("is_primary"):
        _table().update({"is_primary": False}).eq(
            "organization_id", data["organization_id"]
        ).eq("is_primary", True).execute()

    response = _table().insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return ContactOut(**response.data[0])


@router.patch("/{item_id}", response_model=ContactOut)
def update_contact(item_id: UUID, payload: ContactUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    exists = _table().select("id, organization_id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact non trouve.")

    # If setting as primary, unmark existing primary for this org
    if changes.get("is_primary"):
        org_id = exists.data[0]["organization_id"]
        _table().update({"is_primary": False}).eq(
            "organization_id", org_id
        ).eq("is_primary", True).neq("id", str(item_id)).execute()

    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return ContactOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_contact(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact non trouve.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
