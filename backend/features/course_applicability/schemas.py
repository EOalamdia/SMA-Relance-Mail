"""Schemas for course_applicability."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator


class CourseApplicabilityOut(BaseModel):
    id: UUID
    organization_id: UUID | None = None
    organization_type_id: UUID | None = None
    course_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseApplicabilityListResponse(BaseModel):
    items: list[CourseApplicabilityOut]
    count: int


class CourseApplicabilityCreate(BaseModel):
    organization_id: UUID | None = None
    organization_type_id: UUID | None = None
    course_id: UUID

    @model_validator(mode="after")
    def exactly_one_scope(self):
        has_org = self.organization_id is not None
        has_type = self.organization_type_id is not None
        if has_org == has_type:
            raise ValueError("Exactement un parmi organization_id / organization_type_id doit etre renseigne.")
        return self
