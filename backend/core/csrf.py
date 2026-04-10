"""CSRF middleware using double submit cookie pattern."""
from __future__ import annotations

import hmac

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .config import settings

CSRF_COOKIE_NAME = "__Host-csrf_token" if settings.session_cookie_secure else "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class CSRFMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {
        "/",
        "/health",
        "/api/csp-report",
        "/v1/reminder-jobs/send-pending",
        "/v1/reminder-jobs/generate",
        "/v1/due-items/compute",
        # Public RFC 8058 endpoint must be callable by mail providers without CSRF cookie/header.
        "/v1/public/unsubscribe/one-click",
    }

    def __init__(self, app: ASGIApp, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        if request.method in CSRF_SAFE_METHODS:
            return await call_next(request)

        path = request.url.path.rstrip("/")
        if path in self.EXEMPT_PATHS:
            return await call_next(request)

        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
        header_token = request.headers.get(CSRF_HEADER_NAME)

        if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token missing or invalid"},
                headers={"X-CSRF-Error": "token_mismatch"},
            )

        return await call_next(request)
