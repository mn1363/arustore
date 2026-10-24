from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.brand import Brand
from app.models.category import Category
from app.models.discount import Discount
from app.models.product import Product, ProductImage
from app.models.review import Review
from app.models.user import Address, User


async def seed_initial_catalog(db: AsyncSession) -> None:
    """Idempotently populate aluminum servingware catalog, brands, discounts, and demo users."""
    existing_count = (await db.execute(select(Product.id).limit(1))).scalar_one_or_none()
    if existing_count is not None:
        return

    # 1. Demo Users
    admin_user = User(
        email="admin@arustore.ir",
        username="admin",
        phone="09121112233",
        full_name="مدیر کارگاه آرو استور",
        password_hash=get_password_hash("Admin1234!"),
        loyalty_points=2500,
        loyalty_tier="Gold",
        is_active=True,
        is_admin=True,
        is_verified=True,
    )
    collector_user = User(
        email="arian@arustore.ir",
        username="arian",
        phone="09123456789",
        full_name="آرین رادمهر",
        password_hash=get_password_hash("Arian1234!"),
        loyalty_points=640,
        loyalty_tier="Gold",
        is_active=True,
        is_admin=False,
        is_verified=True,
    )
    db.add_all([admin_user, collector_user])
    await db.flush()

    db.add(
        Address(
            user_id=collector_user.id,
            title="منزل",
            recipient_name="آرین رادمهر",
            phone="09123456789",
            city="تهران",
            address_line="زعفرانیه، خیابان مقدس اردبیلی، پلاک ۴۲، واحد ۸",
            postal_code="1987654321",
            is_default=True,
        )
    )

    # 2. Categories
    categories_data = [
        Category(
            name="Pastry & Tiered Stands",
            name_fa="شیرینی‌خوری و استند طبقاتی",
            slug="pastry-stands",
            description="Spun and cast aluminum multi-tier pastry stands.",
            description_fa="انواع شیرینی‌خوری‌های چندطبقه و پایه‌دار آلومینیومی با آنودایز رنگ‌ثابت",
            image="/images/products/tiered-stand.png",
            sort_order=1,
        ),
        Category(
            name="Fruit Bowls & Centerpieces",
            name_fa="میوه‌خوری و کشکول",
            slug="fruit-vessels",
            description="Pedestal fruit bowls and sculptural centerpieces.",
            description_fa="میوه‌خوری‌های پایه‌دار و کشکول‌های دکوراتیو تراش‌خورده از شمش آلومینیوم",
            image="/images/products/fruit-bowl.png",
            sort_order=2,
        ),
        Category(
            name="Serving Trays & Tea Sets",
            name_fa="سینی پذیرایی و ست چای‌خوری",
            slug="serving-trays",
            description="Heavy-gauge aluminum serving trays and tea sets.",
            description_fa="سینی‌های ضخیم آلومینیومی و سرویس‌های چای‌خوری مقاوم در برابر حرارت",
            image="/images/products/serving-tray.png",
            sort_order=3,
        ),
        Category(
            name="Nut Dishes & Ordur Platters",
            name_fa="آجیل‌خوری و اردو خوری",
            slug="nut-ordur",
            description="Covered nut bowls, sectional ordur platters, and table accents.",
            description_fa="آجیل‌خوری‌های درب‌دار، اردوخوری‌های چندخانه و شمعدان‌های آلومینیومی",
            image="/images/products/ordu-platter.png",
            sort_order=4,
        ),
    ]
    db.add_all(categories_data)
    await db.flush()
    cat_by_slug = {c.slug: c for c in categories_data}

    # 3. Brands
    brands_data = [
        Brand(
            name="Aru Cast Atelier",
            name_fa="کارگاه ریخته‌گری آرو",
            slug="aru-atelier",
            description="Gravity-cast pure aluminum servingware.",
            description_fa="تولیدکننده تخصصی ظروف ریخته‌گری آلومینیوم خالص",
            country="Iran",
        ),
        Brand(
            name="Zarrin Anodize",
            name_fa="زرین آنودایز",
            slug="zarrin-anodize",
            description="Kiln-cured champagne and bronze anodized aluminum.",
            description_fa="متخصص پوشش‌های آنودایز کوره‌ای شامپاینی و برنزی",
            country="Iran",
        ),
        Brand(
            name="Simin Hammercraft",
            name_fa="سیمین چکش‌کار",
            slug="simin-craft",
            description="Artisan hand-hammered aluminum vessels.",
            description_fa="تلفیق چکش‌کاری سنتی با ورق ضخیم آلومینیوم",
            country="Iran",
        ),
        Brand(
            name="Parsia CNC Form",
            name_fa="پارسیا فرم CNC",
            slug="parsia-form",
            description="Precision CNC-fluted modern aluminum tableware.",
            description_fa="ظروف مدرن آلومینیومی با شیارزنی دقیق CNC",
            country="Iran",
        ),
    ]
    db.add_all(brands_data)
    await db.flush()
    brand_by_slug = {b.slug: b for b in brands_data}

    default_colors = [
        {"id": "champagne", "name": "Champagne Gold", "name_fa": "شامپاینی مات", "hex": "#d8dee9", "accentHex": "#d6b88a"},
        {"id": "silver", "name": "Brushed Silver", "name_fa": "نقره‌ای برس‌خورده", "hex": "#e2e8f0", "accentHex": "#cbd5e1"},
    ]

    products_seed = [
        {
            "sku": "ARU-101",
            "slug": "shahnameh-3tier-aluminum-pastry-stand",
            "name": "3-Tier Cast Aluminum Pastry Stand",
            "name_fa": "شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه",
            "description": "Three-tier spun pure aluminum pastry stand with central ring finial and tarnish-free anodized finish.",
            "description_fa": "شیرینی‌خوری سه‌طبقه تولیدشده از آلومینیوم خالص با ستون مرکزی تراش‌خورده و پوشش آنودایز رنگ‌ثابت.",
            "price": 118.0,
            "compare_at_price": 139.0,
            "price_toman": 6490000,
            "compare_at_toman": 7650000,
            "stock_quantity": 18,
            "is_featured": True,
            "is_new": True,
            "is_on_sale": True,
            "archetype": "tiered-stand",
            "cat": "pastry-stands",
            "brand": "aru-atelier",
            "img": "/images/products/tiered-stand.png",
            "specs": [
                {"label": "Alloy", "label_fa": "جنس بدنه", "value": "99.7% Pure Aluminum", "value_fa": "شمش آلومینیوم خالص ۹۹.۷٪"},
                {"label": "Height", "label_fa": "ارتفاع کل", "value": "42 cm", "value_fa": "۴۲ سانتی‌متر"},
            ],
            "highlights": ["Tarnish-free kiln anodizing", "Detachable 3-tier assembly"],
            "highlights_fa": ["پوشش آنودایز کوره‌ای بدون تغییر رنگ", "قابلیت باز و بسته شدن آسان طبقات"],
        },
        {
            "sku": "ARU-102",
            "slug": "lotus-fluted-aluminum-fruit-bowl",
            "name": "Lotus Fluted Pedestal Fruit Bowl",
            "name_fa": "میوه‌خوری پایه‌دار شیاردار آلومینیومی مدل لوتوس",
            "description": "CNC-fluted cast aluminum pedestal fruit bowl with balanced weighted base.",
            "description_fa": "میوه‌خوری پایه‌دار با شیارهای منظم تراش CNC و پایه سنگین ضدلغزش.",
            "price": 98.0,
            "compare_at_price": None,
            "price_toman": 5390000,
            "compare_at_toman": None,
            "stock_quantity": 24,
            "is_featured": True,
            "is_new": False,
            "is_on_sale": False,
            "archetype": "fruit-bowl",
            "cat": "fruit-vessels",
            "brand": "parsia-form",
            "img": "/images/products/fruit-bowl.png",
            "specs": [
                {"label": "Diameter", "label_fa": "قطر دهانه", "value": "34 cm", "value_fa": "۳۴ سانتی‌متر"},
                {"label": "Weight", "label_fa": "وزن خالص", "value": "1.85 kg", "value_fa": "۱۸۵۰ گرم"},
            ],
            "highlights": ["34 cm wide bowl", "Scratch-resistant satin finish"],
            "highlights_fa": ["دهانه عریض ۳۴ سانتی‌متری", "مقاوم در برابر خط‌وخش و رطوبت"],
        },
        {
            "sku": "ARU-103",
            "slug": "persepolis-engraved-aluminum-serving-tray",
            "name": "Hammered Rim Aluminum Serving Tray",
            "name_fa": "سینی پذیرایی آلومینیومی دسته‌دار مدل آپادانا",
            "description": "4 mm thick pure aluminum rectangular serving tray with cast ergonomic handles.",
            "description_fa": "سینی پذیرایی ورق ضخیم ۴ میلی‌متری آلومینیوم با دسته‌های ریخته‌گری مستحکم.",
            "price": 84.0,
            "compare_at_price": 96.0,
            "price_toman": 4620000,
            "compare_at_toman": 5280000,
            "stock_quantity": 30,
            "is_featured": True,
            "is_new": False,
            "is_on_sale": True,
            "archetype": "serving-tray",
            "cat": "serving-trays",
            "brand": "zarrin-anodize",
            "img": "/images/products/serving-tray.png",
            "specs": [
                {"label": "Dimensions", "label_fa": "ابعاد", "value": "48 × 32 cm", "value_fa": "۴۸ × ۳۲ سانتی‌متر"},
                {"label": "Thickness", "label_fa": "ضخامت ورق", "value": "4 mm", "value_fa": "۴ میلی‌متر"},
            ],
            "highlights": ["Heat-resistant up to 220°C", "Warp-free 4 mm plate"],
            "highlights_fa": ["مقاوم در برابر حرارت مستقیم استکان و قوری", "ورق ۴ میلی‌متری بدون خمش"],
        },
        {
            "sku": "ARU-104",
            "slug": "domed-hammered-aluminum-nut-chalice",
            "name": "Domed Hammered Aluminum Nut Bowl",
            "name_fa": "آجیل‌خوری و شکلات‌خوری درب‌دار آلومینیومی مدل گنبدی",
            "description": "Pedestal hammered aluminum nut and candy vessel with fitted dome lid.",
            "description_fa": "آجیل‌خوری و شکلات‌خوری پایه‌دار چکش‌کاری با درب گنبدی جهت حفظ تازگی تنقلات.",
            "price": 76.0,
            "compare_at_price": None,
            "price_toman": 4180000,
            "compare_at_toman": None,
            "stock_quantity": 22,
            "is_featured": False,
            "is_new": True,
            "is_on_sale": False,
            "archetype": "nut-dish",
            "cat": "nut-ordur",
            "brand": "simin-craft",
            "img": "/images/products/nut-dish.png",
            "specs": [
                {"label": "Height", "label_fa": "ارتفاع با درب", "value": "27 cm", "value_fa": "۲۷ سانتی‌متر"},
            ],
            "highlights": ["Fitted freshness dome", "Food-grade anodized interior"],
            "highlights_fa": ["درب کیپ برای حفظ تازگی آجیل", "پوشش داخلی بهداشتی خوراکی"],
        },
        {
            "sku": "ARU-105",
            "slug": "chaharbagh-4bowl-aluminum-ordur-platter",
            "name": "4-Bowl Aluminum Ordur Serving Set",
            "name_fa": "اردوخوری چهارخانه آلومینیومی با استند مدل چهارباغ",
            "description": "Four removable hammered aluminum bowls resting on a sculpted carry stand.",
            "description_fa": "چهار پیاله مجزای آلومینیومی روی استند دسته‌دار یکپارچه برای سرو متنوع تنقلات.",
            "price": 89.0,
            "compare_at_price": 105.0,
            "price_toman": 4895000,
            "compare_at_toman": 5775000,
            "stock_quantity": 16,
            "is_featured": True,
            "is_new": True,
            "is_on_sale": True,
            "archetype": "ordu-platter",
            "cat": "nut-ordur",
            "brand": "simin-craft",
            "img": "/images/products/ordu-platter.png",
            "specs": [
                {"label": "Length", "label_fa": "طول استند", "value": "44 cm", "value_fa": "۴۴ سانتی‌متر"},
            ],
            "highlights": ["4 lift-out bowls for easy refilling", "Balanced center carry handle"],
            "highlights_fa": ["۴ پیاله جداشونده برای شستشوی آسان", "دسته مرکزی متعادل"],
        },
        {
            "sku": "ARU-106",
            "slug": "isfahan-anodized-aluminum-tea-hospitality-set",
            "name": "Anodized Aluminum Tea Service Set",
            "name_fa": "ست چای‌خوری و قندان آلومینیومی آنودایز مدل اصفهان",
            "description": "Coordinated teapot, lidded sugar bowl, cup holders, and tray in satin aluminum.",
            "description_fa": "سرویس هماهنگ قوری، قندان درب‌دار، جاستکانی و سینی گرد از آلومینیوم آنودایزشده.",
            "price": 136.0,
            "compare_at_price": 158.0,
            "price_toman": 7480000,
            "compare_at_toman": 8690000,
            "stock_quantity": 12,
            "is_featured": True,
            "is_new": False,
            "is_on_sale": True,
            "archetype": "tea-set",
            "cat": "serving-trays",
            "brand": "zarrin-anodize",
            "img": "/images/products/tea-set.png",
            "specs": [
                {"label": "Pieces", "label_fa": "تعداد قطعات", "value": "6-Piece Set", "value_fa": "سرویس ۶ پارچه کامل"},
            ],
            "highlights": ["High thermal retention", "Stain-proof finish"],
            "highlights_fa": ["حفظ دمای چای", "ضدلک در برابر چای و آب جوش"],
        },
        {
            "sku": "ARU-107",
            "slug": "aria-3arm-cast-aluminum-candelabra",
            "name": "3-Arm Cast Aluminum Candelabra",
            "name_fa": "شمعدان سه‌شاخه آلومینیومی ریخته‌گری مدل آریا",
            "description": "Balanced three-arm cast aluminum dining table candelabra.",
            "description_fa": "شمعدان سه‌شاخه ریخته‌گری آلومینیوم با پایه سنگین و تعادل کامل روی میز شام.",
            "price": 92.0,
            "compare_at_price": None,
            "price_toman": 5060000,
            "compare_at_toman": None,
            "stock_quantity": 19,
            "is_featured": False,
            "is_new": False,
            "is_on_sale": False,
            "archetype": "candelabra",
            "cat": "nut-ordur",
            "brand": "aru-atelier",
            "img": "/images/products/candelabra.png",
            "specs": [
                {"label": "Height", "label_fa": "ارتفاع", "value": "36 cm", "value_fa": "۳۶ سانتی‌متر"},
            ],
            "highlights": ["Drip-catching candlebobeches", "Weighted anti-tip base"],
            "highlights_fa": ["لبه‌های جمع‌کننده اشک شمع", "پایه سنگین ضدواژگونی"],
        },
        {
            "sku": "ARU-108",
            "slug": "kashkool-sculptural-aluminum-centerpiece",
            "name": "Sculptural Cast Aluminum Kashkool Vessel",
            "name_fa": "کشکول پذیرایی آلومینیوم توپر مدل موج",
            "description": "Boat-shaped gravity-cast aluminum centerpiece vessel with brushed satin sheen.",
            "description_fa": "کشکول پذیرایی ریخته‌گری آلومینیوم توپر با پرداخت برس‌خورده مات برای میز ناهارخوری.",
            "price": 112.0,
            "compare_at_price": 128.0,
            "price_toman": 6160000,
            "compare_at_toman": 7040000,
            "stock_quantity": 14,
            "is_featured": True,
            "is_new": True,
            "is_on_sale": True,
            "archetype": "kashkool-vessel",
            "cat": "fruit-vessels",
            "brand": "parsia-form",
            "img": "/images/products/kashkool-vessel.png",
            "specs": [
                {"label": "Span", "label_fa": "طول دهانه", "value": "41 cm", "value_fa": "۴۱ سانتی‌متر"},
            ],
            "highlights": ["Thick cast walls", "Velvet-padded base"],
            "highlights_fa": ["بدنه ضخیم ریخته‌گری", "کفی مخملی محافظ سطح میز"],
        },
    ]

    created_products: list[Product] = []
    for pdata in products_seed:
        cat = cat_by_slug[pdata["cat"]]
        brand = brand_by_slug[pdata["brand"]]
        prod = Product(
            sku=pdata["sku"],
            slug=pdata["slug"],
            name=pdata["name"],
            name_fa=pdata["name_fa"],
            description=pdata["description"],
            description_fa=pdata["description_fa"],
            price=pdata["price"],
            compare_at_price=pdata["compare_at_price"],
            price_toman=pdata["price_toman"],
            compare_at_toman=pdata["compare_at_toman"],
            stock_quantity=pdata["stock_quantity"],
            in_stock=True,
            is_featured=pdata["is_featured"],
            is_new=pdata["is_new"],
            is_on_sale=pdata["is_on_sale"],
            archetype=pdata["archetype"],
            brand_id=brand.id,
            primary_category_id=cat.id,
            colors=default_colors,
            specs=pdata["specs"],
            highlights=pdata["highlights"],
            highlights_fa=pdata["highlights_fa"],
            editions=[
                {"id": "standard", "label": "Standard Box", "label_fa": "بسته‌بندی استاندارد", "priceDelta": 0, "priceDeltaToman": 0},
                {"id": "gift", "label": "Velvet Gift Case", "label_fa": "جعبه هدیه مخمل‌کوب", "priceDelta": 12, "priceDeltaToman": 660000},
            ],
            rating_avg=4.9,
            review_count=1,
        )
        prod.images.append(
            ProductImage(
                url=pdata["img"],
                alt=pdata["name_fa"],
                is_primary=True,
                sort_order=0,
            )
        )
        db.add(prod)
        created_products.append(prod)

    await db.flush()

    # 4. Discounts
    db.add_all(
        [
            Discount(
                code="ARU3D",
                description="15% launch discount",
                discount_percent=15.0,
                min_order_amount=50.0,
                is_active=True,
            ),
            Discount(
                code="VIP20",
                description="20% collector discount",
                discount_percent=20.0,
                min_order_amount=100.0,
                is_active=True,
            ),
        ]
    )

    # 5. Sample verified review
    db.add(
        Review(
            product_id=created_products[0].id,
            user_id=collector_user.id,
            rating=5,
            title="کیفیت پرداخت عالی",
            comment="بدنه کاملاً سنگین و خوش‌تراش است و اصلاً لک آب روی آن نمی‌ماند.",
            is_verified_purchase=True,
            is_approved=True,
        )
    )

    await db.commit()
