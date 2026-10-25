from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"
    __table_args__ = (
        UniqueConstraint("attempt_number", name="uq_payment_attempts_attempt_number"),
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_payment_attempts_user_idempotency",
        ),
        UniqueConstraint(
            "active_order_key",
            name="uq_payment_attempts_active_order_key",
        ),
        UniqueConstraint(
            "settled_order_key",
            name="uq_payment_attempts_settled_order_key",
        ),
        UniqueConstraint(
            "provider",
            "provider_transaction_id",
            name="uq_payment_attempts_provider_txn",
        ),
        CheckConstraint(
            "amount_toman >= 0",
            name="ck_payment_attempts_amount_nonneg",
        ),
        CheckConstraint(
            "currency_unit = 'toman'",
            name="ck_payment_attempts_currency_unit",
        ),
        CheckConstraint(
            "status IN ('initiated', 'pending', 'succeeded', 'failed', 'expired', 'cancelled', 'reconciliation_required')",
            name="ck_payment_attempts_status_valid",
        ),
        CheckConstraint(
            "("
            "(status IN ('initiated', 'pending') AND active_order_key = order_id AND settled_order_key IS NULL) "
            "OR (status = 'succeeded' AND active_order_key IS NULL AND settled_order_key = order_id) "
            "OR (status IN ('failed', 'expired', 'cancelled', 'reconciliation_required') AND active_order_key IS NULL AND settled_order_key IS NULL)"
            ")",
            name="ck_payment_attempts_key_consistency",
        ),
        Index("ix_payment_attempts_order_created", "order_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    attempt_number = Column(String(48), nullable=False, index=True)
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    idempotency_key = Column(String(128), nullable=False)
    provider = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False, index=True)

    amount_toman = Column(Integer, nullable=False)
    currency_unit = Column(String(16), nullable=False, default="toman")

    active_order_key = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=True,
    )
    settled_order_key = Column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=True,
    )

    provider_authority = Column(String(128), nullable=True, index=True)
    provider_transaction_id = Column(String(128), nullable=True)
    sandbox_nonce = Column(String(64), nullable=True)

    failure_code = Column(String(64), nullable=True)
    failure_reason = Column(String(255), nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    order = relationship("Order", foreign_keys=[order_id])
    user = relationship("User", foreign_keys=[user_id])
    inventory_reservations = relationship(
        "InventoryReservation",
        back_populates="payment_attempt",
        cascade="all, delete-orphan",
        order_by="InventoryReservation.product_id.asc()",
    )
    discount_reservation = relationship(
        "DiscountReservation",
        back_populates="payment_attempt",
        uselist=False,
        cascade="all, delete-orphan",
    )


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"
    __table_args__ = (
        UniqueConstraint(
            "payment_attempt_id",
            "product_id",
            name="uq_inventory_reservations_attempt_product",
        ),
        CheckConstraint(
            "quantity >= 1",
            name="ck_inventory_reservations_qty_positive",
        ),
        CheckConstraint(
            "status IN ('active', 'consumed', 'released', 'expired')",
            name="ck_inventory_reservations_status",
        ),
        Index(
            "ix_inventory_reservations_product_active",
            "product_id",
            "status",
            "expires_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    payment_attempt_id = Column(
        Integer,
        ForeignKey("payment_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity = Column(Integer, nullable=False)
    status = Column(String(24), nullable=False, default="active", index=True)

    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    payment_attempt = relationship(
        "PaymentAttempt",
        back_populates="inventory_reservations",
    )


class DiscountReservation(Base):
    __tablename__ = "discount_reservations"
    __table_args__ = (
        UniqueConstraint(
            "payment_attempt_id",
            name="uq_discount_reservations_attempt",
        ),
        UniqueConstraint(
            "payment_attempt_id",
            "discount_id",
            name="uq_discount_reservations_attempt_discount",
        ),
        UniqueConstraint(
            "active_order_key",
            name="uq_discount_reservations_active_order",
        ),
        UniqueConstraint(
            "settled_order_key",
            name="uq_discount_reservations_settled_order",
        ),
        CheckConstraint(
            "status IN ('active', 'consumed', 'released', 'expired')",
            name="ck_discount_reservations_status",
        ),
        CheckConstraint(
            "("
            "(status = 'active' AND active_order_key = order_id AND settled_order_key IS NULL) "
            "OR (status = 'consumed' AND active_order_key IS NULL AND settled_order_key = order_id) "
            "OR (status IN ('released', 'expired') AND active_order_key IS NULL AND settled_order_key IS NULL)"
            ")",
            name="ck_discount_reservations_keys",
        ),
        Index(
            "ix_discount_reservations_discount_active",
            "discount_id",
            "status",
            "expires_at",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    payment_attempt_id = Column(
        Integer,
        ForeignKey("payment_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    discount_id = Column(
        Integer,
        ForeignKey("discounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status = Column(String(24), nullable=False, default="active", index=True)

    active_order_key = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=True,
    )
    settled_order_key = Column(
        Integer,
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=True,
    )

    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    payment_attempt = relationship(
        "PaymentAttempt",
        back_populates="discount_reservation",
    )
