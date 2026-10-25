from httpx import AsyncClient

from app.core.database import get_db
from app.main import app
from app.models.product import Product


async def test_catalog_list_contracts_and_no_redirect_both_slash_variants(
    client: AsyncClient,
) -> None:
    # Both trailing-slash and non-trailing-slash endpoints must return 200 directly (no 307 redirect)
    for path in ("/api/v1/products", "/api/v1/products/"):
        res = await client.get(path, follow_redirects=False)
        assert res.status_code == 200
        body = res.json()
        assert set(body.keys()) >= {"items", "meta"}
        assert "total" not in body  # Must use `meta`, never legacy mock `{ items, total }`
        assert isinstance(body["items"], list)
        assert body["meta"] == {
            "total": 8,
            "page": 1,
            "page_size": 20,
            "total_pages": 1,
            "has_next": False,
            "has_prev": False,
        }

    for path in ("/api/v1/categories", "/api/v1/categories/"):
        res = await client.get(path, follow_redirects=False)
        assert res.status_code == 200
        cats = res.json()
        assert isinstance(cats, list)
        assert len(cats) == 4
        assert sum(c["product_count"] for c in cats) == 8
        assert {c["slug"] for c in cats} == {
            "pastry-stands",
            "fruit-vessels",
            "serving-trays",
            "nut-ordur",
        }

    for path in ("/api/v1/brands", "/api/v1/brands/"):
        res = await client.get(path, follow_redirects=False)
        assert res.status_code == 200
        brands = res.json()
        assert isinstance(brands, list)
        assert len(brands) == 4
        assert sum(b["product_count"] for b in brands) == 8
        assert {b["slug"] for b in brands} == {
            "aru-atelier",
            "zarrin-anodize",
            "simin-craft",
            "parsia-form",
        }


async def test_product_detail_by_canonical_slug_id_sku_legacy_alias_and_404_missing(
    client: AsyncClient,
) -> None:
    # 1. Canonical slug lookup
    canonical = await client.get(
        "/api/v1/products/shahnameh-3tier-aluminum-pastry-stand"
    )
    assert canonical.status_code == 200
    data = canonical.json()
    assert data["sku"] == "ARU-101"
    assert data["slug"] == "shahnameh-3tier-aluminum-pastry-stand"
    assert data["price"] == 118.0
    assert data["compare_at_price"] == 139.0
    assert data["price_toman"] == 6490000
    assert data["compare_at_toman"] == 7650000
    assert data["brand"]["slug"] == "aru-atelier"
    assert data["category"]["slug"] == "pastry-stands"

    # 2. Numeric ID lookup
    by_id = await client.get(f"/api/v1/products/{data['id']}")
    assert by_id.status_code == 200
    assert by_id.json()["id"] == data["id"]

    # 3. SKU lookup
    by_sku = await client.get("/api/v1/products/ARU-108")
    assert by_sku.status_code == 200
    assert by_sku.json()["slug"] == "kashkool-sculptural-aluminum-centerpiece"

    # 4. Documented legacy public URL alias lookup (non-destructive)
    by_legacy = await client.get("/api/v1/products/royal-3tier-aluminum-stand")
    assert by_legacy.status_code == 200
    assert by_legacy.json()["sku"] == "ARU-101"
    assert by_legacy.json()["slug"] == "shahnameh-3tier-aluminum-pastry-stand"

    # 5. Missing slug & missing ID must return 404 (never fall back to product[0])
    missing_slug = await client.get("/api/v1/products/non-existent-aluminum-piece")
    assert missing_slug.status_code == 404
    assert missing_slug.json()["detail"] == "Product not found"

    missing_id = await client.get("/api/v1/products/999999")
    assert missing_id.status_code == 404


async def test_pagination_meta_and_sorting_stability(client: AsyncClient) -> None:
    p1 = await client.get(
        "/api/v1/products/?page=1&page_size=6&sort_by=featured"
    )
    assert p1.status_code == 200
    b1 = p1.json()
    assert b1["meta"] == {
        "total": 8,
        "page": 1,
        "page_size": 6,
        "total_pages": 2,
        "has_next": True,
        "has_prev": False,
    }
    assert len(b1["items"]) == 6

    p2 = await client.get(
        "/api/v1/products/?page=2&page_size=6&sort_by=featured"
    )
    assert p2.status_code == 200
    b2 = p2.json()
    assert b2["meta"] == {
        "total": 8,
        "page": 2,
        "page_size": 6,
        "total_pages": 2,
        "has_next": False,
        "has_prev": True,
    }
    assert len(b2["items"]) == 2

    ids_p1 = {item["id"] for item in b1["items"]}
    ids_p2 = {item["id"] for item in b2["items"]}
    assert ids_p1.isdisjoint(ids_p2)
    assert len(ids_p1 | ids_p2) == 8


