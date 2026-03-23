"""Schemas for training_courses."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TrainingCourseOut(BaseModel):
    id: UUID
    code: str
    title: str
    reminder_frequency_months: int | None = None
    reminder_disabled: bool
    is_active: bool
    price_ht: float | None = None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class TrainingCourseListResponse(BaseModel):
    items: list[TrainingCourseOut]
    count: int


class TrainingCourseCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    reminder_frequency_months: int | None = Field(None, ge=1)
    reminder_disabled: bool = False
    price_ht: float | None = Field(None, ge=0)


class TrainingCourseUpdate(BaseModel):
    code: str | None = Field(None, min_length=1, max_length=50)
    title: str | None = Field(None, min_length=1, max_length=255)
    reminder_frequency_months: int | None = Field(None, ge=1)
    reminder_disabled: bool | None = None
    is_active: bool | None = None
    price_ht: float | None = Field(None, ge=0)
