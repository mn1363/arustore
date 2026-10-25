from dataclasses import dataclass
import hashlib
import hmac
from typing import Literal, Optional, Protocol

from app.core.config import Settings


@dataclass(frozen=True)
class GatewaySessionRequest:
    attempt_id: int
    attempt_number: str
    order_id: int
    order_number: str
    user_id: int
    amount_toman: int
    currency_unit: str


@dataclass(frozen=True)
class GatewaySessionInitResult:
    outcome: Literal["ready", "definitive_failure", "indeterminate_error"]
    provider: str
    authority: Optional[str] = None
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None


@dataclass(frozen=True)
class GatewayVerificationRequest:
    attempt_id: int
    attempt_number: str
    order_id: int
    order_number: str
    user_id: int
    expected_amount_toman: int
    currency_unit: str
    provider_authority: Optional[str]
    requested_outcome: Literal["succeeded", "failed", "indeterminate_timeout"]
    requested_failure_code: Optional[str] = None


@dataclass(frozen=True)
class GatewayVerificationResult:
    outcome: Literal["succeeded", "failed", "indeterminate_timeout"]
    provider: str
    provider_transaction_id: Optional[str] = None
    verified_amount_toman: Optional[int] = None
    currency_unit: str = "toman"
    funds_captured_hint: bool = False
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None


class PaymentGatewayPort(Protocol):
    @property
    def provider_name(self) -> str: ...

    async def create_session(
        self, req: GatewaySessionRequest
    ) -> GatewaySessionInitResult: ...

    async def verify_attempt(
        self, req: GatewayVerificationRequest
    ) -> GatewayVerificationResult: ...


def derive_sandbox_token(
    app_settings: Settings,
    *,
    attempt_number: str,
    order_id: int,
    user_id: int,
    amount_toman: int,
    sandbox_nonce: str,
) -> str:
    """
    Reproducibly compute the per-attempt sandbox token via server-side HMAC-SHA256.
    Raw token is never persisted in the database or written to logs.
    """
    key_material = (
        f"arustore-p0c3-sandbox-token-v1:"
        f"{app_settings.SECRET_KEY}:"
        f"{app_settings.PAYMENT_GATEWAY_SECRET}"
    ).encode("utf-8")
    signing_key = hashlib.sha256(key_material).digest()
    msg = (
        f"v1:{attempt_number}:{order_id}:{user_id}:{amount_toman}:{sandbox_nonce}"
    ).encode("utf-8")
    return hmac.new(signing_key, msg, hashlib.sha256).hexdigest()


def verify_sandbox_token(
    app_settings: Settings,
    *,
    provided_token: str,
    attempt_number: str,
    order_id: int,
    user_id: int,
    amount_toman: int,
    sandbox_nonce: Optional[str],
) -> bool:
    if not sandbox_nonce or not provided_token:
        return False
    expected = derive_sandbox_token(
        app_settings,
        attempt_number=attempt_number,
        order_id=order_id,
        user_id=user_id,
        amount_toman=amount_toman,
        sandbox_nonce=sandbox_nonce,
    )
    return hmac.compare_digest(expected, provided_token)


class SandboxPaymentAdapter:
    """
    Deterministic, zero-network local sandbox adapter for development and automated testing.
    Must never be enabled in production.
    """

    def __init__(self, app_settings: Settings) -> None:
        self._settings = app_settings

    @property
    def provider_name(self) -> str:
        return "sandbox"

    async def create_session(
        self, req: GatewaySessionRequest
    ) -> GatewaySessionInitResult:
        authority = f"SBX-AUTH-{req.attempt_number}"
        return GatewaySessionInitResult(
            outcome="ready",
            provider=self.provider_name,
            authority=authority,
        )

    async def verify_attempt(
        self, req: GatewayVerificationRequest
    ) -> GatewayVerificationResult:
        if req.requested_outcome == "succeeded":
            return GatewayVerificationResult(
                outcome="succeeded",
                provider=self.provider_name,
                provider_transaction_id=f"SBX-TXN-{req.attempt_number}",
                verified_amount_toman=req.expected_amount_toman,
                currency_unit=req.currency_unit,
                funds_captured_hint=False,
            )
        if req.requested_outcome == "failed":
            code = req.requested_failure_code or "sandbox_declined"
            return GatewayVerificationResult(
                outcome="failed",
                provider=self.provider_name,
                verified_amount_toman=req.expected_amount_toman,
                currency_unit=req.currency_unit,
                funds_captured_hint=False,
                failure_code=code,
                failure_reason=f"Sandbox payment failed ({code})",
            )
        code = req.requested_failure_code or "sandbox_verification_timeout"
        return GatewayVerificationResult(
            outcome="indeterminate_timeout",
            provider=self.provider_name,
            currency_unit=req.currency_unit,
            funds_captured_hint=False,
            failure_code=code,
            failure_reason="Sandbox verification timed out without confirmation",
        )
