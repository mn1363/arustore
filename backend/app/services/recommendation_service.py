from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.schemas.product import ProductResponse
from app.services.product_service import serialize_product_model


class RecommendationService:
    """Recommends complementary servingware by category affinity, stock availability, and rating."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_related_products(
        self, product_id: int, limit: int = 4
    ) -> List[ProductResponse]:
        target = (
            await self.db.execute(select(Product).where(Product.id == product_id))
        ).scalar_one_or_none()
        if not target:
            return []

        stmt = (
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.brand),
                selectinload(Product.primary_category),
            )
            .where(
                Product.is_active.is_(True),
                Product.in_stock.is_(True),
                Product.id != product_id,
            )
        )
        candidates = list((await self.db.execute(stmt)).scalars().all())
        candidates.sort(
            key=lambda p: (
                1 if p.primary_category_id == target.primary_category_id else 0,
                1 if p.brand_id == target.brand_id else 0,
                p.rating_avg or 0.0,
            ),
            reverse=True,
        )
        return [serialize_product_model(p) for p in candidates[:limit]]
