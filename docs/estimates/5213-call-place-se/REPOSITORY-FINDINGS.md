# Repository Findings — Kealee Estimation Architecture

Inspection performed before estimating 5213 Call Place SE.

## Active estimation engine
- **`packages/estimating/`** — the "pricing brain." `EstimatingService`
  (`estimating.service.ts`) is the live engine: `calculateSuggestedPrice()`,
  `createEstimate()`, `validateBidPrice()`, `getAssemblyLibrary()`.
  Markups (constants): **Overhead 12%, Profit 15%, Contingency 7%**,
  max bid overage 3%. Uses `decimal.js` for precision.
- **`packages/automation/apps/estimation-tool/`** — heavier APP-06 tool:
  `estimates/` (calculator, builder, sections, line-items, revisions,
  export-generator), `takeoff/` (plan-analyzer, quantity-extractor,
  measurement-tools), `ai/` (ai-takeoff, value-engineer, cost-predictor),
  `cost-database/` (labor/material/equipment rates, regional-adjustment),
  `api/routes.ts`, `worker.ts`. Export formats supported: **CSV, JSON, XLSX/Excel, PDF**.
- **`packages/core-tools/src/tools/estimate/create-estimate.tool.ts`** — agent
  tool; currently a **stub** (`// TODO: integrate estimating engine`) with
  flat $/SF ranges (`new_construction 220–420`).

## Active construction catalogue
- **`packages/estimating/src/seed-assemblies.ts`** → `MARKETPLACE_ASSEMBLIES`,
  **616 assemblies**, DC-Baltimore corridor 2024-25, tiered low/mid/high
  material & labor, `laborHoursPerUnit`, shared `regionMultiplier`
  (**DC 1.15**, Baltimore 1.0, NoVA 1.2, Bethesda 1.18…). Residential-remodel +
  missing-middle oriented. **This is the catalogue the live engine reads.**
- **`packages/estimating/src/seed-ctc.ts`** → `CTC_SAMPLE_TASKS`, a CSI-organized
  Construction Task Catalog (DMV 2026, incl. equipment cost + CSI codes) — but
  only a **~40-task sample** ("Full catalog comes from structured import").
- **`packages/estimating/src/project-type-mappings.ts`** → `PROJECT_TYPE_ASSEMBLIES`,
  24 project types → assembly-code lists. **Defective for new construction**
  (see `MISSING-CATALOGUE-ITEMS.md`).
- Crosswalk: `ctc-crosswalk.ts` (CTC ↔ marketplace). Scope AI: `scope-analyzer.ts`.

## Database models (`packages/database/prisma/schema.prisma`, 414 models)
- Catalogue: `CostDatabase`, `Assembly`, `AssemblyItem`, `MaterialCost`, `CostCode`,
  `RegionalCostIndex`, `CostBookCustomization`.
- Estimates: `Estimate`, `EstimateSection`, `EstimateLineItem`, `EstimateHistory`,
  `EstimateComparison`, **`QuickEstimate`** (`quick_estimates` — what the engine
  writes), `HistoricalProjectCost`.
- Takeoff: `Takeoff`, `TakeoffMeasurement`, `TakeoffJob`.
- Enums: `EstimateType/Status`, `LineItemType`, `TakeoffSource`, `AssemblyCategory`,
  `CostDatabaseType/Tier`. Org model is **`Org`** (not `Organization`).

## Required env / services (to run the full live path)
- `DATABASE_URL` (Postgres) + generated Prisma client (`packages/database`).
- Optional Redis/BullMQ for `estimation-tool` worker & `TakeoffJob`.
- `REPLICATE_API_TOKEN` etc. only for AI content, not estimating.

## Regional factors / waste / productivity / markups / audit
- **Regional:** `regionMultiplier` per assembly (DC 1.15) + `RegionalCostIndex`.
- **Waste/productivity:** not first-class catalogue fields — applied by the
  estimator (this run: 5–10% waste on material, productivity 1.0 baseline).
- **Markups:** engine constants above.
- **Versioning/audit:** `EstimateHistory`, `revision-manager.ts`, `EstimateAction` enum.

## PDF / plan-takeoff pipeline
- `estimation-tool/src/takeoff/` (plan-analyzer, quantity-extractor) +
  `ai/ai-takeoff.ts` exist, but require an ingested plan file and DB. **The permit
  PDF was not present in this environment**, so this pipeline could not be exercised.

## Blockers encountered
1. **Permit PDF absent** (`/mnt/data/...` missing) → no measured takeoff.
2. **No group-home project type**; new-construction mappings resolve to ~$0 (defect).
3. **No `DATABASE_URL`/Prisma client** → cannot persist a `QuickEstimate` record.
4. Catalogue lacks institutional assemblies → 66 labeled allowances required.
