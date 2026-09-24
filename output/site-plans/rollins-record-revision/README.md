# Rollins Avenue — record-coordinated revision

The user-selected `porter-BEST-BACKUP.REVIEW.pdf` remains the baseline and is unchanged. This folder continues that layout with Revision 2. The supplied plat is accepted as the boundary survey of record. The applicant confirms the easements are recorded; this revision does not request those same documents again.

## New physical corrections

- Added both 13 x 4 ft Kingsworth basement areaways from the supplied foundation drawing.
- Moved Lot 2's dwelling and stoop 0.70 ft toward Rollins Avenue so its areaway clears the current 8-ft side design line. The front clearance is 30.30 ft; minimum areaway boundary clearance is 8.11 ft. Lot 1 remains in place, with an 8.10-ft areaway clearance.
- Added continuous 5-ft leadwalk connections between each stoop and driveway.
- Removed the private-easement rectangular shading and its unsupported upper extension. Retained the lower private route as a line with no invented legal width. This does not resolve the public corridor geometry or all utility junctions.
- Added the WSSC as-built's three historical benchmark elevations to the source dossier: 213.89, 218.28 and 214.61 ft.
- Added the original Kingsworth basement/areaway sheet to the dossier and documented the source-controlled site changes.

Earlier record-area, note, label, vicinity-map, soils, stabilization and disturbance-outline corrections are retained. The drawn LOD remains 19,171 SF because the new areaways and walks are inside the already included full-lot work area. The original baseline drainage summary is explicitly preliminary and must be recalculated for the new areaways/walks and final tributary design.

## Deliverables

- `Rollins-Avenue-Record-Coordinated-Site-Plan.pdf`: one 36 x 24 inch civil sheet.
- `Rollins-Avenue-Supporting-Dossier.pdf`: nine supporting pages.
- `verification.json`: dimensions, geometry, changes and completion status.
- `completion-tracker.csv`: specific remaining work.
- `sources/`: original documents and the previously retrieved soils/planning evidence.

## Remaining technical limits

The plat establishes the recorded boundary; it does not itself show site-specific finished-floor, slab, proposed-grade or house-service invert elevations. The WSSC as-built adds historical benchmark/profile evidence. Its plotted DATUM 190/200 labels are profile baselines, not proof of a conversion to the NAVD88 contour dataset on the current plan. Resolve that vertical relationship before assigning construction elevations.

The source page-2 sketch identifies the 20-ft public corridor and private route. The current public corridor/services still require faithful geometrical reconciliation; the private legal width is not lettered on that source page. No wider private corridor or legal dimensions have been invented. Recorded status is acknowledged separately from drawing accuracy.

The selected 8-ft side-yard treatment for triangular Lot 2 remains the current design criterion, subject to the outstanding zoning determination. Geometry passing that criterion does not establish the agency's yard classification. The source house sheet supplies basement geometry; upper floor/roof/lateral/MEP designs and coordinated site-specific vertical design are not supplied by it. Stormwater facility hydraulics, infiltration/groundwater evidence, ESC engineering, final frontage design and professional execution remain unfinished.

This revision remains preliminary and is not represented as the completed full permit set.

## Rebuild

Run `build_package.py` using Python with PyMuPDF and Shapely, then `verify_package.py`. The builder checks the exact selected baseline hash before using PDF-vector identifiers. The source baseline and earlier revisions are preserved.
