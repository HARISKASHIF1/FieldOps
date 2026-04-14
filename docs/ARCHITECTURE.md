# FieldOps — Architecture Document

## 1. System Overview

FieldOps is a multi-role, REST-based web application. It separates concerns cleanly across three layers:

```
[ React SPA ]  ──HTTP/JSON──►  [ Express REST API ]  ──SQL──►  [ PostgreSQL ]
   port 3000                        port 5000
```

In development, Vite proxies `/api` requests to the backend, eliminating CORS complexity. In production these would be separate deployed services behind a reverse proxy (nginx).

---

## 2. Tech Stack Choices

### Backend: Node.js + Express + TypeScript
- **Why Node/Express**: Lightweight, fast to scaffold, large ecosystem. TypeScript adds safety without a heavy framework overhead.
- **Why not NestJS**: Overkill for an MVP. NestJS adds abstraction layers that slow early development. Express gives full control.
- **Why raw `pg` over an ORM**: ORMs (Prisma, TypeORM) add magic and migration complexity. Raw SQL is explicit, debuggable, and performant. For this scale, it's the right call.
- **Zod** for request validation: Runtime schema validation that doubles as TypeScript type inference.

### Frontend: React + Vite + TypeScript + Tailwind
- **React**: Industry standard, component model suits a multi-view dashboard well.
- **Vite**: Significantly faster DX than CRA or webpack. Near-instant HMR.
- **Zustand**: Minimal, boilerplate-free state management. Redux is overkill for auth + a few shared states.
- **Tailwind**: Utility-first CSS. No context-switching between files. Consistent design tokens.

### Database: PostgreSQL
- Relational data with real foreign key constraints. Jobs belong to clients, assigned to technicians — that's a relational problem.
- JSONB for metadata fields (activity log context) gives flexibility without a separate NoSQL store.
- UUID primary keys prevent enumeration attacks.

---

## 3. Database Design

### Schema Rationale

```
users ──────────────────────────────────────────────────────────┐
  id, name, email, password, role, is_active                    │
                                                                 │
jobs ───────────────────────────────────────────────────────────┤
  id, title, description, status                                │
  client_id     → users(id)   [the requesting client]           │
  technician_id → users(id)   [nullable — may be unassigned]    │
  created_by    → users(id)   [who created it, always admin]    │
  deleted_at    [soft delete]                                    │
                                                                 │
job_activities ─────────────────────────────────────────────────┤
  job_id → jobs(id)                                             │
  user_id → users(id)                                           │
  type: note | status_change | assignment | system               │
  content, metadata (JSONB)                                      │
  [append-only — never updated or deleted]                       │
                                                                 │
notifications ──────────────────────────────────────────────────┤
  user_id → users(id)                                           │
  job_id  → jobs(id)  [nullable]                                │
  is_read BOOLEAN                                                │
                                                                 │
audit_logs ─────────────────────────────────────────────────────┤
  user_id → users(id)  [nullable — for system actions]          │
  action, entity, entity_id, changes (JSONB), ip_address        │
  [append-only — permanent record]                               │
                                                                 │
refresh_tokens ─────────────────────────────────────────────────┘
  user_id → users(id) CASCADE DELETE
  token, expires_at
```

### Key Design Decisions
- **Soft deletes on jobs**: `deleted_at IS NULL` in all queries. Data is never lost.
- **`job_activities` is append-only**: Every status change, assignment, and note creates a new row. This gives a complete immutable timeline. Never UPDATE this table.
- **`audit_logs` separate from `job_activities`**: Activities are domain events (visible to users). Audit logs are security/compliance records (admin-only). Mixing them conflates user-facing UX with internal logging.
- **Single `users` table for all roles**: Avoids join complexity. Role is a discriminator column. Justified because all roles share the same auth flow and most profile fields.

### Indexes
```sql
idx_jobs_client_id      -- client dashboard queries
idx_jobs_technician_id  -- technician job list
idx_jobs_status         -- admin status filtering
idx_jobs_deleted_at     -- soft delete filtering
idx_job_activities_job  -- timeline fetches
idx_notifications_user  -- notification bell queries
```

