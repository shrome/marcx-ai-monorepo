# marcx-ai — AI-Powered Accounting Platform

A full-stack monorepo for an AI-powered accounting platform. Users interact via chat sessions, upload invoices and financial documents, and the system automatically extracts, classifies, and compiles them into a general ledger.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js (App Router), Tailwind CSS, Shadcn UI, React Query |
| Backend | NestJS (modular architecture) |
| Database | PostgreSQL via Drizzle ORM (`@marcx/db` shared package) |
| Storage | AWS S3 (presigned URLs) |
| AI API | Django + LangGraph (external, under `/ai-api`) |
| Auth | Email OTP (JWT + refresh tokens) |

---

## Project Structure

```
marcx-ai-monorepo/
├── apps/
│   ├── backend/          # NestJS API server
│   └── web/              # Next.js frontend
├── packages/
│   └── drizzle/          # @marcx/db — shared Drizzle ORM schema + client
├── ai-api/               # Django/LangGraph AI service specs
├── docs/
│   └── checkpoints/      # Progress history — read before making changes
├── scripts/
│   └── test-db.sh        # Test database lifecycle (start/migrate/stop)
├── docker-compose.yml
└── IMPLEMENTATION_PLAN.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL + Redis)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

```bash
# Root — backend uses this
cp .env.example .env       # fill in DB, JWT, AWS, Resend keys

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
```

### 3. Start infrastructure

```bash
docker-compose up -d       # starts postgres + redis + pgbouncer
```

### 4. Build the DB package (required before running backend)

```bash
pnpm --filter @marcx/db build
```

### 5. Run database migrations

```bash
cd packages/drizzle && pnpm db:migrate
```

### 6. Start dev servers

```bash
# Backend (http://localhost:4000)
cd apps/backend && pnpm dev

# Frontend (http://localhost:3000)
cd apps/web && pnpm dev
```

Or run everything at once from the root:

```bash
pnpm dev
```

---

## API Documentation

Start the backend, then open:

| URL | Description |
|-----|-------------|
| `http://localhost:4000/api/docs` | **Scalar UI** — interactive API explorer |
| `http://localhost:4000/api/docs/swagger` | Raw OpenAPI JSON + Swagger UI |

---

## Testing

### Backend E2E Tests

```bash
# 1. Start the test database
bash scripts/test-db.sh start

# 2. Run migrations against test DB
bash scripts/test-db.sh migrate

# 3. Run all 73 E2E tests
cd apps/backend && pnpm test:e2e
```

The test suite uses an isolated PostgreSQL container (port 15433). Email and S3 are fully mocked — no real credentials needed.

### Frontend E2E Tests (Playwright)

Requires both servers running with `TEST_FIXED_OTP=000000` set on the backend:

```bash
# Install browser (first time only)
cd apps/web && npx playwright install chromium

# Run tests
cd apps/web && pnpm test:e2e

# Open interactive UI
cd apps/web && pnpm test:e2e:ui
```

---

## Key Modules (Backend)

| Module | Description |
|--------|-------------|
| `auth` | Email OTP registration + login, JWT + refresh tokens |
| `user` | Profile management |
| `company` | Multi-tenant company setup |
| `company-member` | Role-based access (OWNER / ADMIN / ACCOUNTANT / VIEWER) |
| `document` | File upload to S3, AI extraction pipeline |
| `session` | Chat sessions |
| `chat` | AI chat messages (proxied to AI API) |
| `billing` | Company credits + transaction history |
| `activity-log` | Audit trail |
| `ai-proxy` | Forwards requests to the external AI API |

---

## Progress & Handoff

> **Always read this before making changes.**

This project uses a checkpoint system. Before writing any code, read:

1. `docs/checkpoints/index.md` — summary of all progress
2. The latest checkpoint file (highest number)
3. `IMPLEMENTATION_PLAN.md` — full phase plan and current status

See `.github/copilot-instructions.md` for the full rules.

