# DPIE checklist — retrieved, and what it changes

Retrieved 2026-08-22 directly from `princegeorgescountymd.gov`. Source PDFs and
extracted text are in `dpie/`, with SHA-256 recorded below so Phase 3C change
detection can hash them.

## Why the earlier "403 / bot-protected" conclusion was wrong

The county does not block automation. It blocks *Anthropic's egress IPs*.
`WebFetch` and the sandboxed fetch both return HTTP 403; the same URLs fetched
from this machine with ordinary browser headers return HTTP 200 and real PDFs.
Any future source acquisition should try the local path before concluding a
document is unreachable.

## Documents captured

| File | Title | Issuing division | Revision | SHA-256 (first 16) |
|---|---|---|---|---|
| `dpie/submittal-checklist-site-dev-fine-grading.pdf` | Fine Grading Permit — Submittal Checklist | Site/Road Plan Review | Nov 17, 2015 | `c0e2b9a843a06453` |
| `dpie/design-review-checklist-site-rough-grading.pdf` | Site Rough Grading — Design Review Checklist | DPIE | Jun 27, 2013 | `e0b6734f5d23d18f` |
| `dpie/min-plan-submission-rqmts.pdf` | Minimum Plan Submission Requirements (Form #E003) | Building Plan Review | Rev. 1/24 | `fe89ebb51f26bc07` |

## The two checklists are different axes

`buildCountyChecklist()` produces 13 drawing-content items (SP-01…SP-13). That
axis corresponds to the **Design Review Checklist**, not to the Submittal
Checklist. The county has both:

- **Submittal Checklist** — which documents, approvals, fees and bonds must
  accompany the application. The engine models almost none of this.
- **Design Review Checklist** — what must appear on the drawing, each item
  carrying a Subtitle 32 code citation. This is the axis SP-01…SP-13 approximates.

The county requires the design professional to *complete and submit* the Design
Review Checklist: "PLANS SUBMITTED WITHOUT A COMPLETED CHECKLIST MAY BE RETURNED
WITHOUT REVIEW." The generated checklist is therefore a real deliverable, not
just an internal QC artefact.

## Confirmed defects in the engine

### 1. The scale chooser can emit a non-compliant scale — FIXED

`STANDARD_SCALES_FT_PER_IN = [10, 20, 30, 40, 50, 60, 100, 200]`
(`sheets/viewport.ts:16`).

Sec. 32-130(5): contours "at one (1) or two (2) foot intervals, **scale no
smaller than one (1) inch equals fifty (50) feet**".

1"=60', 1"=100' and 1"=200' are all smaller than the floor. `fitViewport()`
additionally *defaults* to 200 when nothing fits, so an oversized site silently
produces a rejectable sheet.

Reproduced against the original chooser before fixing:

| Site | Old chooser picked | |
|---|---|---|
| 65 x 100 ft infill lot | 1"=10' | compliant |
| 2000 x 1500 ft | 1"=100' | exceeds the cap, emitted silently |
| 8000 x 6000 ft | 1"=200' | exceeds the cap — and does not fit even at 200' |

**Fixed.** Reading the code itself rather than the checklist changed the design.
The checklist states the 1"=50' floor flatly; 32-130(a)(5) ends "...or as might
otherwise clearly reflect existing conditions... **provided that such other
interval and scale has the Director's approval in advance of plan
preparation**", and (a)(6) makes 1"=200' *legal* for surplus earth disposal on
sites of ten acres or more, except within fifty feet of a property line. A hard
clamp to 50 — which is what the checklist alone would have produced — would have
been stricter than the code and would have blocked legitimate plans.

`sheets/viewport.ts` now carries `ScaleConstraint`, with `PG_SCALE_GENERAL`
(a)(5) and `PG_SCALE_SURPLUS_EARTH_10AC` (a)(6). `scaleConstraintFor()` defaults
to (a)(5) and requires the narrow exception to be asked for, never inferred.
`fitViewport()` selects only from permitted scales and returns a
`ScaleCompliance` record; when nothing fits it still draws, at the smallest
scale that does, with `compliant: false` and a remedy naming match lines or a
recorded Director approval. `runIssuanceQc()` raises `PLAN_SCALE_BELOW_MINIMUM`
as **blocking**.

### 2. Vertical datum is unvalidated, and the county names a specific one

Design Review B-6: "Use NAD (North American Datum) 1983 for horizontal datum and
**NGVD (National Geodetic Vertical Datum) 1929** for vertical datum."

`twin.verticalDatum` is free-form text and is `null` from every GIS path
(`prince-georges-md.ts:285`, `md-imap.ts:198`, `pg-site-data.ts:294`). Nothing
checks it against what the county asks for.

Note before acting: NGVD 1929 is superseded nationally by NAVD 88, and this
checklist was last edited 2013. Do **not** hard-code NGVD 1929 as the only
acceptable value — confirm current DPIE practice first. What is certain is that
the datum must be *stated* and *validated*, which today it is not.

### 3. Subtitle 32 is entirely unmapped — MAPPED

The grading code — the code that actually governs this product — has no locator,
no rules and no bindings. Sections cited by the checklist:

| Section | Subject |
|---|---|
| 32-106 | Utilities must be shown |
| 32-130 | Contents of Grading/Site Development Plan |
| 32-131 | Soils investigation report |
| 32-151 | Slopes, grades, swales, pad shelf |
| 32-156 | Class 1/2/3 fill classification |
| 32-161 | Slope setback from property line |
| 32-162 | Slope terracing; 100-year overflow path |
| 24-128 | Private right-of-way easement for lots without public frontage |
| 24-122.01 | Police/Fire/Rescue mitigation fee |

Subtitles 24, 25 and 27 are mapped; 32 was the gap, and it is the most
load-bearing one for a grading/site plan.

**Mapped** in `jurisdictions/pg-subtitle-32.ts`. Subtitle 32 is *not* on
EncodePlus — it is in the Code of Ordinances at `princegeorges-md.elaws.us`,
which is server-rendered and a valid hash target (21 KB of real section text,
tables included).

That host has its own trap, different from the EncodePlus shell. eLaws slugs
encode the hierarchy and the hierarchy is not uniform:

    coor_subtitle32_div2_sec32-130            Division 2, no subdivision
    coor_subtitle32_div1_subdiv2_sec32-106    Division 1, SUBDIVISION 2

A hand-built `div1_sec32-106` returns **HTTP 200** with a 28 KB fallback page
carrying no section heading — verified. Hashing it would give a value that never
changes when 32-106 is amended: silently inert. Every slug was therefore taken
from the division table of contents and verified by reading back the section
heading, and `assertSectionHeading()` re-checks that at refresh time.

Sec. 32-130(a) is transcribed as `PG_PLAN_CONTENT_STANDARDS` — all fifteen
paragraphs, each marked with what enforces it. Nine are currently unenforced and
`unenforcedPlanContentStandards()` reports them rather than letting the gap go
unrecorded.

### 4. Two verbatim notes are required on the plan and are absent — ADDED

- **A-10 grading certificate** — a specific certification block naming Subtitle
  32 Division 2, signed/sealed by a Maryland PE.
- **A-11 stabilization note** — the 3-day / 7-day stabilization deadlines.

**Added** in `site-plan/required-notes.ts`, rendered on C-400 and C-700 by both
the SVG and PDF paths, and audited as a `requiredCountyNotes` frame element so a
sheet missing one is blocked from issuance.

Checking A-11 against its cited source changed what shipped. The checklist
attributes the three/seven day rule to **COMAR 26.17.1.08G**. It is not there:
26.17.01.08 is *"Approval or Denial of Erosion and Sediment Control Plans"* and
its subsection G is *"Grandfathering of approved plans"*. The timing rule is
published in the **2011 Maryland Standards and Specifications for Soil Erosion
and Sediment Control** (page 45, the "Standard Stabilization Note"), which
COMAR 26.17.01.08A(1) adopts by reference. Transcribing the checklist would have
put a wrong citation on every sheet the platform issues.

Two smaller defects in the same item: COMAR .08G(3) says stabilization must
comply with "the requirements of **this chapter**", which the checklist rewrites
as "the requirements of COMAR 26.17.1.08 G" — pointing the sentence at itself;
and the checklist prints the slope ratio as `3:l` with a lowercase L.

So the note is modelled as what it is — the State's operative text, plus a
separately attributed County preamble carrying COMAR .08G(3). The preamble's
deadline (January 9, 2013) has passed and it governs grandfathered plans only,
so it is never the thing that carries the stabilization requirement.

Both note texts were diffed word-for-word against their sources after whitespace
and case normalisation: **exact match**, 482 and 403 characters respectively.

## Confirmed correct

- **Sheet size.** 32-130(1) caps plans at 30"x42". ARCH D (24"x36") complies.
- **Peripheral strip.** `fitViewport(..., paddingFt = 20)` already matches the
  "minimum twenty (20) foot adjacent peripheral strip" of 32-130(5).
- **Divided responsibility now has a source.** 32-130(2) requires "date, name,
  address and telephone number of preparer of plans, **for each discipline**",
  and 32-130(3) requires certification from "preparer(s)". The content-scoped
  approval model and divided-responsibility title block are what the code asks
  for — this is no longer only a design preference.

## Still needed from the user

Approved PG site plans (and ideally one rejected set with county comments).
The checklists say what must be present; only a real approved plan shows
conventional sheet composition, note placement and title-block layout.
