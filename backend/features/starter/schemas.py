"""Schemas for starter feature."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class StarterPingResponse(BaseModel):
    message: str
    user_id: str
    user_email: str | None = None
    timestamp: datetime


class StarterMeResponse(BaseModel):
    user_id: str
    user_email: str | None = None
    forwarded_user: str | None = None


class StarterAppShellResponse(BaseModel):
    app_name: str
    icon_url: str | None = None


class StarterEchoRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class StarterEchoResponse(BaseModel):
    echoed_text: str
    user_id: str
    timestamp: datetime
