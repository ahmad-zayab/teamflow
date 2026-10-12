# TeamFlow

A collaborative project management workspace built as a full-stack monorepo with Next.js, NestJS, Prisma, and PostgreSQL.

Designed with production patterns in mind: strict multi-tenancy, optimistic UI mutations, end-to-end schema validation, and secure cookie-based session management.

---

## Architecture Overview

```
                      Browser (Next.js 16)
                      /                  \
      HTTPS / REST   /                    \  WebSockets (Socket.IO)
                    v                      v
          NestJS API (apps/api)      NestJS Gateway (Phase 3)
             |           \                 |
      Prisma |            \---> BullMQ --->| Redis 7 (pub/sub & cache)
             v
      PostgreSQL 15
```

### Monorepo Structure

The repository is managed using **pnpm workspaces**:

```
teamflow/
├── apps/
│   ├── api/            # NestJS backend API & Prisma ORM
│   └── web/            # Next.js App Router frontend
├── packages/
│   └── shared/         # Shared Zod schemas & TypeScript DTOs (@teamflow/shared)
├── docker-compose.yml  # Local PostgreSQL and Redis containers
└── docs/               # System architecture and implementation specs
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React 19, Tailwind CSS, TanStack Query, `@dnd-kit` |
| **Backend** | NestJS, TypeScript, Prisma ORM, `cookie-parser`, `bcrypt` |
| **Database & Cache** | PostgreSQL 15, Redis 7 (via Docker Compose) |
| **Validation** | Zod (shared package consumed by both frontend forms and backend pipes) |
| **Tooling & Monorepo** | pnpm Workspaces, Turbopack, Vitest |

---

## Engineering Highlights

- **Multi-Tenant Isolation:** All core entities (projects, columns, tasks, labels) belong to an `Organization`. Access is enforced server-side through `OrgGuard`, preventing cross-tenant data leakage.
- **Optimistic Drag-and-Drop:** The Kanban board (`@dnd-kit` + `@tanstack/react-query`) mutates local client state immediately upon drag completion. If the backend `PATCH /tasks/:id/move` fails, the state automatically rolls back to the previous snapshot.
- **Secure Authentication:** JWT access and refresh tokens are transported via `httpOnly`, `sameSite: strict` cookies, preventing JavaScript access and token theft via XSS.
- **Single Source of Truth for Schemas:** `@teamflow/shared` exports Zod schemas used by `react-hook-form` on the client and `ZodValidationPipe` in NestJS controllers, eliminating schema drift between client and server.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker Desktop** (for running PostgreSQL and Redis)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/teamflow.git
cd teamflow
pnpm install
```

### 2. Start Infrastructure (PostgreSQL & Redis)

Start the local database and Redis containers:

```bash
docker compose up -d
```

### 3. Environment Setup & Database Migration

Create the `.env` file in `apps/api`:

```bash
cp apps/api/.env.example apps/api/.env
```

Run database migrations and seed demo data:

```bash
# Push migrations to Postgres
pnpm --filter api exec prisma migrate dev

# Seed demo organization, project, columns, and tasks
pnpm --filter api exec tsx prisma/seed.ts
```

### 4. Run Development Servers

Start both the API and Web apps concurrently:

```bash
# Start backend (http://localhost:3000)
pnpm --filter api run start:dev

# In a separate terminal, start frontend (http://localhost:3001 or 3000)
pnpm --filter web run dev
```

---

## Seed / Demo Credentials

Once seeded, you can sign in with the pre-populated account:

- **Email:** `demo@teamflow.com`
- **Password:** `password123`
- **Preloaded Data:** `Acme Corp` organization with a `Product Launch` board, columns (*To Do*, *In Progress*, *Done*), and sample tasks.

---

## Project Roadmap

- [x] **Monorepo Architecture:** pnpm workspace with `@teamflow/shared` package.
- [x] **Prisma & Postgres:** Relational schema, multi-tenant indexes, and seeding.
- [x] **Authentication:** Cookie-based JWT auth (register, login, refresh, logout).
- [x] **Core Product:** Multi-tenant org guards, project management, and task CRUD.
- [x] **Kanban Board:** Column management, `@dnd-kit` drag-and-drop, and optimistic mutations.
- [ ] **Real-Time Collaboration:** Socket.IO project rooms for instant cross-client updates.
- [ ] **Live Presence:** Active viewers list and typing/movement indicators.
- [ ] **Background Queues:** BullMQ worker on Redis for task assignment notifications.
- [ ] **Automated Testing:** Vitest unit tests, Supertest integration tests, and Playwright E2E flows.
