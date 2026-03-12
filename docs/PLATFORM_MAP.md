# Kealee Platform — Canonical Platform Map

> **Audit date:** 2026-03-12
> This document identifies canonical ownership for all major platform domains,
> surfaces duplicate/overlapping implementations, and recommends keep/merge/archive actions.
> **No code changes are made here — analysis only.**

---

## A. Canonical App Map

### Frontend Applications (`apps/`)

| App | Package Name | Primary User | Phase | Status |
|-----|-------------|-------------|-------|--------|
| `web-main` | `web-main` | Public | Marketing | **Canonical** — modern Next.js App Router, 5 routes (about, blog, contact, features, pricing) |
| `marketing` | `@kealee/marketing` | Public | Marketing | **Duplicate** — older Pages Router (`pages/` dir), same purpose as web-main |
| `m-marketplace` | `m-marketplace` | Public/Owner | Discovery | **Canonical** — 54 routes, full marketplace browse, cart, checkout, contractor-profile, estimate |
| `m-project-owner` | _(unknown)_ | Owner | Onboarding | **Canonical** — project creation wizard (4-step), contracts, milestones, handoff, closeout |
| `portal-owner` | _(unknown)_ | Owner | Active Project | **Canonical** — DDTS monitoring, payments, messages, documents, ongoing management |
| `m-architect` | _(unknown)_ | Architect | Signup/Commerce | **Canonical** — architect-facing marketplace participation |
| `m-engineer` | _(unknown)_ | Engineer | Signup/Commerce | **Canonical** — engineer-facing marketplace participation |
| `m-estimation` | _(unknown)_ | Pro/Owner | Preconstruction | **Canonical** — standalone + embedded estimation tool |
| `m-finance-trust` | _(unknown)_ | Owner/Finance | Payments | **Canonical** — m-pay module, escrow, trust flows |
| `m-permits-inspections` | _(unknown)_ | Owner/Pro | Permits | **Canonical** — permit submission, tracking, inspections |
| `m-ops-services` | _(unknown)_ | Contractor/GC | Marketing + Portal | **Hybrid** — marketing pages + contractor portal + billing in one app |
| `portal-contractor` | _(unknown)_ | Contractor | Active Leads | **Canonical (specialized)** — dedicated lead/bid/credentials dashboard |
| `os-pm` | _(unknown)_ | Kealee Staff | PM | **Canonical** — internal PM software, not public-facing |
| `os-admin` | `os-admin` | Senior Kealee Staff | Admin | **Canonical** — comprehensive admin (analytics, audit, automation, command-center, disputes, financials, jurisdictions) |
| `admin-console` | `admin-console` | _(unclear)_ | Admin | **Thin/Duplicate** — minimal routes (orgs, subscriptions, users only) |
| `command-center` | _(unknown)_ | Staff/Automation | Ops | **Canonical** — KeaBot orchestration, DDTS monitoring, job queues |
| `portal-developer` | _(unknown)_ | Developer/Investor | Finance | **Canonical** — pipeline, feasibility, capital stacks, investor reporting |
| `m-inspector` | _(unknown)_ | Inspector | Inspections | **Canonical** — inspector-facing app |
| `web` | _(unknown)_ | _(unclear)_ | _(unclear)_ | **Unknown/Stale** — app directory appears empty or minimal |
| `ai-learning` | _(unknown)_ | Internal | ML/AI | **Canonical** — AI model training, feedback loops |

---

## B. Canonical Backend/Service Map

### Shared Platform API (`services/api`)

**The single canonical backend.** All frontend apps call this. Built on Fastify.

