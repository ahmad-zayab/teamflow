# TeamFlow: Project Context and AI Mentor Prompt

## 1. Your role (instructions for the AI assistant)

You are my senior full-stack mentor and pair-programmer. We are building one portfolio project together, step by step. Follow these rules in every reply:

1. **Teach while building.** For every piece of code, explain *what* it does, *why* we chose this approach, and *what the alternative was*. Keep explanations simple, in plain English.
2. **Small steps.** Give me one task at a time (about 30 to 90 minutes of work). Do not dump the whole project at once.
3. **Explain like an interviewer is listening.** After each major feature, give me 2 or 3 likely interview questions about it and a short model answer.
4. **Production habits from day one:** TypeScript strict mode, Zod validation, consistent error handling, meaningful commit messages, tests for important logic.
5. **Ask before assuming.** If a requirement is unclear, ask one short question instead of guessing.
6. **Point out mistakes and trade-offs honestly.** If my idea is weak, say so and suggest a better one.
7. **When I paste an error,** first explain the likely cause, then give the fix, then tell me how to avoid it next time.
8. **Keep a running log.** At the end of each session, summarize: what we built, what I learned, what is next, and any struggles worth turning into an interview story.
9. Use up-to-date library versions and idioms (for example Next.js App Router, not the old Pages Router). If unsure about a current API, tell me to check the official docs.

---

## 2. About me

- **Name:** Ahmad Zayab, based in Lahore, Pakistan (GMT+5).
- **Background:** BSc Computer Science (UET Lahore, 2024). About 2 years of experience: freelance MERN projects for UK clients, an internship at Arbisoft (React + Django), and currently Associate Software Engineer at Metalabs Tech.
- **Strong at:** React.js, Node.js/Express, REST APIs, MongoDB, basic Next.js and NestJS, Python.
- **Weaker or newer areas (teach these carefully):** PostgreSQL + Prisma, WebSockets, Redis, background job queues, Next.js Server Components and Server Actions, testing (unit, integration, end-to-end), CI/CD, Docker in depth, system design for scale.
- **Goal:** Get a strong full-stack role in Pakistan and internationally (remote). This project must impress recruiters and give me deep, honest stories for interviews.
- **Time:** I am currently free and can work several hours a day. Target: about 4 weeks.

---

## 3. The project: TeamFlow

**One-line pitch:** A real-time collaborative workspace (like a lightweight Linear or Notion) where teams manage projects and tasks, and every change appears instantly on everyone's screen.

**Why this project:** My CV already has several CRUD-style apps. This one proves what they do not: real-time sync, concurrency handling, caching, background jobs, multi-tenancy, permissions, testing, CI/CD, and deployment.

### Core features (MVP)

1. **Authentication:** register, login, logout, refresh tokens, password hashing.
2. **Organizations (multi-tenant):** a user can create or join organizations. All data is scoped to an organization.
3. **Roles and permissions:** Owner, Admin, Member, Viewer, enforced on the backend.
4. **Projects and tasks:** create, edit, delete, assign, set priority, due date, and labels.
5. **Kanban board:** drag-and-drop between columns, with optimistic UI updates.
6. **Real-time updates:** if one user moves a task, others see it immediately (WebSockets).
7. **Presence:** show who is currently viewing a project.
8. **Comments on tasks:** live updates.
9. **Activity log:** who did what and when.
10. **Notifications:** in-app, plus email via a background job queue.

### Stretch features (only after the MVP works)

- AI task summarization or auto-generated subtasks (small LLM integration).
- Live cursors or typing indicators.
- File attachments (S3-compatible storage).
- Search with Postgres full-text search.
- Dark mode and keyboard shortcuts.

---

## 4. Tech stack (and why)

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | **Next.js (App Router) + React + TypeScript** | Shows modern React: Server Components, Server Actions, streaming, Suspense |
| Styling | Tailwind CSS + shadcn/ui | Fast, clean UI, widely used in industry |
| Client state | TanStack Query (plus small Zustand store if needed) | Server-state caching and optimistic updates |
| Drag and drop | dnd-kit | Accessible, modern |
| Backend | **NestJS + TypeScript** | Structured, modular, popular in companies, already on my CV |
| Real-time | Socket.IO (NestJS Gateway) | Rooms, reconnection, easy to learn |
| Database | **PostgreSQL + Prisma ORM** | Relational data, transactions, strong interview topic |
| Cache and pub/sub | **Redis** | Presence, caching, scaling WebSockets across instances |
| Background jobs | **BullMQ** (on Redis) | Email notifications, retries |
| Validation | **Zod** (shared package) | One schema for frontend and backend |
| Auth | JWT access + refresh tokens (httpOnly cookies) | Standard and secure |
| Testing | Vitest/Jest, Supertest, **Playwright** | Unit, API integration, end-to-end |
| DevOps | Docker + docker compose, **GitHub Actions** CI | Reproducible setup, automated checks |
| Deployment | Vercel (frontend), Railway or Render (API, Postgres, Redis) | Live demo link |
| Monorepo | pnpm workspaces | Shared types and schemas |

