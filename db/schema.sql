-- thaPill Postgres schema
-- Safe to re-run; guarded by IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by INTEGER REFERENCES users(id),
    points_balance INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'starter',
    email_verified INTEGER DEFAULT 0,
    country TEXT,
    city TEXT,
    region TEXT,
    ip_address TEXT,
    user_agent TEXT,
    signup_source TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Safe migrations for pre-existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    label TEXT DEFAULT 'home',
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    county TEXT,
    postcode TEXT NOT NULL,
    country TEXT DEFAULT 'GB',
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_pence INTEGER NOT NULL,
    compare_at_pence INTEGER,
    type TEXT NOT NULL,
    subscription_interval_days INTEGER,
    stock INTEGER DEFAULT 1000,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id TEXT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Postgres partial unique indexes (SQLite's combined UNIQUE wouldn't work across NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_user_product ON cart_items (user_id, product_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_session_product ON cart_items (session_id, product_id) WHERE session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    address_id INTEGER REFERENCES addresses(id),
    status TEXT DEFAULT 'pending',
    subtotal_pence INTEGER NOT NULL,
    discount_pence INTEGER DEFAULT 0,
    shipping_pence INTEGER DEFAULT 0,
    total_pence INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    stripe_payment_intent TEXT,
    stripe_session_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price_pence INTEGER NOT NULL,
    total_pence INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    carrier TEXT DEFAULT 'royal-mail',
    tracking_number TEXT,
    tracking_url TEXT,
    status TEXT DEFAULT 'label-created',
    estimated_delivery DATE,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    status_history TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS points_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    reference_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id),
    referred_id INTEGER NOT NULL REFERENCES users(id),
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'signed-up',
    reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    data TEXT,
    country TEXT,
    city TEXT,
    region TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Shipping rules per country. Row with country='DEFAULT' is the fallback.
CREATE TABLE IF NOT EXISTS shipping_rules (
    id SERIAL PRIMARY KEY,
    country TEXT NOT NULL UNIQUE,
    country_name TEXT,
    price_pence INTEGER NOT NULL DEFAULT 0,
    blocked INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shipping_country ON shipping_rules(country);

-- Per-country product price overrides. When a row exists for
-- (product_id, country), the site shows that fixed price in the given
-- currency instead of converting from the base GBP price.
-- country='DEFAULT' is a fallback when no country-specific row matches.
CREATE TABLE IF NOT EXISTS product_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, country)
);
CREATE INDEX IF NOT EXISTS idx_product_prices_country ON product_prices(product_id, country);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
