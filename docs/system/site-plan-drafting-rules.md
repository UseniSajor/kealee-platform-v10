# Site plan drafting rules — standing directions from the owner

These are the owner's directions, given while producing the Estates at Indian
Head concept set (2026-09-30 / 2026-10-01). They apply to **every** site plan
set the engine and `packages/cad-plot` produce, not only that project. Read
this before drawing, and treat a violation as a defect a county reviewer would
return the set for.

Reference sets that show the standard (read them before changing a sheet):

| Reference | What to learn from it |
|---|---|
| `existing site plans/Approved Technical Plans Storm Drain and Site Grading 15919-2020-0.pdf` (Yocum Property) | Sheet frame, vertical title strip, cover layout, L.O.D. style, plan & profile, drainage area maps, notes, certifications |
| `existing site plans/Approved Technical Plans Street Construction 15927-2020-0.pdf` (Yocum Property) | Street plan & profile, DPW&T standard details (Std. 100.07 pavement section), detail sheets |
| `existing site plans/Estates Subdivision/ESTATES AT INDIAN HEAD, PERMIT NO 9399-2009, STL (6).pdf` | Approved 2009 layout: street, cul-de-sac, houses, courts, walks, trees, lights |
| `docs/site-plan-reference/APPROVED-PLAN-ANALYSIS.md` | Drafting convention distilled from the approved plans |

## 1. Production

- **Draw and write the plans with the DXF CAD tools** (`CAD_PLOT=1`,
  `packages/cad-plot`). The DXF is the master; the PDF is its plot. No
  standalone render scripts (see also `work-inside-engine`).
- **The plans must be complete, exact and within accepted tolerance.** Do not
  explain on the sheets or to the owner why something cannot be finished; use
  the manuals, publications and reference plans to finish it.
- **Adhere to the DPIE checklists line by line** — the Design Review Checklist
  (rev. 08/25/2021) and the Submittal Checklist (May 2017), including
  submittal item 10 (sight distance analysis for a new road connection) and
  items 6–7 (drainage area map and computations).

## 2. Base geometry

- **Use the prior approved plan's geometry exactly, except the utility
  layout.** Street, cul-de-sac (not a circle — trace its edge of pavement),
  houses, garage turnaround courts, driveways and lead walks come from the
  approved plan; water and sewer are designed new.
- **No prior-plan references on the sheets.** The geometry stays; labels,
  notes, schedule titles and approvals rows that cite the old plan go.
- **Driveways and courts drawn to standard** (side-load court in front of the
  garage door, 12-ft drive, rural swale/culvert apron per DPW&T Std. 600.02).
- **Lead walks complete and visible**: from the front door out square to the
  wall, then to the drive and into it; drawn as concrete, heavier than the
  drive, labelled.

## 3. Utilities

- **Mains stop at the last service**: never run far past the last lot (here,
  no further than Lot 6's tap just past the Lot 1 east line). Cap with a
  blow-off (water) / terminal manhole (sewer), labelled.
- **Every lot's water and sewer house connection drawn, tapped at the main,
  reaching the house, and labelled** (`LOT n — 1" W.H.C. / 4" S.H.C.`).
- **No service under a driveway, apron, walk, stoop, culvert or ESD cell.**
  Verify geometrically (shapely), never by eye. Consolidate into a common
  trench only where necessary, noted for WSSC acceptance.
- **Storm drainage is visibly distinct from water and sewer**: storm (swales,
  culverts, overflow paths) cyan, ESD cells magenta, water blue, sewer green.
  Do not show water/sewer on the stormwater sheet; lines must not criss-cross.

## 4. Street

- **Street grading must carry construction detail**: stationing, tangent
  bearings and distances, curve table, existing ground and profile grade line
  with vertical curves (PVI/PVC/PVT stations and elevations, grades, K), edge of
  pavement elevations, typical section with the DPW&T pavement materials.
  `src/site-plan/street-profile.ts` produces it; sheet C-210 draws it.
- **Label every road** (e.g. INDIAN HEAD HIGHWAY — MD ROUTE 210) inside the view.

## 5. Sediment and erosion control

- **One L.O.D. around the full site, on every plan sheet**, drawn as the
  approved Yocum plans draw it: heavy black long-dash line with "LOD" lettered
  inline.
- **Tree-save setback: hold the L.O.D. 8–15 ft (engine: 10 ft) inside the rear
  property lines and the highway frontage** to keep the existing tree line for
  privacy; only the street R/W, entrance, highway lanes and WSSC easement may
  cross it (`LOD_TREE_SAVE_FT` in `src/sheets/sheetset.ts`).
- **Show silt fence and the stabilized construction entrance** (super silt fence
  on the down-gradient L.O.D.; MDE SCE).

## 6. Content on every sheet

- **Existing and proposed contours on all plan sheets.**
- **Existing structures on adjoining property shown and labelled EXISTING**
  (county 2023 building footprints, PGAtlas Administrative/MapServer/2).
- **Rear setback lines accurate**: rear yard is every lot line *opposite* the
  frontage, not only the single furthest chord (`classifyEdgesFromStreet`).
- **Micro-bioretention (M-6) detail on the applicable sheets** (SWM sheet and
  details), with ponding, mulch, media, stone, underdrain, observation well,
  overflow.
- **Drainage area map covers the whole contributing area** to the drainage
  divide and the outfall.
- **Cover sheet carries the subdivision as it is of record** (lots, R/W,
  easements; no buildings) at the bottom.

## 7. Text

- **Every label sits clearly on its property, or on a leader pointing at exactly
  what it describes.** No overprinting, no duplicated or redundant labels (one
  lot name per lot). `Model._place` in `packages/cad-plot/cad_plot/model.py`
  enforces this: labels are moved clear and given a leader.
- **No "survey to confirm" language** on finished plans (whether to survey is
  the engineer's call).

## Training record

These rules are also recorded as `kealee.drafting-rule/1` entries in
`docs/site-plan-reference/drafting-rules.json` for the knowledge registry
(Phase G retrieval). Add new owner directions to both files.
