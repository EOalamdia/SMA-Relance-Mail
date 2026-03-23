"""CRUD endpoints for reminder_rules."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    ReminderRuleCreate,
    ReminderRuleListResponse,
    ReminderRuleOut,
    ReminderRuleUpdate,
)

router = APIRouter(prefix="/v1/reminder-rules", tags=["Reminder Rules"])

_SCHEMA = "sma_relance"
_TABLE = "reminder_rules"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=ReminderRuleListResponse)
def list_reminder_rules(_user: UserContext = Depends(get_current_user)):
    response = _table().select("*").is_("archived_at", "null").order("name").execute()
    rows = response.data or []
    return ReminderRuleListResponse(items=[ReminderRuleOut(**r) for r in rows], count=len(rows))


@router.get("/{item_id}", response_model=ReminderRuleOut)
def get_reminder_rule(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regle de relance non trouvee.")
    return ReminderRuleOut(**response.data[0])


@router.post("", response_model=ReminderRuleOut, status_code=status.HTTP_201_CREATED)
def create_reminder_rule(payload: ReminderRuleCreate, _user: UserContext = Depends(get_current_user)):
    data = payload.model_dump()
    if data.get("template_id"):
        data["template_id"] = str(data["template_id"])
    response = _table().insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return ReminderRuleOut(**response.data[0])


@router.patch("/{item_id}", response_model=ReminderRuleOut)
def update_reminder_rule(item_id: UUID, payload: ReminderRuleUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    if "template_id" in changes and changes["template_id"]:
        changes["template_id"] = str(changes["template_id"])
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regle de relance non trouvee.")
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return ReminderRuleOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_reminder_rule(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regle de relance non trouvee.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
