# FinVault API

![Node](https://img.shields.io/badge/node-24-green)
![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> Production-ready REST API backend for financial investment platforms — built with security, performance, and scalability in mind.

## Overview

FinVault is a comprehensive backend system designed for investment and wealth management companies. It handles portfolio advisory services, wealth management content, career applications, and client inquiries with a focus on security, caching performance, and async job processing.

## Tech Stack

| Category | Technology | Reason |
|---|---|---|
| Runtime | Node.js 24 | Latest LTS, best performance |
| Framework | Express 5 | Lightweight, flexible |
| Language | TypeScript 5.9 | Type safety, better DX |
| Database | MongoDB + Mongoose | Flexible document storage |
| Cache | Redis + ioredis | Version-based invalidation |
| Auth | JWT (access + refresh) | Secure token rotation |
| Password | Argon2 | Winner of Password Hashing Competition, memory-hard algorithm |
| Validation | Zod | Schema = types, single source of truth |
| Queue | BullMQ | Async job processing with retries |
| Storage | Cloudflare R2 | S3-compatible file storage |
| Logging | Pino + pino-http | Structured production logging with request tracking |
| Email | Nodemailer | SMTP email delivery |
| Slug | slugify | Auto-generated URL slugs |
| Testing | Vitest + Supertest | Fast, isolated test suite |
| Container | Docker | Consistent environments |
| CI/CD | GitHub Actions | Automated testing and deployment |

## Architecture
```
Client
  ↓
Helmet + CORS
  ↓
Rate Limiter (4 tiers)
  ↓
Cookie Parser
  ↓
Route → Auth Middleware → Zod Validation → Controller → Service → Redis Cache → MongoDB
                                                              ↓
                                                         BullMQ Queue
                                                              ↓
                                                    Email Worker / R2 Worker
```

Clean layered architecture with single responsibility per layer:
- **Routes** — path definitions and middleware chains
- **Middlewares** — JWT auth, rate limiting, Zod validation
- **Controllers** — HTTP concerns only, thin layer
- **Services** — business logic and cache strategy
- **Models** — Mongoose schemas and indexes
- **Workers** — async job processors for email and file operations

## Key Design Decisions

### 1. Version-Based Cache Invalidation
Instead of wildcard SCAN patterns or key enumeration, cache is invalidated by incrementing a version counter. All list keys include the version — stale keys are never read again and expire via TTL.
```
blog:v{version}:{page}:{limit}:{filters}  ← list keys
blog:id:{id}                               ← detail keys  
blog:version                               ← version counter
```

On any write operation:
1. Specific detail key deleted instantly
2. Version incremented — all list keys become stale
3. TTL cleans up stale keys automatically

### 2. Four-Tier Rate Limiting
Each context has its own limiter with specific reasoning:

| Limiter | Applied To | Window | Limit | Key |
|---|---|---|---|---|
| `defaultLimiter` | All routes | 15 min | 600 | IP |
| `authLimiter` | Login/refresh | 15 min | 5 | IP |
| `authenticatedLimiter` | Protected routes | 15 min | 100 | User ID |
| `publicWriteLimiter` | Forms/applications | 1 hour | 30 | IP |

Authenticated routes keyed by **user ID not IP** — prevents shared office networks or VPNs from blocking legitimate admin access.

### 3. Async File Deletion via BullMQ
File uploads are synchronous — response depends on the URL. File deletions are async — user doesn't need to wait for R2 to respond.
```typescript
// Upload — sync, user needs URL immediately
const uploaded = await uploadToR2(imagePath);

// Delete — async, fire and forget with retry
enqueueR2Delete(publicId).catch(err => logger.error(err));
```

BullMQ handles 5 retry attempts with exponential backoff — temporary R2 failures never fail the user request.

### 4. JWT Refresh Token Rotation
- Access token: 15 minutes, HTTP-only cookie
- Refresh token: 7 days, stored in database
- On refresh: new refresh token generated, old one invalidated immediately
- Stolen token detection: if old token used after rotation, both sessions rejected

### 5. Graceful Redis Degradation
Every cache operation is wrapped in try/catch. If Redis goes down the app continues serving from MongoDB — never crashes due to cache failure.
```typescript
async get<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Redis error: ${error}`);
    return null; // falls through to MongoDB
  }
}
```

### 6. Three-Stage Soft Delete Pattern
Every resource implements three-stage deletion consistently:

| Stage | Endpoint | Description |
|---|---|---|
| Soft Delete | `PATCH /:id/delete` | Sets `isDeleted: true`, excluded from all queries |
| Restore | `PATCH /:id/restore` | Recovers soft-deleted resource |
| Hard Delete | `DELETE /:id/hard-delete` | Permanent deletion, only works on soft-deleted resources |

No data is permanently lost without explicit two-step intent.

### 7. Auto-Generated Unique Slugs
Blogs, Careers and Services auto-generate URL slugs from titles via Mongoose pre-save hooks. Duplicate titles handled automatically:
```
market-trends
market-trends-1
market-trends-2
```

Slugs update automatically when titles change.

### 8. Cacheable Resources

| Resource | TTL | Notes |
|---|---|---|
| Blogs | 10 min | Cached by version + filters |
| Careers | 10 min | Cached by version + filters |
| Services | 15 min | Cached by version + filters |
| Teams | 15 min | Cached by version + filters |
| Rewards | 15 min | Cached by version + filters |
| Contacts | Never | Write-heavy, real-time accuracy required |
| Applications | Never | Write-heavy, real-time accuracy required |

## API Resources

| Resource | Public Endpoints | Protected Endpoints |
|---|---|---|
| Auth | `POST /login` | `POST /logout`, `GET /me`, `PATCH /change-password` |
| Blogs | `GET /`, `GET /slug/:slug` | `GET /:id`, `POST /`, `PATCH /:id`, soft/hard delete |
| Services | `GET /`, `GET /slug/:slug` | `GET /:id`, `POST /`, `PATCH /:id`, toggle active, soft/hard delete |
| Careers | `GET /`, `GET /slug/:slug` | `GET /:id`, `POST /`, `PATCH /:id`, toggle active, soft/hard delete |
| Applications | `POST /:jobId` | `GET /`, `GET /:id`, `PATCH /:id/status`, soft/hard delete |
| Contacts | `POST /` | `GET /`, `GET /:id`, `PATCH /:id/status`, soft/hard delete |
| Teams | `GET /`, `GET /:id` | `POST /`, `PATCH /:id`, toggle active, soft/hard delete |
| Rewards | `GET /`, `GET /:id` | `POST /`, `PATCH /:id`, soft/hard delete |
| Dashboard | — | `GET /` — counts, recent items, status breakdowns |

Full API reference: [docs/api-endpoints.md](docs/api-endpoints.md)

## Project Structure
```
src/
├── app.ts                    # Express setup, middleware, route mounting
├── server.ts                 # Entry point, DB/Redis connection
├── config/                   # DB, Redis, R2, Multer, BullMQ config
├── controllers/              # HTTP request/response handlers
├── services/                 # Business logic + caching strategy
├── models/                   # Mongoose schemas and indexes
├── routes/                   # Route definitions
├── middlewares/              # Auth, error handler, rate limiters, tmp cleanup
├── validations/              # Zod schemas per resource
├── queues/                   # BullMQ queue definitions
├── workers/                  # BullMQ job processors
├── templates/                # Email HTML templates
└── utils/                    # Cache, JWT, logger, R2, slug, async handler
```

## Running Locally

### Prerequisites
- Node.js 24+
- pnpm
- MongoDB
- Redis
```bash
# Clone
git clone https://github.com/Sthamanik/FinVault.git
cd FinVault

# Install dependencies
pnpm install

# Environment setup
cp .env.example .env
# Fill in your values

# Start dev server
pnpm dev
```

### Docker
```bash
docker compose up
```

### Tests
```bash
cp .env.example .env.test
pnpm test:run
```

## CI/CD Pipeline

On every push to `main`:
1. **Test job** — spins up Redis service, runs full Vitest suite
2. **Build job** — builds Docker image, pushes to `ghcr.io/sthamanik/finvault:latest`

Build only runs if tests pass.

## Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URI` | Redis connection string |
| `ACCESS_TOKEN_SECRET` | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret |
| `ACCESS_TOKEN_EXPIRY` | Access token expiry (default: 15m) |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry (default: 7d) |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET` | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | R2 public URL |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `ADMIN_EMAIL` | Admin notification email |

## Architecture Deep Dive
See [docs/architecture.md](docs/architecture.md)

## API Documentation
See [docs/api-endpoints.md](docs/api-endpoints.md)

## Contributing
See [docs/contributions.md](docs/contributions.md)

## License
MIT