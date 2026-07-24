# Construction Task Catalog (CTC) — agent-accessible data

This directory is the repository source for CTC ingestion and agent queries.
The canonical runtime cost book is the native Prisma
`CtcCostDatabase`/`CtcCostTask` schema, identified by `CTC-2023`.

## ⚠️ Two different things are called "CTC" in this repo

| "CTC" | Meaning | Location |
|---|---|---|
| **Construction Task Catalog** | Gordian / Maryland DGS MasterFormat **priced tasks** (this folder) | `data/ctc/`, `packages/estimating/src/seed-ctc.ts` |
| **Complete Total Cost** | A $/SF feasibility calculator (hard+soft+risk+execution) — unrelated | `services/ai-orchestrator/src/costing/ctc-calculator.ts` |

When someone says "the CTC catalogue," they mean the first one.

## What's here

| File | What it is |
|---|---|
| `ctc-tasks.json` | **Rich canonical** task list: `taskNumber, csiDivision, csiCode, description, uom, unitCost, laborCost, materialCost, equipmentCost, laborHours, isModifier, modifierOf, category`. |
| `ctc-cost-tasks.json` | Restricted extracted full-catalog working data (115,064 parsed rows at the current extraction revision). Do not redistribute without documented publication rights. |
| `ctc-index.json` | Division → task count + CSI codes. |
| `ctc-ground-rules.txt` | Extracted text of the CTC usage guide (what unit prices include: labor to working-foreperson at prevailing wage, equipment, material w/ waste; working heights; demolition rules; assemblies precedence; or-equals). |
| `../ctc-june-2023-tasks.json` | Legacy flat shape consumed by `scripts/query_ctc_tasks.mjs`. |

Regenerate everything from source: `node scripts/ctc-build-data.mjs`

## How to query (no dependencies)

```bash
node scripts/ctc.mjs divisions              # coverage summary
node scripts/ctc.mjs search concrete slab   # keyword search
node scripts/ctc.mjs div 26                 # all Division 26 tasks
node scripts/ctc.mjs show 26-030            # full L/M/E for one task
```

## ⚠️ Provenance & coverage — READ BEFORE PRICING

- **Source:** `CTC_SAMPLE_TASKS` in `packages/estimating/src/seed-ctc.ts`
  (Kealee-authored representative tasks).
- **Pricing basis:** DMV region, 2026 (June-2023 base × 1.13 inflation).
- **Coverage:** `ctc-tasks.json` contains **41 tasks across 12 divisions** as a
  redistributable development sample. `ctc-cost-tasks.json` is a restricted
  working extraction containing **115,064 parsed rows** and is not a claim of
  115,064 unique or licensed-for-redistribution tasks.
- **Rights:** Kealee owns and maintains the platform schema, normalization,
  crosswalks, and derived allocations. Gordian is the copyright holder of the
  underlying CTC publication. Do not claim that Kealee owns the publication
  unless a signed assignment or license granting those rights is recorded.

**Do not** treat this 41-task sample as a complete cost basis for a whole
building — it will force heavy allowances. Use it for CSI cross-checks and
tooling until the licensed full catalog is loaded.

## Loading the full priced catalog (when licensed)

The ingest pipeline already exists:

1. Place the priced distribution PDF at
   `_docs/Construction Task Catalog® - Distribution.pdf` (the ~4,666-page
   priced list — **not** the 6-page "Using The…" guide, which is the methodology
   preamble only).
2. `node scripts/extract_ctc_text.mjs` → `data/ctc-june-2023-extracted.txt`
   (requires the `pdf-parse` dependency).
3. `node scripts/index_ctc_tasks.mjs` → `data/ctc-june-2023-tasks.json`.
4. Seed to DB: `npx tsx packages/estimating/src/seed-ctc.ts` (creates
   the canonical `CTC-2023` registry plus compatibility `Assembly` rows). Or import via
   `POST /estimation/pdf/upload-ctc` (`services/api/.../cost-code-pdf-import.routes.ts`).
5. Re-run `node scripts/ctc-build-data.mjs` to refresh `data/ctc/`.
