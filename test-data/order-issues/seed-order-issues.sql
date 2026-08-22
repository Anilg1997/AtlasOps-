-- ═══════════════════════════════════════════════════════════════
-- ShopHub — Order Issue Test Data
-- Seeds orders in various problematic states for Phase 3 demo
-- Run AFTER the main postgres-init.sql
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- TEST USERS (various roles for demo scenarios)
-- ═══════════════════════════════════════════════════════════════

-- Repeat buyer with order history
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('michaels', 'michael.scott@shophub.com', '$2a$10$dummyHashForMichael123', 'Michael', 'Scott', 'USER')
ON CONFLICT (username) DO NOTHING;

-- User with a pending issue
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('sarahc', 'sarah.connor@shophub.com', '$2a$10$dummyHashForSarah12345', 'Sarah', 'Connor', 'USER')
ON CONFLICT (username) DO NOTHING;

-- Power user with many orders
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('jamesw', 'james.wilson@shophub.com', '$2a$10$dummyHashForJames12345', 'James', 'Wilson', 'USER')
ON CONFLICT (username) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- DEMO ORDERS IN VARIOUS STATES
-- ═══════════════════════════════════════════════════════════════

-- Scenario 1: Payment Failed order (agent should auto-retry)
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260820-PAYFAIL', id, 'PENDING', 149.99, 12.00, 161.99,
    'credit_card', 'FAILED', 'Payment declined by bank — needs retry',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'sarahc'
ON CONFLICT (order_number) DO NOTHING;

-- Scenario 2: Out-of-Stock item post-order
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260819-OUTSTK', id, 'CONFIRMED', 899.00, 71.92, 970.92,
    'credit_card', 'PAID', 'Item went out of stock after order placed',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
FROM users WHERE username = 'michaels'
ON CONFLICT (order_number) DO NOTHING;

-- Scenario 3: Delivery Delayed (shipped 10+ days ago, not delivered)
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260810-DELAYD', id, 'SHIPPED', 259.99, 20.80, 280.79,
    'paypal', 'PAID', 'Shipped via USPS — estimated 7 days, now 12+',
    NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'jamesw'
ON CONFLICT (order_number) DO NOTHING;

-- Scenario 4: Duplicate order (same user, same items, within 5 min)
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260822-DUP01', id, 'PENDING', 49.99, 4.00, 53.99,
    'credit_card', 'PENDING', 'Possible duplicate — customer may have double-clicked',
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
FROM users WHERE username = 'sarahc'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260822-DUP02', id, 'PENDING', 49.99, 4.00, 53.99,
    'credit_card', 'PENDING', 'Duplicate order from same user within 5 minutes',
    NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'
FROM users WHERE username = 'sarahc'
ON CONFLICT (order_number) DO NOTHING;

-- Scenario 5: Price Mismatch (ordered at old price, current price is different)
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260818-PRCERR', id, 'PROCESSING', 199.99, 16.00, 215.99,
    'credit_card', 'PAID', 'Price may have changed since order placement',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'
FROM users WHERE username = 'jamesw'
ON CONFLICT (order_number) DO NOTHING;

-- Scenario 6: Healthy delivered order (control — no issues expected)
INSERT INTO orders (order_number, user_id, status, subtotal, tax_amount, total_amount,
    payment_method, payment_status, notes, created_at, updated_at)
SELECT 'ORD-20260815-HEALTH', id, 'DELIVERED', 79.99, 6.40, 86.39,
    'credit_card', 'PAID', 'Delivered on time — no issues',
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'
FROM users WHERE username = 'michaels'
ON CONFLICT (order_number) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- ORDER ITEMS (link products to the test orders)
-- ═══════════════════════════════════════════════════════════════

