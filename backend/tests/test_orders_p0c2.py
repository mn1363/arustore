import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.main import app
from app.models.cart import CartItem
from app.models.discount import Discount, DiscountUsage
from app.models.order import Order, OrderIdempotencyRecord, OrderItem
from app.models.product import Product
from app.models.user import User


async def register_user_headers(
    client: AsyncClient, email: str, full_name: str = "Order Buyer"
) -> tuple[dict[str, str], int]:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": "StrongOrderPass!2026",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


VALID_SHIPPING = {
    "customer_name": "سارا رضایی",
    "customer_phone": "09123334455",
    "shipping_address": "تهران، خیابان ولیعصر، کوچه یاس، پلاک ۱۲",
    "postal_code": "1965432100",
}


@pytest.mark.asyncio
async def test_1_unauthenticated_and_2_empty_cart_and_3_client_bypass_rejected(
    client: AsyncClient,
):
    # 1. Unauthenticated requests rejected with 401
    assert (await client.post("/api/v1/orders/", json=VALID_SHIPPING)).status_code == 401
    assert (await client.post("/api/v1/orders", json=VALID_SHIPPING)).status_code == 401
    assert (await client.get("/api/v1/orders/")).status_code == 401
    assert (await client.get("/api/v1/orders/1")).status_code == 401

    headers, _ = await register_user_headers(client, "empty-and-bypass@arustore.ir")

    # 2. Empty cart cannot create an order
    empty_res = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "empty-cart-1"},
        json=VALID_SHIPPING,
    )
    assert empty_res.status_code == 400
    assert "empty cart" in empty_res.json()["detail"].lower()

    # 3a. Client-supplied explicit `items` payload cannot bypass empty server cart
    bypass_items_res = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "bypass-items-1"},
        json={
            **VALID_SHIPPING,
            "items": [{"product_id": 1, "quantity": 1}],
        },
    )
    assert bypass_items_res.status_code == 422

    # 3b. Client-supplied price / total / payment_status tampering is rejected
    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 1, "quantity": 1},
    )
    for tampered_field in (
        {"total": 0.01},
        {"subtotal": 1.0},
        {"discount_amount": 999.0},
        {"payment_status": "paid"},
        {"status": "processing"},
    ):
        tampered = await client.post(
            "/api/v1/orders/",
            headers={**headers, "Idempotency-Key": f"tamper-{list(tampered_field.keys())[0]}"},
            json={**VALID_SHIPPING, **tampered_field},
        )
        assert tampered.status_code == 422


@pytest.mark.asyncio
async def test_4_invalid_variants_inactive_product_and_stock_revalidation(
    client: AsyncClient,
):
    headers, user_id = await register_user_headers(client, "variant-reval@arustore.ir")
    override_get_db = app.dependency_overrides[get_db]

    # Add valid item to cart, then simulate catalog drift (corrupted edition, corrupted color, inactive product, insufficient stock)
    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 2, "quantity": 2, "selected_edition": "standard"},
    )

    # Corrupt selected_edition in DB -> order submission must revalidate and reject 400
    async for session in override_get_db():
        row = (
            await session.execute(
                select(CartItem).where(CartItem.user_id == user_id)
            )
        ).scalar_one()
        row.selected_edition = "fake-edition"
        await session.commit()
        break

    bad_ed = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "reval-ed"},
        json=VALID_SHIPPING,
    )
    assert bad_ed.status_code == 400
    assert "edition" in bad_ed.json()["detail"].lower()

    # Restore valid edition, corrupt selected_color -> reject 400
    async for session in override_get_db():
        row = (
            await session.execute(
                select(CartItem).where(CartItem.user_id == user_id)
            )
        ).scalar_one()
        row.selected_edition = "standard"
        row.selected_color = {"id": "invalid-finish", "name": "Fake", "hex": "#000000"}
        await session.commit()
        break

    bad_col = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "reval-col"},
        json=VALID_SHIPPING,
    )
    assert bad_col.status_code == 400
    assert "finish" in bad_col.json()["detail"].lower()

    # Restore valid color, reduce product stock below cart quantity -> reject 400
    async for session in override_get_db():
        row = (
            await session.execute(
                select(CartItem).where(CartItem.user_id == user_id)
            )
        ).scalar_one()
        prod2 = (
            await session.execute(select(Product).where(Product.id == 2))
        ).scalar_one()
        row.selected_color = prod2.colors[0]
        prod2.stock_quantity = 1
        await session.commit()
        break

    low_stock = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "reval-stock"},
        json=VALID_SHIPPING,
    )
    assert low_stock.status_code == 400
    assert "stock" in low_stock.json()["detail"].lower()

    # Deactivate product -> reject 400 (never silently skip inactive cart items!)
    async for session in override_get_db():
        prod2 = (
            await session.execute(select(Product).where(Product.id == 2))
        ).scalar_one()
        prod2.stock_quantity = 10
        prod2.is_active = False
        await session.commit()
        break

    inactive_res = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "reval-inactive"},
        json=VALID_SHIPPING,
    )
    assert inactive_res.status_code == 400


