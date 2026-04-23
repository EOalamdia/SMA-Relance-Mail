"""Schemas for organizations."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    normalized_name: str | None = None
    organization_type_id: UUID | None = None
    total_employees: int | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrganizationListResponse(BaseModel):
    items: list[OrganizationOut]
    count: int


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    organization_type_id: UUID | None = None
    total_employees: int | None = Field(None, ge=0)
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    organization_type_id: UUID | None = None
    total_employees: int | None = Field(None, ge=0)
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)
    notes: str | None = None
    is_active: bool | None = None
