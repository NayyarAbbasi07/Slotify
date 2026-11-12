# Slotify (Groomly) — Complete Project & Code Structure

This document describes how the **Slotify / Groomly Backend** is organized: folder layout, source files, and the coding conventions used to define and manage features.

Groomly is a two-sided barber & salon booking marketplace (Pakistan: PKR, Asia/Karachi, +92).

> Related: [BACKEND_DESIGN_PLAN.md](./BACKEND_DESIGN_PLAN.md) · [Groomly_Complete_Technical_Plan_v2.md](./Groomly_Complete_Technical_Plan_v2.md)

---

## 1. Stack & entry points

| Item | Detail |
|------|--------|
| Runtime | Node.js |
| Framework | Express |
| ORM / DB | Sequelize + PostgreSQL 16 + PostGIS |
| Cache / jobs | Redis + BullMQ |
| Auth | JWT (access + refresh) · Phone OTP · Google · Apple · Admin email + TOTP |
| Realtime | Socket.IO (+ Redis adapter) |
| Docs | Swagger (`/api-docs`) |
| Config | `config.json` (local; typically gitignored / environment-specific) + `.env` for secrets |

| Script | Command | Entry |
|--------|---------|--------|
| Start | `npm start` | `bin/www` |
| Dev | `npm run dev` | `nodemon ./bin/www` |
| Worker | `npm run worker` | `bin/worker` (BullMQ / cron processors) |
| Seed | `npm run seed` | `seeders/seeder.js` |

**Boot sequence**

```text
bin/www
  → loads app.js (Express app)
  → creates HTTP server
  → initSocket(server)
  → initCrons() / enqueue schedulers (optional if PROCESS_ROLE=all)
  → listen(PORT from config.json)
```

**HTTP mount**

```text
/                 → health message
/api-docs         → Swagger UI
/api/*            → routes/index.js (all feature routes)
/api/getFile/*    → static assets
/uploads/*        → uploaded files (local/dev; production prefers S3 pre-signed URLs)
```

---

## 2. Request flow (how code is managed)

Every feature follows the same layered path:

```text
Client
  → routes/<module>Routes.js          (path + auth + rate limit)
  → controllers/<module>/<action>.js  (Joi validate + HTTP response)
  → service/<module>Service.js        (business logic + DB)
  → models/definition/*               (Sequelize models)
  → PostgreSQL
```

**Rules of the house**

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Route** | URL, middleware (`authenticationMiddleware`, role, rate limiter) | Contain business logic |
| **Controller** | Validate `req.body` with Joi; call one service method; return status/JSON | Talk to DB / Sequelize directly |
| **Service** | Transactions, queries, domain rules, `CustomError` | Know about Express `req`/`res` |
| **Model** | Table schema + associations | Contain API validation |
| **Common / Utils** | Shared helpers (auth, enums, errors, upload, geo, money) | Become feature-specific dumping grounds |

**Optional shared validation** (DRY nested Joi):

```text
controllers/<module>/<something>Validation.js
  → required by addX.js and updateX.js
```

**Barrel files** (central exports):

- `controllers/index.js` — all controller handlers
- `service/index.js` — all services
- `routes/index.js` — mounts all routers under `/api`
- `models/definition/index.js` — registers models + associations → `{ db, models }`

---

## 3. Top-level directory map

```text
Slotify/   (or groomly-backend / repo root)
├── app.js                 # Express app setup
├── bin/www                # Server bootstrap (HTTP, socket, crons)
├── bin/worker             # Background job process (BullMQ)
├── config.json            # Runtime config (PORT, DB, JWT, Redis, S3, …)
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
├── .env.example
├── Dockerfile
├── docker-compose.yml     # Postgres+PostGIS, Redis, MinIO, MailHog
│
├── common/                # Cross-cutting helpers (auth, DB, enums, redis, queue)
├── controllers/           # One folder per domain; one file per action
├── routes/                # Express routers (wire URL → controller)
├── service/               # Business logic services
├── models/definition/     # Sequelize models + associations
├── swagger/               # OpenAPI JSDoc per module + swagger setup
├── seeders/               # Reference / bootstrap data
├── socket/                # Socket.IO init + emit helpers
├── cron/                  # Scheduled + delayed jobs
├── utils/                 # Errors, multer, geo, money, crypto
├── docs/                  # Project documentation
├── scratch/               # Local/manual test scripts (not production)
├── assets/                # Static + uploads (served by Express)
├── uploads/               # Alternate upload path (portfolio, KYC local/dev)
├── scripts/               # Ad-hoc scripts (migrate, reconcile-queues, …)
├── validators/            # Reserved / shared validators (optional)
└── node_modules/          # Dependencies
```

