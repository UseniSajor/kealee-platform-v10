# Toolchain self-sufficiency and the product ladder

**Date:** 2026-09-23 · **Status:** APPROVED, in execution
**Approved by:** Tim Chamberlain, with ten amendments recorded in §2.
**Supersedes:** `docs/audits/site-plan-engine-audit-2026-08-20.md` §5, which listed
the required libraries and was never executed.

---

## 1. Doctrine — what every agent and model does

**An agent's job is to draw, write and deliver THROUGH the repo's engines.**

1. **One capability, one owner package.** If the repo has a DXF writer, a
   geometry kernel, a PDF composer or a CRS transformer, you import it. A
   parallel implementation is a defect even when it works, because the next
   agent then has two truths to choose between.
2. **Discover before you build.** Search the repo for an existing engine before
   writing one. Two DXF writers and two geometry kernels exist today because
   this step was skipped.
3. **No side-channel delivery.** A deliverable is produced by a declared stage in
   a declared workflow and persisted through the repo's persistence layer. A
   script that renders a PDF outside the stage graph is a diagnostic, never a
   delivery.
4. **Install the audited dependency; do not reimplement it.** Repo-owned code is
   for what is ours: county rules, the twin, sheet layout, the review model.
5. **Implemented ≠ tested ≠ deployed.** Report the three separately. §6 is the
   ledger.

---

## 2. Approved amendments (binding)

1. **Shared CAD kernel.** Extract `packages/cad-kernel`. Migrate consumers
   through compatibility adapters. **Do not delete old implementations until the
   shared kernel passes integration and regression tests.**
2. **GIS and reprojection.** proj4 is **not** universally authoritative. Build a
   **verified transformation registry**: the appropriate operation per CRS pair,
   with ArcGIS retained as an authoritative service and cross-check. Record
   coordinate-operation metadata, datum, accuracy, units and provenance on every
   transform.
3. **AI integration.** The site-plan ladder is **not** AI-free. Engineering
   calculations, constraint validation and final engineering determinations stay
   deterministic, testable and reproducible. Kealee agents are used for document
   interpretation, retrieval, design assistance, drafting suggestions and QC
   support. **AI output cannot bypass engineering validation or professional
   review.** Core drawing regeneration must run without AI-provider access when
   validated inputs exist.
4. **Product standards.** Keep the product ladder, but let **actual
   jurisdictional requirements** set each product's scope and submission
   deliverables. AIA phases are organizing concepts, not a universal civil
   standard. Apply NCS, survey and utility-quality standards per their real
   requirements and the available evidence.
5. **Detailed Site Plan.** Implement against current jurisdictional instrument
   rules including DET where applicable. Do not assume a universal sheet set or
   a universal review-discipline set. Classification, applicable requirements
   and routing are **evidence-driven**.
6. **Complete permit set.** Include the underlying **engineering computations,
   data-quality checks and calculation reports**, not merely sheets. Distinguish
   preliminary terrain information from verified survey data. Explicitly
   identify incomplete calculations and missing engineering evidence.
7. **Knowledge and training.** Local embeddings behind a **configurable provider
   interface**. Preserve existing knowledge records; support **controlled,
   versioned re-embedding** without losing the index. Generation-time retrieval
   of **authorized, verified** evidence with provenance. Maintain an approved
   training and evaluation dataset. **No automatic fine-tuning on unverified
   project output.**
8. **Drafter workspace.** Accelerated. Runs in parallel with Phase G once the
   revision API and workflow contract are verified. Uses the existing revision
   submission mechanism.
9. **Professional document status.** Internal drafts and review copies are
   allowed before sealing but must be **clearly distinguished** from approved or
   sealed submission documents. **No automated process may represent a document
   as professionally certified without the applicable professional
   authorization.**
10. **Repository governance from the beginning.** Enforce engine discovery and
    reuse, dependency ownership, runtime activation checks and integration
    testing. Keep a record of what is implemented, tested and deployed.

---

## 3. The four-ring self-sufficiency model

Third-party software is allowed. Dependence on someone else's *uptime* is not.

| Ring | What | Rule |
|---|---|---|
| 0 — Repo-owned | County rules, site twin, sheet layout, review model, QC, stage graph | Ours. Never delegated. |
| 1 — Vendored library | proj4, turf, DXF writer, geotiff, pdfkit, three, web-ifc | Pinned, permissive licence, offline, no key, no account |
| 2 — Cached external data | PGAtlas, SSURGO, FEMA, plats, ordinances | Persisted with provenance. Network refreshes; it never gates. |
| 3 — Live service | County locators, ArcGIS geometry service, Anthropic, Replicate, Stripe | Must fall back to Ring 1/2, or the feature is absent and says so |

**Acceptance test:** with the network unplugged, a previously resolved site must
still redraw from cache, and every drawing operation must still run.

