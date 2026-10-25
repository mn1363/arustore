from httpx import AsyncClient
import pytest
from pydantic import ValidationError
from sqlalchemy import event, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import create_application
from app.models.brand import Brand
from app.models.cart import CartItem
from app.models.category import Category
from app.models.discount import Discount, DiscountUsage
from app.models.order import Order, OrderIdempotencyRecord, OrderItem, OrderStatusHistory
from app.models.payment import (
    DiscountReservation,
    InventoryReservation,
    PaymentAttempt,
)
from app.models.product import Product, ProductImage
from app.models.review import Review
from app.models.user import Address, User
from app.services.seed_service import seed_catalog_only, seed_initial_catalog

STRONG_TRIAL_SECRET = "trial-prod-secret-91827364554637281900aabbccddeeff112233"


def test_auto_seed_catalog_and_trial_mode_defaults(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("AUTO_SEED_CATALOG", raising=False)
    monkeypatch.delenv("AUTO_SEED_DEMO_DATA", raising=False)
    monkeypatch.delenv("TRIAL_MODE", raising=False)
    monkeypatch.delenv("PAYMENT_PROVIDER", raising=False)
    monkeypatch.delenv("PAYMENT_SANDBOX_ENABLED", raising=False)

    dev_defaults = Settings(_env_file=None)
    assert dev_defaults.AUTO_SEED_CATALOG is False
    assert dev_defaults.TRIAL_MODE is False
    assert dev_defaults.AUTO_SEED_DEMO_DATA is True
    assert dev_defaults.PAYMENT_PROVIDER == "disabled"
    assert dev_defaults.PAYMENT_SANDBOX_ENABLED is False
    assert dev_defaults.is_payment_enabled is False

    prod_defaults = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_TRIAL_SECRET,
        ALLOWED_HOSTS=["api.trial.arustore.ir"],
        CORS_ORIGINS=["https://trial.arustore.ir"],
    )
    assert prod_defaults.is_production is True
    assert prod_defaults.AUTO_SEED_DEMO_DATA is False
    assert prod_defaults.AUTO_SEED_CATALOG is False
    assert prod_defaults.TRIAL_MODE is False
    assert prod_defaults.PAYMENT_PROVIDER == "disabled"
    assert prod_defaults.PAYMENT_SANDBOX_ENABLED is False
    assert prod_defaults.is_payment_enabled is False