@pytest.mark.asyncio
async def test_5_6_7_8_authoritative_totals_promo_caps_pending_states_and_zero_premature_side_effects(
    client: AsyncClient,
):
    headers, user_id = await register_user_headers(client, "pending-safe@arustore.ir")
    override_get_db = app.dependency_overrides[get_db]

    # Seed discounts covering min_order_amount, expiration, usage_limit, and max_discount_amount cap
    # plus a historical paid order to confirm historical orders are NOT rewritten or reinterpreted.
    async for session in override_get_db():
        session.add_all(
            [
                Discount(
                    code="EXPIRED15",
                    discount_percent=15.0,
                    min_order_amount=0.0,
                    is_active=True,
                    expires_at=datetime.now(timezone.utc) - timedelta(days=1),
                ),
                Discount(
                    code="LIMITREACHED",
                    discount_percent=20.0,
                    min_order_amount=0.0,
                    usage_limit=2,
                    used_count=2,
                    is_active=True,
                ),
                Discount(
                    code="CAPPED50",
                    discount_percent=50.0,
                    max_discount_amount=15.0,
                    min_order_amount=50.0,
                    usage_limit=10,
                    used_count=1,
                    is_active=True,
                ),
                Order(
                    order_number="ARU-2025-HIST0001",
                    user_id=user_id,
                    status="processing",
                    payment_status="paid",
                    payment_reference="ARU-PAY-HISTORICAL",
                    subtotal=120.0,
                    discount_amount=0.0,
                    shipping_cost=0.0,
                    total=120.0,
                    total_toman=6_600_000,
                    customer_name="Historical Buyer",
                    shipping_address="Tehran Historical St",
                ),
            ]
        )
        prod3 = (
            await session.execute(select(Product).where(Product.id == 3))
        ).scalar_one()
        prod3.price = 80.0
        prod3.price_toman = 4_400_000
        prod3.stock_quantity = 9
        prod3.in_stock = True
        user_obj = (
            await session.execute(select(User).where(User.id == user_id))
        ).scalar_one()
        initial_points = user_obj.loyalty_points or 0
        await session.commit()
        break

    # Add 1 x Product #3 ($80 / 4,400,000 Toman) -> below VIP20 min ($100)
    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 3, "quantity": 1, "selected_edition": "standard"},
    )

    # Promo minimum, expiration, and usage limit rejections leave cart intact
    assert (
        await client.post(
            "/api/v1/orders/",
            headers={**headers, "Idempotency-Key": "p-min"},
            json={**VALID_SHIPPING, "promo_code": "VIP20"},
        )
    ).status_code == 400
    assert (
        await client.post(
            "/api/v1/orders/",
            headers={**headers, "Idempotency-Key": "p-exp"},
            json={**VALID_SHIPPING, "promo_code": "EXPIRED15"},
        )
    ).status_code == 400
    assert (
        await client.post(
            "/api/v1/orders/",
            headers={**headers, "Idempotency-Key": "p-lim"},
            json={**VALID_SHIPPING, "promo_code": "LIMITREACHED"},
        )
    ).status_code == 400

    # Add 1 more in gift edition ($80 + $12 = $92 / 4,400,000 + 660,000 = 5,060,000 Toman)
    # Total subtotal = $172.00 / 9,460,000 Toman.
    # With CAPPED50 (50% raw = $86, capped at $15.00):
    # discount_usd = 15.00 -> total_usd = 157.00
    # capped_ratio = 15.00 / 172.00 -> discount_toman = round(9,460,000 * 15 / 172) = 825,000 -> total_toman = 8,635,000!
    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 3, "quantity": 1, "selected_edition": "gift"},
    )

    create_res = await client.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": "pending-capped-order"},
        json={**VALID_SHIPPING, "promo_code": "capped50"},
    )
    assert create_res.status_code == 201, create_res.text
    order = create_res.json()

    # 7. Exact pending-payment state & non-reservation flag
    assert order["status"] == "pending_payment"
    assert order["payment_status"] == "pending"
    assert order["payment_reference"] is None
    assert order["stock_reserved"] is False
    assert order["status_history"][0]["status"] == "pending_payment"

    # 5 & 6. Authoritative totals & consistent USD/Toman capped discount
    assert order["subtotal"] == 172.0
    assert order["discount_amount"] == 15.0
    assert order["total"] == 157.0
    assert order["total_toman"] == 8_635_000
    assert order["promo_code"] == "CAPPED50"

    # 9. Cart was cleared atomically on success
    cart_after = await client.get("/api/v1/cart/", headers=headers)
    assert cart_after.json()["items"] == []

    # 8. Verify ZERO unverified payment side effects in DB (stock, promo usage, DiscountUsage, loyalty points)
    async for session in override_get_db():
        prod3_after = (
            await session.execute(select(Product).where(Product.id == 3))
        ).scalar_one()
        assert prod3_after.stock_quantity == 9
        assert prod3_after.in_stock is True

        disc_after = (
            await session.execute(
                select(Discount).where(Discount.code == "CAPPED50")
            )
        ).scalar_one()
        assert disc_after.used_count == 1

        usage_count = (
            await session.execute(
                select(func.count(DiscountUsage.id)).where(
                    DiscountUsage.order_id == order["id"]
                )
            )
        ).scalar_one()
        assert usage_count == 0

        user_after = (
            await session.execute(select(User).where(User.id == user_id))
        ).scalar_one()
        assert (user_after.loyalty_points or 0) == initial_points
        break

    # Historical paid order remains untouched & preserves paid/processing status
    list_res = await client.get("/api/v1/orders", headers=headers)
    assert list_res.status_code == 200
    listed = list_res.json()
    hist = [o for o in listed if o["order_number"] == "ARU-2025-HIST0001"][0]
    assert hist["status"] == "processing"
    assert hist["payment_status"] == "paid"
    assert hist["stock_reserved"] is True


