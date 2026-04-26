# Latest System Audit — 2026-04-26

## Status Per Phase

| Phase | Status |
|-------|--------|
| Revenue Loop | PASS |
| Bot System | PASS |
| Repo Consolidation | FAIL (manual delete needed) |
| Schema + DB | PASS |
| V20 Components | PARTIAL |
| Bot + V20 Integration | PARTIAL |
| Digital Twin Loop | PASS |
| Orchestrator | PASS |
| Fail-Safe System | PASS |
| End-to-End Pipeline | PARTIAL |

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

## Remaining Issues

- Duplicate repos: kealee-platform, kealee-platform-v10services, kealee — manual delete required
- OS app API routes (OS-Land, OS-Feas) not connected to ProjectOutput/queue
- DCS routing not enforced at chain route level
- `@fastify/cors@8.5.0` expects Fastify 4.x but 5.8.5 is installed (5 plugins need v5 upgrades)
- `next.config.js`: `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` should be removed once TS errors are fixed

## Pipeline State

User→Intake→CTA→Stripe→Webhook→ProjectOutput✅→Queue✅→Worker✅→DigitalTwin✅(enforced)→Output✅→Email✅
Chain: Design✅→Estimate✅→Permit✅→Contractor✅ (all bots receive DigitalTwin context)
Agents: land✅ design✅ estimate✅ permit✅ contractor✅ (live DB + RAG fallback, projectId/address forwarded)
DigitalTwin: created at all 4 project creation paths✅, enforced in worker✅, injected into bot chain✅
