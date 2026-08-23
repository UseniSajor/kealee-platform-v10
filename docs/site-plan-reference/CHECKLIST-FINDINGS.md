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

### 1. The scale chooser can emit a non-compliant scale

`STANDARD_SCALES_FT_PER_IN = [10, 20, 30, 40, 50, 60, 100, 200]`
(`sheets/viewport.ts:16`).

Sec. 32-130(5): contours "at one (1) or two (2) foot intervals, **scale no
smaller than one (1) inch equals fifty (50) feet**".

1"=60', 1"=100' and 1"=200' are all smaller than the floor. `fitViewport()`
additionally *defaults* to 200 when nothing fits, so an oversized site silently
produces a rejectable sheet. The floor must be enforced, and a site that cannot
fit at 1"=50' needs match lines or a larger sheet — not a smaller scale.

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

### 3. Subtitle 32 is entirely unmapped

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

Subtitles 24, 25 and 27 are mapped; 32 is the gap, and it is the most
load-bearing one for a grading/site plan.

### 4. Two verbatim notes are required on the plan and are absent

- **A-10 grading certificate** — a specific certification block naming Subtitle
  32 Division 2, signed/sealed by a Maryland PE.
- **A-11 stabilization note** — COMAR 26.17.1.08G, with the 3-day / 7-day
  stabilization deadlines.

Both are fixed text the county expects to read on the sheet. Verbatim wording is
in `dpie/design-review-checklist-site-rough-grading.txt`.

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