---

## 4. Authentication Strategy

- **JWT Access Tokens** (15 min expiry): Short-lived, stateless. Validated on every request via `authenticate` middleware.
- **Refresh Tokens** (7 day expiry): Stored in `refresh_tokens` table. Rotatable, revocable. On logout, token is deleted from DB — instant invalidation.
- **RBAC via middleware**: `authorize(...roles)` middleware applied at the route level. Clean, declarative, easy to audit.
- **bcryptjs** with salt rounds = 10: Industry standard. Protects against rainbow table attacks.
- **Rate limiting on `/api/auth/*`**: 20 requests per 15 minutes per IP. Prevents brute force.

### Auth Flow
```
Login → validate credentials → issue accessToken + refreshToken
     → store refreshToken in DB

Request → attach Bearer accessToken → middleware verifies JWT
       → if 401 → frontend interceptor calls /auth/refresh
       → if refresh valid → new accessToken issued
       → if refresh invalid/expired → force logout
```

---

## 5. Role-Based Access Summary

| Action                    | Admin | Technician | Client |
|---------------------------|-------|------------|--------|
| Create job                | ✅    | ❌         | ❌     |
| View all jobs             | ✅    | ❌ (own)   | ❌ (own) |
| Update job (full)         | ✅    | ❌         | ❌     |
| Update job status         | ✅    | ✅ (own)   | ❌     |
| Reassign technician       | ✅    | ❌         | ❌     |
| Add notes                 | ✅    | ✅ (own)   | ✅ (own) |
| Delete job (soft)         | ✅    | ❌         | ❌     |
| View users                | ✅    | ❌         | ❌     |
| Deactivate users          | ✅    | ❌         | ❌     |
| View dashboard            | ✅    | ❌         | ❌     |

---

## 6. Notification Strategy

**Chosen approach**: In-app notifications stored in PostgreSQL.

**Why not email**: Requires SMTP setup, environment-specific config, and delivery infrastructure. Adds external dependency that breaks the "runs locally without paid services" constraint.

**Why not WebSockets**: Real-time push is valuable but out of scope for MVP. The notification table can be polled or upgraded to SSE/WebSocket later with zero schema changes.

**Why not a queue (BullMQ)**: Notifications here are synchronous writes to a local table — sub-millisecond. A queue adds operational complexity (Redis) that isn't justified until notification volume or retry logic is needed.

**Upgrade path**: The `notify()` service function is the single integration point. Swapping it to send email + create DB record is a one-file change.

---

## 7. What Was Deliberately NOT Built

### Email notifications
**Why skipped**: Would require either a paid service (SendGrid, Resend) or local SMTP setup (Mailhog), both adding setup friction. The in-app notification system satisfies the "inform relevant parties" requirement pragmatically.

### Docker + docker-compose
**Why skipped**: Time constraint. The local setup is straightforward with documented steps. Docker would be the next addition — both services are stateless and containerise trivially.

### Background job queue (BullMQ)
**Why skipped**: Current notification volume doesn't warrant async processing. All notification writes are fast DB inserts. A queue would be added when: (a) email is introduced with retry logic, or (b) notification fanout becomes expensive.

---

## 8. Scalability Considerations

Even at MVP, the architecture supports growth:

- **Stateless API**: No server-side session state. Horizontal scaling behind a load balancer is trivial — just share the DB connection string.
- **Connection pooling**: `pg.Pool` with `max: 20`. Prevents connection exhaustion under load.
- **Indexed queries**: All high-frequency filters (by client, technician, status) are indexed.
- **Soft deletes**: Preserves referential integrity as data grows. Archive jobs instead of running DELETEs.
- **Audit log is append-only**: Never creates UPDATE lock contention.

**When to add what**:
- 10k jobs/day → add Redis caching for dashboard aggregates
- Email notifications → add BullMQ + Redis queue
- Multi-region → read replicas for job list queries
