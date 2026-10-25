from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    name_fa = Column(String(160), nullable=False)
    slug = Column(String(180), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    description_fa = Column(Text, nullable=True)
    logo = Column(String(500), nullable=True)
    country = Column(String(100), default="Iran", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    products = relationship("Product", back_populates="brand")
