# Groomly Backend — Complete Project Structure & Design Plan

**Audience:** Backend lead / developers  
**Source:** `Groomly_Complete_Technical_Plan_v2.md` (v2.0)  
**Folder convention:** **Your existing layered Express layout** (not Nest-style `modules/`) — see Section 2  
**Stack:** Node.js 22 LTS · Express · PostgreSQL 16 + PostGIS · Redis · BullMQ · Socket.io · Zod (or existing validators) · Prisma/Sequelize via `models/`  
**Shape:** One API app (`app.js`) + Socket.io + cron/queue workers in the same repo

---

## 1. What You Are Building (Backend Scope)

Groomly is a two-sided barber/salon booking marketplace (Pakistan: PKR, Asia/Karachi, +92).

The backend owns:

| Concern | Responsibility |
| --- | --- |
| Identity | OTP / Google / Apple auth, JWT sessions, RBAC, devices, account deletion |
| Marketplace | Businesses, staff, services, catalogue, portfolio, favourites, geo search |
| Booking engine | Slot generation, exclusion-constraint locking, state machine, timers |
| Money | Cash commission tracking (MVP), online payments (P2), ledger, payouts |
| Growth | Reliability score, points, vouchers, referrals, featured placement |
| Real-time | Socket.io rooms + push/SMS/email via cron/queue jobs |
| Ops | Admin APIs, disputes, settings, audit log, health/ready |

**Out of backend scope (other surfaces):** Customer/Partner RN apps, Admin Next.js UI, Terraform repo. Backend still exposes all APIs those surfaces need.

**Runtime shape (fits your folders):**

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│ Customer /  │────▶│  app.js (Express)    │────▶│ PostgreSQL  │
│ Partner /   │ WS  │  + socket/           │     │ + PostGIS   │
│ Admin apps  │◀────│                      │────▶│ Redis       │
└─────────────┘     └──────────┬───────────┘     └─────────────┘
                               │ enqueue / schedule
                               ▼
                        ┌──────────────┐
                        │ cron/        │──▶ SMS / FCM / SES / S3 / Gateway
                        │ (BullMQ jobs)│
                        └──────────────┘