#### Auth & Identity Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| **auth** | `services/api/src/modules/auth/` | Signup, login, logout, token verify, password setup (HMAC 48h). Integrates Supabase + GHL CRM sync. |
| **auth middleware** | `services/api/src/middleware/auth.middleware.ts` | Bearer token validation, Supabase JWT check, loads user + org memberships into request context |
| **orgs** | `services/api/src/modules/orgs/` | Org CRUD, member management, role assignment, user-orgs lookup |
| **rbac** | `services/api/src/modules/rbac/` | Role/permission CRUD, user permission checks, org-level permission middleware |
| **users** | `services/api/src/modules/users/` | User profile, user management |
| **api-keys** | `services/api/src/modules/api-keys/` | API key management |
| **security** | `services/api/src/modules/security/` | Security audit, session management |

#### Project & PM Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| **projects** | `services/api/src/modules/projects/` | Project CRUD, project history, project state management |
| **pm** | `services/api/src/modules/pm/` | PM feature aggregation |
| **precon** | `services/api/src/modules/precon/` | Pre-construction workflows |
| **permits** | `services/api/src/modules/permits/` | Permit submission, tracking |
| **permits-api** | `services/api/src/modules/permits-api/` | External permit API integration |
| **estimation** | `services/api/src/modules/estimation/` | Cost estimation |
| **milestones** | `services/api/src/modules/milestones/` | Milestone management |
| **contracts** | `services/api/src/modules/contracts/` | Contract management |
| **files** | `services/api/src/modules/files/` | Document/file management |
| **tasks** | `services/api/src/modules/tasks/` | Task management |
| **handoff** | `services/api/src/modules/handoff/` | Project handoff |
| **closeout** | `services/api/src/modules/closeout/` | Project closeout |
| **pattern-book** | `services/api/src/modules/pattern-book/` | Design pattern library |

#### Marketplace & Professional Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| **marketplace** | `services/api/src/modules/marketplace/` | Lead distribution (top-5 contractor rotation), listings, design bids, quotes, portfolio |
| **bids** | `services/api/src/modules/bids/` | Bid CRUD, bid analysis, bid automation, PDF ingestion |
| **contractor** | `services/api/src/modules/contractor/` | Contractor profiles, license uploads |
| **opportunities** | `services/api/src/modules/opportunities/` | Lead opportunities |
| **architect** | `services/api/src/modules/architect/` | Architect-specific flows |
| **engineer** | `services/api/src/modules/engineer/` | Engineer-specific flows |
| **license** | `services/api/src/modules/license/` | License verification |
| **scoring** | `services/api/src/modules/scoring/` | Professional scoring/rating |

#### Finance & Payments Modules

| Module | Path | Responsibility |
|--------|------|---------------|
| **payments** | `services/api/src/modules/payments/` | Payment processing, milestone payments, Stripe Connect, payment webhooks, unified payment service, payment reporting |
| **escrow** | `services/api/src/modules/escrow/` | Escrow account management |
| **deposits** | `services/api/src/modules/deposits/` | Deposit handling |
| **billing** | `services/api/src/modules/billing/` | Subscription billing |
| **subscriptions** | `services/api/src/modules/subscriptions/` | Subscription management |
| **stripe-connect** | `services/api/src/modules/stripe-connect/` | Stripe Connect onboarding |
| **finance** | `services/api/src/modules/finance/` | Financial reporting |
| **financing** | `services/api/src/modules/financing/` | Financing/capital flows |

#### Communications & Notifications

| Module | Path | Responsibility |
|--------|------|---------------|
| **notifications** | `services/api/src/modules/notifications/` | In-app notifications |
| **messaging** | `services/api/src/modules/messaging/` | In-platform messaging |
| **email** | `services/api/src/modules/email/` | Transactional email (Resend) |
| **sms** | `services/api/src/modules/sms/` | SMS (Twilio) |
| **communication** | `services/api/src/modules/communication/` | Communication aggregation |
| **push** | `services/api/src/modules/push/` | Push notifications |

#### Land, Feasibility & Development

