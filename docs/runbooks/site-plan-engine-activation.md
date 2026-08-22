# Site Plan Engine — activation runbook

**Status: Phase 4 is HANDED OFF, NOT COMPLETE.**

The engine (Phases 1–4) is built, tested and pushed — 258 tests passing, the
package importable from Node, the order boundary written. It is not live: no
migration has been applied, the Prisma client does not know the models, and no
running code calls it.

Phase 4 is marked complete only after step 5 below — one staging order validated
end to end. Not before.

Owner as of 2026-08-22: unassigned. Last engine commit: `b2b2e819`.

---

## Step 0 — Preserve the in-flight work FIRST

This is the step most likely to destroy someone else's day. At handoff there was
substantial uncommitted work by another agent in exactly the directories the
next steps touch:

```
 M packages/database/schema-src/feasibility/models.prisma
 M packages/database/schema-src/identity/models.prisma
 M packages/database/schema-src/land/models.prisma
 M packages/database/schema-src/payments/models.prisma
 M packages/database/schema-src/pm/drawings.prisma
 M packages/database/schema-src/pm/estimation.prisma
 M packages/database/schema-src/pm/projects.prisma
 M apps/web-main/package.json
 M pnpm-lock.yaml
?? packages/database/schema-src/foundation/runtime-recovered.prisma   <-- UNTRACKED
```

Roughly 15,000 insertions and 18,000 deletions across nine files. The untracked
`runtime-recovered.prisma` is the fragile one: `git clean -fd`, `git stash drop`
or a careless `git checkout --` destroys it with no recovery.

Before touching anything:

```bash
# Snapshot everything, tracked and untracked, without changing the working tree.
git stash push --include-untracked --keep-index -m "preserve-pre-activation-$(date +%F)"
git stash list        # confirm it is there
git stash apply       # put it straight back; the stash stays as a safety net
```

Better still, coordinate with whoever owns that work and get it committed on its
own branch first. Do not merge the schema on top of someone's half-finished
refactor — the merger reads whatever is on disk.

**Do not run `pnpm schema:merge` until step 0 is settled.** The merger reads the
working tree, so it will bake in whatever state that work happens to be in.

---

## Step 1 — Add the dependency

`apps/web-main` has no dependency on the engine. Adding it was deliberately left
alone because `apps/web-main/package.json` and `pnpm-lock.yaml` were mid-edit.

```jsonc
// apps/web-main/package.json — dependencies
"@kealee/pascal-agents": "workspace:*"
```

```bash
pnpm install --filter @kealee/web-main
```

---

## Step 2 — Merge the schema

`prisma/schema.prisma` is **generated** from `schema-src/` by
`scripts/merge-schema.ts`. Both phases' models are already in place:

- `schema-src/foundation/site-plan-persistence.prisma` (Phase 3B, 12 models)
- `schema-src/foundation/rule-certification.prisma` (Phase 3C, 12 models + 8 enums)

**Verified at handoff:** across all 68 `schema-src` files there are 774 model and
enum declarations and **zero duplicate names**, including against the untracked
`runtime-recovered.prisma` (81 declarations, no overlap with either of mine).
The merge produces a valid schema. Re-run this check after step 0, because that
work may have moved:

```bash
cd packages/database && python3 - <<'PY'
import os, re, collections
SRC='schema-src'
ORDER=['foundation','identity','ddts','land','feasibility','development','pm','payments',
       'operations','marketplace','documents','workflow','integrations','analytics',
       'intelligence','pre-design']
files=[os.path.join(SRC,f) for f in sorted(os.listdir(SRC)) if f.endswith('.prisma')]
for d in ORDER:
    p=os.path.join(SRC,d)
    if not os.path.isdir(p): continue
    key=lambda f:(0,f) if f=='enums.prisma' else (1,f) if f=='models.prisma' else (2,f)
    files += [os.path.join(p,f) for f in sorted(os.listdir(p),key=key) if f.endswith('.prisma')]
decls=collections.defaultdict(list)
for f in files:
    for line in open(f,encoding='utf-8',errors='replace'):
        m=re.match(r'^(model|enum)\s+(\w+)\s*\{', line)
        if m: decls[(m.group(1),m.group(2))].append(f)
d={k:v for k,v in decls.items() if len(v)>1}
print(f"{len(files)} files, {len(decls)} declarations, {len(d)} duplicates")
for (k,n),w in list(d.items())[:10]: print(f"  DUPLICATE {k} {n}: {w}")
PY
```

Then:

