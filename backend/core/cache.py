"""Redis helpers used by security middleware and caches."""
from __future__ import annotations

import json
import logging
from typing import Any

import redis

from .config import settings

logger = logging.getLogger("app_starter.cache")


class RedisClient:
    def __init__(self) -> None:
        self.client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            encoding="utf-8",
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
        )

    def get_json(self, key: str) -> Any | None:
        try:
            value = self.client.get(key)
            return json.loads(value) if value else None
        except Exception as exc:
            logger.error("Redis get_json failed for %s: %s", key, exc)
            return None

    def set_json(self, key: str, value: Any, ttl: int | None = None) -> bool:
        try:
            payload = json.dumps(value, ensure_ascii=False)
            if ttl:
                return bool(self.client.setex(key, ttl, payload))
            return bool(self.client.set(key, payload))
        except Exception as exc:
            logger.error("Redis set_json failed for %s: %s", key, exc)
            return False

    def incr(self, key: str) -> int | None:
        try:
            return int(self.client.incr(key))
        except Exception as exc:
            logger.error("Redis incr failed for %s: %s", key, exc)
            return None

    def expire(self, key: str, ttl: int) -> bool:
        try:
            return bool(self.client.expire(key, ttl))
        except Exception as exc:
            logger.error("Redis expire failed for %s: %s", key, exc)
            return False

    def ttl(self, key: str) -> int:
        try:
            return int(self.client.ttl(key))
        except Exception as exc:
            logger.error("Redis ttl failed for %s: %s", key, exc)
            return -1

    def ping(self) -> bool:
        try:
            return bool(self.client.ping())
        except Exception as exc:
            logger.error("Redis ping failed: %s", exc)
            return False


redis_client = RedisClient()