```

---

## 2. Repository Layout (YOUR structure — mandatory)

**Do not introduce `src/modules/`.** Keep the layered folders you already use. Domain features are split **across** layers with matching file names.

```
backend/   (or groomly-api / your repo root)
├── .gitignore
├── .env.example                 # add if missing; never commit secrets
├── app.js                       # Express bootstrap: middleware, mount routes, start HTTP
├── config.json                  # static env-ish config (extend; secrets stay in .env)
├── nodemon.json
├── package.json
├── package-lock.json
├── README.md
├── Dockerfile                   # add for deploy
├── docker-compose.yml           # Postgres+PostGIS, Redis, MinIO, MailHog
│
├── assets/                      # static assets if any
├── bin/                         # CLI entrypoints (e.g. start worker, migrate)
├── uploads/                     # local/dev uploads only; production = S3 pre-signed
├── scratch/                     # throwaway experiments (git-ignore contents)
├── docs/                        # internal notes, runbooks
│
├── common/                      # shared cross-cutting code
│   ├── middleware/              # requestId, helmet, cors, rateLimit, auth, rbac, errorHandler
│   ├── errors.js                # AppError + codes (SLOT_TAKEN, …)
│   ├── logger.js                # pino / winston + requestId
│   ├── redis.js
│   ├── db.js                    # DB client / connection pool
│   ├── events.js                # in-process domain event bus
│   ├── queue.js                 # BullMQ connection + queue names
│   ├── settings.js              # load/cache platform_settings from DB
│   ├── money.js                 # paisa helpers — never float
│   ├── pagination.js
│   └── constants.js             # roles, appointment statuses, etc.
│
├── models/                      # data access / ORM models (one domain per file or group)
│   ├── index.js                 # register/export all models
│   ├── user.js
│   ├── session.js
│   ├── device.js
│   ├── address.js
│   ├── business.js
│   ├── businessVerification.js
│   ├── staffMember.js
│   ├── category.js
│   ├── service.js               # catalogue service (name clash: file = businessService.js if needed)
│   ├── staffService.js
│   ├── portfolioMedia.js
│   ├── favourite.js
│   ├── workingHours.js
│   ├── timeOff.js
│   ├── appointment.js           # ★ + exclusion constraint in migration
│   ├── appointmentItem.js
│   ├── appointmentStatusHistory.js
│   ├── eventDetails.js
│   ├── conversation.js
│   ├── message.js
│   ├── review.js
│   ├── attendanceRating.js
│   ├── loyaltyAccount.js
│   ├── pointsLedger.js
│   ├── reliabilityEvent.js
│   ├── voucher.js
│   ├── voucherRedemption.js
│   ├── referral.js
│   ├── featuredPlan.js
│   ├── featuredPlacement.js
│   ├── payment.js
│   ├── refund.js
│   ├── gatewayEvent.js
│   ├── ledgerEntry.js
│   ├── payoutAccount.js
│   ├── payout.js
│   ├── notification.js
│   ├── dispute.js
│   ├── report.js
│   ├── platformSetting.js
│   ├── appVersion.js
│   └── adminAuditLog.js
│
├── validators/                  # Zod / Joi / express-validator — request schemas
│   ├── auth.validator.js
│   ├── user.validator.js
│   ├── business.validator.js
│   ├── catalog.validator.js
│   ├── availability.validator.js
│   ├── booking.validator.js     # ★
│   ├── payment.validator.js
│   ├── review.validator.js
│   ├── loyalty.validator.js
│   ├── voucher.validator.js
│   ├── featured.validator.js
│   ├── chat.validator.js
│   ├── search.validator.js
│   ├── media.validator.js
│   ├── dispute.validator.js
│   └── admin.validator.js
│
├── service/                     # ★ business logic only (controllers stay thin)
│   ├── auth.service.js
│   ├── user.service.js
│   ├── business.service.js
│   ├── catalog.service.js
│   ├── availability.service.js  # slot generation + Redis cache
│   ├── booking.service.js       # ★ state machine transition() lives here
│   ├── payment.service.js
│   ├── wallet.service.js
│   ├── payout.service.js
│   ├── review.service.js
│   ├── loyalty.service.js
│   ├── voucher.service.js
│   ├── featured.service.js
│   ├── notification.service.js
│   ├── chat.service.js
│   ├── search.service.js
│   ├── media.service.js
│   ├── dispute.service.js
│   └── admin.service.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js       # /me, addresses, devices, delete account
│   ├── business.controller.js   # public + partner business
│   ├── catalog.controller.js
│   ├── availability.controller.js
│   ├── booking.controller.js    # customer + partner booking actions
│   ├── payment.controller.js
│   ├── wallet.controller.js
│   ├── payout.controller.js
│   ├── review.controller.js
│   ├── loyalty.controller.js
│   ├── voucher.controller.js
│   ├── featured.controller.js
│   ├── notification.controller.js
│   ├── chat.controller.js
│   ├── search.controller.js
│   ├── media.controller.js
│   ├── dispute.controller.js
│   ├── admin.controller.js
│   └── system.controller.js     # health, ready, app-config
│
├── routes/
│   ├── index.js                 # mounts all routers under /v1
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── business.routes.js
│   ├── catalog.routes.js
│   ├── availability.routes.js
│   ├── booking.routes.js
│   ├── payment.routes.js        # includes /webhooks/:gateway
│   ├── wallet.routes.js
│   ├── payout.routes.js
│   ├── review.routes.js
│   ├── loyalty.routes.js
│   ├── voucher.routes.js
│   ├── featured.routes.js
│   ├── notification.routes.js
│   ├── chat.routes.js
│   ├── search.routes.js
│   ├── media.routes.js
│   ├── dispute.routes.js
│   ├── admin.routes.js
│   ├── partner.routes.js        # optional aggregator for /partner/*
│   └── system.routes.js
│
├── socket/                      # Socket.io — rooms + emit helpers
│   ├── index.js                 # attach to HTTP server, auth handshake
│   ├── rooms.js                 # user:{id}, business:{id}, staff:{id}
│   └── events.js                # appointment.*, chat.message, availability.changed
│
├── cron/                        # scheduled + delayed jobs (BullMQ processors + node-cron)
│   ├── index.js                 # start workers when PROCESS_ROLE=worker|all
│   ├── bookingTimers.cron.js    # expire, payment timeout, auto-complete
│   ├── reminders.cron.js        # 24h / 1h / review request
│   ├── notifications.cron.js    # push / SMS / email with retries
│   ├── media.cron.js            # thumbnails, EXIF strip
│   ├── finance.cron.js          # reconcile, weekly payouts, points expiry
│   └── maintenance.cron.js      # ratings, sessions cleanup, featured start/end
│
├── swagger/                     # OpenAPI 3.1 + Swagger UI (non-prod)
│   ├── swagger.js               # setup / serve
│   └── openapi.json             # generated or hand-maintained contract
│
├── seeders/                     # platform_settings defaults, categories, demo data
│   ├── platformSettings.seeder.js
│   ├── categories.seeder.js
│   └── demo.seeder.js
│
├── scripts/                     # one-off ops
│   ├── migrate.js
│   ├── generate-openapi.js
│   └── reconcile-queues.js      # rebuild delayed jobs from DB after Redis loss
│
└── utils/                       # pure helpers (geo, dates, otp, encryption)
    ├── geo.js                   # PostGIS helpers / near-me query builders
    ├── otp.js
    ├── crypto.js                # field encryption CNIC / IBAN
    ├── jwt.js
    └── time.js                  # Asia/Karachi slot math
