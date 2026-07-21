# Revenue Product Catalog — Final 14-Task Status

Updated: 2026-07-20

## Summary

- Complete: 11
- Integration-blocked: 3
- Tests: 13 targeted tests passing
- Prisma schema: valid
- Agent-stack build: passing

## Task ledger

1. **Complete — Audit current product/pricing sources.** Canonical prices are $299, $550, $795, and $1,095.
2. **Complete — Define the four revenue products.** Product metadata, delivery windows, workflows, and bot requirements are represented in code.
3. **Complete — Add Revenue Product Catalog Prisma models.** `RevenueProduct`, `ProductCreditLedger`, `DeliverableCorrection`, and `RevenueTransaction` are present in the generated Prisma schema.
4. **Complete — Add database migration.** The migration creates catalog enums/tables, constraints, indexes, and foreign keys.
5. **Complete — Seed Product 1.** Essential Site Intelligence Report is included in SQL and TypeScript seed data.
6. **Complete — Seed Product 2.** Build Feasibility Assessment is included in SQL and TypeScript seed data.
7. **Complete — Seed Product 3.** Development Strategy Package is included at $795.
8. **Complete — Seed Product 4.** Complete Developer Intelligence Package is included at $1,095.
9. **Integration-blocked — Change the existing core `zoning-bot.ts` function signature.** The depth type, requirements, and an executable wrapper are implemented in `apps/web-main/lib/revenue-zoning.ts`; the tracked core file still needs the optional `PropertyIntelligenceDepth` argument threaded into its prompt.
10. **Complete — Wire checkout for Products 1–4.** The revenue checkout route validates slugs, creates an intake, uses configured Stripe prices when present, and otherwise uses server-authoritative inline pricing.
11. **Complete — Add authoritative Stripe metadata.** Checkout metadata includes source, product identity, amount, intake ID, depth, workflow, and responsible agent.
12. **Complete — Add idempotent transaction fulfillment.** Fulfillment upserts `RevenueTransaction` by provider transaction ID and records processing, completion, and failure state.
13. **Integration-blocked — Make the existing V30 trigger consume product-specific bot selection.** The fulfillment layer records the requested workflow and bot set, but the tracked `v30-trigger.ts` still needs to use that selection instead of its default full bot set.
14. **Integration-blocked — Merge revenue events into the existing Stripe webhook and finish repository-wide typecheck.** A signature-verified dedicated webhook exists and targeted tests pass. The existing shared webhook still needs the revenue branch merged into it. Full web typecheck also remains red from baseline project errors plus an `afterEach` callback in the previously added Apollo test that must be changed to a block body.

## Existing-file edits still required

The workspace patch helper repeatedly failed when updating existing files while continuing to allow new-file creation. Once existing-file writes work again:

1. Update `packages/kealee-agent-stack/src/core/zoning-bot.ts` to accept an optional depth parameter and include its requirements in the prompt.
2. Update `apps/web-main/lib/v30-trigger.ts` to accept/pass the selected product workflow and bot types.
3. Merge the `revenue_product` branch into `apps/web-main/app/api/webhooks/stripe/route.ts`, then retire the dedicated revenue webhook route if only one Stripe webhook endpoint is desired.
4. Export the shared revenue catalog from `packages/kealee-agent-stack/src/v30/index.ts` and replace the temporary web-local catalog duplication.
5. Change the Apollo test cleanup callback to `{ vi.restoreAllMocks(); }`, then rerun the complete web typecheck.

## Verification completed

- Revenue/marketing targeted Vitest suite: 13/13 passing.
- Generated Prisma schema validation: passing.
- Prisma client generation: passing.
- Database package TypeScript check: passing.
- Kealee agent-stack build: passing.
- Complete web TypeScript check: failing on existing Intelligence Loop, Marketing Workspace, and Balmoral Buffer errors, plus the Apollo cleanup callback noted above; no errors were reported in the newly added revenue implementation files.
