"""Schemas for reminder_rules."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ReminderRuleOut(BaseModel):
    id: UUID
    name: str
    is_active: bool
    offset_sign: int
    offset_value: int
    offset_unit: str
    trigger_type: str
    recipient_strategy: str
    template_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None = None

    model_config = {"from_attributes": True}


class ReminderRuleListResponse(BaseModel):
    items: list[ReminderRuleOut]
    count: int


class ReminderRuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    is_active: bool = True
    offset_sign: Literal[-1, 0, 1]
    offset_value: int = Field(..., ge=0)
    offset_unit: Literal["day", "month"] = "day"
    trigger_type: Literal["before", "on", "after"] = "before"
    recipient_strategy: Literal["primary", "role", "fallback"] = "primary"
    template_id: UUID | None = None


class ReminderRuleUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    is_active: bool | None = None
    offset_sign: Literal[-1, 0, 1] | None = None
    offset_value: int | None = Field(None, ge=0)
    offset_unit: Literal["day", "month"] | None = None
    trigger_type: Literal["before", "on", "after"] | None = None
    recipient_strategy: Literal["primary", "role", "fallback"] | None = None
    template_id: UUID | None = None
