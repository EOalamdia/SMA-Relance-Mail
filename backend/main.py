"""Main FastAPI app for App-Starter."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core import settings
from core.middleware import setup_security_middleware
from features.health.endpoints import router as health_router
from features.items.endpoints import router as items_router
from features.starter.endpoints import router as starter_router

app = FastAPI(
    title=settings.app_name,
    description="Starter API aligned with hub global security foundations",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_security_middleware(app)

app.include_router(health_router, tags=["Health"])
app.include_router(starter_router)
app.include_router(items_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": f"{settings.app_name} API",
        "health": "/health",
    }


@app.post("/api/csp-report")
async def csp_report(request: Request) -> dict[str, str]:
    import logging

    logger = logging.getLogger("app_starter.security.csp")
    try:
        body = await request.json()
        report = body.get("csp-report", body)
        logger.warning(
            "CSP violation blocked-uri=%s violated-directive=%s",
            report.get("blocked-uri", "unknown"),
            report.get("violated-directive", "unknown"),
        )
        return {"status": "received"}
    except Exception as exc:  # pragma: no cover
        logger.error("Failed to parse CSP report: %s", exc)
        return {"status": "error"}
