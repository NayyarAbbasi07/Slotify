GROOMLY

Complete Technical Implementation Plan, Specification & Production Plan

Barber & Salon Booking Marketplace — React Native (iOS & Android) · Node.js + Express · PostgreSQL

For the Product, Backend, Mobile, QA and DevOps teams

| Document | Details |
| --- | --- |
| Version | 2.0 — supersedes v1.0 "Technical Implementation Plan & Development Specification" |
| Date | September 2026 |
| Status | Draft for review and business sign-off |
| Audience | Product owner, engineering leads, mobile & backend developers, QA, DevOps, finance |
| Convention | Items marked [DECISION] are proposed defaults that the business must confirm before build. |


Contents

If page numbers do not appear, right-click the table and choose "Update Field" in Word.

# 1. Executive Summary

Groomly is a two-sided marketplace that connects customers with barbers and salons. Customers discover professionals through rated, visual profiles and book guaranteed time slots, removing walk-in waiting. Barbers and salons manage their profile, portfolio, staff, availability and booking requests. The platform earns a 5% commission on completed bookings and revenue from paid featured placement.

This version turns the v1.0 outline into a buildable specification. It closes the gaps found in v1.0 (Section 2), fixes the technology decisions to the chosen stack (React Native + Node.js/Express), recommends and designs the database, defines the business rules the code must enforce, and adds a complete production plan covering infrastructure, CI/CD, security, monitoring, releases and costs.

## 1.1 Key Decisions at a Glance

| Area | Decision | Why |
| --- | --- | --- |
| Mobile | React Native with Expo (dev builds + EAS), TypeScript, two apps (Customer, Partner) in one monorepo | One codebase, fast builds, over-the-air fixes, shared types with backend |
| Backend | Node.js 22 LTS + Express 5, TypeScript, modular monolith | Chosen stack; one deployable keeps MVP simple, modules can be split later |
| Database | PostgreSQL 16 + PostGIS (AWS RDS) | Transactions for bookings/payments, database-level double-booking prevention, geo "near me" search |
| Cache / jobs | Redis (ElastiCache) + BullMQ | Reminders, booking expiry, notifications, payouts, Socket.io scaling |
| Real-time | Socket.io with Redis adapter on the API service | Live booking requests, accept/decline, status updates |
| Auth | In-house JWT (access + rotating refresh) with phone OTP, Google and Apple Sign-In | No per-user auth vendor cost; full control of roles |
| Media | S3 + CloudFront, direct upload via pre-signed URLs | Cheap, scalable, keeps large files off the API |
| Hosting | AWS, ECS Fargate, Multi-AZ RDS, Terraform, GitHub Actions | Managed, repeatable, scales without re-architecture |
| Payments | Cash + JazzCash/Easypaisa wallets + cards via a local aggregator; internal ledger | Matches the Pakistani market where cash dominates |
| Launch | Soft launch in one city, then expand | Supply density matters more than geography in a marketplace |

# 2. Review of v1.0 — What Was Missing

v1.0 was a good high-level outline, but a development team could not build or launch from it without making dozens of undocumented decisions. The table below lists every gap found and where this document resolves it.

## 2.1 Gaps

| # | Area | Gap in v1.0 | Resolved in |
| --- | --- | --- | --- |
| 1 | Business rules | No cancellation, no-show, refund, reliability-score, points or voucher rules; no urgent/home/event pricing | Section 4 |
| 2 | Salon staff | Salons "manage staff availability" but there is no Staff entity; bookings cannot be assigned to a stylist | Sections 5, 8 |
| 3 | Booking engine | No slot-generation logic, buffers, time-off, or protection against double booking | Section 6 |
| 4 | Booking lifecycle | Only 5 statuses; no expiry of unanswered requests, cancellations by either side, rescheduling or check-in | Section 6.3 |
| 5 | Cash payments | Commission assumes online payment; most local bookings will be cash, so how is the 5% collected? | Section 11 |
| 6 | Payouts & ledger | No partner wallet, settlement schedule, refunds or reconciliation | Section 11 |
| 7 | Partner verification | No KYC (CNIC, business documents) or approval flow — critical for home visits | Sections 5, 12 |
| 8 | Search & discovery | No geo search, filters, ranking or how featured profiles appear | Sections 5, 8 |
| 9 | Schema | Missing: staff, addresses, devices, sessions, vouchers, points ledger, payouts, notifications, disputes, favourites, audit log | Section 8 |
| 10 | Admin panel timing | Admin moderation scheduled in Phase 3, yet profile approval is needed on day one | Section 17 |
| 11 | Payments in MVP | Payments in Phase 2 but MVP must still handle money (cash + commission tracking) | Sections 11, 17 |
| 12 | Security & privacy | No threat model, RBAC, OTP abuse limits, data retention, account deletion | Section 12 |
| 13 | App store compliance | Missing in-app account deletion, privacy policy, data-safety forms, Sign in with Apple rule | Section 12.5 |
| 14 | Non-functional reqs | No performance, availability, scalability or support targets | Section 13 |
| 15 | Testing | No QA strategy, test types, devices or UAT | Section 14 |
| 16 | Production plan | Only "set up dev/staging/prod"; no infra design, CI/CD, monitoring, backups, DR, release process | Section 15 |
| 17 | Localization | No language (English/Urdu, RTL), currency, or timezone decisions | Sections 3.4, 13 |
| 18 | Customer–partner communication | No chat or masked contact; needed for home visits and events | Section 5 |
| 19 | Analytics & KPIs | No success metrics or event tracking | Section 19 |
| 20 | Team, risks, legal | No team size, risk register, T&Cs, partner agreement | Sections 17, 18, 12 |

## 2.2 Inconsistencies Corrected

- Framework: v1.0 said NestJS in one place and Express in another. This version standardises on Express as chosen, with a strict module structure to get NestJS-like organisation (Section 9.3).

- Database: v1.0 left PostgreSQL vs DynamoDB open. DynamoDB is a poor fit for relational bookings, ledgers and geo search. PostgreSQL is the decision (Section 8.1).

- Auth: v1.0 listed Firebase Auth, Cognito and a separate SMS/OTP provider together — that duplicates OTP cost and logic. One approach is chosen (Section 12.1).

- Architecture drawing: v1.0 drew separate services behind an API Gateway plus Lambda. For a small team this adds cost and operational load. We deploy one API service and one worker service (Section 9).

- Cross-reference: v1.0 hosting row said "see cost notes in section 7", but section 7 was Team Responsibilities. Costs are now in Section 16.

- Hosting cost: v1.0 estimated $65–130/month. That is realistic for a lean setup but not for a highly-available production setup; both options are now costed (Section 16).

- Ratings: v1.0 used one Rating table for two different things (customer reviews and partner attendance ratings). These are split (Section 8).

# 3. Project Overview & Scope

## 3.1 Problem & Solution

Customers waste time walking into shops and waiting, and have no reliable way to judge quality before arriving. Barbers and salons lose revenue to idle slots and no-shows and have little online presence. Groomly gives customers discovery (photos, ratings, prices, distance) and guaranteed slots, and gives professionals a booking book, a portfolio, and a way to be found.

## 3.2 Goals for This Build

- Ship an MVP covering partner onboarding and verification, profiles and portfolio, discovery, standard bookings, notifications, reviews and an admin panel.

- Build a real-time booking flow: request → notification → accept/decline → confirmation → reminder → completion → review.

- Support standard, home, urgent and event bookings (e.g. wedding makeup) as booking types.

- Implement commission tracking for cash and online payments, partner payouts, loyalty points, reliability score, vouchers and featured placement.

- Keep the service/category model generic so new categories (spa, makeup artists, tailoring, etc.) can be added without schema changes.

## 3.3 User Roles

| Role | App / Surface | Description |
| --- | --- | --- |
| Customer | Customer app | Browses, books, pays, cancels/reschedules, reviews, earns points and redeems vouchers. |
| Barber (individual) | Partner app | Owns a single-person business profile; manages services, hours, portfolio, bookings and earnings. |
| Salon owner / manager | Partner app | Owns a multi-staff business; manages staff, their services and schedules, bookings, featuring and payouts. |
| Salon staff member | Partner app (limited) | Sees and handles only their own bookings and schedule. New in v2.0. |
| Admin (super / ops) | Admin web panel | Approves partners, moderates content and reviews, manages categories, featured plans, config. |
| Support agent | Admin web panel | Handles disputes and tickets, can view bookings, cannot change finance settings. |
| Finance | Admin web panel | Payouts, refunds, commission invoices, reconciliation reports. |

## 3.4 Assumptions

- Launch market is Pakistan: currency PKR, timezone Asia/Karachi, phone numbers in E.164 format (+92).

- Languages: English and Urdu (RTL) from launch, [DECISION] — Urdu can move to Phase 2 if timelines are tight, but the app must be built RTL-ready from day one.

- Most customers will pay cash at the start; online payment is encouraged through vouchers/points and required for event deposits.

