"""Business logic for unsubscribe — token generation, subscription management, events."""
from __future__ import annotations

import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from core.supabase import get_schema_table

logger = logging.getLogger("sma.unsubscribe.service")

_SCHEMA = "sma_relance"

# Secret key for HMAC token signing — loaded from env, fallback to random (dev only)
_UNSUBSCRIBE_SECRET = os.environ.get("UNSUBSCRIBE_SECRET", "")
if not _UNSUBSCRIBE_SECRET:
    logger.warning("UNSUBSCRIBE_SECRET not set — generating random key (NOT production-safe)")
    _UNSUBSCRIBE_SECRET = secrets.token_hex(32)

# Token expiry (default: 90 days — CNIL recommends at least 3 years retention of opposition)
_TOKEN_EXPIRY_DAYS = int(os.environ.get("UNSUBSCRIBE_TOKEN_EXPIRY_DAYS", "90"))


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


def normalize_email(email: str) -> str:
    """Normalize email to lowercase, stripped."""
    return email.strip().lower()


def hash_email(email: str) -> str:
    """SHA-256 hash of normalized email for privacy-safe lookup."""
    normalized = normalize_email(email)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _sign_token(token_raw: str) -> str:
    """HMAC-SHA256 signature for a token."""
    return hmac.new(
        _UNSUBSCRIBE_SECRET.encode("utf-8"),
        token_raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _hash_token(token_raw: str) -> str:
    """Hash token for storage (never store raw tokens)."""
    return hashlib.sha256(token_raw.encode("utf-8")).hexdigest()


# ─── Token Generation ─────────────────────────────────────────────────────


def generate_unsubscribe_token(
    email: str,
    contact_id: str | None = None,
    communication_topic_id: str | None = None,
    reminder_job_id: str | None = None,
) -> str:
    """Generate a secure unsubscribe token and store its hash in DB.

    Returns the raw token (to embed in the unsubscribe URL).
    """
    token_raw = secrets.token_urlsafe(32)
    token_h = _hash_token(token_raw)
    normalized = normalize_email(email)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=_TOKEN_EXPIRY_DAYS)

    row = {
        "token_hash": token_h,
        "email_normalized": normalized,
        "expires_at": expires.isoformat(),
        "created_at": now.isoformat(),
    }
    if contact_id:
        row["contact_id"] = contact_id
    if communication_topic_id:
        row["communication_topic_id"] = communication_topic_id
    if reminder_job_id:
        row["reminder_job_id"] = reminder_job_id

    resp = _table("unsubscribe_tokens").insert(row).execute()
    if not resp.data:
        raise RuntimeError("Failed to persist unsubscribe token")

    return token_raw


# ─── Token Validation & Unsubscribe Processing ────────────────────────────


