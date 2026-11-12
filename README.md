# Slotify (Groomly) Backend

Backend API and background worker service for **Slotify (Groomly)** — a two-sided barber and salon booking marketplace built for Pakistan (`PKR`, `Asia/Karachi`, `+92`).

Customers discover nearby barbers and salons with portfolios, ratings, and transparent pricing and book guaranteed time slots without walk-in waiting. Barbers, salon owners, and staff manage profiles, services, staff schedules, availability, live booking requests, and earnings.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime & Framework | Node.js (`>=20`) · Express 4 |
| Database & ORM | PostgreSQL 16 + PostGIS · Sequelize |
| Auth & Security | JWT (access + rotating refresh tokens) · Google Sign-In (`google-auth-library`) · Helmet · CORS · Express Rate Limit |
| Validation & Docs | Joi · OpenAPI / Swagger UI (`swagger-jsdoc` + `swagger-ui-express`) |
| Realtime & Jobs | Socket.IO · Redis + BullMQ *(planned/scaffolded)* |
| Local Infrastructure | Docker Compose (PostGIS, Redis, MinIO, MailHog) |

---

## Architecture Overview

The backend is structured as a **layered Express modular monolith** with two runtime entrypoints from the same codebase:

- **API Server (`bin/www`)** — Boots Express, validates required environment secrets, connects to PostgreSQL, initializes Socket.IO, and optionally starts cron jobs when `PROCESS_ROLE=all`.
- **Worker Process (`bin/worker`)** — Standalone background worker entrypoint (`PROCESS_ROLE=worker`) for scheduled and delayed jobs.

### Request Flow

```text
routes/<domain>Routes.js            (rate limiters + JWT / role middleware)
  → controllers/<domain>/<action>.js  (1 file per action + Joi validation)
    → service/<domain>Service.js      (business rules, DB transactions, authZ)
      → models/definition/*           (Sequelize models & associations)
        → PostgreSQL
```

### API Conventions

- Mounted under `/api` (health/readiness probes use `GET /api/health` and `GET /api/ready`).
- Feature endpoints follow an RPC-style `POST /api/<actionName>` pattern with JSON request bodies validated by Joi.
- Responses and errors flow through centralized error handling (`CustomError` + `CustomErrorMiddleware`).

---

## Prerequisites

- **Node.js** `>= 20` and **npm**
- **Docker & Docker Compose** (recommended for PostGIS, Redis, MinIO, and MailHog), or a local **PostgreSQL 16 + PostGIS** instance

---

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/NayyarAbbasi07/Slotify.git
cd Slotify
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

*(On macOS/Linux: `cp .env.example .env`)*

Fill in the required values in `.env`:
- `DB_PASSWORD` — PostgreSQL password (also used by `docker-compose.yml`)
- `JWT_ACCESS_SECRET` — Random secret (minimum 32 characters, must not start with `change-me`)
- `JWT_REFRESH_SECRET` — Separate random secret (minimum 32 characters, must not start with `change-me`)

Generate strong secrets with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **Note:** `bin/www` and `bin/worker` enforce secret validation on startup via `common/secrets.js` and will refuse to boot if `DB_PASSWORD`, `JWT_ACCESS_SECRET`, or `JWT_REFRESH_SECRET` are missing, too short, or still placeholders.

### 3. Start local infrastructure (optional if using local Postgres)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL + PostGIS** (`localhost:5432`)
- **Redis** (`localhost:6379`)
- **MinIO** (S3 API `localhost:9000`, Console `localhost:9001`)
- **MailHog** (SMTP `localhost:1025`, Web UI `localhost:8025`)

### 4. Run the server

```bash
# Development (with nodemon auto-reload)
npm run dev

# Production / standard start
npm start

# Background worker process (separate terminal)
npm run worker
```

Once running:
- **API Base:** `http://localhost:3008`
- **Swagger Docs:** `http://localhost:3008/api-docs`
- **Health Probe:** `GET http://localhost:3008/api/health`
- **Readiness Probe:** `GET http://localhost:3008/api/ready`

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start API server (`node ./bin/www`) |
| `npm run dev` | Start API server with `nodemon` |
| `npm run worker` | Start background worker (`node ./bin/worker`) |
| `npm run seed` | Run database seeders (`node ./seeders/seeder.js`) |
| `npm run lint` | Run ESLint across the repository |

