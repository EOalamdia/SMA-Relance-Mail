"""CRUD endpoints for training_courses."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    TrainingCourseCreate,
    TrainingCourseListResponse,
    TrainingCourseOut,
    TrainingCourseUpdate,
)

router = APIRouter(prefix="/v1/training-courses", tags=["Training Courses"])

_SCHEMA = "sma_relance"
_TABLE = "training_courses"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=TrainingCourseListResponse)
def list_training_courses(
    search: str | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*", count="exact").is_("archived_at", "null")
    if search:
        query = query.or_(f"code.ilike.%{search}%,title.ilike.%{search}%")
    query = query.order("code")
    if limit > 0:
        query = query.range(offset, offset + limit - 1)
    response = query.execute()
    rows = response.data or []
    return TrainingCourseListResponse(items=[TrainingCourseOut(**r) for r in rows], count=response.count or 0)


@router.get("/{item_id}", response_model=TrainingCourseOut)
def get_training_course(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table().select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation non trouvee.")
    return TrainingCourseOut(**response.data[0])


@router.post("", response_model=TrainingCourseOut, status_code=status.HTTP_201_CREATED)
def create_training_course(payload: TrainingCourseCreate, _user: UserContext = Depends(get_current_user)):
    response = _table().insert(payload.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return TrainingCourseOut(**response.data[0])


@router.patch("/{item_id}", response_model=TrainingCourseOut)
def update_training_course(item_id: UUID, payload: TrainingCourseUpdate, _user: UserContext = Depends(get_current_user)):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ a mettre a jour.")
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation non trouvee.")
    response = _table().update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la mise a jour.")
    return TrainingCourseOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_training_course(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).is_("archived_at", "null").limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation non trouvee.")
    _table().update({"archived_at": datetime.now(timezone.utc).isoformat(), "is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
