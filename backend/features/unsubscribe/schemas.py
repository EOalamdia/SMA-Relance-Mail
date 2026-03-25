"""Pydantic schemas for the unsubscribe feature."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ── Communication Topics ───────────────────────────────────────────────────

class CommunicationTopicOut(BaseModel):
    id: UUID
    code: str
    label: str
    description: str | None = None
    is_unsubscribable: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommunicationTopicListResponse(BaseModel):
    items: list[CommunicationTopicOut]
    count: int


class CommunicationTopicCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    is_unsubscribable: bool = True
    is_active: bool = True


class CommunicationTopicUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_unsubscribable: bool | None = None
    is_active: bool | None = None


# ── Email Subscriptions ───────────────────────────────────────────────────

UnscopedType = Literal["global", "topic", "organization", "campaign"]
UnsubSource = Literal["link_click", "admin", "import", "api", "manual", "one_click_header"]


class EmailSubscriptionOut(BaseModel):
    id: UUID
    contact_id: UUID | None = None
    email_normalized: str
    email_hash: str
    communication_topic_id: UUID | None = None
    scope_type: str
    organization_id: UUID | None = None
    is_subscribed: bool
    unsubscribed_at: datetime | None = None
    unsubscribed_reason: str | None = None
    source: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailSubscriptionListResponse(BaseModel):
    items: list[EmailSubscriptionOut]
    count: int


class EmailSubscriptionResubscribe(BaseModel):
    """Admin action to resubscribe a contact."""
    reason: str | None = Field(None, max_length=500)


# ── Unsubscribe Events ───────────────────────────────────────────────────

class UnsubscribeEventOut(BaseModel):
    id: UUID
    subscription_id: UUID | None = None
    contact_id: UUID | None = None
    email_normalized: str
    email_hash: str
    communication_topic_id: UUID | None = None
    event_type: str
    source: str
    ip_address: str | None = None
    user_agent: str | None = None
    metadata: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UnsubscribeEventListResponse(BaseModel):
    items: list[UnsubscribeEventOut]
    count: int


# ── Public unsubscribe request/response ───────────────────────────────────

class UnsubscribeConfirmResponse(BaseModel):
    status: str
    message: str
