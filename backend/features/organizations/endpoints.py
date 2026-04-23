"""CRUD endpoints for organizations."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationOut,
    OrganizationUpdate,
)

router = APIRouter(prefix="/v1/organizations", tags=["Organizations"])

_SCHEMA = "sma_relance"
_TABLE = "organizations"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=OrganizationListResponse)
def list_organizations(
    type_id: UUID | None = Query(None, description="Filtrer par type d'organisation"),
    search: str | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*", count="exact").is_("archived_at", "null")
    if type_id:
        query = query.eq("organization_type_id", str(type_id))
    if search:
        query = query.ilike("name", f"%{search}%")
    query = query.order("name")
    if limit > 0:
        query = query.range(offset, offset + limit - 1)
    response = query.execute()
    rows = response.data or []
    return OrganizationListResponse(items=[OrganizationOut(**r) for r in rows], count=response.count or 0)


@router.get("/{item_id}", response_model=OrganizationOut)
def get_organization(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation non trouvee.")
    return OrganizationOut(**response.data[0])


@router.post("", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(payload: OrganizationCreate, _user: UserContext = Depends(get_current_user)):
    data = payload.model_dump()
    if data.get("organization_type_id"):
        data["organization_type_id"] = str(data["organization_type_id"])
    response = _table().insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return OrganizationOut(**response.data[0])


@router.patch("/{item_id}", response_model=OrganizationOut)
def update_organization(item_id: UUID, payload: OrganizationUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    if "organization_type_id" in changes and changes["organization_type_id"]:
        changes["organization_type_id"] = str(changes["organization_type_id"])
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation non trouvee.")
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return OrganizationOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_organization(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organisation non trouvee.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
