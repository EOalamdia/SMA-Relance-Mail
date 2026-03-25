"""Business logic for computing training due items.

Implements prompt.md §6.1 — deterministic, idempotent due_date+status calculation.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta

from core.supabase import get_schema_table

logger = logging.getLogger("sma.due_items.service")

_SCHEMA = "sma_relance"
DUE_SOON_DAYS = 30  # configurable window for "due_soon"


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


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
    query = _table("v_course_applicability_expanded").select("organization_id, course_id")
    if organization_id:
        query = query.eq("organization_id", organization_id)
    if course_id:
        query = query.eq("course_id", course_id)
    pairs = query.execute().data or []

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
