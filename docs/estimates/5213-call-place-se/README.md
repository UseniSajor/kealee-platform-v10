# 5213 Call Place SE — Construction Estimate (package index)

New-construction detached group home (IBC **R-2**), Type IIIB, cellar + 3 stories,
**24'×64' footprint, 5,920 GSF**, 8 BR / 14 beds / 7 baths, 3,500# elevator,
commercial kitchen. Washington DC 20019. Branch `claude/5213-call-place-estimate-pbe2vz`
(PR #27). Drawings stamped NOT FOR PERMITTING — estimation only.

## Current numbers

**Primary estimate — measured takeoff, priced on the Kealee marketplace catalogue,
owner wage schedule, 6-month schedule + 8% acceleration:**

| Scenario | Total (excl. elevator + kitchen equip) | $/GSF |
|---|--:|--:|
| A — Catalogue Market | **$2,384,140** | $403 |
| B — Value-Engineered | $2,070,093 | $350 |
| C — Minimum Viable | $1,782,808 | $301 |

Excluded, scheduled separately: elevator **$142,000**, commercial-kitchen equipment
**$120,500**. Takeoff is **84.6% dimensioned** (rest = time-based GCs + undrawn
civil/security). Labor **8,545 hrs**.

**CTC estimate — STRICT (no placeholders):** currently `ctc-incomplete` — 35/109
lines priced from the 41-task sample; the rest is `PENDING-CTC` until the full
Gordian catalog is loaded (see `HANDOFF.md`). Not a final number.

## Parameters
- Markups: OH 12% · profit 15% · contingency 7% (5% B/C) · bonds/ins 1.5% · permit $22k (A/B), $14k (C). Material DC factor ×1.15.
- Wages: apprentice $55 · journeyman $85 · master $124/hr. General crew **$73/hr**; licensed MEP/fire **$124/hr master flat**. Labor = hours × rate.
- Schedule: **6 months** + **8%** acceleration on trade labor.

## Reports
| File | What |
|---|---|
| `ESTIMATE-REPORT.md` | Full narrative: exec summary, scenarios, CSI divisions, exclusions, owner summary, VE, risks |
| `REPOSITORY-FINDINGS.md` | The Kealee estimating engine/catalogue/schema inventory |
| `MISSING-CATALOGUE-ITEMS.md` | Marketplace catalogue gaps + the engine mapping defect + proposed `group_home_new` type |
| `drawings/MEASURED-TAKEOFF.md` | Measured quantities with sheet references |
| `HANDOFF.md` | Prompt + steps to load the full CTC and finish CTC pricing (WSL/Antigravity) |

## Scripts (`scripts/`)
| Script | Does | Run |
|---|---|---|
| `build-estimate.mjs` | Primary estimate (marketplace + measured takeoff + wages + schedule) | `node …/build-estimate.mjs` |
| `persist-db.mjs` | → Postgres `quick_estimates` (A/B/C) + `estimate_line_items` | pipe to `psql` |
| `gen-pdf.mjs` | HTML → PDF breakdown (headless Chromium) | `node …/gen-pdf.mjs` |
| `build-estimate-ctc.mjs` | STRICT CTC re-pricing of the same takeoff (no placeholders) | `node …/build-estimate-ctc.mjs` |
| `persist-ctc-db.mjs` | → Postgres CTC estimate + `ctc_estimate_line_items` | pipe to `psql` |
| `run-engine.mjs` | Executes the live engine; documents the mapping defect | `node …/run-engine.mjs` |

CTC ingestion scaffold: `scripts/ctc/` + `data/ctc/schema.sql` (see `data/ctc/IMPORT.md`).

## Regenerate everything
```bash
export DATABASE_URL=postgresql://…                     # a Postgres instance
node docs/estimates/5213-call-place-se/scripts/build-estimate.mjs
node docs/estimates/5213-call-place-se/scripts/persist-db.mjs > /tmp/e.sql && psql "$DATABASE_URL" -f /tmp/e.sql
node docs/estimates/5213-call-place-se/scripts/gen-pdf.mjs
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
"$CHROME" --headless --no-sandbox --print-to-pdf=output/5213-Call-Place-SE-Estimate.pdf output/estimate.html
```

## Outputs (`output/`)
`estimate.json` · `estimate.html` · `5213-Call-Place-SE-Estimate.pdf` · line-item /
division / takeoff / labor-hours / material / subcontractor CSVs ·
`missing-catalogue-items.json` · CTC: `estimate-ctc.json`,
`estimate-ctc-lineitems.csv`, `ctc-missing-matches.json`.

## Status
- ✅ Measured takeoff, primary estimate (3 scenarios), exports, PDF, DB persistence.
- ✅ Owner wage schedule, 6-month schedule, acceleration premium.
- ✅ CTC schema + importer + strict re-pricing + persistence — built & tested on the sample.
- ⏳ **Full CTC pricing** blocked on the two Gordian PDFs (local machine). Run the
  `HANDOFF.md` steps where the catalog is accessible to finish it with zero placeholders.