def test_production_and_trial_settings_security_guards() -> None:
    # 1. Production + AUTO_SEED_DEMO_DATA=True fails regardless of AUTO_SEED_CATALOG / TRIAL_MODE
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_TRIAL_SECRET,
            AUTO_SEED_DEMO_DATA=True,
            AUTO_SEED_CATALOG=False,
            ALLOWED_HOSTS=["api.trial.arustore.ir"],
            CORS_ORIGINS=["https://trial.arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_TRIAL_SECRET,
            AUTO_SEED_DEMO_DATA=True,
            AUTO_SEED_CATALOG=True,
            TRIAL_MODE=True,
            ALLOWED_HOSTS=["api.trial.arustore.ir"],
            CORS_ORIGINS=["https://trial.arustore.ir"],
        )

    # 2. TRIAL_MODE=True forbids enabling sandbox payments even in development
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="development",
            TRIAL_MODE=True,
            PAYMENT_PROVIDER="sandbox",
            PAYMENT_SANDBOX_ENABLED=True,
        )

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="development",
            TRIAL_MODE=True,
            PAYMENT_PROVIDER="disabled",
            PAYMENT_SANDBOX_ENABLED=True,
        )

    # 3. AUTO_SEED_CATALOG=True / TRIAL_MODE=True must never weaken SECRET_KEY, sandbox, host, or CORS guards
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY="short-secret",
            AUTO_SEED_CATALOG=True,
            TRIAL_MODE=True,
            ALLOWED_HOSTS=["api.trial.arustore.ir"],
            CORS_ORIGINS=["https://trial.arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_TRIAL_SECRET,
            AUTO_SEED_CATALOG=True,
            PAYMENT_PROVIDER="sandbox",
            ALLOWED_HOSTS=["api.trial.arustore.ir"],
            CORS_ORIGINS=["https://trial.arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_TRIAL_SECRET,
            AUTO_SEED_CATALOG=True,
            TRIAL_MODE=True,
            ALLOWED_HOSTS=["*"],
            CORS_ORIGINS=["https://trial.arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_TRIAL_SECRET,
            AUTO_SEED_CATALOG=True,
            TRIAL_MODE=True,
            ALLOWED_HOSTS=["api.trial.arustore.ir"],
            CORS_ORIGINS=["*"],
        )

    # 4. Safe trial production settings succeed cleanly
    safe_trial = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_TRIAL_SECRET,
        AUTO_SEED_CATALOG=True,
        TRIAL_MODE=True,
        PAYMENT_PROVIDER="disabled",
        PAYMENT_SANDBOX_ENABLED=False,
        ALLOWED_HOSTS=["api.trial.arustore.ir"],
        CORS_ORIGINS=["https://trial.arustore.ir"],
    )
    assert safe_trial.is_production is True
    assert safe_trial.AUTO_SEED_DEMO_DATA is False
    assert safe_trial.AUTO_SEED_CATALOG is True
    assert safe_trial.TRIAL_MODE is True
    assert safe_trial.PAYMENT_PROVIDER == "disabled"
    assert safe_trial.PAYMENT_SANDBOX_ENABLED is False
    assert safe_trial.is_payment_enabled is False


@pytest.mark.asyncio
async def test_catalog_only_seeding_omits_users_admins_addresses_and_reviews_and_is_idempotent(
    tmp_path,
) -> None:
    db_file = tmp_path / "catalog_only_seed.sqlite"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with SessionLocal() as session:
            await seed_catalog_only(session)

        async with SessionLocal() as session:
            await seed_initial_catalog(session, include_demo_data=False)
            await seed_catalog_only(session)

        async with SessionLocal() as check_session:
            cats = (await check_session.execute(select(Category))).scalars().all()
            brands = (await check_session.execute(select(Brand))).scalars().all()
            prods = (
                await check_session.execute(select(Product).order_by(Product.id.asc()))
            ).scalars().all()
            imgs = (await check_session.execute(select(ProductImage))).scalars().all()
            discounts = (await check_session.execute(select(Discount))).scalars().all()

            assert len(cats) == 4
            assert len(brands) == 4
            assert len(prods) == 8
            assert len(imgs) == 8
            assert {d.code for d in discounts} == {"ARU3D", "VIP20"}

            assert (
                await check_session.execute(select(func.count(User.id)))
            ).scalar_one() == 0
            assert (
                await check_session.execute(
                    select(func.count(User.id)).where(User.is_admin.is_(True))
                )
            ).scalar_one() == 0
            assert (
                await check_session.execute(select(func.count(Address.id)))
            ).scalar_one() == 0
            assert (
                await check_session.execute(select(func.count(Review.id)))
            ).scalar_one() == 0

            for prod in prods:
                assert prod.review_count == 0
                assert prod.rating_avg == 0.0
    finally:
        await test_engine.dispose()


@pytest.mark.asyncio
async def test_half_populated_database_catalog_only_completes_missing_entities_and_is_idempotent(
    tmp_path,
) -> None:
    db_file = tmp_path / "half_populated_catalog.sqlite"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Pre-populate a partial database: 2 categories, 1 brand, 2 products (with stale
        # rating_avg/review_count and custom commercial fields, and 0 approved reviews),
        # and 1 discount (with existing used_count=3)
        async with SessionLocal() as setup_session:
            cat_pastry = Category(
                name="Pastry & Tiered Stands",
                name_fa="شیرینی‌خوری و استند طبقاتی",
                slug="pastry-stands",
                sort_order=1,
            )
            cat_fruit = Category(
                name="Fruit Bowls & Centerpieces",
                name_fa="میوه‌خوری و کشکول",
                slug="fruit-vessels",
                sort_order=2,
            )
            brand_aru = Brand(
                name="Aru Cast Atelier",
                name_fa="کارگاه ریخته‌گری آرو",
                slug="aru-atelier",
                country="Iran",
            )
            setup_session.add_all([cat_pastry, cat_fruit, brand_aru])
            await setup_session.flush()

            prod_1 = Product(
                sku="ARU-101",
                slug="shahnameh-3tier-aluminum-pastry-stand",
                name="3-Tier Cast Aluminum Pastry Stand",
                name_fa="شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه",
                description="Existing product 1",
                description_fa="محصول موجود ۱",
                price=125.0,
                price_toman=6890000,
                stock_quantity=7,
                in_stock=True,
                archetype="tiered-stand",
                brand_id=brand_aru.id,
                primary_category_id=cat_pastry.id,
                rating_avg=4.9,
                review_count=1,
            )
            prod_1.images.append(
                ProductImage(
                    url="/images/products/tiered-stand.png",
                    alt="شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه",
                    is_primary=True,
                    sort_order=0,
                )
            )

            # Product 2 exists WITHOUT ProductImage, with brand_id=None, and with stale rating/review_count
            prod_2 = Product(
                sku="ARU-102",
                slug="lotus-fluted-aluminum-fruit-bowl",
                name="Lotus Fluted Pedestal Fruit Bowl",
                name_fa="میوه‌خوری پایه‌دار شیاردار آلومینیومی مدل لوتوس",
                description="Existing product 2 without image or brand",
                description_fa="محصول موجود ۲ بدون تصویر و برند",
                price=98.0,
                price_toman=5390000,
                stock_quantity=24,
                in_stock=True,
                archetype="fruit-bowl",
                brand_id=None,
                primary_category_id=cat_fruit.id,
                rating_avg=4.8,
                review_count=3,
            )

            disc_aru = Discount(
                code="ARU3D",
                description="15% launch discount",
                discount_percent=15.0,
                min_order_amount=50.0,
                used_count=3,
                is_active=True,
            )
            setup_session.add_all([prod_1, prod_2, disc_aru])
            await setup_session.commit()

        # Run catalog-only seeding on the half-populated DB
        async with SessionLocal() as seed_session:
            await seed_catalog_only(seed_session)

        async with SessionLocal() as verify_session:
            cats = (await verify_session.execute(select(Category))).scalars().all()
            brands = (await verify_session.execute(select(Brand))).scalars().all()
            prods = (
                await verify_session.execute(select(Product).order_by(Product.sku.asc()))
            ).scalars().all()
            imgs = (await verify_session.execute(select(ProductImage))).scalars().all()
            discounts = (
                await verify_session.execute(select(Discount).order_by(Discount.code.asc()))
            ).scalars().all()

            assert len(cats) == 4
            assert len(brands) == 4
            assert len(prods) == 8
            assert len(imgs) == 8
            assert len(discounts) == 2

            valid_cat_ids = {c.id for c in cats}
            valid_brand_ids = {b.id for b in brands}
            parsia_brand = next(b for b in brands if b.slug == "parsia-form")

            by_sku = {p.sku: p for p in prods}
            # Existing product 1 kept its commercial values while stale rating/review_count reset to 0.0 / 0
            assert by_sku["ARU-101"].stock_quantity == 7
            assert by_sku["ARU-101"].price == 125.0
            assert by_sku["ARU-101"].price_toman == 6890000
            assert by_sku["ARU-101"].description == "Existing product 1"
            assert by_sku["ARU-101"].rating_avg == 0.0
            assert by_sku["ARU-101"].review_count == 0
            # Existing product 2 had its missing brand relationship repaired, missing image added, and rating reset
            assert by_sku["ARU-102"].brand_id == parsia_brand.id
            assert by_sku["ARU-102"].stock_quantity == 24
            assert by_sku["ARU-102"].rating_avg == 0.0
            assert by_sku["ARU-102"].review_count == 0

            for p in prods:
                assert p.primary_category_id in valid_cat_ids
                assert p.brand_id in valid_brand_ids
                assert p.review_count == 0
                assert p.rating_avg == 0.0

            # Existing discount preserved its used_count=3
            by_code = {d.code: d for d in discounts}
            assert set(by_code.keys()) == {"ARU3D", "VIP20"}
            assert by_code["ARU3D"].used_count == 3

            # Zero demo users, admins, addresses, or reviews created
            assert (
                await verify_session.execute(select(func.count(User.id)))
            ).scalar_one() == 0
            assert (
                await verify_session.execute(
                    select(func.count(User.id)).where(User.is_admin.is_(True))
                )
            ).scalar_one() == 0
            assert (
                await verify_session.execute(select(func.count(Address.id)))
            ).scalar_one() == 0
            assert (
                await verify_session.execute(select(func.count(Review.id)))
            ).scalar_one() == 0

        # Re-run catalog-only seed a second time -> strictly no duplicates or demo records
        async with SessionLocal() as rerun_session:
            await seed_catalog_only(rerun_session)

        async with SessionLocal() as recheck_session:
            assert (
                await recheck_session.execute(select(func.count(Category.id)))
            ).scalar_one() == 4
            assert (
                await recheck_session.execute(select(func.count(Brand.id)))
            ).scalar_one() == 4
            assert (
                await recheck_session.execute(select(func.count(Product.id)))
            ).scalar_one() == 8
            assert (
                await recheck_session.execute(select(func.count(ProductImage.id)))
            ).scalar_one() == 8
            assert (
                await recheck_session.execute(select(func.count(Discount.id)))
            ).scalar_one() == 2
            assert (
                await recheck_session.execute(select(func.count(User.id)))
            ).scalar_one() == 0
            assert (
                await recheck_session.execute(
                    select(func.count(User.id)).where(User.is_admin.is_(True))
                )
            ).scalar_one() == 0
            assert (
                await recheck_session.execute(select(func.count(Address.id)))
            ).scalar_one() == 0
            assert (
                await recheck_session.execute(select(func.count(Review.id)))
            ).scalar_one() == 0
    finally:
        await test_engine.dispose()


@pytest.mark.asyncio
async def test_catalog_only_seeding_syncs_existing_product_ratings_from_approved_reviews(
    tmp_path,
) -> None:
    db_file = tmp_path / "half_populated_with_real_reviews.sqlite"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with SessionLocal() as setup_session:
            cat_pastry = Category(
                name="Pastry & Tiered Stands",
                name_fa="شیرینی‌خوری و استند طبقاتی",
                slug="pastry-stands",
                sort_order=1,
            )
            cat_fruit = Category(
                name="Fruit Bowls & Centerpieces",
                name_fa="میوه‌خوری و کشکول",
                slug="fruit-vessels",
                sort_order=2,
            )
            brand_aru = Brand(
                name="Aru Cast Atelier",
                name_fa="کارگاه ریخته‌گری آرو",
                slug="aru-atelier",
                country="Iran",
            )
            buyer_1 = User(
                email="realbuyer1@example.com",
                username="realbuyer1",
                phone="09128881101",
                full_name="خریدار واقعی اول",
                password_hash=get_password_hash("BuyerPass123!"),
                is_active=True,
                is_admin=False,
                is_verified=True,
            )
            buyer_2 = User(
                email="realbuyer2@example.com",
                username="realbuyer2",
                phone="09128881102",
                full_name="خریدار واقعی دوم",
                password_hash=get_password_hash("BuyerPass123!"),
                is_active=True,
                is_admin=False,
                is_verified=True,
            )
            setup_session.add_all([cat_pastry, cat_fruit, brand_aru, buyer_1, buyer_2])
            await setup_session.flush()

            # ARU-101 has stale rating_avg=4.9 / review_count=1 and only an UNAPPROVED review
            prod_1 = Product(
                sku="ARU-101",
                slug="shahnameh-3tier-aluminum-pastry-stand",
                name="3-Tier Cast Aluminum Pastry Stand",
                name_fa="شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه",
                description="Existing product 1 with unapproved review only",
                description_fa="محصول موجود ۱ فقط با نظر تأییدنشده",
                price=118.0,
                price_toman=6550000,
                stock_quantity=5,
                in_stock=True,
                archetype="tiered-stand",
                brand_id=brand_aru.id,
                primary_category_id=cat_pastry.id,
                rating_avg=4.9,
                review_count=1,
            )
            prod_1.images.append(
                ProductImage(
                    url="/images/products/tiered-stand.png",
                    alt="شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه",
                    is_primary=True,
                    sort_order=0,
                )
            )

            # ARU-102 has stale rating_avg=2.1 / review_count=12, 2 approved reviews (5 and 4 -> avg 4.5),
            # plus 1 unapproved review (rating 1) that must be ignored
            prod_2 = Product(
                sku="ARU-102",
                slug="lotus-fluted-aluminum-fruit-bowl",
                name="Lotus Fluted Pedestal Fruit Bowl",
                name_fa="میوه‌خوری پایه‌دار شیاردار آلومینیومی مدل لوتوس",
                description="Existing product 2 with real approved reviews",
                description_fa="محصول موجود ۲ با نظرات تأییدشده واقعی",
                price=98.0,
                price_toman=5490000,
                stock_quantity=19,
                in_stock=True,
                archetype="fruit-bowl",
                brand_id=None,
                primary_category_id=cat_fruit.id,
                rating_avg=2.1,
                review_count=12,
            )
            setup_session.add_all([prod_1, prod_2])
            await setup_session.flush()

            setup_session.add_all(
                [
                    Review(
                        product_id=prod_1.id,
                        user_id=buyer_1.id,
                        rating=5,
                        title="در انتظار تأیید",
                        comment="این نظر هنوز تأیید نشده است.",
                        is_verified_purchase=True,
                        is_approved=False,
                    ),
                    Review(
                        product_id=prod_2.id,
                        user_id=buyer_1.id,
                        rating=5,
                        title="عالی",
                        comment="کیفیت ساخت بسیار بالا.",
                        is_verified_purchase=True,
                        is_approved=True,
                    ),
                    Review(
                        product_id=prod_2.id,
                        user_id=buyer_2.id,
                        rating=4,
                        title="خوب",
                        comment="طراحی زیبا و سنگین.",
                        is_verified_purchase=True,
                        is_approved=True,
                    ),
                    Review(
                        product_id=prod_2.id,
                        user_id=buyer_2.id,
                        rating=1,
                        title="رد شده",
                        comment="نظر تأییدنشده نباید محاسبه شود.",
                        is_verified_purchase=False,
                        is_approved=False,
                    ),
                    Discount(
                        code="ARU3D",
                        description="15% launch discount",
                        discount_percent=15.0,
                        min_order_amount=50.0,
                        used_count=5,
                        is_active=True,
                    ),
                ]
            )
            await setup_session.commit()

        # Run catalog-only seeding twice (backfill + idempotency)
        async with SessionLocal() as seed_session:
            await seed_catalog_only(seed_session)
            await seed_catalog_only(seed_session)

        async with SessionLocal() as verify_session:
            prods = (
                await verify_session.execute(select(Product).order_by(Product.sku.asc()))
            ).scalars().all()
            assert len(prods) == 8
            by_sku = {p.sku: p for p in prods}

            # ARU-101 had 0 approved reviews -> reset from (4.9, 1) to (0.0, 0), commercial data intact
            assert by_sku["ARU-101"].rating_avg == 0.0
            assert by_sku["ARU-101"].review_count == 0
            assert by_sku["ARU-101"].stock_quantity == 5
            assert by_sku["ARU-101"].price_toman == 6550000

            # ARU-102 had 2 approved reviews (5 and 4) -> synced from (2.1, 12) to (4.5, 2), commercial data intact
            assert by_sku["ARU-102"].rating_avg == 4.5
            assert by_sku["ARU-102"].review_count == 2
            assert by_sku["ARU-102"].stock_quantity == 19
            assert by_sku["ARU-102"].price_toman == 5490000

            for sku, prod in by_sku.items():
                if sku not in {"ARU-101", "ARU-102"}:
                    assert prod.rating_avg == 0.0
                    assert prod.review_count == 0

            disc_aru = (
                await verify_session.execute(
                    select(Discount).where(Discount.code == "ARU3D")
                )
            ).scalar_one()
            assert disc_aru.used_count == 5

            # Only the 2 pre-existing real customers and 4 pre-existing reviews exist; 0 demo users/admins/addresses
            users = (await verify_session.execute(select(User))).scalars().all()
            assert {u.email for u in users} == {
                "realbuyer1@example.com",
                "realbuyer2@example.com",
            }
            assert all(not u.is_admin for u in users)
            assert (
                await verify_session.execute(select(func.count(Address.id)))
            ).scalar_one() == 0
            assert (
                await verify_session.execute(select(func.count(Review.id)))
            ).scalar_one() == 4
    finally:
        await test_engine.dispose()


@pytest.mark.asyncio
async def test_half_populated_demo_database_completes_missing_demo_accounts_address_and_review(
    tmp_path,
) -> None:
    db_file = tmp_path / "half_demo.sqlite"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Pre-insert ONLY admin_user and collector_user WITHOUT Address and WITHOUT Review
        async with SessionLocal() as s:
            s.add_all(
                [
                    User(
                        email="admin@arustore.ir",
                        username="admin",
                        phone="09121112233",
                        full_name="مدیر کارگاه آرو استور",
                        password_hash=get_password_hash("Admin1234!"),
                        is_active=True,
                        is_admin=True,
                        is_verified=True,
                    ),
                    User(
                        email="arian@arustore.ir",
                        username="arian",
                        phone="09123456789",
                        full_name="آرین رادمهر",
                        password_hash=get_password_hash("Arian1234!"),
                        is_active=True,
                        is_admin=False,
                        is_verified=True,
                    ),
                ]
            )
            await s.commit()

        # Run full demo seed twice -> completes catalog + missing Address + missing Review without duplicates
        async with SessionLocal() as s:
            await seed_initial_catalog(s, include_demo_data=True)
            await seed_initial_catalog(s, include_demo_data=True)

        async with SessionLocal() as s:
            assert (await s.execute(select(func.count(User.id)))).scalar_one() == 2
            assert (await s.execute(select(func.count(Address.id)))).scalar_one() == 1
            assert (await s.execute(select(func.count(Review.id)))).scalar_one() == 1
            assert (await s.execute(select(func.count(Product.id)))).scalar_one() == 8
    finally:
        await test_engine.dispose()


@pytest.mark.asyncio
async def test_trial_mode_blocks_order_submission_before_any_db_write_while_preserving_catalog_auth_and_cart(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    db_file = tmp_path / "prod_trial_readonly_orders.sqlite"
    trial_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    TrialSessionLocal = async_sessionmaker(
        trial_engine, class_=AsyncSession, expire_on_commit=False
    )
    monkeypatch.setattr("app.main.engine", trial_engine)
    monkeypatch.setattr("app.main.AsyncSessionLocal", TrialSessionLocal)

    trial_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_TRIAL_SECRET,
        AUTO_SEED_CATALOG=True,
        TRIAL_MODE=True,
        PAYMENT_PROVIDER="disabled",
        PAYMENT_SANDBOX_ENABLED=False,
        ALLOWED_HOSTS=["api.trial.arustore.ir"],
        CORS_ORIGINS=["https://trial.arustore.ir"],
    )

    async def override_get_db():
        async with TrialSessionLocal() as session:
            yield session

    trial_app = create_application(trial_settings)
    trial_app.dependency_overrides[get_db] = override_get_db

    try:
        async with trial_app.router.lifespan_context(trial_app):
            async with AsyncClient(
                app=trial_app, base_url="http://api.trial.arustore.ir"
            ) as ac:
                # 1. Catalog browsing works normally
                prods_res = await ac.get("/api/v1/products/")
                assert prods_res.status_code == 200
                prods_payload = prods_res.json()
                assert prods_payload["meta"]["total"] == 8
                first_pid = prods_payload["items"][0]["id"]
                initial_stock = prods_payload["items"][0]["stock_quantity"]

                cats_res = await ac.get("/api/v1/categories/")
                assert cats_res.status_code == 200
                assert len(cats_res.json()) == 4

                # 2. Visitor registration & cart operations work normally
                reg_res = await ac.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "trialbuyer@example.com",
                        "full_name": "کاربر تست نمایشی",
                        "phone": "09126665544",
                        "password": "TrialVisitorStrong123!",
                    },
                )
                assert reg_res.status_code == 201
                token = reg_res.json()["access_token"]
                auth_headers = {"Authorization": f"Bearer {token}"}

                cart_res = await ac.post(
                    "/api/v1/cart/items",
                    headers=auth_headers,
                    json={"product_id": first_pid, "quantity": 2},
                )
                assert cart_res.status_code == 201

                promo_res = await ac.post(
                    "/api/v1/cart/apply-promo",
                    headers=auth_headers,
                    json={"code": "ARU3D"},
                )
                assert promo_res.status_code == 200

                # Track any SQL write statements during POST /api/v1/orders/
                executed_write_sql: list[str] = []

                def record_writes(
                    _conn, _cursor, statement: str, _parameters, _context, _executemany
                ) -> None:
                    normalized = statement.lstrip().upper()
                    if normalized.startswith(("INSERT", "UPDATE", "DELETE", "REPLACE")):
                        executed_write_sql.append(statement)

                event.listen(
                    trial_engine.sync_engine, "before_cursor_execute", record_writes
                )
                try:
                    # 3. Final order submission is rejected BEFORE any DB write (both slash variants)
                    for order_path in ("/api/v1/orders/", "/api/v1/orders"):
                        ord_res = await ac.post(
                            order_path,
                            headers={**auth_headers, "Idempotency-Key": "trial-block-1"},
                            json={
                                "customer_name": "کاربر تست نمایشی",
                                "customer_phone": "09126665544",
                                "shipping_address": "تهران، خیابان ولیعصر، پلاک ۱۱۰",
                                "postal_code": "1415567890",
                                "promo_code": "ARU3D",
                            },
                        )
                        assert ord_res.status_code == 503
                        body = ord_res.json()
                        assert body["code"] == "trial_mode_order_submission_disabled"
                        assert "trial_mode_order_submission_disabled" in body["detail"]
                finally:
                    event.remove(
                        trial_engine.sync_engine, "before_cursor_execute", record_writes
                    )

                assert executed_write_sql == []

            # 4. Verify persisted DB state: 0 orders, 0 reservations, 0 discount consumption, cart preserved
            async with TrialSessionLocal() as s:
                assert (await s.execute(select(func.count(Order.id)))).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(OrderItem.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(OrderStatusHistory.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(OrderIdempotencyRecord.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(PaymentAttempt.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(InventoryReservation.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(DiscountReservation.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(DiscountUsage.id)))
                ).scalar_one() == 0

                disc_aru = (
                    await s.execute(select(Discount).where(Discount.code == "ARU3D"))
                ).scalar_one()
                assert disc_aru.used_count == 0

                prod_after = (
                    await s.execute(select(Product).where(Product.id == first_pid))
                ).scalar_one()
                assert prod_after.stock_quantity == initial_stock

                cart_cnt = (
                    await s.execute(select(func.count(CartItem.id)))
                ).scalar_one()
                assert cart_cnt == 1
    finally:
        trial_app.dependency_overrides.clear()
        await trial_engine.dispose()


@pytest.mark.asyncio
async def test_trial_mode_false_preserves_order_flow_and_disabled_payment_provider_contract(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    db_file = tmp_path / "prod_trial_off.sqlite"
    prod_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    ProdSessionLocal = async_sessionmaker(
        prod_engine, class_=AsyncSession, expire_on_commit=False
    )
    monkeypatch.setattr("app.main.engine", prod_engine)
    monkeypatch.setattr("app.main.AsyncSessionLocal", ProdSessionLocal)

    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_TRIAL_SECRET,
        AUTO_SEED_CATALOG=True,
        TRIAL_MODE=False,
        PAYMENT_PROVIDER="disabled",
        PAYMENT_SANDBOX_ENABLED=False,
        ALLOWED_HOSTS=["api.trial.arustore.ir"],
        CORS_ORIGINS=["https://trial.arustore.ir"],
    )

    async def override_get_db():
        async with ProdSessionLocal() as session:
            yield session

    prod_app = create_application(prod_settings)
    prod_app.dependency_overrides[get_db] = override_get_db

    try:
        async with prod_app.router.lifespan_context(prod_app):
            async with AsyncClient(
                app=prod_app, base_url="http://api.trial.arustore.ir"
            ) as ac:
                prods_res = await ac.get("/api/v1/products/")
                first_pid = prods_res.json()["items"][0]["id"]

                reg_res = await ac.post(
                    "/api/v1/auth/register",
                    json={
                        "email": "normalbuyer@example.com",
                        "full_name": "کاربر عادی",
                        "phone": "09127776655",
                        "password": "TrialVisitorStrong123!",
                    },
                )
                assert reg_res.status_code == 201
                auth_headers = {
                    "Authorization": f"Bearer {reg_res.json()['access_token']}"
                }

                assert (
                    await ac.post(
                        "/api/v1/cart/items",
                        headers=auth_headers,
                        json={"product_id": first_pid, "quantity": 1},
                    )
                ).status_code == 201

                # With TRIAL_MODE=False, existing P0-C2 order creation works identically
                ord_res = await ac.post(
                    "/api/v1/orders/",
                    headers={**auth_headers, "Idempotency-Key": "normal-ord-1"},
                    json={
                        "customer_name": "کاربر عادی",
                        "customer_phone": "09127776655",
                        "shipping_address": "تهران، خیابان ولیعصر، پلاک ۱۱۰",
                        "postal_code": "1415567890",
                        "promo_code": "ARU3D",
                    },
                )
                assert ord_res.status_code == 201
                ord_body = ord_res.json()
                assert ord_body["status"] == "pending_payment"
                assert ord_body["payment_status"] == "pending"
                assert ord_body["promo_code"] == "ARU3D"

                # PAYMENT_PROVIDER=disabled keeps the exact P0-C3 503 contract
                pay_res = await ac.post(
                    f"/api/v1/orders/{ord_body['id']}/payment-attempts",
                    headers={**auth_headers, "Idempotency-Key": "normal-pay-1"},
                )
                assert pay_res.status_code == 503
                assert pay_res.json()["code"] == "payment_provider_unavailable"

                sbx_res = await ac.post(
                    f"/api/v1/orders/{ord_body['id']}/payment-attempts/1/sandbox-resolve",
                    headers=auth_headers,
                    json={"outcome": "succeeded", "sandbox_token": "unused"},
                )
                assert sbx_res.status_code == 404

            async with ProdSessionLocal() as s:
                assert (
                    await s.execute(select(func.count(PaymentAttempt.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(InventoryReservation.id)))
                ).scalar_one() == 0
                assert (
                    await s.execute(select(func.count(DiscountReservation.id)))
                ).scalar_one() == 0
    finally:
        prod_app.dependency_overrides.clear()
        await prod_engine.dispose()
