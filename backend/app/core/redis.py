import json
import time
from typing import Any, Optional
from fastapi import HTTPException, status
import redis.asyncio as aioredis
from app.core.config import settings


class CacheManager:
    """Async Redis cache with dev/test in-memory fallback and fail-closed production revocation."""

    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url
        self._client: Optional[aioredis.Redis] = None
        self._redis_available: Optional[bool] = None
        self._memory_store: dict[str, tuple[str, Optional[float]]] = {}

    def _is_production(self) -> bool:
        return settings.is_production

    async def _get_client(self, *, retry_unavailable: bool = False) -> Optional[aioredis.Redis]:
        if self._redis_available is False and not retry_unavailable:
            return None
        if self._client is None:
            try:
                client = aioredis.from_url(
                    self._redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=0.5,
                    socket_timeout=0.5,
                )
                await client.ping()
                self._client = client
                self._redis_available = True
            except Exception:
                self._redis_available = False
                self._client = None
        return self._client

    async def _require_redis_client(self) -> aioredis.Redis:
        client = await self._get_client(retry_unavailable=True)
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Session revocation store is unavailable",
            )
        return client

    async def _reset_broken_client(self) -> None:
        self._redis_available = False
        if self._client is not None:
            try:
                await self._client.close()
            except Exception:
                pass
            self._client = None

    def _prune_expired(self) -> None:
        now = time.monotonic()
        expired = [
            k for k, (_, exp) in self._memory_store.items() if exp is not None and exp <= now
        ]
        for key in expired:
            self._memory_store.pop(key, None)

    async def get(self, key: str) -> Optional[str]:
        client = await self._get_client()
        if client is not None:
            try:
                return await client.get(key)
            except Exception:
                await self._reset_broken_client()
        self._prune_expired()
        entry = self._memory_store.get(key)
        return entry[0] if entry else None

    async def set(self, key: str, value: str, ttl_seconds: Optional[int] = 300) -> None:
        client = await self._get_client()
        if client is not None:
            try:
                if ttl_seconds:
                    await client.setex(key, ttl_seconds, value)
                else:
                    await client.set(key, value)
                return
            except Exception:
                await self._reset_broken_client()
        exp = time.monotonic() + ttl_seconds if ttl_seconds else None
        self._memory_store[key] = (value, exp)

    async def get_json(self, key: str) -> Any:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    async def set_json(self, key: str, payload: Any, ttl_seconds: Optional[int] = 300) -> None:
        await self.set(key, json.dumps(payload, default=str), ttl_seconds=ttl_seconds)

    async def delete(self, key: str) -> None:
        client = await self._get_client()
        if client is not None:
            try:
                await client.delete(key)
            except Exception:
                await self._reset_broken_client()
        self._memory_store.pop(key, None)

    async def _write_revocation_flag(self, key: str, ttl_seconds: int) -> None:
        ttl = max(1, int(ttl_seconds))
        if self._is_production():
            client = await self._require_redis_client()
            try:
                await client.setex(key, ttl, "1")
                return
            except Exception as exc:
                await self._reset_broken_client()
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Session revocation store is unavailable",
                ) from exc
        await self.set(key, "1", ttl_seconds=ttl)

    async def _read_revocation_flag(self, key: str) -> bool:
        if self._is_production():
            client = await self._require_redis_client()
            try:
                return (await client.get(key)) == "1"
            except Exception as exc:
                await self._reset_broken_client()
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Session revocation store is unavailable",
                ) from exc
        return (await self.get(key)) == "1"

    async def blacklist_token(self, token_id: str, ttl_seconds: int = 3600) -> None:
        await self._write_revocation_flag(f"bl:{token_id}", ttl_seconds)

    async def is_token_blacklisted(self, token_id: str) -> bool:
        return await self._read_revocation_flag(f"bl:{token_id}")

    async def revoke_session(self, session_id: str, ttl_seconds: int = 7 * 86400) -> None:
        await self._write_revocation_flag(f"bl_sid:{session_id}", ttl_seconds)

    async def is_session_revoked(self, session_id: str) -> bool:
        return await self._read_revocation_flag(f"bl_sid:{session_id}")

    async def health(self) -> dict[str, str]:
        client = await self._get_client()
        return {
            "backend": "redis" if client is not None else "in-memory-fallback",
            "status": "ok",
        }

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None


cache_manager = CacheManager(settings.REDIS_URL)
