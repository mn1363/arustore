from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartSummaryResponse,
    PromoCodeApply,
)
from app.schemas.common import MessageResponse
from app.services.cart_service import CartService

router = APIRouter()


@router.get("/", response_model=CartSummaryResponse)
@router.get("", response_model=CartSummaryResponse, include_in_schema=False)
async def get_cart(
    promo_code: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartSummaryResponse:
    return await CartService(db).get_cart_summary(current_user.id, promo_code=promo_code)


@router.post(
    "/items", response_model=CartSummaryResponse, status_code=status.HTTP_201_CREATED
)
async def add_to_cart(
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartSummaryResponse:
    return await CartService(db).add_item(current_user.id, payload)


@router.patch("/items/{item_id}", response_model=CartSummaryResponse)
async def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartSummaryResponse:
    return await CartService(db).update_item(current_user.id, item_id, payload.quantity)


@router.delete("/items/{item_id}", response_model=CartSummaryResponse)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartSummaryResponse:
    return await CartService(db).remove_item(current_user.id, item_id)


@router.delete("/", response_model=MessageResponse)
@router.delete("", response_model=MessageResponse, include_in_schema=False)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await CartService(db).clear_cart(current_user.id)
    return MessageResponse(message="Cart cleared")


@router.post("/apply-promo", response_model=CartSummaryResponse)
async def apply_promo_code(
    payload: PromoCodeApply,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartSummaryResponse:
    return await CartService(db).get_cart_summary(
        current_user.id, promo_code=payload.code
    )
