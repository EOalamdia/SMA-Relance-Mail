"""Health endpoints."""
from __future__ import annotations

import time

from fastapi import APIRouter

from core import redis_client, settings
from core.supabase import get_service_supabase

router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    health = {
        "status": "ok",
        "service": settings.app_slug,
        "version": "1.0.0",
        "timestamp": time.time(),
    }

    if not redis_client.ping():
        health["status"] = "degraded"
        health["redis"] = "error"
    else:
        health["redis"] = "ok"

    try:
        client = get_service_supabase()
        client.table("apps").select("id").limit(1).execute()
        health["supabase"] = "ok"
    except Exception:
        health["supabase"] = "error"
        health["status"] = "degraded"

    return health
