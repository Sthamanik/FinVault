# Contributing

## Prerequisites

- Node.js 24+
- pnpm
- MongoDB running locally
- Redis running locally
```bash
brew install redis
brew services start redis
```

---

## Local Setup
```bash
# Clone the repo
git clone https://github.com/Sthamanik/FinVault.git
cd FinVault

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Fill in your values

# Setup test environment
cp .env.example .env.test

# Start dev server
pnpm dev
```

---

## Running Tests

Tests use MongoMemoryServer (no real MongoDB needed) and a local Redis instance.
```bash
# Make sure Redis is running
redis-cli ping  # should return PONG

# Run tests
pnpm test:run

# Run tests in watch mode
pnpm test
```

All tests must pass before opening a PR.

---

## Project Structure

Read [architecture.md](architecture.md) before making changes. Understand which layer your change belongs in before writing code:

- New endpoint → route + controller + service + validation
- New business logic → service only
- New utility → `utils/`
- New config → `config/`
- New queue job → `queues/` + `workers/`
- New email template → `templates/email/`

---

## Branch Naming
```
feature/short-description       # new features
fix/short-description           # bug fixes
refactor/short-description      # refactoring
docs/short-description          # documentation only
chore/short-description         # build, CI, tooling changes
```

Examples:
```
feature/add-newsletter-endpoint
fix/career-duplicate-check
refactor/extract-cache-middleware
docs/update-api-endpoints
chore/update-pnpm
```

---

## Commit Messages

Follow conventional commits format:
```
type(scope): short description (max 72 chars)
```

Types:
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `docs` — documentation only
- `test` — adding or updating tests
- `chore` — build process, CI, dependencies
- `perf` — performance improvement

Examples:
```
feat(auth): implement JWT refresh token rotation
feat(cache): add version-based cache invalidation
fix(career): correct duplicate check on restore
refactor(rateLimit): extract config from middleware
docs(api): add missing restore endpoints
test(blog): add cache invalidation tests
chore(deps): update pnpm to 10.32.1
```

Do not use vague messages like `fix stuff`, `update`, `wip`, or `fix: bug fix`.

---

## Code Style

### General

- TypeScript strict mode is enabled — no `any` unless absolutely necessary
- All async functions must handle errors — use `asyncHandler` for controllers and middlewares
- Services never throw generic errors — always use `ApiError` with appropriate status codes
- No `console.log` — use the pino `logger` from `@utils/logger.utils`

### Services

- Cache logic lives in services, not controllers
- Every write operation (create/update/delete) must invalidate relevant cache keys
- Use `Promise.all` for parallel cache operations on write
```ts
// correct
await Promise.all([
  cache.delete(`blog:id:${id}`),
  cache.delete(`blog:slug:${blog.slug}`),
  cache.incrementVersion('blog')
]);

// wrong
await cache.delete(`blog:id:${id}`);
await cache.delete(`blog:slug:${blog.slug}`);
await cache.incrementVersion('blog');
```

### File Operations

- File uploads are synchronous — response depends on the URL
- File deletions are always async via BullMQ — never block the response for R2 cleanup
```ts
// correct — async deletion
enqueueR2Delete(publicId).catch(err =>
  logger.error(`failed to enqueue R2 delete: ${err.message}`)
);

// wrong — blocks response
await deleteFromR2(publicId);
```

### Validation

- All request bodies must be validated with a Zod schema
- Validation middleware is created with `validateWith(schema)`
- Schemas live in `src/validations/`

### Error Handling

- Use `ApiError` for all known errors:
```ts
throw new ApiError(404, 'Blog not found');
throw new ApiError(409, 'Resource already exists');
throw new ApiError(400, 'Validation failed', errors);
```

- Never throw raw `Error` objects from services
- Never let cache errors propagate — cache utils catch internally
- Never use `res.json()` directly for errors — always throw and let global handler respond

### Soft Deletes

Every resource follows the three-stage deletion pattern:
- `PATCH /:id/delete` — soft delete
- `PATCH /:id/restore` — restore
- `DELETE /:id/hard-delete` — permanent, only on soft-deleted resources

---

## Adding a New Resource

Follow this checklist:

- [ ] Create Mongoose model in `src/models/`
- [ ] Create Zod validation schema in `src/validations/`
- [ ] Create service in `src/services/` with cache logic if applicable
- [ ] Create controller in `src/controllers/`
- [ ] Create route in `src/routes/` and mount in `src/app.ts`
- [ ] Add queue/worker if async jobs are needed
- [ ] Add email template if notifications are needed
- [ ] Add tests in `tests/`
- [ ] Update `docs/api-endpoints.md`
- [ ] Update `docs/architecture.md` if structure changes

---

## Pull Request Process

1. Branch off `main`
2. Make your changes
3. Run `pnpm test:run` — all tests must pass
4. Run `pnpm typecheck` — no TypeScript errors
5. Open a PR against `main`
6. PR title should follow the same format as commit messages
7. Describe what changed and why in the PR description
8. At least one review required before merging

---

## Environment Variables

Never commit real secrets. `.env` and `.env.test` are gitignored. Use `.env.example` as the template — add new variables there with placeholder values when introducing new config.