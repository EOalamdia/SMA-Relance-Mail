"""Schemas for organization_contacts."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ContactOut(BaseModel):
    id: UUID
    organization_id: UUID
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    role: str | None = None
    is_primary: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class ContactListResponse(BaseModel):
    items: list[ContactOut]
    count: int


class ContactCreate(BaseModel):
    organization_id: UUID
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    role: str | None = Field(None, max_length=255)
    is_primary: bool = False


class ContactUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    role: str | None = Field(None, max_length=255)
    is_primary: bool | None = None
    is_active: bool | None = None
