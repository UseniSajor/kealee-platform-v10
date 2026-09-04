# Site plan — standing commands for every agent

These are the commands. Do not invent alternatives, and do not build a second
generator. If something is missing, extend the engine.

## Generate a PDF

```bash
cd packages/spatial-engine
SHEETS=C-200 HOUSE_SQFT=2400 STOREYS=2 GARAGE=attached_2_car PORCH=1 \
  pnpm tsx scripts/generate-site-plan.ts "1005 Rollins Ave" "" out.pdf
```

The zone argument is empty on purpose — PGAtlas resolves it. `SHEETS` overrides
the composed set; omit it to let the composer decide (1–2 sheets for infill).

## Show it in the terminal

```bash
HOUSE_SQFT=2400 STOREYS=2 pnpm tsx scripts/show-site-plan.ts "1005 Rollins Ave"
```

## Run the PRODUCTION path (what a paid order does)

```bash
cd services/worker
DATABASE_URL=... DIRECT_URL=... \
  pnpm tsx src/siteplan/pilot.ts "1005 Rollins Ave" "order_id"
```

This calls the same entry point the Stripe webhook calls and the same drain the
cron calls. The two scripts above are diagnostic only.

## LOOK AT THE OUTPUT. Text extraction is not verification.

```bash
python3 -c "
import pypdfium2 as pdfium
pdfium.PdfDocument('out.pdf')[0].render(scale=1.5).to_pil().save('out.png')"
```

Then open `out.png`. A block can be present in the text stream and still be
invisible, off-page, overlapped or drawn under the title block. Every drawing
defect in this engine's history was found by looking, and missed by grepping:

- the footprint drawn through the setback line
- the hatch filling a rotated rectangle's BOUNDING BOX
- contours running under the title block
- the professional responsibility block silently overwritten

## Reference plans

`existing site plans/` holds three approved PG plans. Read
`docs/site-plan-reference/APPROVED-PLAN-ANALYSIS.md` before changing sheet
layout — it records what a real sheet carries and what this engine still lacks.

## Data sources — all PGAtlas unless noted

| What | Endpoint |
|---|---|
| Address locator | `gis.pgatlas.com/pgatlas/rest/services/Geocoders/Address/GeocodeServer` |
| Parcel | `.../Property/MapServer/15` |
| Zoning | `.../Zoning/MapServer/63` |
| **2-ft contours** | `.../Elevation/MapServer/1` — "Contour - 2 Ft (2023)", NAVD88 |
| Street centrelines | `.../Transportation/MapServer/2` |
| **Municipal boundary** | `.../Administrative/MapServer/30` — incorporated limits |
| Municipal proximity | `.../Administrative/MapServer/31,32,33` — ¼, ½, 1 mile buffers |
| Soils | USDA SSURGO `sdmdataaccess.sc.egov.usda.gov` — area MD033 |

Minimum locator score is 90. The composite locator returned a DIFFERENT STREET
at 77 for a valid address; a weak match sites the plan on the wrong lot.

The locator answers WHERE but not WHOSE. It returns `Place_addr` only — no
city, no ZIP — and `Property/MapServer/15` carries just OBJECTID, PROP_ID and
acreage. The municipality comes from `Administrative/MapServer/30`, and it
matters: a parcel inside incorporated limits is routed to Kealee internal
staff review. That is a Kealee workflow decision — the engine does not assert
anything about a municipality's own review process.

1005 Rollins Ave is the worked example — it is OUTSIDE the Capitol Heights
limits while carrying a Capitol Heights mailing address and ZIP 20743. Layer 30
returns nothing for it; layers 31 and 32 return CAPITOL HEIGHTS. Mailing city
is not jurisdiction, and only the boundary layer distinguishes them.

Do not use `gisdata.pgplanning.org` for elevation — it is the open-data portal
and has none. That mistake produced a false finding that the county publishes no
contours.
