"""Schemas for training_sessions."""
from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class TrainingSessionOut(BaseModel):
    id: UUID
    organization_id: UUID
    course_id: UUID
    session_date: date
    status: str
    source: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TrainingSessionListResponse(BaseModel):
    items: list[TrainingSessionOut]
    count: int


class TrainingSessionCreate(BaseModel):
    organization_id: UUID
    course_id: UUID
    session_date: date
    status: Literal["planned", "completed", "cancelled"] = "completed"
    source: Literal["manual", "import"] = "manual"
    notes: str | None = Field(None, max_length=2000)


class TrainingSessionUpdate(BaseModel):
    session_date: date | None = None
    status: Literal["planned", "completed", "cancelled"] | None = None
    notes: str | None = Field(None, max_length=2000)
