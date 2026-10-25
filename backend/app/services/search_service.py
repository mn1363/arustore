from typing import Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.elasticsearch import es_client
from app.models.product import Product


class SearchService:
    """Hybrid search: queries Elasticsearch when available, otherwise SQL ILIKE matching."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def matching_product_ids(self, query: str, limit: int = 50) -> Optional[list[int]]:
        cleaned = (query or "").strip()
        if not cleaned:
            return None

        es_ids = await es_client.search_product_ids(cleaned, limit=limit)
        if es_ids is not None and len(es_ids) > 0:
            return es_ids

        pattern = f"%{cleaned}%"
        stmt = (
            select(Product.id)
            .where(
                Product.is_active.is_(True),
                or_(
                    Product.name.ilike(pattern),
                    Product.name_fa.ilike(pattern),
                    Product.description.ilike(pattern),
                    Product.description_fa.ilike(pattern),
                    Product.sku.ilike(pattern),
                ),
            )
            .limit(limit)
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        return list(rows)