-- Payment failed order — 1 item
INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price, p.price
FROM orders o, products p
WHERE o.order_number = 'ORD-20260820-PAYFAIL' AND p.title LIKE '%iPhone%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Out of stock order — 1 laptop
INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price, p.price
FROM orders o, products p
WHERE o.order_number = 'ORD-20260819-OUTSTK' AND p.title LIKE '%MacBook%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Delayed delivery order — 1 item
INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price, p.price
FROM orders o, products p
WHERE o.order_number = 'ORD-20260810-DELAYD' AND p.category = 'smartphones'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Duplicate order — 1 item each
INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price, p.price
FROM orders o, products p
WHERE o.order_number = 'ORD-20260822-DUP01' AND p.title LIKE '%sunglasses%'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price, p.price
FROM orders o, products p
WHERE o.order_number = 'ORD-20260822-DUP02' AND p.title LIKE '%sunglasses%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Price mismatch order
INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, quantity, unit_price, subtotal)
SELECT o.id, p.id, p.title, p.thumbnail, 1, p.price * 0.85, p.price * 0.85
FROM orders o, products p
WHERE o.order_number = 'ORD-20260818-PRCERR' AND p.category = 'laptops'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SEED ORDER ISSUES (pre-populate agent resolution timeline)
-- ═══════════════════════════════════════════════════════════════

-- Payment failed — agent detected, retried, resolved
INSERT INTO order_issues (order_number, user_id, issue_type, status,
    detection_details, resolution_action, resolution_result,
    resolved_automatically, created_at, resolved_at)
SELECT 'ORD-20260820-PAYFAIL', id,
    'PAYMENT_FAILED', 'RESOLVED',
    'Payment declined by issuing bank — card ending in 4242',
    'Automatically retried payment via billing service',
    'Payment retry succeeded on attempt 1',
    true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 seconds'
FROM users WHERE username = 'sarahc'
ON CONFLICT DO NOTHING;

-- Out of stock — agent detected, found alternatives, awaiting user confirmation
INSERT INTO order_issues (order_number, user_id, issue_type, status,
    detection_details, resolution_action,
    resolved_automatically, created_at)
SELECT 'ORD-20260819-OUTSTK', id,
    'OUT_OF_STOCK', 'RESOLVING',
    'MacBook Pro went out of stock after order placement',
    'Found 2 similar in-stock alternatives via vector similarity search',
    false, NOW() - INTERVAL '3 days'
FROM users WHERE username = 'michaels'
ON CONFLICT DO NOTHING;

-- Delivery delayed — agent detected, discount code offered, resolved
INSERT INTO order_issues (order_number, user_id, issue_type, status,
    detection_details, resolution_action, resolution_result,
    resolved_automatically, created_at, resolved_at)
SELECT 'ORD-20260810-DELAYD', id,
    'DELIVERY_DELAYED', 'RESOLVED',
    'Order shipped 12 days ago, expected delivery was 7 days',
    'Generated 15% discount code DELAY-DELAYD and sent notification',
    'Discount code DELAY-DELAYD sent. Revised ETA: ' || (NOW() + INTERVAL '2 days')::date,
    true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '5 seconds'
FROM users WHERE username = 'jamesw'
ON CONFLICT DO NOTHING;

-- Price mismatch — detected, escalated to human
INSERT INTO order_issues (order_number, user_id, issue_type, status,
    detection_details, resolution_action, escalation_reason,
    resolved_automatically, escalated_to_human, created_at)
SELECT 'ORD-20260818-PRCERR', id,
    'PRICE_MISMATCH', 'ESCALATED',
    'Order placed at $169.99, current catalog price is $199.99 (15% increase)',
    'Cannot automatically resolve price discrepancies — requires human review',
    'Price changed 15% between order placement and processing. Customer may dispute.',
    false, true, NOW() - INTERVAL '1 day'
FROM users WHERE username = 'jamesw'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Show all test orders
SELECT o.order_number, o.status, o.payment_status, u.username, o.total_amount, o.created_at::date
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.order_number LIKE 'ORD-2026%1' OR o.order_number LIKE 'ORD-2026%0'
ORDER BY o.created_at DESC;

-- Show all agent issue resolutions
SELECT order_number, issue_type, status, resolved_automatically, escalated_to_human,
       LEFT(detection_details, 60) as detection
FROM order_issues
WHERE order_number LIKE 'ORD-2026%'
ORDER BY created_at DESC;
