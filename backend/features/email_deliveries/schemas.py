"""Schemas for email_deliveries."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EmailDeliveryOut(BaseModel):
    id: UUID
    reminder_job_id: UUID
    provider: str
    provider_message_id: str | None = None
    status: str
    sent_at: datetime | None = None
    error_payload: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailDeliveryListResponse(BaseModel):
    items: list[EmailDeliveryOut]
    count: int
