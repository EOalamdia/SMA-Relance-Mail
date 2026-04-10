"""Endpoints for training_due_items — read + compute + close."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.dependencies import UserContext, get_current_user, get_service_auth
from core.supabase import get_schema_table

from .schemas import ComputeResponse, DueItemCloseRequest, DueItemListResponse, DueItemOut
from .service import compute_due_items

router = APIRouter(prefix="/v1/due-items", tags=["Due Items"])

_SCHEMA = "sma_relance"
_TABLE = "training_due_items"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=DueItemListResponse)
def list_due_items(
    organization_id: UUID | None = Query(None),
    course_id: UUID | None = Query(None),
    due_status: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    # Resolve IDs matching the search term across related tables
    search_org_ids: list[str] | None = None
    search_course_ids: list[str] | None = None
    if search:
        org_rows = (
            get_schema_table("sma_relance", "organizations")
            .select("id")
            .ilike("name", f"%{search}%")
            .is_("archived_at", "null")
            .execute()
            .data or []
        )
        search_org_ids = [r["id"] for r in org_rows]
        course_rows = (
            get_schema_table("sma_relance", "training_courses")
            .select("id")
            .or_(f"code.ilike.%{search}%,title.ilike.%{search}%")
            .execute()
            .data or []
        )
        search_course_ids = [r["id"] for r in course_rows]

    query = _table().select("*", count="exact")
    if organization_id:
        query = query.eq("organization_id", str(organization_id))
    if course_id:
        query = query.eq("course_id", str(course_id))
    if due_status:
        query = query.eq("status", due_status)
    if search:
        or_parts: list[str] = []
        if search_org_ids:
            for oid in search_org_ids:
                or_parts.append(f"organization_id.eq.{oid}")
        if search_course_ids:
            for cid in search_course_ids:
                or_parts.append(f"course_id.eq.{cid}")
        if or_parts:
            query = query.or_(",".join(or_parts))
        else:
            return DueItemListResponse(items=[], count=0)
    query = query.order("due_date")
    if limit > 0:
        query = query.range(offset, offset + limit - 1)
    response = query.execute()
    rows = response.data or []
    return DueItemListResponse(items=[DueItemOut(**r) for r in rows], count=response.count or 0)


@router.get("/{item_id}", response_model=DueItemOut)
def get_due_item(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Echeance non trouvee.")
    return DueItemOut(**response.data[0])


@router.post("/compute", response_model=ComputeResponse)
def compute_all_due_items(_user: UserContext = Depends(get_service_auth)):
    """Recalcul global de toutes les echeances."""
    result = compute_due_items()
    return ComputeResponse(**result)


@router.post("/compute/{org_id}", response_model=ComputeResponse)
def compute_org_due_items(org_id: UUID, _user: UserContext = Depends(get_service_auth)):
    """Recalcul cible pour une organisation."""
    result = compute_due_items(organization_id=str(org_id))
    return ComputeResponse(**result)


@router.post("/compute/{org_id}/{crs_id}", response_model=ComputeResponse)
def compute_single_due_item(org_id: UUID, crs_id: UUID, _user: UserContext = Depends(get_current_user)):
    """Recalcul cible pour un couple organisation/formation."""
    result = compute_due_items(organization_id=str(org_id), course_id=str(crs_id))
    return ComputeResponse(**result)


@router.post("/{item_id}/close", response_model=DueItemOut)
def close_due_item(
    item_id: UUID,
    payload: DueItemCloseRequest | None = None,
    _user: UserContext = Depends(get_current_user),
):
    """Fermer manuellement une echeance."""
    exists = _table().select("id, status").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Echeance non trouvee.")
    if exists.data[0]["status"] == "closed":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Echeance deja fermee.")

    now_ts = datetime.now(timezone.utc).isoformat()
    close_reason = "Cloture manuelle"
    if payload and payload.close_reason and payload.close_reason.strip():
        close_reason = payload.close_reason.strip()
    response = (
        _table()
        .update({
            "status": "closed",
            "closed_at": now_ts,
            "close_reason": close_reason,
        })
        .eq("id", str(item_id))
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la fermeture.")
    return DueItemOut(**response.data[0])
