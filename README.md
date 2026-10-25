# AruStore (آرو استور)

Full-stack e-commerce platform for cast and kiln-anodized aluminum servingware, combining an interactive **3D WebGL storefront** (Next.js 14 + Three.js) with an asynchronous **FastAPI REST backend** (`API → Services → Models`).

---

## 1. What Is This Project?

**AruStore** is a bilingual (Persian RTL / English LTR) online store built specifically for showcasing and selling pure aluminum hospitality and tableware (tiered pastry stands, fluted pedestal bowls, serving trays, tea sets, and sculptural centerpieces):

- **Interactive 360° 3D Inspection:** Customers can rotate products in real time, preview anodized metallic finishes (Champagne Gold, Brushed Silver, Warm Bronze), and inspect exploded multi-part assemblies before ordering.
- **Layered Async Backend:** Versioned REST API (`/api/v1`) handling authentication, catalog filtering, persistent cart, promo codes, stock-checked order creation, verified-purchase reviews, wishlists, analytics, and admin management.
- **Zero-Config Local Mode + Full Docker Stack:** Runs out of the box with async SQLite and in-memory fallbacks for local development and CI testing, and scales to PostgreSQL, Redis, Elasticsearch, RabbitMQ, and Celery via Docker Compose.

---

## 2. Tech Stack & Architecture

### Backend (`backend/`)
- **Framework:** FastAPI `0.104`, Python `3.11`, Uvicorn
- **ORM & Database:** SQLAlchemy `2.0` (Async) — PostgreSQL `15` (`asyncpg`) in Docker/production, `aiosqlite` in local/CI mode
- **Validation & Settings:** Pydantic `v2`, `pydantic-settings`
- **Security:** OAuth2 / JWT access & refresh tokens (`python-jose`), `bcrypt` password hashing, token revocation blacklist
- **Cache & Search:** `redis.asyncio` (with automatic in-memory TTL fallback) and `AsyncElasticsearch` (with automatic SQL `ILIKE` fallback)
- **Background Jobs & Media:** Celery `5` tasks (email notifications, search indexing, analytics snapshots) and Pillow WebP image optimization
- **Testing:** `pytest`, `pytest-asyncio`, `httpx.AsyncClient`

### Frontend (`frontend/`)
- **Framework:** Next.js `14` (App Router), React `18`, TypeScript
- **3D Rendering:** Three.js, `@react-three/fiber`, `@react-three/drei` (procedural metallic geometry + WebGL error boundary fallback)
- **State & Styling:** Zustand, Tailwind CSS, `Shabnam FD` Persian typography

### Infrastructure
- `docker-compose.yml` / `docker-compose.prod.yml` (PostgreSQL, Redis, Elasticsearch, RabbitMQ, MinIO, Celery Worker/Beat, Backend, Frontend)
- `nginx/nginx.conf.nginx` reverse proxy
- `.github/workflows/ci-cd.yml` automated backend `pytest`, frontend production build, and Docker Compose validation

---

## 3. Repository Structure

```text
arustore/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                # Auth & admin FastAPI dependencies
│   │   │   └── v1/endpoints/          # 11 routers: auth, users, products, categories,
│   │   │                              # brands, cart, orders, reviews, wishlist, admin, analytics
│   │   ├── core/                      # Config, async DB engine, JWT security, Redis, ES, Celery
│   │   ├── models/                    # SQLAlchemy 2.0 ORM entities & relationships
│   │   ├── schemas/                   # Pydantic v2 request/response contracts
│   │   ├── services/                  # Domain logic, hybrid search, recommendations, catalog seed
│   │   ├── tasks/                     # Celery tasks (email, search sync, analytics)
│   │   └── utils/                     # Slugify, pagination, validators, Pillow WebP optimizer
│   ├── migrations/schema.sql          # PostgreSQL DDL & index reference
│   └── tests/                         # Async end-to-end API & utility test suite
├── frontend/
│   ├── app/                           # Next.js App Router pages ((main), (auth), (admin))
│   ├── components/                    # 3D scenes, product cards/gallery, cart, checkout, UI primitives
│   ├── hooks/                         # Cart, auth, product filtering, debounce hooks
│   └── lib/                           # Typed API client, catalog data, i18n, Zustand store
├── nginx/                             # Reverse-proxy configuration
├── docker-compose.yml                 # Full multi-container development stack
└── .github/workflows/ci-cd.yml        # Automated CI pipeline
```

---

## 4. Implementation Status

