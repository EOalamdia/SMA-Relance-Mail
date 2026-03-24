"""Main FastAPI app for SMA – Système de Management Automatique."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from core import settings
from core.middleware import setup_security_middleware
from features.health.endpoints import router as health_router
from features.starter.endpoints import router as starter_router
from features.organization_types.endpoints import router as org_types_router
from features.organizations.endpoints import router as organizations_router
from features.contacts.endpoints import router as contacts_router
from features.training_courses.endpoints import router as courses_router
from features.course_applicability.endpoints import router as applicability_router
from features.training_sessions.endpoints import router as sessions_router
from features.reminder_rules.endpoints import router as rules_router
from features.email_templates.endpoints import router as templates_router
from features.due_items.endpoints import router as due_items_router
from features.reminder_jobs.endpoints import router as jobs_router
from features.email_deliveries.endpoints import router as deliveries_router
from features.dashboard.endpoints import router as dashboard_router
from features.import_data.endpoints import router as import_router

app = FastAPI(
    title=settings.app_name,
    description="SMA – Système de Management Automatique des relances de formations",
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
app.include_router(org_types_router)
app.include_router(organizations_router)
app.include_router(contacts_router)
app.include_router(courses_router)
app.include_router(applicability_router)
app.include_router(sessions_router)
app.include_router(rules_router)
app.include_router(templates_router)
app.include_router(due_items_router)
app.include_router(jobs_router)
app.include_router(deliveries_router)
app.include_router(dashboard_router)
app.include_router(import_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": f"{settings.app_name} API",
        "health": "/health",
    }


@app.post("/api/csp-report")
async def csp_report(request: Request) -> dict[str, str]:
    import logging

    logger = logging.getLogger("sma.security.csp")
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
