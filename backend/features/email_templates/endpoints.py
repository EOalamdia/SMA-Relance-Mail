"""CRUD endpoints for email_templates."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    EmailTemplateCreate,
    EmailTemplateListResponse,
    EmailTemplateOut,
    EmailTemplateUpdate,
)

router = APIRouter(prefix="/v1/email-templates", tags=["Email Templates"])

_SCHEMA = "sma_relance"
_TABLE = "email_templates"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=EmailTemplateListResponse)
def list_email_templates(_user: UserContext = Depends(get_current_user)):
    response = _table().select("*").is_("archived_at", "null").order("name").execute()
    rows = response.data or []
    return EmailTemplateListResponse(items=[EmailTemplateOut(**r) for r in rows], count=len(rows))


@router.get("/{item_id}", response_model=EmailTemplateOut)
def get_email_template(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template email non trouve.")
    return EmailTemplateOut(**response.data[0])


@router.post("", response_model=EmailTemplateOut, status_code=status.HTTP_201_CREATED)
def create_email_template(payload: EmailTemplateCreate, _user: UserContext = Depends(get_current_user)):
    response = _table().insert(payload.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return EmailTemplateOut(**response.data[0])


@router.patch("/{item_id}", response_model=EmailTemplateOut)
def update_email_template(item_id: UUID, payload: EmailTemplateUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    exists = _table().select("id, version").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template email non trouve.")
    # Auto-increment version on update
    changes["version"] = exists.data[0]["version"] + 1
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return EmailTemplateOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_email_template(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template email non trouve.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