---

## 4. How to add a new feature (standard checklist)

When adding something like “Booking” or “X”:

1. **Model** — `models/definition/<name>.js` (+ register + associations in `index.js`)
2. **Service** — `service/<name>Service.js` + export from `service/index.js`
3. **Controllers** — `controllers/<name>/<action>.js` (one action = one file)
4. **Register controllers** — `controllers/index.js`
5. **Routes** — `routes/<name>Routes.js` + mount in `routes/index.js`
6. **Swagger** — `swagger/<name>.docs.js` (loaded via `swagger/swagger.js`)
7. **Enums** (if needed) — `common/enumFunction.js`
8. **Cron / socket** (if needed) — `cron/` or `socket/`
9. **Seed / scratch tests** (optional) — `seeders/` or `scratch/`

Naming convention for APIs (existing style):

```text
POST /api/addX
POST /api/getAllX
POST /api/getXById
POST /api/updateX
POST /api/deleteX
```

Most endpoints use **POST + JSON body** (not REST verbs / path params).  
Idempotent money/booking creates should also accept `idempotencyKey` in the body (or header).

---

## 5. Folder & file inventory (Groomly source tree)

Paths below are relative to the repo root.  
Excluded: `node_modules/**`, `.git/**`, binary upload contents.

### 5.1 Root

| File | Purpose |
|------|---------|
| `app.js` | Express middleware, static, swagger, `/api` mount, error handler |
| `config.json` | App settings (non-secret) |
| `.env` / `.env.example` | Secrets (DB, JWT, SMS, S3, gateway) |
| `package.json` | Dependencies & npm scripts |
| `package-lock.json` | Lockfile |
| `README.md` | Short project overview |
| `.gitignore` | Git ignore rules |
| `Dockerfile` | API + worker image |
| `docker-compose.yml` | Local Postgres/PostGIS, Redis, MinIO |

### 5.2 `bin/`

| File | Purpose |
|------|---------|
| `bin/www` | HTTP server, Socket.IO, optional crons, listen |
| `bin/worker` | BullMQ workers (booking timers, notifications, finance, media) |

### 5.3 `common/`

| File | Purpose |
|------|---------|
| `common/databaseConnection.js` | Sequelize / PostgreSQL (+ PostGIS) connection |
| `common/authenticationMiddleware.js` | JWT auth + role gate (`CUSTOMER`, `PARTNER_OWNER`, `STAFF`, `ADMIN`, …) |
| `common/socketAuth.js` | Socket connection auth |
| `common/enumFunction.js` | Shared enums (roles, appointment status, booking type, payment status, …) |
| `common/excludeAttributes.js` | Common attribute excludes for queries |
| `common/rateLimiter.js` | Express rate limiter factory (stricter on OTP) |
| `common/redis.js` | Redis client (OTP, slot cache, rate limits, Socket adapter) |
| `common/queue.js` | BullMQ connection + queue names |
| `common/events.js` | In-process domain event bus |
| `common/settings.js` | Load/cache `platform_settings` |
| `common/money.js` | Paisa helpers — never float |
| `common/pagination.js` | Cursor helpers if used |

### 5.4 `controllers/`

Barrel: `controllers/index.js`

#### `controllers/auth/`

| File |
|------|
| `requestOtp.js` |
| `verifyOtp.js` |
| `googleLogin.js` |
| `appleLogin.js` |
| `refreshToken.js` |
| `logout.js` |
| `logoutAll.js` |

#### `controllers/user/` (me / profile)

| File |
|------|
| `getMe.js` |
| `updateMe.js` |
| `deleteAccount.js` |
| `addAddress.js` |
| `getAddresses.js` |
| `updateAddress.js` |
| `deleteAddress.js` |
| `registerDevice.js` |

#### `controllers/business/`

