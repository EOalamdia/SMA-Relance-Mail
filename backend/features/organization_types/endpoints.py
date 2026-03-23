"""CRUD endpoints for organization_types."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    OrganizationTypeCreate,
    OrganizationTypeListResponse,
    OrganizationTypeOut,
    OrganizationTypeUpdate,
)

router = APIRouter(prefix="/v1/organization-types", tags=["Organization Types"])

_SCHEMA = "sma_relance"
_TABLE = "organization_types"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=OrganizationTypeListResponse)
def list_organization_types(_user: UserContext = Depends(get_current_user)):
    response = _table().select("*").is_("archived_at", "null").order("name").execute()
    rows = response.data or []
    return OrganizationTypeListResponse(items=[OrganizationTypeOut(**r) for r in rows], count=len(rows))


@router.get("/{item_id}", response_model=OrganizationTypeOut)
def get_organization_type(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type d'organisation non trouve.")
    return OrganizationTypeOut(**response.data[0])


@router.post("", response_model=OrganizationTypeOut, status_code=status.HTTP_201_CREATED)
def create_organization_type(payload: OrganizationTypeCreate, _user: UserContext = Depends(get_current_user)):
    response = _table().insert(payload.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return OrganizationTypeOut(**response.data[0])


@router.patch("/{item_id}", response_model=OrganizationTypeOut)
def update_organization_type(item_id: UUID, payload: OrganizationTypeUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type d'organisation non trouve.")
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return OrganizationTypeOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_organization_type(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type d'organisation non trouve.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