@pytest.mark.asyncio
async def test_10_failure_mid_transaction_rolls_back_order_and_preserves_cart(
    client: AsyncClient,
):
    headers, user_id = await register_user_headers(client, "atomic-rollback@arustore.ir")
    override_get_db = app.dependency_overrides[get_db]

    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 1, "quantity": 2},
    )

    # Inject an exception on session.commit inside OrderService.create_order AFTER Order & OrderItems flushed
    async for session in override_get_db():
        SessionCls = type(session)
        break

    with patch.object(
        SessionCls, "commit", side_effect=RuntimeError("Simulated DB commit crash")
    ):
        with pytest.raises(RuntimeError, match="Simulated DB commit crash"):
            await client.post(
                "/api/v1/orders/",
                headers={**headers, "Idempotency-Key": "crash-key-1"},
                json=VALID_SHIPPING,
            )

    # Verify zero partial Order, zero OrderItem, zero OrderIdempotencyRecord, and cart still has quantity=2!
    async for session in override_get_db():
        order_cnt = (
            await session.execute(
                select(func.count(Order.id)).where(Order.user_id == user_id)
            )
        ).scalar_one()
        item_cnt = (
            await session.execute(select(func.count(OrderItem.id)))
        ).scalar_one()
        idem_cnt = (
            await session.execute(
                select(func.count(OrderIdempotencyRecord.id)).where(
                    OrderIdempotencyRecord.user_id == user_id
                )
            )
        ).scalar_one()
        assert order_cnt == 0
        assert item_cnt == 0
        assert idem_cnt == 0
        break

    cart_check = await client.get("/api/v1/cart/", headers=headers)
    assert cart_check.json()["item_count"] == 2


