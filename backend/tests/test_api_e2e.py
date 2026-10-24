from io import BytesIO
from httpx import AsyncClient
from PIL import Image
import pytest

from app.services.payment_service import PaymentService
from app.utils.image_processor import validate_and_optimize_image
from app.utils.slugify import ensure_unique_slug, generate_slug
from app.utils.validators import normalize_iran_phone, normalize_sku, validate_postal_code


async def test_health_endpoint(client: AsyncClient) -> None:
    res = await client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    assert body["cache"]["status"] == "ok"


async def test_catalog_categories_brands_and_products(client: AsyncClient) -> None:
    cats_res = await client.get("/api/v1/categories/")
    assert cats_res.status_code == 200
    categories = cats_res.json()
    assert len(categories) == 4
    assert sum(c["product_count"] for c in categories) == 8

    brands_res = await client.get("/api/v1/brands/")
    assert brands_res.status_code == 200
    brands = brands_res.json()
    assert len(brands) == 4

    prods_res = await client.get("/api/v1/products/?page=1&page_size=4&sort_by=price-asc")
    assert prods_res.status_code == 200
    payload = prods_res.json()
    assert payload["meta"]["total"] == 8
    assert len(payload["items"]) == 4
    prices = [p["price"] for p in payload["items"]]
    assert prices == sorted(prices)

    slug = payload["items"][0]["slug"]
    detail_res = await client.get(f"/api/v1/products/{slug}")
    assert detail_res.status_code == 200
    assert detail_res.json()["slug"] == slug

    related_res = await client.get(f"/api/v1/products/{detail_res.json()['id']}/related")
    assert related_res.status_code == 200
    assert len(related_res.json()) > 0


async def test_auth_register_login_refresh_profile_and_logout(client: AsyncClient) -> None:
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "sara@arustore.ir",
            "full_name": "سارا محمدی",
            "phone": "+989129876543",
            "password": "StrongPassword123",
        },
    )
    assert reg_res.status_code == 201
    tokens = reg_res.json()
    access = tokens["access_token"]
    refresh = tokens["refresh_token"]
    assert tokens["user"]["phone"] == "09129876543"

    headers = {"Authorization": f"Bearer {access}"}
    me_res = await client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "sara@arustore.ir"

    addr_res = await client.post(
        "/api/v1/users/me/addresses",
        headers=headers,
        json={
            "title": "منزل",
            "recipient_name": "سارا محمدی",
            "phone": "09129876543",
            "city": "اصفهان",
            "address_line": "خیابان چهارباغ بالا، پلاک ۱۸",
            "postal_code": "8163456789",
            "is_default": True,
        },
    )
    assert addr_res.status_code == 201

    ref_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh},
    )
    assert ref_res.status_code == 200
    new_access = ref_res.json()["access_token"]

    logout_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {new_access}"},
    )
    assert logout_res.status_code == 200

    revoked_me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {new_access}"},
    )
    assert revoked_me.status_code == 401


