from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.brand import Brand
from app.models.product import Product
from app.models.user import User
from app.schemas.common import BrandCreate, BrandResponse
from app.utils.slugify import ensure_unique_slug, generate_slug

router = APIRouter()


@router.get("/", response_model=List[BrandResponse])
async def list_brands(
    db: AsyncSession = Depends(get_db),
) -> List[BrandResponse]:
    counts_rows = (
        await db.execute(
            select(Product.brand_id, func.count(Product.id))
            .where(Product.is_active.is_(True))
            .group_by(Product.brand_id)
        )
    ).all()
    count_map = {brand_id: int(cnt) for brand_id, cnt in counts_rows if brand_id is not None}

    brands = (
        await db.execute(
            select(Brand).where(Brand.is_active.is_(True)).order_by(Brand.id.asc())
        )
    ).scalars().all()

    return [
        BrandResponse(
            id=b.id,
            name=b.name,
            name_fa=b.name_fa,
            slug=b.slug,
            description=b.description,
            description_fa=b.description_fa,
            logo=b.logo,
            country=b.country,
            product_count=count_map.get(b.id, 0),
        )
        for b in brands
    ]


@router.get("/{identifier}", response_model=BrandResponse)
async def get_brand(
    identifier: str,
    db: AsyncSession = Depends(get_db),
) -> BrandResponse:
    stmt = select(Brand).where(Brand.is_active.is_(True))
    if identifier.isdigit():
        stmt = stmt.where(Brand.id == int(identifier))
    else:
        stmt = stmt.where(Brand.slug == identifier)
    brand = (await db.execute(stmt)).scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    prod_count = int(
        (
            await db.execute(
                select(func.count(Product.id)).where(
                    Product.brand_id == brand.id,
                    Product.is_active.is_(True),
                )
            )
        ).scalar_one()
        or 0
    )
    resp = BrandResponse.model_validate(brand)
    resp.product_count = prod_count
    return resp


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    payload: BrandCreate,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> BrandResponse:
    existing_slugs = set((await db.execute(select(Brand.slug))).scalars().all())
    slug = ensure_unique_slug(payload.slug or generate_slug(payload.name), existing_slugs)
    brand = Brand(
        name=payload.name,
        name_fa=payload.name_fa,
        slug=slug,
        description=payload.description,
        description_fa=payload.description_fa,
        logo=payload.logo,
        country=payload.country,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return BrandResponse.model_validate(brand)
