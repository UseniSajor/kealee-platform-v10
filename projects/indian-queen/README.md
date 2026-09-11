# Indian Queen East — Lots 53, 54, 55 and 56

9588, 9584, 9580 and 9576 Fort Foote Road, Fort Washington, Prince George's
County, Maryland. Zone RSF-95. Plat Book WWW 65, folio 60.

Four single-family lots at the bottom of a 397-acre watershed, immediately
upstream of the Fort Foote Road crossing of **North Branch Broad Creek**. The
road embankment ponds the creek across the rear of all four lots. That one fact
governs the whole project.

## Layout

| Folder | What is in it | In git? |
|---|---|---|
| `source/` | Staff-uploaded record documents — recorded plat, 1979 DPW&T floodplain letter (FPS-770017), field topographic survey scans, easement map | no, too large |
| `input/` | The engine's inputs: per-lot plat metes and bounds, the subdivision plat record, the storm trunk definition, the FPS limit line | yes |
| `model/` | Floodplain model input, results and per-lot inundation | yes |
| `reports/` | The studies, the submission readiness note, the run manifest | yes |
| `drawings/` | Current issued drawings, the digital twin, and the GIS delineation | yes |
| `drawings/archive/` | Superseded timestamped generations | no |
| `dossier/` | The supporting dossier build | build script only |

## The state of the work

**Nothing here is sealed.** It is analysis a Maryland Professional Engineer can
adopt, correct or reject.

- `reports/indian-queen-floodplain-study.md` — the current floodplain and
  hydraulic study. Read section 1 first.
- `drawings/indian-queen-FP-101-floodplain-study.pdf` — the study sheet.
- `reports/indian-queen-conceptual-drainage-floodplain-study.md` — the earlier
  concept study. **Superseded on the hydrology.** It carries a 39.1-acre
  drainage area; the correct figure is 397 acres and every discharge and pipe
  size that follows from 39.1 is wrong. Kept as a record of the reasoning, not
  as a current document.

## Regenerating

From the repository root:

```bash
npx tsx packages/spatial-engine/scripts/floodplain-study.ts    # model
npx tsx packages/spatial-engine/scripts/floodplain-report.ts   # report
npx tsx packages/spatial-engine/scripts/floodplain-sheet.ts    # sheet FP-101
```

Each reads and writes inside this folder. The report and the sheet are
generated from the model results, so the prose, the tables and the drawn limits
cannot drift apart.

## Open items

1. **FPS 200546 (2005) is the controlling floodplain study of record and is not
   in this folder.** Obtain from DPIE before anything is filed.
2. The existing Fort Foote Road culvert has never been measured.
3. The field topographic survey is on an unidentified local grid and could not
   be georeferenced from the scan. Levelling to its benchmarks H31A, H32A and
   H32B closes both that and the datum question.