### Ring 2 — cache metadata is mandatory (amendment 9, second point)

A cached fact is not a timeless fact. Every cached record carries:
`sourceEndpoint`, `retrievedAt`, `datum`/`units` where spatial, `applicability`
(what it is valid for), `refreshPolicy` (max age before it must be re-fetched),
and a computed `staleness` state: `FRESH` · `AGING` · `STALE`. A drawing built
on `STALE` data says so on the sheet and in the deliverable record. **Offline
capability never means pretending old data is current.**

### Document status policy (amendment 9)

`DocumentStatus` is explicit on every generated artifact and rendered on the
sheet, never inferred:

| Status | Meaning | May be shown to customer | May be submitted |
|---|---|---|---|
| `INTERNAL_DRAFT` | Engine output, no human has looked | No | No |
| `REVIEW_COPY` | Routed to a professional, undecided | Yes, marked | No |
| `PROFESSIONALLY_REVIEWED` | A licensed professional decided, no seal | Yes, marked | No |
| `SEALED` | Seal applied under a named licence | Yes | Per jurisdiction |

Only the professional's own authenticated act may move an artifact to `SEALED`.
No processor, job, agent or model may set it. Generation is still never gated on
a seal: the drawing is produced and delivered at the status it has earned.

---

## 4. Phases

Each phase lists the change and the **gate** that must pass before it is called
done.

### Phase A — Verified transformation registry and the audited libraries
Install `proj4`, `@turf/turf`, `@tarikjabiri/dxf`, `geotiff` into
`packages/spatial-engine`. Build a **transformation registry** keyed by CRS pair
recording the operation used, its accuracy, datum and units (amendment 2).
proj4 supplies the offline path; `createArcGisTransformer` is retained and used
as cross-check. DXF writer rebuilt emitting **NCS layer names**. Turf takes the
envelope boolean ops.
**Gate A:** registry cross-check shows proj4-vs-ArcGIS divergence under the
recorded accuracy tolerance for every declared CRS pair, on the Porter lots and
1005 Rollins. Regenerated DXF diffed entity-by-entity against current output.

### Phase B — `packages/cad-kernel`
Extract the CAD engine from `concept-engine`. Both engines import it through
compatibility adapters preserving current APIs. **Old implementations stay until
the kernel passes integration and regression tests** (amendment 1).
**Gate B:** one DXF implementation directory in use; both engines build; both
DXF outputs open in a viewer and match their pre-migration entity lists.

### Phase C — Concept product toolchain
One `buildGroundedPrompt()` that refuses a prompt not grounded in intake +
`PRODUCT_PRICING` + zoning/parcel. Wire `cad-kernel` so the priced `editable_cad`
add-on has a producer. `core-bim` glTF/IFC is **scoped to what web-ifc actually
supports and is not promised in product copy until proven**.
**Gate C:** with AI keys removed, a concept order still delivers geometry,
dimensioned plan, zoning narrative and DXF; the photoreal render is absent and
stated.

### Phase D — Preliminary site plan
Locator fix (done, §6). Ring-2 `SiteSourceCache` with the metadata of §3. Turf
envelope to production. SSURGO spatial query for parcel-level soils. Match lines.
**Gate D:** full preliminary PDF for Rollins with outbound network blocked after
a warm cache; provenance block states every fact's source, `retrievedAt` and
staleness.

### Phase E — Detailed Site Plan
Evidence-driven (amendment 5). Classification determines the instrument, the
applicable requirements and the review disciplines from jurisdictional rules and
site evidence — not from a fixed sheet list. DET requirements included where
applicable. Schema in `schema-src/land/`.
**Gate E:** a triggered parcel classifies DSP with its requirement set derived
from evidence; a single-family infill lot still classifies NOT-DSP.

### Phase F — Complete permit set
Sheets **and** the engineering behind them (amendment 6): computations,
data-quality checks, calculation reports, and an explicit register of incomplete
calculations and missing evidence. Terrain provenance distinguishes GIS contours
from verified survey. Utilities labelled by ASCE 38 quality level.
**Gate F:** every sheet carries real content or is absent with a stated reason;
every calculation either has a report or appears in the missing-evidence
register. Every page rendered to PNG and looked at.

### Phase G — Knowledge, retrieval and the approved dataset
Extend `LearningEvent` capture. Add the missing `RagDocument`/`RagChunk` tables.
Move the ingester from the undeployed `services/api` into `services/worker`.
Embedding provider becomes configurable with a local implementation; re-embedding
is versioned and non-destructive. Retrieval at generation time is restricted to
**authorized, verified** evidence and carries provenance. An approved
training/evaluation dataset is maintained; nothing auto-trains.
**Gate G:** a second order at the same address retrieves the first order's
professional redlines and does not repeat the finding; retrieval quality
benchmarked against the current provider before any switch.

