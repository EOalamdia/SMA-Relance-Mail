"""Security middleware aligned with hub foundations."""
from __future__ import annotations

import logging
import time
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .cache import redis_client
from .config import settings

logger = logging.getLogger("sma.middleware")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

        api_origin = settings.api_url
        csp_report = f"{api_origin}/api/csp-report" if settings.is_production else ""
        report_directive = f" report-uri {csp_report};" if csp_report else ""

        self.csp_policy = (
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net https://kit.fontawesome.com; "
            "style-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://ka-f.fontawesome.com; "
            "img-src 'self' data: https:; "
            f"connect-src 'self' {api_origin}; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "upgrade-insecure-requests;"
            f"{report_directive}"
        )

        if not settings.is_production:
            self.csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://kit.fontawesome.com; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://ka-f.fontawesome.com; "
                "img-src 'self' data: https:; "
                f"connect-src 'self' ws: wss: http://localhost:* {api_origin}; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "upgrade-insecure-requests;"
            )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        response.headers["Content-Security-Policy"] = self.csp_policy
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=(), payment=()"

        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, max_requests: int, window_seconds: int):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path.startswith(("/health", "/favicon.ico", "/api/csp-report")):
            return await call_next(request)

        forwarded_for = request.headers.get("x-forwarded-for", "")
        client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "unknown")

        key = f"rate_limit:global:{client_ip}"
        current_count = redis_client.incr(key)
        if current_count is None:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Rate limiting unavailable"},
            )

        if current_count == 1:
            redis_client.expire(key, self.window_seconds)

        ttl = redis_client.ttl(key)
        ttl = ttl if ttl > 0 else 0

        if current_count > self.max_requests:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: {self.max_requests} requests per {self.window_seconds} seconds",
                    "retry_after": ttl,
                },
                headers={
                    "Retry-After": str(ttl),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + ttl)),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.max_requests - current_count))
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + ttl))
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.time()
        client_ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "unknown")[:100]

        response = await call_next(request)
        process_time = time.time() - start

        logger.info(
            "%s %s status=%s ip=%s time=%.3fs ua=%s",
            request.method,
            request.url.path,
            response.status_code,
            client_ip,
            process_time,
            ua,
        )

        response.headers["X-Process-Time"] = str(process_time)
        return response


def setup_security_middleware(app) -> None:
    from fastapi.middleware.trustedhost import TrustedHostMiddleware

    from .csrf import CSRFMiddleware

    allowed_hosts = [
        settings.domain_frontend,
        settings.domain_api,
        f"*.{settings.domain_frontend}",
        f"*.{settings.domain_api}",
        "localhost",
        "127.0.0.1",
        "backend",
        f"backend:{settings.api_port}",
    ]

    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CSRFMiddleware, enabled=settings.is_production)

    if settings.is_production:
        app.add_middleware(
            RateLimitMiddleware,
            max_requests=settings.rate_limit_max_requests,
            window_seconds=settings.rate_limit_window_seconds,
        )
    else:
        app.add_middleware(
            RateLimitMiddleware,
            max_requests=settings.rate_limit_dev_max_requests,
            window_seconds=settings.rate_limit_window_seconds,
        )

    app.add_middleware(RequestLoggingMiddleware)
