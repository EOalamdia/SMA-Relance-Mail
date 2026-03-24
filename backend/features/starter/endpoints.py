"""Starter feature endpoints."""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends

from core.config import settings
from core.dependencies import UserContext, get_current_user
from core.supabase import get_service_supabase

from .schemas import (
    StarterAppShellResponse,
    StarterEchoRequest,
    StarterEchoResponse,
    StarterMeResponse,
    StarterPingResponse,
)

router = APIRouter(prefix="/v1/starter", tags=["Starter"])


@router.get("/me", response_model=StarterMeResponse)
def get_me(user: UserContext = Depends(get_current_user)) -> StarterMeResponse:
    resolved_email = user.user_email or user.forwarded_user
    return StarterMeResponse(
        user_id=user.user_id,
        user_email=resolved_email,
        forwarded_user=user.forwarded_user,
    )


@router.get("/app-shell", response_model=StarterAppShellResponse)
def get_app_shell(user: UserContext = Depends(get_current_user)) -> StarterAppShellResponse:
    _ = user
    app_name = settings.app_name
    icon_url: str | None = None

    public_link = f"https://{settings.domain_frontend}{settings.frontend_base_path}".rstrip("/")
    service_name = f"{settings.app_slug}-frontend"

    client = get_service_supabase()
    table = client.table("apps")

    candidates: list[dict] = []

    for link_candidate in [public_link, f"{public_link}/"]:
        response = (
            table.select("name, icon_url")
            .eq("link", link_candidate)
            .limit(1)
            .execute()
        )
        if response.data:
            candidates = response.data
            break

    if not candidates:
        response = (
            table.select("name, icon_url")
            .eq("docker_service_name", service_name)
            .limit(1)
            .execute()
        )
        candidates = response.data or []

    if not candidates:
        response = (
            table.select("name, icon_url")
            .eq("name", settings.app_name)
            .limit(1)
            .execute()
        )
        candidates = response.data or []

    if candidates:
        app_name = candidates[0].get("name") or app_name
        icon_url = candidates[0].get("icon_url")

    return StarterAppShellResponse(
        app_name=app_name,
        icon_url=icon_url,
    )


if not settings.is_production:
    @router.get("/debug/ping", response_model=StarterPingResponse)
    def ping_debug(user: UserContext = Depends(get_current_user)) -> StarterPingResponse:
        return StarterPingResponse(
            message="SMA backend reachable",
            user_id=user.user_id,
            user_email=user.user_email,
            timestamp=datetime.now(tz=UTC),
        )

    @router.post("/debug/echo", response_model=StarterEchoResponse)
    def echo_debug(
        payload: StarterEchoRequest,
        user: UserContext = Depends(get_current_user),
    ) -> StarterEchoResponse:
        return StarterEchoResponse(
            echoed_text=payload.text,
            user_id=user.user_id,
            timestamp=datetime.now(tz=UTC),
        )
