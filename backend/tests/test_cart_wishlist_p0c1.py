from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.database import get_db
from app.main import app
from app.models.discount import Discount
from app.models.product import Product


async def register_and_get_headers(
    client: AsyncClient, email: str, full_name: str = "Test Buyer"
) -> dict[str, str]:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": full_name,
            "password": "StrongUserPass!2026",
        },
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_unauthenticated_cart_and_wishlist_endpoints_return_401(
    client: AsyncClient,
):
    assert (await client.get("/api/v1/cart")).status_code == 401
    assert (await client.get("/api/v1/cart/")).status_code == 401
    assert (
        await client.post(
            "/api/v1/cart/items", json={"product_id": 1, "quantity": 1}
        )
    ).status_code == 401
    assert (
        await client.patch("/api/v1/cart/items/1", json={"quantity": 2})
    ).status_code == 401
    assert (await client.delete("/api/v1/cart/items/1")).status_code == 401
    assert (await client.delete("/api/v1/cart/")).status_code == 401
    assert (
        await client.post("/api/v1/cart/apply-promo", json={"code": "ARU3D"})
    ).status_code == 401

    assert (await client.get("/api/v1/wishlist")).status_code == 401
    assert (await client.get("/api/v1/wishlist/")).status_code == 401
    assert (await client.post("/api/v1/wishlist/1")).status_code == 401
    assert (await client.delete("/api/v1/wishlist/1")).status_code == 401


@pytest.mark.asyncio
async def test_cart_crud_backend_totals_and_variant_matching(
    client: AsyncClient,
):
    headers = await register_and_get_headers(client, "cart-crud@arustore.ir")

    # 1. Empty cart on both slash and non-slash endpoints
    empty_no_slash = await client.get("/api/v1/cart", headers=headers)
    assert empty_no_slash.status_code == 200
    assert empty_no_slash.json()["items"] == []
    assert empty_no_slash.json()["item_count"] == 0
    assert empty_no_slash.json()["subtotal"] == 0
    assert empty_no_slash.json()["total"] == 0

    # Fetch product #2 to verify authoritative prices & options
    prod_res = await client.get("/api/v1/products/2")
    assert prod_res.status_code == 200
    prod = prod_res.json()
    base_usd = prod["price"]
    base_toman = prod["price_toman"]
    champagne = prod["colors"][0]
    silver = prod["colors"][1]

    # 2. Add item (default color = champagne, gift edition = +$12 / +660,000 Toman)
    add1 = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 2, "quantity": 2, "selected_edition": "gift"},
    )
    assert add1.status_code == 201, add1.text
    s1 = add1.json()
    assert len(s1["items"]) == 1
    item1 = s1["items"][0]
    assert isinstance(item1["id"], int)
    assert item1["unit_price"] == round(base_usd + 12.0, 2)
    assert item1["unit_price_toman"] == base_toman + 660_000
    assert item1["line_total"] == round((base_usd + 12.0) * 2, 2)
    assert item1["line_total_toman"] == (base_toman + 660_000) * 2
    assert s1["item_count"] == 2
    assert s1["subtotal"] == item1["line_total"]
    assert s1["total"] == item1["line_total"]

    # 3. Add same product + explicit champagne finish + gift edition -> merges into same row
    add_same = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 2,
            "quantity": 1,
            "selected_color": champagne,
            "selected_edition": "gift",
        },
    )
    assert add_same.status_code == 201
    s2 = add_same.json()
    assert len(s2["items"]) == 1
    assert s2["items"][0]["id"] == item1["id"]
    assert s2["items"][0]["quantity"] == 3
    assert s2["item_count"] == 3

    # 4. Add same product with silver finish -> separate cart line
    add_diff_finish = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 2,
            "quantity": 1,
            "selected_color": silver,
            "selected_edition": "standard",
        },
    )
    assert add_diff_finish.status_code == 201
    s3 = add_diff_finish.json()
    assert len(s3["items"]) == 2
    assert s3["item_count"] == 4

    # 5. Update quantity via PATCH, then remove via quantity=0, then delete & clear
    second_id = [i["id"] for i in s3["items"] if i["id"] != item1["id"]][0]
    upd = await client.patch(
        f"/api/v1/cart/items/{second_id}",
        headers=headers,
        json={"quantity": 2},
    )
    assert upd.status_code == 200
    assert upd.json()["item_count"] == 5

    rem_zero = await client.patch(
        f"/api/v1/cart/items/{second_id}",
        headers=headers,
        json={"quantity": 0},
    )
    assert rem_zero.status_code == 200
    assert len(rem_zero.json()["items"]) == 1
    assert rem_zero.json()["item_count"] == 3

    # Add product #1, remove item1 via DELETE /items/{id}, then clear via DELETE /cart
    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 1, "quantity": 1},
    )
    del_one = await client.delete(
        f"/api/v1/cart/items/{item1['id']}", headers=headers
    )
    assert del_one.status_code == 200
    assert len(del_one.json()["items"]) == 1

    clr = await client.delete("/api/v1/cart", headers=headers)
    assert clr.status_code == 200
    after_clr = await client.get("/api/v1/cart/", headers=headers)
    assert after_clr.json()["items"] == []
    assert after_clr.json()["item_count"] == 0


