-- AtlasOps Demo Seed Data
-- Loaded once on first boot by the seed-data service (docker-compose.demo.yml).
-- Idempotent: safe to re-run on every container start.
--
-- Seeds:
--   1. Realistic demo orders + line items (referencing order-service V2 customers/products)
--   2. Demo runbook/FAQ documents into the vector store (document_chunks) so RAG
--      answers are grounded for the demo scenario queries.
--
-- Requires order-service Flyway migrations (V1-V6) to have run first.

-- ─── Demo Orders ──────────────────────────────────────────────────────────
INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1001', id, 'ON_HOLD', 'STOCK_HOLD', 6803.97, 503.98,
       'Held: SRV-RACK-42U below committed stock. Restock expected next week.',
       NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
FROM customers WHERE customer_number = 'CUST-0001'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1002', id, 'SHIPPED', NULL, 7235.87, 535.99,
       'In transit via carrier. Customer reported perceived delay.',
       NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 hours'
FROM customers WHERE customer_number = 'CUST-0002'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1003', id, 'DELIVERED', NULL, 1619.46, 119.96,
       'Delivered. Customer confirmed receipt.',
       NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'
FROM customers WHERE customer_number = 'CUST-0003'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1004', id, 'PROCESSING', NULL, 9611.98, 712.00,
       'Being prepared for shipment at WH-NORTH-A12.',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 hours'
FROM customers WHERE customer_number = 'CUST-0001'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1005', id, 'PENDING', 'PAYMENT_PENDING', 9720.00, 720.00,
       'Awaiting payment confirmation from finance gateway.',
       NOW() - INTERVAL '1 day', NOW()
FROM customers WHERE customer_number = 'CUST-0002'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, customer_id, status, status_reason, total_amount, tax_amount, notes, created_at, updated_at)
SELECT 'ORD-1006', id, 'CANCELLED', 'PAYMENT_FAILED', 377.99, 28.00,
       'Cancelled after 3 failed payment attempts.',
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'
FROM customers WHERE customer_number = 'CUST-0003'
ON CONFLICT (order_number) DO NOTHING;

-- ─── Demo Order Line Items ────────────────────────────────────────────────
INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 2499.99, 4999.98
FROM orders o, products p
WHERE o.order_number = 'ORD-1001' AND p.sku = 'SRV-RACK-42U'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 1299.99, 1299.99
FROM orders o, products p
WHERE o.order_number = 'ORD-1001' AND p.sku = 'NET-SW-48G'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 10, 599.99, 5999.90
FROM orders o, products p
WHERE o.order_number = 'ORD-1002' AND p.sku = 'CLD-STO-1TB'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 349.99, 699.98
FROM orders o, products p
WHERE o.order_number = 'ORD-1002' AND p.sku = 'SSL-WILD-1Y'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 50, 29.99, 1499.50
FROM orders o, products p
WHERE o.order_number = 'ORD-1003' AND p.sku = 'FIB-LC10'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 3899.99, 3899.99
FROM orders o, products p
WHERE o.order_number = 'ORD-1004' AND p.sku = 'FW-APPL-1U'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 4999.99, 4999.99
FROM orders o, products p
WHERE o.order_number = 'ORD-1004' AND p.sku = 'DB-LIC-STD'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 2, 4500.00, 9000.00
FROM orders o, products p
WHERE o.order_number = 'ORD-1005' AND p.sku = 'CONS-10HR'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

INSERT INTO order_line_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, 349.99, 349.99
FROM orders o, products p
WHERE o.order_number = 'ORD-1006' AND p.sku = 'SSL-WILD-1Y'
  AND NOT EXISTS (SELECT 1 FROM order_line_items li WHERE li.order_id = o.id AND li.product_id = p.id);

-- ─── Demo Knowledge Base Documents (vector store) ──────────────────────────
-- Guarded per-document so re-running the seed never duplicates chunks.

INSERT INTO document_chunks (document_name, chunk_text, metadata)
SELECT 'demo-delivery-delay-runbook.md',
       'DELAYED ORDER DIAGNOSIS: To diagnose a delayed order: 1) Call getOrderDetails and check the status and status_reason fields. 2) If the order is ON_HOLD with status_reason STOCK_HOLD, call checkStockBySku for the held SKUs to identify the out-of-stock item and its restock date. 3) If the order is PENDING with status_reason PAYMENT_PENDING, check the billing invoice status for a payment hold. 4) If the order is SHIPPED, it is in logistics transit — confirm with the carrier rather than claiming a stock or payment problem. Always cite the exact subsystem that caused the delay and give the customer a concrete next step.',
       '{"category": "runbook", "topic": "demo-delay", "source": "demo"}'
WHERE NOT EXISTS (SELECT 1 FROM document_chunks WHERE document_name = 'demo-delivery-delay-runbook.md');

INSERT INTO document_chunks (document_name, chunk_text, metadata)
SELECT 'demo-order-hold-faq.md',
       'WHY IS MY ORDER ON HOLD? An order is placed ON_HOLD when it needs manual intervention. The status_reason field identifies the owner: STOCK_HOLD means insufficient inventory — check the restock date and notify the customer; PAYMENT_PENDING or PAYMENT_FAILED means a billing issue — route to the finance team to retry the payment; FRAUD_CHECK means a security review is in progress. Escalate to the operations lead if an ON_HOLD order has not moved within 24 hours.',
       '{"category": "faq", "topic": "demo-hold", "source": "demo"}'
WHERE NOT EXISTS (SELECT 1 FROM document_chunks WHERE document_name = 'demo-order-hold-faq.md');

INSERT INTO document_chunks (document_name, chunk_text, metadata)
SELECT 'demo-stock-shortage-faq.md',
       'WHAT IF AN ITEM IS OUT OF STOCK? When available stock for a SKU is zero, check the restock_date in the stock snapshot. If restock is within 5 business days, keep the order and share the ETA with the customer. If restock is further out or unknown, offer an alternative product from the same category or a partial shipment, and flag the order for the procurement team.',
       '{"category": "faq", "topic": "demo-stock", "source": "demo"}'
WHERE NOT EXISTS (SELECT 1 FROM document_chunks WHERE document_name = 'demo-stock-shortage-faq.md');
