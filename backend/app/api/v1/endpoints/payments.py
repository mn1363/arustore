from datetime import datetime
from typing import Callable, Optional

from fastapi import APIRouter, Body, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import Settings, settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentAttemptCancelRequest,
    PaymentAttemptInitiateRequest,
    PaymentAttemptResponse,
    SandboxResolveRequest,
)
from app.services.payment_gateway import PaymentGatewayPort, SandboxPaymentAdapter
from app.services.payment_lifecycle_service import PaymentLifecycleService

router = APIRouter()
sandbox_router = APIRouter()


def get_app_settings(request: Request) -> Settings:
    return getattr(request.app.state, "settings", settings)


def get_payment_adapter(
    app_settings: Settings = Depends(get_app_settings),
) -> Optional[PaymentGatewayPort]:
    if app_settings.is_sandbox_payment_active:
        return SandboxPaymentAdapter(app_settings)
    return None


def get_payment_now_fn() -> Optional[Callable[[], datetime]]:
    return None


@router.post(
    "/{order_id}/payment-attempts",
    response_model=PaymentAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_payment_attempt(
    order_id: int,
    response: Response,
    _payload: PaymentAttemptInitiateRequest = Body(
        default_factory=PaymentAttemptInitiateRequest
    ),
    idempotency_key: Optional[str] = Header(
        default=None,
        alias="Idempotency-Key",
        description="Required unique client key (1-128 non-whitespace chars) scoping idempotent payment initiation.",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
    adapter: Optional[PaymentGatewayPort] = Depends(get_payment_adapter),
    now_fn: Optional[Callable[[], datetime]] = Depends(get_payment_now_fn),
) -> PaymentAttemptResponse:
    service = PaymentLifecycleService(
        db=db,
        app_settings=app_settings,
        adapter=adapter,
        now_fn=now_fn,
    )
    attempt_resp, created_new = await service.initiate_attempt(
        current_user=current_user,
        order_id=order_id,
        idempotency_key=idempotency_key,
    )
    response.status_code = (
        status.HTTP_201_CREATED if created_new else status.HTTP_200_OK
    )
    return attempt_resp


@router.get(
    "/{order_id}/payment-attempts/latest",
    response_model=PaymentAttemptResponse,
)
async def get_latest_payment_attempt(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
    adapter: Optional[PaymentGatewayPort] = Depends(get_payment_adapter),
    now_fn: Optional[Callable[[], datetime]] = Depends(get_payment_now_fn),
) -> PaymentAttemptResponse:
    service = PaymentLifecycleService(
        db=db,
        app_settings=app_settings,
        adapter=adapter,
        now_fn=now_fn,
    )
    return await service.get_latest_attempt(
        current_user=current_user,
        order_id=order_id,
    )


@router.get(
    "/{order_id}/payment-attempts/{attempt_id}",
    response_model=PaymentAttemptResponse,
)
async def get_payment_attempt_detail(
    order_id: int,
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
    adapter: Optional[PaymentGatewayPort] = Depends(get_payment_adapter),
    now_fn: Optional[Callable[[], datetime]] = Depends(get_payment_now_fn),
) -> PaymentAttemptResponse:
    service = PaymentLifecycleService(
        db=db,
        app_settings=app_settings,
        adapter=adapter,
        now_fn=now_fn,
    )
    return await service.get_attempt(
        current_user=current_user,
        order_id=order_id,
        attempt_id=attempt_id,
    )


@router.post(
    "/{order_id}/payment-attempts/{attempt_id}/cancel",
    response_model=PaymentAttemptResponse,
)
async def cancel_payment_attempt(
    order_id: int,
    attempt_id: int,
    payload: PaymentAttemptCancelRequest = Body(
        default_factory=PaymentAttemptCancelRequest
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
    adapter: Optional[PaymentGatewayPort] = Depends(get_payment_adapter),
    now_fn: Optional[Callable[[], datetime]] = Depends(get_payment_now_fn),
) -> PaymentAttemptResponse:
    service = PaymentLifecycleService(
        db=db,
        app_settings=app_settings,
        adapter=adapter,
        now_fn=now_fn,
    )
    return await service.cancel_attempt(
        current_user=current_user,
        order_id=order_id,
        attempt_id=attempt_id,
        reason=payload.reason,
    )


@sandbox_router.post(
    "/{order_id}/payment-attempts/{attempt_id}/sandbox-resolve",
    response_model=PaymentAttemptResponse,
)
async def sandbox_resolve_payment_attempt(
    order_id: int,
    attempt_id: int,
    payload: SandboxResolveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
    adapter: Optional[PaymentGatewayPort] = Depends(get_payment_adapter),
    now_fn: Optional[Callable[[], datetime]] = Depends(get_payment_now_fn),
) -> PaymentAttemptResponse:
    service = PaymentLifecycleService(
        db=db,
        app_settings=app_settings,
        adapter=adapter,
        now_fn=now_fn,
    )
    return await service.resolve_sandbox_attempt(
        current_user=current_user,
        order_id=order_id,
        attempt_id=attempt_id,
        payload=payload,
    )
