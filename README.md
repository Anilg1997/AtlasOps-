# 🛍️ ShopHub — AI-Powered E-Commerce Platform

A full-stack microservices e-commerce platform with an **autonomous AI Shopping Agent** that doesn't just answer questions — it detects and resolves order issues automatically.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat&logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat&logo=angular&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=flat&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-232323?style=flat&logo=apachekafka&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-LLM-000000?style=flat&logo=ollama&logoColor=white)

---

## 🤖 What Makes This Different

Most "AI shopping assistant" demos are just RAG chatbots that answer questions. ShopHub's agent **takes autonomous corrective action**:

- **Payment fails?** → The agent automatically retries the payment and notifies the customer
- **Item goes out of stock after order?** → The agent finds similar in-stock alternatives using vector similarity search
- **Delivery delayed?** → The agent generates a discount code and sends a compensation notification
- **Can't resolve?** → The agent honestly escalates to human support (not every problem should be auto-fixed)

This is event-driven automation — the agent subscribes to Kafka topics (`order.payment-failed`, `order.delivery-delayed`, `order.stock-out`) and proactively resolves issues **without the customer needing to open a chat window**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Angular 17)                     │
│  Auth │ Products │ Cart │ Wishlist │ Agent Chat │ Checkout      │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│                    API Gateway (Spring Cloud Gateway)            │
│              Port 8080 — Routes, Auth, Rate Limiting            │
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
┌──────────────────┐  ┌──────────┐  ┌─────────────────────┐
│  Ollama (LLM)   │  │  n8n     │  │  Notification Svc   │
│  llama3.2 local  │  │ Automate │  │  Port 8086          │
└──────────────────┘  └──────────┘  └─────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** v2+
- **Java 17** (for building locally)
- **Node.js 18+** (for frontend)
- **Git**

### One-Command Setup (Recommended)
```bash
git clone https://github.com/Anilg1997/AtlasOps-.git
cd AtlasOps-
make setup
```

This will: start all services → pull Ollama models → seed demo data → print access URLs.

### Manual Start
```bash
# Start services
make up

# Pull Ollama models (first time only, ~2 min)
make pull-models

# Seed demo data
make seed
```

### Available Make Commands
| Command | Description |
|---------|-------------|
| `make up` | Start all Docker services |
| `make down` | Stop all services |
| `make restart` | Restart all services |
| `make logs` | Follow all service logs |
| `make logs-agent` | Follow agent-service logs only |
| `make pull-models` | Pull Ollama LLM models |
| `make seed` | Seed order issue test data |
| `make health` | Check all service health |
| `make test` | Run agent-service tests |
| `make setup` | Full setup (up + models + seed) |

### Access the Application
| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost:4200 | Angular 17 SPA |
| **AI Agent** | http://localhost:4200/agent | Chat with the agent |
| **API Gateway** | http://localhost:8080 | REST API |
| **n8n Automation** | http://localhost:5678 | admin/admin |
| **Ollama** | http://localhost:11434 | LLM inference |

### Login Credentials
| Role | Username | Password |
|------|----------|----------|
| User | `emilys` | `emilyspass` |

### Try the Agent Auto-Resolution Demo
After seeding, ask the agent about these orders:
- **ORD-20260820-PAYFAIL** — Payment failed (auto-retry demo)
- **ORD-20260819-OUTSTK** — Out of stock (substitution demo)
- **ORD-20260810-DELAYD** — Delivery delayed (compensation demo)
- **ORD-20260822-DUP01** — Duplicate order detection
- **ORD-20260818-PRCERR** — Price mismatch (escalation demo)

---

## ⚠️ Troubleshooting

### Ollama Model Pull Failing
```bash
# Check if Ollama is running
docker exec shop-ollama ollama list

# Retry pull
docker exec shop-ollama ollama pull llama3.2
docker exec shop-ollama ollama pull nomic-embed-text
```

### Port Conflicts
All ports used by ShopHub:

| Port | Service | Protocol |
|------|---------|----------|
| 5432 | PostgreSQL | TCP |
| 9092 | Kafka | TCP |
| 2181 | Zookeeper | TCP |
| 11434 | Ollama | HTTP |
| 8080 | API Gateway | HTTP |
| 8081 | Auth Service | HTTP |
| 8082 | Product Service | HTTP |
| 8083 | Order Service | HTTP |
| 8084 | Agent Service | HTTP |
| 8085 | Billing Service | HTTP |
| 8086 | Notification Service | HTTP |
| 4200 | Frontend | HTTP |
| 5678 | n8n | HTTP |