def process_unsubscribe(
    token_raw: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> dict:
    """Validate token and process unsubscribe. Idempotent.

    Returns: {"status": "...", "message": "..."}
    """
    token_h = _hash_token(token_raw)
    now = datetime.now(timezone.utc)

    # Look up token
    tok_resp = (
        _table("unsubscribe_tokens")
        .select("*")
        .eq("token_hash", token_h)
        .limit(1)
        .execute()
    )
    if not tok_resp.data:
        return {"status": "invalid", "message": "Lien de désinscription invalide ou introuvable."}

    token_row = tok_resp.data[0]

    # Check revoked
    if token_row.get("revoked_at"):
        return {"status": "revoked", "message": "Ce lien de désinscription a été révoqué."}

    # Check expiry
    expires_at = token_row.get("expires_at")
    if expires_at:
        exp_dt = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
        if now > exp_dt:
            return {"status": "expired", "message": "Ce lien de désinscription a expiré."}

    email_normalized = token_row["email_normalized"]
    email_h = hash_email(email_normalized)
    contact_id = token_row.get("contact_id")
    topic_id = token_row.get("communication_topic_id")

    # Check if already unsubscribed (idempotent)
    already_used = token_row.get("used_at") is not None
    if already_used:
        # Log idempotent event but don't error
        _log_event(
            email_normalized=email_normalized,
            email_hash=email_h,
            contact_id=contact_id,
            communication_topic_id=topic_id,
            event_type="unsubscribe_already_done",
            source="link_click",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return {"status": "already_done", "message": "Vous êtes déjà désinscrit(e)."}

    # Mark token as used
    _table("unsubscribe_tokens").update({
        "used_at": now.isoformat(),
    }).eq("id", token_row["id"]).execute()

    # Create or update subscription record → is_subscribed = false
    subscription_id = _upsert_unsubscription(
        email_normalized=email_normalized,
        email_hash=email_h,
        contact_id=contact_id,
        communication_topic_id=topic_id,
        source="link_click",
    )

    # Log event
    _log_event(
        subscription_id=subscription_id,
        email_normalized=email_normalized,
        email_hash=email_h,
        contact_id=contact_id,
        communication_topic_id=topic_id,
        event_type="unsubscribe_confirmed",
        source="link_click",
        ip_address=ip_address,
        user_agent=user_agent,
    )

    return {"status": "success", "message": "Votre désinscription a bien été prise en compte."}


# ─── Subscription State Management ────────────────────────────────────────


def _upsert_unsubscription(
    email_normalized: str,
    email_hash: str,
    contact_id: str | None = None,
    communication_topic_id: str | None = None,
    organization_id: str | None = None,
    source: str = "link_click",
    reason: str | None = None,
) -> str | None:
    """Create or update email_subscriptions record to mark as unsubscribed.

    Returns subscription id.
    """
    now = datetime.now(timezone.utc).isoformat()
    scope_type = "global" if not communication_topic_id else "topic"

    # Try to find existing subscription
    query = (
        _table("email_subscriptions")
        .select("id, is_subscribed")
        .eq("email_hash", email_hash)
        .eq("scope_type", scope_type)
    )
    if communication_topic_id:
        query = query.eq("communication_topic_id", communication_topic_id)
    else:
        query = query.is_("communication_topic_id", "null")

    if organization_id:
        query = query.eq("organization_id", organization_id)
    else:
        query = query.is_("organization_id", "null")

    existing = query.limit(1).execute()

    if existing.data:
        sub = existing.data[0]
        if not sub["is_subscribed"]:
            # Already unsubscribed, nothing to update
            return sub["id"]
        _table("email_subscriptions").update({
            "is_subscribed": False,
            "unsubscribed_at": now,
            "unsubscribed_reason": reason,
            "source": source,
        }).eq("id", sub["id"]).execute()
        return sub["id"]

    # Create new
    row = {
        "email_normalized": email_normalized,
        "email_hash": email_hash,
        "scope_type": scope_type,
        "is_subscribed": False,
        "unsubscribed_at": now,
        "unsubscribed_reason": reason,
        "source": source,
        "created_at": now,
        "updated_at": now,
    }
    if contact_id:
        row["contact_id"] = contact_id
    if communication_topic_id:
        row["communication_topic_id"] = communication_topic_id
    if organization_id:
        row["organization_id"] = organization_id

    resp = _table("email_subscriptions").insert(row).execute()
    return resp.data[0]["id"] if resp.data else None


def resubscribe(subscription_id: str, source: str = "admin", reason: str | None = None) -> dict | None:
    """Admin resubscribe action. Returns updated subscription or None."""
    now = datetime.now(timezone.utc).isoformat()

    sub_resp = _table("email_subscriptions").select("*").eq("id", subscription_id).limit(1).execute()
    if not sub_resp.data:
        return None

    sub = sub_resp.data[0]

    resp = _table("email_subscriptions").update({
        "is_subscribed": True,
        "unsubscribed_at": None,
        "unsubscribed_reason": None,
        "source": source,
    }).eq("id", subscription_id).execute()

    # Log resubscribe event
    _log_event(
        subscription_id=subscription_id,
        email_normalized=sub["email_normalized"],
        email_hash=sub["email_hash"],
        contact_id=sub.get("contact_id"),
        communication_topic_id=sub.get("communication_topic_id"),
        event_type="resubscribe",
        source=source,
        metadata={"reason": reason} if reason else None,
    )

    return resp.data[0] if resp.data else None


def is_email_unsubscribed(
    email: str,
    communication_topic_id: str | None = None,
) -> bool:
    """Check if an email is unsubscribed for a given topic (or globally).

    Checks both global and topic-specific unsubscriptions.
    """
    email_h = hash_email(email)

    # Check global unsubscription first
    global_resp = (
        _table("email_subscriptions")
        .select("id")
        .eq("email_hash", email_h)
        .eq("scope_type", "global")
        .eq("is_subscribed", False)
        .limit(1)
        .execute()
    )
    if global_resp.data:
        return True

    # Check topic-specific if topic_id provided
    if communication_topic_id:
        topic_resp = (
            _table("email_subscriptions")
            .select("id")
            .eq("email_hash", email_h)
            .eq("scope_type", "topic")
            .eq("communication_topic_id", communication_topic_id)
            .eq("is_subscribed", False)
            .limit(1)
            .execute()
        )
        if topic_resp.data:
            return True

    return False


# ─── Event Logging ────────────────────────────────────────────────────────


def _log_event(
    email_normalized: str,
    email_hash: str,
    event_type: str,
    source: str,
    subscription_id: str | None = None,
    contact_id: str | None = None,
    communication_topic_id: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict | None = None,
) -> None:
    """Log an unsubscribe event."""
    now = datetime.now(timezone.utc).isoformat()
    row: dict = {
        "email_normalized": email_normalized,
        "email_hash": email_hash,
        "event_type": event_type,
        "source": source,
        "created_at": now,
    }
    if subscription_id:
        row["subscription_id"] = subscription_id
    if contact_id:
        row["contact_id"] = contact_id
    if communication_topic_id:
        row["communication_topic_id"] = communication_topic_id
    if ip_address:
        row["ip_address"] = ip_address
    if user_agent:
        row["user_agent"] = user_agent[:500] if user_agent else None
    if metadata:
        row["metadata"] = metadata

    try:
        _table("unsubscribe_events").insert(row).execute()
    except Exception:
        logger.exception("Failed to log unsubscribe event for %s", email_hash[:12])


# ─── Unsubscribe Link Builder ─────────────────────────────────────────────

def build_unsubscribe_url(token_raw: str) -> str:
    """Build the public unsubscribe URL from a raw token."""
    domain = os.environ.get("DOMAIN_FRONTEND", "localhost")
    base_path = os.environ.get("FRONTEND_BASE_PATH", "")
    scheme = "https" if os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true" else "http"
    return f"{scheme}://{domain}{base_path}/unsubscribe?token={token_raw}"


def build_list_unsubscribe_headers(token_raw: str) -> dict[str, str]:
    """Build RFC 8058 List-Unsubscribe and List-Unsubscribe-Post headers.

    These are used by Gmail/Yahoo for one-click unsubscribe.
    """
    domain = os.environ.get("DOMAIN_API", "localhost")
    base_path = os.environ.get("FRONTEND_BASE_PATH", "")
    scheme = "https" if os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true" else "http"
    api_url = f"{scheme}://{domain}{base_path}/api/v1/public/unsubscribe/one-click"

    mailto_from = os.environ.get("SMTP_FROM", "")
    mailto_part = f", <mailto:{mailto_from}?subject=unsubscribe>" if mailto_from else ""

    return {
        "List-Unsubscribe": f"<{api_url}?token={token_raw}>{mailto_part}",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
