# Rollins Avenue completion work — selected baseline revision

Open **Rollins-Avenue-Updated-Site-Plan.pdf** first. This is a one-sheet revision of the exact user-selected `rollins-submission-review/porter-BEST-BACKUP.REVIEW.pdf`, not the four-sheet replacement. The original selected PDF remains unchanged.

**Status: preliminary; not a complete permit-ready package.** The available evidence supports document and quantity corrections. It does not support inventing field elevations, legal easement limits, approvals, signatures or missing architectural/structural design.

## Delivered

- Corrected recorded lot/net/gross areas and both project addresses.
- Actual per-lot footprint clearance measurements from the selected PDF's vector geometry, and separate dwelling coverage ratios.
- Corrected bearing/frontage labels and removed the erroneous frontage label from the southwest lot line. Coordinate geometry remains for survey reconciliation.
- Complete recorded conditions, including the full driveway condition; full adjoiner references in the supporting dossier; complete legend.
- Recorded vicinity inset, datum/contour interval beside the north arrow, soils component table and unsigned grading certificate block.
- Proposed full-lot disturbance outline and a measured 19,171 SF rounded union including depicted frontage/public corridor work. This is a proposed work scope; utility/ESC engineering may require changes to its extent.
- Standard stabilization note and coordinated general/construction notes replacing unsupported claims that proposed grades and utility elevations were already shown.
- Seven-page supporting dossier: record data, quantity basis, soils/environmental evidence, unsigned professional forms, preparation worksheet, original utility sketch and baseline drainage summary.
- Original-source copies, machine-readable verification and CSV completion tracker.

The source public/private utility geometry remains unresolved. Its drawn lines are not made legal or continuous by the added LOD. The source ESD locations and drainage summary remain preliminary. These items are explicitly open in `completion-tracker.csv`.

## Required inputs to finish the remaining work

| Input / action | Enables |
|---|---|
| Current field-run survey, benchmark/datum, frontage levels, utility locations/inverts | Proposed grading; floor/slab elevations; driveway profiles; utility profiles; drainage paths and outfalls |
| Recorded private utility easement and approved WSSC connection design / DA 4916 Z 08 commitments | Legal corridor and continuous service/junction design |
| Approved Concept 41230-2006-00 or applicable revision; infiltration/groundwater report | Complete stormwater sizing, sections, outlet/overflow and supporting calculations |
| Complete Kingsworth architectural/structural documents; selected basement/areaway/garage/veneer options | Coordinated building footprint, projections, full building/trade/energy package |
| Current tree conservation/exemption/floodplain evidence; landscape design | Environmental documentation and final planting/canopy schedules |
| Lot 2 yard determination; DPW&T frontage/driveway decision | Final zoning and street design |
| Owner/applicant contacts and authorization; actual responsible professional | Executed applications and certifications |

## Official forms and source status

DPIE requires applicable submittal and design-review checklists. The included worksheet is preparation material, not a completed or signed county form. County index checked September 9, 2026:

- [Site/Road applications and checklists](https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/plan-review/siteroad-plan-review/siteroad-applications-forms-checklists)
- [Building/site-road design checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/33110/Design-Review-Checklist-Building-Permit---Site-Road-Review-PDF)
- [Fine-grading design checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/4549)
- [Fine-grading submittal checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/4569)

The building checklist was readable through web retrieval; local download attempts at both county URLs returned HTTP 403. No downloaded official form is claimed. Do not reuse old fee amounts or mark outstanding items complete to populate a form.

The [historical Porter staff report](https://www.pgatlas.com/Documents/DAMS/SR_4-06111_2.pdf) confirms the concept identifier, not current approval validity. A targeted public search did not retrieve the actual concept engineering sheets, private legal instrument or surveyed Rollins grading information. The source folder includes the previously retrieved staff report and soils response. Original signatures in source copies apply only to their original instruments.

## Rebuild and validation

From the repository root, with Python, PyMuPDF and Shapely:

```bash
python3 output/site-plans/rollins-completion/build_package.py
python3 output/site-plans/rollins-completion/verify_package.py
```

The builder checks the selected baseline SHA-256 and aborts if it changes. Quantities are derived from the selected PDF, not another version's JSON. The PDF scale is checked against a 65-foot frontage and both 1,196-SF dwelling polygons. Baseline coordinate and legal-call discrepancies still require professional reconciliation.

All generated pages are rasterized for visual inspection. The verifier checks page counts, preservation of building vectors, complete record notes, replacement of stale sidebar text, source preservation and text bounds. These checks establish document consistency, not professional approval.
