# What an approved PG site plan actually carries

Source: `existing site plans/ACFROG~1.pdf` — "CALVERT MANOR", Lots 23 & 24,
Leonard Calvert Drive, Prince George's County MD. Prepared by Surveys, Inc.,
sealed by Gregory C. Knapper, Registered Professional Land Surveyor MD No.
10994. Scale 1" = 40'. Sheet 1 of 1. Approved 7/10/06, SCD number 24063-2006.

One sheet, 42" x 56". Worth noting that exceeds the 30" x 42" cap in Sec.
32-130(a)(1) — the cap governs the grading/site development plan submission,
and this is a Chesapeake Bay Critical Area Conservation Plan, a different
instrument. Do not "correct" the sheet size rule from this example.

## Layout

A single drawing centre-right, with data blocks banding the left edge and the
bottom. The title block is a BOTTOM band, not a right column. Everything a
reviewer needs is on the one sheet.

## Blocks present, and whether the engine produces them

| Block | Engine |
|---|---|
| Property boundary, bearings and distances on every line | YES |
| Existing contours | YES |
| Proposed dwelling footprint | YES |
| Legend | YES |
| Title block, scale, north arrow, sheet number | YES |
| Graphic scale | YES |
| **BRL — Building Restriction Line, labelled with its distance** | NO — drawn but labelled "BUILDABLE ENVELOPE" |
| **Adjoining lot and parcel references** (Lot 21, 22, 25, P.38, P.59) | NO |
| **Street names on the right-of-way** | NO |
| **SITE ANALYSIS** — gross tract, dwelling area, wooded area, floodplain area, net tract | NO |
| **General Notes — 28 numbered items** | Partial — 5 |
| **SEQUENCE OF CONSTRUCTION** with durations per step | NO — text exists in design.ts, never printed |
| **TOTAL AREA DISTURBED** callout | NO — computed, never printed |
| **Limit of disturbance (LOD)** delineated and labelled | NO |
| **VICINITY MAP** | NO |
| **SOILS MAP** with soil type legend (BbB, KgB…) | NO — 32-130(a)(13) |
| **COMPUTATIONS** — water quality volume, recharge | NO |
| **FOREST CLEARING DATA** | NO |
| **SURVEYOR'S CERTIFICATE OF COMPLIANCE** with seal and signature | NO |
| **Agency approval blocks** with signature and date lines | NO |
| **Owner / Developer / Applicant** name and address | NO |
| 100-year floodplain delineation | NO |
| Woodland area tabulation | NO |
| Septic system profile and detail | N/A here — public sewer |
| Planting sample schedule | NO |

## Terminology to adopt

The county draws setbacks as **BRL — Building Restriction Line** and labels each
with its distance ("20' BRL", "25' BRL"). "Buildable envelope" is not the term a
PG reviewer reads. The engine should print BRL.

## Certificate wording, verbatim from the sheet

> SURVEYOR'S CERTIFICATE OF COMPLIANCE
> I HEREBY CERTIFY TO THE BEST OF MY KNOWLEDGE AND BELIEF, THAT THIS PLAN IS IN
> ACCORDANCE WITH AND IN CONFORMANCE TO THE MINIMUM STANDARDS AND REQUIREMENTS
> OF SUBTITLE 4, DIVISION 2 OF THE PRINCE GEORGE'S COUNTY BUILDING CODE, AND
> THAT I HAVE INSPECTED THE SITE AND THAT DRAINAGE FLOWS FROM UPLAND ON AND
> DOWNGRADE ONTO ADJOINING PROPERTIES HAS BEEN ADDRESSED IN SUBSTANTIAL
> ACCORDANCE WITH APPLICABLE CODES.

Note this is the SURVEYOR's certificate and cites Subtitle 4. It is a different
instrument from the Subtitle 32 grading certificate the engine already prints
(DPIE item A-10), which is sealed by a PE. A complete plan may carry both.

## Approval blocks the sheet reserves

- PRINCE GEORGE'S COUNTY SOIL CONSERVATION DISTRICT APPROVAL — sediment control,
  grading, soils and drainage. Signature and date.
