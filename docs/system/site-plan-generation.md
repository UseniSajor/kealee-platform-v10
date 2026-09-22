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

## Delivery — how a paid order gets the plan

The engine's last first-release stage, `siteplan.deliver_preliminary`, writes
`PRELIMINARY_READY` into a stage-execution row. Until 2026-09-15 nothing read
it: the order stayed at the webhook's `in_review`, the owner portal showed
"generating" forever, no email went out, and the PDF sat in `documents` with
no customer-facing route. Delivery now closes the loop:

```
worker runOne()  ── stage.deliverable && COMPLETED ──►  siteplan/delivery.ts
   bridgeSitePlanDelivery()
     ├─ buildSitePlanDeliverable()   stage outputs → form_data.sitePlanDeliverable
     ├─ patchOrder()                 orderStatus, fulfillmentStatus (raw SQL, same DB)
     └─ sendReadyEmail()             POST web-main /api/emails/deliverable-ready
                                     nextPath=/deliverables/{id}/site-plan
owner portal
   /deliverables                     list — site-plan rows link to the page below
   /deliverables/[id]/site-plan      the view: PDF, county facts, pending-seal list
   /api/site-plan/[id]/document      the PDF, from `documents` by projectId=intakeId
```

**What the customer sees is `form_data.sitePlanDeliverable` and nothing
else.** A stage output that is not projected into that record is invisible.
`SitePlanDeliverableRecord` in `services/worker/src/siteplan/delivery.ts` is
the contract; `apps/portal-owner/lib/site-plan-deliverable.ts` is its
structural copy.

**Status by product.** The preliminary plan IS `preliminary_site_plan`, so
that order goes to `delivered`. `verified_site_feasibility` and
`permit_site_plan` include professional review, so they go to
`needs_professional_review` — the plan is still viewable, the order says a
human acts next. Pending-seal items are listed for the customer under "items
still requiring confirmation" (a line in the product's `includes`); they
never withhold the plan.

**The webhook no longer sends an activated site-plan order to the manual
queue.** `routeToManualFulfillment` is for orders with no automated producer;
an activated engine workflow is one. Activation `FAILED` still routes to a
human.

**The bridge is idempotent on the order** (`sitePlanDeliverable` present →
skip) and never throws — the plan is already persisted, and a delivery
failure must not fail the stage and trigger a re-render.

### Professional review — the H group (connected 2026-09-15)

```
deliver_preliminary COMPLETED
  └─ product includes review?  ──►  worker enqueues siteplan.route_review
route_review
  reads capabilities.loadReviewState (SitePlanReviewAssignment + ScopedApprovals)
  ├─ no assignment / ACTIVE      → AWAITING_REVIEW   (stage waits; engineer queue lists the plan)
  ├─ assignment COMPLETED        → COMPLETED, reviewState APPROVED
  └─ assignment REVISION_REQUIRED→ COMPLETED, reviewState CHANGES_REQUESTED, enqueue apply_revisions
engineer acts (apps/web-main/app/engineer/review/actions.ts)
  completeReview / withheld approval ──► reopenSitePlanReview() re-enqueues route_review (own key)
route_review COMPLETED ──► worker bridgeSitePlanReviewOutcome()
  form_data.sitePlanReview + order status:
    APPROVED  verified_site_feasibility → delivered (emails customer)
    APPROVED  permit_site_plan          → in_review (I/J groups are staff work)
    CHANGES_REQUESTED                   → revision_requested, fulfillmentStatus awaiting_drafter
apply_revisions → AWAITING_REVIEW for a drafter; it does NOT apply free-text redlines
```

**A processor may read a decision and can never make one.** The assignment
and scoped approvals are written only by the review application under the
professional's identity. `loadReviewState` is read-only and optional — a host
without it (the pilot script) gets BLOCKED from `route_review`, not an
approval.

**Two queues, one plan (2026-09-21).** Professional review is per discipline:
`SitePlanReviewAssignment` is unique on `(workflowId, discipline)`, so the
engineer (OS Engineering, `/engineer/review`) and the architect (OS
Architecture, `/architect/review`) hold their own assignment and decide their
own subjects — `ZONING_COMPLIANCE`/`SITE_LAYOUT` and `ARCHITECTURAL_FOOTPRINT`
respectively (`content-scope`: the footprint is certified by an architect).
The worker's `loadReviewState` returns every assignment plus the disciplines
the product requires (`productReviewDisciplines`: `verified_site_feasibility`
→ engineer; `permit_site_plan` → engineer + architect); `route_review` waits
on each, goes CHANGES_REQUESTED the moment any of them withholds, and APPROVED
only when all have completed. The architect desk also carries the DESIGN
CONCEPT queue (`DesignConceptQueue`): a concept order is reviewed as
`form_data.architectReview`; "send back with direction" moves it to
`revision_requested` and the next `/api/concept/generate` run feeds the
direction into the prompt and bumps `conceptGeneration`, which returns it to
the queue.

