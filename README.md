# 🛍️ ShopHub — AI-Powered E-Commerce Platform

A full-stack microservices e-commerce platform with **AI Shopping Agent** powered by LangChain4j, Ollama LLM, RAG, pgvector, MCP protocol, Kafka event streaming, and n8n workflow automation.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat&logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat&logo=angular&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=flat&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-232323?style=flat&logo=apachekafka&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-LLM-000000?style=flat&logo=ollama&logoColor=white)

## 🏗️ Architecture

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
└──┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
   │         │          │          │            │
   ▼         ▼          ▼          ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL + pgvector                     │
│              Vector embeddings for RAG search               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Apache Kafka                              │
│         order.created │ product.sync │ agent.events          │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┐  ┌──────────┐  ┌─────────────────────┐
│  Ollama (LLM)   │  │  n8n     │  │  Notification Svc   │
│  llama3.2 local  │  │ Automate │  │  Port 8086          │
└──────────────────┘  └──────────┘  └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** v2+
- **Java 17** (for building locally)
- **Node.js 18+** (for frontend)
- **Git**

### One-Command Start
```bash
# Clone and start everything
git clone https://github.com/Anilg1997/AtlasOps-.git
cd AtlasOps-

# Start all services with Docker
docker compose up -d

# Wait for services to be ready (~2 min)
docker compose ps

# Pull Ollama models (first time only)
docker exec shop-ollama ollama pull llama3.2
docker exec shop-ollama ollama pull nomic-embed-text
```

### Access the Application
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:4200 |
| **API Gateway** | http://localhost:8080 |
| **Auth Service** | http://localhost:8081 |
| **Product Service** | http://localhost:8082 |
| **Order Service** | http://localhost:8083 |
| **Agent Service** | http://localhost:8084 |
| **Billing Service** | http://localhost:8085 |
| **n8n Automation** | http://localhost:5678 |
| **PostgreSQL** | localhost:5432 |
| **Kafka** | localhost:9092 |
| **Ollama** | http://localhost:11434 |

### Login Credentials
| Role | Username | Password |
|------|----------|----------|
| User | `emilys` | `emilyspass` |
| Admin | `emilys` | `emilyspass` |

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
| **pgvector** | Vector extension for PostgreSQL | pg16 |
| **Apache Kafka** | Event streaming & messaging | 7.5.0 |
| **Zookeeper** | Kafka coordination | 7.5.0 |
| **n8n** | Workflow automation | Latest |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Angular** | UI framework (standalone components) | 17.3 |
| **TypeScript** | Type safety | 5.3 |
| **SCSS** | Styling with CSS variables | - |
| **Angular Signals** | Reactive state management | - |

## 🤖 AI Agent Architecture

The AI Shopping Agent uses a **multi-layered agentic architecture**:

### 1. Intent Detection
```
User message → Pattern matching → AgentIntent enum
  GREETING | SEARCH | PRICE_QUERY | ADD_TO_CART |
  CHECKOUT | COMPARE | REVIEW | SHIPPING | GENERAL
```

### 2. RAG (Retrieval-Augmented Generation)
```
User query → Ollama embed (nomic-embed-text) → pgvector cosine search
  → Top-K relevant products → Enriched context → LLM prompt
```

### 3. LLM Generation (Ollama + LangChain4j)
```
System prompt + RAG context + Chat history → llama3.2 → Response with tool calls
```

### 4. MCP Tool Protocol
Available tools for the agent:
- `search_products(query)` — Search catalog
- `get_product_details(id)` — Get product info
- `add_to_cart(product_id, qty)` — Add to cart
- `get_cart_summary()` — View cart
- `process_checkout()` — Complete purchase
- `get_product_reviews(id)` — View reviews
- `compare_products(ids)` — Compare products

### 5. Kafka Event Streaming
```
order.created → Agent Service (stores context for RAG)
product.sync  → Agent Service (updates embeddings)
agent.events  → Notification Service (triggers n8n workflows)
```

### 6. n8n Automation Workflows
- **Order Notifications** — Webhook triggers on order events
- **Product Sync** — Cron job syncs DummyJSON → Backend → Vector DB
- **Agent Actions** — Automated follow-ups based on agent events

## 📁 Project Structure

```
AtlasOps-/
├── docker-compose.yml          # Full stack orchestration
├── infra/
│   ├── postgres-init.sql       # DB schema + pgvector + seed data
│   └── n8n-workflows/          # n8n automation templates
├── backend/
│   ├── gateway-service/        # API Gateway (Spring Cloud)
│   ├── auth-service/           # JWT Authentication
│   ├── product-service/        # Product catalog + DummyJSON sync
│   ├── order-service/          # Order management + Kafka events
│   ├── agent-service/          # AI Agent (LangChain4j + Ollama + RAG + MCP)
│   ├── billing-service/        # Invoicing & payments
│   └── notification-service/   # Kafka consumer + n8n webhooks
├── frontend/intellops-ui/      # Angular 17 SPA
│   └── src/app/
│       ├── components/
│       │   ├── agent/          # AI Agent chat UI
│       │   ├── auth/           # Login & Signup
│       │   ├── home/           # Landing page
│       │   ├── products/       # Product catalog
│       │   ├── product-detail/ # Product page + reviews
│       │   ├── cart/           # Shopping cart
│       │   ├── checkout/       # Checkout flow
│       │   ├── wishlist/       # Favorites
│       │   └── categories/     # Category browser
│       └── services/
│           ├── agent.service.ts    # AI agent client
│           ├── auth.service.ts     # Authentication
│           ├── product.service.ts  # Product API
│           ├── cart.service.ts     # Cart state
│           ├── theme.service.ts    # Dark mode
│           └── wishlist.service.ts # Favorites
└── pom.xml                     # Parent Maven POM
```

## 🔧 Development

### Build Backend
```bash
mvn clean package -DskipTests
```

### Run Frontend Locally
```bash
cd frontend/intellops-ui
npm install
npm start  # http://localhost:4200
```

### Run Individual Services
```bash
cd backend/agent-service
mvn spring-boot:run
```

### Pull Ollama Models
```bash
docker exec shop-ollama ollama pull llama3.2        # LLM (2GB)
docker exec shop-ollama ollama pull nomic-embed-text # Embeddings (274MB)
```

## 📊 Database Schema

### Tables
- `users` — User accounts with roles (USER/ADMIN/AGENT)
- `products` — Product catalog with pgvector embeddings
- `product_reviews` — Product reviews and ratings
- `orders` — Order management with status tracking
- `order_items` — Individual order line items
- `agent_conversations` — AI agent chat sessions
- `agent_messages` — Chat message history
- `invoices` — Billing and payment records
- `knowledge_base` — RAG knowledge store with embeddings

### Vector Search
```sql
-- Find similar products using cosine similarity
SELECT *, 1 - (embedding <=> $query::vector) AS score
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $query::vector
LIMIT 5;
```

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

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) — Backend framework
- [LangChain4j](https://docs.langchain4j.dev) — LLM orchestration
- [Ollama](https://ollama.com) — Local LLM inference
- [pgvector](https://github.com/pgvector/pgvector) — Vector similarity search
- [Apache Kafka](https://kafka.apache.org) — Event streaming
- [n8n](https://n8n.io) — Workflow automation
- [DummyJSON](https://dummyjson.com) — Product data API
- [Angular](https://angular.dev) — Frontend framework