### Phase H — Drafter workspace (accelerated, parallel with G)
`/drafter` queue plus a three-pane workspace: redlines with responses, sheet
preview rendered as PNG, and a structured typed form over the real
`SitePlanWorkflow.metadata` fields with source and diff markers. Posts to the
existing `submitSitePlanRevision()`. Artifact versioning and professional review
states surfaced; document status per §3 shown on every preview.
**Gate H:** a full round trip with no hand-typed JSON; round 2 bound to the new
content hash.

### Phase I — Governance (from the beginning)
Doctrine §1 into KEALEE.md. CI check failing a new DXF/projection/boolean
implementation outside its owner package. Dependency additions require a Ring
table entry. Runtime activation checks: a capability is not "done" until a
deployed service exercises it. `docs/audits/latest.md` refreshed each phase.

---

## 5. Sequence

```
A ──► B ──► C
      └───► D ──► E ──► F
G  ‖ from end of A
H  ‖ from end of D, accelerated — gated only on the revision API + workflow contract
I  lands with A, then again at each phase boundary
```

---

## 6. Status ledger — implemented / tested / deployed

Updated as work lands. "Deployed" means running in a Railway production service.

| Item | Implemented | Tested | Deployed |
|---|---|---|---|
| Locator fallback: retired-service detection + provenance (`pgatlas.ts`) | 2026-09-23 | generator smoke exit 0, 5 sheets, fallback traced in output | **not yet** |
| Production two-phase locator ordering pinned (`first-release.ts`) | 2026-09-23 | preserved by construction; full suite green. No stage-level test yet. | **not yet** |
| `spatial-engine` test runner wired (`vitest run`) — 30 files had NO runner and `turbo run test` skipped the package | 2026-09-23 | **613 tests, 30 files, all pass** — first execution in the package's history | n/a (CI) |
| 4 test files converted off Jest idioms so they execute at all | 2026-09-23 | included in the 613 | n/a |
| `proj4` 2.22.0, `@turf/turf` 7.4.0, `@tarikjabiri/dxf` 2.9.0, `geotiff` 3.0.5 installed | 2026-09-23 | install exit 0; proj4 exercised by the registry | **not yet** — no deployed service imports them |
| Verified transformation registry (`export/transformation-registry.ts`) | 2026-09-23 | 16 tests inc. live cross-check vs the county geometry service | **not yet — not wired into any stage** |
| NCS DXF writer (`export/dxf-ncs.ts`) | 2026-09-23 | 19 tests + real-lot differential vs R12 | **not yet — scripts only** |
| Registry + NCS DXF wired into `generate-site-plan.ts` | 2026-09-23 | generator exit 0 on 1005 Rollins Ave | n/a (diagnostic script) |
| `tsc --noEmit` on `spatial-engine` | — | exit 0 | — |
| CAD emission in `render_exports` (DXF + LandXML + GeoJSON) | 2026-09-23 | vertical slice through the production runner, 5 new tests | **not yet — worker not redeployed** |
| Document status stamped inside the DXF | 2026-09-23 | 5 tests inc. "never claims sealed under any status" | not yet |
| `dataExports` projected into `sitePlanDeliverable` | 2026-09-23 | worker `tsc --noEmit` clean | not yet |
| Portal "Engineering files" card + download route | 2026-09-23 | portal `tsc --noEmit` clean; **no browser test run** | not yet |
| Full suite after all of the above | — | **641 tests, 31 files, all pass** | — |

### Gate A — measured result, 2026-09-23

Live cross-check, four Prince George's County points, proj4 vs the ArcGIS
geometry service:

| Pair | Worst divergence | Tolerance | Verdict |
|---|---|---|---|
| EPSG:2248 → EPSG:4326 | **8.1e-6 deg ≈ 0.9 m** | 1.4e-5 deg | PASS — and the divergence is REAL |
| EPSG:2248 → EPSG:26985 | < 0.001 m | 0.001 m | PASS |

The 0.9 m is not an error. The county service applies a real NAD83→WGS84
transformation; the offline proj4 path applies a null shift. Both are correct
for the datum each names, and the difference is the NAD83/WGS84 realization.
The first tolerance written for this gate was 1e-7 deg, which **contradicted the
registry's own stated 1.0 m accuracy** — the gate caught it. The registry now
carries `engineDatumHandlingDiffers` so the disagreement is recorded on every
transform rather than absorbed by a wide tolerance, and the test asserts the
divergence is both within tolerance AND non-zero, so a silent loss of the
service's datum transformation would also fail.

**Consequence for drawings:** boundary geometry of record stays in EPSG:2248 and
is never round-tripped through EPSG:4326. A metre of datum ambiguity is larger
than the setback tolerances a plan is checked against.