---

## Configuration

- **Secrets & Environment (`.env`)**: `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `PROCESS_ROLE` (`all` \| `api` \| `worker`).
- **App Defaults (`config.json`)**: Non-secret runtime defaults including `timezone` (`Asia/Karachi`), `currency` (`PKR`), `cors.origins`, `jwt` expiration windows (`15m` / `30d`), `otp` rules, and `uploads` limits.

---

## Project Structure

```text
Slotify/
├── app.js                    # Express middleware, Swagger, /api mount, error handler
├── bin/
│   ├── www                   # HTTP + Socket.IO entrypoint
│   └── worker                # Background job / cron worker entrypoint
├── common/                   # DB connection, JWT auth middleware, enums, money, rate limiter, secrets, stubs
├── controllers/              # Domain folders, one controller file per endpoint action
├── routes/                   # Express routers mounted in routes/index.js
├── service/                  # Business logic services
├── models/definition/        # Sequelize models and associations
├── swagger/                  # OpenAPI specs & Swagger UI setup
├── socket/                   # Socket.IO server, room helpers, emit service
├── cron/                     # Scheduled & delayed job scaffolds
├── seeders/                  # Database seeders
├── utils/                    # JWT, OTP, error handlers, geo/time/crypto/S3 helpers
├── scripts/                  # Ops & migration scripts
├── scratch/                  # Local dev/test helper scripts
├── uploads/ & assets/        # Local dev upload/static directories
├── config.json               # Non-secret configuration
├── docker-compose.yml        # Local PostGIS, Redis, MinIO, MailHog
└── Dockerfile                # Container build for API / worker
```

### Related Documentation

- [project-structure.md](./project-structure.md) — Detailed file inventory, layer rules, and feature checklist
- [BACKEND_DESIGN_PLAN.md](./BACKEND_DESIGN_PLAN.md) — Backend architecture and phased build order
- [Groomly_Complete_Technical_Plan_v2.md](./Groomly_Complete_Technical_Plan_v2.md) — Full product, database, financial, and production specification

---

## Current Implementation Status

### Implemented Now
- **Core Boot & Config**: Express bootstrap, `common/secrets.js` startup validation, Sequelize PostgreSQL connection, Docker Compose & Dockerfile.
- **System Endpoints** (`routes/systemRoutes.js`): `GET /api/health`, `GET /api/ready`, `POST /api/getAppConfig`.
- **Auth & Sessions** (`routes/authRoutes.js`, `service/authService.js`, `service/sessionService.js`):
  - `POST /api/requestOtp` — Pakistan `+92` mobile validation/normalization, 6-digit OTP generation, rate limiting (in-memory store in scaffold).
  - `POST /api/signupUser` & `POST /api/loginUser` — OTP verification, role assignment (`CUSTOMER` / `PARTNER_OWNER`), JWT token issuance.
  - `POST /api/googleLogin` — Google ID token verification, user/identity linking, `needsPhone` flag.
  - `POST /api/refreshToken`, `POST /api/logoutUser`, `POST /api/logoutAll` — Session-backed refresh rotation with reuse detection and immediate session revocation checked by `authenticationMiddleware`.
- **Core Models** (`models/definition/`): `User`, `UserRole`, `AuthIdentity`, `Session`, `Business`, `Appointment`, `PlatformSetting`.
- **Tooling**: Swagger UI at `/api-docs` and Socket.IO initialization.

### Scaffolded (Next to Implement)
- **Domain Routers & Stubs**: Routers and `501 Not Implemented` controller/service stubs are wired for `user`, `business`, `staff`, `catalog`, `serviceItem`, `availability`, `appointment`, `media`, `favourite`, `search`, `review`, `payment`, `wallet`, `payout`, `loyalty`, `voucher`, `featured`, `referral`, `chat`, `notification`, `dispute`, and `admin`.
- **Infrastructure Integrations**: Remaining database models & PostGIS/GiST exclusion constraints, Redis OTP/slot caching, BullMQ workers/crons, `platform_settings` seeding, S3/MinIO pre-signed uploads, and production SMS/payment providers.
