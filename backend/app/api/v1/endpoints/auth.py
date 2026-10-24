from typing import Optional
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import oauth2_scheme
from app.core.database import get_db
from app.schemas.common import MessageResponse
from app.schemas.user import (
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    return await AuthService(db).register_user(user_data)


@router.post("/login", response_model=TokenResponse)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await AuthService(db).login_user(form_data.username, form_data.password)


@router.post("/login/json", response_model=TokenResponse)
async def login_json(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await AuthService(db).login_user(
        credentials.email_or_username, credentials.password
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await AuthService(db).refresh_token(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    if token:
        await AuthService(db).logout_user(token)
    return MessageResponse(message="Logged out successfully")
