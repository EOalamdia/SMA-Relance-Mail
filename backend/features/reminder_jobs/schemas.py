"""Schemas for reminder_jobs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReminderJobOut(BaseModel):
    id: UUID
    due_item_id: UUID
    reminder_rule_id: UUID
    recipient_contact_id: UUID | None = None
    recipient_email: str
    template_id: UUID | None = None
    scheduled_for: datetime
    status: str
    attempt_count: int
    last_attempt_at: datetime | None = None
    error_message: str | None = None
    idempotency_key: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReminderJobListResponse(BaseModel):
    items: list[ReminderJobOut]
    count: int


class GenerateResponse(BaseModel):
    generated: int
    skipped: int
    errors: int
