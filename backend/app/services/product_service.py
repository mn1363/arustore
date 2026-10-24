from typing import Optional, Union
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.elasticsearch import es_client
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product, ProductImage
from app.schemas.common import BrandResponse, CategoryResponse
from app.schemas.product import (
    PaginatedProductsResponse,
    ProductCreate,
    ProductFilter,
    ProductImageSchema,
    ProductResponse,
    ProductUpdate,
)
from app.services.search_service import SearchService
from app.tasks.search_tasks import (
    remove_product_from_search_task,
    sync_product_to_search_task,
)
from app.utils.pagination import paginate_select
from app.utils.slugify import ensure_unique_slug, generate_slug
from app.utils.validators import normalize_sku


def serialize_product_model(product: Product) -> ProductResponse:
    brand_resp = (
        BrandResponse.model_validate(product.brand) if product.brand else None
    )
    cat_resp = (
        CategoryResponse.model_validate(product.primary_category)
        if product.primary_category
        else None
    )
    images = [ProductImageSchema.model_validate(img) for img in (product.images or [])]
    return ProductResponse(
        id=product.id,
        sku=product.sku,
        slug=product.slug,
        name=product.name,
        name_fa=product.name_fa,
        description=product.description,
        description_fa=product.description_fa,
        price=product.price,
        compare_at_price=product.compare_at_price,
        price_toman=product.price_toman,
        compare_at_toman=product.compare_at_toman,
        stock_quantity=product.stock_quantity,
        in_stock=product.in_stock and product.stock_quantity > 0,
        is_featured=product.is_featured,
        is_new=product.is_new,
        is_on_sale=product.is_on_sale,
        archetype=product.archetype,
        colors=product.colors or [],
        specs=product.specs or [],
        highlights=product.highlights or [],
        highlights_fa=product.highlights_fa or [],
        editions=product.editions or [],
        rating_avg=product.rating_avg,
        review_count=product.review_count,
        images=images,
        brand=brand_resp,
        category=cat_resp,
        created_at=product.created_at,
    )


