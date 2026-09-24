# Rollins Avenue submission-readiness review

Review date: 2026-09-09. **NOT READY FOR SUBMISSION.** This is a document/visual review, not professional engineering certification or agency approval.

## Exact baseline

- `../porter-subdivision-permit-set.BEST-BACKUP.pdf`
- SHA-256: `c895fdd08bc08f67f5f60c392e245d13dd350564b62138d0b774290785b4f226`
- One sheet, C-001, 36 × 24 inches, labelled 1 inch = 20 feet, status PRELIMINARY.
- Projects: Porter Subdivision Lot 1 / 1005 Rollins Avenue and Lot 2 / 1009 Rollins Avenue.
- Original preserved. `porter-BEST-BACKUP.REVIEW.pdf` contains review annotations only; it is not a corrected permit set.

## Blocking findings and required resolution

| ID | Evidence in the supplied PDF / repository | Required resolution | Responsible party |
|---|---|---|---|
| R01 | Both footprints and the building-data table have blank grade, garage, basement and floor elevations. Existing contour mapping is expressly not field topography. No dimensioned proposed grading design, driveway profiles, utility inverts or demonstrated positive drainage is supplied. | Obtain field-run survey/control; establish applicable floor, corner, spot and utility elevations; design grades, slopes and overflow routes. Mark genuinely inapplicable basement entries only after building scope is settled. §32-130(a)(5),(9),(11); §32-151/162. | Surveyor and civil PE |
| R02 | PRELIMINARY status; designer/checker unfilled; seal, signature, date, licence and expiry unfilled. Owner/contact and parcel identifiers are missing. | Identify actual owner and responsible professionals; complete discipline certifications and review before changing status. A generic certification paragraph is not a signature or a grading certification. | Owner and responsible professionals |
| R03 | The green sanitary paths visibly leave the purple public WSSC easement. The private easement extends from Lot 1's northwest tip to its southeast rear corner; the page-2 connection sketch shows only the segment from the public connection toward the Lot 1/Lot 2 corner. Lot 2's service appears to start separately at that corner with a visible break from the depicted private corridor. | Reconcile all four services, connections and corridor boundaries with the controlling approved utility design and recorded easement. Obtain surveyed/legal corridor limits and demonstrate continuity and containment. Do not infer a legal corridor from a sketch or GIS parcel lines. | Civil PE, surveyor, WSSC |
| R04 | `porter-subdivision.plat-record.json` expressly calls the private easement's 10-foot width an assumption pending the recorded instrument. The sketch itself does not dimension that width. | Obtain the recorded private easement instrument/description and applicable WSSC design approval; replace assumed dimensions and routes with verified design. | Owner, surveyor, WSSC |
| R05 | Only summary pre/post Q and WQv values and two ESD rectangles (214/241 SF) are provided. No facility sections, elevations, outlet/overflow design, soil/infiltration verification or complete supporting calculation report. Concept 41230-2006-00 is referenced in plat notes; approved document absent from the records inspected. | Retrieve current approved concept or revision; complete drainage-area map and calculation report, facility design/details, outfall and overflow checks, and verify conformity/validity. A historical number does not establish current approval. | Civil PE / DPIE |
| R06 | Disturbance is labelled 16,789 SF '(AT LEAST)'. The sheet lacks a clear LOD legend/label, separate per-lot disturbance accounting, sediment-control layout/details and complete stabilization requirements. Earlier handoff says 6,856 SF, so it cannot validate this PDF's total. | Calculate the actual disturbance polygon, including offsite utility/frontage work; coordinate all plan sets; provide final erosion/sediment-control design, approvals and appropriate notes. | Civil PE / Soil Conservation District |
| R07 | No soils map/table/report, groundwater determination, TCP2/exemption, complete landscape schedule/canopy calculation or supported floodplain determination supplied. Wooded and floodplain areas read NOT ESTABLISHED. | Supply soils/geotechnical and groundwater evidence as applicable; tree conservation approval or valid exemption; landscape calculations/species/sizes; floodplain evidence or required delineation. Do not replace unknown areas with zero. | Civil PE, surveyor, environmental reviewer |
| R08 | Table says rear yard 20 feet required AND provided for the whole project. Lot 2 input instead uses `triangleRearAsSide: true`, with applicant-stated interpretation awaiting zoning confirmation. Coverage is aggregated at 13.6%, not stated separately for each lot. The southwest boundary is incorrectly labelled as FRONTAGE although Rollins frontage is east. | Resolve Lot 2 yard classification with applicable zoning/approvals; show required and measured actual setbacks by lot, including projections; correct frontage annotation and per-lot coverage. Do not move a dwelling until the controlling yard rule is established. | Designer / M-NCPPC |
| R09 | Site-data areas 9,599 / 8,009 / 21,826 SF conflict with recorded 9,598 / 8,008 / 21,825 SF in the same sheet's plat note. Net recorded lots total 17,606 SF; recorded dedication is 4,219 SF. | Label recorded areas consistently; if computed closure areas are retained, distinguish them explicitly. Reconcile bearings/dimensions to the plat through the surveyor; never adjust recorded calls merely to force area closure. | Surveyor / drafter |
| R10 | Plat note 3 ends 'issuance of street…'; adjoiners, reference and legend are also truncated. | Reflow full mandatory notes without ellipsis. Include the complete abutting-driveway condition; obtain DPW&T determination supporting separate aprons if proposed. Full note is in the JSON source. | Drafter / DPW&T |
| R11 | Front sidewalk is labelled 3 feet wide. Aprons visually meet the curb strip in this version; that does not establish compliant grades, widths or public-road approval. | Verify current DPW&T frontage/accessible-route requirements and any approved exception, driveway arrangement and street-work permit. Do not treat the old handoff's apron gap as a confirmed current defect. | Civil PE / DPW&T |
| R12 | Available Kingsworth PDF is one foundation/basement sheet, despite its filename. It includes a rear basement areaway and optional one-car garage. Both lot JSON files say `hasBasement: false` and `garage: attached_2_car`; footprint uses a 10-foot garage. The site sheet omits the rear areaway. | Settle actual building option; reconcile footprint, garage, basement, areaway, veneer projections and site clearances. Provide project-specific cover/code analysis, all floor/framing plans, elevations, sections, wall details and separate lateral-bracing sheet, plus applicable trade/energy/fire documents. | Owner / architect / structural PE |
| R13 | No current stormwater approval package, WSSC DA 4916 Z 08 commitment evidence, completed county submission/design checklists, owner authorization, cost estimate or associated current permit/approval evidence located in the inspected project material. | Assemble each application's supporting records. Separate items needed at initial screening from final issuance prerequisites (approved plans, easements, agreements, bonds, fees and signoffs as applicable). Verify current fee/format instructions; repo fine-grading checklist is dated 2015. | Applicant / permit coordinator |

