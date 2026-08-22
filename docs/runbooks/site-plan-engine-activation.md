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

## Running the tests

```bash
pnpm jest --selectProjects spatial-engine     # 340 tests, ~60s
```

This only started working at `9d6aaaa0`. Before it, two Jest projects pointed at
setup files deleted in `79bb01ae`, and Jest validates *every* project even when
you select one — so the whole monorepo's test run failed on apps that no longer
have tests. If you see `Module <rootDir>/apps/.../setup.ts ... was not found`,
another decommissioned app has been left in `jest.config.js`.

The suite was also intermittently red under parallel workers: these tests do real
SHA-256 hashing and build the 51-rule pack at module scope, and on a
Windows-backed filesystem individual tests exceeded Jest's default 5s.
`packages/spatial-engine/jest.setup.ts` raises it to 30s for this project only.
Worth knowing: `--runInBand` is about 3x faster here (38s vs 123s) because the
workers contend on I/O.

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

**The locators are written and verified** — `jurisdictions/pg-source-locators.ts`
(county, 35 tests) and `jurisdictions/fema-nfhl.ts` (FEMA, 26 tests). 46 of 51
rules have a locator across 18 sources in two publisher families.

```ts
import { Rules, buildPgSourceBundles, pgRulesWithoutLocator } from '@kealee/pascal-agents/engine'

const bundles = buildPgSourceBundles(rules)
const outcomes = await Rules.refreshAll(
  bundles.map(b => ({ source: b.source, locators: b.locators, rules })),
)
```

### The one thing to not get wrong

EncodePlus publishes the ordinance at two nearly identical URLs:

| URL | What it returns |
|---|---|
| `doc-viewer.aspx` | JS shell — 41 KB, 18 scripts, **zero tables, no ordinance text** |
| `doc-view.aspx?...&print=1` | Server-rendered — 128 KB, 24 tables for 27-4202 |

`doc-viewer` is the URL a human lands on and the obvious one to copy. Hashing it
gives a value that changes on CMS deploys and **stays identical through a real
amendment** — a detector that is confidently wrong. `library.municode.com` is
the same (6 KB shell).

Never build these URLs by hand. `pgPrintUrl(secid)` is the only sanctioned
constructor, and `FORBIDDEN_HASH_URLS` records both shells with reasons.

### Verified secid map (fetched 2026-08-22)

| secid | Section | Zones | Tables |
|---|---|---|---|
| 633 | 27-4201 Rural and Agricultural | AG, AR, ROS | 9 |
| 634 | 27-4202 Residential | RE, RMF-12/20/48, RR, RSF-65/95/A | 24 |
| 635 | 27-4203 Nonresidential | CGO, CN, CS, IE, IH | 15 |
| 636 | 27-4204 Transit-Oriented/Activity Center | LTO, NAC, RTO, TAC | 18 |
| 637 | 27-4205 Other Base Zones | — | **0** |
| 639–642 | 27-4301…27-4304 Planned Development | R-PD, LTO-PD, NAC-PD, RTO-PD, TAC-PD, IE-PD, MU-PD | 17 |
| 645–646 | 27-4402…27-4403 Overlay Zones | — | 6 |

Sec. 27-4205 returning zero tables independently confirms the Phase 3C
`zoning.dimensional.absent` finding: the ordinance genuinely publishes no
dimensional table for those legacy zones.

### Invalidation scope

Section granularity: an amendment to the residential section reopens its eight
zone rules, not all 51. `deriveZoneBlocks()` can narrow to one zone using the
`secid-NNNbkM` bookmark anchors — it claims a block for a zone only when
**exactly one** zone code appears in it, and leaves ambiguous blocks on the
coarser section region. It is derived from the document on every run, never
cached as an assumption: binding RSF-65's certification to RMF-20's text is the
kind of error nobody would notice.

ArcGIS layer definitions carry `currentVersion` and `cimVersion`, which move on
Esri upgrades and have nothing to do with zoning. `arcgisStableRegion()` hashes
only fields, subtypes and coded-value domains.

### Subtitle 24 (verified 2026-08-22)

