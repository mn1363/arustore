from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import BrandResponse, CategoryResponse, PaginationMeta


class ProductImageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    url: str
    alt: Optional[str] = None
    is_primary: bool = False


class ProductFilter(BaseModel):
    category_id: Optional[int] = None
    category_slug: Optional[str] = None
    brand_id: Optional[int] = None
    brand_slug: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    search: Optional[str] = None
    in_stock: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_by: str = "newest"


class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=3, max_length=64)
    slug: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=255)
    name_fa: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5)
    description_fa: str = Field(..., min_length=5)
    price: float = Field(..., gt=0)
    compare_at_price: Optional[float] = None
    price_toman: int = Field(default=0, ge=0)
    compare_at_toman: Optional[int] = None
    stock_quantity: int = Field(default=10, ge=0)
    is_featured: bool = False
    is_new: bool = True
    is_on_sale: bool = False
    archetype: str = "fruit-bowl"
    brand_id: Optional[int] = None
    primary_category_id: Optional[int] = None
    images: List[ProductImageSchema] = Field(default_factory=list)
    colors: List[Dict[str, Any]] = Field(default_factory=list)
    specs: List[Dict[str, Any]] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    highlights_fa: List[str] = Field(default_factory=list)
    editions: List[Dict[str, Any]] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    name_fa: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    description_fa: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    compare_at_price: Optional[float] = None
    price_toman: Optional[int] = Field(None, ge=0)
    compare_at_toman: Optional[int] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    in_stock: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    archetype: Optional[str] = None
    brand_id: Optional[int] = None
    primary_category_id: Optional[int] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    slug: str
    name: str
    name_fa: str
    description: str
    description_fa: str
    price: float
    compare_at_price: Optional[float] = None
    price_toman: int
    compare_at_toman: Optional[int] = None
    stock_quantity: int
    in_stock: bool
    is_featured: bool
    is_new: bool
    is_on_sale: bool
    archetype: str
    colors: List[Dict[str, Any]] = Field(default_factory=list)
    specs: List[Dict[str, Any]] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    highlights_fa: List[str] = Field(default_factory=list)
    editions: List[Dict[str, Any]] = Field(default_factory=list)
    rating_avg: float
    review_count: int
    images: List[ProductImageSchema] = Field(default_factory=list)
    brand: Optional[BrandResponse] = None
    category: Optional[CategoryResponse] = None
    created_at: Optional[datetime] = None


class PaginatedProductsResponse(BaseModel):
    items: List[ProductResponse]
    meta: PaginationMeta
