"""Email sending service — SMTP via Gmail.

Implements prompt.md §6.3 — template rendering, sending, delivery logging.
"""
from __future__ import annotations

import logging
import os
import re
import smtplib
from html import escape, unescape
from datetime import date, datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import make_msgid

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


def _smtp_message_id_domain() -> str | None:
    for value in (SMTP_FROM, SMTP_USER):
        if not value or "@" not in value:
            continue
        domain = value.split("@", 1)[1].strip().strip(">").strip()
        if domain:
            return domain
    return None


def _render_template(template_text: str, variables: dict) -> str:
    """Safe template rendering using simple {{var}} replacement."""
    result = template_text
    for key, value in variables.items():
        result = result.replace("{{" + key + "}}", str(value) if value is not None else "")
    return result


def _is_html_content(text: str) -> bool:
    """Best-effort detection of HTML template content."""
    return bool(re.search(r"<\s*[a-zA-Z][^>]*>", text or ""))


def _html_to_text(html_content: str) -> str:
    """Very small HTML -> text fallback for multipart/alternative."""
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", html_content, flags=re.IGNORECASE)
    text = re.sub(r"<\s*/\s*p\s*>", "\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()


def _plain_to_html(text_content: str) -> str:
    """Convert plain text into safe minimal HTML."""
    safe = escape(text_content or "")
    return "<html><body><pre style=\"white-space: pre-wrap; font-family: inherit;\">" + safe + "</pre></body></html>"


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

    # Determine if this message is unsubscribable and generate unsubscribe link
    unsubscribable = job.get("unsubscribable", True)
    include_unsub = template.get("include_unsubscribe_link", True)
    unsub_token_raw = None
    unsub_url = None
    unsub_headers: dict[str, str] = {}

    if unsubscribable and include_unsub:
        try:
            from features.unsubscribe.service import (
                generate_unsubscribe_token,
                build_unsubscribe_url,
                build_list_unsubscribe_headers,
            )

            unsub_token_raw = generate_unsubscribe_token(
                email=job["recipient_email"],
                contact_id=job.get("recipient_contact_id"),
                communication_topic_id=job.get("communication_topic_id"),
                reminder_job_id=job.get("id"),
            )
            unsub_url = build_unsubscribe_url(unsub_token_raw)
            unsub_headers = build_list_unsubscribe_headers(unsub_token_raw)

            # Store token reference on the job
            _table("reminder_jobs").update({
                "unsubscribe_token_id": None,  # We reference via the token_hash, not FK
            }).eq("id", job["id"]).execute()

        except Exception:
            logger.exception("Failed to generate unsubscribe token for job %s", job["id"])
            # Continue sending without unsubscribe link rather than failing

    # Inject unsubscribe footer into body if URL was generated
    body_is_html = _is_html_content(body)
    if unsub_url:
        if body_is_html:
            unsub_url_safe = escape(unsub_url, quote=True)
            unsub_footer = (
                "<hr>"
                "<p>Si vous ne souhaitez plus recevoir ces emails, "
                f"<a href=\"{unsub_url_safe}\">cliquez ici pour vous désinscrire</a>.</p>"
            )
        else:
            unsub_footer = (
                "\n\n---\n"
                "Si vous ne souhaitez plus recevoir ces emails, "
                f"cliquez ici pour vous désinscrire : {unsub_url}\n"
            )
        body = body + unsub_footer
        variables["unsubscribe_url"] = unsub_url

    recipient = job["recipient_email"]
    now_ts = datetime.now(timezone.utc).isoformat()
    provider_message_id: str | None = None

    # Send via SMTP
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.warning("SMTP not configured, logging email instead: to=%s subject=%s", recipient, subject)
            _log_delivery(job["id"], "log", None, "sent", now_ts, None,
                          unsub_link_rendered=unsub_url is not None)
            return True

        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = recipient
        msg["Subject"] = subject
        msgid_domain = _smtp_message_id_domain()
        provider_message_id = make_msgid(domain=msgid_domain) if msgid_domain else make_msgid()
        msg["Message-ID"] = provider_message_id

        # Add RFC 8058 List-Unsubscribe headers for one-click unsubscribe
        for header_name, header_value in unsub_headers.items():
            msg[header_name] = header_value

        # Support both plain-text templates and HTML templates.
        if body_is_html:
            msg.attach(MIMEText(_html_to_text(body), "plain", "utf-8"))
            msg.attach(MIMEText(body, "html", "utf-8"))
        else:
            msg.attach(MIMEText(body, "plain", "utf-8"))
            msg.attach(MIMEText(_plain_to_html(body), "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        _log_delivery(job["id"], "gmail_smtp", provider_message_id, "sent", now_ts, None,
                      unsub_link_rendered=unsub_url is not None)
        return True

    except Exception as exc:
        logger.exception("SMTP send failed for job %s", job["id"])
        _log_delivery(job["id"], "gmail_smtp", provider_message_id, "failed", None, {"error": str(exc)[:500]},
                      unsub_link_rendered=unsub_url is not None)
        return False


def _log_delivery(
    job_id: str,
    provider: str,
    provider_message_id: str | None,
    delivery_status: str,
    sent_at: str | None,
    error_payload: dict | None,
    unsub_link_rendered: bool = False,
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
            "unsubscribe_link_rendered": unsub_link_rendered,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        logger.exception("Failed to log email delivery for job %s", job_id)
