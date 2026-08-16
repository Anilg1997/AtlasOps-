-- Order Service Flyway Migration V6
-- Adds a status_reason column so ON_HOLD / PENDING orders can carry a
-- diagnostic reason (STOCK_HOLD, PAYMENT_PENDING, FRAUD_CHECK, ...).
-- Referenced by the AI Co-Pilot OrderTool and the seeded runbooks/FAQs.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_reason VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_status_reason ON orders(status_reason);
