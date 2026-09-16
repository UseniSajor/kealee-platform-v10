# Aragona Village / Livingston of Fort Washington — attached housing yield study

Generated 2026-09-16 by `packages/spatial-engine/scripts/propose-townhomes.ts`. Preliminary; not a site plan, not a survey.

## What the county says the zoning is (PGAtlas Zoning/MapServer/63, queried 2026-09-16)

| Land | Owner of record (PGAtlas Address/Property) | Zone | Area |
|---|---|---|---|
| Livingston of Fort Washington — Parcel A (acct 0412007), Parcel B (5770367), Parcel C (5770375), plat 05267017, L.20797 F.529 | LIVINGSTON OF FORT WASHINGTON LLC | **CGO** | 10.556 ac |
| Aragona Village, Block EE Lots 1–12 and Block DD Lots 1–4 (16 lots, plats 05230085/05230086, L.26757 F.002) | BRANDYWINE BUILDERS LLC | **RE** (Residential Estate) | 14.31 ac gross |

**The 16 single-family lots are not in the CGO zone.** RE permits single-family detached dwellings only (1.08 du/ac, 40,000-sf lots — Sec. 27-4202). Townhouses, two-family and two-over-two dwellings are not listed uses in RE; converting those lots needs a zoning map amendment (or a planned-development rezoning) before any of what follows applies to them. That is a Council decision, not a plan-review one.

## The CGO site — what the certified table allows (Sec. 27-4203)

| Type | Density (du/ac net) | Lot width | Coverage | Yards F/S/R | Height |
|---|---|---|---|---|---|
| Two-family (duplex) | 40 | 20 ft | 65% | 10/8/15 | 50 ft |
| Townhouse | 20 | 20 ft | 65% | 10/8/15 | 50 ft |
| Multifamily incl. two-over-two (stacked) | 48 | 50 ft, 7,500 sf | 70% | 10/8/15 | 86 ft |

Residential in the commercial zones goes through a Detailed Site Plan.

## Ground

Tract 459,822 sf (10.556 ac). Taken out: woodland conservation under approved TCPs 1.86 ac; slopes over 25% in bodies 0.00 ac (the 0.59 ac of graded banks from the existing development are regraded, not preserved); stream buffer, floodplain, wetlands: none mapped on the tract. **Developable 8.692 ac.** The NRI/TCP2 for the DSP decides the real PMA and woodland threshold; this is the minimum that would be taken.

## Yield — the drawn layout (109 dwelling units, 10.33 du/ac gross)

| Type | Bays | Units | Density vs cap | Parking (assumed ratio) |
|---|---|---|---|---|
| Townhouse | 49 | 49 | 18.44 vs 20 | 98 at 2.0/du on-lot |
| Two-family (duplex) | 6 | 6 | 12.52 vs 40 | 12 at 2.0/du on-lot |
| Two-over-two | 27 | 54 | 27.58 vs 48 | 81 at 1.5/du garage + bays |

Ceilings if the developable ground were all one type (× 0.8 for streets, parking and open space): townhouse 139 · duplex 278 · two-over-two 333. The "best use" for count is two-over-two everywhere (48 du/ac); the drawn mix puts stacked units on the Livingston Road side, townhouses in the middle and duplexes against the RE lots as the transition the Landscape Manual 4.7 buffer will ask for.

Unit assumptions: townhouse 20 × 90 ft lot / 20 × 40 ft footprint, sticks of 6; duplex 30 × 90 per unit; two-over-two 24 × 100 bay, 2 units per bay, 8 bays per building. Private streets in 40-ft strips. Parking ratios are assumed — Sec. 27-6300 is not in the engine's certified tables.

## If the RE lots were rezoned (hypothetical — shown only so the number is on the table)

16 lots 623,399 sf less the five forest-conservation easements on the 2020 Elite Engineering exhibit (207,570 sf) = 9.55 ac. At RSF-A townhouse density (16.33 du/ac × 0.8): ~124 du; at RMF-12 (12 du/ac × 0.8): ~91 du. Wetlands, the PMA and the steep ground on those lots (the 2020 exhibit shows all three) would take more.

## Files
- `livingston-fort-washington-yield-study.pdf` — plan at 1" = 60' with the numbers
- `livingston-fort-washington.yield.json` — every ring, standard and count
- Source sheets read: `existing site plans/Argona Hills Residential Site.pdf` (Aragona Village storm drain exhibit, 12 lots), `Argona Hills building sit plan.pdf` (Livingston retail/office site plan 2019), `Argona Hills SWM layout.pdf` (SDP-3 storm drain, 2020)