| Module | Path | Responsibility |
|--------|------|---------------|
| **land** | `services/api/src/modules/land/` | Parcel analysis, zoning |
| **zoning** | `services/api/src/modules/zoning/` | Zoning data |
| **feasibility** | `services/api/src/modules/feasibility/` | Feasibility studies, proformas |
| **development** | `services/api/src/modules/development/` | Development finance |
| **development-package** | `services/api/src/modules/development-package/` | Dev service packages |
| **properties** | `services/api/src/modules/properties/` | Property records |
| **spatial** | `services/api/src/modules/spatial/` | GIS/spatial data |
| **site-tools** | `services/api/src/modules/site-tools/` | Site analysis tools |

#### Platform Infrastructure

| Module | Path | Responsibility |
|--------|------|---------------|
| **twins** | `services/api/src/modules/twins/` | DDTS Digital Twin management |
| **keabot** | `services/api/src/modules/keabot/` | KeaBot API integration |
| **analytics** | `services/api/src/modules/analytics/` | Platform analytics |
| **audit** | `services/api/src/modules/audit/` | Audit logging |
| **admin** | `services/api/src/modules/admin/` | Admin API routes |
| **system** | `services/api/src/modules/system/` | System config |
| **monitoring** | `services/api/src/modules/monitoring/` | Platform monitoring |
| **webhooks** | `services/api/src/modules/webhooks/` | Webhook management |
| **integrations** | `services/api/src/modules/integrations/` | External integrations |
| **workflow** | `services/api/src/modules/workflow/` | Workflow engine |
| **entitlements** | `services/api/src/modules/entitlements/` | Module entitlements |
| **orders** | `services/api/src/modules/orders/` | Order management |
| **products** | `services/api/src/modules/products/` | Product catalog |
| **funnel** | `services/api/src/modules/funnel/` | Marketing funnel |
| **usage-analytics** | `services/api/src/modules/usage-analytics/` | Feature usage tracking |

### Standalone Services

| Service | Path | Status | Notes |
|---------|------|--------|-------|
| `services/marketplace` | `services/marketplace/src/` | **Overlap** | Has `marketplace.service.ts` + `marketplace.routes.ts` — duplicates functionality in `services/api/src/modules/marketplace/`. Likely an earlier standalone version. |
| `services/os-pm` | `services/os-pm/src/` | **Canonical** | OS-PM module: scheduling, scopes, RFIs, inspections, change orders. Distinct service. |
| `services/os-pay` | `services/os-pay/` | **Canonical** | OS-Pay: milestone-based escrow, draw tracking |
| `services/os-land` | `services/os-land/` | **Canonical** | Land acquisition, parcel analysis |
| `services/os-feas` | `services/os-feas/` | **Canonical** | Feasibility studies |
| `services/os-dev` | `services/os-dev/` | **Canonical** | Development finance |
| `services/os-ops` | `services/os-ops/` | **Canonical** | Post-construction operations |
| `services/command-center` | `services/command-center/` | **Canonical** | Automation orchestration hub |
| `services/worker` | `services/worker/` | **Canonical** | BullMQ background job runner |
| `services/ai-learning` | `services/ai-learning/` | **Canonical** | AI/ML learning service |

### Shared Packages

| Package | Path | Canonical For |
|---------|------|--------------|
| `database` | `packages/database/` | Prisma schema + client — **single source of truth for all models** |
| `auth` | `packages/auth/` | Next.js app auth (client + server helpers, Supabase, React hooks) |
| `core-auth` | `packages/core-auth/` | Fastify auth plugin for OS services |
| `ui` | `packages/ui/` | Shared component library |
| `types` | `packages/types/` | Shared TypeScript types |
| `core-bots` | `packages/core-bots/` | KeaBot base SDK |
| `core-ddts` | `packages/core-ddts/` | Digital Twin System core |
| `core-events` | `packages/core-events/` | Redis Streams event bus |
| `payments` | `packages/payments/` | Payment processing abstractions |
| `communications` | `packages/communications/` | Email/SMS/notification helpers |
| `workflow-engine` | `packages/workflow-engine/` | Workflow definition + execution |
| `queue` | `packages/queue/` | BullMQ job queue utilities |
| `realtime` | `packages/realtime/` | WebSocket/realtime helpers |
| `shared` | `packages/shared/` | Misc shared utilities |
| `analytics` | `packages/analytics/` | Analytics helpers |
| `scoring` | `packages/scoring/` | Scoring algorithm |
| `storage` | `packages/storage/` | File/S3 storage helpers |
| `compliance` | `packages/compliance/` | Compliance utilities |
| `estimating` | `packages/estimating/` | Estimation logic |

