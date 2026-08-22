# ShopHub — System Design Interview Talking Points

A direct-answer cheat sheet for system-design interview questions, tied to this codebase.

---

## 1. Scaling the Product Catalog

**Question**: How would you handle 10M+ products with high read traffic?

**Answer**: Product catalog is **read-heavy and cacheable** — perfect for a caching layer.

```
Client → API Gateway → Redis Cache → Product Service → PostgreSQL
                     (miss)         (hit: <1ms)
```

**Implementation**:
- Add **Redis** (or ElastiCache) in front of `product-service`
- Cache hot product lookups (top 10K products by views) with 5-min TTL
- Cache category lists with 30-min TTL
- **Cache invalidation** via Kafka: subscribe `product-service` to `product.sync` events → on product update, invalidate the cache key for that product
- **Write-through**: When a product is updated, write to DB first, then invalidate cache (not update cache — avoids race conditions)

**Why not cache everything?** Product descriptions + images are large. Cache only the "hot set" (frequently accessed products) to keep Redis memory under 2GB.

---

## 2. Idempotency in Order Creation

**Question**: How does order-service handle duplicate `create_order` calls?

**Answer**: Idempotency keys — a classic interview topic.

**Current state**: Order-service uses `order_number` as a natural unique key (`VARCHAR(20) UNIQUE`), which prevents duplicate order numbers but doesn't prevent the same user submitting the same order twice with different auto-generated numbers.

**Recommended improvement**:
```java
// Add idempotency_key column to orders table
// Client sends: Idempotency-Key: <UUID> header
// Server checks:
SELECT id FROM orders WHERE idempotency_key = ?
// If exists → return existing order (HTTP 200)
// If not → create new order (HTTP 201)
```

**Why this matters**: In distributed systems, network retries, load balancer failovers, and client bugs can cause duplicate requests. Idempotency keys ensure "exactly-once" semantics at the application layer.

---

## 3. Consistency: Kafka vs. 2PC

**Question**: Why Kafka (eventual consistency) instead of distributed transactions?

**Answer**: **Eventual consistency with Kafka** is the pragmatic choice for microservices.

**The trade-off**:
| | Distributed Transactions (2PC) | Kafka Events |
|---|---|---|
| **Consistency** | Strong (ACID across services) | Eventual (seconds to minutes) |
| **Availability** | Low (all services must be up) | High (buffer in Kafka) |
| **Performance** | Slow (locking, coordination) | Fast (fire-and-forget) |
| **Complexity** | High (XA transactions, 2PC protocol) | Medium (retry, dead-letter queues) |

**Why eventual consistency works here**:
- Order → Billing → Notification doesn't need strict ordering within milliseconds
- If billing-service is down when order is created, the Kafka event sits in the topic and gets processed when it comes back up
- The agent-service's `resolvePaymentRetry` tool handles the edge case of payment failing — this is **compensating transactions**, which are the natural pattern for eventual consistency

**Interview follow-up**: "What if the customer sees the order as confirmed but payment hasn't gone through?"
→ Show the `payment_status` field on orders: `PENDING` → `PAID`/`FAILED`. The frontend should poll payment status or use WebSocket updates.

---

## 4. Rate Limiting at API Gateway

**Question**: How do you protect expensive LLM calls?

**Answer**: Rate limiting at the API Gateway layer, with **stricter limits for AI endpoints**.

**Spring Cloud Gateway rate limiting config**:
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: agent-service
          uri: http://agent-service:8084
          predicates:
            - Path=/api/v1/agent/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 5    # 5 requests/sec
                redis-rate-limiter.burstCapacity: 10    # burst of 10
                key-resolver: "#{@userKeyResolver}"      # per-user limiting