- Salons may share one device at reception, so the Partner app must support a salon-level view as well as per-staff login.

## 3.5 Scope

| In scope (all phases) | Out of scope (for now) |
| --- | --- |
| Customer app (iOS, Android) Partner app (iOS, Android) Admin web panel Backend API, worker, database, infrastructure Payment gateway, SMS, push, maps integrations Commission, payouts, loyalty, vouchers, featuring | Product sales / e-commerce inside the app Salon POS, inventory or payroll Partner subscriptions (beyond featuring) Marketing website beyond a simple landing page Multi-country, multi-currency In-app video calls |

# 4. Business Rules & Policies

Important:  All numbers below are proposed defaults. Store every value in a platform_settings table so the admin can change them without a new app release. Each is a [DECISION] for the business owner.

## 4.1 Booking Types

| Type | Where | Rules | Pricing |
| --- | --- | --- | --- |
| Standard | At the shop/salon | Book any open slot from 30 min to 30 days ahead. Partner must respond within 30 min (or auto-accept if enabled). | Service price |
| Urgent | At the shop/salon | Slot within the next 2 hours. Broadcast to the chosen partner; response SLA 10 min, otherwise expires and customer is offered nearby alternatives. | Service price + urgent fee (e.g. 10–15%) set by partner, capped by admin |
| Home | Customer address | Only verified partners who enabled home service. Service radius set by partner (e.g. up to 10 km). Travel buffer added before and after. | Service price + home-visit fee (flat or per km) |
| Event | Venue or home (e.g. bridal makeup) | Booked 3–180 days ahead; may need a consultation; multi-hour block; can include several people. | Quote or package price; deposit (e.g. 20–30%) paid online to confirm |

## 4.2 Commission

- Commission = 5% of the service amount (excluding tips, and excluding urgent/home fees [DECISION]), charged only when a booking reaches COMPLETED.

- Online payments: commission is deducted before the partner payout.

- Cash payments: commission is recorded as an amount owed by the partner in their wallet (see Section 11.3).

- Commission rate is stored per booking at creation time so later rate changes do not affect existing bookings.

- Admin can set a different rate per partner (e.g. 0% promotional period for early partners).

## 4.3 Cancellation, No-show and Refunds

| Event | Default rule |
| --- | --- |
| Customer cancels > 3 hours before | Free. Any online payment fully refunded to original method or to Groomly wallet. |
| Customer cancels < 3 hours before | Late cancellation: reliability score penalty; for prepaid bookings up to 50% may be retained for the partner. |
| Customer no-show (15 min grace passed, partner marks no-show) | Reliability penalty; prepaid amount retained per partner policy; customer can dispute within 48 h. |
| Partner declines / request expires | No penalty to customer; full refund if prepaid; partner response rate affected. |
| Partner cancels confirmed booking | Full refund; partner cancellation rate tracked; repeated cancellations reduce ranking and can trigger suspension. |
| Event deposit | Refundable until 7 days before the event; after that non-refundable unless partner cancels. |
| Disputes | Opened within 48 h of the appointment time; resolved by support within 3 working days. |

## 4.4 Customer Reliability Score

Every customer starts at 100 (range 0–100). The score is visible to partners on each request so they can decide whether to accept.

| Event | Change |
| --- | --- |
| Completed booking | +2 (max 100) |
| Cancellation > 3 h before | 0 |
| Late cancellation | −10 |
| No-show | −25 |
| Partner rates attendance "late > 15 min" | −5 |
| Score below 60 | Customer must prepay online to book |
| Score below 30 | Booking blocked; contact support |

## 4.5 Loyalty Points & Vouchers

- Earn 1 point per PKR 100 spent on completed bookings; bonus points for first booking, reviews with photos and referrals.

- Redeem 500 points = PKR 250 voucher (example rate). Points expire 12 months after they are earned.

- Voucher types: platform-funded (Groomly bears the cost) and partner-funded (the partner offers a discount). The funding source must be stored on every voucher because it changes the payout calculation.

- Voucher rules: minimum spend, expiry date, usage limit (total and per customer), eligible categories/partners, first-booking-only flag.

- Points and vouchers are recorded in an append-only ledger — never update a balance without a matching ledger row.

## 4.6 Featured Placement

- Partners buy featured plans (e.g. 7, 15, 30 days) per city/area and category, paid online in advance.

- Featured profiles appear in a "Featured" strip and get a ranking boost in search, always labelled "Featured" / "Sponsored".

- A cap on featured slots per area (e.g. 5) keeps results useful; if full, the next start date is offered.

- Only verified partners with rating ≥ 3.5 (or new partners with no ratings) can buy featuring.

## 4.7 Payouts

- Partner earnings from online payments are paid weekly (e.g. every Monday) for bookings completed and not disputed in the previous week, by bank transfer / Raast / mobile wallet.

- Minimum payout threshold (e.g. PKR 1,000); below that, the balance rolls over.

- Commission owed from cash bookings is first netted against online earnings; any remaining amount becomes a payable invoice.

- If a partner owes more than a limit (e.g. PKR 5,000) for more than 14 days, new bookings are paused until paid.

# 5. Functional Requirements

## 5.1 Customer App

| Module | Features | Phase |
| --- | --- | --- |
| Onboarding & auth | Phone OTP login; Google and Apple Sign-In; profile (name, gender optional, photo); location permission; language selection | 1 |
| Discovery | Home feed: nearby, top-rated, featured, categories; map view and list view; search by name/service; filters (distance, price, rating, gender of staff, home service, open now); sort | 1 |
| Partner profile | Photos/videos portfolio, services with price and duration, staff list, hours, location on map, rating breakdown and reviews, amenities, directions | 1 |
| Booking | Choose service(s) → staff (or "any") → date → available slot → booking type → confirm; add notes; see live status; add to calendar | 1 |
| Home & urgent booking | Saved addresses with map pin; urgent "next 2 hours" flow; fees shown before confirm | 3 |
| Event booking | Event date/venue, number of people, package selection or quote request, deposit payment | 3 |
| My bookings | Upcoming/past, cancel, reschedule request, rebook, get directions, contact partner (in-app chat) | 1 |
| Payments | Pay cash, wallet (JazzCash/Easypaisa) or card; receipts; refunds status | 2 |
| Reviews | Rate 1–5 with comment and photos after completion; edit within 7 days | 1 |
| Loyalty | Points balance and history, reliability score, vouchers, apply voucher at checkout, referral code | 2 |
| Favourites | Save partners; notified of their offers | 1 |
| Notifications | Push and in-app inbox; preferences | 1 |
| Support | Help centre/FAQ, raise a dispute on a booking, contact support | 1 |
| Account | Edit profile, language, notification settings, delete account (required by app stores), logout from all devices | 1 |

## 5.2 Partner App (Barber / Salon)

| Module | Features | Phase |
| --- | --- | --- |
| Onboarding & verification | Choose Barber or Salon; business details, address pin, CNIC front/back, selfie, business documents (optional for individuals); submit for admin approval; status tracking | 1 |
| Business profile | Name, bio, cover photo, amenities, gender served, home service on/off with radius and fee, urgent on/off | 1 |
| Services | Categories, name, price, duration, buffer, description, which staff can perform it | 1 |
| Staff (salon) | Invite staff by phone, assign services, set individual hours, activate/deactivate, per-staff login with limited access | 1 |
| Availability | Weekly hours per staff, breaks, time off/holidays, block slots, max bookings per day, auto-accept toggle | 1 |
| Booking inbox | Real-time new requests with sound alert, customer reliability score, accept/decline with reason, suggest another time | 1 |
| Calendar | Day/week view per staff, walk-in entries (block time), check-in, complete, mark no-show, rate attendance | 1 |
| Portfolio | Upload photos/short videos, tag with service, reorder, delete | 1 |
| Earnings & wallet | Earnings summary, commission owed, payout history, bank/wallet details, pay outstanding commission | 2 |
| Featuring | Buy featured plan, see performance (views, taps, bookings) | 2 |
| Offers | Create partner-funded discounts | 2 |
| Reviews | See reviews, reply publicly once, report abusive reviews | 1 |
| Insights | Bookings, revenue, no-show rate, repeat customers, profile views | 2 |

## 5.3 Admin Web Panel

| Module | Features | Phase |
| --- | --- | --- |
| Dashboard | Live counts: bookings today, GMV, new signups, pending approvals, open disputes | 1 |
| Partner management | Approval queue with KYC documents, approve/reject with reason, suspend, commission override | 1 |
| Customer management | Search, view history, reliability score adjust (with reason), block | 1 |
| Content moderation | Portfolio media and reviews flagged by users or automated checks; remove/restore | 1 |
| Bookings | Search and view any booking with its full status history; admin cancel with refund | 1 |
| Catalogue | Categories and service templates (multi-level, supports new verticals) | 1 |
| Disputes & support | Tickets, notes, resolutions, refunds | 1–2 |
| Finance | Payment transactions, refunds, payout batches (generate, approve, export, mark paid), commission invoices, reconciliation reports | 2 |
| Featured & vouchers | Featured plans and pricing, slot caps, voucher campaigns | 2 |
| Settings | All business rule values (Section 4), app minimum versions, feature flags, notification templates | 1 |
| Access control | Admin users, roles (super admin, ops, support, finance), audit log of every admin action | 1 |

