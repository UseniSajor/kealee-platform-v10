# Kealee Platform — Canonical Architecture

> **Source of truth for platform structure, app roles, routing rules, and business logic.**
> For the full system map including ASCII diagrams, see `docs/SYSTEM-MAP.md`.
> For the database schema, see `packages/database/prisma/schema.prisma`.

---

## Platform Overview

Kealee is a full-lifecycle construction development platform. It covers every phase of a project from land acquisition through post-construction operations, serving owners, architects, engineers, contractors, developers, and internal Kealee staff.

The platform is a monorepo built with pnpm workspaces, structured as:

```
apps/        — Next.js frontend applications (18 apps)
services/    — Backend API services (11 services)
packages/    — Shared libraries (34 packages)
bots/        — AI automation agents (13 KeaBots)
```

---

## Canonical App & Service Roles

### Public / Marketing Surface

| App | Role |
|-----|------|
| `apps/web-main` | Public marketing site for v20. Primary external-facing marketing surface. Landing pages, features, pricing, blog. |

### Consumer Demand Apps (Owner / Client Side)

| App | Role |
|-----|------|
| `apps/m-marketplace` | Main public gateway to the platform. Functions like a marketplace homepage (similar to Amazon). Owners discover and engage professionals and services here. |
| `apps/m-project-owner` | Primary consumer demand app. End-to-end construction services for project owners from intake through construction and closeout. |
| `apps/portal-owner` | Post-purchase owner/client portal. Accessed after a project is created. Provides project tracking, payments, documents, messages, and Digital Twin view. |

### Professional / Supply Side Apps

| App | Role |
|-----|------|
| `apps/m-architect` | Client-facing app for architects joining the platform and doing commerce with owners. |
| `apps/m-engineer` | Client-facing app for engineering service providers joining the platform. Same concept as `m-architect`. |
| `apps/m-estimation` | Dual-purpose: standalone estimation product and embedded preconstruction capability within the platform. |
| `apps/m-ops-services` | Contractor-facing product for Kealee back-office and front-office execution services. |
| `apps/portal-contractor` | Post-purchase contractor portal. Accessed after a contractor accepts a lead/contract. Bid management, projects, payments, credentials, schedule. |

### Finance & Payments

| App | Role |
|-----|------|
| `apps/m-finance-trust` | The `m-pay` module for v20. Handles financial trust, escrow, and payment flows. |

### Permits & Compliance

| App | Role |
|-----|------|
| `apps/m-permits-inspections` | Permit submission, tracking, and inspection management. |

### Internal Kealee Staff Apps

| App | Role |
|-----|------|
| `apps/os-pm` | Internal Kealee staff-only PM software. Powers all relevant platform PM features and services. **Not public-facing.** |
| `apps/os-admin` | Senior Kealee staff admin app. Full platform oversight, analytics, configuration, and user management. |
| `apps/command-center` | Internal and external automation orchestration hub for KeaBots. Manages Digital Development Twins, job queues, bot registry, and platform-wide event monitoring. |

### Developer / Investor Side

| App | Role |
|-----|------|
| `apps/portal-developer` | Developer/investor portal. Pipeline management, feasibility studies, capital stacks, and investor reporting. |
| `apps/admin-console` | Administrative console. |

---

## Canonical Backend Services

### Core API

| Service | Role |
|---------|------|
| `services/api` | **The canonical shared platform API.** All frontend apps call this. Built on Fastify. Routes through auth middleware into domain-specific route modules backed by OS service layers. |

### OS (Operating System) Service Modules

These are logical service domains served through `services/api` or as standalone services. They represent the "operating system" of the platform.