- CHESAPEAKE BAY CRITICAL AREA / SITE DEVELOPMENT CONSERVATION PLAN, with
  district signature and revision table.

These are empty boxes the county fills in. The engine should reserve them, not
fill them.

---

# Second reference: a CAD-drafted engineering set

Source: `existing site plans/Building Foot Print & Setbacks  50-scale .pdf` —
"YOCUM PROPERTY LOTS 1 THRU 19, SITE DEVELOPMENT & FINE GRADING", Clinton, 5th
Election District, Prince George's County. Design Engineering Incorporated,
sealed by Pritam L. Arora, P.E., Maryland License No. 11101. Scale 1" = 40'.
Sheet 5 of 23. Dated 1/6/2020.

Also present: `Approved Technical Plans Street Construction 15927-2020-0.pdf`,
20 pages at 36" x 24".

## Sheet sizes — both cap-compliant, and they differ by instrument

| Document | Size | Note |
|---|---|---|
| Site grading / footprint & setbacks | **30" x 42"** | Exactly the Sec. 32-130(a)(1) cap |
| Street construction technical plans | **36" x 24"** | ARCH D — what the engine already uses |
| Calvert Manor CBCA conservation plan | 42" x 56" | Different instrument, not bound by (a)(1) |

ARCH D is confirmed correct for the engineering set. A grading plan may go to
30" x 42" for a larger site before needing match lines.

## Layout, and it differs from what the engine draws

The title block is a **vertical band down the RIGHT edge** with rotated text:
firm name and logo at top, project title rotated 90 degrees, a revisions
column, then scale / sheet number / date / drawn-by at the bottom, with the PE
seal. The engine's right column is the correct idea.

A **bottom band** carries the tables: SOILS TABLE, CURVE TABLE, KEY NOTES,
LEGEND, and the engineer's certification. The engine currently stacks
everything in the right column, which will overflow on a dense sheet. A bottom
band is where the second half belongs.

## What this sheet carries that the engine does not

| Element | Note |
|---|---|
| **SOILS TABLE** | Map unit, map unit name, soil type, K-factor, hydric rating, hydrologic soil group, drainage class. This is Sec. 32-130(a)(13), and every column is available from USDA SSURGO — the endpoint is confirmed working for MD033. |
| **Street names in the right-of-way** | "JOSEPH DRIVE", "GLYNIS ROAD (50' WIDE R.O.W.)" lettered along the centreline. PGAtlas Transportation carries the names. |
| **Lot number and area on every lot** | "LOT 9 / 71,399 SF". The engine labels only the subject lot. |
| **Adjacent parcel references** | Parcel number, owner, liber/folio, zone, use — for every abutting parcel. |
| **KEY NOTES** | Numbered, boxed, and referenced by number on the drawing. Concrete curb and gutter, walk, driveway apron, sod, seed. |
| **CURVE TABLE** | Radius and length per curve, for road geometry. |
| **Spot elevations throughout** | Sec. 32-130(a)(9) — the field-survey gap. |
| **MATCH LINE SEE SHEET n FOR CONTINUATION** | How a large site is split. The engine's scale-floor remedy names match lines; nothing draws them yet. |
| **Existing contours thin/dashed, proposed heavier** | The engine draws existing only. |
| **PE certification block** | "I HEREBY CERTIFY THAT THESE DOCUMENTS WERE PREPARED OR APPROVED BY ME, AND THAT I AM A DULY LICENSED PROFESSIONAL ENGINEER UNDER THE LAWS OF THE STATE OF MARYLAND, LICENSE NO. …, EXPIRATION DATE: …" |

## Priority for the engine

1. **SOILS TABLE from SSURGO** — a code requirement, data confirmed available,
   and it closes half of 32-130(a)(13).
2. **Street names and lot labels** — both already in PGAtlas responses.
3. **Bottom band layout** — the right column will overflow.
4. **Adjacent parcel references** — one more PGAtlas Property query per abutter.
5. **Match lines** — needed before the scale floor's remedy is real.
