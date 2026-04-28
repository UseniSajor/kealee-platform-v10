# Latest System Audit — 2026-04-27

## Status Per Phase

| Phase | Status |
|-------|--------|
| Revenue Loop | PASS |
| Bot System | PASS |
| Repo Consolidation | FAIL (manual delete needed) |
| Schema + DB | PASS |
| V20 Components | PASS |
| Bot + V20 Integration | PASS |
| Digital Twin Loop | PASS |
| Orchestrator | PASS |
| Fail-Safe System | PASS |
| End-to-End Pipeline | PASS |
| Web Frontend (MEGA PROMPT) | PASS |

## Fixes Applied 2026-04-23

- `services/worker/src/utils/email-queue.ts` — CREATED
- `services/worker/src/utils/prisma-helper.ts` — CREATED
- `project-execution.processor.ts`: estimate endpoint fixed, change_order fallback, DigitalTwin upsert, resultJson normalized
- `estimate-agent.ts` — CREATED
- `agents.routes.ts`: /estimate/execute added, live Parcel+ZoningProfile DB lookup injected
- `agents.routes.ts` (2nd pass): projectId + address forwarded to ALL 5 agents; redundant fetchLiveContext() removed
- `bots.chain.ts`: ContractorBot (Stage 4) added, runChain updated
- `bots.chain.routes.ts`: contractor endpoint + normalization added

## Fixes Applied 2026-04-26 — DigitalTwin Canonization

- `services/api/src/lib/twin/digital-twin.service.ts` — CREATED
  - `ensureDigitalTwin(projectId, orgId)`: upsert twin, throw in prod on failure
  - `readTwinContext(projectId)`: read-only fetch with recent events
  - `recordTwinEvent(twinId, ...)`: create TwinEvent, throw in prod on failure
  - `validateTwinExists(projectId)`: throws in prod if no twin
- `project.service.ts`: `ensureDigitalTwin()` called after `createProject()` and `createProjectFromLead()`
- `land.routes.ts`: `ensureDigitalTwin()` called after parcel→project conversion
- `precon.routes.ts`: `ensureDigitalTwin()` called after precon→project completion
- `pm-projects.service.ts`: `ensureDigitalTwin()` called after PM project creation
- `project-execution.processor.ts`: Step 6 DigitalTwin — silent skipping removed; dev=warn, prod=throw+retry
- `bots.chain.ts`:
  - `twinContext?` field added to `ChainInput`
  - `buildTwinSection(input)` helper — appends twin state to all bot user prompts
  - `runChain()` fetches DigitalTwin before first bot; injects into enriched input
  - Production: throws if project has no DigitalTwin; Dev: warns and continues

## Fixes Applied 2026-04-26 — Persistence Enforcement

- `services/worker/src/utils/db-retry.ts` — CREATED (3-attempt exponential backoff)
- `bots.chain.ts`: added IS_PROD + dbRetry helper
  - `dbCreateRun`: retry + structured log + throw in prod
  - `dbCompleteRun`: retry + structured log + throw in prod
  - `dbFailRun`: retry + structured log + NEVER rethrow (in error handler)
  - `BotDesignConcept.create`: retry + throw in prod
  - `BotEstimateLineItem.createMany`: retry + throw in prod
  - `PermitCase.create`: retry + throw in prod
- `project-execution.processor.ts`: added `withRetry` import + IS_DEV flag
  - Step 2 status='generating': retry + log (always continues)
  - Step 4 status='completed': retry + throw in prod (BullMQ retries job)
  - Failure path: retry + `.then(log success, log error)` — never masks original error
- `worker/src/index.ts`: `validateRequiredEnv()` added at startup — fails fast if DATABASE_URL or REDIS_URL missing

## Fixes Applied 2026-04-26 — Vercel Deployment

- `apps/web-main/vercel.json` — CREATED (framework, buildCommand, installCommand, outputDirectory)
- `app/api/permits/status/route.ts`: removed localhost fallback; returns 503 if API_URL not set
- `app/api/pre-design/[id]/route.ts`: removed localhost fallback; returns 503 if API_URL not set
- `lib/keacore.ts`: removed `http://localhost:3030` fallback → empty string (fails gracefully)
- `app/permits/checkout/client.tsx`: `window.location.origin` replaces `localhost:3000` fallback
- `app/intake/[projectPath]/page.tsx`: `window.location.origin` replaces `localhost:3000` fallback