@pytest.mark.asyncio
async def test_11_12_13_14_idempotency_replay_conflict_concurrency_and_user_isolation(
    client: AsyncClient,
):
    headers_a, user_a_id = await register_user_headers(client, "idem-a@arustore.ir", "User A")
    headers_b, user_b_id = await register_user_headers(client, "idem-b@arustore.ir", "User B")
    override_get_db = app.dependency_overrides[get_db]

    await client.post(
        "/api/v1/cart/items",
        headers=headers_a,
        json={"product_id": 1, "quantity": 2},
    )
    await client.post(
        "/api/v1/cart/items",
        headers=headers_b,
        json={"product_id": 2, "quantity": 1},
    )

    # 13. Concurrent requests with the SAME Idempotency-Key cannot create duplicate orders
    r1, r2, r3 = await asyncio.gather(
        client.post(
            "/api/v1/orders/",
            headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
            json=VALID_SHIPPING,
        ),
        client.post(
            "/api/v1/orders/",
            headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
            json=VALID_SHIPPING,
        ),
        client.post(
            "/api/v1/orders/",
            headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
            json=VALID_SHIPPING,
        ),
    )
    assert r1.status_code == 201, r1.text
    assert r2.status_code == 201, r2.text
    assert r3.status_code == 201, r3.text
    order_a = r1.json()
    assert r2.json()["id"] == order_a["id"]
    assert r3.json()["id"] == order_a["id"]
    assert r2.json()["order_number"] == order_a["order_number"]

    # 11. Replaying the same Idempotency-Key after cart was already cleared returns exact same order
    replay = await client.post(
        "/api/v1/orders/",
        headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
        json=VALID_SHIPPING,
    )
    assert replay.status_code == 201
    assert replay.json()["id"] == order_a["id"]
    assert len((await client.get("/api/v1/orders/", headers=headers_a)).json()) == 1

    # 12a. Reusing the same Idempotency-Key with materially different checkout details -> 409 Conflict
    conflict_addr = await client.post(
        "/api/v1/orders/",
        headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
        json={**VALID_SHIPPING, "shipping_address": "شیراز، بلوار چمران، پلاک ۹۹"},
    )
    assert conflict_addr.status_code == 409

    # 12b. Reusing the same Idempotency-Key after refilling cart with different items -> 409 Conflict
    await client.post(
        "/api/v1/cart/items",
        headers=headers_a,
        json={"product_id": 4, "quantity": 1},
    )
    conflict_cart = await client.post(
        "/api/v1/orders/",
        headers={**headers_a, "Idempotency-Key": "shared-idem-key-001"},
        json=VALID_SHIPPING,
    )
    assert conflict_cart.status_code == 409
    # User A's new cart item remains untouched after 409 Conflict!
    assert (await client.get("/api/v1/cart/", headers=headers_a)).json()["item_count"] == 1

    # User scoping: User B can use the same Idempotency-Key string independently for User B's order
    res_b = await client.post(
        "/api/v1/orders/",
        headers={**headers_b, "Idempotency-Key": "shared-idem-key-001"},
        json=VALID_SHIPPING,
    )
    assert res_b.status_code == 201
    order_b = res_b.json()
    assert order_b["id"] != order_a["id"]

    # Direct DB uniqueness constraint check on (user_id, idempotency_key)
    async for session in override_get_db():
        session.add(
            OrderIdempotencyRecord(
                user_id=user_a_id,
                idempotency_key="shared-idem-key-001",
                payload_hash="x" * 64,
                cart_hash="y" * 64,
                order_id=order_b["id"],
            )
        )
        with pytest.raises(IntegrityError):
            await session.flush()
        await session.rollback()
        break

    # 14. User B cannot read User A's order, and User A cannot read User B's order
    assert (
        await client.get(f"/api/v1/orders/{order_a['id']}", headers=headers_b)
    ).status_code == 403
    assert (
        await client.get(f"/api/v1/orders/{order_b['id']}", headers=headers_a)
    ).status_code == 403
    user_b_orders = (await client.get("/api/v1/orders/", headers=headers_b)).json()
    assert [o["id"] for o in user_b_orders] == [order_b["id"]]
