-- ShopHub Database Initialization
-- PostgreSQL 16 with pgvector extension

-- Enable pgvector for vector embeddings (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════════════════════════════════════════════════════════
-- AUTH SERVICE TABLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'AGENT')),
    avatar_url TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- PRODUCT SERVICE TABLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    external_id INTEGER UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    brand VARCHAR(100),
    sku VARCHAR(50),
    weight DECIMAL(8,2),
    thumbnail TEXT,
    images TEXT[],
    tags TEXT[],
    availability_status VARCHAR(20) DEFAULT 'IN_STOCK',
    shipping_info VARCHAR(200),
    warranty_info VARCHAR(200),
    return_policy VARCHAR(200),
    minimum_order_qty INTEGER DEFAULT 1,
    dimensions JSONB,
    meta JSONB,
    -- pgvector column for RAG embeddings (1536 dimensions for most models)
    embedding vector(1536),
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_embedding ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_name VARCHAR(100),
    reviewer_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- ═══════════════════════════════════════════════════════════════
-- ORDER SERVICE TABLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT,
    agent_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    product_title VARCHAR(200),
    product_thumbnail TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ═══════════════════════════════════════════════════════════════
-- AGENT SERVICE TABLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agent_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'AGENT', 'SYSTEM')),
    content TEXT NOT NULL,
    metadata JSONB,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conv ON agent_messages(conversation_id);

-- ═══════════════════════════════════════════════════════════════
-- AGENT ORDER ISSUE TRACKING (Phase 3: Agentic Automation)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_issues (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    issue_type VARCHAR(30) NOT NULL CHECK (issue_type IN (
        'PAYMENT_FAILED', 'PAYMENT_PENDING', 'OUT_OF_STOCK',
        'DELIVERY_DELAYED', 'DUPLICATE_ORDER', 'PRICE_MISMATCH'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'DETECTED' CHECK (status IN (
        'DETECTED', 'RESOLVING', 'RESOLVED', 'ESCALATED', 'FAILED'
    )),
    detection_details TEXT,
    resolution_action TEXT,
    resolution_result TEXT,
    resolved_automatically BOOLEAN DEFAULT FALSE,
    escalated_to_human BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_issues_number ON order_issues(order_number);
CREATE INDEX IF NOT EXISTS idx_order_issues_status ON order_issues(status);
CREATE INDEX IF NOT EXISTS idx_order_issues_type ON order_issues(issue_type);

-- ═══════════════════════════════════════════════════════════════
-- BILLING SERVICE TABLES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    order_id BIGINT REFERENCES orders(id),
    user_id BIGINT REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMP,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- KNOWLEDGE BASE FOR RAG
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    source_id VARCHAR(50),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX IF NOT EXISTS idx_kb_source ON knowledge_base(source);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('admin', 'admin@shophub.com', '$2a$10$dummyHashForAdminUser1234567890', 'Admin', 'User', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('emilys', 'emily.johnson@x.dummyjson.com', '$2a$10$dummyHashForEmily1234567890123', 'Emily', 'Johnson', 'USER')
ON CONFLICT (username) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shophub;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shophub;