---

## C. Duplicate / Conflict Report

### 1. Marketing: `apps/web-main` vs `apps/marketing`

| | `web-main` | `marketing` |
|--|------------|-------------|
| Router | App Router (modern) | Pages Router (older) |
| Package name | `web-main` | `@kealee/marketing` |
| Routes | about, blog, contact, features, pricing | More extensive (Dockerfile present) |
| Status | **Canonical per architecture brief** | Older implementation |

**Verdict:** `web-main` is canonical. `marketing` is a legacy app with the same purpose.

---

### 2. Admin: `apps/os-admin` vs `apps/admin-console`

| | `os-admin` | `admin-console` |
|--|------------|-----------------|
| Routes | Full suite: analytics, audit, automation, command-center, contract-templates, disputes, financials, jurisdictions, modules | Minimal: orgs, subscriptions, users only |
| Users | Senior Kealee staff | Unclear |
| Status | **Canonical per architecture brief** | Thin — possibly early scaffold or super-admin |

**Verdict:** `os-admin` is canonical. `admin-console` has minimal coverage; its orgs/subscriptions/users functionality is a subset already covered in `os-admin`.

---

### 3. Marketplace Backend: `services/api/src/modules/marketplace/` vs `services/marketplace/`

| | `services/api` marketplace module | `services/marketplace` |
|--|------------------------------------|------------------------|
| Location | `services/api/src/modules/marketplace/` | `services/marketplace/src/` |
| Files | leads.service.ts, marketplace.service.ts, design.routes.ts, quotes.routes.ts, portfolio.routes.ts | marketplace.service.ts, marketplace.routes.ts (2 files) |
| Integration | Fully integrated with API middleware, auth, RBAC | Standalone Fastify service |
| Status | **Canonical** | Likely earlier standalone prototype |

**Verdict:** The `services/api` marketplace module is canonical. `services/marketplace` appears to be a standalone prototype with a subset of the functionality.

---

### 4. Owner Apps: `apps/m-project-owner` vs `apps/portal-owner`

| | `m-project-owner` | `portal-owner` |
|--|-------------------|----------------|
| Purpose | Project creation (wizard-driven onboarding) | Ongoing project management via DDTS |
| Project routes | `/projects/new`, `/projects/[id]` | `/(dashboard)/projects`, `/(dashboard)/project/[id]`, `/(dashboard)/twin/[id]` |
| DDTS | No | Yes — twin visualization |
| Payments | Limited (milestones) | Full payment dashboard |
| Status | Canonical for **acquisition/onboarding** | Canonical for **ongoing management** |

**Verdict:** Both are legitimate with distinct purposes. The split is: `m-project-owner` = fast acquisition/signup funnel; `portal-owner` = full post-purchase dashboard. However, project management features (contracts, milestones) appear in both — this should be resolved by ensuring `m-project-owner` redirects to `portal-owner` once a project is created.

---

### 5. Contractor Apps: `apps/m-ops-services` vs `apps/portal-contractor`