**The revision loop is closed (2026-09-21).** On the staff desk
(`/admin/site-plan`) a workflow with withheld subjects shows the redlines and
a "submit revision" form: a response per redline, a description, and the
INPUT CHANGES (JSON merged over `SitePlanWorkflow.metadata`, the form data
every stage reads). `POST /api/admin/site-plan/:id/revision` →
`lib/site-plan-revision.ts`:

```
submitSitePlanRevision
  metadata ← inputs + patch (workflow.version++)
  every SitePlanSheet → currentRevision+1, a SitePlanSheetRevision with the redlines and responses
  withheld SitePlanScopedApprovals → superseded by fresh PENDING rows; assignments REVISION_REQUIRED → ACTIVE
  enqueue siteplan.compose_sheets
runner derives render_exports → run_draft_qc → persist_package → deliver_preliminary
worker bridgeSitePlanDelivery: a DIFFERENT document on an already-delivered order is a revision —
  form_data.sitePlanDeliverable refreshed (previousDocumentId kept), customer emailed "revised"
worker enqueues route_review again; the desk is notified "revised site plan awaiting review"
professionals decide on the new revision (decisions bind to the new document's hash);
  bridgeSitePlanReviewOutcome is idempotent on (state, sheetRevision), so round 2 reaches the order
```

The engine still applies no free-text redline: a person changes the inputs,
the engine redraws, and the audit trail (`revision.submitted`) carries what
was changed and why. `ingest_comments` (J) remains the county-comment path.

### Issuance and submission — the I/J groups (connected 2026-09-15)

```
route_review APPROVED ──► run_issuance_qc
  seedReviewItems + buildReviewMatrix   (engineer's subjects → APPROVED; surveyor etc. stay PENDING)
  runIssuanceQc                          (twin, permitPath, county checklist, matrix, frame failures)
  applyEvidenceGate                      (capabilities.loadEvidenceLedger — SitePlanEvidence rows)
  → COMPLETED with issuable = gated.issuable && matrix.submissionReady
build_submission  (deliverable)
  → SUBMISSION_READY | SUBMISSION_INCOMPLETE, county checklist, deduplicated outstanding list
worker bridgeSitePlanSubmission → form_data.sitePlanSubmission
  READY      → delivered, customer emailed "ready to submit"
  INCOMPLETE → in_review, customer emailed "package + checklist in your portal", staff chase items
```

**Issuable is a conclusion from evidence and sign-off, never from approval
alone.** An engineer's approval of zoning/layout does not clear
MISSING_SURVEY_CERTIFICATION; a certified survey file in the evidence ledger
does. A GIS-drawn lot with no survey is delivered and NOT labelled ready to
submit. Nothing here implies jurisdiction approval.

**Review desk notice:** when a plan is routed for review, `notifyReviewRouted`
emails `SITE_PLAN_REVIEW_DESK_EMAIL` (default hello@kealee.com) with the
claim link. Before this an order could wait unseen.

### Revisions — reopening (connected 2026-09-15)

Every declared stage now has a processor. The revision loop:

```
engineer withholds approval ──► apply_revisions   (AWAITING_REVIEW, reopen compose_sheets…)
county comment letter        ──► staff enter form_data.sitePlanCountyComments on the order
                                  POST /api/admin/site-plan/{wf}/run {job: siteplan.ingest_comments}
                             ──► ingest_comments  (COMPLETED, reopen compose_sheets…, order revision_requested)
a person revises the inputs  ──► POST /api/admin/site-plan/{wf}/run {job: siteplan.compose_sheets}
                             ──► render → QC → deliver → route_review → issuance → submission again
```

`StageResult.reopen` names the stages a result supersedes; the runner takes
the FULL dependent closure (`reopenClosure`), drops their rows to READY
through `capabilities.reopenStages` (outputs kept), and enqueues NOTHING.
That last point is the design: a deterministic chain re-run on unchanged
inputs draws the same sheet. The correction is a change to the inputs and a
person makes it, then re-enqueues from `compose_sheets`. A host without
`reopenStages` gets BLOCKED, never a stale COMPLETED row over a superseded
result.