async def test_multi_brand_search_price_sale_stock_and_color_filters(
    client: AsyncClient,
) -> None:
    # Multi-brand filter (repeated query parameters)
    multi = await client.get(
        "/api/v1/products/?brand_slugs=aru-atelier&brand_slugs=simin-craft"
    )
    assert multi.status_code == 200
    multi_items = multi.json()["items"]
    assert len(multi_items) > 0
    assert {item["brand"]["slug"] for item in multi_items} == {
        "aru-atelier",
        "simin-craft",
    }

    # Search filter (Persian & English)
    search_fa = await client.get("/api/v1/products/?search=کشکول")
    assert search_fa.status_code == 200
    assert search_fa.json()["meta"]["total"] >= 1
    assert any(
        item["sku"] == "ARU-108" for item in search_fa.json()["items"]
    )

    # Price ceiling filter
    under_90 = await client.get("/api/v1/products/?max_price=90")
    assert under_90.status_code == 200
    assert len(under_90.json()["items"]) > 0
    assert all(item["price"] <= 90.0 for item in under_90.json()["items"])

    # On-sale filter
    on_sale = await client.get("/api/v1/products/?is_on_sale=true")
    assert on_sale.status_code == 200
    assert len(on_sale.json()["items"]) > 0
    assert all(item["is_on_sale"] is True for item in on_sale.json()["items"])

    # New arrivals filter
    only_new = await client.get("/api/v1/products/?is_new=true")
    assert only_new.status_code == 200
    assert len(only_new.json()["items"]) > 0
    assert all(item["is_new"] is True for item in only_new.json()["items"])

    # Insert an out-of-stock item (`in_stock=True` flag stale but `stock_quantity=0`)
    # plus a custom bronze-only finish item to verify exact stock & color filtering
    override_get_db = app.dependency_overrides[get_db]
    async for session in override_get_db():
        session.add(
            Product(
                sku="ARU-ZERO-STOCK",
                slug="zero-stock-test-vessel",
                name="Zero Stock Vessel",
                name_fa="ظرف بدون موجودی تست",
                description="Out of stock verification item",
                description_fa="محصول تست اتمام موجودی",
                price=80.0,
                price_toman=4400000,
                stock_quantity=0,
                in_stock=True,  # Even with boolean True, 0 stock must be treated as out-of-stock
                is_active=True,
                archetype="fruit-bowl",
                colors=[
                    {
                        "id": "bronze-exclusive",
                        "name": "Antique Bronze",
                        "name_fa": "برنزی آنتیک",
                        "hex": "#78553a",
                        "accentHex": "#d97706",
                    }
                ],
            )
        )
        await session.commit()
        break

    in_stock_res = await client.get("/api/v1/products/?in_stock=true&page_size=50")
    assert in_stock_res.status_code == 200
    in_stock_skus = {p["sku"] for p in in_stock_res.json()["items"]}
    assert "ARU-ZERO-STOCK" not in in_stock_skus
    assert all(
        p["in_stock"] is True and p["stock_quantity"] > 0
        for p in in_stock_res.json()["items"]
    )

    out_of_stock_res = await client.get("/api/v1/products/?in_stock=false")
    assert out_of_stock_res.status_code == 200
    assert [p["sku"] for p in out_of_stock_res.json()["items"]] == [
        "ARU-ZERO-STOCK"
    ]

    # Server-backed color/finish filter
    bronze_res = await client.get("/api/v1/products/?color=bronze-exclusive")
    assert bronze_res.status_code == 200
    assert bronze_res.json()["meta"]["total"] == 1
    assert bronze_res.json()["items"][0]["sku"] == "ARU-ZERO-STOCK"

    missing_color_res = await client.get("/api/v1/products/?color=emerald-nonexistent")
    assert missing_color_res.status_code == 200
    assert missing_color_res.json()["meta"]["total"] == 0
    assert missing_color_res.json()["items"] == []