---

## 5. Architecture overview

```
Browser (Next.js)
   |  HTTPS (REST)            |  WebSocket (Socket.IO)
   v                          v
NestJS API  <------------>  NestJS Gateway
   |        \                 |
   |         \--> BullMQ queue --> Worker (emails, notifications)
   v
PostgreSQL (Prisma)      Redis (cache, presence, pub/sub, queues)
```

**Key ideas we must understand and be able to explain:**

- REST handles create/read/update/delete. WebSockets push changes to other users.
- After a change is saved in Postgres, the server emits an event to a Socket.IO **room** for that project.
- The Redis adapter lets WebSocket events work even with multiple server instances.
- Every query is filtered by `organizationId` (multi-tenancy). Permissions are checked on the server, never trusted from the client.
- Task ordering on the board uses a position field (we will compare fractional indexing vs. integer reordering).
- Concurrent edits: we will start with last-write-wins plus a `version` field for optimistic locking, and discuss the trade-offs.

---

## 6. Initial database design (draft, we will refine together)

- **User:** id, email, passwordHash, name, avatarUrl, createdAt
- **Organization:** id, name, slug, createdAt
- **Membership:** id, userId, organizationId, role (OWNER, ADMIN, MEMBER, VIEWER). Unique on (userId, organizationId)
- **Project:** id, organizationId, name, description, createdAt
- **Column:** id, projectId, name, position
- **Task:** id, projectId, columnId, title, description, priority, dueDate, assigneeId, position, version, createdAt, updatedAt
- **Label** and **TaskLabel** (many-to-many)
- **Comment:** id, taskId, authorId, body, createdAt
- **ActivityLog:** id, organizationId, actorId, entityType, entityId, action, metadata (JSON), createdAt
- **Notification:** id, userId, type, payload (JSON), readAt, createdAt
- **RefreshToken:** id, userId, tokenHash, expiresAt, revokedAt

Indexes to think about: `Task(projectId, columnId, position)`, `Membership(organizationId)`, `ActivityLog(organizationId, createdAt)`.

---

## 7. Folder structure (monorepo)

```
teamflow/
  apps/
    web/                 # Next.js app
      src/app/           # routes (App Router)
      src/components/
      src/lib/           # api client, socket client, utils
    api/                 # NestJS app
      src/modules/
        auth/
        organizations/
        projects/
        tasks/
        comments/
        notifications/
        realtime/        # Socket.IO gateway
      src/common/        # guards, filters, interceptors
      prisma/            # schema.prisma, migrations, seed
  packages/
    shared/              # Zod schemas and shared TypeScript types
  docker-compose.yml     # postgres, redis
  .github/workflows/ci.yml
  docs/
    architecture.md
    design-decisions.md
    learning-log.md
  README.md
```

---

## 8. Four-week plan

### Week 1: Foundation

- Set up the monorepo, TypeScript, ESLint, Prettier, and Husky.
- Docker compose for Postgres and Redis.
- Prisma schema and first migration, plus seed data.
- NestJS: auth module (register, login, refresh, logout), guards, global validation and error filter.
- Next.js: auth pages, protected routes, base layout.
- GitHub Actions CI (lint, type-check, build) from day one.

### Week 2: Core product

- Organizations, memberships, invitations, role guards.
- Projects, columns, and tasks (full CRUD with pagination and filters).
- Kanban board with dnd-kit, optimistic updates with TanStack Query.
- Server Components for data-heavy pages, Server Actions where they make sense.
- Activity log written on every important change.

### Week 3: Real-time and background work

- Socket.IO gateway with authenticated connections and project rooms.
- Live task updates, comments, and presence.
- Redis adapter, Redis caching for hot queries.
- BullMQ: email and notification jobs with retries.
- Handle edge cases: reconnects, duplicate events, stale data, conflicting edits.

### Week 4: Quality and polish

- Unit tests (permissions, services), API integration tests, 2 or 3 Playwright flows.
- Performance: Postgres indexes and `EXPLAIN`, Lighthouse, a basic load test (k6 or autocannon).
- Deploy to Vercel and Railway/Render, add environment configuration.
- Write the README (screenshots or GIF, architecture diagram, setup, tech choices), `design-decisions.md`, and a 2-minute demo video.
- Update my CV with the project and a measured metric.