| File |
|------|
| `addBusiness.js` |
| `updateBusiness.js` |
| `getBusinessById.js` |
| `getAllBusinesses.js` |
| `submitVerification.js` |
| `getMyBusiness.js` |

#### `controllers/staff/`

| File |
|------|
| `addStaff.js` |
| `updateStaff.js` |
| `getAllStaff.js` |
| `getStaffById.js` |
| `deleteStaff.js` |
| `setStaffHours.js` |
| `assignStaffServices.js` |

#### `controllers/catalog/` · `serviceItem/` (business services)

| File |
|------|
| `catalog/getCategories.js` |
| `serviceItem/addService.js` |
| `serviceItem/updateService.js` |
| `serviceItem/getAllServices.js` |
| `serviceItem/getServiceById.js` |
| `serviceItem/deleteService.js` |

> Use `serviceItem` (or `businessService`) as the folder name so it does not clash with the `service/` layer folder.

#### `controllers/availability/`

| File |
|------|
| `getSlots.js` |
| `addTimeOff.js` |
| `getTimeOff.js` |
| `deleteTimeOff.js` |

#### `controllers/appointment/` ★ critical path

| File |
|------|
| `createAppointment.js` |
| `getAllAppointments.js` |
| `getAppointmentById.js` |
| `cancelAppointment.js` |
| `rescheduleAppointment.js` |
| `acceptAppointment.js` |
| `declineAppointment.js` |
| `proposeTime.js` |
| `checkInAppointment.js` |
| `completeAppointment.js` |
| `markNoShow.js` |
| `rateAttendance.js` |

#### `controllers/media/` · `favourite/`

| File |
|------|
| `media/getUploadUrl.js` |
| `media/confirmMedia.js` |
| `media/deleteMedia.js` |
| `media/getBusinessMedia.js` |
| `favourite/addFavourite.js` |
| `favourite/removeFavourite.js` |
| `favourite/getMyFavourites.js` |

#### `controllers/search/`

| File |
|------|
| `searchBusinesses.js` |
| `getFeaturedBusinesses.js` |

#### `controllers/review/`

| File |
|------|
| `addReview.js` |
| `updateReview.js` |
| `getBusinessReviews.js` |
| `replyToReview.js` |
| `reportReview.js` |

#### `controllers/payment/` · `wallet/` · `payout/`

| File |
|------|
| `payment/createPaymentIntent.js` |
| `payment/getPaymentById.js` |
| `payment/gatewayWebhook.js` |
| `wallet/getWallet.js` |
| `wallet/getLedger.js` |
| `wallet/payCommission.js` |
| `payout/getPayouts.js` |
| `payout/upsertPayoutAccount.js` |

#### `controllers/loyalty/` · `voucher/` · `featured/` · `referral/`

| File |
|------|
| `loyalty/getLoyalty.js` |
| `loyalty/getPointsHistory.js` |
| `loyalty/redeemPoints.js` |
| `voucher/validateVoucher.js` |
| `voucher/getMyVouchers.js` |
| `featured/getFeaturedPlans.js` |
| `featured/buyFeatured.js` |
| `referral/getMyReferral.js` |

#### `controllers/chat/` · `notification/` · `dispute/`

| File |
|------|
| `chat/getMessages.js` |
| `chat/sendMessage.js` |
| `notification/getMyNotifications.js` |
| `notification/markNotificationAsRead.js` |
| `notification/markAllNotificationsAsRead.js` |
| `dispute/addDispute.js` |
| `dispute/getDisputeById.js` |
| `dispute/getAllDisputes.js` |

#### `controllers/admin/`

| File |
|------|
| `getDashboardCounts.js` |
| `approveBusiness.js` |
| `rejectBusiness.js` |
| `suspendBusiness.js` |
| `getAllUsers.js` |
| `blockUser.js` |
| `adjustReliability.js` |
| `getAllAppointments.js` |
| `adminCancelAppointment.js` |
| `moderateMedia.js` |
| `moderateReview.js` |
| `getPlatformSettings.js` |
| `updatePlatformSettings.js` |
| `manageCategories.js` |
| `getAuditLog.js` |
| `approvePayoutBatch.js` |
| `processRefund.js` |

#### `controllers/system/`

