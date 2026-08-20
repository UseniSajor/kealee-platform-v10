# Launch Readiness Audit — 2026-08-20

Scope: make the four preconstruction products (Design Concept, Estimation, Site Plan,
Permitting) commercially available nationwide at www.kealee.com.

Method: production probes against the live deployment plus source inspection. Historical
completion reports were **not** trusted — every claim below was checked against running
code or a live HTTP response.

## Launch matrix

| Area | Status before | Status after | Notes |
|---|---|---|---|
| Public website (web-main, Railway) | Working | Working | `www.kealee.com` 200, HTTPS OK |
| Homepage product cards | Partially working | Working | Site Plan was absent; hero CTA was a dead `<button>` |
| `/products` catalog | **Broken** (HTTP 500) | Working | Supporting sections now isolated behind error boundaries |
| `/site-plans` | **Exists but disconnected** | Working | Was behind the Supabase auth wall — Site Plan was unbuyable |
| `/request-service` (quote fallback) | **Exists but disconnected** | Working | Also auth-walled; it is the fallback for every "Request pricing" product |
| `/sign-in`, `/sign-up` | **Broken** | Working | Sign-in page was itself auth-walled |
| Nav → `/inspiration`, `/signin` | **Broken** | Working | Targets did not exist; repointed to `/gallery` and `/login` |
| Unified intake `/intake/[projectPath]` | Working | Working | Supports all four products |
| Address → jurisdiction → parcel | **Missing** | Working | `/api/site-intelligence/resolve` did not exist; the intake called a 404 |
| Advertised price vs charged price | **Broken** (7 SKUs) | Working | Site Plan advertised $249, charged $1,199. See below. |
| Stripe checkout | Working | Working | Server-side pricing; client `amount` ignored |
| Stripe webhook | Working | Working | Signature verified, incidents recorded |
| Fulfillment — Design Concept | Working | Working | In-app `/api/concept/generate` |
| Fulfillment — Estimation | Exists but disconnected | Manual fallback available | Depends on `api.kealee.com/v30/*`, which 404s |
| Fulfillment — Permitting | Exists but disconnected | Manual fallback available | Same dependency |
| Fulfillment — Site Plan | **Missing** | Manual fallback available | No deliverable definition and no automation route existed |
| Paid order with no producer | **Broken** (silent drop) | Working | Now routed to human queue with an explicit status |
| Customer deliverable delivery | **Broken** | Working | `owner.kealee.com` has no DNS record; now served on-site at `/orders/[id]` |
| Order status tracking | Missing | Working | Token- or session-gated `/orders/[id]` |
| Admin orders console | **Broken** | Working | `admin.kealee.com` returns 404; console added to web-main at `/admin/orders` |
| Admin PATCH auth | **Broken** (security) | Working | `/api/command-center/intakes/[id]` PATCH was unauthenticated |
| `services/api` route registration | Partially working | Partially working | v30/concept/zoning/bots blocks fail to register; now reported by `/health/routes` |
| Health checks | Partially working | Working | `/api/health` shallow (deploy gate) + `/api/health/deep` (dependencies) |
| Nationwide coverage | **Missing** | Working | Was DMV-only in copy and data; now all 50 states + DC |

## Price integrity defects found and fixed

Seven catalog entries linked to an intake path priced differently from the amount
advertised on the product card. Checkout prices from `INTAKE_PRICE_CENTS` keyed by the
route segment, so the customer was charged the destination's price, not the advertised one.

| Product | Advertised | Would have charged |
|---|---|---|
| Preliminary Site Plan | $249 | $1,199 |
| Verified Site Feasibility | $599 | $1,199 |
| Developer Feasibility Express | $1,095 | $1,199 |
| Concept Plan | $159 | $399 |
| Concept + Feasibility | $550 | $1,899 |
| Permit Application & Coordination | $1,499 | $599 |
| Survey-Based Permit Site Plan | $1,995 | $599 |

Fixed-price products now link to the intake keyed by the same product key. Scope-dependent
products ("From …") link to the quote-request flow, which takes no payment until scope and
price are agreed.

## Nationwide coverage model

Resolution hierarchy in `apps/web-main/lib/site-intelligence/authoritative-gis.ts`:

1. **Registered jurisdiction parcel service** → coverage `automated`
2. **US Census Bureau geocoder** (all 50 states + DC, no API key) → coverage `data-assisted`
3. **No match** → coverage `manual-review`

