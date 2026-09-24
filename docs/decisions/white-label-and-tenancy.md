# White-label tenancy, and the homeowner / professional separation

**Date:** 2026-09-24 · **Status:** APPROVED in principle, phased
**Decided by:** Tim Chamberlain
**Related:** `docs/decisions/toolchain-self-sufficiency.md`

---

## 1. The rule that governs everything else

**Kealee runs TWO businesses on ONE codebase. They are never combined, never
cross-sold from the same catalogue, and never share data.**

| | Homeowner Services | Professional OS (white-label) |
|---|---|---|
| Who pays | A property owner | A builder, developer, GC, PM, agency |
| What they buy | A DELIVERABLE — a site plan, a concept, a permit package | A LICENCE to software their own staff operate |
| Kealee's role | Service provider. We produce the work. | Software vendor. They produce the work. |
| Who is professionally responsible | Kealee arranges the licensed review | THEIR licensed professionals |
| Price shape | Per deliverable, $395–$1,995 | Setup + monthly licence + metered usage |
| Branding | kealee.com, Kealee-branded by definition | Their brand, optionally "powered by Kealee" |
| Surfaces | `web-main`, `portal-owner` | A separate tenant shell |

### Why this is an ARCHITECTURAL boundary and not a marketing one

1. **The liability models are opposites.** In the homeowner business Kealee
   delivers a professional work product and carries the duty to get it
   reviewed. In white-label, the client's own PE or architect is responsible
   and Kealee supplies software. Blend the two and Kealee inherits
   professional liability for a builder's decisions on a drawing Kealee never
   saw. No contract clause repairs that after the fact; the product boundary
   has to hold it.
2. **Data must not flow either way.** The Phase G corpus is designed to feed
   one project's redlines into the next project's prompts. Across the
   homeowner/professional line that is a homeowner's property and a
   professional's judgement leaking into a competitor's workspace. Retrieval is
   tenant-partitioned, and the homeowner corpus is never a retrieval source for
   a white-label tenant or the reverse.
3. **Channel conflict is otherwise inevitable.** A white-label builder holding
   a module licence must not be able to resell Kealee's own $395 homeowner
   product at their margin, and a homeowner must never see licence pricing.
   Homeowner SKUs are therefore NOT licensable modules. They are not in the
   module catalogue at all.

### The three prohibitions

- **Do not expose homeowner SKUs as white-label modules.** `PRODUCT_PRICING`
  entries for `preliminary_site_plan`, concept packages and the permit products
  are the homeowner catalogue. The module catalogue is a separate list.
- **Do not let a white-label tenant read the homeowner corpus**, or the
  reverse. Enforced by tenant partition, not by query discipline.
- **Do not present one bill.** A client who buys both is two relationships.

---

## 2. What is actually true today (measured 2026-09-24)

| | State |
|---|---|
| Models carrying an org/tenant id | **66 of 510 — 12%** |
| Row-level security | 3 migrations only (audit log, a storage bucket, review workspace). Not platform-wide. |
| Module licensing | `packages/auth/src/entitlements.ts` gates END-CUSTOMER product access by intake path. That is not tenant module licensing. |
| Usage metering | `ApiUsage`, `ApiKeyUsage`. **No AI token, agent-run, document, storage or job-time metering.** |
| Jurisdictions | `DC`, `MD`, `VA` referenced; ONE certified rule pack, `pg-2022.1`. No Texas support of any kind. |

Holes in the delivery path specifically:

```
SitePlanWorkflow           org-scoped: YES
SitePlanSheet              NO
SitePlanStageExecution     NO
SitePlanReviewAssignment   NO
Document                   NO      ← the delivered PDF and CAD
RagDocument / RagChunk     NO      ← the retrieval corpus
```

The last line is the urgent one and it is self-inflicted: the corpus added in
Phase G on 2026-09-23 has no tenant column, and its entire purpose is to carry
findings from one job to the next. **It must be scoped before a second tenant
exists**, which is sooner than before Phase G is switched on.

---

## 3. Phases, each with the gate that ends it

### Phase T0 — Managed branded implementation. SELLABLE NOW.
One client, one deployment, one tenant per database. No isolation work needed
because there is nothing to isolate from. Branding by configuration, not a code
fork. **Cap at three clients** — past that the per-deployment maintenance is
the burden this whole document exists to avoid.
**Gate:** a second client onboarded without editing application code.

