"""Schemas for course_applicability."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CourseApplicabilityOut(BaseModel):
    id: UUID
    organization_id: UUID
    course_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseApplicabilityListResponse(BaseModel):
    items: list[CourseApplicabilityOut]
    count: int


class CourseApplicabilityCreate(BaseModel):
    organization_id: UUID
    course_id: UUID
