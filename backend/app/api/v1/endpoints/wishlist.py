from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.common import MessageResponse
from app.schemas.product import ProductResponse
from app.services.product_service import serialize_product_model

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def list_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ProductResponse]:
    stmt = (
        select(WishlistItem)
        .options(
            selectinload(WishlistItem.product).selectinload(Product.images),
            selectinload(WishlistItem.product).selectinload(Product.brand),
            selectinload(WishlistItem.product).selectinload(Product.primary_category),
        )
        .where(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [
        serialize_product_model(row.product)
        for row in rows
        if row.product and row.product.is_active
    ]


@router.post(
    "/{product_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
async def add_to_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    product = (
        await db.execute(
            select(Product).where(Product.id == product_id, Product.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = (
        await db.execute(
            select(WishlistItem).where(
                WishlistItem.user_id == current_user.id,
                WishlistItem.product_id == product_id,
            )
        )
    ).scalar_one_or_none()
    if not existing:
        db.add(WishlistItem(user_id=current_user.id, product_id=product_id))
        await db.commit()
    return MessageResponse(message="Added to wishlist")


@router.delete("/{product_id}", response_model=MessageResponse)
async def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    existing = (
        await db.execute(
            select(WishlistItem).where(
                WishlistItem.user_id == current_user.id,
                WishlistItem.product_id == product_id,
            )
        )
    ).scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    await db.delete(existing)
    await db.commit()
    return MessageResponse(message="Removed from wishlist")
