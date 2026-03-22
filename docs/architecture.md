# Architecture

## System Overview

FinVault Backend is a RESTful API for an investment company website. It serves a frontend client with content (blogs, services, careers, team) and handles user interactions (contact forms, job applications).
```
Client (Frontend)
      │
      ▼
Express API (Node.js + TypeScript)
      │
      ├── Redis (Cache Layer)
      │
      ├── BullMQ (Job Queue Layer)
      │     ├── Email Worker
      │     └── R2 Worker
      │
      └── MongoDB (Primary Database)
              │
              └── Cloudflare R2 (File Storage)
```

---

## Request Lifecycle

Every request follows this path:
```
Route → Middleware (auth/rate limit/validation) → Controller → Service → Cache/DB → Response
```

Each layer has a single responsibility:

- **Route** — defines path and attaches middleware chain
- **Middleware** — guards the request (JWT verification, rate limiting, Zod validation)
- **Controller** — handles HTTP concerns (req/res, status codes)
- **Service** — owns business logic, decides where data comes from (cache or DB)
- **Model** — defines data shape and DB interaction
- **Worker** — processes async jobs (email delivery, file deletion)

---

## Folder Structure
```
src/
├── app.ts                      # Express setup, middleware, route mounting
├── server.ts                   # Server entry point, DB/Redis connection
│
├── config/
│   ├── db.ts                   # MongoDB connection
│   ├── redis.config.ts         # Redis connection with graceful degradation
│   ├── r2.config.ts            # Cloudflare R2 S3 client setup
│   ├── bullmq.config.ts        # BullMQ connection config
│   ├── mailer.config.ts        # Nodemailer SMTP setup
│   └── multer.ts               # File upload config (tmp storage)
│
├── controllers/                # One class per resource
│   ├── admin/
│   ├── blog/
│   ├── career/
│   ├── services/
│   ├── team/
│   ├── reward/
│   ├── contact/
│   └── application/
│
├── services/                   # Business logic + caching
│   ├── admin/
│   ├── blog/
│   ├── career/
│   ├── services/
│   ├── team/
│   ├── reward/
│   ├── contact/
│   └── application/
│
├── models/                     # Mongoose schemas
│
├── routes/                     # Route definitions
│
├── queues/                     # BullMQ queue definitions
│   ├── email.queue.ts          # Email job types and enqueue helpers
│   └── r2.queue.ts             # R2 delete job types and enqueue helpers
│
├── workers/                    # BullMQ job processors
│   ├── email.worker.ts         # Processes email delivery jobs
│   └── r2.worker.ts            # Processes R2 file deletion jobs
│
├── templates/                  # Email HTML templates
│   └── email/
│       ├── newContact.email.ts
│       ├── newApplication.email.ts
│       └── applicationStatus.email.ts
│
├── middlewares/
│   ├── auth.middleware.ts           # JWT verification + refresh rotation
│   ├── errorHandler.middleware.ts   # Global error handler
│   ├── rateLimit.middleware.ts      # Four-tier rate limit instances
│   └── cleanupTmp.middleware.ts     # Orphaned tmp file cleanup on error
│
├── validations/                # Zod schemas per resource
│
└── utils/
    ├── cache.utils.ts           # Redis get/set/delete/version helpers
    ├── r2.utils.ts              # R2 upload/delete helpers
    ├── cleanTmp.utils.ts        # Stale tmp file sweeper
    ├── jwt.utils.ts             # Token generation/verification
    ├── logger.utils.ts          # Pino logger instance
    ├── slug.utils.ts            # Unique slug generation
    ├── asyncHandler.utils.ts    # Wraps async controllers
    ├── apiError.utils.ts        # Custom error class
    ├── apiResponse.utils.ts     # Standardized response shape
    └── validateWith.utils.ts    # Zod middleware factory
```

---

## Caching Strategy

Resources are cached using **cache-aside with version-based invalidation**.

### Cacheable Resources

| Resource | List TTL | Detail TTL |
|---|---|---|
| Blogs | 10 min | 10 min |
| Careers | 10 min | 10 min |
| Services | 15 min | 15 min |
| Teams | 15 min | 15 min |
| Rewards | 15 min | 15 min |

Contacts and Applications are never cached — they are write-heavy or require real-time accuracy.

### Cache Key Design
```
{resource}:v{version}:{page}:{limit}:{filters...}   ← list keys
{resource}:id:{id}                                   ← detail keys
{resource}:slug:{slug}                               ← slug keys
{resource}:version                                   ← version counter
```

Examples:
```
blog:v2:1:10:published::finance:
blog:id:abc123
blog:slug:market-trends
blog:version → 2
```

### Invalidation on Write

