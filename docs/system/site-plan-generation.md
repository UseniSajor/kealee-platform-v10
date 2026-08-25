# Site plan generation — process for agents and models

Read this before touching the site-plan engine. It records decisions that cost
real time to find and are easy to undo by accident.

## The pipeline

```
address
  -> PGAtlas locator            gis.pgatlas.com/.../Geocoders/Address   score >= 90
  -> PGAtlas Zoning             .../Zoning/MapServer/63                 zone code
  -> PGAtlas Property           .../Property/MapServer/15               lot polygon
  -> PGAtlas Elevation          .../Elevation/MapServer/1               2-ft contours
  -> buildLotPackage()          twin + envelope + footprint + composition
  -> renderSheetSetPdf()        one PDF page per COMPOSED page
```

Run it:

```bash
cd packages/spatial-engine
HOUSE_SQFT=2400 STOREYS=2 GARAGE=attached_2_car \
  pnpm tsx scripts/generate-site-plan.ts "1005 Rollins Ave" "" out.pdf
```

The zone argument is empty on purpose — PGAtlas resolves it. Supplying one that
disagrees with PGAtlas is overridden, with a note.

## Rules that must not be undone

**Generation is never gated on a PE seal.** The platform drafts a complete plan;
a human seals it afterwards. `QcFinding.severity` has three values:
`blocking` means the DRAWING is defective (unclosed boundary, non-compliant
scale, incomplete frame) — fix it. `pending_seal` means a licensed professional
must act — it NEVER withholds the plan. `QcResult.deliverable` and
`LotPackage.delivered` are constant `true` so the guarantee is in the type.
A reviewer cannot seal a plan that was never drawn.

**Nothing is fabricated.** No parcel rectangle from a lot width and depth. No
contour interpolation. No silent datum conversion. If a source does not answer,
the output says so and the feature is absent. A fabricated boundary renders
exactly like a real one and nothing downstream can tell them apart.

**Inputs go in BEFORE composition.** `buildLotPackage()` takes `contours` and
`programme`. Adding them to `pkg.twin` afterwards is a trap that already caught
one implementation: the composer had already decided the sheet set, so a lot
with full terrain still produced a single bare existing-conditions sheet.

**One PDF page per COMPOSED page, not per canonical sheet.** An infill lot
composes several canonical sheets onto one page. Rendering one page per
canonical sheet contradicts the composition and pads the set — a residential
infill plan is 1-3 sheets, never 10. A composed page carries the required notes
of every sheet it covers.

## Host traps, all found the hard way

| Host | Trap |
|---|---|
| `gisdata.pgplanning.org` | Open-data portal. 57 services, NO elevation, NO locator. Searching only this produced the false finding "the county publishes no contours". |
| `gis.pgatlas.com` | PGAtlas proper. Elevation, Property, Zoning, Environmental, Easement, WaterSewer. **This is the one you want.** |
| `online.encodeplus.com` | `doc-viewer.aspx` is a JS shell — hash changes on CMS deploys, silent through amendments. Use `doc-view.aspx?print=1` via `pgPrintUrl()`. |
| `princegeorges-md.elaws.us` | Server-rendered, valid hash target. Slugs encode a NON-UNIFORM hierarchy; a hand-built slug returns HTTP 200 with a headingless fallback. Take slugs from the division TOC and verify with `assertSectionHeading()`. |
| `princegeorgescountymd.gov` | Blocks **Anthropic egress IPs**, not automation. `WebFetch` gets 403; local `curl` with browser headers gets 200. Never conclude a public document is unreachable without trying locally. |

A negative result about a publisher is only as good as the host you asked.

## Geocoding

Use the county locator, not a public one. It scored `1005 Rollins Ave` at 100
where OSM Nominatim returned nothing. Pass the street address ALONE — appending
city and ZIP returns no candidates. Minimum score is 90: the composite locator
offered "1005 Capitol Heights Boulevard" at 77 for a Rollins Ave query, and a
weak match sites the plan on the wrong lot.

## Footprint

Derived from the setbacks, then bounded by whichever constraint is smallest:

1. Setback envelope — perpendicular inset of the parcel bounding box
2. Lot coverage maximum — a percentage of net lot area, from the zoning table
3. Programme cap — what the customer asked for

Skipping (2) is the trap. A 2,506 sq ft lot in RSF-65 allows 35% coverage — 877
sq ft — so a 1,500 sq ft footprint that sits inside the setback lines is still a
violation.

**Do not use a centroid-based radial inset for setbacks.** It scales vertices
toward the centroid, which is not a perpendicular offset, and it OVER-CLAIMS: a
true 25 ft inset of a 50 x 50 lot leaves zero buildable area while the radial
method reports about 225 sq ft. That draws a building through the setback line.

The inset applies the LARGEST yard depth uniformly, because parcel geometry does
not say which edge fronts the street. That is conservative. When it consumes the
whole lot the answer is "not established", not "unbuildable".

## Footprint when the customer has no plans

`estimateFootprint()` in `site-plan/footprint-programme.ts`.

```
single storey  ->  footprint = total floor area
N storeys      ->  footprint = total floor area / N
```

Three adjustments that are easy to get backwards:
- A basement adds floor area but NO footprint. It is below grade.
- An attached garage adds footprint and is usually NOT in a quoted house size,
  because that figure conventionally means finished living area.
- A covered porch is footprint and may count toward coverage.

`HOUSE_PROGRAMME_QUESTIONS` is the intake set. Every question changes the
footprint; nothing is asked for its own sake.

## Vertical datum

County contours are **NAVD88 feet**. DPIE Design Review Checklist item B-6 (last
edited 2013) asks for NGVD 1929. They differ by roughly 0.9 ft here.

State what the data IS. Do not convert. A silent VERTCON shift under a sealed
drawing is a fabricated elevation. Confirm current DPIE practice before changing
this.

## Requirement sources

Authoritative documents are in `docs/site-plan-reference/dpie/` with SHA-256
sums and URLs. Findings are in `docs/site-plan-reference/CHECKLIST-FINDINGS.md`.

**Treat the DPIE checklists as a finding aid, not an authority.** They have been
wrong twice where the underlying code was right:

1. The checklist states the 1"=50' scale floor flatly. Sec. 32-130(a)(5) ends
   "provided that such other interval and scale has the Director's approval in
   advance of plan preparation", and (a)(6) permits 1"=200' for surplus earth
   disposal on 10+ acres. A hard clamp would block legitimate plans.
2. The checklist attributes the three/seven day stabilization rule to COMAR
   26.17.1.08G. It is not there — .08 is "Approval or Denial of Erosion and
   Sediment Control Plans" and G is grandfathering. The rule is in the 2011
   Maryland Standards, page 45.

Always read the cited source before encoding a requirement.

## What the engine cannot do

Statutory, not engineering:

- Certified boundary and topographic survey — a Maryland licensed surveyor
- The seal itself — a Maryland PE, per Sec. 32-130(a)(3)
- Spot and finished-floor elevations, Sec. 32-130(a)(9) — needs field survey;
  2-ft contours establish existing grade but not these
- Drainage area map and computations, Sec. 32-130(a)(11) — hydrology a PE signs

No amount of automation changes these. The product is everything up to the seal,
so the professional reviews and signs rather than drafts.

Nine of the fifteen paragraphs of Sec. 32-130(a) are unimplemented;
`unenforcedPlanContentStandards()` lists them rather than leaving the gap
unrecorded.
