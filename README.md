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
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com/)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

  <br>
  <img src="screenshots/dashboard-overview.svg" alt="AtlasOps Dashboard" width="800"/>
  <br>
  <em>AtlasOps Operations Dashboard — unified view of orders, inventory, billing, and AI-powered insights</em>
</div>

---

## 🚀 Quick Start — Zero Dependencies (Mock Mode)

The frontend runs **standalone** with built-in realistic test data. No backend, database, or Docker required.

```bash
git clone https://github.com/Anilg1997/AtlasOps-
cd AtlasOps-/frontend/intellops-ui
npm install
npm start
```

Open **http://localhost:4200** — login with any of these demo accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@atlasops.io` | `admin123` | **Admin** (full access + user management) |
| `demo@atlasops.io` | `demo123` | **User** (standard operations view) |
| `ops@atlasops.io` | `ops123` | **Operator** (order/inventory operations) |

> **The mock interceptor** (`interceptors/mock.interceptor.ts`) intercepts all HTTP calls and returns realistic demo data — 12 orders, 12 products, 12 invoices, 8 users, 30 activity events, and AI chat responses. Toggle `MOCK_ENABLED` to switch to the real backend.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based auth with role-based access (Admin, Operator, User)
- User registration, login, token refresh
- Admin panel for user CRUD, role management, and system settings

### 📊 Operations Dashboard
- Real-time stats: orders, revenue, inventory, fulfillment rate
- AI-powered insights and automated recommendations
- Quick actions for fast navigation
- Recent activity timeline

### 📋 Order Management
- REST + GraphQL BFF dual API surface
- ACID transactions with PostgreSQL + Flyway migrations
- Status workflow: Pending → Confirmed → Processing → Shipped → Delivered
- Customer info, financials, and line items detail view
- Order creation with product selection and live total calculation

### 📦 Inventory & Catalog
- MongoDB document model for flexible product attributes
- Product cards with stock visualization bars
- Category filtering (Electronics, Furniture, Accessories, Services)
- Low stock / critical stock indicators

### 🤖 AI Co-Pilot (RAG + MCP)
- **Local LLM** via Ollama — no data leaves the network
- **RAG** with ChromaDB vector store (free, open-source) + pgvector fallback
- **MCP tool calling** — Order, Inventory, Billing, and Activity (audit trail) agents
- SSE streaming for real-time chat responses
- Conversation memory in MongoDB
- Quick action prompts for common queries

### 💰 Billing (Legacy Integration)
- Oracle DB + SOAP web services adapter
- Invoice management with status tracking (Paid, Pending, Overdue, Cancelled)
- Legacy system integration indicators

### 📡 Activity Feed
- Cross-service operations timeline
- Auto-refresh (15s intervals)
- Entity type and event type filtering
- Linkable entities (orders, invoices, payments)

### 🏥 System Health
- Real-time monitoring of all microservices
- Overall system status indicator (Healthy / Degraded / Error)
- Infrastructure overview (PostgreSQL, MongoDB, Oracle, Kafka, Ollama, ChromaDB)

### 👥 Admin Panel
- **User Management**: Create, edit, disable, delete users; role assignment
- **System Settings**: Site name, maintenance mode, tax rate, feature toggles, security config
- Only visible to ADMIN role users

