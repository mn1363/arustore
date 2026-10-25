from typing import Optional, Union
from fastapi import HTTPException, status
from sqlalchemy import String, cast, or_, select
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
from app.utils.pagination import build_pagination_meta, paginate_select
from app.utils.slugify import ensure_unique_slug, generate_slug
from app.utils.validators import normalize_sku

# Non-destructive compatibility aliases mapping legacy pre-P0-B1 frontend URLs
# to canonical backend seeded slugs without mutating persisted database slugs.
LEGACY_PRODUCT_SLUG_ALIASES: dict[str, str] = {
    "royal-3tier-aluminum-stand": "shahnameh-3tier-aluminum-pastry-stand",
    "imperial-engraved-aluminum-tray": "persepolis-engraved-aluminum-serving-tray",
    "zarrin-hammered-aluminum-nut-dish": "domed-hammered-aluminum-nut-chalice",
    "negin-4bowl-aluminum-ordu-platter": "chaharbagh-4bowl-aluminum-ordur-platter",
    "isfahan-aluminum-tea-sugar-service": "isfahan-anodized-aluminum-tea-hospitality-set",
    "arulux-3arm-aluminum-candelabra": "aria-3arm-cast-aluminum-candelabra",
    "mowj-sculptural-aluminum-kashkool": "kashkool-sculptural-aluminum-centerpiece",
}

LEGACY_CATEGORY_SLUG_ALIASES: dict[str, str] = {
    "stands-fruit-bowls": "pastry-stands",
    "trays-tea-sets": "serving-trays",
    "nut-ordu-dishes": "nut-ordur",
    "candelabra-centerpieces": "fruit-vessels",
}

LEGACY_BRAND_SLUG_ALIASES: dict[str, str] = {
    "arumetal-atelier": "aru-atelier",
    "aruanodize-royal": "zarrin-anodize",
    "aruform-cnc": "parsia-form",
    "arubridal-heritage": "simin-craft",
}


def _product_matches_color(product: Product, raw_color: str) -> bool:
    needle = raw_color.strip().lower()
    if not needle:
        return True
    for entry in product.colors or []:
        if not isinstance(entry, dict):
            continue
        for key in ("id", "hex", "accentHex"):
            val = entry.get(key)
            if isinstance(val, str) and val.strip().lower() == needle:
                return True
    return False


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
            raw_cat_slug = filters.category_slug.strip()
            resolved_cat_slug = LEGACY_CATEGORY_SLUG_ALIASES.get(
                raw_cat_slug, raw_cat_slug
            )
            cat_candidates = list({raw_cat_slug, resolved_cat_slug})
            stmt = stmt.join(
                Category, Product.primary_category_id == Category.id
            ).where(Category.slug.in_(cat_candidates))

        if filters.brand_id is not None:
            stmt = stmt.where(Product.brand_id == filters.brand_id)

        raw_brand_values: list[str] = []
        if filters.brand_slug:
            raw_brand_values.append(filters.brand_slug)
        if filters.brand_slugs:
            raw_brand_values.extend(filters.brand_slugs)

        effective_brand_slugs: list[str] = []
        for raw_val in raw_brand_values:
            for part in raw_val.split(","):
                cleaned = part.strip()
                if not cleaned:
                    continue
                effective_brand_slugs.append(cleaned)
                aliased = LEGACY_BRAND_SLUG_ALIASES.get(cleaned)
                if aliased:
                    effective_brand_slugs.append(aliased)

        if effective_brand_slugs:
            stmt = stmt.join(Brand, Product.brand_id == Brand.id).where(
                Brand.slug.in_(list(dict.fromkeys(effective_brand_slugs)))
            )

        if filters.min_price is not None:
            stmt = stmt.where(Product.price >= filters.min_price)
        if filters.max_price is not None:
            stmt = stmt.where(Product.price <= filters.max_price)
        if filters.in_stock is True:
            stmt = stmt.where(Product.in_stock.is_(True), Product.stock_quantity > 0)
        elif filters.in_stock is False:
            stmt = stmt.where(
                or_(Product.in_stock.is_(False), Product.stock_quantity <= 0)
            )
        if filters.is_on_sale is not None:
            stmt = stmt.where(Product.is_on_sale.is_(filters.is_on_sale))
        if filters.is_featured is not None:
            stmt = stmt.where(Product.is_featured.is_(filters.is_featured))
        if filters.is_new is not None:
            stmt = stmt.where(Product.is_new.is_(filters.is_new))

        if filters.search:
            search_service = SearchService(self.db)
            matched_ids = await search_service.matching_product_ids(filters.search)
            if matched_ids is not None:
                if not matched_ids:
                    stmt = stmt.where(Product.id == -1)
                else:
                    stmt = stmt.where(Product.id.in_(matched_ids))

        sort_clauses = {
            "price-asc": (Product.price.asc(), Product.id.asc()),
            "price-desc": (Product.price.desc(), Product.id.asc()),
            "rating": (Product.rating_avg.desc(), Product.id.asc()),
            "featured": (Product.is_featured.desc(), Product.id.asc()),
            "newest": (Product.id.desc(),),
        }
        stmt = stmt.order_by(*sort_clauses.get(filters.sort_by, (Product.id.desc(),)))

        if filters.color and filters.color.strip():
            color_needle = filters.color.strip()
            safe_page = max(1, page)
            safe_size = max(1, min(page_size, 100))
            color_stmt = stmt.where(
                cast(Product.colors, String).ilike(f"%{color_needle}%")
            )
            candidates = (
                (await self.db.execute(color_stmt)).scalars().unique().all()
            )
            matched = [
                p for p in candidates if _product_matches_color(p, color_needle)
            ]
            meta = build_pagination_meta(len(matched), safe_page, safe_size)
            start = (safe_page - 1) * safe_size
            paged = matched[start : start + safe_size]
            return PaginatedProductsResponse(
                items=[serialize_product_model(p) for p in paged],
                meta=meta,
            )

        rows, meta = await paginate_select(self.db, stmt, page=page, page_size=page_size)
        return PaginatedProductsResponse(
            items=[serialize_product_model(p) for p in rows],
            meta=meta,
        )

    async def get_product(
        self, identifier: Union[int, str]
    ) -> Optional[ProductResponse]:
        if isinstance(identifier, int) or str(identifier).isdigit():
            stmt = self._base_query().where(Product.id == int(identifier))
            product = (await self.db.execute(stmt)).scalar_one_or_none()
        else:
            raw_ident = str(identifier).strip()
            product = (
                await self.db.execute(
                    self._base_query().where(Product.slug == raw_ident)
                )
            ).scalar_one_or_none()
            if not product:
                aliased_slug = LEGACY_PRODUCT_SLUG_ALIASES.get(raw_ident)
                if aliased_slug:
                    product = (
                        await self.db.execute(
                            self._base_query().where(Product.slug == aliased_slug)
                        )
                    ).scalar_one_or_none()
            if not product:
                product = (
                    await self.db.execute(
                        self._base_query().where(Product.sku == raw_ident.upper())
                    )
                ).scalar_one_or_none()

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
