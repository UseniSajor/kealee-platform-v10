# Continue: Estates at Indian Head site development concept set

Paste everything below the line into a new Claude Code session started in
`C:\Users\Tim Chamberlain\Documents\kealee-platform-v10`.

---

Continue the Estates at Indian Head (Lots 1–6, PM 228 @ 83, Accokeek, Zone RR)
DPIE Site Development Concept plan set and finish it.

## Read first

1. `docs/system/site-plan-drafting-rules.md` (worktree copy): the owner's standing drafting rules. All are binding.
2. Memory `estates-indian-head`, and `output/site-plans/estates-indian-head/README.md`.
3. The reference plans in `existing site plans/`:
   - **Yocum Property** approved technical plans (`Approved Technical Plans Storm Drain and Site Grading 15919-2020-0.pdf`, `...Street Construction 15927-2020-0.pdf`) are the most complete and up-to-date reference for drawing style and placement.
   - The 2009 Estates sheet supplies project geometry only.

## Where things are

- **Branch / worktree:** `worktree-estates-indian-head-cad-plot` at `.claude/worktrees/estates-indian-head-cad-plot`. Latest code: `9752baf4` or later (pushed, not merged to main). Enter it with EnterWorktree (path).
- **Another session may be committing on top.** Session `kealee-platform-v10-f3` is adding PGAtlas L13 county slopes (owner: "use county slopes"). Run `ListAgents`, SendMessage it, and wait for its commit hash before editing or regenerating.
- **Pipeline (from the worktree root):**
  1. Inputs:
     - `python3 packages/spatial-engine/scripts/digitise/estates_indian_head_inputs.py output/site-plans/estates-indian-head/source/pgatlas-parcels.json output/site-plans/estates-indian-head`
     - `python3 .../estates_indian_head_2009_layout.py output/site-plans/estates-indian-head`
     - `python3 .../estates_indian_head_2009_features.py output/site-plans/estates-indian-head`
  2. Full engine run (~15 min), from `packages/spatial-engine`: `TWIN_JSON=<o>/estates-indian-head.twin.json SHEETSET_JSON=<o>/estates-indian-head.sheetset.json CAD_PLOT=1 ../../node_modules/.bin/tsx scripts/generate-subdivision.ts <o>/estates-indian-head.plat.json <o>/estates-indian-head-lot{1..6}.plat.json <o>/estates-indian-head-permit-set.pdf`. Use the tsx binary, not `pnpm tsx`.
  3. Fast loop: `../../node_modules/.bin/tsx scripts/rebuild-sheetset.ts <twin> <plat-record> <sheetset> <sheetset>`, then `packages/cad-plot/.venv/bin/python -m cad_plot <sheetset> <dxf> <pdf>` (~3 min).
  4. Finish:
     - `python3 .../estates_indian_head_eplan.py <pdf> <sheetset> <o>/eplan-drawings`: per-sheet PDFs, and validates that the dwellings sit inside the L.O.D.
     - `python3 .../estates_indian_head_application.py "existing site plans/Site Development Concept App/1.1.2 Site Development  Concept Plan Application.pdf" <sheetset> <o>/estates-indian-head-DPIE-concept-application.pdf`

## Owner rules that bite

- **Plans:** copy finished plan files to the MAIN checkout's `output/site-plans/estates-indian-head/`. Commit and push CODE only, never generated plan files, and never to main.
- **Drawing:** draw in the DXF CAD tools (`packages/cad-plot`). The plans must be complete and exact; never explain on the sheets why something can't be finished.
- **No prior-plan references:** no "2009 plan" / 9399 citations on the sheets. No survey / field-verify / confirm language.
- **L.O.D.:**
  - bold black dashed, "LOD" lettered in breaks in the line, on every plan sheet
  - straight and parallel to the property lines, 10 ft inside the rear lines and the outer sides of Lots 1 and 6; no swerves
  - dashes are drawn as geometry because the PDF plotter ignores linetypes inside viewports
- **Utilities:**
  - mains stop at Lot 6's tap
  - every lot's water and sewer connection is drawn and labelled, and none runs under paving
  - storm is cyan and ESD magenta, apart from water (blue) and sewer (green)
- **Labels:** every label sits on its property or on a leader. No overprint, no duplicates.

## Remaining work

0. **Two uncommitted edits, owner unknown (another agent):**
   - `generate-subdivision.ts`: a street-tree dedupe that drops the engine's generic street trees when the recorded street-tree plan is present.
   - `estates_indian_head_eplan.py`: extended ePlan validation.

   Both look correct. Review them, commit them, then run a FULL regeneration: the current set still shows 8 generic street trees alongside the 16 recorded ones. Latest committed code is `0893af55` (county L13 slopes on C-100, B-5 = C), on top of `9752baf4`.
1. **Driveways, turnarounds and lead walks:** trace each lot's garage turnaround, driveway and walk off the 2009 sheet as a best-effort trace. The raster is `output/site-plans/estates-indian-head/source/stl-2009-sheet1-200dpi.png`, georeferenced by `stl-2009-georef.json`; transforms W(u,v) / Pix(X,Y) are in `estates_indian_head_2009_layout.py`. Replace the generated pattern there and overlay-check every lot against the scan. Re-verify with shapely that no service crosses paving.
2. **Line-by-line checklist audit:** check every row of the DPIE Design Review Checklist (08/25/2021) and the Submittal Checklist (05/2017) against the rendered sheets. Each "C" must be visibly true on the sheet it cites. Known gaps:
   - C-7 claims the existing well on Parcel 199 is shown, but no well is drawn.
   - C-4 cites a stockpile that isn't drawn.
   - C-5 cites private SWM easements over the ESD practices that aren't drawn.
   - A-3 text still says "5-inch full-height strip"; the frame uses the ePlan 5×3 block.
   - Keep the six "O" items (A-14 Henrietta main inverts, D-10 downstream capacity, E-1/E-2 geotech, E-3 affidavit, E-4 updated NRI) as O with clear text.
3. **Label clutter:** congested labels remain at the Jennifer Drive entrance (the construction entrance note over the apron) and on C-001. Fix them per the label rule.
4. **Finish:** regenerate, render every sheet and check each by eye, and scan the PDF text for banned wording. Run the ePlan validation and the application fill, copy the set to the main folder, commit the code, push the branch, and report.