## 5.4 Notifications Matrix

| Trigger | Recipient | Channels |
| --- | --- | --- |
| New booking request | Partner (and assigned staff) | Push + socket + sound; SMS fallback if unopened in 10 min (urgent only) |
| Accepted / declined / expired | Customer | Push + socket + inbox |
| Reminder 24 h and 1 h before | Customer, partner | Push |
| Cancelled / rescheduled | Other party | Push + inbox |
| Completed → review request | Customer | Push (1 h after completion) |
| Payment received / refund issued | Customer / partner | Push + inbox + receipt |
| Partner approved / rejected | Partner | Push + SMS |
| Payout sent / commission due | Partner | Push + inbox |
| New chat message | Other party | Push |

## 5.5 In-app Chat

Simple 1-to-1 text chat per booking (not an open messenger), available from request until 24 hours after the appointment. Phone numbers are hidden by default to protect both sides and prevent bookings leaking off-platform. Messages are stored in PostgreSQL and delivered via Socket.io, with push when the app is closed. Phase 1 can ship with "call via app" hidden and chat added in Phase 1.5 if time is short [DECISION].

# 6. Booking Engine Design

The booking engine is the heart of the product and the area most likely to cause bugs. It must never double-book a staff member, must handle two customers tapping the same slot at the same second, and must respect time zones, buffers and time off.

## 6.1 Slot Generation

Slots are calculated on request, not stored. For a given partner, service, staff member (or "any staff") and date:

- Load the staff member's weekly working hours for that weekday, then remove breaks and time-off entries for that date.

- Remove time taken by existing appointments in status REQUESTED, PENDING_PAYMENT or ACCEPTED (including their buffers and, for home visits, travel buffers).

- Walk the remaining free windows in steps of the slot interval (default 15 min) and keep start times where service duration + buffer fits completely.

- Remove slots earlier than now + minimum notice (e.g. 30 min), and slots beyond the maximum booking window (e.g. 30 days).

- For "any staff", merge results across all staff who can perform the service and remember which staff member is free for each slot.

Cache computed slots in Redis for 60 seconds per (staff, date) and invalidate on any booking or schedule change for that staff member.

## 6.2 Preventing Double Booking

Checking availability in application code is not enough — two requests can pass the check at the same time. The database must be the final guard. PostgreSQL supports an exclusion constraint that makes overlapping active bookings for the same staff member impossible:

CREATE EXTENSION IF NOT EXISTS btree_gist;


ALTER TABLE appointments ADD CONSTRAINT no_overlapping_bookings

