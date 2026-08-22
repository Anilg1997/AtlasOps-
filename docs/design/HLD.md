# ShopHub — High-Level Design (HLD)

## 1. System Overview

ShopHub is a microservices-based e-commerce platform with an AI-powered shopping agent that can autonomously detect and resolve order issues. The system consists of 7 Spring Boot services, an Angular 17 frontend, PostgreSQL with pgvector for vector search, Apache Kafka for event streaming, Ollama for local LLM inference, and n8n for workflow automation.

## 2. Why Microservices Over Monolith

| Factor | Monolith Decision | Microservices Decision (ShopHub) |
|--------|-------------------|----------------------------------|
| **Team scaling** | Single deployable | Independent service ownership |
| **Deployment** | All-or-nothing | Deploy agent-service without touching billing |
| **Technology mix** | One stack | LangChain4j (Java) + Angular (TypeScript) + n8n (no-code) |
| **Failure isolation** | Bug crashes everything | Payment failure doesn't kill product search |
| **AI agent complexity** | Tightly coupled LLM + DB logic | Agent-service isolated with its own pgvector schema |

**Key insight**: The agent-service has fundamentally different resource needs (GPU for Ollama, high memory for embeddings) compared to the stateless auth-service. Microservices let us scale the AI layer independently.

## 3. Service Decomposition & Data Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Angular 17)                     │
│  Auth │ Products │ Cart │ Wishlist │ Agent Chat │ Checkout      │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│                    API Gateway (Spring Cloud Gateway)            │
│              Port 8080 — Routes, Auth, Load Balancing           │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Auth │ │Product │ │ Order  │ │ Agent  │ │ Billing  │
│ 8081 │ │ 8082   │ │  8083  │ │  8084  │ │   8085   │
└──────┘ └────────┘ └────────┘ └────────┘ └──────────┘
   │         │          │          │            │
   ▼         ▼          ▼          ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pgvector                     │
│              Vector embeddings for RAG search               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Apache Kafka                              │
│  order.created │ order-events │ order.payment-failed │      │
│  order.delivery-delayed │ product.sync │ agent.events       │
└─────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Database Tables | Kafka Topics (Publish) | Kafka Topics (Consume) |
|---------|----------------|------------------------|------------------------|
| **auth-service** | `users`, `refresh_tokens` | — | — |
| **product-service** | `products`, `product_reviews` | `product.sync` | — |
| **order-service** | `orders`, `order_items` | `order-events`, `order.payment-failed`, `order.delivery-delayed`, `order.stock-out` | — |
| **agent-service** | `agent_conversations`, `agent_messages`, `order_issues` | `agent.events` | `order.created`, `order-events`, `order.payment-failed`, `order.delivery-delayed`, `order.stock-out`, `product.sync` |
| **billing-service** | `invoices` | `invoice.created`, `invoice.paid`, `payment.received` | `order-events` |
| **notification-service** | (MongoDB) `activity_log` | — | All topics |

### Data Ownership Rules
- **Each service owns its tables** — no cross-service direct DB access
- **Product-service** is the single source of truth for product catalog
- **Order-service** is the single source of truth for orders
- **Agent-service** maintains its own vector embeddings (derived from products/orders)

## 4. Communication Patterns

### Synchronous (REST)
- **Frontend → Gateway**: All user-facing requests
- **Gateway → Services**: Request routing with JWT validation
- **Agent-service → Product/Order-service**: Real-time lookups during chat

### Asynchronous (Kafka)
- **Order events**: order-created → agent-service (RAG context), billing-service (invoice creation)
- **Payment failures**: order.payment-failed → agent-service (autonomous resolution)
- **Product sync**: product.sync → agent-service (embedding updates)
- **Agent events**: agent.events → notification-service (n8n workflow triggers)

### Why Kafka over REST for Cross-Service Events
1. **Decoupling**: Producer doesn't know/care about consumers
2. **Replay**: Events persist — new consumers can replay history
3. **Buffering**: Agent-service can process events at its own pace (LLM calls are slow)
4. **Scalability**: Add consumers without changing producers

## 5. AI Agent Layer Integration

The AI agent layer is designed to **enhance without becoming a single point of failure**:

```
User Query → WebSocket → Agent Service → LLM (Ollama) → Response
                                    ↓
                              RAG (pgvector) → Product context
                                    ↓
                              MCP Tools → Cart, Checkout, Issue Resolution
                                    ↓
                              Kafka → Notification (proactive alerts)
```

**Failure isolation**: If Ollama is down, the agent falls back to rule-based responses. If the agent-service is down, the rest of the e-commerce platform works normally — users can still browse products, add to cart, and checkout via the Angular frontend directly.

**Cost management**: LLM calls are the most expensive operation. The agent-service implements:
- Intent detection (simple regex) before LLM invocation
- RAG context retrieval to minimize LLM prompt size
- Rate limiting at the gateway to protect LLM endpoints

## 6. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM | Ollama (llama3.2) | Free, local, no API costs for demo |
| Vector DB | pgvector | No separate service; Postgres already in stack |
| Event bus | Kafka | Industry standard, durable, supports replay |
| Auth | JWT | Stateless, scales horizontally |
| Frontend | Angular 17 (standalone) | Signals for reactive state, no NgModules boilerplate |
| Orchestration | Docker Compose | Simple for demo; production would be ECS/EKS |
| Workflow | n8n | No-code automation, visual pipeline builder |

## 7. Non-Functional Requirements

- **Availability**: Core e-commerce (browse, cart, checkout) must work even if AI agent is down
- **Latency**: Product search < 200ms; AI agent response < 10s (LLM inference bound)
- **Scalability**: Stateless services (auth, product, order) can scale horizontally via ECS
- **Data consistency**: Eventual consistency via Kafka (acceptable for e-commerce)
- **Observability**: Spring Actuator health endpoints + Kafka event logging