```

**Why per-user?** One user spamming the agent shouldn't degrade service for everyone. The `userId` from the JWT token is the rate-limit key.

**Additional protection**:
- **Intent detection before LLM**: Simple regex check (`detectIntent()`) handles 60% of requests without calling Ollama
- **RAG context size limit**: Top-K products capped at 5 to keep LLM prompt under token limit
- **Timeout**: LLM timeout at 120s — if Ollama is overloaded, fail fast and fall back to rule-based responses

---

## 5. Vector Search Complexity

**Question**: What's the time complexity of pgvector's cosine similarity search?

**Answer**: Depends on the index type.

| Index | Build Time | Query Time | Memory | Recall |
|-------|-----------|------------|--------|--------|
| No index (sequential scan) | None | **O(n × d)** | 0 | 100% |
| IVFFlat (ShopHub's choice) | O(n) | **O(n/lists × d)** | Moderate | ~95% |
| HNSW | O(n × log n) | **O(log n × d)** | High | ~99% |

Where n = number of products, d = embedding dimensions (768).

**ShopHub uses IVFFlat** with 10 lists:
```sql
CREATE INDEX idx_products_embedding ON products
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
```

**Why IVFFlat over HNSW?**
- IVFFlat is simpler to build and sufficient for < 100K products
- HNSW requires more memory (stores a graph) and is overkill at this scale
- For production (> 1M products), switch to HNSW for O(log n) lookup

**Interview tip**: Mention that the IVFFlat `lists` parameter should be approximately `sqrt(n)` for optimal performance. With 194 products, `lists = 10` is reasonable.

---

## 6. Caching Strategy: LRU Cache for Agent Queries

**Question**: How would you optimize repeated agent queries?

**Answer**: LRU (Least Recently Used) cache at the embedding + retrieval layer.

```
User Query → Hash(query) → Cache Lookup
                              │
                    ┌─ HIT: Return cached response (< 50ms)
                    │
                    └─ MISS: Embed → Vector Search → LLM → Cache response
```

**LRU Cache implementation** (conceptual):
```java
@Service
public class AgentCacheService {
    private final LinkedHashMap<String, CacheEntry> cache =
        new LinkedHashMap<>(100, 0.75f, true) { // accessOrder = true
            @Override
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > 100; // max 100 entries
            }
        };

    // Cache key: SHA-256(normalized query)
    // Cache value: { embeddings, search results, agent response }
    // TTL: 5 minutes (stale product data)
}
```

**What to cache**:
1. **Query embeddings** — calling Ollama for embeddings is ~200ms; caching saves this
2. **Search results** — the same query "best laptop under $1000" will return the same products
3. **Full agent response** — for identical questions, skip LLM entirely

**Eviction strategy**: LRU with max 100 entries (covers the most common queries). Time-based expiry at 5 minutes ensures product data doesn't go stale.

**DSA angle**: This is a direct application of the **LRU cache data structure** — a HashMap + Doubly Linked List providing O(1) get/put. Mention this in interviews to show DSA knowledge tied to a real project.

---

## 7. Additional Talking Points

### Event-Driven Architecture
- **Kafka consumer groups**: Each service is in its own group → independent scaling
- **Dead letter queues**: Failed event processing goes to DLQ → manual retry
- **Event schema evolution**: Use Avro/JSON Schema for forward/backward compatibility

### AI Agent as a Differentiator
- **Not just RAG chat**: The agent takes **autonomous corrective action** (payment retry, stock substitution)
- **Honest escalation**: The agent doesn't pretend to fix everything — `escalate_to_human` is a first-class tool
- **Audit trail**: Every agent action is logged in `order_issues` table — explainable AI

### Production Considerations
- **GPU for Ollama**: Demo runs on CPU; production needs GPU instances for < 1s LLM inference
- **Vector DB**: pgvector is great for < 1M vectors; for 10M+ consider Pinecone/Weaviate
- **Service mesh**: Istio/Linkerd for mTLS, circuit breaking, and observability in production
- **Feature flags**: Launch AI agent to beta users first, then expand

### DSA-Adjacent Topics in This Codebase
- **Cosine similarity**: Linear algebra + vector operations
- **LRU cache**: HashMap + Doubly Linked List
- **BFS/DFS**: Order dependency graph (order → billing → notification)
- **Binary search**: Finding similar products by price range
- **Graph traversal**: Order status state machine (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