| | `m-ops-services` | `portal-contractor` |
|--|------------------|---------------------|
| Purpose | Marketing landing + contractor signup + portal + billing (all-in-one) | Pure contractor bid/lead/credentials dashboard |
| Marketing routes | Yes — `/development`, `/gc-services`, `/contractors`, `/pricing` | No |
| Portal routes | Yes — `/development-leads`, `/gc-ops-leads`, `/estimation`, `/bids`, `/my-projects` | Yes — `/leads`, `/bids`, `/projects`, `/credentials` |
| Billing | Yes — `/billing`, `/subscriptions` | No |
| Status | Canonical as contractor acquisition surface + full portal | Canonical as focused bid/lead dashboard |

**Verdict:** These serve overlapping but distinct audiences. `m-ops-services` is the main contractor acquisition surface and back-office portal. `portal-contractor` is a cleaner, dedicated view. Lead/bid features appear in both — the canonical backend is `services/api/src/modules/marketplace/` + `bids/`.

---

### 6. Auth: Legacy `rbac.ts` vs `rbac.middleware.ts`

| | `services/api/src/middleware/rbac.ts` | `services/api/src/modules/rbac/rbac.middleware.ts` |
|--|---------------------------------------|---------------------------------------------------|
| Pattern | Static enum-based role/permission mapping | Service-driven (database-backed Role/Permission) |
| Status | **Legacy** — hardcoded enums | **Canonical** — dynamic, DB-driven |

**Verdict:** `rbac.middleware.ts` (service-driven) is canonical. `middleware/rbac.ts` is legacy and should be migrated away from.

---

## D. Missing-Gap Report

### Gaps Identified

| Gap | Description | Impact |
|-----|-------------|--------|
| **No unified owner journey** | `m-project-owner` and `portal-owner` are separate apps with no clear handoff mechanism documented | Owner confusion: create in one app, manage in another |
| **`apps/web` is empty/unclear** | The `apps/web` directory appears to have no meaningful content but exists in the workspace | Dead code / confusion |
| **`services/marketplace` not integrated** | Standalone marketplace service overlaps with canonical API module; unclear if it receives real traffic | Potential split behavior |
| **`apps/marketing` still active** | Older Pages Router marketing site still exists alongside canonical `web-main` | SEO confusion, maintenance overhead |
| **`admin-console` vs `os-admin`** | Two admin apps with overlapping user management; `admin-console` may be a super-admin scaffold | Staffing confusion |
| **RBAC dual-pattern** | Static enum RBAC (`middleware/rbac.ts`) and dynamic DB-backed RBAC coexist | Security risk if old middleware is used inconsistently |
| **`m-ops-services` role** | This app serves as marketing site, contractor portal, AND billing in one — blurs the canonical separation between acquisition surface and post-purchase portal | Hard to maintain, mixed concerns |
| **No single source for contractor onboarding** | Contractor signup exists in `m-ops-services/(auth)/onboarding`, `portal-contractor/(auth)/signup`, and `m-marketplace/(auth)/signup` | Multiple signup paths with potentially different validation |
| **`apps/ai-learning`** | Listed as an app but likely should be a service; unclear if it has a frontend | Structural confusion |

---

## E. Recommended Keep / Merge / Archive List