| File |
|------|
| `health.js` |
| `ready.js` |
| `getAppConfig.js` |

### 5.5 `routes/`

Barrel: `routes/index.js` (mounts all routers on `/api`)

| File | Domain |
|------|--------|
| `authRoutes.js` | OTP / Google / Apple / refresh / logout |
| `userRoutes.js` | Me, addresses, devices, delete account |
| `businessRoutes.js` | Business profile + verification |
| `staffRoutes.js` | Staff CRUD + hours |
| `catalogRoutes.js` | Categories |
| `serviceItemRoutes.js` | Partner services |
| `availabilityRoutes.js` | Slots + time off |
| `appointmentRoutes.js` | Customer + partner booking actions |
| `mediaRoutes.js` | Portfolio upload / confirm |
| `favouriteRoutes.js` | Favourites |
| `searchRoutes.js` | Discovery / featured |
| `reviewRoutes.js` | Reviews |
| `paymentRoutes.js` | Intents + webhooks |
| `walletRoutes.js` | Partner wallet / ledger |
| `payoutRoutes.js` | Payouts / payout account |
| `loyaltyRoutes.js` | Points / reliability |
| `voucherRoutes.js` | Vouchers |
| `featuredRoutes.js` | Featured plans / purchase |
| `referralRoutes.js` | Referrals |
| `chatRoutes.js` | Booking chat |
| `notificationRoutes.js` | Inbox |
| `disputeRoutes.js` | Disputes |
| `adminRoutes.js` | Admin panel APIs |
| `systemRoutes.js` | Health / ready / app-config |

### 5.6 `service/`

Barrel: `service/index.js`

| File | Purpose |
|------|---------|
| `authService.js` | OTP, social login, tokens, sessions |
| `sessionService.js` | Refresh rotation, logout-all |
| `userService.js` | Profile, addresses, devices, account deletion |
| `businessService.js` | Business CRUD + KYC submit |
| `staffService.js` | Staff + hours + service assignment |
| `catalogService.js` | Categories tree |
| `serviceItemService.js` | Partner service catalogue |
| `availabilityService.js` | Slot generation + Redis cache + invalidation |
| `appointmentService.js` | ★ State machine `transition()`, create, partner actions |
| `mediaService.js` | Pre-signed URL, confirm, moderation status |
| `favouriteService.js` | Favourites |
| `searchService.js` | PostGIS near-me + ranking |
| `reviewService.js` | Reviews + attendance ratings |
| `paymentService.js` | Intents, webhooks, refunds |
| `walletService.js` | Ledger, cash commission, commission pay |
| `payoutService.js` | Weekly batches, payout accounts |
| `loyaltyService.js` | Points + reliability score |
| `voucherService.js` | Validate / redeem vouchers |
| `featuredService.js` | Plans + placements |
| `referralService.js` | Referral codes / rewards |
| `chatService.js` | Booking-scoped messages |
| `notificationService.js` | Inbox + enqueue push/SMS/email |
| `disputeService.js` | Disputes |
| `adminService.js` | Approvals, settings, audit, finance admin |
| `systemService.js` | Health / ready / app-config |

**Rule:** Only `appointmentService.transition()` may change appointment status. Other code must call that method.

### 5.7 `models/definition/`

Barrel: `models/definition/index.js` → exports `{ db, models }` and defines associations.

#### Base

| File | Purpose |
|------|---------|
| `base.js` | Shared audit fields (`created_by`, `updated_by`, `deleted_by`) + paranoid timestamps |

#### Identity & access

| File | Focus |
|------|--------|
| `user.js` | Users |
| `userRole.js` | Roles (customer / partner_owner / staff / admin / support / finance) |
| `authIdentity.js` | Phone / Google / Apple links |
| `session.js` | Refresh sessions |
| `device.js` | Push tokens |
| `address.js` | Customer addresses (home bookings) |

#### Business & catalogue

| File | Focus |
|------|--------|
| `business.js` | Barber / salon profile + geo |
| `businessVerification.js` | KYC |
| `staffMember.js` | Staff |
| `category.js` | Category tree |
| `businessService.js` | Services offered (table name `services`) |
| `staffService.js` | Staff ↔ service |
| `portfolioMedia.js` | Portfolio |
| `favourite.js` | Favourites |

