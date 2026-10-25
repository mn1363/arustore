from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import Settings, settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService, TrialOrderSubmissionDisabledError

router = APIRouter()


def get_app_settings(request: Request) -> Settings:
    return getattr(request.app.state, "settings", settings)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    idempotency_key: Optional[str] = Header(
        default=None,
        alias="Idempotency-Key",
        description="Required unique client key (1-128 non-whitespace chars) scoping idempotent order submission.",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_app_settings),
) -> OrderResponse:
    if app_settings.TRIAL_MODE:
        raise TrialOrderSubmissionDisabledError()
    if idempotency_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is required",
        )
    return await OrderService(db, app_settings=app_settings).create_order(
        current_user,
        payload,
        idempotency_key=idempotency_key,
    )


@router.get("", response_model=List[OrderResponse], include_in_schema=False)
@router.get("/", response_model=List[OrderResponse])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[OrderResponse]:
    return await OrderService(db).list_user_orders(current_user.id)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    return await OrderService(db).get_order(order_id, current_user)
