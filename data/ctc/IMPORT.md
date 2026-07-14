# CTC full-catalog import — pipeline (ready)

Ingests the two Gordian CTC PDFs (base year **2023**) into Postgres and the
estimating engine. Built to run in one pass once the PDFs are in the repo.

## Inputs (push these into the repo)
| Catalog | Put at | Purpose |
|---|---|---|
| **Cost** (priced tasks) | `_docs/CTC-cost.pdf` (or any path you pass) | unit prices → estimating |
| **Technical** (specs/scope) | `_docs/CTC-technical.pdf` | task scope/inclusions |

## Run
```bash
# 0) calibrate the task regex against the real layout (prints sample lines)
python3 scripts/ctc/ctc_extract.py inspect "_docs/CTC-cost.pdf"

# 1) extract both PDFs -> data/ctc/*.json
python3 scripts/ctc/ctc_extract.py cost      "_docs/CTC-cost.pdf"
python3 scripts/ctc/ctc_extract.py technical "_docs/CTC-technical.pdf"

# 2) load into Postgres (schema + seed) with 2023 -> current escalation
node scripts/ctc/ctc-load-db.mjs > /tmp/ctc.sql
psql "$DATABASE_URL" -f /tmp/ctc.sql
```

## Schema (`data/ctc/schema.sql`)
| Table | Holds |
|---|---|
| `ctc_cost_database` | catalog registry: base year 2023, escalation factor/year, publisher, source PDFs |
| `ctc_cost_tasks` | priced tasks — 2023 unit price + L/M/E split + labor-hours **and** escalated current-year price; modifiers |
| `ctc_technical_specs` | technical scope/inclusions per CSI section |
| `ctc_assembly` | platform bridge: engine-ready `Assembly` rows (current-year), mirrors `seed-ctc.ts` mapping |
| `ctc_tasks_with_spec` (view) | priced task joined to its technical scope on CSI code |

## 2023 basis adjustment
CTC is a **June-2023** catalog. Prices are stored **as-published (2023)** and
**escalated to the current year**. Default factor **×1.13** for 2023→2026 DMV
(matches `services/ai-orchestrator/.../ctc-calculator.ts` and `seed-ctc.ts`).
Override:
```bash
CTC_ESCALATION=1.16 CTC_ESC_YEAR=2027 node scripts/ctc/ctc-load-db.mjs > /tmp/ctc.sql
```

## Notes on the parser
- Text extraction uses **PyMuPDF** (works in this environment; the repo's
  `scripts/parse-ctc-pdf.ts` needs `pdf-parse`/`@prisma/client` which aren't
  installed here).
- `TASK_RE` in `ctc_extract.py` targets the documented CTC line format
  (`CSI-CODE  UOM  DESC … UNIT [DEMO]`). If `inspect` shows 0 matches, the real
  layout differs slightly — paste 3–4 raw task lines and the regex is a
  one-line tune.
- L/M/E split uses per-division ratios (same as `parse-ctc-pdf.ts`) because the
  CTC unit price is bundled (labor+material+equipment) per the CTC guide.

## Verified
Schema + loader tested end-to-end against a 41-row stand-in: 4 tables created,
2023→2026 escalation applied, engine bridge + join view populated. Awaiting the
real PDFs to replace the stand-in with the full catalog.