### 🎨 Modern UI
- **Collapsible sidebar** navigation with role-based menu
- **Top bar** with user avatar, role badge, and quick logout
- **Responsive design** — works on desktop and mobile
- **Toast notifications** for all user actions
- **Animations** — smooth fade-in and slide transitions
- **Custom scrollbars** and loading states

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │   Angular 17 Frontend    │
                       │  (Auth + Co-pilot chat   │
                       │   + admin dashboards)    │
                       │  MOCK MODE (standalone)  │
                       └───────────┬──────────────┘
                        JWT Auth  │ REST + GraphQL + SSE
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
└───────┬───────────────┬───────────────┬──────────────┬──────────────┐
        │ MCP            │ MCP           │ MCP          │ Vector Search│
        ▼                ▼               ▼              ▼              │
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ Order Service│ │ Inventory    │ │ Legacy       │ │ ChromaDB     │  │
│ (port 8081)  │ │ (port 8082)  │ │ Billing      │ │ Free Vector  │  │
│ PostgreSQL   │ │ MongoDB      │ │ (port 8084)  │ │ DB (port 8000│  │
│ REST+GraphQL │ │ gRPC internal│ │ Oracle + SOAP│ │ Ollama       │  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📦 Project Structure

```
AtlasOps-/
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
│       ├── components/
│       │   ├── admin/             # Admin panel (users + settings)
│       │   ├── auth/              # Login, Register, RegisterSuccess
│       │   ├── chat/              # AI Co-Pilot chat interface
│       │   ├── dashboard/         # Operations dashboard
│       │   ├── feed/              # Activity feed + recent activity widget
│       │   ├── billing/           # Invoice management
│       │   ├── health/            # System health monitoring
│       │   ├── inventory/         # Product catalog
│       │   ├── layout/            # Sidebar + topbar layout
│       │   ├── not-found/         # 404 page
│       │   ├── notifications/     # Toast notification system
│       │   ├── order-create/      # Order creation form
│       │   ├── order-detail/      # Order detail view
│       │   └── order-list/        # Order list with search
│       ├── services/
│       │   ├── mock-data.service.ts     # ⭐ Comprehensive test data
│       │   ├── auth.service.ts          # Auth state + JWT
│       │   ├── order.service.ts         # Order API client
│       │   ├── inventory.service.ts     # Inventory API client
│       │   ├── copilot.service.ts       # AI chat API client
│       │   ├── billing.service.ts       # Billing API client
│       │   ├── activity.service.ts      # Activity feed API client
│       │   └── notification/            # Toast service
│       ├── interceptors/
│       │   ├── auth.interceptor.ts      # JWT token injection
│       │   └── mock.interceptor.ts      # ⭐ Mock data interceptor
│       └── guards/
│           └── auth.guard.ts            # Route protection
├── infra/
│   ├── postgres/                  # DB init scripts
│   ├── mongodb/                   # Collections + product seeds
│   └── demo/                      # Demo seed data
├── docker-compose.yml             # Full local dev environment
├── docker-compose.demo.yml        # Minimal deployable demo slice
└── README.md
```

---

## 🧪 Test Data

The mock data service provides comprehensive, realistic test data:

| Data Type | Count | Details |
|-----------|-------|---------|
| **Users** | 8 | 2 Admins, 2 Operators, 4 Users |
| **Customers** | 8 | Acme Corp, Globex, Initech, Stark, Wayne, Umbrella, Cyberdyne, Oscorp |
| **Products** | 12 | Server racks, switches, SSDs, firewalls, SSL certs, consulting |
| **Orders** | 12 | All statuses: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, On Hold |
| **Invoices** | 12 | All statuses: Pending, Paid, Overdue, Cancelled |
| **Activity Events** | 30 | Order lifecycle, billing events, payment events |
| **AI Conversations** | 3 | Pre-seeded with realistic Q&A about orders and inventory |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17, TypeScript 5.3, RxJS, SCSS |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security |
| **Database** | PostgreSQL 16, MongoDB 7, Oracle XE |
| **AI** | LangChain4j 1.17, Ollama, ChromaDB |
| **Messaging** | Apache Kafka |
| **API** | REST, GraphQL, gRPC, SOAP, SSE |
| **Testing** | JUnit 5, Mockito, 300 unit tests |

---

## 🐳 Full Stack (Docker)

For the complete experience with real backend services:

```bash
# Fastest: demo slice (containerized)
docker compose -f docker-compose.demo.yml up --build
open http://localhost:8080

# Full local development stack
docker-compose up -d
cd backend/auth-service && mvn spring-boot:run
cd backend/order-service && mvn spring-boot:run
cd frontend/intellops-ui && npm install && ng serve
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend && mvn test

# Frontend tests
cd frontend/intellops-ui && npm test
```

---

## 📝 License

MIT License — Copyright © 2026 Anil G
