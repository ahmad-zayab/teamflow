# TeamFlow: AI Prompt Playbook

This document contains highly detailed, step-by-step prompts. You can copy and paste these into your AI assistant to build the TeamFlow project exactly according to our production-ready standards. 

## Phase 1: Foundation (Week 1)

### Prompt 1.1: Project Boilerplates
**Goal:** Initialize the Next.js, NestJS, and Shared packages within the pnpm workspace.

```text
Act as a senior full-stack developer. We are setting up a pnpm monorepo for a project called TeamFlow. Our workspace root is already configured. I need you to generate the exact terminal commands and file modifications to:

1. Initialize a Next.js App Router project in `apps/web`. Use TypeScript, Tailwind CSS, App Router, and ESLint. Skip the `src` directory if possible, or use standard defaults.
2. Initialize a NestJS project in `apps/api` using the Nest CLI. Configure it to use `pnpm`.
3. Create a shared TypeScript package in `packages/shared`. Create a `package.json` named `@teamflow/shared`, a `tsconfig.json`, and an empty `src/index.ts`.
4. Link the packages: Modify the `package.json` of both `apps/web` and `apps/api` to include `"@teamflow/shared": "workspace:*"` as a dependency.
5. Provide the commands to install all dependencies at the root.

Ensure no steps are missed. Output the commands clearly.
```

### Prompt 1.2: Database & Prisma Setup
**Goal:** Set up PostgreSQL schema and seeding.

```text
Act as a senior backend engineer. We need to set up Prisma ORM in our NestJS application (`apps/api`). We are using PostgreSQL.

1. Install `prisma` (dev dependency) and `@prisma/client` in `apps/api`. Initialize Prisma.
2. Write the complete `prisma/schema.prisma` file. We need the following models for a multi-tenant Kanban board:
   - User (id, email, passwordHash, name, createdAt)
   - Organization (id, name, slug, createdAt)
   - Membership (id, userId, organizationId, role [OWNER, ADMIN, MEMBER])
   - Project (id, organizationId, name, description, createdAt)
   - Column (id, projectId, name, position)
   - Task (id, projectId, columnId, title, description, position, version, createdAt, updatedAt)
   - RefreshToken (id, userId, tokenHash, expiresAt, revokedAt)
   Make sure to include all necessary relations and foreign keys (e.g., cascading deletes where appropriate).
3. Write a seed script (`prisma/seed.ts`) that clears the database and creates a demo user, a demo organization, a project, 3 columns (To Do, In Progress, Done), and a few dummy tasks.
4. Provide the exact commands to run the Prisma migration and execute the seed script.
```

### Prompt 1.3: NestJS Authentication Module
**Goal:** Build a secure API auth flow using HTTP-only cookies and Zod validation.

```text
Act as a senior backend security engineer. We need to build the Auth Module for our NestJS API (`apps/api`).

Requirements:
1. We will use JWTs. We need short-lived Access Tokens and long-lived Refresh Tokens.
2. Tokens MUST be returned to the client via `httpOnly`, `secure`, `sameSite='strict'` cookies, NOT in the JSON body.
3. Install necessary packages: `@nestjs/jwt`, `bcrypt`, `cookie-parser`. Enable `cookie-parser` in `main.ts`.
4. Create an `AuthModule`, `AuthService`, and `AuthController`. 
5. Implement endpoints:
   - `POST /auth/register`: Create user, hash password with bcrypt, set cookies.
   - `POST /auth/login`: Verify credentials, generate tokens, set cookies.
   - `POST /auth/logout`: Clear cookies.
   - `POST /auth/refresh`: Validate refresh token from cookie, issue new access token cookie.
6. Create Zod schemas for the Login and Register payloads. Place these schemas in `packages/shared/src/auth.schema.ts` and export them.
7. Create a custom NestJS `ZodValidationPipe` to validate incoming requests using these shared schemas.

Please provide the code for the schemas, the pipe, the controller, and the service.
```

### Prompt 1.4: Next.js Frontend Auth Pages & Protection
**Goal:** Build the UI for auth and protect private routes using Middleware.

```text
Act as a senior frontend engineer. We need to connect our Next.js App Router (`apps/web`) to our NestJS auth API.

Requirements:
1. Install `zod`, `react-hook-form`, `@hookform/resolvers`, and `axios`.
2. Configure a singleton Axios client in `src/lib/api.ts` that includes `withCredentials: true` so it automatically sends the HTTP-only cookies to the backend.
3. Create a `/login` and `/register` page. Build modern, clean forms using Tailwind CSS. 
4. Import the Zod schemas from `@teamflow/shared` and use them with `react-hook-form` to validate the frontend inputs before submitting.
5. Create a `middleware.ts` file at the root of `apps/web`. It should intercept requests to private routes (like `/dashboard` or `/projects`). If the access token cookie is missing, redirect the user to `/login`.
6. Provide the code for the Axios client, the Middleware, and the Login page component.
```