```

### Layer rules (mandatory)

| Layer | May call | Must not |
| --- | --- | --- |
| `routes/` | validators, middleware, controllers | services, models, DB |
| `controllers/` | services only | models / raw SQL |
| `service/` | models, other services, `common/events`, `common/queue`, `socket` emit helpers | Express `req`/`res` |
| `models/` | DB client | controllers, routes |
| `cron/` | services (preferred) | controllers |
| `socket/` | services for auth/load; emit only | business writes without going through service |

**Cross-domain rule:** Controllers never reach into another domain’s model. Call that domain’s `*.service.js` (e.g. booking complete → `wallet.service` / `loyalty.service`).

### Naming convention

For every domain feature `X`:

```
validators/X.validator.js
service/X.service.js
controllers/X.controller.js
routes/X.routes.js
models/<tables for X>.js
```

Booking is the critical path: `booking.service.js` owns `transition()` — **no other file updates appointment status**.

---

## 3. Core Design Principles

1. **Database is truth** — sockets and caches are accelerators; reconnect = re-fetch.
2. **Money in paisa (`bigint`)** — never `number` for currency math.
3. **UUID v7** primary keys; soft-delete where specified; hard-delete/anonymise on account deletion.
4. **Append-only ledgers** for points, reliability, wallet; cached balances updated in the same transaction.
5. **Business rules live in `platform_settings`** — no hardcoded SLAs/rates (load via `common/settings.js`).
6. **Single status transition function** in `service/booking.service.js` — no other code updates `status`.
7. **Idempotency-Key** required on booking create, payments, payouts.
8. **Service-layer authZ** — `common/middleware` checks role; `service/*` checks ownership (prevent IDOR).
9. **Expand → migrate → contract** for schema changes (`scripts/migrate.js` + model updates).
10. **Phase-aware code** — feature flags / settings for home/urgent/event/online-pay so Phase 1 stays shippable.
11. **Folder discipline** — new features add files under existing `routes` / `controllers` / `service` / `models` / `validators`; do not invent parallel trees.

---

## 4. Domain Map → Your Folders (Complete — Do Not Skip)

### 4.1 Auth + users → `auth.*` / `user.*`

| Piece | Design |
| --- | --- |
| OTP | Hash in Redis; 5 min TTL; max 5 attempts; 3 sends / 15 min per phone+IP; +92 only at launch |
| Social | Google token verify; Apple JWKS; then require phone link once |
| Tokens | Access JWT 15 min (jose); opaque refresh 30 d hashed in `sessions`; rotation + reuse → revoke family |
| Roles | `user_roles`: customer, partner_owner, staff, admin, support, finance |
| Devices | Upsert push token; used by notifications |
| Addresses | CRUD for home bookings (Phase 3, but schema in Phase 1) |
| Account deletion | Soft → anonymise within 30 days; retain financial rows |

**Key endpoints:** `/auth/*`, `/me`, `/me/addresses`, `/me/devices`, `DELETE /me`

### 4.2 Businesses + catalog + media → `business.*` / `catalog.*` / `media.*`

| Piece | Design |
| --- | --- |
| Business | Barber = 1 staff row (owner); Salon = N staff |
| Verification | KYC docs private S3; admin approve/reject; status machine draft→pending→approved/rejected/suspended |
| Services | Category tree; price/duration/buffer; `staff_services` with overrides |
| Portfolio | Pre-signed upload → confirm → worker thumbnails/EXIF strip → moderation |
| Favourites | Simple join table |

**Key endpoints:** Partner CRUD under `/partner/*`; public `GET /businesses/:id`, media, favourites

### 4.3 Availability (slot engine) → `availability.service.js`

**Slots are computed, not stored.**

Algorithm (per request):

1. Load weekly hours for weekday → subtract breaks / `time_off`.
2. Subtract appointments in `REQUESTED | PENDING_PAYMENT | ACCEPTED | IN_PROGRESS` using `blocked_*` ranges (includes buffers + home travel).
3. Step by slot interval (default 15 min from settings).
4. Enforce min notice / max window.
5. For `staffId=any`, merge across eligible staff; return which staff is free.

**Cache:** Redis key `slots:{staffId}:{date}` TTL 60s; invalidate on booking or schedule change.

**Raw SQL / Prisma:** hours & time_off via Prisma; double-book prevention via DB constraint (not app-only).

### 4.4 Bookings ★ Heart of the product → `booking.service.js` + `cron/bookingTimers.cron.js`

#### Status machine (only `transition()` may change status)

```
                    ┌──────────────────┐
                    │ PENDING_PAYMENT  │──expire──▶ EXPIRED
                    └────────┬─────────┘
                             │ paid
                             ▼
         ┌────────── REQUESTED ──────────┐
         │               │               │
      expire         accept           decline
         │               │               │
         ▼               ▼               ▼
      EXPIRED        ACCEPTED        DECLINED
                         │
            ┌────────────┼────────────┐
            │            │            │
         check-in    cancel/no-show  auto-complete
            │            │            │
            ▼            ▼            ▼
       IN_PROGRESS   CANCELLED /   COMPLETED
            │         NO_SHOW
         complete
            ▼
        COMPLETED ──▶ review / points / commission
```

Every transition writes `appointment_status_history` in the **same transaction**.

#### Create booking transaction

1. Validate Idempotency-Key (return existing if replay).
2. Snapshot service prices/durations into `appointment_items`.
3. Compute `blocked_start_at` / `blocked_end_at`.
4. Insert appointment (exclusion constraint may throw → `409 SLOT_TAKEN`).
5. Snapshot `commission_rate_bps` from business/settings.
6. Emit `appointment.requested` → socket + enqueue expiry + notify jobs.

#### Timers (`cron/bookingTimers.cron.js` via BullMQ)

| Job | Default | Effect |
| --- | --- | --- |
| Response SLA standard | 30 min | → EXPIRED |
| Response SLA urgent | 10 min | → EXPIRED + suggest alternatives |
| Payment window | 15 min | → EXPIRED, release slot |
| Reminders | 24h / 1h | Push |
| Auto-complete | +6h after end | → COMPLETED |
| Review request | +1h after complete | Push |

Cancel job tokens when booking cancels.

#### Partner actions

`accept | decline | propose-time | check-in | complete | no-show | attendance`

#### DB guard (must ship Phase 1)

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  staff_id WITH =,
  tstzrange(blocked_start_at, blocked_end_at, '[)') WITH &&
) WHERE (status IN ('PENDING_PAYMENT','REQUESTED','ACCEPTED','IN_PROGRESS'));
```

### 4.5 Payments + wallet + payouts → `payment.*` / `wallet.*` / `payout.*` + `cron/finance.cron.js`

| Phase | Scope |
| --- | --- |
| **Phase 1** | Cash only: on COMPLETED write commission owed to ledger; track payment_method=cash |
| **Phase 2** | `POST /payments/intent` → gateway → webhook → ledger; refunds; weekly payouts; commission pay-down |

**Ledger accounts:** `customer_wallet`, `business_wallet`, `platform_revenue`, `gateway_clearing`, `bank_out`, …

**Rules:**

- Double-entry every money movement.
- Webhook: verify signature → insert `gateway_events` uniquely → process once.
- Never trust client redirect as payment success.
- Cash: `business_wallet − commission` on complete; net against online earnings; pause bookings if owed > limit > 14 days.

### 4.6 Reviews + loyalty + vouchers + featured → matching `*.service.js`

| Domain | Notes |
| --- | --- |
| Reviews | One per completed appointment; edit 7 days; partner reply once; separate `attendance_ratings` |
| Loyalty | Points ledger + reliability events; score gates booking (prepay &lt;60, block &lt;30) |
| Vouchers | Platform vs partner funded (affects payout math); validate at checkout |
| Featured | Plans + placements with area/category caps; ranking boost + labelled strip |

Phase: reviews + reliability in **P1**; points/vouchers/featured/**wallet payouts** in **P2**.

### 4.7 Notifications + chat + search → `notification.*` / `chat.*` / `search.*` + `socket/`

| Domain | Design |
| --- | --- |
| Notifications | Persist inbox row; channels via `cron/notifications.cron.js` per matrix (spec §5.4); invalidate bad push tokens |
| Chat | 1:1 per appointment; open until T+24h; emit via `socket/events.js` + push; no open messenger |
| Search | PostGIS in `utils/geo.js` + `search.service.js`; ranking weights in settings |

### 4.8 Disputes + admin + system → `dispute.*` / `admin.*` / `system.*`

| Domain | Design |
| --- | --- |
| Disputes | Open within 48h; support resolves ≤3 working days; refund hooks |
| Admin | Approvals, users, bookings, catalogue, settings, finance (P2), audit log on every write |
| System | `GET /health`, `GET /ready`, `GET /app-config` (min versions, flags) |

Admin auth: email + argon2 + TOTP; role split super/ops/support/finance.

### 4.9 Queues (`cron/` + `common/queue.js`)

| Queue / cron file | Jobs |
| --- | --- |
| `cron/bookingTimers.cron.js` | Expiry, payment timeout, auto-complete, no-show prompt |
| `cron/notifications.cron.js` | Push, SMS, email + retries |
| `cron/reminders.cron.js` | 24h/1h + review request |
| `cron/media.cron.js` | Thumbnails, EXIF strip, video posters, moderation hook |
| `cron/finance.cron.js` | Nightly gateway reconcile, weekly payouts, points expiry, invoices |
| `cron/maintenance.cron.js` | Ratings/ranking recalc, session/OTP cleanup, featured start/end |

Start cron workers from `bin/` or `app.js` when `PROCESS_ROLE=worker` (or `all` in local). Same codebase as the API.

---

## 5. Data Layer Design

### 5.1 Models + raw SQL split

| Use `models/` (ORM) | Use raw SQL (`utils/geo.js` / model helpers) |
| --- | --- |
| CRUD, relations, most filters | PostGIS near-me, GiST exclusion (migration SQL), ranking queries, ledger reports |

Keep ORM choice consistent with your stack (Sequelize fits `models/` + `seeders/` naturally; Prisma is fine if models are thin wrappers). PostGIS: enable in migration; store `geography(Point,4326)`.

### 5.2 Schema domains (all tables from spec §8.3)

Add model files under `models/` in this order during Sprint 0:

1. Identity: `users`, `user_roles`, `auth_identities`, `sessions`, `devices`, `addresses`
2. Business: `businesses`, `business_verifications`, `staff_members`, `categories`, `services`, `staff_services`, `portfolio_media`, `favourites`
3. Scheduling: `working_hours`, `time_off`
4. Booking: `appointments`, `appointment_items`, `appointment_status_history`, `event_details`, `conversations`, `messages`
5. Social proof: `reviews`, `attendance_ratings`
6. Growth: `loyalty_accounts`, `points_ledger`, `reliability_events`, `vouchers`, `voucher_redemptions`, `referrals`, `featured_plans`, `featured_placements`
7. Finance: `payments`, `refunds`, `gateway_events`, `ledger_entries`, `payout_accounts`, `payouts`
8. Ops: `notifications`, `disputes`, `reports`, `platform_settings`, `app_versions`, `admin_audit_log`

Seed via `seeders/`: categories, platform_settings defaults (all spec §4 numbers), demo businesses for local.

### 5.3 Critical indexes

- `businesses` GiST on location; `(status, city)`; trigram on name
- `appointments` by customer/business/staff + exclusion constraint
- Unique: `payments.idempotency_key`, `appointments.idempotency_key`, gateway event uniqueness

---

## 6. HTTP / API Design

### Conventions

- Base: `/v1`
- Auth: `Authorization: Bearer <access>`
- Pagination: cursor `{ data, nextCursor }`
- Errors: `{ error: { code, message, details } }`
- Money: integer minor units + optional formatted string
- Times: ISO-8601 with offset; store UTC `timestamptz`

### Route mounting (`app.js` → `routes/index.js`)

```
/v1/auth
/v1/me
/v1/categories
/v1/search
/v1/businesses
/v1/favourites
/v1/appointments
/v1/payments
/v1/webhooks/:gateway          # public, signature-verified
/v1/vouchers
/v1/partner/...
/v1/admin/...
/v1/health | /ready | /app-config
```

OpenAPI lives in `swagger/`; keep it the contract with mobile — **contract-first for Phase 1 endpoints before UI work**.

### Socket events (`socket/events.js`)

| Event | Rooms |
| --- | --- |
| `appointment.requested` | `business:{id}`, `staff:{id}` |
| `appointment.updated` | customer + partner rooms |
| `chat.message` | other party |
| `availability.changed` | business viewers |

---

## 7. Cross-Cutting Architecture

### Middleware pipeline (order) — `common/middleware/`

1. Request ID  
2. Helmet / security headers  
3. CORS allow-list  
4. Body size limit  
5. Rate limit (Redis store) — stricter on OTP  
6. Auth (optional → required on protected routes)  
7. Validator (`validators/*.validator.js`)  
8. Controller → service (transaction)  
9. Error mapper → structured response (`common/errors.js`)

### Domain events (in-process) — `common/events.js`

Examples: `appointment.requested | updated | completed`, `payment.succeeded`, `business.approved`, `media.uploaded`

Handlers (thin): enqueue via `common/queue.js` + emit via `socket/` — **no heavy logic in listeners**.

### Config / secrets

- Runtime: `config.json` + `.env` (fail fast on boot in `common/db.js` / boot path)
- Business rules: DB `platform_settings` via `common/settings.js` cached in Redis
- AWS Secrets Manager in deployed envs; never commit secrets
- Production media: S3 (not long-term files in `uploads/`)

### Observability

- JSON logs with `requestId` (`common/logger.js`)
- Sentry on API + cron worker process
- CloudWatch metrics; Bull Board (non-prod) or queue depth metrics

---

## 8. Local Dev & Delivery Structure

### `docker-compose.yml` services

| Service | Purpose |
| --- | --- |
| `postgres` | postgis/postgis:16 image |
| `redis` | cache + queues + OTP |
| `minio` | S3-compatible media |
| `mailhog` | email sink |
| `api` / `worker` | optional; or nodemon on host |

### Scripts (`package.json`)

```json
{
  "start": "node app.js",
  "dev": "nodemon app.js",
  "dev:worker": "node bin/worker.js",
  "db:migrate": "node scripts/migrate.js",
  "db:seed": "node seeders/run.js",
  "test": "jest",
  "openapi": "node scripts/generate-openapi.js",
  "lint": "eslint ."
}
```

`bin/worker.js` boots `cron/index.js` only. Locally you can run API + worker together if `PROCESS_ROLE=all`.

### CI gates (backend)

PR: lint → unit → integration → OpenAPI / swagger diff → secret/deps scan  
Main: build image → ECR → migrate → deploy Dev  
Tag: Staging → smoke → approve → Prod (same image)

---

## 9. Implementation Build Order (Backend)

Aligned with roadmap Sections 17.2 / 21 — **backend-first critical path**.

### Phase 0 — Foundations (3–4 weeks) — YOU START HERE

| Week focus | Deliverables |
| --- | --- |
| Scaffold | Keep your folders; fill `common/`, wire `app.js` → `routes/index.js`, Docker Compose, CI |
| Data | All P1 models under `models/`; migrations; `seeders/platformSettings.seeder.js` |
| Core | logger, errors, db, redis, auth middleware, events, queue shells in `common/` |
| Contract | `swagger/openapi.json` for Phase 1 endpoints agreed with mobile |
| Processes | `bin/worker.js` + `cron/index.js`; Dockerfile CMD for `api` vs `worker` |

### Phase 1 — MVP API (11–13 weeks)

**Sprint sequence (suggested):**

1. **Auth & me** — `auth.*` + `user.*` (OTP, Google, Apple, refresh, devices, delete account)  
2. **Businesses & KYC** — `business.*` + admin approval  
3. **Catalogue & staff & hours** — `catalog.*` + staff/hours models  
4. **Media pipeline** — `media.*` + `cron/media.cron.js`  
5. **Search & discovery** — `search.*` + `utils/geo.js`  
6. **Availability slots** — `availability.service.js` + Redis cache  
7. **Bookings core** — `booking.*` + exclusion constraint + `socket/` + expiry cron  
8. **Partner calendar actions** — accept/decline/check-in/complete/no-show/attendance  
9. **Cash commission** — `wallet.service.js` ledger on complete  
10. **Reviews + reliability** — `review.*` + `loyalty.*` (score only in P1)  
11. **Notifications + chat** — `notification.*` + `chat.*`  
12. **Admin APIs** — `admin.*` + audit log  
13. **Hardening** — concurrency tests, rate limits, IDOR tests, account deletion path  

### Phase 1.5

Load/concurrency tests (zero double books), pen-test fixes, production config, fake gateway for later.

### Phase 2 — Monetization

Online payments + webhooks + refunds → payouts → featured purchase → points/vouchers/referrals → finance admin → reconciliation cron.

### Phase 3 — Booking types

Home (radius, travel buffer, address reveal after accept) → urgent (10 min SLA, alternatives) → event (deposit, `event_details`).

### Phase 4

Category expansion via tree; city expansion; optional OpenSearch only if Postgres FTS insufficient.

---

## 10. Testing Design (Backend Must Own)

| Layer | Must cover |
| --- | --- |
| Unit | Slot generation, pricing/fees, commission, points, reliability deltas, `transition()` matrix |
| Integration | Every endpoint role/ownership; webhook idempotency; OTP limits |
| Concurrency | N parallel books same slot → exactly one success |
| Contract | Responses match OpenAPI |
| Load (pre-launch) | Search, slots, book, sockets at 2× target |

Use Testcontainers for Postgres+PostGIS and Redis in CI.

---

## 11. Security Checklist (Backend)

- [ ] OTP abuse limits + SMS spend alerts  
- [ ] Refresh rotation + reuse detection  
- [ ] Service-layer ownership checks + automated IDOR tests  
- [ ] Field encryption for CNIC / payout account numbers  
- [ ] KYC bucket private + short-lived signed GET  
- [ ] Webhook signature verify + idempotent processing  
- [ ] Admin TOTP + audit log  
- [ ] Helmet, CORS, Redis rate limits, body limits  
- [ ] Secrets in Secrets Manager only  
- [ ] Mask phones; show home address only after accept  

---

## 12. Suggested Package Dependencies (baseline)

```
express
zod   (or keep Joi / express-validator if already standard in this repo)
ioredis  bullmq
socket.io  @socket.io/redis-adapter
jose  argon2  google-auth-library
helmet  cors  express-rate-limit  hpp
pino  (or winston if already used)
@aws-sdk/client-s3  @aws-sdk/s3-request-presigner
@sentry/node
jest  (or mocha)  supertest
swagger-ui-express  (serve swagger/)
sequelize + sequelize-cli   OR   prisma   (pick one; map into models/)
nodemon
```

Payment SDK chosen after gateway decision (spec §20 #14). Prefer matching packages already in your `package.json`.

---

## 13. Definition of Done — Backend Feature

A backend feature is done when:

1. `validators/` + `swagger/` updated  
2. Matching files in `routes/` + `controllers/` + `service/` + `models/` + tests  
3. AuthZ ownership covered in the service  
4. Domain events / `cron/` jobs wired if state changes  
5. Migrations reviewed (expand/contract)  
6. Settings used for any tunable business number (`common/settings.js`)  
7. Mobile lead reviewed swagger/contract diff  

---

## 14. First Concrete Actions (This Week)

1. Keep your existing folders; add only missing ones from Section 2 (`common/`, richer `cron/`, etc.).  
2. `docker-compose` up (PostGIS + Redis + MinIO).  
3. Identity + Business + Booking models; migration with `btree_gist` + exclusion constraint.  
4. Seed `platform_settings` via `seeders/`.  
5. Wire `GET /health` + `/ready` in `system.routes.js`.  
6. Draft Phase 1 paths in `swagger/` (Auth, Me, Partner business, Slots, Appointments) — agree with mobile.  
7. Implement Auth OTP as the first vertical slice: `auth.routes` → `auth.controller` → `auth.service` → `models/user` + Redis OTP.

---

## 15. Traceability — Spec → Your Folders

| Spec section | Backend home |
| --- | --- |
| §4 Business rules | `common/settings.js` + booking/loyalty/payment services |
| §5 Functional reqs | domain files listed in Section 2 |
| §6 Booking engine | `service/availability.service.js` + `service/booking.service.js` + `cron/bookingTimers.cron.js` |
| §8 Schema | `models/` + migrations + `seeders/` |
| §9 Architecture | this document (your layered layout) |
| §10 API | `routes/` + `swagger/` |
| §11 Payments | `payment` / `wallet` / `payout` services + `cron/finance.cron.js` |
| §12 Security | `common/middleware` + `utils/crypto.js` + admin audit |
| §13 NFRs | Redis cache, indexes, horizontal API/worker |
| §14 Testing | tests beside services / `__tests__` |
| §15 Production | Dockerfile + `bin/worker.js`; infra repo separate |
| §17 Phases | Section 9 build order above |
| §20 Decisions | Defaults in `seeders/`; change via admin settings |

---

*This plan follows **your** Express folder structure (`controllers`, `service`, `models`, `routes`, `validators`, `socket`, `cron`, `swagger`, …). Domain design comes from the full v2.0 technical document. When a [DECISION] changes, update `seeders` + settings — do not scatter magic numbers in services.*
