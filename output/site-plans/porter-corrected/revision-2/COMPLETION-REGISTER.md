# Rollins Avenue — full permit set completion register

September 9, 2026. Lots 1 and 2, Porter Subdivision; 1005 and 1009 Rollins Avenue.

**Current deliverable: four-sheet preliminary civil review set, Revision 2. Not ready for permit submission or construction.**

Open `Rollins-Avenue-Civil-Review-Rev2.pdf`. Individual sheets are in `eplan/`. This revision continues the corrected four-sheet set; the BEST-BACKUP, canonical PDF and earlier correction PDF are preserved. No commits or pushes.

## Changes in this revision

- Restored six boundary references on the plans and a corresponding recorded bearing/distance schedule on C-001. Calls were read directly from the supplied recorded plat. The existing coordinate geometry is retained; the record/coordinate reconciliation below remains necessary.
- Applied distinct water and sanitary dash patterns consistently to public, private and house-service segments, with staggered W/S tags.
- Removed several internal drafting/source-processing statements from sheet text.
- Added actual public-to-service junction checks. The prior containment checks could pass while services remained disconnected.
- Added checks for both apron-to-curb connections, both driveway-to-apron connections and SWM clearance from buildings, walks, stoops, driveways and public sidewalks.

## Drawing index and completion requirements

| Discipline / deliverable | Available now | Work still required to finish |
|---|---|---|
| Civil C-001 — site, utilities, dimensions | Both lots, dwelling siting, frontage geometry, boundary call schedule, measured footprint clearances, preliminary services | Reconcile surveyed boundary/control, legal easements and public/service junctions; building projections; zoning yard determination; frontage approval; vicinity map and final site identification |
| Civil C-002 — disturbance and erosion control | Measured work-limit union; preliminary perimeter controls and access; sequence and stabilization note | Design control types/capacities, access dimensions, stockpiles, washout and offsite protections from actual grading; complete ESC approval package |
| Civil C-003 — record notes and calculations | Full recorded conditions, adjoiners, recorded control, preliminary runoff/WQv calculations and mapped-soil properties | Drainage-area map and flow paths; field grades; validated rainfall/Tc/design assumptions; complete ESD sizing, soils testing and facility hydraulics; current environmental approvals |
| Civil C-004 — details and utility reference | County details 300.01/300.07 and original utility sketch page 2 | Coordinated project utility details/profiles and approved frontage details; verify applicable current standard editions |
| Proposed grading and drainage plans/profiles | Existing contour context only | Field-run topo/control; finished floors, garage/basement/slab elevations, corner/spot grades, slopes, swales, outfalls, overflow paths, utility inverts, retaining design if needed |
| Stormwater plans/details/report | Reserved DW-1/DW-2 footprints and screening quantities | Approved concept 41230-2006-00 or current revision; infiltration/groundwater results; facility sections, dimensions, levels, storage, outlets, overflow and maintenance requirements |
| Landscape / tree conservation | Historical environmental findings only | Current exemption or applicable conservation approval; existing trees/clearing; landscape schedule and supported canopy calculations |
| Architectural set — each dwelling | One supplied Kingsworth foundation/basement source page | Confirm basement, rear areaway, optional one-car garage and veneer; project cover/code analysis, all floors, roof, elevations, sections, wall/egress details and coordinated site projections |
| Structural set — each dwelling | No complete project structural set located | Foundation design, framing, load paths, connections, lateral bracing and project calculations by responsible designer |
| Mechanical / electrical / plumbing / energy / fire | No project set located | Coordinate discipline documents and calculations required for the selected dwelling and application scope |
| Application records | Plat and historical approval identifiers | Owner/applicant contacts and authorization; current tax identifiers; actual responsible professionals; completed applicable county checklists and approval attachments; cost estimate and issuance prerequisites |

The county currently lists separate building/site-road, fine-grading, stormwater, infiltration and street-related checklists. Determine the applicable applications and complete their official forms; this register is not a signed county checklist. Source checked September 9, 2026: [DPIE Site/Road applications, forms and checklists](https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/plan-review/siteroad-plan-review/siteroad-applications-forms-checklists).

## Utility junctions requiring resolution

Distances are measured from each displayed public segment's eastern endpoint to its corresponding downstream house/private service geometry. They identify drawing discontinuities, not proposed pipe lengths or authorization to construct a straight connector.

| Service | Gap |
|---|---:|
| Lot 1 water | 1.441 ft |
| Lot 2 water | 10.075 ft |
| Lot 1 sanitary | 18.709 ft |
| Lot 2 sanitary | 27.343 ft |

The page-2 sketch shows a continuous connection arrangement. The current geometrical reconstruction does not reproduce it completely. Resolve the actual public/private transition with the surveyed easement limits and WSSC connection design. The private 10-foot working corridor is still unsupported by a recorded width. A containment result against that working corridor establishes only a geometric relationship, not a legal easement or agency approval. Main tie-in locations, depths and separation also remain unverified.

## Boundary reconciliation

The original plat was inspected upright at increased resolution. It letters N 79-29-14 E, S 10-30-46 E and N 51-58-25 W; current lot JSON inputs instead contain 04, 43 and 24 seconds respectively. The plat labels Lot 1's north line 176.36 ft and west segment 86.72 ft; current JSON uses 176.38 and 86.73. Lot 2's frontage is 134.64 ft on the plat versus 134.65 in the JSON. Lot 2's west line reads 179.66 ft, correcting the older handoff's 179.65 transcription. The common divider is 118.96 ft.

Revision 2 reports the recorded labels without changing coordinate geometry to force closure. The surveyor must reconcile the recorded calls and coordinate control before final design; the measured building clearances remain measurements of the retained model. Do not overwrite the generator's input calls independently of a coordinated boundary/control correction.

## Evidence needed next

1. Current field survey/topography with benchmark/datum, frontage elevations and utility locations/inverts.
2. Recorded private easement instrument/legal description and WSSC design/DA 4916 Z 08 commitment documents.
3. Approved stormwater concept 41230-2006-00 or revision, current exemption/conservation records, and site infiltration/groundwater report.
4. Complete Kingsworth architectural/structural source set and selected building options, including basement/areaway and veneer.
5. Owner/applicant information, responsible designer contacts, Lot 2 yard determination and frontage/driveway agency decision.

Once supplied, finish the dependent engineering and building sheets, regenerate the coordinated package, resolve this register, and obtain the responsible professionals' actual review/signatures. Do not remove preliminary status merely because files have been assembled.

## Reproduction and checks

From the repository root, using Python with PyMuPDF and Shapely installed:

```bash
python3 output/site-plans/porter-corrected/build_revision2.py
```

`verification.json` includes dimensional checks, disturbance and drainage quantities, boundary transcription, and separate failed utility continuity results. All four output pages were rasterized and visually inspected. Verification does not establish engineering adequacy, current legal compliance or final readiness. Prior readiness finding IDs R01–R13 remain the controlling wider review; this revision resolves only the changes expressly listed above.
