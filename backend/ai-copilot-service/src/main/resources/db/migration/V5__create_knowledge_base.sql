-- IntelliOps - AI Co-Pilot Knowledge Base
-- Flyway migration V3: Runbooks, FAQs, and stock snapshot tables for RAG

-- ─── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Runbooks Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS runbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    tags TEXT[],
    source VARCHAR(100) DEFAULT 'internal',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_runbooks_category ON runbooks(category);
CREATE INDEX idx_runbooks_tags ON runbooks USING GIN(tags);

-- ─── FAQs Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_tags ON faqs USING GIN(tags);

-- ─── Stock Snapshot Table ──────────────────────────────────────────────────
-- Mirrors inventory data for fast AI agent queries without gRPC calls
CREATE TABLE IF NOT EXISTS stock_snapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    available_qty INTEGER NOT NULL DEFAULT 0,
    reserved_qty INTEGER NOT NULL DEFAULT 0,
    warehouse VARCHAR(100),
    restock_date DATE,
    status VARCHAR(50) DEFAULT 'IN_STOCK',
    reorder_threshold INTEGER DEFAULT 10,
    last_synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_snapshot_sku ON stock_snapshot(sku);
CREATE INDEX idx_stock_snapshot_status ON stock_snapshot(status);

-- ─── Seed Data: Runbooks ───────────────────────────────────────────────────
INSERT INTO runbooks (title, category, content, tags) VALUES
('Order Status Resolution', 'Orders',
 'This runbook covers common order statuses and their resolution steps:\n\n'
 '1. PENDING: Order created but not yet confirmed. Check payment verification. If payment pending > 24h, contact finance.\n'
 '2. ON_HOLD: Order is on hold. Common reasons: STOCK_HOLD (insufficient inventory), PAYMENT_FAILED (card declined), '
 'FRAUD_CHECK (flagged for manual review). Check status_reason field for details.\n'
 '3. CONFIRMED: Order confirmed and sent to fulfillment. No action needed unless customer requests changes.\n'
 '4. SHIPPED: Order dispatched. Share tracking info with customer if available.\n'
 '5. CANCELLED: Order cancelled. Verify refund was processed if payment was already collected.\n\n'
 'For ON_HOLD with STOCK_HOLD reason: Check inventory for estimated restock date. Notify customer of delay.',
 ARRAY['order', 'status', 'troubleshooting', 'on_hold']),

('Stock Hold Resolution', 'Orders',
 'When an order is placed on STOCK_HOLD due to insufficient inventory:\n\n'
 '1. Use the getOrderDetails tool to confirm the order is ON_HOLD with status_reason = STOCK_HOLD\n'
 '2. Check which SKU(s) triggered the hold by examining the hold reason details\n'
 '3. Use checkStockBySku to verify current stock levels and estimated restock date\n'
 '4. If restock date is within 5 business days: Notify customer of delay with ETA\n'
 '5. If restock date is unknown or > 5 business days: Offer customer alternative products '
 'or partial shipment options\n'
 '6. For urgent orders: Route to escalation team for manual procurement',
 ARRAY['stock', 'hold', 'resolution', 'inventory']),

('Payment Failure Handling', 'Orders',
 'When a payment fails for an order:\n\n'
 '1. Check the status_reason field for details: PAYMENT_FAILED, CARD_DECLINED, INSUFFICIENT_FUNDS\n'
 '2. Verify customer email from order details\n'
 '3. Send automated payment reminder via notification system\n'
 '4. After 3 failed attempts, the order is automatically moved to CANCELLED\n'
 '5. For high-value orders (>₹10,000): Notify account manager for manual follow-up\n\n'
 'NOTE: The AI co-pilot cannot process payments. Direct users to the billing team for payment issues.',
 ARRAY['payment', 'failure', 'billing', 'resolution']),

('Inventory Low Stock Alert', 'Inventory',
 'When a product goes below reorder threshold (LOW_STOCK status):\n\n'
 '1. Check if there is an active restock order for this SKU\n'
 '2. Verify the restock_date from the stock system\n'
 '3. If restock_date is more than 14 days out: Consider emergency order from secondary supplier\n'
 '4. For critical items (marked with priority flag): Route to procurement team immediately\n'
 '5. Update the customer-facing ETA in the product catalog if the delay affects orders',
 ARRAY['inventory', 'stock', 'low_stock', 'restock']),