## Fixes Applied 2026-04-26 — Vercel Env Documentation

- `apps/web-main/.env.example` — CREATED (comprehensive; all vars across Supabase, Stripe, AI, email, portals, Sentry, GA)
- `components/CancelSubscriptionButton.tsx`: removed `|| 'http://localhost:3001'` fallback → `?? ''`

## Fixes Applied 2026-04-26 — P0-P3

- **P0 Fastify v5 plugins**: upgraded @fastify/cors→9, helmet→12, rate-limit→10, multipart→9, swagger→9, swagger-ui→5, sensible→6, jwt→9 in `services/api/`
- **P1 OS-Feas queue**: `feasibility.routes.ts` — on GO decision with projectId → create ProjectOutput(type='estimate') + enqueue
- **P1 OS-Land queue**: `ops-services/service-request.routes.ts` — added optional `projectId` + `CATEGORY_TO_OUTPUT_TYPE` map → create ProjectOutput + enqueue when projectId + qualifying category present
- **P2 DCS gate**: `bots.chain.routes.ts` — added DCS_MIN_THRESHOLD=60 guard before runChain(); returns 422 DCS_GATE_FAILED if score < 60; DB failure → warn+continue
- **P3 TS errors**: fixed 30 TypeScript errors across 15 files; removed `ignoreBuildErrors`/`ignoreDuringBuilds` from `next.config.js`
  - Stripe apiVersion casts (3 files)
  - RoleBenefits/RoleWorkflow component interfaces accept `emoji`/`description`/`eyebrow`/`subheadline`/`accentColor` aliases (4 pages fixed)
  - Capture routes: `address`/`client_name`/`created_by_user_id` casts; `CaptureCompletenessReport` missing fields added; `CaptureZone` cast; `send-link` PromiseLike→try-catch
  - FAQ `description` → `answer` prop; React import added to layout-enhanced.tsx
  - `Filters` exported from MarketplaceFilterBar; DEFAULT_FILTERS typed
  - Search route: `best` typed as union element
  - NavLink: `type?: 'link'` added for test narrowing

## Fixes Applied 2026-04-27 — Web Frontend + Docs

- `apps/web-main/app/api/design-professionals/register/route.ts` — CREATED (POST endpoint for architect/engineer registration)
- `apps/web-main/app/architect/register/page.tsx` — handleSubmit now POSTs to `/api/design-professionals/register` with role=ARCHITECT
- `apps/web-main/app/engineer/register/page.tsx` — handleSubmit now POSTs to `/api/design-professionals/register` with role from discipline
- `docs/system/bots.md` — CREATED (bot chain, DCS gate, DigitalTwin injection, retry logic)
- `docs/system/data-flow.md` — CREATED (full pipeline, DB tables, OS service integration rules)
- All MEGA PROMPT phases (0–4) verified complete: HeroSearch, nav order, contractor lead page, admin empty state, media infrastructure, service config, gallery, service pages, test intake demo API, E2E test suite (10 spec files), Jest unit tests (3 files)

## Remaining Issues

- Duplicate repos: manual delete requires `delete_repo` OAuth scope — run `gh auth refresh -h github.com -s delete_repo` then delete: kealee-api, kealee-openclaw, kealee-platform, kealee-platform-v3, kealee-construction-z-digital
- P4 repo deletion blocked — needs `delete_repo` scope grant
- Stock videos: `lib/stock-videos.ts` has empty `src` strings pending real Pexels/Vimeo URLs

## Pipeline State

User→Intake→CTA→Stripe→Webhook→ProjectOutput✅→Queue✅→Worker✅→DigitalTwin✅(enforced)→Output✅→Email✅
Chain: Design✅→Estimate✅→Permit✅→Contractor✅ (all bots receive DigitalTwin context)
Agents: land✅ design✅ estimate✅ permit✅ contractor✅ (live DB + RAG fallback, projectId/address forwarded)
DigitalTwin: created at all 4 project creation paths✅, enforced in worker✅, injected into bot chain✅