### Phase T1 — Tenant identity
`Tenant` model with a `kind` of `KEALEE_DIRECT` or `WHITE_LABEL`. The homeowner
business becomes tenant zero rather than an implicit default, because an
implicit default is what leaks. Tenant id added to the delivery path first:
sheets, stages, review assignments, documents, and the RAG tables.
**Gate:** every row created by a paid order carries a tenant id, asserted by a
test that walks the whole chain.

### Phase T2 — Isolation at the database
Postgres RLS policies, not ORM `where` clauses. One forgotten clause is a
cross-tenant leak; a policy fails closed.
**Gate:** a cross-tenant test suite seeds two tenants and asserts EVERY read
path returns nothing for the other. Reviewers do not certify this — the suite
does.

### Phase T3 — Isolation outside the database
Tenant-scoped storage paths, queue jobs (BullMQ jobs carry no tenant today),
secrets, and audit logs. Retrieval partitioned, with the homeowner/professional
prohibition enforced here.
**Gate:** a job enqueued by tenant A cannot read tenant B's storage, proven by
test.

### Phase T4 — Metering, before pricing
Tokens, agent runs, documents, reports, storage, notifications, job time,
third-party data — per tenant. The unit-economics model in
`packages/core-rules/src/unit-economics.ts` currently has every human cost as
`null` with a MEASURE instruction. Selling a $5–12k/month tier against
unmeasured support cost is guessing.
**Gate:** a month of real usage data exists for tenant zero before any
white-label tier is quoted.

### Phase T5 — Module entitlements at the TENANT level
Distinct from the per-user product entitlements that already exist. The module
catalogue explicitly excludes homeowner SKUs.
**Gate:** a tenant with Acquisition but not Site Plans cannot reach a
site-plan route by URL.

### Phase T6 — Platform admin console, then Model 2, then Model 3.

---

## 4. The Dallas opportunity — scope it honestly

Every property fact this platform produces comes from PGAtlas, Prince George's
County's own ArcGIS: locator, parcel fabric, zoning, 2-ft contours, municipal
boundary. There is one certified rule pack. **Dallas has none of that.** It has
DCAD, city zoning, a different comps source and different teardown signals.

So Dallas is **not a configuration of this platform**. What transfers is the
architecture — the stage graph, the provenance rules, "never fabricate", the
review model. What does not transfer is every data connector and the rule pack,
which is the bulk of the work.

Price Phase 1 as **building the Dallas data layer**, not configuring an
existing one. The figure may land in the same range; the description must not.
A client who later works out they paid a configuration price for a ground-up
jurisdiction integration is a client lost, and rightly.

Add to the "do not offer" list: **a market Kealee has not integrated.**

---

## 5. Working alongside other agents

This repository is edited concurrently by several agents. In one session on
2026-09-23 that produced four separate build breaks: a staged file swept into
another agent's commit, a deletion that left its export behind, a usage that
left its import behind, and a union that did not track its icon map. Every one
reached `main` and broke production deploys.

**Ownership, to keep two agents out of one file:**

| Area | Owner |
|---|---|
| `packages/database/schema-src/**`, migrations | one agent at a time, announced in the commit |
| `packages/spatial-engine/**`, `concept-engine/**`, `knowledge/**` | engine work |
| `apps/web-main/**`, `apps/portal-*/**` | app and UI work |
| `packages/core-rules/src/index.ts` and other barrels | **never `git add` by path** — see below |

**Rules that would have prevented all four breaks:**

1. **Never `git add <shared file>` blind.** Barrels and index files accumulate
   other agents' pending edits. Run `git diff --cached` before every commit and
   read it.
2. **A deletion takes its exports with it.** If you delete a module, grep for
   its symbols before committing.
3. **Commit small, push immediately.** An unpushed commit is a collision
   waiting to happen; a staged-but-uncommitted file is worse, because another
   agent will commit around it.
4. **`tsc --noEmit` before push, and CHECK THE EXIT STATUS.** A heap-exhausted
   tsc exits 134 and prints zero errors, which behind a `grep` reads exactly
   like a pass. `web-main` needs `--max-old-space-size=8192`.