| Service | Domain | Responsibilities |
|---------|--------|-----------------|
| `services/os-pm` | Project Management | 55+ modules — scheduling, permits, inspections, RFIs, change orders, BIM/drawings, estimation, takeoffs, daily logs, design, safety, procurement, closeout, warranty |
| `services/os-pay` | Payments & Finance | Milestone-based escrow, Stripe Connect, draw requests, payment approvals, reconciliation |
| `services/os-land` | Land Acquisition | Parcel analysis, zoning, site assessments, comparable land, offers |
| `services/os-feas` | Feasibility | Studies, scenario modeling, proformas, go/no-go analysis |
| `services/os-dev` | Development Finance | Capital stacks, draw tracking, investor reports, entitlement management |
| `services/os-ops` | Post-Construction Ops | Turnover, warranty, maintenance scheduling, work orders |
| `services/marketplace` | Marketplace | Contractor listings, bidding, lead distribution, reviews, ratings |
| `services/worker` | Background Processing | BullMQ job runner for async tasks, scheduled jobs |
| `services/command-center` | Automation Hub | KeaBot orchestration, Digital Twin monitoring, event management |
| `services/ai-learning` | AI/ML | Model training, feedback loops, learning from platform data |

---

## Professional Access & Registration Rules

### Registration Requirements

All professionals **must sign up through Kealee** to maintain Kealee platform guarantees. There are no exceptions — even if an owner brings their own professional, that professional must register through Kealee.

### Access Tiers

| Access Type | License Verification Required? |
|-------------|-------------------------------|
| PM / Ops software access (os-pm, os-admin) | No |
| Platform lead / referral access | Yes — verified license + insurance required |

### Supported Professional Types

- Architects
- Engineers
- General Contractors (GCs)
- Subcontractors
- Design/Build firms (supported as unified entities)

### Project Types

- Residential
- Commercial
- Multifamily
- Mixed-use

---

## Contractor Engagement Rules

### The `CONSTRUCTION_READY` Gate

Contractors are **not engaged until plans are complete and permits are at least submitted**. The `CONSTRUCTION_READY` project status gates all contractor engagement.

```
Plans complete + Permits submitted → Project status: CONSTRUCTION_READY → Contractors can be engaged
```

When a contractor accepts a `CONSTRUCTION_READY` lead, the following can be auto-created:
- Project record (if not already created)
- Contract
- Milestone schedule
- Escrow account

### Lead Assignment & Routing

**Routing rules:**

| Scenario | Behavior |
|----------|----------|
| Sponsored pro click | Route directly to that specific professional |
| Platform service click | Route to the next approved professional in the rotating queue |
| Owner brings own pro | Pro must still register through Kealee before engagement |

**Rotating lead assignment (queue mechanics):**

1. Next professional in line receives the lead
2. They have **48 hours** to accept
3. If not accepted within 48 hours: lead is forfeited and that professional moves to the **back of the queue**
4. Lead then goes to the next professional in line

---

## Project Lifecycle

Every project gets a **Digital Development Twin (DDTS)** at creation. The twin is the single source of truth for project health, phase, and KPIs.

```
INTAKE
  │
  ▼
LAND (skip for homeowners)
  │
  ▼
FEASIBILITY (skip for homeowners)
  │
  ▼
ENTITLEMENT
  │
  ▼
PRE_CONSTRUCTION ◄── Design, estimation, permits, contractor selection
  │
  ▼
CONSTRUCTION_READY ◄── Gate: plans complete + permits submitted
  │
  ▼
CONSTRUCTION ◄── Contractor engaged here
  │
  ▼
CLOSEOUT
  │
  ▼
OPERATIONS
  │
  ▼
ARCHIVED
```

### Twin Tiers

| Tier | KPI Count | KPIs Tracked |
|------|-----------|-------------|
| L1 (Light) | 3 | Budget, Schedule, Completion % |
| L2 (Standard) | 6 | + Risk, Quality, Issues |
| L3 (Premium) | 10 | + Safety, CPI, RFI Rate, Change Order Rate |

---

## Shared Platform API (`services/api`)

All client apps consume a single shared API. This is the canonical integration point.

### Route Namespace Map

