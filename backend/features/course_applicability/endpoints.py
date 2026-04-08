"""CRUD endpoints for course_applicability."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from postgrest.exceptions import APIError

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


def _is_missing_column_error(exc: APIError, column_name: str) -> bool:
    payload = str(exc)
    if column_name not in payload:
        return False
    return "PGRST204" in payload or "42703" in payload or "does not exist" in payload


@router.get("", response_model=CourseApplicabilityListResponse)
def list_course_applicability(
    organization_id: UUID | None = Query(None),
    organization_type_id: UUID | None = Query(None),
    course_id: UUID | None = Query(None),
    limit: int = Query(0, ge=0),
    offset: int = Query(0, ge=0),
    _user: UserContext = Depends(get_current_user),
):
    query = _table().select("*", count="exact")
    if organization_id:
        query = query.eq("organization_id", str(organization_id))
    if organization_type_id:
        query = query.eq("organization_type_id", str(organization_type_id))
    if course_id:
        query = query.eq("course_id", str(course_id))
    try:
        ordered = query.order("created_at", desc=True)
        if limit > 0:
            ordered = ordered.range(offset, offset + limit - 1)
        response = ordered.execute()
        rows = response.data or []
        total = response.count or 0
    except APIError as exc:
        if not (organization_type_id and _is_missing_column_error(exc, "organization_type_id")):
            raise

        org_rows = (
            get_schema_table(_SCHEMA, "organizations")
            .select("id")
            .eq("organization_type_id", str(organization_type_id))
            .is_("archived_at", "null")
            .execute()
            .data
            or []
        )
        org_ids = [row["id"] for row in org_rows if row.get("id")]
        if not org_ids:
            rows = []
            total = 0
        else:
            fallback_query = _table().select("*", count="exact").in_("organization_id", org_ids)
            if organization_id:
                fallback_query = fallback_query.eq("organization_id", str(organization_id))
            if course_id:
                fallback_query = fallback_query.eq("course_id", str(course_id))
            fb_ordered = fallback_query.order("created_at", desc=True)
            if limit > 0:
                fb_ordered = fb_ordered.range(offset, offset + limit - 1)
            fb_response = fb_ordered.execute()
            rows = fb_response.data or []
            total = fb_response.count or 0
    return CourseApplicabilityListResponse(items=[CourseApplicabilityOut(**r) for r in rows], count=total)


@router.post("", response_model=CourseApplicabilityOut, status_code=status.HTTP_201_CREATED)
def create_course_applicability(payload: CourseApplicabilityCreate, _user: UserContext = Depends(get_current_user)):
    data: dict = {"course_id": str(payload.course_id)}
    if payload.organization_id:
        data["organization_id"] = str(payload.organization_id)
    if payload.organization_type_id:
        data["organization_type_id"] = str(payload.organization_type_id)
    try:
        response = _table().insert(data).execute()
    except APIError as exc:
        if payload.organization_type_id and _is_missing_column_error(exc, "organization_type_id"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "La base actuelle ne supporte pas encore l'applicabilite par type d'organisme. "
                    "Associez la formation a un organisme precis, ou appliquez la migration SMA la plus recente."
                ),
            ) from exc
        raise
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
