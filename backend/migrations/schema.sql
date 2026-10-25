-- AruStore PostgreSQL Schema Reference (aligned with SQLAlchemy 2.0 ORM models)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    avatar VARCHAR(500),
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    loyalty_tier VARCHAR(64) NOT NULL DEFAULT 'Silver',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(120) NOT NULL,
    address_line VARCHAR(500) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    name_fa VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    description_fa TEXT,
    image VARCHAR(500),
    accent VARCHAR(120),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    name_fa VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    description_fa TEXT,
    logo VARCHAR(500),
    country VARCHAR(100) NOT NULL DEFAULT 'Iran',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(64) NOT NULL UNIQUE,
    slug VARCHAR(220) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    description_fa TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    compare_at_price DOUBLE PRECISION,
    price_toman INTEGER NOT NULL DEFAULT 0,
    compare_at_toman INTEGER,
    stock_quantity INTEGER NOT NULL DEFAULT 10,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_on_sale BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archetype VARCHAR(64) NOT NULL DEFAULT 'fruit-bowl',
    colors JSONB NOT NULL DEFAULT '[]'::jsonb,
    specs JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights_fa JSONB NOT NULL DEFAULT '[]'::jsonb,
    editions JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating_avg DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    review_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    primary_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(80) NOT NULL UNIQUE,
    color_name VARCHAR(120) NOT NULL,
    color_name_fa VARCHAR(120),
    color_hex VARCHAR(16) NOT NULL DEFAULT '#d8dee9',
    accent_hex VARCHAR(16) NOT NULL DEFAULT '#d6b88a',
    edition VARCHAR(120),
    price_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
    price_delta_toman INTEGER NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS product_category (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    selected_color JSONB,
    selected_edition VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_percent DOUBLE PRECISION NOT NULL,
    max_discount_amount DOUBLE PRECISION,
    min_order_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processing',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'paid',
    payment_reference VARCHAR(80),
    subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    shipping_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    total DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_toman INTEGER NOT NULL DEFAULT 0,
    promo_code VARCHAR(64),
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(32),
    shipping_address TEXT NOT NULL,
    postal_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_name_fa VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    color_name VARCHAR(120),
    color_name_fa VARCHAR(120),
    edition VARCHAR(120),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    unit_price_toman INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_idempotency_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    cart_hash VARCHAR(64) NOT NULL,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_order_idempotency_user_key UNIQUE (user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id SERIAL PRIMARY KEY,
    attempt_number VARCHAR(48) NOT NULL,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(128) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    amount_toman INTEGER NOT NULL,
    currency_unit VARCHAR(16) NOT NULL DEFAULT 'toman',
    active_order_key INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    settled_order_key INTEGER REFERENCES orders(id) ON DELETE RESTRICT,
    provider_authority VARCHAR(128),
    provider_transaction_id VARCHAR(128),
    sandbox_nonce VARCHAR(64),
    failure_code VARCHAR(64),
    failure_reason VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_attempts_attempt_number UNIQUE (attempt_number),
    CONSTRAINT uq_payment_attempts_user_idempotency UNIQUE (user_id, idempotency_key),
    CONSTRAINT uq_payment_attempts_active_order_key UNIQUE (active_order_key),
    CONSTRAINT uq_payment_attempts_settled_order_key UNIQUE (settled_order_key),
    CONSTRAINT uq_payment_attempts_provider_txn UNIQUE (provider, provider_transaction_id),
    CONSTRAINT ck_payment_attempts_amount_nonneg CHECK (amount_toman >= 0),
    CONSTRAINT ck_payment_attempts_currency_unit CHECK (currency_unit = 'toman'),
    CONSTRAINT ck_payment_attempts_status_valid CHECK (
        status IN (
            'initiated',
            'pending',
            'succeeded',
            'failed',
            'expired',
            'cancelled',
            'reconciliation_required'
        )
    ),
    CONSTRAINT ck_payment_attempts_key_consistency CHECK (
        (status IN ('initiated', 'pending') AND active_order_key = order_id AND settled_order_key IS NULL)
        OR (status = 'succeeded' AND active_order_key IS NULL AND settled_order_key = order_id)
        OR (status IN ('failed', 'expired', 'cancelled', 'reconciliation_required') AND active_order_key IS NULL AND settled_order_key IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id SERIAL PRIMARY KEY,
    payment_attempt_id INTEGER NOT NULL REFERENCES payment_attempts(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inventory_reservations_attempt_product UNIQUE (payment_attempt_id, product_id),
    CONSTRAINT ck_inventory_reservations_qty_positive CHECK (quantity >= 1),
    CONSTRAINT ck_inventory_reservations_status CHECK (
        status IN ('active', 'consumed', 'released', 'expired')
    )
);

CREATE TABLE IF NOT EXISTS discount_reservations (
    id SERIAL PRIMARY KEY,
    payment_attempt_id INTEGER NOT NULL REFERENCES payment_attempts(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_id INTEGER NOT NULL REFERENCES discounts(id) ON DELETE RESTRICT,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    active_order_key INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    settled_order_key INTEGER REFERENCES orders(id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_discount_reservations_attempt UNIQUE (payment_attempt_id),
    CONSTRAINT uq_discount_reservations_attempt_discount UNIQUE (payment_attempt_id, discount_id),
    CONSTRAINT uq_discount_reservations_active_order UNIQUE (active_order_key),
    CONSTRAINT uq_discount_reservations_settled_order UNIQUE (settled_order_key),
    CONSTRAINT ck_discount_reservations_status CHECK (
        status IN ('active', 'consumed', 'released', 'expired')
    ),
    CONSTRAINT ck_discount_reservations_keys CHECK (
        (status = 'active' AND active_order_key = order_id AND settled_order_key IS NULL)
        OR (status = 'consumed' AND active_order_key IS NULL AND settled_order_key = order_id)
        OR (status IN ('released', 'expired') AND active_order_key IS NULL AND settled_order_key IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS discount_usages (
    id SERIAL PRIMARY KEY,
    discount_id INTEGER NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    session_id VARCHAR(80),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating_avg DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_idempotency_user ON order_idempotency_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_expires ON payment_attempts(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_created ON payment_attempts(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_attempt ON inventory_reservations(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_active ON inventory_reservations(product_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_discount_reservations_attempt ON discount_reservations(payment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_discount_reservations_order ON discount_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_reservations_discount_active ON discount_reservations(discount_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