Subtitle 24 sits in the same combined document, further in. The secid ordering
is not obvious, so it is written down rather than left to be rediscovered:
definitions ~80–580, Subtitle 27 ~590–805, Subtitle 24 from ~810 past 1060.

| secid | Section | Backs | Tables |
|---|---|---|---|
| 992 | 24-3200 Summary Table of Subdivision Review Procedures | `subdivision.procedures` | 1 |
| 1034 | 24-4303 Stream, Wetland, and Water Quality Buffers | `environment.stream_buffers` | 1 |

Both were content-verified, not just title-matched: 1034 contains `24-4303` and
`buffer`, 992 contains `preliminary plan` and `major subdivision`.

Also located and recorded but **not bound to any rule** — 24-3100, 24-4102,
24-4201, 24-4301, 24-4302, 24-4304. They are in `PG_SUBTITLE_24_SECTIONS` so the
next person extending the pack does not repeat the probing, and
`buildPgSubtitle24Sources()` skips them: hashing a section that backs no rule
emits change events nobody can act on.

Note 24-4302 is the county's own 100-year floodplain regulation and is
deliberately **not** bound to `flood.fema_zones`, whose payload is FEMA's NFIP
designations from `msc.fema.gov` — a different authority and a different
document.

This combined publication carries Subtitles 27 and 24 and the Landscape Manual
only. Subtitle 25 Division 3 is not in it, which is the structural reason
§25-128 Table 1 cannot be retrieved here.

### Overlay zones (verified 2026-08-22)

An overlay rule has two halves from two documents. The ordinance **establishes**
the overlay — existence, purpose, applicability, general provisions — and that
is what the rule payloads contain. The adopted plan for a specific district sets
the dimensional standards inside it. Only the first half is hashable.

| secid | Section | Establishes |
|---|---|---|
| 644 | 27-4401 General | governs all 7 established overlays |
| 645 | 27-4402 Policy Area Overlay Zones | I-D-O, L-D-O, R-C-O, MIOZ-SAFETY, MIOZ-NOISE, MIOZ-HEIGHT |
| 646 | 27-4403 Other Overlay Zones | NCO |

A change to 27-4401 reopens all seven. That is correct coupling — general
provisions really do govern every overlay — not over-reaction.

Verify by **full ordinance name with word boundaries**. The codes in
`PG_OVERLAYS` (`T-D-O`, `MIOZ-NOISE`) are Kealee/GIS shorthand and appear
nowhere in the ordinance text, and searching `NCO` as a substring matches
NONCONFORMING on every page.

Three overlays are deliberately unmapped, in `PG_OVERLAYS_NOT_IN_ORDINANCE`:

- **T-D-O, D-D-O** — legacy designations from the pre-2022 ordinance, absent
  from 27-4401 through 27-4403 (verified by name). Governed by each district's
  adopted Transit or Development District Plan.
- **FLOOD-DPIE** — a DPIE floodplain designation, not a Subtitle 27 overlay.
  Its authority is the county floodplain regulation and the effective FIRM
  panel, neither of which is in this publication.

### FEMA — a separate publisher with a different change model

Flood mapping is not an ordinance and is not modelled as one. A county amends
text; FEMA issues a new FIRM panel with an effective date. `fema-nfhl.ts` detects
change the way the NFIP actually works — by the identity of the **effective
panel set**, from NFHL layer 3 (`FIRM_PAN`, `SUFFIX`, `EFF_DATE`).

```ts
import { buildPgFemaSources, Rules } from '@kealee/pascal-agents/engine'
const fema = buildPgFemaSources(rules)   // DFIRM 24033C for Prince George's
```

Four behaviours worth knowing, each with a test:

- **A published panel is not an effective one.** FEMA issues panels months
  ahead. `splitPanelsByEffectivity()` holds a future `EFF_DATE` as *pending*;
  the hash changes on the day it takes effect, not when it was published.
- **A truncated set is refused, not hashed.** ArcGIS returns
  `exceededTransferLimit` with HTTP 200. A hash over a partial panel set is
  stable and silently omits panels — the same failure class as hashing an
  empty region. It routes to `REGION_LOCATOR_FAILED` instead.