`ingest_comments` reads comments a person typed; it never marks one
addressed — `RevisionResponse.status` is a human statement. Consumed comment
ids go to `form_data.sitePlanCountyCommentsIngested`; the staff-entered array
is never rewritten.

Staff may enqueue only `STAFF_RUNNABLE_STAGES` (compose_sheets, route_review,
ingest_comments, run_issuance_qc). The guard still decides.

### Staff desk — `/admin/site-plan`

Lists every paid site-plan order with its workflow. **Activate** calls the
same entry point the webhook calls, for orders paid before activation existed
or whose activation FAILED. Open a workflow to see stages/queue/review, re-run
a staff-runnable stage, or enter the County's comment letter (appended to
`form_data.sitePlanCountyComments`, then run `ingest_comments`).

API: `GET/POST /api/admin/site-plan`, `GET/PATCH /api/admin/site-plan/{wf}`,
`POST /api/admin/site-plan/{wf}/run`. `DELETE /api/admin/orders/{id}` removes
an UNPAID lead only.

**Not done:** the concept page at `/deliverables/[id]` does not redirect
site-plan orders to `/site-plan`.

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

---

# Drafting conventions, learned from approved plans

Two approved PG plans are in `existing site plans/` and analysed in
`docs/site-plan-reference/APPROVED-PLAN-ANALYSIS.md`. Read that before changing
sheet layout. What follows is the short version an agent needs.

## Terminology

The county draws and labels a setback as **BRL — Building Restriction Line** —
with its distance: `25' BRL`. "Buildable envelope" is an internal term and does
not belong on a sheet a PG reviewer reads.

## Sheet size depends on the instrument

| Instrument | Size |
|---|---|
| Site grading / footprint and setbacks | 30" x 42" — the Sec. 32-130(a)(1) cap |
| Street construction technical plans | 36" x 24" (ARCH D) |
| CBCA conservation plan | 42" x 56" — a different instrument, not bound by (a)(1) |

ARCH D is confirmed correct for the engineering set. Do not "fix" the (a)(1)
cap on the strength of a 42" x 56" conservation plan.

## Layout

Title block is a vertical band down the RIGHT edge with rotated text. Tables go
in a **bottom band** — soils, curves, key notes, legend, certification. The
engine currently stacks everything in the right column, which overflows on a
dense sheet; the bottom band is where the second half belongs.

Nothing but drawing goes left of the block column. Nothing but data goes right
of it. Contours and site geometry must never run under the title block.

**The title block owns the full-height right column.** Draw it FIRST and stack
data below its returned bottom. Drawing data first silently erases the
professional responsibility and seal rows — and a check for "SEAL" will pass
anyway, because it matches "SEALED" inside the grading certificate. Check for
"SEAL AND SIGNATURE".

## Footprint placement

A dwelling is built TO the front setback — that is what the setback is for —
and the yard left behind is the rear yard. Centring the footprint in the
envelope pushes the house to the back of the lot and reads as wrong.

Its front face must be PARALLEL to the front lot line, so the rectangle's
primary axis is the FRONT line. Using the side line as the primary axis turns
the house ninety degrees and presents its gable end to the street.

## Setback geometry

Per-edge, following the LOT OUTLINE. Three wrong ways, all of which shipped at
some point in this engine:

1. **Centroid-based radial shrink** — not a perpendicular offset. OVER-CLAIMS: a
   true 25 ft inset of a 50 x 50 lot leaves zero buildable area while the radial
   method reports about 225 sq ft. Draws a building through the setback line.
2. **Bounding-box inset** — does not follow an irregular lot, so the envelope
   does not line up with the property lines.
3. **Largest setback applied uniformly** — throws the front setback out and
   over-insets every other side.

The correct method is each edge offset inward by its own yard depth, intersected
as half-planes (Sutherland-Hodgman).

## Sheet content — state as of 2026-09-15

Done, and now reaching PRODUCTION runs (they were script-only before):
- **Soils table** (`jurisdictions/usda-soils.ts`, `soilsTable()` in render-pdf)
  — fetched in `build_existing_conditions`, county-wide units with
  `SOILS_CAVEAT`; narrowing to the parcel is still open.
- **Adjacent parcel references** — fetched in `resolve_property` from the
  PGAtlas parcel layer, drawn by render-pdf. Owner and liber/folio are not on
  that layer and are not shown.
- **Street names**, **bottom band** — in render-pdf.

Still missing:
1. **Match lines** — the composer flags a below-floor scale and names the
   remedy; nothing draws one.
2. **Spot elevations** — Sec. 32-130(a)(9), needs field survey.
3. **Soils narrowed to the parcel** — SSURGO spatial query, not the tabular one.