#### Availability & booking

| File | Focus |
|------|--------|
| `workingHours.js` | Weekly hours |
| `timeOff.js` | Leave / blocked / walk-ins |
| `appointment.js` | ★ Appointments + exclusion constraint (migration SQL) |
| `appointmentItem.js` | Line items (price snapshots) |
| `appointmentStatusHistory.js` | Status audit |
| `eventDetails.js` | Event bookings |
| `conversation.js` | Chat thread per appointment |
| `message.js` | Chat messages |

#### Reviews, loyalty, growth

| File | Focus |
|------|--------|
| `review.js` | Customer reviews |
| `attendanceRating.js` | Partner → customer attendance |
| `loyaltyAccount.js` | Points + reliability cache |
| `pointsLedger.js` | Append-only points |
| `reliabilityEvent.js` | Append-only reliability |
| `voucher.js` | Vouchers |
| `voucherRedemption.js` | Redemptions |
| `referral.js` | Referrals |
| `featuredPlan.js` | Featured plans |
| `featuredPlacement.js` | Active placements |

#### Payments & ops

| File | Focus |
|------|--------|
| `payment.js` | Payment attempts |
| `refund.js` | Refunds |
| `gatewayEvent.js` | Raw webhooks |
| `ledgerEntry.js` | Double-entry ledger |
| `payoutAccount.js` | Partner bank / wallet |
| `payout.js` | Payout batches |
| `notification.js` | In-app inbox |
| `dispute.js` | Disputes |
| `report.js` | User reports |
| `platformSetting.js` | Tunable business rules |
| `appVersion.js` | Force-update |
| `adminAuditLog.js` | Admin audit |

> Treat **`models/definition/index.js` as the source of truth** for what the app loads. Exclusion constraint for overlapping bookings is applied in SQL migration / raw DDL, not only in the model file.

### 5.8 `swagger/`

| File | Purpose |
|------|---------|
| `swagger.js` | swagger-jsdoc setup, UI options |
| `auth.docs.js` | Auth APIs |
| `user.docs.js` | Me / profile |
| `business.docs.js` | Businesses |
| `staff.docs.js` | Staff |
| `catalog.docs.js` | Categories |
| `serviceItem.docs.js` | Services |
| `availability.docs.js` | Slots / time off |
| `appointment.docs.js` | Bookings |
| `media.docs.js` | Media |
| `favourite.docs.js` | Favourites |
| `search.docs.js` | Discovery |
| `review.docs.js` | Reviews |
| `payment.docs.js` | Payments / webhooks |
| `wallet.docs.js` | Wallet |
| `payout.docs.js` | Payouts |
| `loyalty.docs.js` | Loyalty |
| `voucher.docs.js` | Vouchers |
| `featured.docs.js` | Featured |
| `chat.docs.js` | Chat |
| `notification.docs.js` | Notifications |
| `dispute.docs.js` | Disputes |
| `admin.docs.js` | Admin |
| `system.docs.js` | Health / app-config |

### 5.9 `seeders/`

| File | Purpose |
|------|---------|
| `seeder.js` | Orchestrates seed run |
| `platformSettings/platformSettingsSeeder.js` | All §4 business rule defaults |
| `category/categoryData.js` · `categorySeeder.js` | Categories |
| `role/roleData.js` · `roleSeeder.js` | Roles |
| `user/userData.js` · `userSeeder.js` | Bootstrap admin / demo users |
| `demo/demoBusinessSeeder.js` | Local demo partners (optional) |

### 5.10 `socket/`

| File | Purpose |
|------|---------|
| `index.js` | `initSocket(server)` + Redis adapter |
| `socketService.js` | `emitToUser` / `emitToBusiness` / `emitToStaff` |
| `rooms.js` | `user:{id}`, `business:{id}`, `staff:{id}` |

Events: `appointment.requested`, `appointment.updated`, `chat.message`, `availability.changed`

### 5.11 `cron/`

| File | Purpose |
|------|---------|
| `index.js` | Register / start workers |
| `bookingTimers.cron.js` | Expire requests, payment timeout, auto-complete |
| `reminders.cron.js` | 24h / 1h reminders + review request |
| `notifications.cron.js` | Push / SMS / email with retries |
| `media.cron.js` | Thumbnails, EXIF strip |
| `finance.cron.js` | Reconcile, weekly payouts, points expiry |
| `maintenance.cron.js` | Ratings, session cleanup, featured start/end |

