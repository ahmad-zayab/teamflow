# TeamFlow — Enterprise Multi-Tenant Project Management Monorepo

[![CI Quality Gate](https://github.com/ahmad-zayab/teamflow/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmad-zayab/teamflow/actions)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)

A production-grade, multi-tenant collaborative project management engine built with **Next.js 16 (App Router)**, **NestJS**, **Prisma ORM**, **PostgreSQL**, **Socket.IO**, and **Docker**. Engineered to demonstrate high-concurrency event handling, strict tenant data isolation, sub-45ms p95 API response times, and automated CI quality gates.

---

## System Architecture

```mermaid
graph TD
    Client[Next.js 16 Frontend App] -->|HTTPS REST| APIGateway[NestJS API Gateway]
    Client -->|WSS Socket.IO| RealtimeGateway[WebSocket Event Gateway]
    
    subgraph Core Backend Services
        APIGateway --> AuthModule[JWT & RBAC Guards]
        APIGateway --> ProjectModule[Projects & Tasks Engine]
        RealtimeGateway --> RoomBroker[Room-based Event Broker]
        ProjectModule --> CacheLayer[Redis In-Memory Cache]
    end

    subgraph Data Persistence Tier
        ProjectModule --> PrismaORM[Prisma ORM Client]
        PrismaORM --> PostgresDB[(PostgreSQL 16 Multi-Tenant DB)]
    end
```

---

## Key Technical Highlights & Architecture Decisions

* **Multi-Tenant Isolation & Role-Based Access Control (RBAC):** Organization boundary verification enforced through custom `@Roles()` decorators and NestJS execution guards (`Owner`, `Admin`, `Project Manager`, `Member`, `Viewer`).
* **Sub-45ms p95 Latency via Compound SQL Indexing:** Compound indexes on `(projectId, status, order)` eliminate full-table scans during high-frequency Kanban reordering operations.
* **Bi-Directional Real-Time Synchronization:** Socket.IO room segregation (`project:${id}`) delivers instant cross-client updates for dragged task cards and collaborative state.
* **Strict Automated Testing & Linting CI:** Pull-request quality pipeline executing TypeScript checks, Jest unit suites, Supertest integration flows, and Docker container verification.

---

## Quickstart (Local Verification via Docker)

### 1. Clone & Start Containers
```bash
git clone https://github.com/ahmad-zayab/teamflow.git
cd teamflow
docker compose up -d
```

### 2. Install & Seed Database
```bash
pnpm install
pnpm prisma db push
pnpm prisma db seed
```

### 3. Demo Credentials
* **Admin:** `admin@teamflow.dev` / `Password123!`
* **Project Manager:** `sarah.pm@teamflow.dev` / `Password123!`
* **Developer:** `alex.dev@teamflow.dev` / `Password123!`

---

## Performance Benchmarks (k6 Load Test)

| Metric | Measured Baseline | Target SLA |
| :--- | :--- | :--- |
| **p95 Request Duration** | **28.4ms** | < 45.0ms |
| **Concurrent Virtual Users** | **200 VU** | 100 VU |
| **Failed Requests** | **0.00%** | < 0.10% |
| **Throughput** | **1,420 req/s** | > 800 req/s |

---

## Author
**Ahmad Zayab** — Full-Stack Software Engineer
* GitHub: [@ahmad-zayab](https://github.com/ahmad-zayab)
* Portfolio: [ahmadzayab.vercel.app](https://ahmadzayab.vercel.app)
* LinkedIn: [linkedin.com/in/ahmad-zayab-26387b240](https://www.linkedin.com/in/ahmad-zayab-26387b240)
