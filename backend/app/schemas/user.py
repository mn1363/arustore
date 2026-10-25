from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.utils.validators import (
    normalize_iran_phone,
    validate_password_strength,
    validate_postal_code,
)


class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=200)
    phone: Optional[str] = None
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return normalize_iran_phone(v)

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserLogin(BaseModel):
    email_or_username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    phone: Optional[str] = None
    avatar: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return normalize_iran_phone(v)


class AddressCreate(BaseModel):
    title: str = Field(default="Home", max_length=100)
    recipient_name: str = Field(..., min_length=2, max_length=200)
    phone: str
    city: str = Field(..., min_length=2, max_length=120)
    address_line: str = Field(..., min_length=5, max_length=500)
    postal_code: str
    is_default: bool = False

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        normalized = normalize_iran_phone(v)
        if not normalized:
            raise ValueError("Phone number is required")
        return normalized

    @field_validator("postal_code")
    @classmethod
    def check_postal(cls, v: str) -> str:
        return validate_postal_code(v)


class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    recipient_name: str
    phone: str
    city: str
    address_line: str
    postal_code: str
    is_default: bool


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    full_name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    loyalty_points: int = 0
    loyalty_tier: str = "Silver"
    is_active: bool = True
    is_admin: bool = False
    is_verified: bool = False
    created_at: Optional[datetime] = None
    addresses: List[AddressResponse] = Field(default_factory=list)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