### 5.12 `utils/`

| File | Purpose |
|------|---------|
| `errorHandlers/CustomError.js` | Typed HTTP errors from services |
| `errorHandlers/CustomErrorMiddleware.js` | Global Express error handler |
| `multerUpload.js` | Local file upload middleware (dev) |
| `geo.js` | PostGIS near-me / distance helpers |
| `otp.js` | OTP generate / hash helpers |
| `crypto.js` | Field encryption (CNIC, IBAN) |
| `jwt.js` | Access token helpers |
| `time.js` | Asia/Karachi slot / timezone helpers |
| `s3.js` | Pre-signed upload / confirm helpers |

### 5.13 `docs/`

| File | Purpose |
|------|---------|
| `project-structure.md` | **This document** (keep at repo root or copy under `docs/`) |
| `BACKEND_DESIGN_PLAN.md` | Backend design & build order |
| `Groomly_Complete_Technical_Plan_v2.md` | Full product / tech spec |

### 5.14 `scratch/` (local testing only)

| File | Purpose |
|------|---------|
| `runBookingConcurrencyTest.js` | Parallel same-slot booking test |
| `runAuthOtpTests.js` | OTP flow HTTP tests |
| `setupDemoPartners.js` | Local partner fixtures |

### 5.15 Static / upload folders

| Path | Purpose |
|------|---------|
| `assets/` | Static files served via `/api/getFile` |
| `assets/uploads/` | Uploaded content (local) |
| `uploads/` | Alternate upload root |
| `uploads/kyc/` | KYC docs (local/dev only) |
| `uploads/portfolio/` | Portfolio (local/dev only) |

Production: private S3 + CloudFront; do not rely on disk for KYC/portfolio.

### 5.16 Reserved folders

| Path | Purpose |
|------|---------|
| `scripts/` | migrate, generate-openapi, reconcile-queues |
| `validators/` | Optional shared validators (Joi usually lives in controllers) |

---

## 6. Domain module map (feature → layers)

| Domain | Controllers folder | Service | Routes | Swagger |
|--------|-------------------|---------|--------|---------|
| Auth | `controllers/auth` | `authService` (+ `sessionService`) | `authRoutes` | `auth.docs.js` |
| Users / me | `controllers/user` | `userService` | `userRoutes` | `user.docs.js` |
| Business | `controllers/business` | `businessService` | `businessRoutes` | `business.docs.js` |
| Staff | `controllers/staff` | `staffService` | `staffRoutes` | `staff.docs.js` |
| Catalogue | `controllers/catalog` | `catalogService` | `catalogRoutes` | `catalog.docs.js` |
| Services | `controllers/serviceItem` | `serviceItemService` | `serviceItemRoutes` | `serviceItem.docs.js` |
| Availability | `controllers/availability` | `availabilityService` | `availabilityRoutes` | `availability.docs.js` |
| Appointments | `controllers/appointment` | `appointmentService` | `appointmentRoutes` | `appointment.docs.js` |
| Media | `controllers/media` | `mediaService` | `mediaRoutes` | `media.docs.js` |
| Favourites | `controllers/favourite` | `favouriteService` | `favouriteRoutes` | `favourite.docs.js` |
| Search | `controllers/search` | `searchService` | `searchRoutes` | `search.docs.js` |
| Reviews | `controllers/review` | `reviewService` | `reviewRoutes` | `review.docs.js` |
| Payments | `controllers/payment` | `paymentService` | `paymentRoutes` | `payment.docs.js` |
| Wallet | `controllers/wallet` | `walletService` | `walletRoutes` | `wallet.docs.js` |
| Payouts | `controllers/payout` | `payoutService` | `payoutRoutes` | `payout.docs.js` |
| Loyalty | `controllers/loyalty` | `loyaltyService` | `loyaltyRoutes` | `loyalty.docs.js` |
| Vouchers | `controllers/voucher` | `voucherService` | `voucherRoutes` | `voucher.docs.js` |
| Featured | `controllers/featured` | `featuredService` | `featuredRoutes` | `featured.docs.js` |
| Chat | `controllers/chat` | `chatService` | `chatRoutes` | `chat.docs.js` |
| Notifications | `controllers/notification` | `notificationService` + socket | `notificationRoutes` | `notification.docs.js` |
| Disputes | `controllers/dispute` | `disputeService` | `disputeRoutes` | `dispute.docs.js` |
| Admin | `controllers/admin` | `adminService` | `adminRoutes` | `admin.docs.js` |
| System | `controllers/system` | `systemService` | `systemRoutes` | `system.docs.js` |

