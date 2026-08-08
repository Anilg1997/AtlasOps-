-- AI Co-Pilot RAG Schema (Flyway V4 — shared intellops_order database)

CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_name
    ON document_chunks(document_name);

-- Seed enterprise runbooks and FAQs
INSERT INTO document_chunks (document_name, chunk_text, metadata) VALUES
('order-troubleshooting.md', 'ORDER STATUS CODES: PENDING = Order received, awaiting confirmation. CONFIRMED = Order confirmed, payment verified. PROCESSING = Order is being prepared. SHIPPED = Order shipped to customer. DELIVERED = Order delivered successfully. CANCELLED = Order was cancelled.', '{"category": "runbook", "topic": "order-status"}'),
('order-troubleshooting.md', 'COMMON ORDER ISSUES: 1) Stock Hold - Order held due to insufficient inventory. Resolution: Check inventory levels and trigger restock if needed. 2) Payment Pending - Awaiting payment confirmation. Resolution: Verify payment gateway status. 3) Shipping Delay - Logistics delay. Resolution: Check carrier tracking.', '{"category": "runbook", "topic": "order-issues"}'),
('inventory-management.md', 'INVENTORY MANAGEMENT: Stock levels are tracked in real-time. Reorder threshold alerts trigger when stock falls below minimum levels. Reservations are held for 30 minutes before auto-release. Check gRPC service for real-time stock queries.', '{"category": "runbook", "topic": "inventory"}'),
('billing-procedures.md', 'BILLING PROCEDURES: Invoices are generated automatically on order confirmation. Payment status: PENDING, PAID, OVERDUE, CANCELLED. Overdue invoices are flagged after 30 days. Legacy Oracle billing system syncs via Kafka events.', '{"category": "runbook", "topic": "billing"}'),
('escalation-procedures.md', 'ESCALATION: Orders stuck > 24 hours: Escalate to operations lead. Payment disputes: Route to finance team. Inventory discrepancies: Check with warehouse manager. System outages: Contact DevOps on-call.', '{"category": "faq", "topic": "escalation"}');
