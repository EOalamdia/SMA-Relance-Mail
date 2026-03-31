"""ForwardAuth dependencies (Traefik-injected user headers)."""
from __future__ import annotations

import hmac
from typing import Optional

from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from .config import settings


class UserContext(BaseModel):
    user_id: str
    user_email: str | None = None
    forwarded_user: str | None = None


SCHEDULER_USER_ID = "scheduler-internal"


def get_current_user(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(default=None, alias="X-User-Email"),
    x_forwarded_user: Optional[str] = Header(default=None, alias="X-Forwarded-User"),
) -> UserContext:
    """Resolve authenticated user from ForwardAuth headers."""
    user_id = x_user_id or x_forwarded_user
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing ForwardAuth headers. Verify Traefik hub_almadia_auth middleware.",
        )
    user_email = x_user_email or x_forwarded_user
    return UserContext(
        user_id=user_id,
        user_email=user_email,
        forwarded_user=x_forwarded_user,
    )


def get_service_auth(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(default=None, alias="X-User-Email"),
    x_forwarded_user: Optional[str] = Header(default=None, alias="X-Forwarded-User"),
    x_scheduler_key: Optional[str] = Header(default=None, alias="X-Scheduler-Key"),
) -> UserContext:
    """Accept either Traefik ForwardAuth headers OR internal scheduler key."""
    # Check scheduler key first (internal service call)
    if x_scheduler_key and settings.scheduler_key:
        if hmac.compare_digest(x_scheduler_key, settings.scheduler_key):
            return UserContext(
                user_id=SCHEDULER_USER_ID,
                user_email=None,
                forwarded_user=None,
            )

    # Fall back to Traefik ForwardAuth headers (user request)
    user_id = x_user_id or x_forwarded_user
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing auth. Provide ForwardAuth headers or valid X-Scheduler-Key.",
        )
    user_email = x_user_email or x_forwarded_user
    return UserContext(
        user_id=user_id,
        user_email=user_email,
        forwarded_user=x_forwarded_user,
    )
