from typing import Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import oauth2_scheme
from app.core.config import settings
from app.core.database import get_db
from app.schemas.common import MessageResponse
from app.schemas.user import (
    AuthSessionResponse,
    LogoutRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.services.auth_service import AuthService

router = APIRouter()
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _set_refresh_cookie(response: Response, refresh_token_value: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token_value,
        httponly=True,
        secure=bool(settings.REFRESH_COOKIE_SECURE),
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=bool(settings.REFRESH_COOKIE_SECURE),
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


@router.post(
    "/register",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthSessionResponse:
    """Register a user account, set an HttpOnly refresh cookie, and return an access session without exposing `refresh_token` in JSON."""
    issued = await AuthService(db).register_user(user_data)
    _set_refresh_cookie(response, issued.refresh_token)
    return issued.to_browser_session()


@router.post("/login", response_model=AuthSessionResponse)
async def login_form(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> AuthSessionResponse:
    """OAuth2 form login. Sets an HttpOnly refresh cookie and omits `refresh_token` from JSON."""
    issued = await AuthService(db).login_user(form_data.username, form_data.password)
    _set_refresh_cookie(response, issued.refresh_token)
    return issued.to_browser_session()


@router.post("/login/json", response_model=AuthSessionResponse)
async def login_json(
    credentials: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthSessionResponse:
    """Browser JSON login. Sets an HttpOnly refresh cookie and omits `refresh_token` from JSON."""
    issued = await AuthService(db).login_user(
        credentials.email_or_username, credentials.password
    )
    _set_refresh_cookie(response, issued.refresh_token)
    return issued.to_browser_session()


@router.post("/refresh", response_model=AuthSessionResponse)
async def refresh_cookie_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthSessionResponse:
    """Rotate a browser session strictly from the HttpOnly refresh cookie without exposing `refresh_token` in JSON."""
    raw_refresh = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token cookie",
        )
    issued = await AuthService(db).refresh_token(raw_refresh)
    _set_refresh_cookie(response, issued.refresh_token)
    return issued.to_browser_session()


@router.post("/token", response_model=TokenResponse)
async def issue_api_token_pair(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Explicit non-browser programmatic client token endpoint. Does not read or set cookies."""
    issued = await AuthService(db).login_user(
        credentials.email_or_username, credentials.password
    )
    return issued.to_token_pair()


@router.post("/token/refresh", response_model=TokenResponse)
async def refresh_api_token_pair(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Explicit non-browser programmatic token rotation endpoint. Requires JSON `refresh_token` and ignores cookies."""
    issued = await AuthService(db).refresh_token(payload.refresh_token)
    return issued.to_token_pair()


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    token: Optional[str] = Depends(oauth2_scheme),
    payload: Optional[LogoutRequest] = Body(default=None),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Revoke current access token and refresh session, and clear the HttpOnly refresh cookie."""
    raw_refresh = (
        payload.refresh_token if payload and payload.refresh_token else None
    ) or request.cookies.get(settings.REFRESH_COOKIE_NAME)
    await AuthService(db).logout_user(
        access_token=token,
        refresh_token=raw_refresh,
    )
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")
