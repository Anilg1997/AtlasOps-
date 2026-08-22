# ShopHub — Low-Level Design (LLD)

## 1. RAG Product-Search Flow

### Overview
When a user sends a message to the AI agent, the system uses Retrieval-Augmented Generation (RAG) to find relevant products via vector similarity search, then passes the context to the LLM for a natural-language response.

### Flow Diagram

```
User: "I want a laptop under $1000"
    │
    ▼
┌─────────────────────────┐
│  1. Intent Detection     │  Regex pattern matching
│  Intent: SEARCH          │  → AgentIntent.SEARCH
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. Embedding Generation │  POST http://ollama:11434/api/embeddings
│  Model: nomic-embed-text │  Input: "I want a laptop under $1000"
│  Output: float[768]      │  → [0.12, -0.34, 0.56, ...]
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. Vector Search (RAG)  │  SQL: SELECT * FROM products
│  pgvector cosine sim     │    WHERE embedding IS NOT NULL
│  Top-K = 5               │    ORDER BY embedding <=> $query::vector
│  Min score = 0.7         │    LIMIT 5
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. Context Assembly     │  "=== RELEVANT PRODUCTS ==="
│  Build RAG context string│  "- MacBook Pro (laptops) - $1299"
│  + Store stats           │  "- Dell XPS (laptops) - $899"
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. LLM Generation       │  System prompt + RAG context
│  Ollama llama3.2         │  + Chat history (last 10 messages)
│  Temperature: 0.7        │  → Natural language response
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. Stream Response      │  WebSocket → Frontend
│  Token-by-token          │  Real-time streaming UI
│  + Tool call extraction  │  (search_products, add_to_cart)
└─────────────────────────┘
```

### Cosine Similarity Math

The pgvector `<=>` operator computes cosine distance. To convert to similarity:

```sql
-- Cosine distance: how different are two vectors (0 = identical, 2 = opposite)
distance = embedding <=> query_vector

-- Cosine similarity: how similar are two vectors (1 = identical, -1 = opposite)
similarity = 1 - (embedding <=> query_vector)

-- Example query:
SELECT
    id, title, category, price, rating,
    1 - (embedding <=> '[0.12, -0.34, 0.56, ...]'::vector) AS similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.12, -0.34, 0.56, ...]'::vector
LIMIT 5;
```

**Time complexity**:
- Without index: O(n × d) where n = number of products, d = embedding dimensions (768)
- With IVFFlat index: O(n/lists × d) — approximately 10x faster
- With HNSW index: O(log n × d) — best for high-dimensional search

ShopHub uses **IVFFlat** index (`CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)`), which partitions vectors into 10 lists and only searches within the nearest lists. This is appropriate for datasets < 1M rows. For production scale, HNSW would be better (O(log n) lookup, better recall).

### Fallback: Text Search

When embeddings are not available (Ollama not started, embeddings not yet computed), the system falls back to SQL text search:

```sql
SELECT id, title, category, price, rating, stock
FROM products
WHERE LOWER(title) LIKE LOWER('%laptop%')
   OR LOWER(description) LIKE LOWER('%laptop%')
   OR LOWER(category) LIKE LOWER('%laptop%')
ORDER BY rating DESC
LIMIT 5;
```

---

## 2. Order-Issue Resolution Flow

### Overview
This is the core "agentic" capability — the AI agent autonomously detects, diagnoses, and resolves order issues without human intervention.

### Event-Driven Flow (Proactive Resolution)

```
┌──────────────────┐     Kafka: order.payment-failed
│  Order Service    │ ──────────────────────────────────────────┐
│  (payment fails)  │                                           │
└──────────────────┘                                           │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Agent Service (KafkaConsumer)                     │
│  @KafkaListener(topics = "order.payment-failed")                   │
│  onPaymentFailed(event) → handlePaymentFailure(orderId, reason)    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OrderIssueService                                 │
│  handlePaymentFailure(orderId, reason)                              │
│    │                                                                │
│    ├─ 1. Create OrderIssue record (status: RESOLVING)              │
│    │                                                                │
│    ├─ 2. Invoke IssueDetectionTool.resolvePaymentRetry(orderId)    │
│    │     │                                                          │
│    │     ├─ Simulate payment retry (70% success in demo)           │
│    │     │                                                          │
│    │     ├─ SUCCESS: Issue status → RESOLVED                       │
│    │     │             Publish "AGENT_RESOLUTION" to Kafka         │
│    │     │                                                          │
│    │     └─ FAILURE: Escalate to human support                     │
│    │                 Create escalation record                       │
│    │                 Publish "ISSUE_ESCALATED" to Kafka            │
│    │                                                                │
│    ├─ 3. Publish resolution event to agent.events topic            │
│    │                                                                │
│    └─ 4. notification-service picks up event → n8n webhook         │
│          → Email/push notification to customer                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Customer Notification                             │
│  "Your order #ORD-123 payment failed — we've automatically         │
│   retried it and it succeeded. Your order will ship tomorrow."     │
└─────────────────────────────────────────────────────────────────────┘
```

### Issue Detection Matrix

| Issue Type | Detection Method | Auto-Resolution | Escalation Path |
|-----------|-----------------|-----------------|-----------------|
| **Payment Failed** | `payment_status = 'FAILED'` in orders table | Retry payment (IssueDetectionTool) | Human support if retry fails |
| **Out of Stock** | `stock = 0` for items in order | Vector similarity search for alternatives | Customer chooses or refund |
| **Delivery Delayed** | Order in SHIPPED status > 7 days | Generate discount code, send notification | Carrier investigation |
| **Duplicate Order** | Same user, same items, within 5 min window | Flag for review (don't auto-cancel) | Human verification |
| **Price Mismatch** | `unit_price ≠ current price` for order items | Log discrepancy | Human review required |

### Agent Resolution Timeline (UI)

The frontend displays a resolution timeline for each order issue:

```
┌─────────────────────────────────────────────┐
│ 🔍 Order Issue Detected                     │
│    Payment failed for order ORD-20260820    │
│    ─────────────────────────────────────    │
│ 🔧 Agent Decision                           │
│    Retrying payment via billing service     │
│    ─────────────────────────────────────    │
│ ✅ Resolution                               │
│    Payment retry succeeded on attempt 1     │
│    Total time: 2.3 seconds                  │
└─────────────────────────────────────────────┘
```

### Database Schema: order_issues

```sql
CREATE TABLE order_issues (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    issue_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DETECTED',
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

CREATE INDEX idx_order_issues_number ON order_issues(order_number);
CREATE INDEX idx_order_issues_status ON order_issues(status);
```

### MCP Tools for Issue Resolution

These tools are registered with LangChain4j via `@Tool` annotations and can be invoked by the LLM during chat:

| Tool | Input | Output | Use Case |
|------|-------|--------|----------|
| `detect_order_issues(orderId)` | Order number | JSON issue summary | User asks "check my order" |
| `resolve_payment_retry(orderId)` | Order number | Success/failure | Payment failure detected |
| `resolve_stock_substitution(orderId, itemId)` | Order + item | Alternative products | Item out of stock |
| `resolve_delivery_delay(orderId)` | Order number | Compensation details | Delivery delayed |
| `escalate_to_human(orderId, reason)` | Order + reason | Ticket confirmation | Cannot auto-resolve |
