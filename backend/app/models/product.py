from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

product_category = Table(
    "product_category",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    slug = Column(String(220), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_fa = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    description_fa = Column(Text, nullable=False)

    price = Column(Float, nullable=False, index=True)
    compare_at_price = Column(Float, nullable=True)
    price_toman = Column(Integer, nullable=False, default=0)
    compare_at_toman = Column(Integer, nullable=True)

    stock_quantity = Column(Integer, nullable=False, default=10)
    in_stock = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    is_new = Column(Boolean, nullable=False, default=False)
    is_on_sale = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    archetype = Column(String(64), nullable=False, default="fruit-bowl")
    colors = Column(JSON, nullable=False, default=list)
    specs = Column(JSON, nullable=False, default=list)
    highlights = Column(JSON, nullable=False, default=list)
    highlights_fa = Column(JSON, nullable=False, default=list)
    editions = Column(JSON, nullable=False, default=list)

    rating_avg = Column(Float, nullable=False, default=4.8, index=True)
    review_count = Column(Integer, nullable=False, default=0)
    view_count = Column(Integer, nullable=False, default=0)

    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    primary_category_id = Column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    brand = relationship("Brand", back_populates="products")
    primary_category = relationship("Category", back_populates="products")
    categories = relationship("Category", secondary=product_category)
    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
    )
    variants = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    alt = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String(80), unique=True, nullable=False)
    color_name = Column(String(120), nullable=False)
    color_name_fa = Column(String(120), nullable=True)
    color_hex = Column(String(16), nullable=False, default="#d8dee9")
    accent_hex = Column(String(16), nullable=False, default="#d6b88a")
    edition = Column(String(120), nullable=True)
    price_delta = Column(Float, nullable=False, default=0.0)
    price_delta_toman = Column(Integer, nullable=False, default=0)
    stock_quantity = Column(Integer, nullable=False, default=10)

    product = relationship("Product", back_populates="variants")
