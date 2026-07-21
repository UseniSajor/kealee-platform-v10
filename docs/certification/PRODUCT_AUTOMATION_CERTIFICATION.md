# Product Automation Certification

Updated: 2026-07-20

Certification is intentionally **not marked complete**. Safe in-repository implementation and static/contract verification are complete for the changes below. Runtime payment, database, provider, email, and authenticated owner-portal checks still require configured test credentials and a local/deployed environment.

The payment paths now create an idempotent canonical `AutonomousGoal` and `AutonomousRun` with a product-specific capability plan before V30 execution. V30 results remain compatible execution projections and are synchronized into autonomous steps/evidence, the intake, and the homeowner report.

## Flow evidence

| Flow | Implemented | Test passed | Runtime verified | Remaining environment requirement | Evidence / command | Relevant files |
|---|---|---|---|---|---|---|
| Guided intake and uploads | Yes; familiar concept-details layout retained, homeowner questions added, device autosave and upload/removal preserved | Focused contracts and repository-wide TypeScript check passed | Browser verified at 390×844; route returned HTTP 200 and the complete guided form rendered | Live upload/storage interaction still needs a Supabase test fixture | `corepack pnpm --filter web-main exec playwright screenshot --browser=chromium --viewport-size='390,844' --full-page http://127.0.0.1:3101/intake/whole_home_concept /tmp/kealee-intake-mobile.png` | `apps/web-main/app/intake/[projectPath]/page.tsx` |
| Server-authoritative checkout | Yes | Existing checkout implementation inspected; contract fixtures added | Not charged (test/live charge deliberately not created) | Stripe test secret and Price IDs | Focused Vitest suite below | `apps/web-main/app/api/intake/checkout/route.ts`, `apps/web-main/app/api/revenue-products/checkout/route.ts` |
| Signature-verified shared webhook | Yes; `revenue_product`, public intake, V30, estimate, permit, and bundles converge on shared handler | Fixture contracts passed | Not delivered to a deployed endpoint | Stripe CLI/test-mode webhook secret | `pnpm exec vitest run apps/web-main/lib/__tests__/revenue-products.test.ts` | `apps/web-main/app/api/webhooks/stripe/route.ts`, `apps/web-main/lib/stripe-webhook-handler.ts` |
| Idempotent transaction and generation | Yes; checkout-session upsert, duplicate transaction guard, existing bot execution reuse, retryable failures | Pure routing/merge contracts passed; database behavior compiled | Not database-integrated | Test Postgres/Supabase with revenue migration applied | Agent-stack and orchestration builds | `apps/web-main/lib/revenue-fulfillment.ts`, `packages/os-ai-orch/src/start-generation.ts` |
| Autonomous goal/run bridge | Yes; Stripe session is the run idempotency key and purchased bots become capability steps | Runtime tests passed | Not test-DB integrated | Apply autonomous migration to a test database | 20 runtime tests | `apps/web-main/lib/autonomous-fulfillment.ts`, `packages/autonomous-runtime/src/capabilities.ts` |
| Product-specific execution | Yes; exact bots, workflow ID, and intelligence depth travel web → API → V30 | Four products, standalone estimate/permit, and two bundles passed | Provider calls not executed | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` fallback, `KEALEE_V30_ENABLED=true`, public V30 user | 8 focused tests; package builds | `apps/web-main/lib/product-automation.ts`, `services/api/src/modules/v30/v30.routes.ts` |
| OpenAI primary / Claude fallback | Yes for design, estimate, zoning, and permit worker execution; default `gpt-5.6-sol`, env-overridable | TypeScript builds passed | OpenAI handled the minimal request with model `gpt-5.6-sol` and `fallbackUsed=false`; Claude fallback separately verified after compatibility repair | Full product-quality provider runs remain pending | Minimal `completeV30WithFallback` connectivity requests, 2026-07-20 | `packages/kealee-agent-stack/src/v30/v30-primary-client.ts`, `packages/kealee-agent-stack/src/v30/v30-claude-client.ts` |
| Public project assistant provider routing | Yes; backend proxy first, OpenAI `gpt-5.6-sol` primary, Claude backup, deterministic no-key response | Empty and malformed bodies runtime verified as safe HTTP 400 responses | Route compiled and validation requests passed | Existing account model entitlement for response-quality verification | `curl --max-time 60 -X POST http://127.0.0.1:3101/api/agents/design -H 'Content-Type: application/json'` | `apps/web-main/app/api/agents/[agentType]/route.ts` |
| Property intelligence depth | Yes; depth changes zoning execution prompt and requested deliverables | Catalog depth assertions passed | Not provider-executed | Provider test credentials | Focused Vitest suite | `packages/kealee-agent-stack/src/v30/bot-task-prompts.ts`, `prompts/zoning-bot.ts` |
| Output synchronization | Yes; design, estimate, zoning, and permit outputs merge into the latest intake record with completed/partial/failed states; certified estimates remain awaiting professional approval | Focused contracts passed | Not DB-integrated | API + Supabase test environment and a completed V30 run | Revenue product contract suite | `apps/web-main/lib/v30-trigger.ts`, `apps/web-main/app/api/concepts/[id]/route.ts` |
| Owner portal | Yes; homeowner overview, visual concept, friendly range, likely permit answer, progressive disclosure, next steps, downloads, and preliminary-work disclaimer | 10/10 presentation-state tests passed | Not browser verified because no safe authenticated concept fixture is available | Authenticated test customer/intake and responsive browser run | `corepack pnpm --filter web-main exec vitest run lib/__tests__/owner-portal-presentation.test.ts` | `apps/web-main/app/concept/[conceptId]/page.tsx`, `apps/web-main/lib/owner-portal-presentation.ts` |
| Notifications | Payment confirmation is deduplicated behind transaction guard; ready-state remains tied to fulfillment completion paths | TypeScript passed | Not email-integrated | Resend test key/domain or captured test transport | Web TypeScript check | `apps/web-main/lib/revenue-fulfillment.ts`, `apps/web-main/lib/stripe-webhook-handler.ts` |

