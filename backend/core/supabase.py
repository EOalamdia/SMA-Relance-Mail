"""Supabase helpers for service and user-scoped clients."""
from __future__ import annotations

from typing import Any

from supabase import Client, ClientOptions, create_client

from .config import settings


def get_service_supabase() -> Client:
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    return create_client(
        settings.supabase_url,
        key,
        options=ClientOptions(persist_session=False, auto_refresh_token=False),
    )


def get_authenticated_client(access_token: str) -> Client:
    client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
        options=ClientOptions(persist_session=False, auto_refresh_token=False),
    )
    client.postgrest.auth(access_token)
    client.options.headers.update({"Authorization": f"Bearer {access_token}"})
    return client


def get_schema_table(schema: str, table: str, client: Client | None = None) -> Any:
    scoped_client = client or get_service_supabase()
    return scoped_client.schema(schema).from_(table)