### Ready & Tested
- **Authentication & Accounts (`/api/v1/auth`, `/api/v1/users`):** Registration, form & JSON login, refresh token rotation, logout token revocation, user profile & shipping addresses.
- **Catalog, Filtering & Related Items (`/api/v1/products`, `/api/v1/categories`, `/api/v1/brands`):** Pagination, price/stock/sale/category/brand filters, hybrid search, slug or ID lookup, related product recommendations, and admin CRUD.
- **Shopping Cart & Discounts (`/api/v1/cart`):** Authenticated cart persistence, finish/edition price deltas, promo code validation (`ARU3D`, `VIP20`).
- **Orders & Inventory (`/api/v1/orders`):** Order creation from cart or direct payload, atomic stock verification & deduction, discount usage tracking, order status history.
- **Reviews & Wishlist (`/api/v1/reviews`, `/api/v1/wishlist`):** Verified-purchase badge detection, automatic product rating recalculation, user wishlists.
- **Admin & Analytics (`/api/v1/admin`, `/api/v1/analytics`):** Revenue/order/stock SQL aggregations, low-stock alerts, order status management, event tracking.
- **3D Storefront & Automated Tests:** Interactive 3D WebGL viewer, responsive RTL/LTR pages, passing `pytest` suite and Next.js production build.

### In Progress / Needed Before Live Production
- **Live Payment Gateway Callback:** `PaymentService` currently implements a signed HMAC sandbox flow; connect a live Shaparak/Zarinpal merchant callback before accepting real payments.
- **SMTP / SMS Provider Credentials:** Celery notification tasks are wired and tested in eager/broker modes, but require live SMTP or Kavenegar/SMS credentials in production.
- **Alembic Incremental Migrations:** Tables are created via SQLAlchemy metadata / `schema.sql`; add versioned Alembic revision scripts before running zero-downtime production schema upgrades.
- **Frontend State Sync:** Storefront interactive flows support instant client-side state alongside the typed `/api/v1` client (`frontend/lib/api/client.ts`); full server-only session enforcement should be enabled when deploying with live payments.

---

## 5. How to Run

### Option A — Local Development (No Docker Required)

**1. Start the Backend API (Port `8000`):**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

On first startup, the backend automatically creates a local `arustore.db` SQLite database and seeds 4 categories, 4 brands, 8 aluminum servingware products, promo codes (`ARU3D`, `VIP20`), and demo accounts:
- **Admin:** `admin@arustore.ir` / `Admin1234!`
- **Customer:** `arian@arustore.ir` / `Arian1234!`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`

**2. Start the Frontend (Port `3000`):**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Next.js automatically proxies `/api/v1/*` and `/docs` to the backend server.

### Option B — Full Stack with Docker Compose

```bash
docker compose up --build
```

Starts PostgreSQL `15`, Redis `7`, Elasticsearch `8.11`, RabbitMQ `3`, MinIO, Celery Worker & Beat, FastAPI Backend (`:8000`), and Next.js Frontend (`:3000`).

---

## 6. Running Tests & Build Checks

```bash
# Backend end-to-end API & unit tests
cd backend
pytest -v

# Frontend TypeScript & production build check
cd ../frontend
npm run build
```

---

## 7. API Overview (`/api/v1`)

| Prefix | Main Endpoints | Access |
| :--- | :--- | :--- |
| `/api/v1/auth` | Browser session (`AuthSessionResponse` + `HttpOnly` refresh cookie): `POST /register`, `POST /login`, `POST /login/json`, `POST /refresh`, `POST /logout` · Headless/API clients (`TokenResponse`, JSON-only, no cookies): `POST /token`, `POST /token/refresh` | Public / Auth |
| `/api/v1/users` | `GET /me`, `PATCH /me`, `GET /me/addresses`, `POST /me/addresses` | Authenticated |
| `/api/v1/products` | `GET /`, `GET /{id_or_slug}`, `GET /{id}/related`, `POST /`, `PATCH /{id}`, `DELETE /{id}` | Public / Admin |
| `/api/v1/categories` | `GET /`, `GET /{id_or_slug}`, `POST /` | Public / Admin |
| `/api/v1/brands` | `GET /`, `GET /{id_or_slug}`, `POST /` | Public / Admin |
| `/api/v1/cart` | `GET /`, `POST /items`, `PATCH /items/{id}`, `DELETE /items/{id}`, `POST /apply-promo` | Authenticated |
| `/api/v1/orders` | `POST /`, `GET /`, `GET /{order_id}` | Authenticated |
| `/api/v1/reviews` | `GET /product/{product_id}`, `POST /`, `DELETE /{review_id}` | Public / Auth |
| `/api/v1/wishlist` | `GET /`, `POST /{product_id}`, `DELETE /{product_id}` | Authenticated |
| `/api/v1/analytics` | `POST /events`, `GET /overview` | Public / Admin |
| `/api/v1/admin` | `GET /dashboard`, `GET /orders`, `PATCH /orders/{id}/status`, `GET /users` | Admin |