## What this version does satisfy or improve

- Single-sheet PDF, readable vector text, north arrow, graphic scale and horizontal/vertical datum labels. Physical sheet size is within the grading-plan maximum when oriented 24 × 36 inches.
- Both lots, house footprints, existing contours, roadway, utility routes, ESD footprints and relevant reference details are present.
- The Lot 2 ESD rectangle visually clears the front walk and house in this PDF. Hydraulic, grading and separation compliance remains unverified.
- Both apron polygons visually touch the curb strip. Line/grade, dimensions and approval remain outstanding.
- No full architectural set is contained in this site-plan PDF; naming it a permit set does not establish completeness.

## Record-backed correction values

- Lot 1: 9,598 SF; Lot 2: 8,008 SF; net lots: 17,606 SF.
- Public dedication: 4,219 SF; gross recorded tract: 21,825 SF.
- Building footprint shown: 1,196 SF each. Building-footprint-only ratios are 12.46% for Lot 1 and 14.94% for Lot 2. These are NOT a substitute for a complete zoning lot-coverage calculation including all applicable structures/projections.
- Preserve the full driveway condition: “The applicant, his heirs, successors and or assignees shall utilize an abutting driveway design, constructed per DPW&T standards and requirements. Separate, standard residential driveway aprons shall be provided along Rollins Avenue, if deemed appropriate by DPW&T upon the issuance of street construction permits.” Verify against the recorded instrument before final drafting.

## Source evidence reviewed

- `existing site plans/Rollins Ave lots.pdf`: recorded Porter plat.
- `existing site plans/ScanRollions SW Easemenmt.pdf`: three pages, especially page 2 connection sketch.
- `existing site plans/ScanRollins Easement.pdf`: vicinity/easement reference.
- `existing site plans/Kingsworth 2nd & basement floor plan.pdf`: one foundation/basement sheet.
- `output/site-plans/porter-lot1.plat.json`, `porter-lot2.plat.json`, `porter-subdivision.plat-record.json`.
- `docs/site-plan-reference/dpie/min-plan-submission-rqmts.pdf` (Rev. January 2024).
- `docs/site-plan-reference/dpie/submittal-checklist-site-dev-fine-grading.pdf` (2015; historical checklist, not current fee authority).
- `docs/site-plan-reference/CHECKLIST-FINDINGS.md` and `packages/spatial-engine/src/jurisdictions/pg-subtitle-32.ts`.
- Current county building/site review sources consulted in this session: [Building review forms](https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/about-dpie/resources/forms-checklists/building-plan-review-forms), [Site/road review forms](https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/about-dpie/resources/forms-checklists/siteroad-plan-review-forms-checklists), [Building permit site/road checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/33110/Design-Review-Checklist-Building-Permit---Site-Road-Review-PDF).

## Completion boundary

This review identifies the actual drawing defects and unresolved evidence; it does not certify undocumented engineering or approve the lots. No plan geometry was changed because the unresolved surveyed elevations, legal easement limits, building options and agency decisions control dependent corrections. The supplied BEST-BACKUP PDF and existing generator edits were preserved. Complete the missing evidence, then revise, regenerate and inspect the resulting drawings against this register before submission.
