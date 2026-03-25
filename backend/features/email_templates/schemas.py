"""Schemas for email_templates."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EmailTemplateOut(BaseModel):
    id: UUID
    key: str
    name: str
    subject_template: str
    body_template: str
    is_active: bool
    version: int
    communication_topic_id: UUID | None = None
    include_unsubscribe_link: bool = True
    unsubscribe_footer_variant: str | None = None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class EmailTemplateListResponse(BaseModel):
    items: list[EmailTemplateOut]
    count: int


class EmailTemplateCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    subject_template: str = Field(..., min_length=1, max_length=500)
    body_template: str = Field(..., min_length=1)
    communication_topic_id: UUID | None = None
    include_unsubscribe_link: bool = True
    unsubscribe_footer_variant: str | None = None


class EmailTemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    subject_template: str | None = Field(None, min_length=1, max_length=500)
    body_template: str | None = Field(None, min_length=1)
    is_active: bool | None = None
    communication_topic_id: UUID | None = None
    include_unsubscribe_link: bool | None = None
    unsubscribe_footer_variant: str | None = None