| Namespace | Service Module |
|-----------|---------------|
| `/api/v1/auth/*` | Authentication (Supabase) |
| `/api/v1/pm/*` | OS-PM (55 modules) |
| `/api/v1/pay/*` | OS-Pay |
| `/api/v1/land/*` | OS-Land |
| `/api/v1/feas/*` | OS-Feas |
| `/api/v1/dev/*` | OS-Dev |
| `/api/v1/ops/*` | OS-Ops |
| `/api/v1/market/*` | Marketplace |
| `/api/v1/twins/*` | DDTS |
| `/api/v1/bots/*` | KeaBots |

### Architecture Pattern

```
Request → Auth Middleware → Route Module → Service Layer → packages/database (Prisma) → PostgreSQL
                                         ↓
                                     Redis Event Bus (stream.*)
                                         ↓
                                     DDTS Consumer (twin KPI updates)
```

---

## Database

- **Schema location:** `packages/database/prisma/schema.prisma` — single source of truth
- **Pattern:** Single PostgreSQL database shared across all services via Prisma (see ADR-001)
- **Key model note:** The organization model is `Org`, not `Organization`
- **Scale:** 364+ models, 50+ enums

---

## Key Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/database` | Prisma schema + generated client |
| `packages/auth` / `packages/core-auth` | Authentication utilities |
| `packages/ui` | Shared component library |
| `packages/types` | Shared TypeScript types |
| `packages/core-bots` | KeaBot base classes and SDK |
| `packages/core-ddts` | Digital Twin System core |
| `packages/core-events` | Event bus utilities |
| `packages/payments` | Payment processing abstractions |
| `packages/workflow-engine` | Workflow definition and execution |
| `packages/queue` | BullMQ job queue utilities |

---

## KeaBots (AI Automation Layer)

13 AI bots built on the `packages/core-bots` SDK. **Bots call OS service APIs via HTTP — never direct database access.**

| Bot | Focus |
|-----|-------|
| KeaBot Command | Master orchestrator — routes queries, manages handoffs, escalates |
| KeaBot Owner | Project status, payment Q&A, schedule updates for owners |
| KeaBot Payments | Escrow status, draw requests, reconciliation |
| KeaBot GC | Bid management, sub coordination, compliance tracking |
| KeaBot Construction | Progress tracking, schedule dependencies, inspection readiness |
| KeaBot Land | Parcel analysis, zoning lookup, site assessment |
| KeaBot Feasibility | Scenario modeling, proforma generation, go/no-go analysis |
| KeaBot Finance | Capital stacks, draw processing, HUD eligibility |
| KeaBot Developer | Pipeline management, investor reporting, entitlement tracking |
| KeaBot Permit | AI plan review, submission preparation, status tracking |
| KeaBot Estimate | Cost estimation, takeoff assistance, value engineering |
| KeaBot Marketplace | Contractor matchmaking, bid comparison, rating analysis |
| KeaBot Operations | Warranty management, maintenance scheduling, turnover coordination |

---

## External Integrations

| Integration | Purpose |
|-------------|---------|
| Stripe Connect | Payments, escrow, invoices |
| Supabase Auth | JWT tokens, sessions, RBAC |
| GoHighLevel (GHL) | CRM — contacts, pipelines, webhooks |
| Resend | Transactional email |
| Twilio | SMS notifications |
| AWS S3 | File/document storage |
| Anthropic (Claude) | Primary AI model for KeaBots |
| OpenAI | AI fallback |
| Mapbox GL | GIS / maps / parcel visualization |

All external integrations go through the adapter framework in `packages/core-integrations`.

---

## Deployment

| Layer | Platform |
|-------|---------|
| Frontend apps | Vercel (CDN + Edge Functions) |
| API + Worker services | Railway |
| PostgreSQL database | Railway (managed) |
| Redis (streams, queues, cache) | Railway |

---

## Architecture Decision Records

See `docs/adr/` for all formal ADRs:

