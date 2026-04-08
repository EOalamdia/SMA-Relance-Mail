"""Read-only endpoints for email_deliveries."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import EmailDeliveryListResponse, EmailDeliveryOut

router = APIRouter(prefix="/v1/email-deliveries", tags=["Email Deliveries"])

_SCHEMA = "sma_relance"
_TABLE = "email_deliveries"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=EmailDeliveryListResponse)
def list_email_deliveries(
    reminder_job_id: UUID | None = Query(None),
    delivery_status: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*", count="exact")
    if reminder_job_id:
        query = query.eq("reminder_job_id", str(reminder_job_id))
    if delivery_status:
        query = query.eq("status", delivery_status)
    if search:
        query = query.or_(f"provider.ilike.%{search}%,provider_message_id.ilike.%{search}%")
    query = query.order("created_at", desc=True)
    if limit > 0:
        query = query.range(offset, offset + limit - 1)
    response = query.execute()
    rows = response.data or []
    return EmailDeliveryListResponse(items=[EmailDeliveryOut(**r) for r in rows], count=response.count or 0)


@router.get("/{item_id}", response_model=EmailDeliveryOut)
def get_email_delivery(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery non trouvee.")
    return EmailDeliveryOut(**response.data[0])