---

## Phase 2: Core Product (Week 2)

### Prompt 2.1: Multi-Tenancy & Organizations
**Goal:** Ensure all data access is strictly scoped to an Organization.

```text
Act as a backend engineer. We need to implement multi-tenancy in our NestJS API. All data (projects, tasks) belongs to an Organization.

1. Create an `OrganizationsModule`. 
2. Implement endpoints to Create, Read, Update, and List organizations for the logged-in user.
3. Create an `OrgGuard` (NestJS Guard) that checks if the logged-in user (from JWT) actually has a `Membership` in the `organizationId` provided in the route params or headers.
4. Apply this guard so that no user can access projects or tasks for an organization they do not belong to.
5. Create the shared Zod schemas for creating an organization in `@teamflow/shared`.
```

### Prompt 2.2: Projects, Columns, and Tasks CRUD
**Goal:** Build the core REST APIs for the Kanban board entities.

```text
Act as a backend engineer. We need CRUD operations for Projects, Columns, and Tasks in our NestJS API.

1. Create `ProjectsModule`, `ColumnsModule`, and `TasksModule`.
2. Ensure every endpoint enforces the `OrgGuard` (users must be in the org to view/edit projects).
3. The Task entity has a `position` field (integer or float). Write the logic for creating a task so it gets appended to the bottom of a column by default.
4. Implement an endpoint `PATCH /tasks/:id/move` that takes a `newColumnId` and `newPosition`. Update the database accordingly. Use a database transaction to ensure data consistency.
5. Update `@teamflow/shared` with the necessary DTO Zod schemas for these operations.
```

### Prompt 2.3: Frontend Kanban Board (dnd-kit)
**Goal:** Build the drag-and-drop UI with optimistic updates.

```text
Act as a senior React engineer. We are building a Kanban board in Next.js using `dnd-kit` and `@tanstack/react-query`.

1. We need a `/dashboard/projects/[projectId]` page. It will fetch Columns and Tasks from our API.
2. Implement drag-and-drop using `@dnd-kit/core` and `@dnd-kit/sortable`. Users must be able to drag tasks within the same column, and move them between different columns.
3. Integrate TanStack Query for data fetching.
4. Implement "Optimistic Updates". When a task is dropped, instantly update the React Query cache so the UI feels instant, then make the `PATCH /tasks/:id/move` API call in the background. If the API fails, roll back the UI.
5. Provide the code for the main Board component, the Column component, and the Task Card component.
```

---

## Phase 3: Real-Time & Background Work (Week 3)

### Prompt 3.1: Socket.IO Gateway & Event Broadcasting (NestJS API)
**Goal:** Set up authenticated WebSockets and project-specific rooms to broadcast task changes.

```text
Act as a senior backend engineer. We need to add real-time WebSocket capabilities to our NestJS API (`apps/api`).

Requirements:
1. Install `@nestjs/websockets`, `@nestjs/platform-socket.io`, and `socket.io`.
2. Create a `RealtimeModule` with a `RealtimeGateway`.
3. Configure WebSocket authentication: In the connection handshake, extract the `accessToken` (from cookies or handshake auth), verify it using `JwtService`, and attach the authenticated `user` to the socket instance. Reject unauthenticated connections.
4. Implement room management:
   - Handle `@SubscribeMessage('join:project')`: Validate that the user belongs to the project's organization, then call `client.join(`project:${projectId}`)`.
   - Handle `@SubscribeMessage('leave:project')`: Call `client.leave(`project:${projectId}`)`.
5. Integrate with `TasksService`: Inject `RealtimeGateway` into `TasksService`. When a task is created, updated, deleted, or moved, broadcast the event to the room `project:${projectId}`:
   - `task:created`
   - `task:updated`
   - `task:moved`
   - `task:deleted`
6. Provide the complete code for `RealtimeModule`, `RealtimeGateway`, WebSocket auth guard, and the updated `TasksService`.
```

### Prompt 3.2: Redis Adapter for WebSockets & Board Caching
**Goal:** Enable horizontal scaling for WebSockets using Redis and cache heavy board queries.

