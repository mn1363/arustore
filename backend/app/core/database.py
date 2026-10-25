from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.models.base import Base


def normalize_async_db_url(raw_url: str) -> str:
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("sqlite:///") and "+aiosqlite" not in raw_url:
        return raw_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return raw_url


ASYNC_DATABASE_URL = normalize_async_db_url(settings.DATABASE_URL)

_engine_kwargs: dict = {"echo": settings.DEBUG}
if ASYNC_DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 40
    _engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(ASYNC_DATABASE_URL, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db", "normalize_async_db_url"]
