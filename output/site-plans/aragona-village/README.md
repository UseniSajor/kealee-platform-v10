# Aragona Village, Blocks EE and DD — approved SFD subdivision converted to attached housing

Generated 2026-09-17 by `packages/spatial-engine/scripts/propose-townhomes.ts --as-zone RMF-20 --access GUNPOWDER --front-existing --keepout aragona-constraints.keepout.json`. **HYPOTHETICAL: the 16 lots are zoned RE (single-family detached only). A zoning map amendment to a zone that lists townhouse, two-family and multifamily dwellings (RMF-20 is used here) is required before any of this is permitted.**

16 approved lots (Brandywine Builders LLC, plats 05230085/05230086, L.26757 F.002), 14.309 ac.

**Constraints are the approved plan's, not the county layers'** — digitised from `existing site plans/Argona Hills Residential Site.pdf` by `scripts/digitise/aragona_constraints.py` (sheet layers → EPSG:2248, fit to the PGAtlas lot polygons, ~10 ft rms). Taken out: Primary Management Area 3.31 ac (the rear-lot strips along the north and south streams and the block DD corridor), wetlands 0.70 ac and their 25-ft CsE buffer 1.37 ac (the west corner at the cul-de-sac), slopes ≥ 25% 0.16 ac. Shown and built with grading: slopes 15–25% 1.77 ac (most of block DD). The forest conservation easement lines of the approved TCP2 are drawn dashed green. Developable 7.90 ac.

**The approved street is kept**: the loop with its cul-de-sac and the stub between the blocks (1.84 ac of public right-of-way) stay as built; the rows front on it, so no lot needs a new street except in block DD, where two short private streets tee off the stub.

**85 dwelling units** (was 98 before the approved plan's PMA and wetlands were applied): 37 townhouses (20.2 du/ac on their ground — one over the RMF-20 cap of 20, trim to 36), 26 two-over-twos (13 bays), 22 duplexes. Parking 151 drawn (144 in garages/driveways, 7 surface) against 157 at the assumed ratios. ESD volume 12,506 cf → 15,633 sf of micro-bioretention, to be placed in the street verges and at the low ends of the rows (nothing is reserved for it in this layout — the PMA cannot take it).

Files: `aragona-village-yield-study.pdf` (sheet), `aragona-village-building-elevations.pdf`, `aragona-village.yield.json`, `aragona-constraints.keepout.json` (the digitised constraints, reusable).
