from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import cache_manager
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserResponse
from app.tasks.email_tasks import send_welcome_email_task
from app.utils.slugify import generate_slug


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _build_tokens(self, user: User) -> TokenResponse:
        # Reload with addresses for serialization
        stmt = (
            select(User)
            .options(selectinload(User.addresses))
            .where(User.id == user.id)
        )
        loaded_user = (await self.db.execute(stmt)).scalar_one()
        subject = {"sub": str(loaded_user.id), "email": loaded_user.email}
        access_token = create_access_token(subject)
        refresh_token = create_refresh_token(subject)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(loaded_user),
        )

    async def register_user(self, data: UserCreate) -> TokenResponse:
        base_username = data.username or generate_slug(data.email.split("@")[0])
        existing_stmt = select(User).where(
            or_(
                User.email == data.email.lower(),
                User.username == base_username,
                *( [User.phone == data.phone] if data.phone else [] ),
            )
        )
        existing = (await self.db.execute(existing_stmt)).scalars().first()
        if existing:
            if existing.email == data.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email is already registered",
                )
            if data.phone and existing.phone == data.phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number is already registered",
                )
            base_username = f"{base_username}-{int(datetime.now(timezone.utc).timestamp()) % 10000}"

        user = User(
            email=data.email.lower(),
            username=base_username,
            full_name=data.full_name.strip(),
            phone=data.phone,
            password_hash=get_password_hash(data.password),
            is_active=True,
            is_verified=True,
            last_login=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        try:
            send_welcome_email_task.delay(user.email, user.full_name)
        except Exception:
            pass

        return await self._build_tokens(user)

    async def login_user(self, identifier: str, password: str) -> TokenResponse:
        ident = identifier.strip()
        stmt = select(User).where(
            or_(User.email == ident.lower(), User.username == ident)
        )
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
        user.last_login = datetime.now(timezone.utc)
        await self.db.commit()
        return await self._build_tokens(user)

    async def refresh_token(self, refresh_token_str: str) -> TokenResponse:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        jti = payload.get("jti")
        if jti and await cache_manager.is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )
        user_id = payload.get("sub")
        stmt = select(User).where(User.id == int(user_id), User.is_active.is_(True))
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        if jti:
            await cache_manager.blacklist_token(jti, ttl_seconds=7 * 86400)
        return await self._build_tokens(user)

    async def logout_user(self, access_token: str) -> None:
        payload = decode_token(access_token)
        jti = payload.get("jti") if payload else None
        if jti:
            await cache_manager.blacklist_token(jti, ttl_seconds=3600)
