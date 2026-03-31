"""Endpoints for unsubscribe feature — communication topics, subscriptions, events.

Includes both authenticated admin endpoints and public unsubscribe routes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from core.dependencies import UserContext, get_current_user
from core.supabase import get_schema_table

from .schemas import (
    CommunicationTopicCreate,
    CommunicationTopicListResponse,
    CommunicationTopicOut,
    CommunicationTopicUpdate,
    EmailSubscriptionListResponse,
    EmailSubscriptionOut,
    EmailSubscriptionResubscribe,
    UnsubscribeConfirmResponse,
    UnsubscribeEventListResponse,
    UnsubscribeEventOut,
)
from .service import process_unsubscribe, resubscribe

_SCHEMA = "sma_relance"


def _table(name: str):
    return get_schema_table(_SCHEMA, name)


# ============================================================================
# Public router — accessible without authentication (token-secured)
# ============================================================================

public_router = APIRouter(prefix="/v1/public/unsubscribe", tags=["Unsubscribe (Public)"])


def _extract_client_ip(request: Request | None) -> str | None:
    """Best-effort client IP extraction behind reverse proxies."""
    if not request:
        return None

    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip

    real_ip = request.headers.get("x-real-ip", "").strip()
    if real_ip:
        return real_ip

    return request.client.host if request.client else None


@public_router.get("", response_model=UnsubscribeConfirmResponse)
def public_unsubscribe_get(
    token: str = Query(..., min_length=10, max_length=200),
    request: Request = None,
):
    """Public GET endpoint for unsubscribe link clicks.

    Processes the unsubscribe and returns a confirmation.
    This is the endpoint rendered in email links.
    """
    ip_address = _extract_client_ip(request)
    user_agent = request.headers.get("user-agent", "")[:500] if request else None

    result = process_unsubscribe(
        token_raw=token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return UnsubscribeConfirmResponse(**result)


@public_router.post("/one-click", response_model=UnsubscribeConfirmResponse)
async def public_one_click_unsubscribe(
    request: Request,
    token: str = Query(..., min_length=10, max_length=200),
):
    """RFC 8058 one-click unsubscribe POST endpoint.

    Used by Gmail/Yahoo mail clients via List-Unsubscribe-Post header.
    """
    ip_address = _extract_client_ip(request)
    user_agent = request.headers.get("user-agent", "")[:500]

    result = process_unsubscribe(
        token_raw=token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return UnsubscribeConfirmResponse(**result)


# ============================================================================
# Communication Topics — Admin CRUD
# ============================================================================

topics_router = APIRouter(prefix="/v1/communication-topics", tags=["Communication Topics"])


@topics_router.get("", response_model=CommunicationTopicListResponse)
def list_communication_topics(_user: UserContext = Depends(get_current_user)):
    response = _table("communication_topics").select("*").order("code").execute()
    rows = response.data or []
    return CommunicationTopicListResponse(
        items=[CommunicationTopicOut(**r) for r in rows],
        count=len(rows),
    )


@topics_router.get("/{item_id}", response_model=CommunicationTopicOut)
def get_communication_topic(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table("communication_topics").select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic de communication non trouvé.")
    return CommunicationTopicOut(**response.data[0])


@topics_router.post("", response_model=CommunicationTopicOut, status_code=status.HTTP_201_CREATED)
def create_communication_topic(payload: CommunicationTopicCreate, _user: UserContext = Depends(get_current_user)):
    response = _table("communication_topics").insert(payload.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Échec de la création.")
    return CommunicationTopicOut(**response.data[0])


@topics_router.patch("/{item_id}", response_model=CommunicationTopicOut)
def update_communication_topic(
    item_id: UUID,
    payload: CommunicationTopicUpdate,
    _user: UserContext = Depends(get_current_user),
):
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Aucun champ à mettre à jour.")
    exists = _table("communication_topics").select("id").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic de communication non trouvé.")
    response = _table("communication_topics").update(changes).eq("id", str(item_id)).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Échec de la mise à jour.")
    return CommunicationTopicOut(**response.data[0])


@topics_router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_communication_topic(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    exists = _table("communication_topics").select("id").eq("id", str(item_id)).limit(1).execute()
    if not exists.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic de communication non trouvé.")
    _table("communication_topics").update({"is_active": False}).eq("id", str(item_id)).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================================
# Email Subscriptions — Admin management
# ============================================================================

subscriptions_router = APIRouter(prefix="/v1/email-subscriptions", tags=["Email Subscriptions"])


@subscriptions_router.get("", response_model=EmailSubscriptionListResponse)
def list_email_subscriptions(
    is_subscribed: bool | None = Query(None),
    topic_id: str | None = Query(None, alias="communication_topic_id"),
    email: str | None = Query(None),
    _user: UserContext = Depends(get_current_user),
):
    query = _table("email_subscriptions").select("*")
    if is_subscribed is not None:
        query = query.eq("is_subscribed", is_subscribed)
    if topic_id:
        query = query.eq("communication_topic_id", topic_id)
    if email:
        from .service import hash_email
        query = query.eq("email_hash", hash_email(email))
    response = query.order("updated_at", desc=True).execute()
    rows = response.data or []
    return EmailSubscriptionListResponse(
        items=[EmailSubscriptionOut(**r) for r in rows],
        count=len(rows),
    )


@subscriptions_router.get("/{item_id}", response_model=EmailSubscriptionOut)
def get_email_subscription(item_id: UUID, _user: UserContext = Depends(get_current_user)):
    response = _table("email_subscriptions").select("*").eq("id", str(item_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Abonnement non trouvé.")
    return EmailSubscriptionOut(**response.data[0])


@subscriptions_router.post("/{item_id}/resubscribe", response_model=EmailSubscriptionOut)
def resubscribe_contact(
    item_id: UUID,
    payload: EmailSubscriptionResubscribe,
    _user: UserContext = Depends(get_current_user),
):
    """Admin action: resubscribe a previously unsubscribed contact."""
    result = resubscribe(str(item_id), source="admin", reason=payload.reason)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Abonnement non trouvé.")
    return EmailSubscriptionOut(**result)


# ============================================================================
# Unsubscribe Events — Admin read-only
# ============================================================================

events_router = APIRouter(prefix="/v1/unsubscribe-events", tags=["Unsubscribe Events"])


@events_router.get("", response_model=UnsubscribeEventListResponse)
def list_unsubscribe_events(
    event_type: str | None = Query(None),
    email: str | None = Query(None),
    _user: UserContext = Depends(get_current_user),
):
    query = _table("unsubscribe_events").select("*")
    if event_type:
        query = query.eq("event_type", event_type)
    if email:
        from .service import hash_email
        query = query.eq("email_hash", hash_email(email))
    response = query.order("created_at", desc=True).limit(500).execute()
    rows = response.data or []
    return UnsubscribeEventListResponse(
        items=[UnsubscribeEventOut(**r) for r in rows],
        count=len(rows),
    )