## Verified commands

- `corepack pnpm --filter web-main exec vitest run lib/__tests__/revenue-products.test.ts` — 11/11 passed, including exact `gpt-5.6-sol` routing.
- `corepack pnpm --filter web-main exec vitest run lib/__tests__/owner-portal-presentation.test.ts` — 10/10 passed.
- `pnpm --filter @kealee/kealee-agent-stack build` — passed.
- `pnpm --filter @kealee/os-ai-orch build` — passed.
- `NODE_OPTIONS=--max-old-space-size=4096 corepack pnpm --filter web-main exec tsc --noEmit --pretty false` — passed.
- `pnpm --filter @kealee/database exec prisma validate --schema prisma/schema.prisma` — schema valid.
- `git diff --check` — passed.

## Required runtime certification matrix

Run only in Stripe test mode. For each row, verify a signed webhook, duplicate delivery, one transaction, one project/package, the exact bot set, merged intake files/answers, persisted outputs, one payment email, one ready email, and owner-portal rendering.

1. Home Project Readiness Review: estimate, zoning, project.
2. Project Launch Package: design, estimate, zoning, permit, contractor, project.
3. Contractor Estimate and Permit Package: estimate, zoning, permit, sales, project.
4. Developer Feasibility Express: estimate, zoning, permit, sales, project.
5. Standalone estimate: estimate, project.
6. Standalone permit roadmap: zoning, permit, project.
7. Estimate + permit bundle: estimate, zoning, permit, project.
8. Design + estimate + permit bundle: design, estimate, zoning, permit, project.

No output may be presented as permit approval, stamped drawings, a sealed estimate, or professional certification unless a qualified human has actually supplied that artifact.