EXCLUDE USING gist (

staff_id WITH =,

tstzrange(blocked_start_at, blocked_end_at, '[)') WITH &&

) WHERE (status IN ('PENDING_PAYMENT', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS'));


blocked_start_at / blocked_end_at include buffers and travel time. If the insert violates the constraint, the API returns 409 SLOT_TAKEN and the app refreshes the slots. The create-booking endpoint also requires an Idempotency-Key header so a retried request never creates two bookings.

## 6.3 Appointment Lifecycle


Figure 1 — Appointment states and transitions

| Timer / rule | Default | Handled by |
| --- | --- | --- |
| Partner response SLA — standard | 30 min (or earlier if appointment is sooner) | BullMQ delayed job → EXPIRED |
| Partner response SLA — urgent | 10 min | BullMQ delayed job → EXPIRED + suggest alternatives |
| Payment window (PENDING_PAYMENT) | 15 min | BullMQ delayed job → EXPIRED, slot released |
| No-show grace period | 15 min after start | Partner action; auto-prompt at +15 min |
| Auto-complete if partner forgets | 6 h after scheduled end | Scheduled job → COMPLETED (customer can dispute) |
| Reminders | 24 h and 1 h before | BullMQ delayed jobs (cancelled if booking cancelled) |

Every status change is written to appointment_status_history (from, to, actor, reason, timestamp) in the same database transaction as the change. Transitions not shown in Figure 1 are rejected by a single transition() function in the booking module — no other code may update status directly.

## 6.4 Time Zones

- Store all timestamps as timestamptz in UTC. Store each partner's timezone (default Asia/Karachi) and generate slots in that zone.

- Weekly hours are stored as local times (e.g. 10:00–22:00) and converted per date, so daylight-saving changes (if ever introduced) do not break schedules.

- The API returns ISO-8601 strings with offset; the apps format them with the device locale.

# 7. Technology Stack (Final)

## 7.1 Mobile Apps

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | React Native (latest stable, New Architecture) with Expo SDK — dev builds, not Expo Go | Expo is now the recommended way to start React Native apps; native modules still possible via config plugins |
| Language | TypeScript (strict) | Shared types with backend |
| Repo | Monorepo (pnpm workspaces + Turborepo): apps/customer, apps/partner, apps/admin, packages/ui, packages/api-client, packages/shared | Two separate store listings from one codebase |
| Navigation | Expo Router (built on React Navigation) or React Navigation | Deep links for notifications and shared profile links |
| Server state | TanStack Query | Caching, retries, background refresh |
| Client state | Zustand | Lighter than Redux for this app size |
| Forms / validation | React Hook Form + Zod | Zod schemas shared with backend |
| UI | Own design system in packages/ui (Tamagui/NativeWind optional), RTL support | Built from Figma design tokens |
| Maps & location | react-native-maps (Google Maps provider), expo-location, Google Places autocomplete via backend proxy | Keep Maps API keys restricted by app signature |
| Push | expo-notifications with FCM (Android) and APNs (iOS) | Device tokens stored per user/device |
| Real-time | socket.io-client | Reconnect with auth token; fall back to polling |
| Media | expo-image-picker, expo-image-manipulator (compress before upload), expo-image (cached display) | Direct upload to S3 with pre-signed URL |
| Auth | expo-apple-authentication, Google Sign-In, secure token storage in expo-secure-store | Never store tokens in AsyncStorage |
| i18n | i18next + react-i18next, English and Urdu | RTL layout switch |
| Quality | ESLint, Prettier, Jest + React Native Testing Library, Maestro (E2E) | Run in CI |
| Monitoring | Sentry (crashes, performance), Firebase Analytics or PostHog (product analytics) | Source maps uploaded per build |
| Build & release | EAS Build, EAS Submit, EAS Update (over-the-air JS updates) | See Section 15.6 |

## 7.2 Backend

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Node.js 22 LTS | Use an LTS line and upgrade once a year |
| Framework | Express 5 + TypeScript | Modular structure (Section 9.3) |
| Validation | Zod on every request body, query and params | Same schemas generate OpenAPI docs |
| API docs | OpenAPI 3.1 via zod-to-openapi, served with Swagger UI / Redoc on non-prod | Mobile client generated from spec |
| ORM / DB access | Prisma (schema, migrations, typed queries) + raw SQL for PostGIS and constraints | Alternative: Drizzle ORM if the team prefers SQL-first |
| Jobs | BullMQ on Redis | Delayed jobs, retries, cron (repeatable jobs) |
| Real-time | Socket.io + @socket.io/redis-adapter | Rooms per user and per partner |
| Auth | jose (JWT), argon2 (for admin passwords), google-auth-library, Apple JWKS verification | Section 12.1 |
| Security middleware | helmet, cors (allow-list), express-rate-limit with Redis store, hpp |  |
| Logging | pino (JSON logs) with request ID correlation | Shipped to CloudWatch |
| Errors & APM | Sentry Node SDK; OpenTelemetry optional |  |
| Testing | Vitest/Jest, Supertest, Testcontainers (real Postgres/Redis in tests) |  |
| Admin panel | Next.js (React, TypeScript) + TanStack Table + a UI kit (e.g. shadcn/ui) | Deployed as static/SSR app behind CloudFront |

## 7.3 Third-Party Services

| Service | Purpose | Options |
| --- | --- | --- |
| Payment gateway | Wallet and card payments, refunds, webhooks | JazzCash, Easypaisa, or an aggregator covering both plus cards (e.g. PayFast, Safepay) — compare fees and settlement terms |
| SMS / OTP | Login OTP, critical fallback alerts | Local SMS aggregator (cheapest for +92) with an international fallback (e.g. Twilio) |
| Push | Notifications | Firebase Cloud Messaging + APNs via Expo push service or direct FCM |
| Maps | Map tiles, geocoding, place autocomplete, distance | Google Maps Platform (Mapbox as a cheaper alternative for tiles) |
| Identity verification | CNIC checks for partners | Manual review in MVP; NADRA-linked verification service later |
| Email | Receipts, admin notifications | Amazon SES |
| Monitoring | Errors, uptime | Sentry, CloudWatch, an uptime checker (e.g. Better Stack) |

# 8. Database Design

## 8.1 Recommendation: PostgreSQL 16 + PostGIS

Groomly's data is strongly relational (users → businesses → staff → services → appointments → payments → ledger entries) and correctness matters more than raw write volume. PostgreSQL is the right primary database.

| Requirement | PostgreSQL + PostGIS | MongoDB | DynamoDB |
| --- | --- | --- | --- |
| Multi-table transactions (booking + payment + ledger) | Native, mature | Supported, but less natural | Limited (25 items), complex |
| Prevent double booking at DB level | Exclusion constraint | Must build in app code | Must build in app code |
| "Near me" geo search with filters and sorting | PostGIS, excellent | Good (2dsphere) | Poor; needs extra service |
| Reporting / admin queries / finance | SQL, joins, window functions | Aggregation pipelines | Very hard; export needed |
| Flexible attributes (amenities, event details) | JSONB columns | Native | Native |
| Team familiarity and hiring | Very common | Common | Less common |
| Managed on AWS | RDS / Aurora | Atlas (third party) / DocumentDB | Native |

Supporting stores: Redis for cache, slot cache, OTP codes, rate limits, BullMQ queues and Socket.io adapter; S3 for media; later, OpenSearch only if search needs typo tolerance and ranking beyond what PostgreSQL full-text + trigram search provides (unlikely before tens of thousands of partners).

## 8.2 Data Conventions

- Primary keys: UUID v7 (time-ordered, safe to expose, index-friendly).

- Money: integer minor units (paisa) in bigint columns plus a currency column ('PKR'). Never use floating point for money.

- Time: timestamptz in UTC; created_at, updated_at on every table.

- Soft delete (deleted_at) for users, businesses, services and media; hard delete of personal data on account-deletion requests after the retention period.

- Enums as PostgreSQL enums or check constraints; status history tables for appointments, payouts and verification.

- Balances (points, wallet) are derived from append-only ledger tables; cached balance columns are updated in the same transaction.

- Migrations only through Prisma Migrate files in Git; no manual changes in production.

## 8.3 Schema by Domain

Core tables and key columns. Final column types and indexes are completed during Sprint 0 in the Prisma schema.

### Identity & Access

| Table | Key columns | Notes |
| --- | --- | --- |
| users | id, phone (unique), email, name, avatar_url, gender, locale, status (active/blocked/deleted), created_at | One row per person |
| user_roles | user_id, role (customer/partner_owner/staff/admin/support/finance) | A person can be both customer and staff |
| auth_identities | id, user_id, provider (phone/google/apple), provider_user_id, email | Links social logins to the user |
| sessions | id, user_id, device_id, refresh_token_hash, expires_at, revoked_at, ip, user_agent | Refresh token rotation, "log out all devices" |
| devices | id, user_id, platform, push_token, app_version, last_seen_at | Push delivery, force-update checks |
| addresses | id, user_id, label, line1, area, city, location geography(Point), instructions | Home bookings |

### Businesses & Catalogue

| Table | Key columns | Notes |
| --- | --- | --- |
| businesses | id, owner_user_id, type (barber/salon), name, slug, bio, phone, location geography(Point), address, city, area, timezone, gender_served, amenities jsonb, home_service_enabled, home_radius_km, home_fee, urgent_enabled, auto_accept, commission_rate_bps, status (draft/pending/approved/rejected/suspended), rating_avg, rating_count, is_featured (cached) | Replaces v1.0 ProfessionalProfile |
| business_verifications | id, business_id, cnic_number (encrypted), document_urls, selfie_url, status, reviewed_by, reason, reviewed_at | KYC; files in a private S3 bucket |
| staff_members | id, business_id, user_id (nullable), display_name, photo_url, title, is_active | Barber business = one staff row (the owner) |
| categories | id, parent_id, name_en, name_ur, icon, sort_order, is_active | Tree; new verticals = new top-level category |
| services | id, business_id, category_id, name, description, price, duration_min, buffer_min, is_home_available, is_active |  |
| staff_services | staff_id, service_id, price_override, duration_override | Who can do what |
| portfolio_media | id, business_id, staff_id, service_id, type (image/video), s3_key, thumb_key, width, height, status (pending/approved/removed), sort_order | Moderated |
| favourites | user_id, business_id, created_at |  |

### Availability & Booking

| Table | Key columns | Notes |
| --- | --- | --- |
| working_hours | id, staff_id, weekday, start_time, end_time | Multiple rows per day allowed (split shifts) |
| time_off | id, staff_id (or business_id), start_at, end_at, reason | Holidays, leave, blocked slots, walk-ins |
| appointments | id, code (short, human-readable), customer_id, business_id, staff_id, type (standard/home/urgent/event), status, start_at, end_at, blocked_start_at, blocked_end_at, address_id, subtotal, fees, discount, total, commission_rate_bps, commission_amount, payment_method (cash/online), payment_status, voucher_id, customer_note, cancel_reason, cancelled_by, idempotency_key | Exclusion constraint (Section 6.2) |
| appointment_items | id, appointment_id, service_id, name_snapshot, price_snapshot, duration_snapshot | Multiple services per booking; prices frozen |
| appointment_status_history | id, appointment_id, from_status, to_status, actor_user_id, reason, created_at | Audit trail |
| event_details | appointment_id, event_date, venue, people_count, package, deposit_amount, deposit_due_at | Event bookings |
| conversations / messages | conversation(appointment_id); message(id, conversation_id, sender_id, body, attachment_key, read_at) | Booking chat |

### Reviews, Loyalty & Growth

| Table | Key columns | Notes |
| --- | --- | --- |
| reviews | id, appointment_id (unique), customer_id, business_id, staff_id, rating, comment, photo_keys, reply, reply_at, status | Customer → partner (public) |
| attendance_ratings | id, appointment_id, rated_by_business_id, customer_id, outcome (on_time/late/no_show), note | Partner → customer (private); feeds reliability |
| loyalty_accounts | customer_id, points_balance, reliability_score | Cached balances |
| points_ledger | id, customer_id, delta, reason, appointment_id, expires_at, created_at | Append-only |
| reliability_events | id, customer_id, delta, reason, appointment_id | Append-only |
| vouchers | id, code, funded_by (platform/business), business_id, type (fixed/percent), value, min_spend, max_discount, starts_at, ends_at, usage_limit, per_user_limit, conditions jsonb |  |
| voucher_redemptions | id, voucher_id, customer_id, appointment_id, amount, status |  |
| referrals | id, referrer_id, referee_id, status, reward_points |  |
| featured_plans / featured_placements | plan(id, days, price, city); placement(id, business_id, plan_id, area, category_id, starts_at, ends_at, payment_id, status) | Replaces v1.0 FeaturedPlacement |

### Payments & Finance

| Table | Key columns | Notes |
| --- | --- | --- |
| payments | id, appointment_id / featured_placement_id, payer_id, amount, method, gateway, gateway_ref, status (initiated/succeeded/failed/refunded), idempotency_key | One per charge attempt |
| refunds | id, payment_id, amount, reason, status, gateway_ref |  |
| gateway_events | id, gateway, event_type, payload jsonb, signature_valid, processed_at | Raw webhooks, processed once |
| ledger_entries | id, account (customer_wallet / business_wallet / platform_revenue / gateway_clearing), business_id, amount (+/−), type, reference_type, reference_id, created_at | Double-entry: every movement has balancing rows |
| payout_accounts | id, business_id, method (bank/raast/wallet), title, iban/number (encrypted), verified |  |
| payouts | id, business_id, period_start, period_end, gross, commission, adjustments, net, status (draft/approved/paid/failed), reference | Weekly batches |

### Platform & Operations

| Table | Key columns | Notes |
| --- | --- | --- |
| notifications | id, user_id, type, title, body, data jsonb, read_at, sent_channels | In-app inbox |
| disputes | id, appointment_id, raised_by, reason, description, status, resolution, assigned_to |  |
| reports | id, reporter_id, target_type (review/media/user/business), target_id, reason, status | User reports |
| platform_settings | key, value jsonb, updated_by, updated_at | All business rules from Section 4 |
| app_versions | platform, app (customer/partner), min_supported, latest | Force-update |
| admin_audit_log | id, admin_user_id, action, entity_type, entity_id, before jsonb, after jsonb, ip, created_at | Every admin write |

## 8.4 Key Indexes and Queries

- businesses(location) GiST index; businesses(status, city); trigram index on businesses.name and services.name for search.

- appointments(customer_id, start_at DESC), appointments(business_id, start_at), appointments(staff_id, blocked_start_at) plus the exclusion constraint.

- ledger_entries(business_id, created_at); unique payments(idempotency_key); unique gateway_events(gateway, gateway_ref, event_type).

Example "near me" query:

SELECT b.id, b.name, b.rating_avg,

ST_Distance(b.location, ST_MakePoint(:lng, :lat)::geography) AS distance_m

FROM businesses b

WHERE b.status = 'approved'

AND ST_DWithin(b.location, ST_MakePoint(:lng, :lat)::geography, :radius_m)

ORDER BY b.is_featured DESC, distance_m ASC

LIMIT 20;


## 8.5 Search Ranking

Default ranking score combines distance, rating (Bayesian average so a single 5-star review does not outrank 200 reviews at 4.8), response rate, cancellation rate and recency of activity. Featured partners appear in a separate labelled strip and receive a fixed boost. Weights live in platform_settings.

# 9. System Architecture


Figure 2 — Logical architecture

## 9.1 Modular Monolith

The backend is one Express application split into domain modules, deployed as two processes from the same Docker image: the API service (HTTP + WebSocket) and the worker service (background jobs). Modules talk to each other only through their public service functions and domain events, never by reaching into another module's tables. This gives a small team one codebase, one deployment and simple transactions, while leaving a clean path to split out a module (e.g. notifications or payments) later if load demands it.

## 9.2 Request Flow

- The app calls https://api.groomly.pk/v1/... (domain illustrative) with a bearer access token.

- CloudFront and WAF filter abusive traffic; the load balancer forwards to a healthy API task.

- Middleware: request ID → security headers → rate limit → auth (JWT verify) → role check → Zod validation.

- The route handler calls the module service; the service uses a database transaction and emits domain events (e.g. appointment.requested).

- Event handlers push socket messages and enqueue jobs (push notification, reminder, expiry timer) in BullMQ.

- The worker processes jobs with retries and dead-letter handling.

## 9.3 Backend Project Structure

groomly-api/

src/

app.ts                 # express app, middleware, routes

server.ts              # http + socket.io bootstrap (API process)

worker.ts              # BullMQ workers bootstrap (worker process)

config/                # env parsing with zod, settings loader

core/                  # db (prisma), redis, logger, errors, auth, events, queue, storage

modules/

auth/  users/  businesses/  catalog/  availability/  bookings/

payments/  wallet/  payouts/  reviews/  loyalty/  vouchers/

featured/  notifications/  chat/  search/  admin/  disputes/

<module>/

<module>.routes.ts      # express router, only wiring

<module>.controller.ts  # http in/out

<module>.service.ts     # business logic (the only public API)

<module>.repo.ts        # data access

<module>.schemas.ts     # zod request/response schemas

<module>.events.ts      # events emitted / handled

<module>.jobs.ts        # background jobs

__tests__/

prisma/ (schema.prisma, migrations/, seed.ts)

test/ (integration, fixtures)

Dockerfile  docker-compose.yml  .env.example


## 9.4 Real-time Design

- Clients connect to Socket.io with the access token; the server joins them to rooms user:{id} and, for partners, business:{id} and staff:{id}.

- Events: appointment.requested, appointment.updated (any status change), appointment.reminder, chat.message, availability.changed.

- Sockets are for speed only; the database is the source of truth. On reconnect the app re-fetches current state, and every important event also goes out as a push notification.

- The Redis adapter lets any API task emit to users connected to another task, so the API scales horizontally.

## 9.5 Background Jobs

| Queue | Jobs |
| --- | --- |
| booking-timers | Expire unanswered requests, payment timeouts, no-show prompts, auto-complete |
| notifications | Push (FCM/APNs), SMS, email; retries with backoff; remove invalid device tokens |
| reminders | 24 h / 1 h reminders; review requests |
| media | Generate thumbnails, strip EXIF location data, video poster frames, optional content moderation |
| finance (cron) | Nightly reconciliation with gateway, weekly payout batch, commission invoices, points expiry |
| maintenance (cron) | Recalculate ratings and ranking scores, clean expired sessions and OTPs, featured placement start/end |

## 9.6 Media Pipeline

App requests a pre-signed PUT URL (content type and max size enforced) → uploads directly to a private S3 bucket → calls POST /media/confirm → worker creates resized WebP variants and a thumbnail, removes EXIF GPS data, marks the media pending moderation → approved media is served through CloudFront with long cache lifetimes. Limits: images 10 MB, videos 60 seconds / 50 MB [DECISION].

# 10. API Specification

## 10.1 Conventions

- Base URL /v1; JSON only; OpenAPI 3.1 spec is the contract and is agreed before UI work on each feature.

- Auth: Authorization: Bearer <access token>; access token 15 min, refresh token 30 days with rotation.

- Pagination: cursor-based ?cursor=&limit= returning { data, nextCursor }.

- Idempotency: Idempotency-Key header required on booking creation, payments and payouts.

- Errors: { "error": { "code": "SLOT_TAKEN", "message": "...", "details": {} } } with correct HTTP status (400, 401, 403, 404, 409, 422, 429, 500).

- Versioning: breaking changes go to /v2; old app versions are handled by the minimum-version check (Section 15.6).

- Money returned as integer minor units plus formatted string; times as ISO-8601 with offset.

## 10.2 Endpoints

| Domain | Endpoints |
| --- | --- |
| Auth | POST /auth/otp/request · POST /auth/otp/verify · POST /auth/google · POST /auth/apple · POST /auth/refresh · POST /auth/logout · POST /auth/logout-all |
| Me | GET /me · PATCH /me · DELETE /me (account deletion) · GET/POST/PATCH/DELETE /me/addresses · POST /me/devices · GET /me/notifications · PATCH /me/notifications/:id/read |
| Discovery | GET /categories · GET /search?lat&lng&q&category&filters · GET /businesses/featured · GET /businesses/:id · GET /businesses/:id/reviews · GET /businesses/:id/media · POST/DELETE /favourites/:businessId |
| Availability | GET /businesses/:id/slots?serviceIds&staffId&date&type |
| Bookings (customer) | POST /appointments · GET /appointments · GET /appointments/:id · POST /appointments/:id/cancel · POST /appointments/:id/reschedule · POST /appointments/:id/review · POST /appointments/:id/dispute |
| Partner: business | POST /partner/businesses · PATCH /partner/business · POST /partner/business/verification · CRUD /partner/services · CRUD /partner/staff · PUT /partner/staff/:id/hours · CRUD /partner/time-off · POST /partner/media/upload-url · POST /partner/media/confirm · DELETE /partner/media/:id |
| Partner: bookings | GET /partner/appointments?date&staffId&status · POST /partner/appointments/:id/accept · /decline · /propose-time · /check-in · /complete · /no-show · POST /partner/appointments/:id/attendance · POST /partner/reviews/:id/reply |
| Partner: money | GET /partner/wallet · GET /partner/ledger · GET /partner/payouts · PUT /partner/payout-account · POST /partner/commission/pay · GET /featured/plans · POST /partner/featured |
| Payments | POST /payments/intent (booking, deposit, featuring, commission) · GET /payments/:id · POST /webhooks/:gateway (signature-verified, public) |
| Loyalty | GET /me/loyalty · GET /me/points · GET /me/vouchers · POST /vouchers/validate · POST /me/points/redeem · GET /me/referral |
| Chat | GET /appointments/:id/messages · POST /appointments/:id/messages |
| Admin | /admin/* — dashboards, approvals, users, businesses, bookings, disputes, reports, catalogue, settings, featured, vouchers, payouts, refunds, audit log (role-restricted) |
| System | GET /health (liveness) · GET /ready (DB/Redis check) · GET /app-config (min versions, feature flags) |

## 10.3 Socket Events

| Event | Direction | Payload |
| --- | --- | --- |
| appointment.requested | Server → partner rooms | appointment summary, customer name, reliability score, expires_at |
| appointment.updated | Server → both parties | id, status, updated fields |
| chat.message | Server → other party | conversation id, message |
| availability.changed | Server → viewers of a business | staff id, date (client re-fetches slots) |
| ping / auth.refresh | Client → server | keep-alive, token refresh on long sessions |

# 11. Payments & Financial Flows

Compliance check:  Collecting money on behalf of partners and paying them later is regulated. Before build, confirm with the chosen gateway and a legal adviser that Groomly's merchant agreement permits marketplace collection and payouts, or whether a split-settlement / sub-merchant product is required.

## 11.1 Online Payment Flow

- App calls POST /payments/intent with the booking and an idempotency key; the backend creates a payments row (initiated) and gets a checkout/redirect or wallet-push request from the gateway.

- Customer completes payment in the gateway page, wallet app, or via mobile-wallet push/OTP.

- Gateway calls POST /webhooks/:gateway. The backend verifies the signature, stores the raw event once (gateway_events), and in one transaction marks the payment succeeded and writes ledger entries.

- The app polls GET /payments/:id or receives a socket update; the booking moves from PENDING_PAYMENT to REQUESTED.

- Never trust the app's "success" redirect alone — only the verified webhook or a server-side status query confirms payment.

## 11.2 Ledger Entries (Example: PKR 2,000 online booking)

| Moment | Entries |
| --- | --- |
| Payment captured | gateway_clearing +2,000 / customer_payments −2,000 (money held for booking) |
| Booking completed | business_wallet +1,900 · platform_revenue +100 (5%) |
| Gateway fee (e.g. 2%) | platform_expense −40 (absorbed by platform [DECISION]: or passed on) |
| Weekly payout sent | business_wallet −1,900 · bank_out +1,900 |
| Refund before completion | reverse the capture entries; refund row linked to payment |

## 11.3 Cash Bookings

- Customer pays the partner directly. When the partner marks COMPLETED, the system records business_wallet −100 (commission owed) for a PKR 2,000 booking.

- Owed commission is netted against the next online payout. If the partner has no online earnings, they pay via POST /partner/commission/pay (wallet/card) from the Partner app.

- Controls against off-platform leakage and under-reporting: hidden phone numbers, customer confirmation prompt ("Did your appointment happen?"), comparing completion vs. review data, and the owed-amount booking pause in Section 4.7.

## 11.4 Reconciliation

A nightly job pulls the gateway's settlement report and matches every transaction to a payments row by gateway reference and amount. Mismatches (missing webhook, amount difference, unexpected refund) create an alert and appear in the Finance screen. Payout batches require approval by a Finance user and are exported in the bank's bulk-transfer format.

# 12. Security, Privacy & Compliance

## 12.1 Authentication

- Customers and partners: phone number + 6-digit OTP (primary), plus Google and Apple Sign-In. Social sign-in users verify a phone number once, because bookings need a reachable number.

- OTP: stored hashed in Redis, 5-minute expiry, max 5 attempts, max 3 sends per 15 minutes per number and per device/IP, cooldown timer in the app. Watch for SMS-pumping fraud (block premium ranges, restrict to +92 at launch).

- Tokens: short-lived access JWT (15 min, signed with rotating keys) and opaque refresh token (30 days) stored hashed in sessions; refresh rotation with reuse detection revokes the whole session family.

- Admins: email + strong password (argon2) + mandatory TOTP two-factor; admin panel reachable only over HTTPS and optionally IP allow-listed.

## 12.2 Authorization

- Role-based access control plus ownership checks on every query (a partner can only access their own business; staff only their own appointments unless given manager permission).

- Authorization is checked in the service layer, not only in routes, and covered by automated tests for each role (to prevent IDOR — accessing another user's record by changing an ID).

## 12.3 Data Protection

- TLS 1.2+ everywhere; RDS, S3, Redis and backups encrypted at rest (KMS).

- Field-level encryption for CNIC numbers and bank/wallet account numbers; KYC files in a separate private bucket with short-lived signed URLs and access logging.

- Personal data minimisation: exact customer address is shown to the partner only after a home booking is accepted; phone numbers masked.

- Retention: KYC documents kept while the partner is active plus the legally required period; account deletion removes or anonymises personal data within 30 days while keeping financial records required by law.

- Comply with Pakistan's Prevention of Electronic Crimes Act and follow the proposed Personal Data Protection legislation as it progresses; publish a privacy policy that matches actual data use.

## 12.4 Application & Infrastructure Security

- Follow OWASP ASVS (API) and OWASP MASVS (mobile) checklists; dependency scanning (npm audit / Dependabot), container image scanning in ECR, secret scanning in Git.

- Secrets only in AWS Secrets Manager; never in the repo or the app bundle. Maps and third-party keys in the app are restricted by bundle ID / SHA-1 signature.

- WAF managed rules and rate limits; request body size limits; strict CORS for the admin panel.

- Webhook endpoints verify gateway signatures and are idempotent.

- Full audit log for admin actions; alerts on suspicious activity (mass OTP requests, many failed logins, large refunds).

- Third-party penetration test before public launch and yearly after.

## 12.5 App Store & Legal Requirements

| Requirement | Action |
| --- | --- |
| Account deletion | In-app "Delete account" in both apps (Apple and Google both require it) |
| Sign in with Apple | Offer it on iOS because Google Sign-In is offered (App Store guideline on third-party login) |
| Privacy | Privacy policy URL, Apple privacy "nutrition labels", Google Play Data safety form, permission purpose strings for location/camera/photos |
| Location | Foreground location only; explain why; app works with manual area selection if denied |
| Payments | Services performed in person may use external payment gateways (not in-app purchase); featured placement for businesses — confirm classification with store rules before launch |
| Legal documents | Customer Terms of Use, Partner Agreement (commission, payouts, conduct, cancellations), Privacy Policy, Refund & Cancellation Policy, Community Guidelines |
| Company setup | Registered business, bank account, gateway merchant account, tax registration (commission income and possible withholding obligations — confirm with a tax adviser) |

## 12.6 Trust & Safety

- Only approved partners go live; home-service requires additional verification (CNIC + selfie match, optionally police character certificate [DECISION]).

- Customers can filter by staff gender; partners can decline home visits without penalty.

- Share-trip style "share booking details" and an in-app emergency/support button during home visits.

- Report and block for users, reviews and media; reviews only from completed bookings, so fake reviews are hard.

# 13. Non-Functional Requirements

| Category | Target |
| --- | --- |
| Performance | API p95 < 300 ms for reads and < 600 ms for booking creation; search p95 < 500 ms; app cold start < 3 s on a mid-range Android device |
| Real-time | Booking request delivered to partner in < 3 s (socket) and < 10 s (push) |
| Availability | 99.5% monthly at launch, 99.9% target after 6 months; planned maintenance outside 1–6 am PKT |
| Scalability | Launch sizing: 1,000 concurrent users, 50 bookings/min peak; scale horizontally to 10× without code changes |
| Data safety | RPO ≤ 5 minutes, RTO ≤ 1 hour (Section 15.8) |
| Device support | Android 8+ (API 26+), iOS 15+ [DECISION]; phones first, tablets for salon reception |
| Network | Usable on slow 3G/4G: compressed images, pagination, retries, clear offline states |
| App size | Under ~40 MB download per app |
| Accessibility | Dynamic font size, contrast AA, screen reader labels on key flows |
| Localization | English and Urdu, RTL layouts, PKR formatting, local date/time formats |
| Observability | Every request traceable by request ID across API, worker and logs |

# 14. Testing & QA Strategy

| Level | Scope | Tools | Gate |
| --- | --- | --- | --- |
| Unit | Business rules: slot generation, pricing, commission, points, reliability, state transitions | Vitest/Jest | ≥ 80% coverage on domain modules |
| Integration | API endpoints with real PostgreSQL/Redis; role/ownership checks; webhooks | Supertest + Testcontainers | Every PR |
| Concurrency | Parallel booking attempts on the same slot | Custom script / k6 | Zero double bookings |
| Contract | Mobile client against OpenAPI spec | Generated client, schema checks | Every PR |
| Mobile component | Screens and hooks | Jest + RN Testing Library | Every PR |
| E2E mobile | Signup, search, book, accept, complete, review, cancel | Maestro on emulators + real devices | Before each release |
| Load | Search, slots, booking, sockets at 2× launch target | k6 | Before launch and major releases |
| Security | SAST, dependency scan, OWASP ZAP on staging, pen test | CodeQL, ZAP, external firm | Before launch |
| UAT | Real barbers/salons and customers in staging/beta | TestFlight, Play internal testing | Sign-off per phase |

Device test matrix: at least 3 low/mid-range Android devices popular in Pakistan (Android 10–14), 2 iPhones (older and current), one Android tablet for salon reception. Payment tests use gateway sandbox accounts; a staging "fake gateway" allows automated tests of success, failure and delayed webhooks.

# 15. Production Plan

This section describes how Groomly is hosted, deployed, monitored and operated in production. The plan uses AWS managed services so a small team can run it without dedicated operations staff.

## 15.1 Hosting Region

Use a single AWS region close to Pakistan — Mumbai (ap-south-1) usually gives the lowest latency and cost; Bahrain (me-south-1) is the alternative if data-residency or Middle East expansion matters [DECISION]. Run a quick latency test from Pakistani mobile networks to both before provisioning. All resources run across two Availability Zones.

## 15.2 Environments

| Environment | Purpose | Setup |
| --- | --- | --- |
| Local | Developer machines | docker-compose: PostgreSQL + PostGIS, Redis, MinIO (S3), MailHog; seed data; Expo dev builds |
| Dev | Integration of merged work | Auto-deploy from main; small single-AZ resources; sandbox gateways; may be reset |
| Staging | QA, UAT, release candidates | Same topology as production at smaller size; anonymised data only; TestFlight / Play internal builds point here |
| Production | Live users | Multi-AZ, auto-scaling, backups, alarms; deploy by approved release only |

Each environment has its own AWS account (via AWS Organizations) so a mistake in dev cannot touch production, its own Secrets Manager secrets, and its own app build profile (API URL, keys) in EAS.

## 15.3 Production Infrastructure


Figure 3 — Production deployment on AWS

| Component | Launch configuration | Scaling path |
| --- | --- | --- |
| API service | ECS Fargate, 2 tasks × 0.5–1 vCPU / 1–2 GB, behind ALB (sticky sessions for WebSocket) | Auto-scale on CPU 60% and request count; 2 → 10 tasks |
| Worker service | ECS Fargate, 1–2 tasks | Scale on queue depth |
| PostgreSQL | RDS PostgreSQL 16, db.t4g.medium, Multi-AZ, gp3 50 GB, PITR 14 days, Performance Insights | Vertical scale; read replica for search/reports; Aurora later if needed |
| Redis | ElastiCache Redis/Valkey, small node with replica | Larger node; separate cluster for queues if needed |
| Media | S3 (private) + CloudFront with origin access control | No action needed |
| Admin panel | Next.js on S3/CloudFront (static) or a small Fargate service (SSR) |  |
| Networking | VPC, public subnets (ALB, NAT), private app and data subnets, security groups by tier, VPC endpoints for S3/ECR to cut NAT cost |  |
| Edge | Route 53, ACM certificates, CloudFront, AWS WAF managed rules + rate rules |  |

## 15.4 Infrastructure as Code

- All infrastructure defined in Terraform (or AWS CDK) in a separate groomly-infra repository with modules per component and one workspace/state per environment (state in S3 with locking).

- Changes go through pull requests; terraform plan output is reviewed in the PR; apply to production requires approval.

- No manual console changes in staging or production except in a documented emergency.

## 15.5 CI/CD Pipeline (GitHub Actions)

| Stage | Backend | Mobile | Admin |
| --- | --- | --- | --- |
| On pull request | Lint, type-check, unit + integration tests (Testcontainers), OpenAPI diff, dependency & secret scan | Lint, type-check, unit tests, bundle check | Lint, type-check, tests, build |
| Merge to main | Build Docker image → push to ECR → run migrations → deploy to Dev | EAS Update to dev channel; nightly EAS dev build | Deploy to Dev |
| Release tag (vX.Y.Z) | Deploy same image to Staging → smoke tests → E2E suite | EAS Build (staging profile) → TestFlight / Play internal | Deploy to Staging |
| Approval | Manual approval → Production (rolling or blue/green via CodeDeploy) → smoke tests → auto-rollback on failed health checks/alarms | EAS Build (production) → EAS Submit → staged store rollout | Deploy to Production |

GitHub Actions authenticates to AWS with OIDC roles (no long-lived keys). The same Docker image moves from dev to production, so what was tested is exactly what runs.

### Database migrations

- Run as a one-off ECS task before the new API version starts.

- Use the expand → migrate → contract pattern: add new columns/tables first (backward compatible), deploy code, backfill, then remove old columns in a later release. Old app versions keep working throughout.

- Every migration is tested against a copy of staging data; a manual RDS snapshot is taken before risky migrations.

## 15.6 Mobile Release Management

- Semantic versions; separate bundle IDs per environment (e.g. pk.groomly.customer, pk.groomly.customer.staging) so staging and production can be installed side by side.

- Over-the-air updates (EAS Update) for JavaScript-only fixes, with channels per environment and the ability to roll back. Native changes always require a new store build.

- Force update: on launch the app calls GET /app-config; if its version is below min_supported, it shows a blocking update screen. Soft prompt when below latest.

- Staged rollouts: Google Play percentage rollout (10% → 50% → 100%) and Apple phased release, watching crash-free rate in Sentry before widening.

- Store listing assets prepared in Phase 1.5: screenshots in English and Urdu, descriptions, privacy labels, test accounts for reviewers (Apple review needs a working demo login and a way to see partner flows).

## 15.7 Monitoring, Logging & Alerting

| Signal | Tool | Alert when |
| --- | --- | --- |
| API errors & latency | CloudWatch (ALB metrics), Sentry performance | 5xx rate > 1% for 5 min; p95 > 1 s for 10 min |
| Application exceptions | Sentry (API, worker, apps, admin) | New issue in production; spike in existing issue |
| Mobile stability | Sentry / Crashlytics | Crash-free sessions < 99.5% |
| Database | RDS Performance Insights, CloudWatch | CPU > 75%, free storage < 20%, connections > 80%, replication lag |
| Queues | BullMQ metrics exported to CloudWatch (or Bull Board dashboard) | Waiting jobs > threshold; failed jobs; notification job age > 2 min |
| Business health | Custom metrics / dashboard | Zero bookings for 30 min in daytime; payment success rate < 90%; OTP send spike |
| Uptime | External uptime checker on /health and key flows | Two consecutive failures |
| Logs | Structured JSON (pino) → CloudWatch Logs, 30-day retention (1 year for audit) | Log-based alarms for auth abuse |

Alerts go to a Slack/WhatsApp channel and to the on-call developer by phone for critical alarms. Every alert links to a short runbook (what it means, how to check, how to fix).

## 15.8 Backups & Disaster Recovery

- RDS automated backups with point-in-time recovery (14 days) plus daily snapshots copied to a second region, kept 30 days; monthly snapshot kept 1 year.

- S3 versioning on media and KYC buckets, lifecycle rules to cheaper storage, and cross-region replication for KYC documents.

- Redis holds no data that cannot be rebuilt (queues are recoverable from database state by a reconciliation job).

- Targets: RPO ≤ 5 min, RTO ≤ 1 h for single-AZ failure (handled automatically by Multi-AZ) and ≤ 8 h for full region loss (rebuild from Terraform + restored snapshot).

- Restore drill every quarter: restore production snapshot into an isolated account and verify.

## 15.9 Scaling Plan

| Stage | Approx. load | Actions |
| --- | --- | --- |
| Launch (1 city) | < 5k MAU, < 1k concurrent | Launch configuration above |
| Growth (3–5 cities) | 20–50k MAU | Larger RDS instance, read replica for search/admin reports, 3–6 API tasks, CloudFront caching for public profile data |
| Scale (national) | 200k+ MAU | Consider Aurora PostgreSQL, split notifications/search into separate services, dedicated search engine if needed, partition large tables (appointments, ledger) by time |

## 15.10 Go-Live Checklist

- All Phase 1 acceptance criteria passed; no open critical/high bugs; E2E suite green on staging.

- Load test at 2× launch target passed; concurrency test shows zero double bookings.

- Pen test done and critical/high findings fixed; secrets rotated from staging values.

- Backups verified with a real restore; alarms tested by triggering them; runbooks written.

- Gateway, SMS and Maps accounts on production plans with spending alerts; AWS budget alerts set.

- Legal pages live and linked in apps; store listings approved; support channel and FAQ ready.

- Launch-city supply ready: at least 30–50 verified partners with complete profiles and portfolios before customer marketing starts.

- Admin and support team trained on approvals, disputes, refunds and payouts.

- Rollback plan documented for API (previous image) and apps (EAS Update rollback, halt staged rollout).

## 15.11 Launch Strategy

- Closed beta (3–4 weeks): 20–50 partners and invited customers in one city; daily feedback; fix and tune rules.

- Soft launch: public store availability in the launch city; partner onboarding team active; limited marketing.

- City expansion: add a new city only when the current one reaches target partner density and repeat-booking rate.

## 15.12 Post-Launch Operations

- On-call rotation between backend developers with a clear escalation path; incident log and a short post-mortem for every production incident.

- Weekly release train for backend; mobile store release every 2–4 weeks, OTA for urgent JS fixes.

- Monthly: dependency updates, cost review, security patches. Quarterly: restore drill, access review, performance review.

- Support SLAs: first response to disputes within 4 working hours; partner approvals within 24 hours.

# 16. Estimated Costs

Note:  Figures are indicative in USD and must be confirmed with the AWS Pricing Calculator and vendor quotes at the time of purchase. Development team salaries are not included.

## 16.1 One-time / Annual

| Item | Estimated cost |
| --- | --- |
| Apple Developer Program | $99 / year |
| Google Play Console | $25 one-time |
| Domain(s) (.pk and/or .com) | ~$10–$40 / year |
| Penetration test (pre-launch) | ~$1,500–$5,000 depending on scope and vendor |
| UI/UX design (if outsourced) | Varies; plan 4–6 weeks of designer time |
| Legal documents (T&Cs, partner agreement, privacy) | Varies by firm |

## 16.2 Monthly Infrastructure

| Item | Lean launch (single-AZ) | Recommended production (Multi-AZ) |
| --- | --- | --- |
| ECS Fargate (API + worker) | $25–40 | $70–120 |
| RDS PostgreSQL | $30–45 | $120–160 |
| ElastiCache Redis | $12–20 | $25–50 |
| Load balancer | $18–25 | $20–30 |
| NAT gateway / data transfer | $0–40 | $40–80 |
| S3 + CloudFront | $5–15 | $15–40 |
| CloudWatch, Secrets, WAF, backups | $10–20 | $30–60 |
| Production subtotal | ~$100–200 | ~$320–540 |
| Staging + dev environments | $40–80 | $80–150 |

Recommendation: run the lean configuration during closed beta, and switch to Multi-AZ before public launch — the change is a Terraform variable, not a re-architecture. v1.0's estimate of $65–130/month matches only the lean setup.

## 16.3 Third-Party Services (usage-based)

| Service | Estimated cost |
| --- | --- |
| SMS / OTP | Roughly $0.005–$0.06 per SMS depending on provider and route; budget ~1.3 SMS per login |
| Google Maps Platform | Free monthly usage per API, then pay-as-you-go; likely $0–$100 / month at launch; cache geocoding results |
| Payment gateway | % per transaction (typically ~1.5–3% for wallets/cards; negotiate); no platform fee on cash |
| Push notifications (FCM/APNs) | Free |
| Sentry | Free tier → ~$26+/month team plan |
| Expo EAS | Free tier → ~$19–$99/month for more build and update capacity |
| Email (SES) | A few dollars / month |

# 17. Team & Delivery Roadmap

## 17.1 Team Composition

| Role | Count | Responsibilities |
| --- | --- | --- |
| Product owner / BA | 1 | Business rules sign-off, backlog, acceptance criteria, UAT |
| UI/UX designer | 1 (full-time Phase 0–1, then part-time) | Design system, Figma screens for 2 apps + admin, Urdu/RTL layouts |
| Backend developers | 2 (one senior lead) | API, database, booking engine, payments, jobs, integrations, admin APIs |
| Mobile developers | 2–3 (one senior lead) | Customer and Partner apps, shared packages, releases |
| Web developer (admin) | 1 (or full-stack backend dev) | Admin panel |
| QA engineer | 1–2 | Test plans, automation (Maestro, API tests), device testing, regression |
| DevOps | 0.5 (part-time/contract) | Terraform, CI/CD, monitoring, security hardening |
| Partner onboarding / support | 1–2 (business side) | Recruit and verify partners, support tickets, disputes |

## 17.2 Revised Roadmap

| Phase | Scope | Duration |
| --- | --- | --- |
| Phase 0 — Discovery & Foundations | Sign off all [DECISION] items; Figma designs for Phase 1; OpenAPI contract; monorepo and API scaffolding; Terraform for dev/staging; CI; start gateway merchant and SMS sender-ID applications (long lead times) | 3–4 weeks |
| Phase 1 — MVP | Auth (OTP, Google, Apple); partner onboarding + KYC + admin approval; business, staff, services, hours, time off; portfolio; discovery (list, map, filters); standard bookings with real-time accept/decline; cash payment with commission tracking; reviews and attendance rating; reliability score; notifications and inbox; booking chat; core admin panel; account deletion | 11–13 weeks |
| Phase 1.5 — Beta & Launch Prep | Closed beta in one city, bug fixing, performance and security testing, production infra, store submissions, go-live checklist | 3–4 weeks |
| Phase 2 — Monetization & Retention | Online payments and refunds; partner wallet, commission netting and weekly payouts; featured placement; loyalty points, vouchers and referrals; partner insights; finance admin | 5–6 weeks |
| Phase 3 — Extended Booking Types | Home bookings (addresses, radius, travel buffers, safety features); urgent bookings; event bookings with deposits and quotes | 4–6 weeks |
| Phase 4 — Category Expansion | New verticals using the category tree; per-category attributes; city expansion | Ongoing |

Indicative total to full feature set: about 7–8 months, with a public soft launch at the end of Phase 1.5 (about 4–5 months). Work runs in two-week sprints with a demo at the end of each sprint.

## 17.3 Phase Exit Criteria (Definition of Done)

- All user stories in scope meet acceptance criteria and are tested on the device matrix.

- API documented in OpenAPI and covered by integration tests; no critical/high open bugs.

- Monitoring and alerts in place for new features; analytics events implemented.

- Product owner has signed off the demo on staging.

## 17.4 Team Responsibilities

### Backend team

- API, domain modules, database schema and migrations, booking engine and concurrency guarantees, real-time layer, background jobs.

- Integrations: SMS/OTP, Google/Apple auth, FCM/APNs, payment gateway, Maps (server-side), SES.

- Commission, ledger, payouts, loyalty, vouchers and featured billing logic; admin APIs.

- With DevOps: infrastructure, CI/CD, monitoring, backups, security hardening.

### Mobile team

- Customer and Partner apps from the shared monorepo; design system; English/Urdu with RTL.

- Auth flows, maps and location, push handling and deep links, socket connection management.

- Booking flows (discover → profile → book → live status → review) and partner inbox/calendar.

- Portfolio capture and upload, availability and staff management screens, releases via EAS.

### Shared

- API contract first: OpenAPI changes are reviewed by both leads before implementation.

- Weekly backend–mobile sync; shared sprint board; shared definition of done.

# 18. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Not enough partners at launch (empty marketplace) | High | Onboard partners first in one city; 0% commission for early partners; onboarding team helps build profiles |
| Bookings and payments moving off-platform | High | Masked contact, loyalty points only on platform bookings, value for partners (calendar, reminders, no-show protection) |
| Customer no-shows hurt partner trust | High | Reliability score, prepay for low scores, reminders, deposits for events |
| Payment gateway approval delays | Medium | Apply in Phase 0; cash-only MVP means launch is not blocked |
| Double bookings / scheduling bugs | High | Database exclusion constraint, concurrency tests, single transition function |
| Safety incidents during home visits | High | Stricter verification for home service, in-app support button, gender filters, ratings, quick suspension |
| SMS OTP fraud / cost spikes | Medium | Rate limits, +92 only, spending alerts, CAPTCHA/device checks on abuse |
| App store rejection | Medium | Follow Section 12.5 checklist, reviewer demo accounts, submit early in Phase 1.5 |
| Scope creep delaying MVP | Medium | Strict phase scope; new ideas go to backlog for later phases |
| Key-person dependency in small team | Medium | Code reviews, documentation, runbooks, shared ownership of critical modules |

# 19. KPIs & Analytics

| KPI | Definition | Early target (first 3 months) |
| --- | --- | --- |
| Active partners | Approved partners with ≥ 1 completed booking in 30 days | 100+ in launch city |
| Weekly completed bookings | Bookings reaching COMPLETED per week | Steady week-on-week growth |
| Acceptance rate | Accepted ÷ requested | > 80% |
| Median response time | Request → accept/decline | < 10 min |
| No-show rate | NO_SHOW ÷ accepted | < 8% |
| Repeat rate | Customers with a 2nd booking within 60 days | > 35% |
| GMV and take rate | Total booking value; commission ÷ GMV | Tracked weekly |
| Online payment share | Online ÷ all completed bookings | Rising after Phase 2 |
| App quality | Crash-free sessions; store rating | > 99.5%; ≥ 4.3 |

Core analytics events (same names in both apps): app_open, signup_completed, search_performed, business_viewed, slot_selected, booking_requested, booking_accepted, booking_cancelled, payment_completed, review_submitted, voucher_applied, featured_purchased, partner_onboarding_step. No personal data in event properties.

# 20. Open Decisions for Sign-off

These must be confirmed in Phase 0. Proposed defaults are already used throughout this document so development can start.

| # | Decision | Proposed default |
| --- | --- | --- |
| 1 | Launch city and region hosting | One city; AWS Mumbai (ap-south-1) |
| 2 | Urdu at launch or Phase 2 | At launch (RTL-ready regardless) |
| 3 | Commission base — include urgent/home fees? | 5% of service amount only |
| 4 | Cancellation window and late-cancel retention | 3 hours; up to 50% for prepaid |
| 5 | Reliability score rules and thresholds | As Section 4.4 |
| 6 | Points earn/burn rates and expiry | 1 pt / PKR 100; 500 pts = PKR 250; 12 months |
| 7 | Who absorbs gateway fees | Platform |
| 8 | Payout frequency and minimum | Weekly; PKR 1,000 |
| 9 | Early-partner commission holiday | 0% for first 3 months |
| 10 | Home-service verification level | CNIC + selfie; character certificate optional |
| 11 | Event deposit % and refund cut-off | 20–30%; 7 days |
| 12 | Minimum OS versions | Android 8+, iOS 15+ |
| 13 | Media limits | Images 10 MB; videos 60 s / 50 MB |
| 14 | Payment gateway provider | Aggregator covering JazzCash, Easypaisa and cards |
| 15 | Chat in Phase 1 or 1.5 | Phase 1 |

# 21. Immediate Next Steps (First Two Weeks)

- Hold a decision workshop with the business owner to close Section 20.

- Start company/merchant paperwork: payment gateway merchant account, SMS sender ID, Apple and Google developer accounts (organisation accounts need a D-U-N-S number for Apple).

- Designer starts user flows and the design system; first Figma screens for onboarding, discovery and booking.

- Backend lead: create the groomly-api repo with the structure in Section 9.3, docker-compose, Prisma schema v1 from Section 8, CI pipeline.

- Mobile lead: create the monorepo (customer, partner, admin, shared packages), Expo dev builds, navigation shells, design tokens, i18n with RTL.

- DevOps: AWS Organization with dev/staging/prod accounts, Terraform baseline (VPC, RDS, Redis, ECS, S3, CloudFront), budget alerts.

- Both leads: write and agree the OpenAPI spec for Phase 1 endpoints before feature implementation.

- Set up the sprint board, definition of done, weekly backend–mobile sync and sprint demos.
