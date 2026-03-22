# Genesis Backend

A RESTful API backend for an investment company website built with Node.js, Express, TypeScript, and MongoDB.

## Tech Stack

- **Runtime:** Node.js 24
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Auth:** JWT (access + refresh tokens via cookies)
- **File Storage:** Cloudinary
- **Validation:** Zod
- **Password Hashing:** Argon2
- **Logging:** Pino
- **Testing:** Vitest + Supertest
- **Containerization:** Docker

## Project Structure

```
src/
├── app.ts                  # Express app setup
├── server.ts               # Entry point
├── config/                 # DB, Redis, Cloudinary, Multer config
├── controllers/            # HTTP request/response handlers
├── services/               # Business logic + caching
├── models/                 # Mongoose schemas
├── routes/                 # Route definitions
├── middlewares/            # Auth, error handler, rate limiter
├── validations/            # Zod schemas
└── utils/                  # Helpers (cache, logger, jwt, etc.)
```

## Running Locally

### Prerequisites

- Node.js 24+
- pnpm
- MongoDB running locally
- Redis running locally (`brew install redis && brew services start redis`)

### Setup

```bash
# Clone the repo
git clone https://github.com/Sthamanik/genesis_backend.git
cd genesis_backend

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Fill in your values in .env

# Start development server
pnpm dev
```

Server runs on `http://localhost:5001`

### Running Tests

```bash
# Copy test environment
cp .env.example .env.test

# Run tests
pnpm test:run
```

## Running with Docker

```bash
# Start all services (app, MongoDB, Redis)
docker compose up

# Stop all services
docker compose down
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URI` | Redis connection string |
| `ACCESS_TOKEN_SECRET` | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret |
| `CLOUDINARY_*` | Cloudinary credentials |
| `SMTP_*` | Email credentials |

## API Documentation

See [docs/api-endpoints.md](docs/api-endpoints.md) for full API reference.

## Architecture

See [docs/architecture.md](docs/architecture.md) for system design and architecture decisions.

## Contributing

See [docs/contributions.md](docs/contributions.md) for contribution guidelines.

## CI/CD

On every push to `main`:
1. Tests run against a Redis service
2. Docker image is built and pushed to `ghcr.io/sthamanik/finvault:latest`