# Architecture

## System Overview

Genesis Backend is a RESTful API for an investment company website. It serves a frontend client with content (blogs, services, careers, team) and handles user interactions (contact forms, job applications).

```
Client (Frontend)
      │
      ▼
Express API (Node.js + TypeScript)
      │
      ├── Redis (Cache Layer)
      │
      └── MongoDB (Primary Database)
              │
              └── Cloudinary (File Storage)
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
│   ├── cloudinary.config.ts    # Cloudinary SDK setup
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
├── middlewares/
│   ├── auth.middleware.ts       # JWT verification
│   ├── errorHandler.middleware.ts
│   └── rateLimit.middleware.ts  # Rate limit instances
│
├── validations/                # Zod schemas per resource
│
└── utils/
    ├── cache.utils.ts           # Redis get/set/delete/version helpers
    ├── cloudinary.utils.ts      # Upload/delete helpers
    ├── jwt.utils.ts             # Token generation/verification
    ├── logger.utils.ts          # Pino logger instance
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
{resource}:version                                   ← version counter
```

Examples:
```
blog:v2:1:10:published::finance:
blog:id:abc123
blog:version → 2
```

### Invalidation on Write

When an admin creates, updates, or deletes a resource:
1. The specific detail key is deleted: `cache.delete('blog:id:abc123')`
2. The version is incremented: `cache.incrementVersion('blog')`

Incrementing the version makes all existing list keys stale instantly — they're never read again. TTL eventually cleans them up.

### Graceful Degradation

If Redis is unavailable, the app continues to work — all cache operations catch errors and return `null`, falling through to MongoDB. The server never crashes due to Redis failure.

---

## Authentication

JWT-based auth with two tokens:

- **Access token** — short-lived (15min), sent as HTTP-only cookie and in response body
- **Refresh token** — long-lived (7d), sent as HTTP-only cookie and stored in DB

On login, both tokens are issued. On access token expiry, the client hits `/admin/refresh-token` with the refresh token to get a new access token.

The refresh token stored in the DB is compared on refresh — if it doesn't match (already used or rotated), the request is rejected.

---

## Rate Limiting

Four limiters applied at different levels:

| Limiter | Applied to | Window | Limit |
|---|---|---|---|
| `defaultLimiter` | All routes (global) | 15 min | 600 |
| `authLimiter` | Login, refresh token | 1 hour | 5 |
| `authenticatedLimiter` | All JWT-protected routes | 15 min | 100 (per user ID) |
| `publicWriteLimiter` | Contact, application POST | 1 hour | 30 |

Authenticated routes are rate limited by **user ID** (not IP) so admin actions aren't blocked by shared IPs.

---

## File Uploads

Files are handled by Multer — uploaded to a local `tmp/` directory first, then uploaded to Cloudinary. The local file is deleted after the Cloudinary upload.

On resource deletion, the Cloudinary file is also deleted via `deleteFromCloudinary(public_id)`.

---

## Soft Deletes

No data is hard deleted. All resources have an `isDeleted: boolean` flag. Deleted resources are filtered out in all queries with `{ isDeleted: false }`.

---

## Error Handling

All errors flow to the global error handler middleware. The custom `ApiError` class carries `statusCode`, `message`, and `errors[]` for validation errors.

Unhandled errors return a generic 500 response. In development, the stack trace is included.

---

## Infrastructure

| Service | Purpose |
|---|---|
| MongoDB | Primary data store |
| Redis | Cache layer |
| Cloudinary | Image/file storage |
| Docker | Containerization |
| GitHub Actions | CI/CD pipeline |
| ghcr.io | Docker image registry |

---

## CI/CD Pipeline

On push to `main`:

1. **Test job** — spins up Redis service, installs deps, runs Vitest tests
2. **Build and push job** — builds Docker image, pushes to `ghcr.io/sthamanik/genesis-backend:latest`

Build job only runs if tests pass (`needs: test`). Docker layers are cached via GitHub Actions cache for faster subsequent builds.