from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.common import MessageResponse, ReviewCreate, ReviewResponse

router = APIRouter()


async def _refresh_product_rating(db: AsyncSession, product_id: int) -> None:
    agg = (
        await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.product_id == product_id, Review.is_approved.is_(True)
            )
        )
    ).one()
    product = (
        await db.execute(select(Product).where(Product.id == product_id))
    ).scalar_one_or_none()
    if product:
        avg_val = float(agg[0]) if agg[0] is not None else 4.8
        product.rating_avg = round(avg_val, 2)
        product.review_count = int(agg[1] or 0)


@router.get("/product/{product_id}", response_model=List[ReviewResponse])
async def list_product_reviews(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> List[ReviewResponse]:
    stmt = (
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.product_id == product_id, Review.is_approved.is_(True))
        .order_by(Review.created_at.desc(), Review.id.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [
        ReviewResponse(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            author_name=r.user.full_name if r.user else "کاربر آرو استور",
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            is_verified_purchase=r.is_verified_purchase,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    product = (
        await db.execute(
            select(Product).where(
                Product.id == payload.product_id, Product.is_active.is_(True)
            )
        )
    ).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    purchased_stmt = (
        select(OrderItem.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.user_id == current_user.id,
            OrderItem.product_id == payload.product_id,
            Order.status != "cancelled",
        )
        .limit(1)
    )
    is_verified = (await db.execute(purchased_stmt)).scalar_one_or_none() is not None

    review = Review(
        product_id=payload.product_id,
        user_id=current_user.id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
        is_verified_purchase=is_verified,
        is_approved=True,
    )
    db.add(review)
    await db.flush()
    await _refresh_product_rating(db, payload.product_id)
    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        author_name=current_user.full_name,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        is_verified_purchase=review.is_verified_purchase,
        created_at=review.created_at,
    )


@router.delete("/{review_id}", response_model=MessageResponse)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    review = (
        await db.execute(select(Review).where(Review.id == review_id))
    ).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if not current_user.is_admin and review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not permitted to delete this review")

    product_id = review.product_id
    await db.delete(review)
    await db.flush()
    await _refresh_product_rating(db, product_id)
    await db.commit()
    return MessageResponse(message="Review deleted")
