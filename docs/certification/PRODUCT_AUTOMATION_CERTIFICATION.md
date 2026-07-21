# Product Automation Certification

Updated: 2026-07-20

Certification is intentionally **not marked complete**. Safe in-repository implementation and static/contract verification are complete for the changes below. Runtime payment, database, provider, email, and authenticated owner-portal checks still require configured test credentials and a local/deployed environment that can complete route compilation.

## Flow evidence

| Flow | Implemented | Test passed | Runtime verified | Remaining environment requirement | Evidence / command | Relevant files |
|---|---|---|---|---|---|---|
| Guided intake and uploads | Yes; familiar concept-details layout retained, homeowner questions added, device autosave and upload/removal preserved | TypeScript passed | Dev server started; route compilation did not complete within 60 seconds, so browser certification remains open | Responsive browser run with Supabase test storage | `pnpm --filter web-main exec tsc --noEmit --pretty false` | `apps/web-main/app/intake/[projectPath]/page.tsx` |
| Server-authoritative checkout | Yes | Existing checkout implementation inspected; contract fixtures added | Not charged (test/live charge deliberately not created) | Stripe test secret and Price IDs | Focused Vitest suite below | `apps/web-main/app/api/intake/checkout/route.ts`, `apps/web-main/app/api/revenue-products/checkout/route.ts` |
| Signature-verified shared webhook | Yes; `revenue_product`, public intake, V30, estimate, permit, and bundles converge on shared handler | Fixture contracts passed | Not delivered to a deployed endpoint | Stripe CLI/test-mode webhook secret | `pnpm exec vitest run apps/web-main/lib/__tests__/revenue-products.test.ts` | `apps/web-main/app/api/webhooks/stripe/route.ts`, `apps/web-main/lib/stripe-webhook-handler.ts` |
| Idempotent transaction and generation | Yes; checkout-session upsert, duplicate transaction guard, existing bot execution reuse, retryable failures | Pure routing/merge contracts passed; database behavior compiled | Not database-integrated | Test Postgres/Supabase with revenue migration applied | Agent-stack and orchestration builds | `apps/web-main/lib/revenue-fulfillment.ts`, `packages/os-ai-orch/src/start-generation.ts` |
| Product-specific execution | Yes; exact bots, workflow ID, and intelligence depth travel web → API → V30 | Four products, standalone estimate/permit, and two bundles passed | Provider calls not executed | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` fallback, `KEALEE_V30_ENABLED=true`, public V30 user | 8 focused tests; package builds | `apps/web-main/lib/product-automation.ts`, `services/api/src/modules/v30/v30.routes.ts` |
| OpenAI primary / Claude fallback | Yes for design, estimate, zoning, and permit worker execution; default `gpt-5.5`, env-overridable | TypeScript builds passed | No paid provider calls made | Provider test credentials and model entitlement | `pnpm --filter @kealee/kealee-agent-stack build` | `packages/kealee-agent-stack/src/v30/v30-primary-client.ts` |
| Property intelligence depth | Yes; depth changes zoning execution prompt and requested deliverables | Catalog depth assertions passed | Not provider-executed | Provider test credentials | Focused Vitest suite | `packages/kealee-agent-stack/src/v30/bot-task-prompts.ts`, `prompts/zoning-bot.ts` |
| Output synchronization | Yes; design, estimate, zoning, and permit outputs merge into the latest intake record with completed/partial/failed states | TypeScript passed | Not DB-integrated | API + Supabase test environment and a completed V30 run | Web TypeScript check | `apps/web-main/lib/v30-trigger.ts`, `apps/web-main/app/api/concepts/[id]/route.ts` |
| Owner portal | Yes; homeowner overview, visual concept, friendly range, likely permit answer, progressive disclosure, next steps, downloads, and preliminary-work disclaimer | TypeScript passed | Browser certification open due local route compilation timeout | Authenticated test customer/intake and responsive browser run | Dev server log: Next 14.2.35 ready; route remained compiling | `apps/web-main/app/concept/[conceptId]/page.tsx` |
| Notifications | Payment confirmation is deduplicated behind transaction guard; ready-state remains tied to fulfillment completion paths | TypeScript passed | Not email-integrated | Resend test key/domain or captured test transport | Web TypeScript check | `apps/web-main/lib/revenue-fulfillment.ts`, `apps/web-main/lib/stripe-webhook-handler.ts` |

## Verified commands

- `pnpm exec vitest run apps/web-main/lib/__tests__/revenue-products.test.ts` — 8/8 passed.
- `pnpm --filter @kealee/kealee-agent-stack build` — passed.
- `pnpm --filter @kealee/os-ai-orch build` — passed.
- `pnpm --filter web-main exec tsc --noEmit --pretty false` — passed with no output.
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
