from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.common import CategoryCreate, CategoryResponse
from app.services.product_service import LEGACY_CATEGORY_SLUG_ALIASES
from app.utils.slugify import ensure_unique_slug, generate_slug

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
@router.get("", response_model=List[CategoryResponse], include_in_schema=False)
async def list_categories(
    db: AsyncSession = Depends(get_db),
) -> List[CategoryResponse]:
    counts_rows = (
        await db.execute(
            select(Product.primary_category_id, func.count(Product.id))
            .where(Product.is_active.is_(True))
            .group_by(Product.primary_category_id)
        )
    ).all()
    count_map = {cat_id: int(cnt) for cat_id, cnt in counts_rows if cat_id is not None}

    categories = (
        await db.execute(
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.sort_order.asc(), Category.id.asc())
        )
    ).scalars().all()

    return [
        CategoryResponse(
            id=c.id,
            parent_id=c.parent_id,
            name=c.name,
            name_fa=c.name_fa,
            slug=c.slug,
            description=c.description,
            description_fa=c.description_fa,
            image=c.image,
            accent=c.accent,
            product_count=count_map.get(c.id, 0),
        )
        for c in categories
    ]


@router.get("/{identifier}", response_model=CategoryResponse)
async def get_category(
    identifier: str,
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    stmt = select(Category).where(Category.is_active.is_(True))
    if identifier.isdigit():
        stmt = stmt.where(Category.id == int(identifier))
    else:
        resolved_slug = LEGACY_CATEGORY_SLUG_ALIASES.get(identifier, identifier)
        stmt = stmt.where(Category.slug.in_(list({identifier, resolved_slug})))
    cat = (await db.execute(stmt)).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    prod_count = int(
        (
            await db.execute(
                select(func.count(Product.id)).where(
                    Product.primary_category_id == cat.id,
                    Product.is_active.is_(True),
                )
            )
        ).scalar_one()
        or 0
    )
    resp = CategoryResponse.model_validate(cat)
    resp.product_count = prod_count
    return resp


@router.post(
    "/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED
)
async def create_category(
    payload: CategoryCreate,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    existing_slugs = set((await db.execute(select(Category.slug))).scalars().all())
    slug = ensure_unique_slug(payload.slug or generate_slug(payload.name), existing_slugs)
    cat = Category(
        name=payload.name,
        name_fa=payload.name_fa,
        slug=slug,
        parent_id=payload.parent_id,
        description=payload.description,
        description_fa=payload.description_fa,
        image=payload.image,
        accent=payload.accent,
        sort_order=payload.sort_order,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryResponse.model_validate(cat)