```bash
cd packages/database
pnpm schema:merge
DATABASE_URL=postgresql://u:p@localhost:5432/db \
DIRECT_URL=postgresql://u:p@localhost:5432/db \
  npx prisma validate           # dummy values are fine; it only needs them present
```

**Never run `prisma format`** — it reformats all ~18k lines and buries the diff.

---

## Step 3 — Generate the Prisma client

```bash
cd packages/database && npx prisma generate
```

Until this runs, `PrismaSitePlanStore` and `RuleCertificationStore` have no
client to bind to and the adapters are unusable.

---

## Step 4 — Apply the migrations to staging

Two migrations, both unapplied:

- `20260821120000_site_plan_persistence` — 12 tables (survey imports and points,
  reconciliation runs, discrepancies, evidence, scoped approvals, checklist,
  QC findings, sheets, revisions, issuance, audit)
- `20260822090000_rule_certification` — 12 tables (sources, versions, regions,
  certifiable rules, provenance, applicability, reconciliation, certifications,
  packs, members, audit, change events)

Both are additive: zero destructive statements, every statement `IF NOT EXISTS`
or exception-guarded, safe to re-run. No Phase 3B data is at risk. Confirm it
yourself rather than taking this on trust:

```bash
grep -ciE '^\s*(DROP|TRUNCATE|DELETE FROM|ALTER COLUMN)' \
  packages/database/prisma/migrations/2026082*/migration.sql      # expect 0 and 0

cd packages/database
DATABASE_URL=<staging> DIRECT_URL=<staging> npx prisma migrate deploy
```

**Staging only.** Confirm all 24 tables exist before scheduling production.

---

## Step 5 — Make the call, and validate one staging order end to end

This is the completion gate.

Import from `/engine`, **not** the package root. The root re-exports the Pascal
editor, which reaches `@react-three/drei` and therefore React — fine in a browser
bundle, fatal in an API route or a worker.

```ts
import { SitePlanOrders } from '@kealee/pascal-agents/engine'

const report = SitePlanOrders.evaluateOrder({
  orderId,
  formData,                               // public_intake_leads.form_data
  jurisdictionCode: 'prince_georges_md',
  rules,                                  // from certifiable_rules
  pack,                                   // from rule_pack_versions
  currentSourceHashes,                    // from the last source refresh
})
```

Call site: `apps/web-main/lib/product-automation.ts` routes
`preliminary_site_plan`, `verified_site_feasibility` and `permit_site_plan`.
A `coverage: 'manual-review'` result should route through the existing
`routeToManualFulfillment()` rather than failing.

### What "validated end to end" means

Run one real staging order through a PG County address and confirm all six:

1. `evaluateOrder` returns without touching the network — no ordinance is
   fetched and no document parsed on the request path. If it is slow, something
   is wrong architecturally, not just slow.
2. `report.coverage` is `automated` or `data-assisted`, not `manual-review`
   (a PG address falling to manual-review means the pack did not load).
3. `report.determinedRequirements` cites a real code section, and every value
   traces to a certification bound to the current source hash.
4. `report.reviewItems` land in the ops queue routed to a discipline, and a
   certified unchanged rule produces none.
5. `canProceedToProfessionalReview()` returns `false` while any regulatory rule
   is unresolved — including `landscape.tree_canopy`, which is unresolvable
   today and must block. If it returns `true` with §25-128 outstanding, the
   gate is broken.
6. Nothing shown to the customer implies county approval. The wording is
   "preliminary" and "County approval is a separate step".

Then, and only then, mark Phase 4 complete.

---

## Step 6 — Schedule the source refresh (after Phase 4)

`Rules.refreshSource()` fetches, re-hashes and applies scoped invalidation. It
runs in a maintenance job, **never on a request path** — the point of
certification is that evaluating an order touches no network.

Region locators for the real PG endpoints still need writing; the pilot uses
synthesised content. Without them the detector cannot isolate scope and will
reopen every rule from a source on any change. It says so when it does, so this
degrades loudly rather than silently.

---

## Genuinely blocked, not deferred

- **§25-128 Table 1** — canopy percentages unretrievable from every published
  source checked (EncodePlus viewer, Municode API, TCC bulletin PDF, eCode360,
  all 121 Landscape Manual tables). Certification is prohibited and four
  regression tests hold that line. Only obtaining the table fixes it. Do not
  let anyone "temporarily" seed a percentage.
- **10 overlay rules** — standards come from each district's adopted plan, not
  from ordinance text. Not certifiable generically, by nature.
- **Footnote text** — not captured at extraction. A reviewer supplies it through
  the audited `resolve_footnote` action: one-time work per rule, not per project.
