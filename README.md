<div align="center">
  <img src="https://img.shields.io/badge/AtlasOps-AI%20Enterprise%20Co--Pilot-6C5CE7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjYiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIyIi8+PC9zdmc+" alt="AtlasOps"/>

  # AtlasOps — AI-Powered Enterprise Operations Platform

  **An intelligent co-pilot that unifies order management, inventory, billing, and legacy systems — answering support questions in plain English using RAG, tool-calling agents, a locally-hosted LLM, and a free vector database.**

  <br>

  [![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=openjdk)](https://adoptium.net/)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-brightgreen?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
  [![Angular](https://img.shields.io/badge/Angular-17-red?style=flat-square&logo=angular)](https://angular.dev/)
  [![LangChain4j](https://img.shields.io/badge/LangChain4j-1.17-6C5CE7?style=flat-square)](https://github.com/langchain4j/langchain4j)
  [![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-000?style=flat-square&logo=ollama)](https://ollama.ai/)
  [![ChromaDB](https://img.shields.io/badge/Vector%20DB-ChromaDB-FC6D26?style=flat-square)](https://www.trychroma.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![GraphQL](https://img.shields.io/badge/GraphQL-BFF-E10098?style=flat-square&logo=graphql)](https://graphql.org/)
  [![gRPC](https://img.shields.io/badge/gRPC-internal-4285F4?style=flat-square)](https://grpc.io/)
  [![Kafka](https://img.shields.io/badge/Kafka-events-231F20?style=flat-square&logo=apachekafka)](https://kafka.apache.org/)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com/)
  [![Tests](https://img.shields.io/badge/tests-226%20unit%20tests-2ea44f?style=flat-square)](.github/workflows)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

  <br>
  <img src="screenshots/dashboard-overview.svg" alt="AtlasOps Dashboard" width="800"/>
  <br>
  <em>AtlasOps Operations Dashboard — unified view of orders, inventory, billing, and AI-powered insights</em>
</div>

---

## 🚀 Live Demo

**Try the AI co-pilot live: [atlasops-demo.up.railway.app](<PASTE_LIVE_URL_HERE>)**

[![AtlasOps Demo](docs/demo.gif)](docs/demo.gif) <!-- Replace with your 60-90s screen capture -->

_Register with any email/password, then ask the co-pilot: **"Why is order ORD-1001 on hold?"**_

The demo runs the minimal deployable slice (`docker-compose.demo.yml`):
auth + order + inventory + AI co-pilot with a small local LLM
(`llama3.2:3b`) and the notification service powering the **Activity Feed**
(`/feed`) — see [DEPLOY.md](DEPLOY.md) for the deployment walkthrough. The
feed is seeded with demo events via REST (`seed-feed`), so it works without
Kafka. The full event-driven stack (Kafka, Oracle/SOAP billing, ChromaDB)
lives in `docker-compose.yml` for local review.

---

## Overview

AtlasOps is an enterprise-grade operations platform that sits on top of **order management, inventory, billing, and legacy systems**, providing:

- **AI Co-Pilot** — Natural language querying of business systems using RAG + tool-calling agents
- **Unified Dashboard** — Real-time visibility across orders, inventory, and billing
- **Multi-API Architecture** — REST, GraphQL BFF, gRPC internal, SOAP legacy, SSE streaming
- **Event-Driven** — Kafka-powered async communication between services
- **Privacy-First AI** — Local LLM (Ollama) + ChromaDB vector store — no data leaves your network
- **100% Free & Open Source** — Zero paid dependencies, zero API keys required

---

## 📸 Screenshots

### 🔐 Authentication
| Login | Register | Registration Success |
|:-----:|:--------:|:--------------------:|
| <img src="screenshots/login-page.svg" alt="Login" width="100%"/> | <img src="screenshots/register-page.svg" alt="Register" width="100%"/> | <img src="screenshots/register-success.svg" alt="Success" width="100%"/> |

### 📊 Operations
| Dashboard | AI Co-Pilot Chat | System Health |
|:---------:|:----------------:|:-------------:|
| <img src="screenshots/dashboard-overview.svg" alt="Dashboard" width="100%"/> | <img src="screenshots/ai-copilot.svg" alt="AI Chat" width="100%"/> | <img src="screenshots/system-health.svg" alt="Health" width="100%"/> |

### 📋 Order Management
| Order List | Order Detail | Create Order |
|:----------:|:------------:|:------------:|
| <img src="screenshots/order-list.svg" alt="Orders" width="100%"/> | <img src="screenshots/order-detail.svg" alt="Detail" width="100%"/> | <img src="screenshots/order-create.svg" alt="Create" width="100%"/> |

### 💰 Legacy & Billing
| Legacy Billing | 404 Error |
|:--------------:|:---------:|
| <img src="screenshots/legacy-billing.svg" alt="Billing" width="100%"/> | <img src="screenshots/not-found.svg" alt="404" width="100%"/> |

### 🏗️ Architecture
| End-to-End Architecture |
|:----------------------:|
| <img src="screenshots/architecture-flow.svg" alt="Architecture" width="100%"/> |

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │   Angular 17 Frontend    │
                       │  (Auth + Co-pilot chat   │
                       │   + admin dashboards)    │
                       └───────────┬──────────────┘
                        JWT Auth  │ GraphQL (BFF) + REST + SSE/WebSocket
                        (Bearer)  ▼
       ┌─────────────────────────────────────────────────────┐
       │              Auth Service (port 8080)                │
       │   JWT Login/Register · Spring Security · bcrypt      │
       └────────────────────────┬────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI Co-Pilot Service (port 8083)                       │
│   LangChain4j 1.17 + Ollama (local LLM) + ChromaDB (vector store)           │
│   - RAG over runbooks/FAQs with embedding similarity search                  │
│   - Agent w/ MCP tool calling (Order, Inventory, Billing tools)             │
│   - Conversation memory (MongoDB) + SSE streaming responses                 │
│   - Fallback to pgvector or ChromaDB for vector storage                     │
└───────┬───────────────┬───────────────┬──────────────┬──────────────┐
        │ MCP            │ MCP           │ MCP          │ Vector Search│
        ▼                ▼               ▼              ▼              │
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ Order Service│ │ Inventory    │ │ Legacy       │ │ ChromaDB     │  │
│ (port 8081)  │ │ (port 8082)  │ │ Billing      │ │ Free Vector  │  │
│ PostgreSQL   │ │ MongoDB      │ │ (port 8084)  │ │ DB (port 8000)│  │
│ REST+GraphQL │ │ gRPC internal│ │ Oracle + SOAP│ │ Ollama       │  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ Embeddings   │  │
       │                │                │         └──────────────┘  │
       └────────────────┴────────────────┘                          │
                        │ Kafka events                              │
                        ▼                                            │
               ┌──────────────────────┐                              │
               │ Notification/Activity│◄─────────────────────────────┘
               │ Service (Kafka)      │
               └──────────────────────┘
```

---

## ✨ Key Features

### 🔐 Authentication
- JWT-based auth with Spring Security + bcrypt
- User registration, login, token refresh
- Role-based access (USER, ADMIN, OPERATOR)

### 📊 Operations Dashboard
- Real-time stats: orders, revenue, inventory, fulfillment rate
- AI-powered insights and automated recommendations
- System health monitoring for all microservices

### 📋 Order Management
- REST + GraphQL BFF dual API surface
- ACID transactions with PostgreSQL + Flyway migrations
- Status workflow: Pending → Confirmed → Processing → Shipped → Delivered
- Kafka event publishing for audit trails

### 📦 Inventory & Catalog
- MongoDB document model for flexible product attributes
- gRPC low-latency stock checking and reservation
- Real-time stock tracking with reorder thresholds

### 🤖 AI Co-Pilot (RAG + MCP)
- **Local LLM** via Ollama — no data leaves the network
- **RAG** with ChromaDB vector store (free, open-source) + pgvector fallback
- **MCP tool calling** — Order, Inventory, Billing, and Activity (audit trail) agents
- SSE streaming for real-time chat responses
- Conversation memory in MongoDB

### 💰 Legacy Integration
- Oracle DB + SOAP web services adapter
- Kafka event pipeline for cross-system sync
- Invoice/payment management with status tracking

### 🧪 Testing
- **226 unit tests** across all services (83 backend + 143 Angular frontend)
- JUnit 5 + Mockito + AssertJ
- Spring Boot `@WebMvcTest` for controllers
- Testcontainers for MongoDB & ChromaDB integration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.2, Spring Data JPA, Spring Security |
| **Auth** | JWT (jjwt 0.12), bcrypt, Spring Security filter chain |
| **API (External)** | REST (versionable, cacheable) |
| **API (BFF)** | GraphQL (single-round-trip queries) |
| **API (Internal)** | gRPC (low-latency service-to-service) |
| **Legacy API** | SOAP (Oracle adapter simulation) |
| **Database (Auth/Orders)** | PostgreSQL 16 (ACID, relational) |
| **Database (Catalog)** | MongoDB 7 (flexible schema) |
| **Database (Legacy)** | Oracle XE (simulated legacy) |
| **Vector Database** | ChromaDB (open-source, free) + pgvector |
| **Cache** | Redis 7 |
| **Messaging** | Apache Kafka |
| **AI Framework** | LangChain4j 1.17.0 |
| **AI Model** | Ollama (llama3.1 / nomic-embed-text) |
| **Frontend** | Angular 17, Apollo GraphQL, SSE streaming |
| **Infra** | Docker Compose, AWS (ECS, RDS, MSK) |
| **Testing** | JUnit 5, Mockito, AssertJ, Testcontainers |
| **CI/CD** | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17+ | Backend microservices |
| Maven | 3.9+ | Build & dependency management |
| Node.js | 20+ | Angular frontend |
| Docker | Latest | PostgreSQL, MongoDB, Kafka, ChromaDB |
| Ollama | Latest | Local LLM for AI features |

### Setup

#### Fastest: run the demo slice (everything containerized)
```bash
git clone https://github.com/Anilg1997/AtlasOps-
cd AtlasOps-

docker compose -f docker-compose.demo.yml up --build
open http://localhost:8080
```
This brings up Postgres, MongoDB, Ollama (`llama3.2:3b`), the five backend
services, seed data (demo orders + feed events), and the frontend — no local
Java/Node needed. Deploy steps for Railway are in [DEPLOY.md](DEPLOY.md).

#### Full local development stack
```bash
# 1. Clone
git clone https://github.com/Anilg1997/AtlasOps-
cd AtlasOps-

# 2. Build all services
mvn clean install -DskipTests

# 3. Start infrastructure
docker-compose up -d

# 4. Start Auth Service (terminal 1)
cd backend/auth-service && mvn spring-boot:run

# 5. Start Order Service (terminal 2)
cd backend/order-service && mvn spring-boot:run

# 6. Start Frontend (terminal 3)
cd frontend/intellops-ui && npm install && ng serve

# 7. (Optional) Pull AI models
ollama pull llama3.1
ollama pull nomic-embed-text
```

Open [http://localhost:4200](http://localhost:4200)

---

## 📦 Project Structure

```
atlasops-platform/
├── backend/
│   ├── auth-service/              # JWT auth (registration, login)
│   ├── order-service/             # Orders, customers (REST + GraphQL)
│   ├── inventory-service/         # Catalog, stock (MongoDB + gRPC)
│   ├── ai-copilot-service/        # AI co-pilot (LangChain4j, RAG, MCP)
│   ├── billing-service/           # Legacy billing (Oracle + SOAP)
│   ├── notification-service/      # Kafka consumer → activity timeline (MongoDB)
│   └── proto/                     # Shared protobuf definitions
├── frontend/intellops-ui/         # Angular 17 SPA
│   └── src/app/
│       ├── components/            # Auth, dashboard, orders, chat, billing
│       ├── services/              # REST + GraphQL clients
│       ├── guards/                # Auth guards
│       └── interceptors/          # JWT interceptor
├── screenshots/                   # Application screenshots
├── docs/                          # Architecture & decision docs
├── infra/
│   ├── postgres/                  # DB init scripts (databases, extensions)
│   ├── mongodb/                   # Collections + product seeds
│   └── demo/                      # Demo seed data (orders, vector-store docs)
├── .github/workflows/             # CI/CD pipelines
├── docker-compose.yml             # Full local dev environment
├── docker-compose.demo.yml        # Minimal deployable demo slice
├── DEPLOY.md                      # Railway/Render deployment guide
└── README.md                      # This file
```

---

## 🧪 Running Tests

```bash
# Test all backend services
cd backend && mvn test

# Test specific service
cd backend/ai-copilot-service && mvn test

# Test with coverage
cd backend && mvn verify
```

### Test Coverage by Service

| Service | Tests | Coverage Areas |
|---------|-------|----------------|
| **AI Co-Pilot** | 33 tests | ChatService, RagService, ConversationMemory, ChatController, CopilotController, AiCopilotService, ActivityTool, EvidenceCollector, AI Config |
| **Auth** | 13 tests | AuthService, JwtTokenProvider, AuthController |
| **Order** | 6 tests | OrderService |
| **Inventory** | 7 tests | InventoryService, ProductCatalogController |
| **Billing** | 7 tests | BillingService |
| **Notification/Activity** | 17 tests | ActivityLogService, KafkaEventConsumer, ActivityLogController |
| **Frontend (Angular)** | 143 tests | App, Login, Register, RegisterSuccess, Dashboard, OrderList, OrderCreate, OrderDetail, Billing, Inventory, Health, Chat, Feed, RecentActivity, Layout, NotFound, Toasts; AuthService, BillingService, OrderService, InventoryService, CopilotService, ActivityService, ToastService; authGuard, authInterceptor |
| **Total** | **226 tests** | |

---

## 🔑 API Endpoints

### Auth Service (port 8080)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get JWT |
| `GET` | `/api/auth/me` | Current user profile |

### AI Co-Pilot (port 8083)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/copilot/session` | Create chat session |
| `POST` | `/api/copilot/chat` | Send message |
| `GET` | `/api/copilot/chat/stream` | SSE streaming chat |
| `GET` | `/api/copilot/history/{id}` | Chat history |
| `DELETE` | `/api/copilot/session/{id}` | Clear session |

### Notification/Activity Service (port 8085)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/activity?entityId=&entityType=&eventType=&limit=` | Query the cross-service activity timeline |
| `GET` | `/api/v1/activity/stats` | Activity log counts by entity type |
| `POST` | `/api/v1/activity/events` | Manually publish a demo event into the feed (works without Kafka) |
| gRPC | `NotificationService.GetActivityLog` | Internal activity timeline lookup (proto) |

---

## 🧠 Why AtlasOps Stands Out

1. **Multi-service microservices** — 6 independent Spring Boot services with different databases and API styles
2. **AI with local LLM** — RAG, MCP tool calling, conversation memory (privacy-first)
3. **Free vector database** — ChromaDB integration for production-grade RAG without paid services
4. **Latest LangChain4j** — Uses LangChain4j 1.17.0 with the most recent AI capabilities
5. **Legacy integration** — Oracle + SOAP adapter (real enterprise skill)
6. **Event-driven** — Kafka for decoupling and audit trails
7. **Multi-API** — REST, GraphQL, gRPC, SOAP, SSE — all in one platform
8. **Full auth** — JWT, bcrypt, role-based access
9. **Modern frontend** — Angular 17, reactive forms, SSE streaming
10. **Comprehensive tests** — 226 unit tests across all services
11. **Cloud-ready** — Docker Compose, CI/CD, AWS deploy guides
12. **Enterprise UX** — Order forms, toast notifications, system health monitoring, responsive design

---

<div align="center">
  <br>
  <p>
    <strong>Built with ❤️ by <a href="https://github.com/Anilg1997">Anil G</a></strong>
  </p>
  <p>
    <a href="https://github.com/Anilg1997">GitHub</a> ·
    <a href="https://linkedin.com/in/anilg1997">LinkedIn</a>
  </p>
  <p>
    <sub>MIT License · Copyright © 2026 Anil G</sub>
  </p>
</div>