When an admin creates, updates, or deletes a resource:
1. The specific detail key is deleted: `cache.delete('blog:id:abc123')`
2. The slug key is deleted: `cache.delete('blog:slug:market-trends')`
3. The version is incremented: `cache.incrementVersion('blog')`

Incrementing the version makes all existing list keys stale instantly — they are never read again. TTL eventually cleans them up.

### Graceful Degradation

If Redis is unavailable, the app continues to work — all cache operations catch errors and return `null`, falling through to MongoDB. The server never crashes due to Redis failure.

---

## Authentication

JWT-based auth with two tokens:

- **Access token** — short-lived (15min), sent as HTTP-only cookie
- **Refresh token** — long-lived (7d), sent as HTTP-only cookie and stored in DB

On login, both tokens are issued. On access token expiry, the middleware automatically attempts refresh using the refresh token cookie — no client intervention needed.

The refresh token stored in the DB is compared on refresh — if it doesn't match (already used or rotated), the request is rejected. This enables stolen token detection.

---

## Rate Limiting

Four limiters applied at different levels:

| Limiter | Applied to | Window | Limit | Key |
|---|---|---|---|---|
| `defaultLimiter` | All routes (global) | 15 min | 600 | IP |
| `authLimiter` | Login | 15 min | 5 | IP |
| `authenticatedLimiter` | All JWT-protected routes | 15 min | 100 | User ID |
| `publicWriteLimiter` | Contact, application POST | 1 hour | 30 | IP |

Authenticated routes are rate limited by **user ID** (not IP) so admin actions aren't blocked by shared IPs or VPNs.

---

## File Uploads

Files are handled by Multer — uploaded to a local `tmp/` directory first, then uploaded to Cloudflare R2 via the AWS S3 SDK. The local file is deleted immediately after upload succeeds or fails.

On resource deletion, the R2 file is queued for async deletion via BullMQ with 5 retry attempts and exponential backoff — the HTTP response never waits for R2.

### Tmp File Cleanup

Three cleanup mechanisms prevent orphaned files:

- **On upload** — file deleted immediately after R2 upload
- **On error** — `cleanupTmpOnError` middleware deletes orphaned files if request fails mid-flight
- **On boot** — `cleanStaleTmpFiles()` sweeps tmp directory on server start
- **Scheduled** — sweeps every 15 minutes for files older than 1 hour

---

## Email System

Async email delivery powered by BullMQ and Nodemailer.

| Job Type | Trigger | Recipients |
|---|---|---|
| `contact.new` | Contact form submitted | Admin |
| `application.new` | Job application submitted | Admin + Applicant |
| `application.status_changed` | Application status updated | Applicant only |

All email jobs use **fire-and-forget** pattern — HTTP response never waits for email delivery. Failed jobs retry 3 times with exponential backoff.

---

## Soft Deletes

No data is hard deleted without explicit two-step intent. All resources have an `isDeleted: boolean` flag. Deleted resources are filtered out in all queries with `{ isDeleted: false }`.

Three-stage deletion pattern:

| Stage | Endpoint | Description |
|---|---|---|
| Soft Delete | `PATCH /:id/delete` | Sets `isDeleted: true`, excluded from all queries |
| Restore | `PATCH /:id/restore` | Recovers soft-deleted resource |
| Hard Delete | `DELETE /:id/hard-delete` | Permanent deletion, only works on soft-deleted resources |

---

## Error Handling

All errors flow to the global error handler middleware. The custom `ApiError` class carries `statusCode`, `message`, and `errors[]` for validation errors.

Every async controller and middleware is wrapped in `asyncHandler` — errors are caught and forwarded to the global handler automatically. No scattered try/catch in controllers.

Unhandled errors return a generic 500 response. In development, the stack trace is included.

---

## Auto-Generated Slugs

Blogs, Careers and Services auto-generate unique URL slugs from titles via Mongoose pre-save hooks. Duplicate titles get numeric suffixes automatically:
```
market-trends
market-trends-1
market-trends-2
```

Slugs update automatically when titles change.

---

## Infrastructure

| Service | Purpose |
|---|---|
| MongoDB | Primary data store |
| Redis | Cache layer |
| Cloudflare R2 | File storage via S3-compatible API |
| BullMQ | Async job queue for email and file operations |
| Nodemailer | SMTP email delivery |
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline |
| ghcr.io | Docker image registry |

---

## CI/CD Pipeline

On push to `main`:

1. **Test job** — spins up Redis service, installs deps, runs Vitest tests
2. **Build and push job** — builds Docker image, pushes to `ghcr.io/sthamanik/finvault:latest`

Build job only runs if tests pass (`needs: test`). Docker layers are cached via GitHub Actions cache for faster subsequent builds.