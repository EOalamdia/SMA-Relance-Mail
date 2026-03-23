"""CRUD endpoints for course_applicability."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    CourseApplicabilityCreate,
    CourseApplicabilityListResponse,
    CourseApplicabilityOut,
)

router = APIRouter(prefix="/v1/course-applicability", tags=["Course Applicability"])

_SCHEMA = "sma_relance"
_TABLE = "course_applicability"


def _table():
    return get_schema_table(_SCHEMA, _TABLE)


@router.get("", response_model=CourseApplicabilityListResponse)
def list_course_applicability(
    organization_id: UUID | None = Query(None),
    course_id: UUID | None = Query(None),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*")
    if organization_id:
        query = query.eq("organization_id", str(organization_id))
    if course_id:
        query = query.eq("course_id", str(course_id))
    response = query.order("created_at", desc=True).execute()
    rows = response.data or []
    return CourseApplicabilityListResponse(items=[CourseApplicabilityOut(**r) for r in rows], count=len(rows))


@router.post("", response_model=CourseApplicabilityOut, status_code=status.HTTP_201_CREATED)
def create_course_applicability(payload: CourseApplicabilityCreate, _user: UserContext = Depends(get_current_user)):
    data = {
        "organization_id": str(payload.organization_id),
        "course_id": str(payload.course_id),
    }
    response = _table().insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Echec de la creation.")
    return CourseApplicabilityOut(**response.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_applicability(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table().select("id").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicabilite non trouvee.")
    _table().delete().eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