@pytest.mark.asyncio
async def test_cumulative_stock_bounds_no_silent_clamp_and_option_validation(
    client: AsyncClient,
):
    headers = await register_and_get_headers(client, "stock-bounds@arustore.ir")

    # Set product #3 stock_quantity to 5 to verify exact cumulative stock bounds
    override_get_db = app.dependency_overrides[get_db]
    async for session in override_get_db():
        prod3 = (
            await session.execute(select(Product).where(Product.id == 3))
        ).scalar_one()
        prod3.stock_quantity = 5
        prod3.in_stock = True
        await session.commit()
        colors = prod3.colors
        break

    # Add 3 in champagne
    r1 = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 3,
            "quantity": 3,
            "selected_color": colors[0],
            "selected_edition": "standard",
        },
    )
    assert r1.status_code == 201
    line1_id = r1.json()["items"][0]["id"]

    # Repeated add of 3 more on same line (3 + 3 = 6 > 5) MUST fail 400 without clamping!
    r_exceed_same = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 3,
            "quantity": 3,
            "selected_color": colors[0],
            "selected_edition": "standard",
        },
    )
    assert r_exceed_same.status_code == 400
    assert "exceeds available stock" in r_exceed_same.json()["detail"].lower()

    # Verify quantity stayed at 3 (not clamped to 5)
    check = await client.get("/api/v1/cart/", headers=headers)
    assert check.json()["items"][0]["quantity"] == 3

    # Add 2 in silver (3 + 2 = 5 <= 5) -> allowed!
    r2 = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 3,
            "quantity": 2,
            "selected_color": colors[1],
            "selected_edition": "standard",
        },
    )
    assert r2.status_code == 201
    assert r2.json()["item_count"] == 5

    # Updating line 1 from 3 -> 4 when line 2 has 2 (4 + 2 = 6 > 5) MUST fail 400!
    r_upd_exceed = await client.patch(
        f"/api/v1/cart/items/{line1_id}",
        headers=headers,
        json={"quantity": 4},
    )
    assert r_upd_exceed.status_code == 400
    assert "exceeds available stock" in r_upd_exceed.json()["detail"].lower()

    # Large quantity (> 50) must return 400/422 validation error, NEVER silent clamp to 50
    r_large = await client.patch(
        f"/api/v1/cart/items/{line1_id}",
        headers=headers,
        json={"quantity": 75},
    )
    assert r_large.status_code in (400, 422)

    # Even when product stock is 100, repeated add 35 + 25 = 60 (> 50) returns 400 instead of clamping to 50
    async for session in override_get_db():
        prod6 = (
            await session.execute(select(Product).where(Product.id == 6))
        ).scalar_one()
        prod6.stock_quantity = 100
        prod6.in_stock = True
        await session.commit()
        break

    r_add35 = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 6, "quantity": 35},
    )
    assert r_add35.status_code == 201
    r_add25 = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 6, "quantity": 25},
    )
    assert r_add25.status_code == 400
    cart_after_60 = await client.get("/api/v1/cart/", headers=headers)
    prod6_line = [
        i for i in cart_after_60.json()["items"] if i["product_id"] == 6
    ][0]
    assert prod6_line["quantity"] == 35

    # Invalid finish option -> 400
    r_bad_color = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 3,
            "quantity": 1,
            "selected_color": {"id": "neon-pink", "name": "Neon Pink", "hex": "#ff00ff"},
        },
    )
    assert r_bad_color.status_code == 400
    assert "finish" in r_bad_color.json()["detail"].lower()

    # Invalid edition option -> 400 (no fabricated price adjustment)
    r_bad_edition = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={
            "product_id": 3,
            "quantity": 1,
            "selected_edition": "platinum-vip-edition",
        },
    )
    assert r_bad_edition.status_code == 400
    assert "edition" in r_bad_edition.json()["detail"].lower()


