"""CSV import endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from core.dependencies import UserContext, get_current_user

from .schemas import ImportResult
from .service import import_organizations_csv, import_sessions_csv

router = APIRouter(prefix="/v1/import", tags=["Import"])


@router.post("/organizations", response_model=ImportResult)
async def import_organizations(
    file: UploadFile = File(...),
    _user: UserContext = Depends(get_current_user),
):
    """Import organisations depuis un fichier CSV."""
    content = (await file.read()).decode("utf-8-sig")
    result = import_organizations_csv(content)
    return ImportResult(**result)


@router.post("/sessions", response_model=ImportResult)
async def import_sessions(
    file: UploadFile = File(...),
    _user: UserContext = Depends(get_current_user),
):
    """Import sessions de formation depuis un fichier CSV."""
    content = (await file.read()).decode("utf-8-sig")
    result = import_sessions_csv(content)
    return ImportResult(**result)