| App / Service | Recommendation | Rationale |
|---------------|---------------|-----------|
| `apps/web-main` | **KEEP — Canonical** | Modern App Router, matches architecture brief for marketing surface |
| `apps/marketing` | **ARCHIVE** | Older Pages Router duplicate of web-main; decommission after redirects are set up |
| `apps/web` | **INVESTIGATE then ARCHIVE** | Appears empty or unclear purpose; confirm nothing live before archiving |
| `apps/m-marketplace` | **KEEP — Canonical** | Primary public gateway; rich feature set, correct role |
| `apps/m-project-owner` | **KEEP — Canonical (onboarding)** | Fast acquisition funnel; should hand off to portal-owner post-creation |
| `apps/portal-owner` | **KEEP — Canonical (dashboard)** | Post-purchase DDTS dashboard; primary ongoing management surface |
| `apps/m-ops-services` | **KEEP but CLARIFY** | Keep as contractor acquisition + portal hybrid; document the marketing vs portal split explicitly |
| `apps/portal-contractor` | **KEEP — Canonical (bid/lead)** | Focused contractor dashboard; complement to m-ops-services |
| `apps/os-admin` | **KEEP — Canonical** | Comprehensive senior admin; matches architecture brief |
| `apps/admin-console` | **INVESTIGATE then MERGE/ARCHIVE** | Minimal routes overlap with os-admin; if no distinct use case, merge into os-admin or archive |
| `apps/command-center` | **KEEP — Canonical** | KeaBot orchestration hub; unique role |
| `apps/portal-developer` | **KEEP — Canonical** | Developer/investor portal |
| `apps/m-architect` | **KEEP — Canonical** | Architect acquisition surface |
| `apps/m-engineer` | **KEEP — Canonical** | Engineer acquisition surface |
| `apps/m-estimation` | **KEEP — Canonical** | Standalone + embedded estimation |
| `apps/m-finance-trust` | **KEEP — Canonical** | m-pay module for v20 |
| `apps/m-permits-inspections` | **KEEP — Canonical** | Permits/inspections surface |
| `apps/os-pm` | **KEEP — Canonical** | Internal staff PM; not public-facing |
| `apps/m-inspector` | **KEEP — Canonical** | Inspector-facing app |
| `services/api` | **KEEP — Canonical** | Single backend API; do not split |
| `services/marketplace` | **ARCHIVE after audit** | Standalone prototype; functionality covered by `services/api` marketplace module |
| `services/os-pm` | **KEEP — Canonical** | Distinct OS-PM service |
| All other `services/os-*` | **KEEP — Canonical** | Each has distinct domain |
| `services/worker` | **KEEP — Canonical** | Background job runner |
| `services/command-center` | **KEEP — Canonical** | Automation hub |
| `services/api/src/middleware/rbac.ts` | **DEPRECATE** | Static enum pattern; migrate to `rbac.middleware.ts` |

---

## Canonical Ownership Quick Reference

| Domain | Canonical Backend | Canonical Frontend |
|--------|------------------|--------------------|
| **Auth** | `services/api/src/modules/auth/` + `packages/auth/` | Each app (thin Supabase session wrapper) |
| **Orgs** | `services/api/src/modules/orgs/` | `apps/os-admin` (management), `apps/m-*` (signup) |
| **Memberships** | `services/api/src/modules/orgs/` (addMember etc.) | `apps/os-admin` |
| **RBAC** | `services/api/src/modules/rbac/` | `apps/os-admin` |
| **Projects** | `services/api/src/modules/projects/` | `apps/m-project-owner` (create), `apps/portal-owner` (manage) |
| **PM** | `services/os-pm/` + `services/api/src/modules/pm/` | `apps/os-pm` (staff only) |
| **Marketplace** | `services/api/src/modules/marketplace/` | `apps/m-marketplace`, `apps/m-ops-services` |
| **Contractor Flows** | `services/api/src/modules/contractor/` + `bids/` + `opportunities/` | `apps/m-ops-services`, `apps/portal-contractor` |
| **Payments/Escrow** | `services/api/src/modules/payments/` + `services/os-pay/` | `apps/m-finance-trust`, `apps/portal-owner` |
| **Notifications** | `services/api/src/modules/notifications/` | All apps (consume via API) |
| **Admin** | `services/api/src/modules/admin/` | `apps/os-admin` |
| **Digital Twins** | `services/api/src/modules/twins/` + `packages/core-ddts/` | `apps/command-center`, `apps/portal-owner` |
| **KeaBots** | `services/api/src/modules/keabot/` + `packages/core-bots/` | `apps/command-center` |
| **Marketing** | N/A | `apps/web-main` (canonical), `apps/m-marketplace` (homepage) |
| **Database** | `packages/database/prisma/schema.prisma` | N/A |