- **ArcGIS reports errors in the body**, not the status line. Checked explicitly.
- **Printed vs Not Printed is ignored.** A publication detail, not a change in
  what the map says.

What FEMA covers here: panel currency — whether a determination made against
this map is still current. What it does **not** cover, stated in the bundle's
`scope.notCovered`: the zone notation list (no coded-value domain on layer 28,
and 44 CFR 64.3 does not enumerate the letters — verified), and any individual
property determination, since a LOMA or LOMR revises a property without
touching the panel.

`FEMA_DETERMINATION_CAVEATS` carries the statements that must survive into any
output. A zone letter alone is never a flood determination.

### The 5 rules with no locator — all correct

`pgRulesWithoutLocator()` returns each with a specific reason:

- **T-D-O, D-D-O** — legacy pre-2022 overlays, verified absent from
  27-4401–27-4403. Governed by each district's adopted plan. **Retained as
  human-review** until their governing documents and locators are confirmed.
- **FLOOD-DPIE** — a DPIE floodplain designation, not a Subtitle 27 overlay.
  Same treatment.
- **`landscape.tree_canopy`** — §25-128 publishes no usable canopy standard.
  Correctly unresolved; certification prohibited.
- **`process.review_model`** — advisory by construction. A SECONDARY_SOURCE,
  non-gating, and never usable as certification evidence. It has no
  authoritative publisher to hash and is not supposed to have one.

A rule with no locator can never be proven current. That is surfaced in the
maintenance queue rather than left for someone to discover.

## Step 7 — Run the maintenance cycle (Phase 5)

Certifications only pay off if they survive. A certification nobody re-checks is
not an asset after a year — it is a claim about a document that may have been
amended twice. `Rules.runMaintenanceCycle()` is the job that keeps them honest
and reopens review only where something moved.

It does not schedule itself. `JobQueue` and `JobSchedule` already exist in the
platform; Phase 5 supplies the payload and the handler, not another scheduler.

```ts
import { Rules, buildPgSourceBundles, buildPgFemaSources } from '@kealee/pascal-agents/engine'

const bundles = [...buildPgSourceBundles(rules), ...buildPgFemaSources(rules)]
const result = await Rules.runMaintenanceCycle({
  jurisdictionCode: 'prince_georges_md',
  rules,
  sources: bundles.map(b => ({ source: b.source, locators: b.locators })),
  coreRuleKeys: PG_CORE_RULE_KEYS,
  packVersion: '2022.1',
  effectiveDate: '2022-04-01',
  store,                    // omit for a dry run — computes everything, writes nothing
  queueFor: reviewer,
})
```

Enqueue with `Rules.ruleMaintenanceJob(jurisdiction, packVersion)`; the job id is
stable per jurisdiction and pack, so `JobQueue`'s `(queueName, jobId)` uniqueness
stops duplicate cycles piling up. `RULE_MAINTENANCE_SCHEDULE` suggests weekly
(`0 4 * * 1`): counties amend on a scale of months, and a daily fetch is load on
a public portal for no information gain.

### The order is fixed inside the cycle, deliberately

Refresh every source → apply scoped invalidation → sweep expired certifications
→ rebuild the pack → assess health → build the queue → persist in one
transaction. Wiring these by hand produced a real defect once (withdrawals
applied before the appends they targeted), so the order lives in one place.

### What it guarantees

- **Idempotent.** With nothing changed and nothing expired it downgrades
  nothing and writes the same state back.
- **An outage is never an amendment.** A publisher returning 503 keeps every
  certification and raises a maintenance item saying currency is unproven.
- **Scoped.** One changed source downgrades only that source's rules.
- **Isolated.** `refreshAll` contains a throw in one source so a single
  publisher cannot abandon the cycle halfway.
- **Expiry is real.** A certification granted with a review-by date returns to
  PROVISIONAL when it lapses — a considered limit, not a formality.

`assessPackHealth()` grades the pack (`healthy` / `attention` / `degraded` /
`unusable`) and returns ordered actions. Its automation rate counts **gating
rules only** — including advisory rules would flatter the number, since they
were never going to need review.

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
