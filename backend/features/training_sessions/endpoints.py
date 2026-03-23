"""CRUD endpoints for training_sessions."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    TrainingSessionCreate,
    TrainingSessionListResponse,
    TrainingSessionOut,
    TrainingSessionUpdate,
)

router = APIRouter(prefix="/v1/training-sessions", tags=["Training Sessions"])

_SCHEMA = "sma_relance"
_TABLE = "training_sessions"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=TrainingSessionListResponse)
def list_training_sessions(
    organization_id: UUID | None = Query(None),
    course_id: UUID | None = Query(None),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*")
    if organization_id:
        query = query.eq("organization_id", str(organization_id))
    if course_id:
        query = query.eq("course_id", str(course_id))
    response = query.order("session_date", desc=True).execute()
    rows = response.data or []
    return TrainingSessionListResponse(items=[TrainingSessionOut(**r) for r in rows], count=len(rows))


@router.get("/{item_id}", response_model=TrainingSessionOut)
def get_training_session(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvee.")
    return TrainingSessionOut(**response.data[0])


@router.post("", response_model=TrainingSessionOut, status_code=status.HTTP_201_CREATED)
def create_training_session(payload: TrainingSessionCreate, _user: UserContext = Depends(get_current_user)):
    data = payload.model_dump()
    data["organization_id"] = str(data["organization_id"])
    data["course_id"] = str(data["course_id"])
    data["session_date"] = data["session_date"].isoformat()
    response = _table().insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return TrainingSessionOut(**response.data[0])


@router.patch("/{item_id}", response_model=TrainingSessionOut)
def update_training_session(item_id: UUID, payload: TrainingSessionUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    if "session_date" in changes:
        changes["session_date"] = changes["session_date"].isoformat()
    exists = _table().select("id").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvee.")
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return TrainingSessionOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_session(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvee.")
    _table().delete().eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
