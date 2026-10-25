from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.redis import cache_manager
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    remaining_token_ttl,
    verify_password,
)
from app.models.user import User
from app.schemas.user import (
    AuthSessionResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.tasks.email_tasks import send_welcome_email_task
from app.utils.slugify import generate_slug


@dataclass(frozen=True)
class IssuedAuthTokens:
    access_token: str
    refresh_token: str
    expires_in: int
    user: UserResponse

    def to_browser_session(self) -> AuthSessionResponse:
        return AuthSessionResponse(
            access_token=self.access_token,
            token_type="bearer",
            expires_in=self.expires_in,
            user=self.user,
        )

    def to_token_pair(self) -> TokenResponse:
        return TokenResponse(
            access_token=self.access_token,
            refresh_token=self.refresh_token,
            token_type="bearer",
            expires_in=self.expires_in,
            user=self.user,
        )


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _build_tokens(
        self, user: User, session_id: Optional[str] = None
    ) -> IssuedAuthTokens:
        stmt = (
            select(User)
            .options(selectinload(User.addresses))
            .where(User.id == user.id)
        )
        loaded_user = (await self.db.execute(stmt)).scalar_one()
        sid = session_id or str(uuid.uuid4())
        subject = {
            "sub": str(loaded_user.id),
            "email": loaded_user.email,
            "sid": sid,
        }
        access_token = create_access_token(subject)
        refresh_token = create_refresh_token(subject)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return IssuedAuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserResponse.model_validate(loaded_user),
        )

    async def register_user(self, data: UserCreate) -> IssuedAuthTokens:
        slug_candidate = generate_slug(data.email.split("@")[0])
        if not slug_candidate or len(slug_candidate) < 3:
            slug_candidate = f"user-{uuid.uuid4().hex[:6]}"
        base_username = data.username or slug_candidate

        existing_stmt = select(User).where(
            or_(
                User.email == data.email.lower(),
                User.username == base_username,
                *([User.phone == data.phone] if data.phone else []),
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
            if data.username and existing.username == data.username:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Username is already taken",
                )
            base_username = f"{base_username}-{uuid.uuid4().hex[:4]}"

        user = User(
            email=data.email.lower(),
            username=base_username,
            full_name=data.full_name.strip(),
            phone=data.phone,
            password_hash=get_password_hash(data.password),
            is_active=True,
            is_admin=False,
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

    async def login_user(self, identifier: str, password: str) -> IssuedAuthTokens:
        ident = identifier.strip()
        if not ident or not password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password",
            )
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

    async def refresh_token(self, refresh_token_str: str) -> IssuedAuthTokens:
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        sid = payload.get("sid")
        if await cache_manager.is_token_blacklisted(str(jti)) or (
            sid and await cache_manager.is_session_revoked(str(sid))
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

        user_id = payload.get("sub")
        try:
            parsed_user_id = int(user_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            ) from exc

        stmt = select(User).where(User.id == parsed_user_id, User.is_active.is_(True))
        user = (await self.db.execute(stmt)).scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        refresh_ttl = remaining_token_ttl(
            payload, settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        )
        await cache_manager.blacklist_token(str(jti), ttl_seconds=refresh_ttl)
        return await self._build_tokens(
            user, session_id=str(sid) if sid else None
        )

    async def logout_user(
        self,
        access_token: Optional[str] = None,
        refresh_token: Optional[str] = None,
    ) -> None:
        if not access_token and not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        revoked_any = False
        session_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

        if access_token:
            access_payload = decode_token(access_token)
            if (
                access_payload
                and access_payload.get("type") == "access"
                and access_payload.get("jti")
            ):
                access_ttl = remaining_token_ttl(
                    access_payload, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
                )
                await cache_manager.blacklist_token(
                    str(access_payload["jti"]), ttl_seconds=access_ttl
                )
                if access_payload.get("sid"):
                    await cache_manager.revoke_session(
                        str(access_payload["sid"]), ttl_seconds=session_ttl
                    )
                revoked_any = True

        if refresh_token:
            refresh_payload = decode_token(refresh_token)
            if (
                refresh_payload
                and refresh_payload.get("type") == "refresh"
                and refresh_payload.get("jti")
            ):
                refresh_ttl = remaining_token_ttl(refresh_payload, session_ttl)
                await cache_manager.blacklist_token(
                    str(refresh_payload["jti"]), ttl_seconds=refresh_ttl
                )
                if refresh_payload.get("sid"):
                    await cache_manager.revoke_session(
                        str(refresh_payload["sid"]), ttl_seconds=session_ttl
                    )
                revoked_any = True

        if not revoked_any:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            )
