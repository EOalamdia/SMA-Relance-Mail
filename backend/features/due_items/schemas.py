"""Schemas for training_due_items."""
from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


DueStatus = Literal[
    "ok", "due_soon", "due", "overdue", "closed", "no_reminder", "missing_policy", "never_done"
]


class DueItemOut(BaseModel):
    id: UUID
    scope_type: str
    organization_id: UUID
    employee_id: UUID | None = None
    course_id: UUID
    last_session_id: UUID | None = None
    reference_date: date | None = None
    due_date: date | None = None
    status: str
    computed_at: datetime
    closed_at: datetime | None = None
    close_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DueItemListResponse(BaseModel):
    items: list[DueItemOut]
    count: int


class DueItemCloseRequest(BaseModel):
    close_reason: str | None = Field(None, min_length=1, max_length=500)


class ComputeResponse(BaseModel):
    computed: int
    created: int
    updated: int
    errors: int
