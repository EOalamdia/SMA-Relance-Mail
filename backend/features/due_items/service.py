"""Business logic for computing training due items.

Implements prompt.md §6.1 — deterministic, idempotent due_date+status calculation.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta
from postgrest.exceptions import APIError

from core.supabase import get_schema_table

logger = logging.getLogger("sma.due_items.service")

_SCHEMA = "sma_relance"
DUE_SOON_DAYS = 30  # configurable window for "due_soon"


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


def _is_missing_relation_error(exc: APIError, relation_name: str) -> bool:
    payload = str(exc)
    return "PGRST205" in payload and relation_name in payload


def _load_pairs_from_course_applicability(
    organization_id: str | None = None,
    course_id: str | None = None,
) -> list[dict]:
    """Fallback loader when SQL view v_course_applicability_expanded is unavailable.

    Supports both schema variants:
    - legacy: course_applicability(organization_id, course_id)
    - extended: + organization_type_id
    """
    raw_rows: list[dict]
    try:
        query = _table("course_applicability").select("organization_id, organization_type_id, course_id")
        if course_id:
            query = query.eq("course_id", course_id)
        raw_rows = query.execute().data or []
    except APIError as exc:
        # Legacy schema has no organization_type_id column.
        if "organization_type_id" not in str(exc):
            raise
        query = _table("course_applicability").select("organization_id, course_id")
        if course_id:
            query = query.eq("course_id", course_id)
        raw_rows = query.execute().data or []
        for row in raw_rows:
            row["organization_type_id"] = None

    org_ids_by_type: dict[str, list[str]] = {}
    org_type_ids = {
        row.get("organization_type_id")
        for row in raw_rows
        if row.get("organization_type_id")
    }
    if org_type_ids:
        org_query = _table("organizations").select("id, organization_type_id").in_(
            "organization_type_id",
            list(org_type_ids),
        ).is_("archived_at", "null")
        org_rows = org_query.execute().data or []
        for org in org_rows:
            org_type = org.get("organization_type_id")
            org_id = org.get("id")
            if not org_type or not org_id:
                continue
            org_ids_by_type.setdefault(org_type, []).append(org_id)

    dedup: set[tuple[str, str]] = set()
    for row in raw_rows:
        crs_id = row.get("course_id")
        if not crs_id:
            continue

        direct_org_id = row.get("organization_id")
        if direct_org_id:
            dedup.add((direct_org_id, crs_id))
            continue

        org_type_id = row.get("organization_type_id")
        if not org_type_id:
            continue
        for expanded_org_id in org_ids_by_type.get(org_type_id, []):
            dedup.add((expanded_org_id, crs_id))

    pairs = [
        {"organization_id": org_id, "course_id": crs_id}
        for org_id, crs_id in dedup
    ]
    if organization_id:
        pairs = [p for p in pairs if p["organization_id"] == organization_id]
    return pairs


def _load_applicability_pairs(
    organization_id: str | None = None,
    course_id: str | None = None,
) -> list[dict]:
    """Primary loader through SQL view; falls back to table expansion if missing."""
    query = _table("v_course_applicability_expanded").select("organization_id, course_id")
    if organization_id:
        query = query.eq("organization_id", organization_id)
    if course_id:
        query = query.eq("course_id", course_id)

    try:
        return query.execute().data or []
    except APIError as exc:
        if not _is_missing_relation_error(exc, "v_course_applicability_expanded"):
            raise
        logger.warning(
            "View sma_relance.v_course_applicability_expanded missing from PostgREST cache. "
            "Using course_applicability fallback loader."
        )
        return _load_pairs_from_course_applicability(organization_id=organization_id, course_id=course_id)


def compute_due_items(
    organization_id: str | None = None,
    course_id: str | None = None,
) -> dict:
    """Compute/refresh training_due_items for all applicable (org, course) pairs.

    Algorithm per prompt.md §6.1:
    1. Load applicable pairs from course_applicability
    2. For each pair, load course policy + latest completed session
    3. Derive due_date and status
    4. Upsert idempotently into training_due_items
    """
    stats = {"computed": 0, "created": 0, "updated": 0, "errors": 0}
    today = date.today()

    # 1. Load applicable pairs (expanded view resolves org-type associations)
    pairs = _load_applicability_pairs(organization_id=organization_id, course_id=course_id)

    if not pairs:
        return stats

    # 2. Bulk load courses (policy)
    course_ids = list({p["course_id"] for p in pairs})
    courses_raw = _table("training_courses").select(
        "id, reminder_frequency_months, reminder_disabled"
    ).in_("id", course_ids).execute().data or []
    courses = {c["id"]: c for c in courses_raw}

    # 3. Process each pair
    for pair in pairs:
        org_id = pair["organization_id"]
        crs_id = pair["course_id"]
        stats["computed"] += 1

        try:
            course = courses.get(crs_id)
            if not course:
                continue

            # Determine status and due_date
            reminder_disabled = course.get("reminder_disabled", False)
            freq_months = course.get("reminder_frequency_months")

            if reminder_disabled:
                due_date = None
                ref_date = None
                last_sid = None
                status = "no_reminder"
            elif freq_months is None:
                due_date = None
                ref_date = None
                last_sid = None
                status = "missing_policy"
            else:
                # Get latest completed session
                session_resp = (
                    _table("training_sessions")
                    .select("id, session_date")
                    .eq("organization_id", org_id)
                    .eq("course_id", crs_id)
                    .eq("status", "completed")
                    .order("session_date", desc=True)
                    .limit(1)
                    .execute()
                )
                sessions = session_resp.data or []

                if sessions:
                    last_session = sessions[0]
                    last_sid = last_session["id"]
                    ref_date_raw = last_session["session_date"]
                    ref_date = date.fromisoformat(ref_date_raw) if isinstance(ref_date_raw, str) else ref_date_raw
                    due_date = ref_date + relativedelta(months=freq_months)

                    # Derive temporal status
                    if due_date < today:
                        status = "overdue"
                    elif due_date == today:
                        status = "due"
                    elif (due_date - today).days <= DUE_SOON_DAYS:
                        status = "due_soon"
                    else:
                        status = "ok"
                else:
                    last_sid = None
                    ref_date = None
                    due_date = None
                    status = "never_done"

            # 4. Upsert
            now_ts = datetime.now(timezone.utc).isoformat()
            record = {
                "scope_type": "organization",
                "organization_id": org_id,
                "course_id": crs_id,
                "last_session_id": last_sid,
                "reference_date": ref_date.isoformat() if ref_date else None,
                "due_date": due_date.isoformat() if due_date else None,
                "status": status,
                "computed_at": now_ts,
                "updated_at": now_ts,
            }

            # Check if exists
            existing = (
                _table("training_due_items")
                .select("id, status")
                .eq("organization_id", org_id)
                .eq("course_id", crs_id)
                .eq("scope_type", "organization")
                .limit(1)
                .execute()
            )

            if existing.data:
                existing_row = existing.data[0]
                # Don't overwrite a manually closed item
                if existing_row["status"] == "closed":
                    continue
                _table("training_due_items").update(record).eq("id", existing_row["id"]).execute()
                stats["updated"] += 1
            else:
                record["created_at"] = now_ts
                _table("training_due_items").insert(record).execute()
                stats["created"] += 1

        except Exception:
            logger.exception("Error computing due_item for org=%s course=%s", org_id, crs_id)
            stats["errors"] += 1

    return stats
