# Rollins Avenue — Revision 3, September 10, 2026

Continues the user-selected `porter-BEST-BACKUP.REVIEW.pdf`. That baseline and Revision 2 are preserved. The supplied plat remains the boundary survey of record; recorded easement status is accepted as confirmed by the applicant.

## Deliverables

- `Rollins-Avenue-Record-Coordinated-Site-Plan.pdf`: revised 36 × 24 inch C-001 with updated surface quantities and water-quality screening.
- `Rollins-Avenue-Supporting-Dossier.pdf`: ten pages, including the calculation on page 7 and its surface exhibit on page 10.
- `surface-takeoff.csv` and `surface-takeoff.json`: reproducible, unrounded takeoff data.
- `verification.json`, `validation.json`, and `completion-tracker.csv`: checks and remaining work.
- `sources/`: supplied plat, WSSC and foundation documents, plus planning and soils evidence.

## Completed this revision

Replaced the obsolete baseline drainage table with a takeoff of the current dwelling footprints, areaways, paving and leadwalks. Surfaces are clipped to each lot and overlapping areas counted once. Updated the civil sheet, supporting calculation and completion tracker. Added a surface exhibit. Previous Lot 2 positioning, areaway, leadwalk, recorded-area and annotation corrections are retained.

| Quantity | Lot 1 | Lot 2 |
|---|---:|---:|
| Recorded area, SF | 9,598 | 8,008 |
| Dwelling footprint, SF | 1,196.01 | 1,196.01 |
| Areaway, SF | 52.00 | 52.00 |
| Baseline paving, SF | 406.29 | 397.98 |
| Additional leadwalk, SF | 35.00 | 17.49 |
| Total depicted impervious, SF | 1,689.30 | 1,663.48 |
| Impervious percentage | 17.60% | 20.77% |
| One-inch screening WQv, CF | 166.69 | 158.13 |

The additional 513.72 SF of depicted hard surface outside the lots is reported separately. Its receiving drainage area has not been assigned. Categories are disjoint: paving excludes dwelling/areaway overlap, and added leadwalk excludes all previously counted surfaces. The roof footprint is a proxy pending complete roof/eave geometry.

The calculation uses I = impervious percentage, Rv = 0.05 + 0.009 I, and WQv = P × Rv × area(SF) / 12. P = 1 inch retains the baseline screening assumption. Both lots exceed 15% impervious cover. Formula verified against [Maryland Stormwater Design Manual, Chapter 2, §2.1](https://mde.maryland.gov/programs/Water/StormwaterManagementProgram/Documents/www.mde.state.md.us/assets/document/chapter2.pdf) on September 10, 2026. This is a lot-wide screening calculation, not a final ESD treatment-depth determination or storage design.

## Remaining work

The package remains preliminary. The supplied utility sketch confirms four separate public services and the lower private route toward Lot 2. The current site drawing still has incorrect upper private service extensions and a converged public junction; this revision does not claim those are corrected. A dimensioned reconciliation is required before issuing the utility layout for construction. Recorded status is not in dispute.

Complete grading, floor/slab and service invert design using a consistent vertical datum; resolve historical WSSC benchmark versus site-contour datum relationships. Complete facility tributaries, tested infiltration and groundwater inputs, ESD/storage/outlet/overflow design, ESC, frontage profiles, Lot 2 yard determination, environmental/landscape documentation, complete building/trade plans and professional execution. The former peak discharge values are not carried forward as verified design results.

Official county references: [Site/Road Design Review Checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/33110), [Fine Grading Design Checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/4549), [Fine Grading Submittal Checklist](https://www.princegeorgescountymd.gov/DocumentCenter/View/4569). These references were identified in the preceding review; this revision makes no new claim of completed agency review.

## Rebuild and validation

Run `build_package.py`, then `verify_package.py` with Python, PyMuPDF and Shapely. The builder checks the selected baseline's SHA256 before relying on its vector indices. Validation checks rendered building/areaway/walk geometry, clearances, source preservation, quantity arithmetic and page text bounds. Review the rendered PDFs as well. No original source signatures are applied to the revised design.