Ambiguous parcel matches return candidates and coverage `customer-confirmation`.

Hard rule enforced in code: the module never fabricates zoning, setbacks, lot coverage,
permit requirements, fees, or approvals. Unknowns return `null` and are surfaced to the
customer as `itemsRequiringConfirmation`. Every result carries jurisdiction, named data
source, retrieval date, coverage label, and confidence.

Operators add jurisdictions without a code change via `KEALEE_PARCEL_SERVICES`
(JSON array of ArcGIS parcel-layer configs). DC is registered and verified working.

## Why `api.kealee.com/v30/*` returns 404

`services/api` registers route groups through `safeRegisterBlock`, which logs and continues
when a group throws during registration. Every route in a failed group then 404s with no
outward signal. On the running instance the v30, concept, zoning, and bots groups are all
missing, while core routes respond — consistent with those groups failing to import.

A likely contributor: `services/api` built with `"build:ts": "(tsc --incremental false; true)"`,
which swallowed TypeScript failures and could ship an incomplete `dist`. That swallow is
being removed in a parallel change (not included in this commit). `GET /health/routes`,
added here, now reports exactly which groups failed on a running instance so this is
diagnosable without shell access to the container.

## Known gaps left deliberately manual

- **Estimation, Permitting, and Site Plan production.** The orchestration routes on
  `api.kealee.com` (`/v30/*`) are not registered on the running instance, so these orders
  route to the human fulfillment queue with status "In Review" and an ops alert. This is
  disclosed to the customer on the order page.
- **Owner portal.** `owner.kealee.com` does not resolve. Deliverables serve from
  `/orders/[id]` on the main domain until DNS exists. Setting
  `NEXT_PUBLIC_OWNER_PORTAL_URL` switches delivery back to the portal automatically.
- **Admin app.** `admin.kealee.com` returns 404. The orders console runs inside web-main.

## Build-chain issues that affect deployment

Both were found while building locally. Neither is caused by the changes in this commit,
and both are owned outside this scope — but they gate a deploy.

1. **`packages/automation` did not compile — FIXED in this commit.** Two errors in
   `src/sensor-analysis.ts` (`Type 'unknown' is not assignable to type 'SensorAnalysisData'`),
   caused by assigning `await res.json()` straight into a typed variable. `services/api`'s
   build runs `pnpm --filter @kealee/automation build`, and that failure used to be swallowed
   by `"build:ts": "(tsc --incremental false; true)"` — the most likely reason the running API
   shipped an incomplete `dist` and 404s its v30/concept/zoning/bots routes. A parallel change
   removes that swallow, so the failure would have become a hard API build break.
   Fixed with a runtime type guard (`isSensorAnalysisData`) rather than a cast: the payload
   crosses a network boundary, and both callers already treat an unusable response as "no
   sensor data", so a malformed body now takes that same path instead of throwing on
   `analysis.sensors`. `packages/automation` now compiles clean (tsc exit 0).

   Dormant and left alone: `packages/automation/package.json` sets `main: ./dist/index.js`,
   but there is no `src/index.ts` and nothing imports the package root — only subpaths. Worth
   tidying, but changing an entry point risks the subpath consumers.

2. **`packages/autonomous-runtime` had no `dist/`.** `apps/web-main/lib/autonomous-fulfillment.ts`
   imports it, it is not in web-main's `transpilePackages`, and its `main` points at
   `./dist/index.js`. A direct `next build` fails with `Module not found`. Turbo's
   `dependsOn: ["^build"]` builds it first, so the Railway build command is safe — but any
   build path that bypasses turbo is not. It compiles cleanly once built.

## Pre-existing issues found but not fixed here

- `jest.config.js` references `apps/m-permits-inspections/__tests__/setup.ts`, which does not
  exist. Jest validates every project even when one is selected, so `pnpm test` fails at
  config validation before any test runs. Fixing it belongs with whoever owns that app.
- `apps/web-main/lib/__tests__/*.test.ts` import from `vitest`, but web-main has no vitest
  config and its jest project matches those paths. Those suites do not currently run.
- `apps/web-main/next.config.js` sets `typescript.ignoreBuildErrors` and
  `eslint.ignoreDuringBuilds`, so type and lint regressions ship silently.
