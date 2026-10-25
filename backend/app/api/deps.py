from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.redis import cache_manager
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    jti = payload.get("jti")
    if not jti or await cache_manager.is_token_blacklisted(str(jti)):
        return None
    sid = payload.get("sid")
    if sid and await cache_manager.is_session_revoked(str(sid)):
        return None
    user_id = payload.get("sub")
    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    stmt = (
        select(User)
        .options(selectinload(User.addresses))
        .where(User.id == parsed_user_id, User.is_active.is_(True))
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def get_current_user(
    user: Optional[User] = Depends(get_optional_user),
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
