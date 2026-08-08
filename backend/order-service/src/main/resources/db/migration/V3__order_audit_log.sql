-- Order Service Flyway Migration V3
-- Audit log table for tracking order changes

CREATE TABLE IF NOT EXISTS order_audit_log (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_order_id ON order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_created ON order_audit_log(created_at);