| ADR | Decision |
|-----|---------|
| [001](adr/001-single-database-shared-schema.md) | Single PostgreSQL database shared via Prisma |
| [002](adr/002-ddts-digital-twin-per-project.md) | Digital Twin created per project at inception |
| [003](adr/003-bot-service-separation.md) | Bots call service APIs, never direct DB |
| [004](adr/004-event-driven-redis-streams.md) | Redis Streams as event bus |
| [005](adr/005-services-as-fastify-plugins.md) | OS services implemented as Fastify plugins |
| [006](adr/006-kxl-integration-adapter-pattern.md) | Adapter pattern for all external integrations |
| [007](adr/007-housing-act-alignment.md) | Platform features mapped to Rebuild America's Housing Act |

---

## Canonical Implementation Map

> This section documents **where business logic lives** for each core domain. Apps must consume the canonical service — never reimplement logic locally.

### Marketplace (Contractor Listings, Bidding, Lead Assignment)

| Location | Contents |
|----------|----------|
| `services/api/src/modules/marketplace/leads.service.ts` | Lead creation, distribution, stage management |
| `services/api/src/modules/marketplace/marketplace.service.ts` | Contractor profile, matchmaking, scoring |
| `services/api/src/modules/marketplace/quotes.service.ts` | Quote/bid management |
| `services/api/src/modules/marketplace/leads.routes.ts` | Lead endpoints |
| `services/api/src/modules/marketplace/marketplace.routes.ts` | Profile and search endpoints |
| `services/api/src/modules/marketplace/portfolio.routes.ts` | Portfolio management |
| `services/marketplace/src/` | Legacy service wrapper — being refactored into `services/api` |

**Rule:** App-level code in `apps/m-marketplace/*` only consumes API clients. No business logic duplication.

---

### Payments / Escrow (Milestone Payments, Escrow, Stripe Connect)

| Location | Contents |
|----------|----------|
| `services/api/src/modules/payments/payment.service.ts` | Escrow agreements, payment calculations, holdback logic |
| `services/api/src/modules/payments/milestone-payment.service.ts` | Milestone release, Stripe Connect, platform fees (3%) |
| `services/api/src/modules/payments/stripe-payment.service.ts` | Stripe payment integration |
| `services/api/src/modules/payments/stripe-connect.service.ts` | Stripe Connect account management |
| `services/api/src/modules/payments/unified-payment.service.ts` | Payment orchestration |
| `services/api/src/modules/escrow/escrow.service.ts` | Escrow deposits, releases, holds, refunds — auto-posts journal entries |
| `services/api/src/modules/finance/` | Double-entry bookkeeping, account balances, GL validation |
| `services/api/src/modules/stripe-connect/payout.service.ts` | Contractor payouts via Stripe Connect |
| `services/os-pay/src/pay.service.ts` | Alternative payment impl — transitioning into `services/api` |
| `packages/payments/src/` | Stripe client, product catalog, platform fee utilities |

**Key rules:**
- Default holdback: 10% per milestone (configurable)
- Platform fee: 3% (configurable in payment services)
- Every escrow transaction automatically creates double-entry journal entries via `services/api/src/modules/escrow`

---

### Notifications (Email, SMS, In-App)

| Location | Contents |
|----------|----------|
| `packages/communications/src/email.ts` | Email via Resend — canonical email sender |
| `packages/communications/src/sms.ts` | SMS and WhatsApp via Twilio |
| `packages/communications/src/in-app.ts` | In-app notifications stored in `Notification` model |
| `packages/communications/src/templates/` | 25+ React/TSX email templates (leads, bids, payments, milestones, inspections, etc.) |
| `packages/core-notifications/src/notification-service.ts` | Unified `NotificationService` — multi-channel abstraction (email, SMS, push, in-app) |
| `services/api/src/modules/notifications/notification.service.ts` | Notification dispatch with user preference checking (50+ notification types) |
| `services/api/src/modules/email/email.service.ts` | Email template rendering and Resend dispatch |

**Rule:** All apps import from `@kealee/communications` and `@kealee/core-notifications`. No app-level notification implementations. Channels: Resend (email), Twilio (SMS/WhatsApp), Supabase Realtime (push).
