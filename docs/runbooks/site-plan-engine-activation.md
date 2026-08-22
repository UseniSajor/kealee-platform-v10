# Site Plan Engine — activation runbook

The engine (Phases 1–4) is complete, tested and pushed. It is **not yet live**:
three steps remain that require credentials or ownership I deliberately did not
assume. Each is listed with what it does, why it was left, and how to verify it.

Status as of 2026-08-22: 258 tests passing, engine importable, nothing wired.

## 1. Apply the migrations

Two migrations are written and unapplied:

- `20260821120000_site_plan_persistence` — 12 tables (survey imports, points,
  reconciliation runs, discrepancies, evidence, scoped approvals, checklist,
  QC findings, sheets, revisions, issuance, audit)
- `20260822090000_rule_certification` — 12 tables (sources, versions, regions,
  certifiable rules, provenance, applicability, reconciliation, certifications,
  packs, members, audit, change events)

Both are additive: **zero destructive statements**, every statement `IF NOT
EXISTS` or exception-guarded, safe to re-run. No Phase 3B data is at risk.

```bash
# Verify before applying — should print 0 for both.
grep -ciE '^\s*(DROP|TRUNCATE|DELETE FROM|ALTER COLUMN)' \
  packages/database/prisma/migrations/2026082*/migration.sql

# Apply to a shadow/staging database FIRST.
cd packages/database
DATABASE_URL=<staging> DIRECT_URL=<staging> npx prisma migrate deploy
```

**Do not apply to production automatically.** Run against staging, confirm the
24 tables exist, then schedule production.

## 2. Regenerate the Prisma client

`prisma/schema.prisma` is **generated** from `schema-src/` by
`scripts/merge-schema.ts`. Both phases' models live in:

- `schema-src/foundation/site-plan-persistence.prisma`
- `schema-src/foundation/rule-certification.prisma`

They are **not** in the committed `prisma/schema.prisma`, because at the time of
writing another agent had uncommitted `schema-src/` changes in flight and running
the merger would have swept them into an unrelated commit.

```bash
cd packages/database
pnpm schema:merge          # regenerates prisma/schema.prisma from schema-src/
npx prisma validate        # needs DATABASE_URL + DIRECT_URL set; dummy values fine
npx prisma generate
```

Never run `prisma format` — it reformats all ~18k lines.

## 3. Wire the engine into web-main

Nothing outside the package imports the engine yet. The boundary is built and
tested (`integration/site-plan-order.ts`); it needs one dependency and one call.

`apps/web-main/package.json` and `pnpm-lock.yaml` were being edited by another
agent, so the dependency was not added.

```jsonc
// apps/web-main/package.json
"@kealee/pascal-agents": "workspace:*"
```

```ts
// Import from /engine, NOT the package root. The root re-exports the Pascal
// editor, which reaches @react-three/drei and therefore React — fine in a
// browser bundle, fatal in an API route or worker.
import { SitePlanOrders, Rules } from '@kealee/pascal-agents/engine'

const report = SitePlanOrders.evaluateOrder({
  orderId, formData, jurisdictionCode: 'prince_georges_md',
  rules,                  // loaded from certifiable_rules
  pack,                   // loaded from rule_pack_versions
  currentSourceHashes,    // from the last source refresh
})
```

Call site: `apps/web-main/lib/product-automation.ts` routes
`preliminary_site_plan`, `verified_site_feasibility` and `permit_site_plan`.
An unsupported jurisdiction returns `coverage: 'manual-review'`, which should
route through the existing `routeToManualFulfillment()`.

## 4. Schedule the source refresh

`Rules.refreshSource()` fetches, re-hashes and applies scoped invalidation. It
must run in a maintenance job, **never on a request path** — the whole point of
certification is that evaluating an order touches no network.

Region locators still need writing for the real PG endpoints; the pilot uses
synthesised content. Without them the change detector cannot isolate scope and
will reopen every rule from a source on any change (it says so when it does).

## What is genuinely blocked

- **§25-128 Table 1** — canopy percentages unretrievable from every published
  source checked. Certification is prohibited; four regression tests hold that
  line. Only obtaining the table fixes this.
- **10 overlay rules** — standards come from each district's adopted plan, not
  from ordinance text. Not certifiable generically, by nature.
- **Footnote text** — not captured at extraction. A reviewer supplies it via the
  audited `resolve_footnote` action, which is one-time work per rule.
