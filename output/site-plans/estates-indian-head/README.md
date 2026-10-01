# Estates at Indian Head — Site Development Concept package

Status: coordinated draft for licensed PE/LS review; not sealed and not ready for construction or filing until the outstanding professional and agency items below are resolved.

## Authoritative deliverables

| Deliverable | Purpose |
|---|---|
| `estates-indian-head.pdf` / `.dxf` | Current CAD-authored concept plan set. The DXF is the drawing master. |
| `estates-indian-head.sheetset.json` | Generated sheet, quantity, checklist, drainage, and geometry data used by CAD plot. |
| `estates-indian-head.twin.json` | Named site features used for geometric verification. |
| `estates-indian-head-DPIE-concept-application.pdf` | Filled DPIE application synchronized to generated impervious and LOD quantities. |
| `eplan-drawings/` | One PDF per sheet, short filenames, plus hashes and geometry-validation results in `manifest.json`. |
| `GEOTECH-DESKTOP-SCREENING.md` | Desktop geotechnical screening and field exploration/test plan; not a geotechnical report. |
| `source/` | Archived county, survey, environmental, and reference inputs. |

Files containing `concept-SDC`, `2026-concept-submission`, or `cad` in older names are superseded records and are not submission drawings.

## Implemented coordination corrections (2026-10-01)

1. Environmental baseline: mapped woody vegetation/possible woodland is carried conservatively in hydrology and shown on C-100. An updated NRI/TCP remains controlling.
2. Drainage: concept H&H and POI tables are generated from the same model. The off-site screening area requires field delineation; downstream receiving-system capacity remains a technical-design hold point.
3. Quantities: application values, plan tables, twin, and ePlan manifest are regenerated from the current sheet set.
4. Grading: the plan carries explicit hold points for positive drainage, Lot 1 stepped/retained treatment, and Lots 2–4. Generated grading is preliminary and cannot be staked until revised/accepted by the civil PE using field survey and geotechnical results.
5. Road type: Estates Court is rural open section. The DPIE application says open section, not closed section.
6. Zoning: the layout sheet includes an RR concept compliance matrix for lot area, coverage, and 25/8/20-ft setback standards; final survey/height certification governs.
7. Geotechnical: desktop sources and a site-specific field program are documented. E-1/E-2 remain outstanding because no borings or infiltration tests have been performed.
8. Utilities/access: proposed WSSC mains originate at Henrietta Drive and use the recorded/proposed easement route. Sizes/inverts and easement discrepancies remain to be resolved with WSSC.
9. ePlan: the combined plan is split into individually named sheet PDFs, hashed, and validated so the LOD does not cross building footprints and the SCE covers the entrance apron.

## Correct access condition

Estates Court forms a T-intersection with Jennifer Drive. Jennifer Drive is the frontage road between the subdivision entrance and MD 210. The existing physical separation/barrier between Jennifer Drive and MD 210 remains. The concept proposes no direct Estates Court access to MD 210 and no MD 210 auxiliary lanes. Sight distance is shown for Jennifer Drive at a preliminary 25 mph assumption and must be field verified.

The stabilized construction entrance covers the entire unpaved Jennifer Drive entrance apron and extends 30 feet into Estates Court, with at least 50 feet total vehicle travel length. Material and drainage notes follow MDE Detail B-1: 6-inch minimum 2–3-inch aggregate on nonwoven geotextile, with temporary pipe beneath the entrance wherever surface flow crosses. It is installed before permanent paving and not over existing Jennifer Drive pavement.

## Outstanding before filing / construction

- PE/LS design review, seals, certifications, owner signature, application contacts, fees, and agency upload.
- Field survey/datum reconciliation and final grading corrections; this draft is not for construction staking.
- Updated/revised NRI and M-NCPPC determination for TCP2 revision/new TCP or exemption.
- Geotechnical report, borings/test pits, groundwater observations, and infiltration testing.
- Downstream drainage survey/capacity analysis and final outlet protection/quantity-control design.
- WSSC 220SE01/as-builts, main sizes/inverts, acceptance of service routing, correction of recorded easement discrepancies, and grant of the Lot 4 easement.
- Field-verified Jennifer Drive sight distance and County access/road approval.
- Adjacent-owner notification affidavit and any reviewer-requested supporting documents.

## Regeneration order

1. `estates_indian_head_inputs.py`
2. `estates_indian_head_2009_layout.py`
3. `estates_indian_head_2009_features.py`
4. `generate-subdivision.ts` with `TWIN_JSON`, `SHEETSET_JSON`, and `CAD_PLOT`
5. `estates_indian_head_application.py`
6. `estates_indian_head_eplan.py`
