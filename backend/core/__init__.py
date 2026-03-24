"""Core exports for SMA."""
from .config import get_settings, settings
from .cache import redis_client
from .dependencies import UserContext, get_current_user
from .supabase import get_authenticated_client, get_schema_table, get_service_supabase

__all__ = [
    "settings",
    "get_settings",
    "redis_client",
    "UserContext",
    "get_current_user",
    "get_authenticated_client",
    "get_service_supabase",
    "get_schema_table",
]