('Customer Escalation Process', 'General',
 'Escalation process for support engineers:\n\n'
 'Level 1 (AI Co-Pilot): Handle common queries about order status, stock levels, basic troubleshooting\n'
 'Level 2 (Support Engineer): Handle order modifications, payment retry requests, customer communication\n'
 'Level 3 (Senior Support): Handle billing disputes, SLA breaches, account-level issues\n'
 'Level 4 (Management): Handle legal/compliance issues, executive escalations\n\n'
 'When to escalate: If the AI Co-Pilot cannot resolve the issue with available tools, '
 'or if the customer explicitly requests human support.',
 ARRAY['escalation', 'support', 'process', 'general']);

-- ─── Seed Data: FAQs ───────────────────────────────────────────────────────
INSERT INTO faqs (question, answer, category, tags) VALUES
('How do I check why an order is on hold?',
 'Use the "getOrderDetails" tool with the order number. Look for the status and status_reason fields. '
 'Common reasons: STOCK_HOLD (inventory issue), PAYMENT_FAILED (billing issue), FRAUD_CHECK (security review).',
 'Orders', ARRAY['order', 'hold', 'status']),

('What is the difference between PENDING and ON_HOLD status?',
 'PENDING means the order has been created but is awaiting confirmation (usually payment verification). '
 'ON_HOLD means the order requires manual intervention due to an issue like insufficient stock, '
 'payment failure, or a fraud check flag. Both statuses prevent the order from being fulfilled.',
 'Orders', ARRAY['order', 'status', 'pending', 'hold']),

('Can I modify an order after it has been placed?',
 'Order modifications are limited once the order is created. The AI co-pilot cannot modify orders directly. '
 'Contact support engineer for: quantity changes, address updates, product substitutions. '
 'Cancellations can be processed if the order is still in PENDING status.',
 'Orders', ARRAY['order', 'modifications', 'changes']),

('How do I find the restock date for a product?',
 'Use the "checkStockBySku" tool with the product SKU. The response will include the estimated restock date '
 'if one is available. If no restock date is set, the procurement team is working on it — '
 'contact them for an update.',
 'Inventory', ARRAY['stock', 'restock', 'inventory']),

('What should I tell a customer when their order is delayed due to stock?',
 'Apologize for the delay and provide transparency: share the estimated restock date (if available), '
 'offer alternatives from the same category, and assure them they will be notified when the order ships. '
 'If the delay exceeds 5 business days, offer cancellation or partial shipment options.',
 'Orders', ARRAY['customer', 'delay', 'stock', 'communication']),

('How does the AI co-pilot handle conversation context?',
 'The AI co-pilot maintains conversation history within a session (identified by sessionId). '
 'It remembers previous questions and answers within the same session. Each session can hold up to 20 messages. '
 'Sessions can be cleared using the clear session endpoint.',
 'General', ARRAY['ai', 'context', 'session', 'memory']);

-- ─── Seed Data: Stock Snapshot ─────────────────────────────────────────────
INSERT INTO stock_snapshot (sku, available_qty, reserved_qty, warehouse, status, reorder_threshold)
VALUES
    ('SRV-RACK-42U', 22, 3, 'WH-NORTH-A12', 'IN_STOCK', 5),
    ('CLD-STO-1TB', 90, 10, 'WH-DIGITAL', 'IN_STOCK', 20),
    ('NET-SW-48G', 45, 5, 'WH-NORTH-B07', 'IN_STOCK', 10),
    ('SSL-WILD-1Y', 185, 15, 'WH-DIGITAL', 'IN_STOCK', 30),
    ('DB-LIC-STD', 28, 2, 'WH-DIGITAL', 'IN_STOCK', 5),
    ('FIB-LC10', 480, 20, 'WH-SOUTH-C03', 'IN_STOCK', 100),
    ('FW-APPL-1U', 14, 1, 'WH-NORTH-A12', 'IN_STOCK', 3),
    ('CONS-10HR', 989, 10, 'WH-DIGITAL', 'IN_STOCK', 50)
ON CONFLICT (sku) DO NOTHING;