async def test_cart_promo_order_verified_review_and_wishlist_flow(
    client: AsyncClient,
) -> None:
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "arian@arustore.ir", "password": "Arian1234!"},
    )
    assert login_res.status_code == 200
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Wishlist add / list / delete
    wl_add = await client.post("/api/v1/wishlist/2", headers=headers)
    assert wl_add.status_code == 201
    wl_list = await client.get("/api/v1/wishlist/", headers=headers)
    assert wl_list.status_code == 200
    assert any(item["id"] == 2 for item in wl_list.json())
    wl_del = await client.delete("/api/v1/wishlist/2", headers=headers)
    assert wl_del.status_code == 200

    # Add item to cart and apply ARU3D promo code
    cart_add = await client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": 2, "quantity": 2, "selected_edition": "gift"},
    )
    assert cart_add.status_code == 201
    assert cart_add.json()["item_count"] == 2

    promo_res = await client.post(
        "/api/v1/cart/apply-promo",
        headers=headers,
        json={"code": "ARU3D"},
    )
    assert promo_res.status_code == 200
    promo_data = promo_res.json()
    assert promo_data["promo_percent"] == 15.0
    assert promo_data["discount_amount"] > 0

    # Checkout order from cart
    order_res = await client.post(
        "/api/v1/orders/",
        headers=headers,
        json={
            "customer_name": "آرین رادمهر",
            "customer_phone": "09123456789",
            "shipping_address": "تهران، زعفرانیه، پلاک ۴۲",
            "postal_code": "1987654321",
            "promo_code": "ARU3D",
        },
    )
    assert order_res.status_code == 201
    order = order_res.json()
    assert order["order_number"].startswith("ARU-")
    assert order["promo_code"] == "ARU3D"
    assert len(order["items"]) == 1

    # Cart should now be empty after order placement
    cart_after = await client.get("/api/v1/cart/", headers=headers)
    assert cart_after.json()["item_count"] == 0

    # Verified purchase review on product 2
    rev_res = await client.post(
        "/api/v1/reviews/",
        headers=headers,
        json={
            "product_id": 2,
            "rating": 5,
            "title": "تراش بسیار تمیز",
            "comment": "پایه سنگین و شیارهای بدنه کاملاً یکدست هستند.",
        },
    )
    assert rev_res.status_code == 201
    assert rev_res.json()["is_verified_purchase"] is True


async def test_admin_and_analytics_endpoints(client: AsyncClient) -> None:
    ev_res = await client.post(
        "/api/v1/analytics/events",
        json={"event_type": "product_view_3d", "product_id": 1, "metadata": {"angle": 120}},
    )
    assert ev_res.status_code == 201

    admin_login = await client.post(
        "/api/v1/auth/login/json",
        json={"email_or_username": "admin@arustore.ir", "password": "Admin1234!"},
    )
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    dash = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert dash.status_code == 200
    assert dash.json()["overview"]["total_products"] == 8

    created_prod = await client.post(
        "/api/v1/products/",
        headers=admin_headers,
        json={
            "sku": "ARU-909",
            "name": "Cast Aluminum Sugar Bowl",
            "name_fa": "قندان آلومینیومی ریخته‌گری",
            "description": "Compact lidded cast aluminum sugar vessel.",
            "description_fa": "قندان درب‌دار آلومینیوم خالص با پرداخت مات.",
            "price": 58.0,
            "price_toman": 3190000,
            "stock_quantity": 15,
            "brand_id": 1,
            "primary_category_id": 3,
        },
    )
    assert created_prod.status_code == 201
    new_id = created_prod.json()["id"]

    updated_prod = await client.patch(
        f"/api/v1/products/{new_id}",
        headers=admin_headers,
        json={"stock_quantity": 4, "price": 62.0},
    )
    assert updated_prod.status_code == 200
    assert updated_prod.json()["price"] == 62.0


def test_utility_helpers_and_payment_hmac() -> None:
    slug = generate_slug("میوه‌خوری آلومینیومی لوتوس")
    assert slug
    assert ensure_unique_slug("lotus", {"lotus", "lotus-2"}) == "lotus-3"
    assert normalize_iran_phone("+98 912 345 6789") == "09123456789"
    assert validate_postal_code("19876-54321") == "1987654321"
    assert normalize_sku("aru-205") == "ARU-205"

    pay = PaymentService()
    tx = pay.initiate_transaction("ARU-2026-10001", 5390000)
    assert pay.verify_transaction(
        "ARU-2026-10001",
        5390000,
        str(tx["authority"]),
        str(tx["signature"]),
    )

    buf = BytesIO()
    Image.new("RGB", (2400, 1800), color=(30, 32, 38)).save(buf, format="PNG")
    optimized, meta = validate_and_optimize_image(buf.getvalue(), max_dimension=1200)
    assert len(optimized) > 0
    assert meta["format"] == "WEBP"
    assert meta["width"] == 1200

    with pytest.raises(ValueError):
        normalize_iran_phone("12345")
