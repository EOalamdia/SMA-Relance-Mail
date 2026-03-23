"""Schemas for dashboard views."""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class DueRadarItem(BaseModel):
    due_item_id: UUID
    status: str
    due_date: date | None = None
    reference_date: date | None = None
    scope_type: str
    organization_id: UUID
    organization_name: str
    organization_type: str | None = None
    course_id: UUID
    course_code: str
    course_title: str
    reminder_frequency_months: int | None = None
    computed_at: datetime

    model_config = {"from_attributes": True}


class CoverageItem(BaseModel):
    org_type_id: UUID
    org_type_name: str
    total_organizations: int
    total_applicabilities: int
    ok_count: int
    due_soon_count: int
    overdue_count: int
    never_done_count: int
    missing_policy_count: int
    coverage_pct: float

    model_config = {"from_attributes": True}


class UpcomingReminderItem(BaseModel):
    job_id: UUID
    job_status: str
    scheduled_for: datetime
    recipient_email: str
    rule_name: str
    due_date: date | None = None
    due_status: str
    organization_name: str
    course_title: str
    template_name: str | None = None

    model_config = {"from_attributes": True}


class OverdueItem(BaseModel):
    due_item_id: UUID
    due_date: date | None = None
    status: str
    days_overdue: int | None = None
    organization_id: UUID
    organization_name: str
    organization_type: str | None = None
    course_id: UUID
    course_code: str
    course_title: str
    primary_contact_email: str | None = None
    primary_contact_first_name: str | None = None
    primary_contact_last_name: str | None = None

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    total_organizations: int
    total_courses: int
    total_due_items: int
    overdue_count: int
    due_soon_count: int
    ok_count: int
    never_done_count: int
    pending_jobs: int
