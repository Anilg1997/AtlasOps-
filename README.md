# 🛍️ ShopHub — AI-Powered E-Commerce Platform

A production-ready e-commerce application built with Angular 17 featuring an **AI Shopping Agent** that automates the entire shopping flow — from product discovery to checkout.

![Angular](https://img.shields.io/badge/Angular-17.3-DD0031?style=flat&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-Style-CF649D?style=flat&logo=sass&logoColor=white)

## ✨ Features

### 🛒 E-Commerce
- **Product Catalog** — Browse 194+ products with search, filter, sort & pagination
- **Category Browsing** — 24 categories with visual cards
- **Product Detail** — Multi-image gallery, specs, reviews, ratings
- **Shopping Cart** — Slide-in drawer + full cart page with quantity controls
- **Wishlist** — Heart icon on any product, persistent favorites
- **Checkout** — Full checkout flow with order confirmation
- **Dark Mode** — Toggle theme with localStorage persistence

### 🤖 AI Shopping Agent
- **Conversational Flow** — Agent asks questions step by step
- **Smart Product Discovery** — Searches by category, budget, brand, priority
- **Automatic Recommendations** — Sorts by rating, price, or discount
- **Auto Cart** — Add all or specific products with one click
- **Auto Checkout** — Redirects to checkout when ready
- **Quick Prompts** — Pre-built conversation starters

### 🔐 Authentication
- **Login/Signup** — User and admin roles
- **JWT Auth** — Token-based with localStorage persistence
- **Protected Routes** — Auth guard on all shopping pages
- **User Profile** — Avatar, name, dropdown with logout

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Git**

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/AtlasOps-.git
cd AtlasOps-

# 2. Install dependencies
cd frontend/intellops-ui
npm install

# 3. Start the dev server
npm start

# 4. Open in browser
# http://localhost:4200
```

### Login Credentials
| Role | Username | Password |
|------|----------|----------|
| User | `emilys` | `emilyspass` |
| Admin | `emilys` | `emilyspass` |

> These use the [DummyJSON API](https://dummyjson.com) for authentication.

## 📁 Project Structure

```
AtlasOps-/
├── frontend/intellops-ui/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── agent/          # AI Shopping Agent
│   │   │   │   ├── auth/           # Login & Signup
│   │   │   │   ├── cart/           # Cart drawer & page
│   │   │   │   ├── categories/     # Category browser
│   │   │   │   ├── checkout/       # Checkout page
│   │   │   │   ├── home/           # Landing page
│   │   │   │   ├── layout/         # Header, footer, nav
│   │   │   │   ├── product-detail/ # Product page
│   │   │   │   ├── products/       # Product listing
│   │   │   │   └── wishlist/       # Favorites page
│   │   │   ├── guards/             # Auth guard
│   │   │   ├── services/
│   │   │   │   ├── agent.service.ts      # AI agent logic
│   │   │   │   ├── auth.service.ts       # Authentication
│   │   │   │   ├── cart.service.ts       # Cart state
│   │   │   │   ├── product.service.ts    # DummyJSON API
│   │   │   │   ├── theme.service.ts      # Dark mode
│   │   │   │   └── wishlist.service.ts   # Favorites
│   │   │   ├── app.routes.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.component.ts
│   │   ├── styles.scss              # Global styles + dark mode
│   │   └── index.html
│   └── package.json
└── README.md
```

## 🏗️ Architecture

### State Management
All state uses **Angular Signals** for reactive, performant updates:
- `CartService` — Signal-based cart with localStorage persistence
- `WishlistService` — Signal-based favorites with localStorage
- `ThemeService` — Dark/light mode with system preference detection
- `AuthService` — Signal-based user state with JWT tokens
- `AgentService` — Signal-based conversation and agent state

### API Integration
Uses the **DummyJSON REST API** (no backend required):
- `GET /products` — Paginated product list
- `GET /products/:id` — Single product
- `GET /products/search?q=` — Search
- `GET /products/category/:slug` — Category filter
- `GET /products/categories` — All categories
- `POST /auth/login` — Authentication
- `GET /auth/me` — Current user

### AI Agent Flow
```
User Input → Agent State Machine → Product Search → Recommendations
     ↓                                                      ↓
  Questions                                    Add to Cart / Checkout
     ↓                                                      ↓
  Budget/Brand/Priority                              Order Complete
```

## 🎨 UI/UX

- **Responsive** — Mobile-first with breakpoints at 768px and 900px
- **Dark Mode** — Full theme support with CSS custom properties
- **Animations** — Fade-in, slide-up, heartbeat, typing indicator
- **Micro-interactions** — Hover effects, scale transforms, smooth transitions
- **Accessibility** — Semantic HTML, focus states, keyboard navigation

## 🔧 Configuration

### Environment
No `.env` file needed — the app uses the public DummyJSON API directly.

### Proxy (Optional)
For development with a backend, update `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

## 📦 Build

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Run tests
npm test
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Angular 17 | UI framework (standalone components) |
| TypeScript 5.3 | Type safety |
| SCSS | Styling with CSS variables |
| Angular Signals | Reactive state management |
| HttpClient | API communication |
| DummyJSON API | Product & auth data |
| Font Awesome | Icons |
| Inter Font | Typography |

## 🤖 AI Agent — How It Works

The AI Shopping Agent uses a **state machine** pattern:

1. **Greeting Phase** — Asks what the user wants to buy
2. **Collection Phase** — Gathers budget, brand, and priority preferences
3. **Search Phase** — Queries DummyJSON API with filters
4. **Recommendation Phase** — Shows top 5 products sorted by preferences
5. **Cart Phase** — Adds items and prepares for checkout
6. **Checkout Phase** — Redirects to payment

### Example Conversation
```
🤖 What are you looking to buy today?
👤 I want a smartphone under $500
🤖 Great choice! What's your budget?
👤 Under $300
🤖 What matters most? (best rated / cheapest / biggest discount)
👤 Best rated
🤖 Any preferred brand?
👤 Samsung
🤖 Here are my top recommendations:
   1. Samsung Galaxy S21 — $249.99 ⭐4.5
   2. Samsung Galaxy Note — $199.99 ⭐4.3
👤 Add all
🤖 ✅ Added 2 items to your cart! Cart Total: $449.98
👤 Checkout
🤖 🎉 Redirecting you to checkout...
```

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [DummyJSON](https://dummyjson.com) — Free fake REST API
- [Angular](https://angular.dev) — Platform for web apps
- [Font Awesome](https://fontawesome.com) — Icon library
- [Inter](https://rsms.me/inter) — Font family
