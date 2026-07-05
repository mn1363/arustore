-- Core Tables
users, addresses
categories (self-referential for multi-level)
brands
products, product_images, product_variants, product_category
cart_items
orders, order_items, order_status_history
reviews, review_images
wishlist_items
discounts, discount_usage
analytics_events, analytics_sessions
search_history, product_views

-- Indexes
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_rating ON products(rating_avg DESC);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);