If any port is in use: `lsof -i :PORT` or `netstat -tlnp | grep PORT` to find the process.

### Docker Memory
Ollama + Postgres + Kafka together need at least **6GB Docker memory**:
- Docker Desktop → Settings → Resources → Memory: set to **8GB** (recommended)

### pgvector Extension Not Enabled
```sql
-- Connect to Postgres and run:
docker exec -it shop-postgres psql -U shophub -d shophub -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Agent Not Responding
The agent falls back to rule-based responses if Ollama is unavailable. Check:
```bash
make logs-agent
# Look for: "⚠️ Ollama not available, using rule-based agent"
```

---

## 🤖 AI Agent Architecture

### Multi-Layered Agentic Design

**1. Intent Detection**
```
User message → Pattern matching → AgentIntent enum
  GREETING | SEARCH | PRICE_QUERY | ADD_TO_CART |
  CHECKOUT | COMPARE | REVIEW | SHIPPING | ORDER_ISSUE | GENERAL
```

**2. RAG (Retrieval-Augmented Generation)**
```
User query → Ollama embed (nomic-embed-text) → pgvector cosine search
  → Top-K relevant products → Enriched context → LLM prompt
```

**3. LLM Generation (Ollama + LangChain4j)**
```
System prompt + RAG context + Chat history → llama3.2 → Response with tool calls
```

**4. MCP Tool Protocol**
Available tools for the agent:

*Shopping Tools:*
| Tool | Description |
|------|-------------|
| `search_products(query)` | Search catalog via RAG |
| `get_product_details(id)` | Get product info |
| `add_to_cart(product_id, qty)` | Add to cart |
| `get_cart_summary()` | View cart |
| `process_checkout()` | Complete purchase |
| `get_product_reviews(id)` | View reviews |
| `compare_products(ids)` | Compare products |

*Order Issue Resolution Tools:*
| Tool | Description |
|------|-------------|
| `detect_order_issues(orderId)` | Full diagnostic check |
| `resolve_payment_retry(orderId)` | Auto-retry failed payment |
| `resolve_stock_substitution(orderId, itemId)` | Find alternatives via vector search |
| `resolve_delivery_delay(orderId)` | Check delay + generate compensation |
| `escalate_to_human(orderId, reason)` | Create support ticket |

**5. Event-Driven Automation (Kafka)**
```
order.created → Agent Service (stores context for RAG)
order.payment-failed → Agent Service (auto-retry resolution)
order.delivery-delayed → Agent Service (compensation)
order.stock-out → Agent Service (substitution)
product.sync → Agent Service (updates embeddings)
agent.events → Notification Service (triggers n8n workflows)
```

**6. n8n Automation Workflows**
- **Order Notifications** — Webhook triggers on order events
- **Product Sync** — Cron job syncs DummyJSON → Backend → Vector DB
- **Agent Actions** — Automated follow-ups based on agent events

---

## 📐 Design Documentation

| Document | Description |
|----------|-------------|
| [High-Level Design](docs/design/HLD.md) | Service breakdown, communication patterns, why microservices |
| [Low-Level Design](docs/design/LLD.md) | RAG flow with vector math, order issue resolution sequence diagram |
| [System Design Talking Points](docs/design/SYSTEM_DESIGN_TALKING_POINTS.md) | Interview cheat sheet: scaling, idempotency, caching, vector search complexity |
| [AWS Architecture](docs/aws-architecture.md) | Production vs demo deployment, centralized logging |
| [Tech Decisions](docs/tech-decisions.md) | Architecture decision records |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Java** | Runtime | 17 |
| **Spring Boot** | Microservice framework | 3.2.5 |
| **Spring Cloud Gateway** | API Gateway & routing | 2023.0.1 |
| **Spring Data JPA** | ORM & database access | 3.2.5 |
| **Spring Kafka** | Event streaming | 3.2.5 |
| **Spring Security** | Authentication & JWT | 3.2.5 |

### AI / ML
| Technology | Purpose | Version |
|------------|---------|---------|
| **LangChain4j** | LLM orchestration framework | 0.36.0 |
| **Ollama** | Local LLM inference (llama3.2) | Latest |
| **pgvector** | Vector similarity search | 0.1.6 |
| **nomic-embed-text** | Text embedding model | Latest |
| **MCP** | Model Context Protocol for tools | 1.0.0 |

### Infrastructure
| Technology | Purpose | Version |
|------------|---------|---------|
| **Docker** | Containerization | 24+ |
| **Docker Compose** | Multi-container orchestration | v2 |
| **PostgreSQL** | Primary database + vector store | 16 |
| **Apache Kafka** | Event streaming & messaging | 7.5.0 |
| **n8n** | Workflow automation | Latest |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Angular** | UI framework (standalone components) | 17.3 |
| **TypeScript** | Type safety | 5.3 |
| **SCSS** | Styling with CSS variables | - |
| **Angular Signals** | Reactive state management | - |

---

## 📊 Database Schema

### Core Tables
- **`users`** — User accounts with roles (USER/ADMIN/AGENT)
- **`products`** — Product catalog with pgvector embeddings (768 dimensions)
- **`product_reviews`** — Product reviews and ratings
- **`orders`** — Order management with status tracking
- **`order_items`** — Individual order line items
- **`invoices`** — Billing and payment records

### Agent Tables
- **`agent_conversations`** — AI agent chat sessions
- **`agent_messages`** — Chat message history
- **`order_issues`** — Autonomous issue detection and resolution tracking
- **`knowledge_base`** — RAG knowledge store with embeddings

### Vector Search
```sql
-- Find similar products using cosine similarity
SELECT *, 1 - (embedding <=> $query::vector) AS score
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $query::vector
LIMIT 5;
```

---

## 🐳 Docker Services

| Service | Image | Port | Health Check |
|---------|-------|------|-------------|
| postgres | pgvector/pgvector:pg16 | 5432 | pg_isready |
| kafka | confluentinc/cp-kafka:7.5.0 | 9092 | - |
| zookeeper | confluentinc/cp-zookeeper:7.5.0 | 2181 | - |
| ollama | ollama/ollama:latest | 11434 | curl /api/tags |
| n8n | n8nio/n8n:latest | 5678 | - |
| gateway | custom | 8080 | /actuator/health |
| auth-service | custom | 8081 | /actuator/health |
| product-service | custom | 8082 | /actuator/health |
| order-service | custom | 8083 | /actuator/health |
| agent-service | custom | 8084 | /actuator/health |
| billing-service | custom | 8085 | /actuator/health |
| notification-service | custom | 8086 | /actuator/health |
| frontend | custom | 4200 | - |

---

## 📁 Project Structure

```
ShopHub/
├── Makefile                       # One-command dev workflow
├── docker-compose.yml             # Full stack orchestration
├── docker-compose.aws.yml         # AWS deployment variant
├── infra/
│   ├── postgres-init.sql          # DB schema + pgvector + seed data
│   └── n8n-workflows/            # n8n automation templates
├── backend/
│   ├── gateway-service/           # API Gateway (Spring Cloud)
│   ├── auth-service/              # JWT Authentication
│   ├── product-service/           # Product catalog + DummyJSON sync
│   ├── order-service/             # Order management + Kafka events
│   ├── agent-service/             # AI Agent (LangChain4j + Ollama + RAG + MCP)
│   ├── billing-service/           # Invoicing & payments
│   └── notification-service/      # Kafka consumer + n8n webhooks
├── frontend/intellops-ui/         # Angular 17 SPA
├── test-data/order-issues/        # Order issue demo seed data
├── scripts/seed-demo-data.sh      # One-command data seeding
└── docs/
    ├── design/                    # HLD, LLD, System Design Talking Points
    ├── aws-architecture.md        # AWS deployment guide
    └── tech-decisions.md          # Architecture decision records
```

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) — Backend framework
- [LangChain4j](https://docs.langchain4j.dev) — LLM orchestration
- [Ollama](https://ollama.com) — Local LLM inference
- [pgvector](https://github.com/pgvector/pgvector) — Vector similarity search
- [Apache Kafka](https://kafka.apache.org) — Event streaming
- [n8n](https://n8n.io) — Workflow automation
- [DummyJSON](https://dummyjson.com) — Product data API
- [Angular](https://angular.dev) — Frontend framework
