from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PaymentAttemptInitiateRequest(BaseModel):
    """Strict empty body for payment initiation; forbids client-supplied amount, status, or provider."""

    model_config = ConfigDict(extra="forbid")


class PaymentAttemptCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: Optional[str] = Field(default=None, max_length=200)

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class SandboxResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    outcome: Literal["succeeded", "failed", "indeterminate_timeout"]
    sandbox_token: str = Field(..., min_length=16, max_length=256)
    failure_code: Optional[str] = Field(default=None, max_length=64)

    @field_validator("sandbox_token")
    @classmethod
    def strip_token(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("sandbox_token cannot be blank")
        return cleaned

    @field_validator("failure_code")
    @classmethod
    def normalize_failure_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_failure_code_for_outcome(self) -> "SandboxResolveRequest":
        if self.outcome == "succeeded" and self.failure_code is not None:
            raise ValueError("failure_code is only permitted when outcome is not 'succeeded'")
        return self


class InventoryReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    quantity: int
    status: str
    expires_at: datetime
    consumed_at: Optional[datetime] = None
    released_at: Optional[datetime] = None


class DiscountReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    discount_id: int
    status: str
    expires_at: datetime
    consumed_at: Optional[datetime] = None
    released_at: Optional[datetime] = None


class PaymentNextActionResponse(BaseModel):
    type: str
    sandbox_token: Optional[str] = None


class PaymentAttemptResponse(BaseModel):
    id: int
    attempt_number: str
    order_id: int
    order_number: str
    order_status: str
    order_payment_status: str
    provider: str
    status: str
    amount_toman: int
    currency_unit: str
    provider_authority: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    reservation_status: str
    inventory_reservations: List[InventoryReservationResponse] = Field(default_factory=list)
    discount_reservation: Optional[DiscountReservationResponse] = None
    next_action: Optional[PaymentNextActionResponse] = None
    expires_at: datetime
    verified_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
