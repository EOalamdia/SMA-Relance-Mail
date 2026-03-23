"""Email sending service — SMTP via Gmail.

Implements prompt.md §6.3 — template rendering, sending, delivery logging.
"""
from __future__ import annotations

import logging
import os
import smtplib
from datetime import date, datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from core.supabase import get_schema_table

logger = logging.getLogger("sma.email_sender")

_SCHEMA = "sma_relance"

# SMTP config from environment
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


def _render_template(template_text: str, variables: dict) -> str:
    """Safe template rendering using simple {{var}} replacement."""
    result = template_text
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", str(value) if value is not None else "")
    return result


def _build_template_variables(job: dict) -> dict:
    """Build template variables from job context."""
    variables: dict = {}

    # Load due_item
    di_resp = _table("training_due_items").select("*").eq("id", job["due_item_id"]).limit(1).execute()
    if di_resp.data:
        di = di_resp.data[0]
        variables["due_date"] = di.get("due_date", "")

        today = date.today()
        due_date = di.get("due_date")
        if due_date:
            due_date_parsed = date.fromisoformat(due_date) if isinstance(due_date, str) else due_date
            delta = (due_date_parsed - today).days
            variables["days_until"] = max(delta, 0)
            variables["days_overdue"] = max(-delta, 0)

        # Load organization
        org_resp = _table("organizations").select("name").eq("id", di["organization_id"]).limit(1).execute()
        if org_resp.data:
            variables["organization_name"] = org_resp.data[0]["name"]

        # Load course
        course_resp = _table("training_courses").select("title, code").eq("id", di["course_id"]).limit(1).execute()
        if course_resp.data:
            variables["course_title"] = course_resp.data[0]["title"]
            variables["course_code"] = course_resp.data[0]["code"]

    variables["recipient_email"] = job.get("recipient_email", "")
    return variables


def send_reminder_email(job: dict) -> bool:
    """Send an email for a reminder job and log the delivery.

    Returns True on success, False on failure.
    """
    template_id = job.get("template_id")
    if not template_id:
        logger.warning("Job %s has no template_id, skipping", job["id"])
        return False

    # Load template
    tmpl_resp = _table("email_templates").select("*").eq("id", template_id).limit(1).execute()
    if not tmpl_resp.data:
        logger.error("Template %s not found for job %s", template_id, job["id"])
        return False
    template = tmpl_resp.data[0]

    # Build variables and render
    variables = _build_template_variables(job)
    subject = _render_template(template["subject_template"], variables)
    body = _render_template(template["body_template"], variables)

    recipient = job["recipient_email"]
    now_ts = datetime.now(timezone.utc).isoformat()

    # Send via SMTP
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.warning("SMTP not configured, logging email instead: to=%s subject=%s", recipient, subject)
            _log_delivery(job["id"], "log", None, "sent", now_ts, None)
            return True

        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        _log_delivery(job["id"], "gmail_smtp", None, "sent", now_ts, None)
        return True

    except Exception as exc:
        logger.exception("SMTP send failed for job %s", job["id"])
        _log_delivery(job["id"], "gmail_smtp", None, "failed", None, {"error": str(exc)[:500]})
        return False


def _log_delivery(
    job_id: str,
    provider: str,
    provider_message_id: str | None,
    delivery_status: str,
    sent_at: str | None,
    error_payload: dict | None,
) -> None:
    """Log email delivery attempt."""
    try:
        _table("email_deliveries").insert({
            "reminder_job_id": job_id,
            "provider": provider,
            "provider_message_id": provider_message_id,
            "status": delivery_status,
            "sent_at": sent_at,
            "error_payload": error_payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        logger.exception("Failed to log email delivery for job %s", job_id)
