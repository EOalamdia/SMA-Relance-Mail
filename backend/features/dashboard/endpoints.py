"""Dashboard endpoints — read-only pilotage views."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    CoverageItem,
    DashboardSummary,
    DueRadarItem,
    OverdueItem,
    UpcomingReminderItem,
)

router = APIRouter(prefix="/v1/dashboard", tags=["Dashboard"])

_SCHEMA = "sma_relance"


def _view(name: str):
    return get_schema_table(_SCHEMA, name)


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(_user: UserContext = Depends(get_current_user)):
    """Resume global pour le tableau de bord."""
    orgs = _table("organizations").select("id", count="exact").is_("archived_at", "null").execute()
    courses = _table("training_courses").select("id", count="exact").is_("archived_at", "null").execute()
    due_items = _table("training_due_items").select("id, status").execute()

    di_data = due_items.data or []
    status_counts = {}
    for di in di_data:
        s = di["status"]
        status_counts[s] = status_counts.get(s, 0) + 1

    pending = _table("reminder_jobs").select("id", count="exact").in_("status", ["pending", "ready"]).execute()

    return DashboardSummary(
        total_organizations=orgs.count or 0,
        total_courses=courses.count or 0,
        total_due_items=len(di_data),
        overdue_count=status_counts.get("overdue", 0),
        due_soon_count=status_counts.get("due_soon", 0),
        ok_count=status_counts.get("ok", 0),
        never_done_count=status_counts.get("never_done", 0),
        pending_jobs=pending.count or 0,
    )


@router.get("/radar", response_model=list[DueRadarItem])
def get_due_radar(_user: UserContext = Depends(get_current_user)):
    response = _view("vw_due_radar").select("*").execute()
    return [DueRadarItem(**r) for r in (response.data or [])]


@router.get("/coverage", response_model=list[CoverageItem])
def get_coverage(_user: UserContext = Depends(get_current_user)):
    response = _view("vw_coverage_by_org_type").select("*").execute()
    return [CoverageItem(**r) for r in (response.data or [])]


@router.get("/upcoming-reminders", response_model=list[UpcomingReminderItem])
def get_upcoming_reminders(_user: UserContext = Depends(get_current_user)):
    response = _view("vw_upcoming_reminders").select("*").execute()
    return [UpcomingReminderItem(**r) for r in (response.data or [])]


@router.get("/overdue", response_model=list[OverdueItem])
def get_overdue(_user: UserContext = Depends(get_current_user)):
    response = _view("vw_overdue_due_items").select("*").execute()
    return [OverdueItem(**r) for r in (response.data or [])]
