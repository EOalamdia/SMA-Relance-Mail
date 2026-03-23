"""Business logic for generating and sending reminder jobs.

Implements prompt.md §6.2 — idempotent reminder job generation.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta

from core.supabase import get_schema_table

logger = logging.getLogger("sma.reminder_jobs.service")

_SCHEMA = "sma_relance"


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


def _compute_scheduled_for(due_date: date, rule: dict) -> datetime:
    """Compute the scheduled_for timestamp from due_date + rule offset."""
    offset_sign = rule["offset_sign"]
    offset_value = rule["offset_value"]
    offset_unit = rule["offset_unit"]

    if offset_unit == "month":
        delta = relativedelta(months=offset_value * offset_sign)
    else:
        delta = relativedelta(days=offset_value * offset_sign)

    target_date = due_date + delta
    return datetime(target_date.year, target_date.month, target_date.day, 8, 0, 0, tzinfo=timezone.utc)


def _compute_idempotency_key(due_item_id: str, rule_id: str, scheduled_for: str, recipient_email: str) -> str:
    """Hash-based idempotency key per prompt.md §6.2."""
    raw = f"{due_item_id}|{rule_id}|{scheduled_for}|{recipient_email}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _resolve_recipient(org_id: str, strategy: str) -> dict | None:
    """Resolve recipient contact based on strategy."""
    if strategy == "primary":
        resp = (
            _table("organization_contacts")
            .select("id, email")
            .eq("organization_id", org_id)
            .eq("is_primary", True)
            .is_("archived_at", "null")
            .limit(1)
            .execute()
        )
        if resp.data:
            return resp.data[0]

    # Fallback: any active contact for the org
    resp = (
        _table("organization_contacts")
        .select("id, email")
        .eq("organization_id", org_id)
        .is_("archived_at", "null")
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def generate_reminder_jobs() -> dict:
    """Generate reminder_jobs for all eligible due_items + active rules.

    Only creates jobs if idempotency_key is absent (ON CONFLICT skip).
    """
    stats = {"generated": 0, "skipped": 0, "errors": 0}

    # Load active rules
    rules = (
        _table("reminder_rules")
        .select("*")
        .eq("is_active", True)
        .is_("archived_at", "null")
        .execute()
        .data or []
    )
    if not rules:
        return stats

    # Load eligible due_items (with a due_date, not closed/no_reminder)
    due_items = (
        _table("training_due_items")
        .select("id, organization_id, course_id, due_date, status")
        .not_.is_("due_date", "null")
        .neq("status", "closed")
        .neq("status", "no_reminder")
        .neq("status", "missing_policy")
        .execute()
        .data or []
    )
    if not due_items:
        return stats

    for di in due_items:
        for rule in rules:
            try:
                due_date_raw = di["due_date"]
                due_date = date.fromisoformat(due_date_raw) if isinstance(due_date_raw, str) else due_date_raw

                scheduled_for = _compute_scheduled_for(due_date, rule)
                scheduled_for_str = scheduled_for.isoformat()

                # Resolve recipient
                recipient = _resolve_recipient(di["organization_id"], rule["recipient_strategy"])
                if not recipient:
                    stats["skipped"] += 1
                    continue

                recipient_email = recipient["email"]
                contact_id = recipient["id"]

                # Compute idempotency key
                idem_key = _compute_idempotency_key(
                    di["id"], rule["id"], scheduled_for_str, recipient_email
                )

                # Check if already exists
                existing = (
                    _table("reminder_jobs")
                    .select("id")
                    .eq("idempotency_key", idem_key)
                    .limit(1)
                    .execute()
                )
                if existing.data:
                    stats["skipped"] += 1
                    continue

                # Create job
                now_ts = datetime.now(timezone.utc).isoformat()
                _table("reminder_jobs").insert({
                    "due_item_id": di["id"],
                    "reminder_rule_id": rule["id"],
                    "recipient_contact_id": contact_id,
                    "recipient_email": recipient_email,
                    "template_id": rule.get("template_id"),
                    "scheduled_for": scheduled_for_str,
                    "status": "pending",
                    "idempotency_key": idem_key,
                    "created_at": now_ts,
                    "updated_at": now_ts,
                }).execute()
                stats["generated"] += 1

            except Exception:
                logger.exception("Error generating job for due_item=%s rule=%s", di["id"], rule["id"])
                stats["errors"] += 1

    return stats


def send_pending_jobs() -> dict:
    """Send all pending/ready jobs whose scheduled_for <= now."""
    from core.email_sender import send_reminder_email

    stats = {"sent": 0, "failed": 0, "skipped": 0}
    now_ts = datetime.now(timezone.utc).isoformat()

    jobs = (
        _table("reminder_jobs")
        .select("*")
        .in_("status", ["pending", "ready"])
        .lte("scheduled_for", now_ts)
        .order("scheduled_for")
        .limit(100)
        .execute()
        .data or []
    )

    for job in jobs:
        try:
            success = send_reminder_email(job)
            if success:
                _table("reminder_jobs").update({
                    "status": "sent",
                    "attempt_count": job["attempt_count"] + 1,
                    "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", job["id"]).execute()
                stats["sent"] += 1
            else:
                _table("reminder_jobs").update({
                    "status": "failed",
                    "attempt_count": job["attempt_count"] + 1,
                    "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                    "error_message": "Email sending failed",
                }).eq("id", job["id"]).execute()
                stats["failed"] += 1
        except Exception as exc:
            logger.exception("Error sending job %s", job["id"])
            _table("reminder_jobs").update({
                "status": "failed",
                "attempt_count": job["attempt_count"] + 1,
                "last_attempt_at": datetime.now(timezone.utc).isoformat(),
                "error_message": str(exc)[:500],
            }).eq("id", job["id"]).execute()
            stats["failed"] += 1

    return stats