```text
Act as a senior backend engineer specializing in distributed systems. We need to integrate Redis for Socket.IO multi-instance pub/sub and query caching in `apps/api`.

Requirements:
1. Install `@socket.io/redis-adapter` and `ioredis`.
2. Create a custom Socket.IO adapter in NestJS (`redis-io.adapter.ts`) that connects to our local Redis instance (`localhost:6379`). Configure NestJS in `main.ts` to use this adapter so WebSocket events work seamlessly across multiple server instances.
3. Create a `RedisService` or Redis provider inside a shared cache module.
4. Add caching to `ProjectsService.findOne`: Cache the project board (columns + tasks) in Redis with a TTL of 60 seconds (key: `cache:project:${projectId}`).
5. Invalidate the cache whenever a task is created, updated, or moved so that queries always return fresh data.
6. Provide the code for the Redis adapter, `main.ts` configuration, and the updated `ProjectsService`.
```

### Prompt 3.3: Frontend Real-Time Sync & Live Presence (Next.js)
**Goal:** Connect the Next.js Kanban board to WebSockets and display active user presence.

```text
Act as a senior frontend engineer. We need to connect our Next.js App Router (`apps/web`) Kanban board to our NestJS Socket.IO gateway.

Requirements:
1. Install `socket.io-client`.
2. Create a `SocketProvider` and a `useSocket` hook in `src/lib/socket.tsx` that manages the connection to `http://localhost:3000` (or `NEXT_PUBLIC_API_URL`) with `withCredentials: true`.
3. In `/dashboard/projects/[projectId]/page.tsx`:
   - Join the project room on mount (`join:project`, { projectId }) and leave on unmount.
   - Listen for `task:moved`, `task:created`, and `task:deleted`. Update the TanStack Query cache (`queryClient.setQueryData`) so changes appear instantly on screen without a manual reload.
4. Implement Live Presence:
   - When joining the room, emit `presence:join` with current user's name, avatar, and ID.
   - Gateway tracks online users for the project room and emits `presence:update` (list of active users).
   - Render active user avatars in the Kanban board header with an online indicator badge.
5. Provide the code for `SocketProvider`, the presence tracking integration, and the updated `Board` / `ProjectPage`.
```

### Prompt 3.4: Background Job Queue with BullMQ (Email & Notifications)
**Goal:** Asynchronously process notifications and email jobs with retries.

```text
Act as a senior backend engineer. We need to add background job processing to our NestJS API using BullMQ and Redis.

Requirements:
1. Install `bullmq` and `@nestjs/bullmq` (or `@nestjs/bull`) in `apps/api`.
2. Create a `NotificationsModule` with a Bull queue named `notifications`.
3. Create a job processor (`notifications.processor.ts`) that handles:
   - `task-assigned`: Simulates sending an email notification to the assignee with exponential backoff retries (3 attempts).
   - Saves an in-app `Notification` record in PostgreSQL using Prisma.
4. Inject the queue into `TasksService`. When a task is created or updated with an `assigneeId`, dispatch the `task-assigned` job to BullMQ.
5. Provide the code for the `NotificationsModule`, the processor, and the dispatch logic in `TasksService`.
```

---

## Phase 4: Quality & Production Polish (Week 4)

### Prompt 4.1: Automated Testing Suite (Vitest & Supertest)
**Goal:** Add unit tests for business logic and integration tests for auth and permissions.

```text
Act as a senior QA/testing engineer. We need a comprehensive test suite for our NestJS API (`apps/api`) using Vitest and Supertest.

Requirements:
1. Unit tests:
   - Write tests for `OrgGuard` to verify that unauthorized users get a 403 Forbidden.
   - Write tests for fractional position calculation when moving tasks.
2. Integration tests (Supertest):
   - Test the complete auth flow: Register -> Login -> check cookies -> Refresh token -> Logout.
   - Test Task creation and moving within columns.
3. Configure scripts in `package.json` to run tests and output coverage.
```

### Prompt 4.2: Production Docker & GitHub Actions CI
**Goal:** Automate build checks and containerize the application.

```text
Act as a DevOps engineer. We need to finalize the CI pipeline and Docker setup for TeamFlow.

Requirements:
1. Create a root `.github/workflows/ci.yml` that triggers on push and pull requests to `main`:
   - Sets up Node.js and pnpm.
   - Runs `pnpm install --frozen-lockfile`.
   - Runs linting (`pnpm lint`).
   - Runs type-checking across all workspaces.
   - Runs automated tests.
2. Create production multi-stage `Dockerfile` for `apps/api` and `apps/web`.
3. Provide instructions on deploying to Railway/Render (API + Postgres + Redis) and Vercel (Next.js).
```
