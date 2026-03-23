"""ForwardAuth dependencies (Traefik-injected user headers)."""
from __future__ import annotations

from typing import Optional

from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class UserContext(BaseModel):
    user_id: str
    user_email: str | None = None
    forwarded_user: str | None = None


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
