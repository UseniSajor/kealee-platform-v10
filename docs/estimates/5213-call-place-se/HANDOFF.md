# Handoff — 5213 Call Place SE estimate + CTC ingestion

Copy the prompt below into Claude (WSL/Antigravity) to continue this work.
Everything referenced is committed on branch `claude/5213-call-place-estimate-pbe2vz`
(PR #27) in `UseniSajor/kealee-platform-v10`.

---

## PROMPT (paste this)

You are continuing a construction-estimating task in the **kealee-platform-v10**
repo. Work on branch `claude/5213-call-place-estimate-pbe2vz` (PR #27). Pull latest
first: `git fetch origin && git checkout claude/5213-call-place-estimate-pbe2vz && git pull`.

### What exists now
A full measured estimate for **5213 Call Place SE, Washington DC** — a new
detached group home (IBC R-2), Type IIIB, cellar + 3 stories, 24'×64' footprint,
5,920 GSF, 8 BR / 14 beds / 7 baths, 3,500# elevator, commercial kitchen. Built
from the 28-sheet permit set. All work lives in
`docs/estimates/5213-call-place-se/`:
- `scripts/build-estimate.mjs` — main estimate, priced on the Kealee MARKETPLACE
  catalogue (`packages/estimating/src/seed-assemblies.ts`) + labeled allowances.
- `scripts/persist-db.mjs` — writes `quick_estimates` (3 scenarios) +
  `estimate_line_items` (109 lines) to Postgres.
- `scripts/gen-pdf.mjs` — renders the HTML→PDF breakdown (headless Chromium).
- `scripts/build-estimate-ctc.mjs` — CTC cross-check (currently the 41-task
  sample; STALE — pre-measured-takeoff; must be re-run after full CTC import).
- `scripts/run-engine.mjs` — demonstrates the live engine + a real defect (the
  new-construction project-type mappings reference catalogue codes that don't
  exist → $0).
- `drawings/MEASURED-TAKEOFF.md` — the measured quantities w/ sheet refs.

### Current parameters (keep these)
- Markups: overhead 12%, profit 15%, contingency 7% (5% for B/C), bonds/ins 1.5%,
  permit $22k (A/B) / $14k (C). Material uses DC region factor 1.15.
- **Labor wage schedule**: apprentice $55, journeyman $85, master $124/hr. Labor =
  labor-hours × crew rate. General trades = $73/hr (60% jrny + 40% appr). Licensed
  MEP/fire (Div 21/22/23/26/27-28) = **$124/hr master flat**. Div 01 GC salaried;
  subcontractor lump sums keep quoted value.
- **Schedule**: 6 months (`SCHEDULE_MONTHS=6`) — scales time-based Div 01. Plus an
  **8% acceleration premium** on self-perform trade labor (`ACCEL=0.08`).
- Current totals: A $2,384,140 ($403/SF), B $2,070,093 ($350/SF), C $1,782,808
  ($301/SF). Excluded (separate): elevator $142,000, commercial kitchen equipment
  $120,500. Takeoff is 84.6% dimensioned.

### THE TASK: ingest the full CTC and re-price on it
The two Gordian CTC PDFs (base year **2023**) are on the local disk at
`apps/m-estimation/` (in WSL: `/mnt/c/Users/Tim Chamberlain/Documents/kealee-platform-v10/apps/m-estimation/`).
There are two: a **Cost** catalog (priced tasks) and a **Technical** catalog
(scope/specs). They are NOT yet committed. A ready import scaffold exists:
- `data/ctc/schema.sql` — tables `ctc_cost_database`, `ctc_cost_tasks`,
  `ctc_technical_specs`, `ctc_assembly` (engine bridge), view `ctc_tasks_with_spec`.
- `scripts/ctc/ctc_extract.py` — PyMuPDF extractor (modes: `inspect`, `cost`,
  `technical`). L/M/E split by division ratios.
- `scripts/ctc/ctc-load-db.mjs` — schema + seed SQL; applies 2023→current
  escalation (default ×1.13 → 2026; override `CTC_ESCALATION`/`CTC_ESC_YEAR`).
- `data/ctc/IMPORT.md` — full steps.

Do this:
1. Locate the two PDFs in `apps/m-estimation/`. Identify which is cost vs technical
   (cost has unit prices; technical is scope text). Also commit them to the repo
   (`_docs/CTC-cost.pdf`, `_docs/CTC-technical.pdf`) so they persist.
2. Calibrate: `python3 scripts/ctc/ctc_extract.py inspect "<cost.pdf>"`. If it
   matches ~0 task lines, read a few real pages and retune `TASK_RE` in
   `ctc_extract.py` (CTC line format is `CSI-CODE  UOM  DESC … UNIT [DEMO]`).
   (Install PyMuPDF if needed: `pip install --break-system-packages pymupdf`.)
3. Extract both → `data/ctc/ctc-cost-tasks.json` + `data/ctc/ctc-technical.json`.
4. Load: `node scripts/ctc/ctc-load-db.mjs > /tmp/ctc.sql && psql "$DATABASE_URL" -f /tmp/ctc.sql`.
   (Set `DATABASE_URL` to your Postgres; the estimating engine table is `quick_estimates`.)
   Also refresh `data/ctc/ctc-tasks.json` via `node scripts/ctc-build-data.mjs` if you
   want the `scripts/ctc.mjs` query CLI to see the full catalog.
   Note: the repo also has a native parser `scripts/parse-ctc-pdf.ts` (+ Prisma
   seed `packages/estimating/src/seed-ctc.ts`) — if node_modules + a Prisma DB are
   available, that path seeds the real `Assembly`/`CostDatabase` tables directly.
5. Re-price is ALREADY WIRED: `scripts/build-estimate-ctc.mjs` reuses the measured
   takeoff + wage schedule + 6-month + 8% acceleration from output/estimate.json and
   re-prices each line against the CTC (material/equip from the matched task, labor =
   task hours × your crew wage). Just run `node scripts/build-estimate-ctc.mjs` after
   loading the catalog. It auto-detects the full `data/ctc/ctc-cost-tasks.json` (falls
   back to the 41-task sample). If coverage is low, extend the `CROSSWALK` map in that
   file (catalogueCode -> {csi, kw}). Keep elevator + kitchen excluded (already handled).
6. Persist and export: write the CTC-priced estimate to Postgres, regenerate the
   PDF, validate (division sums, markups, no NaN, excluded equipment not in base),
   commit, and push to the branch (PR #27).

### Conventions / gotchas
- "CTC" is overloaded: **Construction Task Catalog** (the priced Gordian catalog,
  this task) vs **Complete Total Cost** (`services/ai-orchestrator/src/costing/
  ctc-calculator.ts`, an unrelated $/SF calculator). Don't conflate.
- CTC unit prices bundle labor+material+equipment; the guide
  (`_docs/Using The Construction Task Catalog® - Distribution.pdf`) documents this.
- Don't fabricate prices. If a takeoff line has no CTC task, keep it a labeled
  allowance and list it in a missing-item report.
- Drawings are stamped NOT FOR PERMITTING — estimation only.
- Postgres in a fresh env may need starting; PyMuPDF/psql may need install.