class ProductService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return (
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.brand),
                selectinload(Product.primary_category),
            )
            .where(Product.is_active.is_(True))
        )

    async def list_products(
        self,
        filters: ProductFilter,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedProductsResponse:
        stmt = self._base_query()

        if filters.category_id is not None:
            stmt = stmt.where(Product.primary_category_id == filters.category_id)
        if filters.category_slug and filters.category_slug != "all":
            stmt = stmt.join(Category, Product.primary_category_id == Category.id).where(
                Category.slug == filters.category_slug
            )
        if filters.brand_id is not None:
            stmt = stmt.where(Product.brand_id == filters.brand_id)
        if filters.brand_slug:
            stmt = stmt.join(Brand, Product.brand_id == Brand.id).where(
                Brand.slug == filters.brand_slug
            )
        if filters.min_price is not None:
            stmt = stmt.where(Product.price >= filters.min_price)
        if filters.max_price is not None:
            stmt = stmt.where(Product.price <= filters.max_price)
        if filters.in_stock is not None:
            stmt = stmt.where(Product.in_stock.is_(filters.in_stock))
        if filters.is_on_sale is not None:
            stmt = stmt.where(Product.is_on_sale.is_(filters.is_on_sale))
        if filters.is_featured is not None:
            stmt = stmt.where(Product.is_featured.is_(filters.is_featured))

        if filters.search:
            search_service = SearchService(self.db)
            matched_ids = await search_service.matching_product_ids(filters.search)
            if matched_ids is not None:
                if not matched_ids:
                    stmt = stmt.where(Product.id == -1)
                else:
                    stmt = stmt.where(Product.id.in_(matched_ids))

        sort_map = {
            "price-asc": Product.price.asc(),
            "price-desc": Product.price.desc(),
            "rating": Product.rating_avg.desc(),
            "featured": Product.is_featured.desc(),
            "newest": Product.id.desc(),
        }
        stmt = stmt.order_by(sort_map.get(filters.sort_by, Product.id.desc()))

        rows, meta = await paginate_select(self.db, stmt, page=page, page_size=page_size)
        return PaginatedProductsResponse(
            items=[serialize_product_model(p) for p in rows],
            meta=meta,
        )

    async def get_product(
        self, identifier: Union[int, str]
    ) -> Optional[ProductResponse]:
        stmt = self._base_query()
        if isinstance(identifier, int) or str(identifier).isdigit():
            stmt = stmt.where(Product.id == int(identifier))
        else:
            stmt = stmt.where(Product.slug == str(identifier))

        product = (await self.db.execute(stmt)).scalar_one_or_none()
        if not product:
            return None
        product.view_count = (product.view_count or 0) + 1
        await self.db.commit()
        return serialize_product_model(product)

    async def create_product(self, payload: ProductCreate) -> ProductResponse:
        sku = normalize_sku(payload.sku)
        dup_sku = (
            await self.db.execute(select(Product.id).where(Product.sku == sku))
        ).scalar_one_or_none()
        if dup_sku:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{sku}' already exists",
            )

        raw_slug = payload.slug or generate_slug(payload.name)
        existing_slugs = set(
            (await self.db.execute(select(Product.slug))).scalars().all()
        )
        slug = ensure_unique_slug(raw_slug, existing_slugs)

        price_toman = payload.price_toman or int(round(payload.price * 55000))
        product = Product(
            sku=sku,
            slug=slug,
            name=payload.name,
            name_fa=payload.name_fa,
            description=payload.description,
            description_fa=payload.description_fa,
            price=payload.price,
            compare_at_price=payload.compare_at_price,
            price_toman=price_toman,
            compare_at_toman=payload.compare_at_toman,
            stock_quantity=payload.stock_quantity,
            in_stock=payload.stock_quantity > 0,
            is_featured=payload.is_featured,
            is_new=payload.is_new,
            is_on_sale=payload.is_on_sale,
            archetype=payload.archetype,
            brand_id=payload.brand_id,
            primary_category_id=payload.primary_category_id,
            colors=payload.colors,
            specs=payload.specs,
            highlights=payload.highlights,
            highlights_fa=payload.highlights_fa,
            editions=payload.editions,
        )
        for idx, img in enumerate(payload.images):
            product.images.append(
                ProductImage(
                    url=img.url,
                    alt=img.alt or payload.name,
                    is_primary=(idx == 0 or img.is_primary),
                    sort_order=idx,
                )
            )

        self.db.add(product)
        await self.db.commit()

        reloaded = (
            await self.db.execute(self._base_query().where(Product.id == product.id))
        ).scalar_one()

        doc = {
            "id": reloaded.id,
            "name": reloaded.name,
            "name_fa": reloaded.name_fa,
            "description": reloaded.description,
            "description_fa": reloaded.description_fa,
            "slug": reloaded.slug,
            "brand_id": reloaded.brand_id,
            "category_id": reloaded.primary_category_id,
            "price": reloaded.price,
            "in_stock": reloaded.in_stock,
        }
        await es_client.index_product(doc)
        try:
            sync_product_to_search_task.delay(doc)
        except Exception:
            pass

        return serialize_product_model(reloaded)

    async def update_product(
        self, product_id: int, payload: ProductUpdate
    ) -> ProductResponse:
        stmt = self._base_query().where(Product.id == product_id)
        product = (await self.db.execute(stmt)).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(product, field, value)
        if "stock_quantity" in updates and "in_stock" not in updates:
            product.in_stock = product.stock_quantity > 0

        await self.db.commit()
        reloaded = (await self.db.execute(stmt)).scalar_one()
        return serialize_product_model(reloaded)

    async def delete_product(self, product_id: int) -> None:
        stmt = select(Product).where(Product.id == product_id, Product.is_active.is_(True))
        product = (await self.db.execute(stmt)).scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product.is_active = False
        await self.db.commit()
        await es_client.delete_product(product_id)
        try:
            remove_product_from_search_task.delay(product_id)
        except Exception:
            pass
