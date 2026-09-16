# Digitising the 2023 "Wheeler Rd Subdivision Layout" sheet

Python (PyMuPDF, numpy, scipy, shapely, Pillow — `pip install --user pymupdf numpy scipy shapely pillow`).
Run from the repo root with a scratch directory `S`:

1. `python3 wheeler2023_lots.py S 60` — renders the PDF with only the Property / Lots / Street / Parkland
   optional-content layers on (PyMuPDF `set_layer_ui_config`), closes the dash-dot gaps with a 60-px
   distance-transform closing at 2 px/pt, labels the connected components and takes the one under each
   `LOT n` / `PARKLAND` text. Writes `S/wheeler2023-lots-raster.json` (sheet coordinates, points).
2. `python3 wheeler2023_georef.py S 0.85` — similarity transform from the sheet to EPSG:2248: the three
   sharpest hull corners matched to the county parcel's, then ICP on every lot vertex within 15 ft of the
   parcel boundary. Scale comes out 1" = 30.4' (the sheet is 1" = 30'), rms 5 ft. Writes
   `S/wheeler2023-georef.json` with each lot's ring and area against the area the sheet states.
   (It expects `output/site-plans/wheeler-4600/wheeler-4600.plat.json` for the parcel.)
3. `python3 wheeler2023_plan.py S` — the street corridor = the gaps between lots wider than 16 ft; the
   alley = its narrow part; edits: alley widened to the loop's measured section (42 ft), the west opening
   replaced by a 50-ft-radius turnaround, the alley's Wheeler end replaced by a turnaround (one entrance);
   every lot re-cut as the nearest-lot Voronoi of the ground the street does not take. Writes
   `S/wheeler2023-plan.json`; the plat files for `generate-subdivision.ts` were written from it (see
   `output/site-plans/wheeler-4600-v6/`).

The vector content of the PDF is not usable for this: the lot lines are exploded dash-dot fragments and
many are missing from `get_drawings()`; polygonizing them never closed a lot. The raster route is what worked.