@pytest.mark.asyncio
async def test_promo_validation_edge_cases_and_cart_preservation(
    client: AsyncClient,
):
    headers = await register_and_get_headers(client, "promo-edge@arustore.ir")

    # Seed expired & exhausted discount codes for deterministic edge-case verification
    override_get_db = app.dependency_overrides[get_db]
    async for session in override_get_db():
        session.add_all(
            [
                Discount(
                    code="EXPIRED10",
                    discount_percent=10.0,
                    min_order_amount=0.0,
                    is_active=True,
                    expires_at=datetime.now(timezone.utc) - timedelta(days=2),
                ),
                Discount(
                    code="MAXEDOUT",
                    discount_percent=25.0,
                    min_order_amount=0.0,
                    usage_limit=3,
                    used_count=3,
                    is_active=True,
                ),
            ]
        )
        await session.commit()
        break

    # Empty cart cannot apply promo
    empty_promo = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "ARU3D"}
    )
    assert empty_promo.status_code == 400

    # Add low-price item (< $100) to test minimum order threshold on VIP20
    # Find cheapest active product or temporarily set product #4 price to $60
    async for session in override_get_db():
        prod4 = (
            await session.execute(select(Product).where(Product.id == 4))
        ).scalar_one()
        prod4.price = 60.0
        prod4.price_toman = 3_300_000
        await session.commit()
        break

    await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 4, "quantity": 1},
    )

    # Fake frontend-only code WELCOME10 -> 404
    bad_code = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "WELCOME10"}
    )
    assert bad_code.status_code == 404

    # Expired code -> 400
    exp_code = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "EXPIRED10"}
    )
    assert exp_code.status_code == 400

    # Exhausted usage limit -> 400
    max_code = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "MAXEDOUT"}
    )
    assert max_code.status_code == 400

    # Below minimum order ($60 < $100 for VIP20) -> 400
    min_code = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "VIP20"}
    )
    assert min_code.status_code == 400

    # Cart remains completely intact after all failed promo attempts
    intact = await client.get("/api/v1/cart/", headers=headers)
    assert intact.status_code == 200
    assert intact.json()["item_count"] == 1
    assert intact.json()["subtotal"] == 60.0

    # Valid code ARU3D (15% off, min $50) -> 200 with exact backend discount
    ok_code = await client.post(
        "/api/v1/cart/apply-promo", headers=headers, json={"code": "aru3d"}
    )
    assert ok_code.status_code == 200
    summary = ok_code.json()
    assert summary["promo_code"] == "ARU3D"
    assert summary["promo_percent"] == 15.0
    assert summary["discount_amount"] == 9.0
    assert summary["total"] == 51.0
    assert summary["discount_toman"] == int(3_300_000 * 0.15)
    assert summary["total_toman"] == 3_300_000 - int(3_300_000 * 0.15)


@pytest.mark.asyncio
async def test_user_a_and_user_b_cart_and_wishlist_isolation_and_wishlist_edge_cases(
    client: AsyncClient,
):
    headers_a = await register_and_get_headers(client, "user-a@arustore.ir", "User A")
    headers_b = await register_and_get_headers(client, "user-b@arustore.ir", "User B")

    # User A adds product #1 to cart and product #2 to wishlist
    cart_a = await client.post(
        "/api/v1/cart/items",
        headers=headers_a,
        json={"product_id": 1, "quantity": 2},
    )
    assert cart_a.status_code == 201
    item_a_id = cart_a.json()["items"][0]["id"]

    wish_a1 = await client.post("/api/v1/wishlist/2", headers=headers_a)
    assert wish_a1.status_code == 201
    # Duplicate add to wishlist is idempotent
    wish_a_dup = await client.post("/api/v1/wishlist/2", headers=headers_a)
    assert wish_a_dup.status_code == 201
    list_a = await client.get("/api/v1/wishlist", headers=headers_a)
    assert list_a.status_code == 200
    assert [p["id"] for p in list_a.json()] == [2]

    # User B sees empty cart and empty wishlist
    assert (await client.get("/api/v1/cart/", headers=headers_b)).json()["items"] == []
    assert (await client.get("/api/v1/wishlist/", headers=headers_b)).json() == []

    # User B cannot mutate or delete User A's cart item or wishlist item
    assert (
        await client.patch(
            f"/api/v1/cart/items/{item_a_id}",
            headers=headers_b,
            json={"quantity": 1},
        )
    ).status_code == 404
    assert (
        await client.delete(f"/api/v1/cart/items/{item_a_id}", headers=headers_b)
    ).status_code == 404
    assert (
        await client.delete("/api/v1/wishlist/2", headers=headers_b)
    ).status_code == 404

    # User A's cart and wishlist remain untouched
    assert (
        await client.get("/api/v1/cart/", headers=headers_a)
    ).json()["item_count"] == 2
    assert len((await client.get("/api/v1/wishlist/", headers=headers_a)).json()) == 1

    # Missing product in wishlist -> 404
    assert (await client.post("/api/v1/wishlist/999999", headers=headers_a)).status_code == 404

    # Inactive product cannot be added to wishlist or cart, and is hidden from wishlist GET
    override_get_db = app.dependency_overrides[get_db]
    async for session in override_get_db():
        prod5 = (
            await session.execute(select(Product).where(Product.id == 5))
        ).scalar_one()
        prod5.is_active = False
        await session.commit()
        break

    assert (await client.post("/api/v1/wishlist/5", headers=headers_a)).status_code == 404
    assert (
        await client.post(
            "/api/v1/cart/items",
            headers=headers_a,
            json={"product_id": 5, "quantity": 1},
        )
    ).status_code == 404

    # User A removes product #2 from wishlist -> empty
    rem_wish = await client.delete("/api/v1/wishlist/2", headers=headers_a)
    assert rem_wish.status_code == 200
    assert (await client.get("/api/v1/wishlist/", headers=headers_a)).json() == []