### NCS DXF writer — landed 2026-09-23

`export/dxf-ncs.ts` on `@tarikjabiri/dxf`, replacing the hand-written DXF R12
writer in the diagnostic scripts. R12 carries no linetypes, no lineweights and
no text, so the approved-plan convention — existing contours thin and dashed
against heavier proposed — was not expressible, and every line arrived in the
recipient's CAD at one weight on one linetype.

Layer names follow the NCS / AIA CAD Layer Guidelines field structure
`<discipline>-<major>-<minor>[-<status>]`. The status field is what makes a set
readable: `C-TOPO-MAJR-E` existing against `C-TOPO-MAJR-N` proposed,
`C-BLDG-FTPR-N` against `C-BLDG-FTPR-D`. Ten legacy layer names that were not
conformant are corrected and recorded in `LEGACY_LAYER_ALIASES` so a diff
against an older export is explainable.

Differential on 1005 Rollins Ave, both writers from the same twin:

| | R12 (previous) | NCS (new) |
|---|---|---|
| Polyline entities | 34 | 34 |
| Linetype table | absent | present |
| Linetypes usable | none | DASHED, HIDDEN, PHANTOM, DASHDOT |
| Lineweights | none | 6 pen weights |
| Bytes | 21,951 | 20,149 |

**Two twin gaps the work surfaced**, both recorded rather than papered over:

1. `Surface` had no layer and silently landed on the non-plot layer in a real
   export. The unmapped-kind report caught it on its first run. An
   exhaustiveness test now fails if any `SiteFeature['kind']` lacks a layer.
2. `SiteFeature` has a **single `Contour` kind**, so the engine cannot
   distinguish existing county contours from proposed grading. The
   existing/proposed convention the approved plans use is therefore not
   expressible today. `MinorContour` and `ProposedContour` layers are
   forward-declared and marked "not yet emitted by the twin"; the C-400 grading
   work in Phase F adds the kinds.

The R12 writer is **retained** and the scripts emit both (`*.r12.dxf`) so
exports can be diffed rather than trusted, per amendment 1.

### CAD on the paid path — landed 2026-09-23

`siteplan.render_exports` now emits DXF, LandXML and GeoJSON beside the PDF and
stores each through `storeArtifact`. Before this the stage produced the PDF and
nothing else, so both DXF writers were reachable only from diagnostic scripts
while `editable_cad` was a priced add-on in `quote.ts` with no producer behind
it on a paid order.

Three rules the implementation holds to:

1. **It never fails the stage.** The plan is already rendered and stored. A DXF
   that did not write is a missing handoff file, not a missing plan, and
   re-running the drawing chain to recover one would be the wrong trade every
   time. Each format records its own outcome — a `documentId` or a reason.
2. **Nothing is fabricated.** GeoJSON needs a real transform. If neither the
   offline registry nor the county service can supply one, the file is ABSENT
   and says why. It is never written with untransformed State Plane numbers,
   which a conforming RFC 7946 reader would place off the coast of West Africa.
3. **Status travels inside the file.** A CAD file is emailed onward and leaves
   its portal behind, so the professional document status is stamped on the
   non-plot annotation layer along with the horizontal CRS, the vertical datum
   and the source provenance. There is no `SEALED` value the writer can stamp —
   the type has four unsealed states and nothing else, which is how amendment 9
   is enforced rather than merely documented.

Projection to the customer, per the engine's own rule that a stage output not
in `sitePlanDeliverable` is invisible:

```
render_exports.cadExports
  └─ worker buildSitePlanDeliverable → form_data.sitePlanDeliverable.dataExports
       └─ portal /deliverables/[id]/site-plan → "Engineering files" card
            └─ GET /api/site-plan/:intakeId/document?documentId=<id>
```

`dataExports` is optional in the portal's structural copy so orders delivered
before the exports existed keep rendering. A failed export is LISTED with its
reason rather than omitted — silence would read as "this plan has no CAD"
instead of "the CAD did not write this time". The download route intersects
`documentId` with `projectId = intakeId`, so it is a selector within an order
the caller is already authorised for and never a way out of it; an explicit id
that does not resolve returns 404 rather than falling back to the PDF under the
requested filename.

### Not done — stated so it is not mistaken for done

- CAD emission is **implemented and tested, not deployed.** No production order
  has run through it. The worker must be redeployed before a paying customer
  sees an Engineering Files card.
- `editable_cad` now has a producer, but the **add-on is still not linked to
  it** in `quote.ts` — buying the add-on and receiving the files are two
  separate facts today.
- `@turf/turf` and `geotiff` are installed and **unused**.
- Phase B (`packages/cad-kernel`) not started; the concept engine's own DXF
  writer and geometry kernel are still a second implementation.
- Nothing in this phase is **deployed**. Every item above is repo-state only.