---

## 7. Cross-cutting patterns you should follow

### Controllers

```js
// 1) Joi schema for body
// 2) validateAsync
// 3) attach actor: created_by / updated_by = req.user.id
// 4) call service
// 5) return StatusCodes + { message, data }
// 6) catch → next(error)
```

### Services

```js
// Use models from require('../models/definition')
// Throw CustomError(message, StatusCodes.xxx) for business failures
// Use database.transaction() for multi-table writes
// Soft-delete via paranoid + deleted_by where applicable
// Money in integer paisa (bigint) — never float
// Tunable rules from common/settings.js — no magic numbers
```

### Routes

```js
const express = require('express');
const router = express.Router();

const createAppointment = require('../controllers/appointment/createAppointment');
// ... one require per action controller

const createRateLimiter = require('../common/rateLimiter');
const { authenticationMiddleware } = require('../common/authenticationMiddleware');

router.post('/createAppointment', createRateLimiter(), authenticationMiddleware(), createAppointment);
router.post('/getAllAppointments', createRateLimiter(), authenticationMiddleware(), getAllAppointments);
// ...
```

- Require **each controller file** at the top (do not pull handlers from a controllers barrel in route files).
- Always: `createRateLimiter()` then `authenticationMiddleware()` (or `authenticationMiddleware([RoleAuthorizationTypes.Admin])`).
- Prefer `POST /api/actionName` with JSON body.

### Errors

```text
service throws CustomError
  → CustomErrorMiddleware
  → JSON error response
```

### Enums

Put shared constants in `common/enumFunction.js` and import them in Joi / services (do not scatter magic strings).

Appointment statuses, booking types, payment statuses, roles, and media statuses all belong here.

---

## 8. Booking module (critical path — code shape)

```text
models: appointment, appointment_item, appointment_status_history, event_details
        + working_hours, time_off
        + DB exclusion constraint on (staff_id, blocked range) for active statuses

service: appointmentService.js   ← transition() is the only status writer
         availabilityService.js  ← computed slots + Redis cache

controllers/appointment:
  create | getAll | getById | cancel | reschedule
  accept | decline | proposeTime | checkIn | complete | markNoShow | rateAttendance

routes: appointmentRoutes.js
swagger: appointment.docs.js
cron: bookingTimers.cron.js, reminders.cron.js
socket: appointment.requested / appointment.updated
enums: AppointmentStatus*, BookingType* in enumFunction.js
```

Still phase-dependent: online payments (P2), home/urgent/event flows (P3). Schema can exist early; feature flags / settings gate behaviour.

---

## 9. Quick reference — “where do I put X?”

| I need to… | Put it in… |
|------------|------------|
| Add an API endpoint | `controllers/` + `routes/` + swagger |
| Add business logic | `service/` |
| Add a DB table | `models/definition/` + register in `index.js` |
| Add a shared constant | `common/enumFunction.js` |
| Add auth/role check | `routes/*` via `authenticationMiddleware` |
| Add cron / delayed job | `cron/` + start from `bin/www` or `bin/worker` |
| Add realtime event | `socket/` + call from service |
| Add seed data | `seeders/<domain>/` |
| Add a one-off test script | `scratch/` |
| Document a plan | `docs/` or repo root markdown |
| Geo / near-me query | `utils/geo.js` + `searchService` |
| Money / paisa math | `common/money.js` |
| Platform rule value | `platform_settings` via `common/settings.js` |

---

## 10. Keeping this document accurate

When you add a new module:

1. Create the files using the checklist in **§4**
2. Update the relevant inventory section in **§5**
3. Update the domain map in **§6**

That keeps this file the single map of how **Slotify / Groomly** defines and manages backend code.
