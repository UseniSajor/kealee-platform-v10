# Floodplain and Hydraulic Study
## North Branch Broad Creek at Fort Foote Road
### Indian Queen East, Lots 53–56 — 9588, 9584, 9580 and 9576 Fort Foote Road, Prince George's County, Maryland

Prepared 2026-09-11. Horizontal datum EPSG:2248 (Maryland State Plane, NAD 83, US survey feet). Vertical datum NAVD88.

> **STATUS — READ THIS FIRST.** This is a PRELIMINARY FEASIBILITY study. It is not a
> permit-level submission and it is not sealed. It is built on published county LiDAR
> terrain and public data, not on a field survey, and the existing culvert has never
> been measured. Section 12 lists what must be obtained before any of this can be
> certified. The findings are strong enough to act on and not strong enough to file.

---

## 1. Executive summary and conclusion

**These four lots lie in the headwater pond of a road crossing on a named stream, and
the crossing is badly undersized. The site plan as currently drawn puts two dwellings
at the 100-year water surface and all four basements between 3.6 and 8.7 ft below it.**

The findings, in order of how much they change the project:

1. **The contributing drainage area is 397 acres (0.620 sq mi), not the 39.1 acres carried in the earlier drainage work.** The earlier delineation captured one tributary of the valley and stopped at the edge of its own terrain model. The 100-year peak discharge at the crossing is **1,061 cfs**, not 94.9 cfs — a factor of eleven.

2. **Fort Foote Road overtops in every storm from the 10-year up.** The road sag is EL 54.00 and the computed 10-year headwater is EL 54.60, with 250 cfs crossing the pavement. At the 100-year, 956 cfs of the 1,061 cfs total goes over the road rather than under it. The road, not the culvert, is what presently controls the flood elevation.

3. **The 100-year water surface across the lots is EL 55.47 (existing condition).** It is essentially flat — the reach is a backwater pond, not a flowing channel, with velocities under 1 fps throughout.

4. **This computed elevation independently corroborates the floodplain of record.** FPS-770017 states 57 ft ± in the WSSC datum. Section 3 establishes that the WSSC datum is NGVD 29 based and that NGVD 29 − NAVD 88 = 0.66 ft here, so 57 WSSC ≈ EL 56.3 NAVD 88. The model gives EL 55.47 — within 0.87 ft of a number computed by other people, by other means, forty-eight years ago.

5. **Upsizing the culvert barely helps.** Because the road weir dominates, going from 36 in to 96 in lowers the 100-year headwater from EL 55.45 to EL 54.87 — 0.58 ft for roughly eight times the pipe. The 48 in pipe previously proposed for the rear easement is not a floodplain solution and was sized against a discharge an order of magnitude too small.

6. **The proposed grading RAISES the 100-year water surface by 0.04 ft** at RS +75. That is not a no-rise condition and it is not a rounding error.

7. **The proposed grading removes 2,908 cubic yards of floodplain storage** below the 100-year surface, out of 3,666 cy of fill in the reach. Compensatory storage is required.

8. **Freeboard fails on every lot.** Table 1.1.

**Table 1.1 — Proposed dwelling elevations against the 100-year water surface (EL 55.53, proposed condition)**

| Lot | Address | Finished floor | Freeboard to FFE | Garage slab | Basement floor | Basement below flood |
|---|---|---|---|---|---|---|
| 53 | 9588 | 59.22 | +3.69 ft ok | 58.89 | 50.22 | **5.31 ft** |
| 54 | 9584 | 55.97 | +0.44 ft **FAIL** | 55.64 | 46.97 | **8.56 ft** |
| 55 | 9580 | 56.00 | +0.47 ft **FAIL** | 55.67 | 47.00 | **8.53 ft** |
| 56 | 9576 | 61.01 | +5.48 ft ok | 60.68 | 52.01 | **3.52 ft** |

Prince George's County Subtitle 4 and the NFIP both require the lowest floor — basement included — to be at or above the base flood elevation, and the county applies freeboard above that. A basement 8.7 ft below the 100-year water surface is not a design that can be permitted, conditioned or waived. It has to change.

### Conclusion

**The proposed improvements do not remove these lots from the floodplain, and as drawn they make the flood condition marginally worse.** The proposed condition still leaves 
53,000 sq ft of the four lots below the 100-year water surface, against 61,900 sq ft existing.

Removing the lots from the floodplain is physically possible but it is a different and much larger project than the one on the table: it means replacing the Fort Foote Road crossing with a structure big enough to stop the road overtopping, which is a county roadway and drainage project, not a four-lot site plan. Section 11 sets out the options.

---

## 2. Drainage area and existing-condition hydrology

### 2.1 Delineation

| Quantity | Value |
|---|---|
| Contributing area at the crossing | **396.9 ac = 0.6202 sq mi** |
| Channel-only area immediately upstream | 368.8 ac |
| Longest flow path | 7,986 ft |
| Elevation at the hydraulic divide | EL 154.98 |
| Total fall along the flow path | 99.5 ft approx |
| Receiving stream | North Branch Broad Creek (PGAtlas Environmental/1, feature code 4109) |

Delineated by D8 flow routing on the USGS 3DEP bare-earth DEM (published to 24 August 2026), resampled to 10 ft cells over a 10,000 by 10,000 ft window, depression-filled by priority flood. The pour point was snapped to the maximum-accumulation cell within 60 ft of the Fort Foote Road sag.

> **Why the earlier 39.1-acre figure was wrong.** The earlier delineation ran on a DEM interpolated from county 2-ft contours over a 4,000 ft window centred on the site. The watershed is 6,400 ft long. The flow path ran off the edge of the model and the delineation stopped there, capturing the lower tributary and none of the upper watershed. Re-run over a window large enough to contain the divide, the same algorithm gives 396.9 ac. Every discharge, pipe size and headwater in the earlier drainage work follows from the truncated figure and none of them survive.

### 2.2 Land cover, measured

| Cover | Fraction | Area |
|---|---|---|
| Impervious | 23.9% | 94.8 ac |
| Tree canopy | 36.8% | 146.1 ac |
| Open space / lawn | 39.3% | 156.1 ac |

Measured cell by cell against the county's own Impervious Surface (2023) and Tree Canopy (2023) layers, not assumed from a zoning category.

**Hydrologic soil groups** (NRCS soil survey, area MD033), as a fraction of the watershed:

| Group | Fraction |
|---|---|
| C | 52.6% |
| B/D | 4.4% |
| D | 3.6% |
| A | 36.2% |
| B | 3.2% |
| C/D | 0.0% |

Dual groups (B/D, C/D) are taken at the D value. These are hydric, frequently-flooded soils in the valley bottom; undrained is the design condition and the conservative one.

### 2.3 Curve number

| Cover | Fraction | CN | Source |
|---|---|---|---|
| Impervious (roofs, roads, drives, walks) | 23.9% | 98.0 | TR-55 Table 2-2 |
| Woods, good condition | 36.8% | 55.6 | TR-55 Table 2-2 |
| Open space / lawn, good condition | 39.3% | 61.4 | TR-55 Table 2-2 |
| **Composite** | **100%** | **68.0** | area weighted |

### 2.4 Time of concentration

| Segment | Length | Slope | Velocity | Travel time |
|---|---|---|---|---|
| Sheet flow, lawn/woods at the divide | 100 ft | 2.84% | 0.13 fps | 0.2093 hr |
| Shallow concentrated, unpaved | 1,300 ft | 1.36% | 1.88 fps | 0.1919 hr |
| Channel, North Branch Broad Creek | 6,424 ft | 1.36% | 3.92 fps | 0.4554 hr |
| **Total Tc** | | | | **0.857 hr (51.4 min)** |

### 2.5 Design discharges

Rainfall: NOAA Atlas 14 Volume 2 Version 3, PFDS point estimate, 38.7611 N 77.0115 W, partial duration series, retrieved 2026-09-11.

| Storm | 24-hr rainfall | Runoff depth | Ia/P | q_u | **Peak discharge** | Runoff volume |
|---|---|---|---|---|---|---|
| 10-year | 4.81 in | 1.75 in | 0.196 | 324 csm/in | **351 cfs** | 57.7 ac-ft |
| 25-year | 6.01 in | 2.63 in | 0.157 | 350 csm/in | **571 cfs** | 86.9 ac-ft |
| 50-year | 7.08 in | 3.47 in | 0.133 | 367 csm/in | **792 cfs** | 114.9 ac-ft |
| 100-year | 8.29 in | 4.48 in | 0.114 | 382 csm/in | **1,061 cfs** | 148.2 ac-ft |

Method: NRCS TR-55 graphical peak discharge, Type II distribution. See `packages/spatial-engine/src/hydraulics/tr55.ts` for the implementation and the reasoning on why the Rational Method is not used at this scale.

> **Cross-check.** The Rational Method at C = 0.45 and the 51-minute intensity gives roughly 625 cfs at the 100-year against TR-55's 1,061 cfs. The spread between methods is itself a finding: the design value carried forward is the TR-55 figure because it is the county-accepted method at this area, and because it is the conservative one. MDE may require TR-20 or the USGS Maryland Fixed Region regression at final design, and neither has been run here.

---

## 3. Vertical datum — the 1979 elevation resolved

FPS-770017 states the 100-year floodplain adjacent to these lots as **57 ft ± in the WSSC datum**. That number has been unusable for as long as the datum relationship was unknown. It is now established, within the limits stated below.

Four NGS marks within 1.2 miles of the site, two of them monumented by WSSC itself in 1969–70, carry both NGVD 29 and NAVD 88 heights:

| PID | Designation | NGVD 29 | NAVD 88 | Difference |
|---|---|---|---|---|
| HV4763 | 17378 WSSC 1970 | 42.6 m | 42.4 m | −0.66 ft |
| HV4762 | 17379 WSSC 1970 | 35.9 m | 35.7 m | −0.66 ft |
| HV4728 | FOOTE | 48.3 m | 48.1 m | −0.66 ft |

**NAVD 88 = NGVD 29 − 0.66 ft** at this site, consistently, by VERTCON3.

WSSC set marks in this area in 1969–70 which NGS published on NGVD 29, the national datum of that era. On that basis the WSSC datum is NGVD 29 based and:

> **57 ft WSSC ≈ EL 56.3 NAVD 88**

The independent hydraulic model in Section 6 gives a 100-year water surface of **EL 55.47 NAVD 88**. The two agree to 0.87 ft.

> **Correction to earlier project correspondence.** An earlier note in this project projected the offset as "NAVD 88 ≈ WSSC − 7 to −10 ft". That was wrong by an order of magnitude. It was inferred from a comparison of the stated floodplain elevation against the road elevation, on the assumption that the road could not be below the floodplain. The road IS below the floodplain — that is the central finding of this study — so the inference had a false premise. The correct offset is −0.66 ft and it is measured, not inferred.

**Limitation.** This establishes the NGVD 29 to NAVD 88 relationship rigorously. It does NOT prove that the 1978 consultant worked in true NGVD 29 rather than an assumed local datum. The field topographic survey in the project record carries three benchmarks — **H31A at EL 61.09, H32A at EL 74.37 and H32B at EL 88.41** — and levelling to those three marks is the one observation that closes this question. It is the first item on the survey scope in Section 12.

---

## 4. Survey and topographic data sources

| Source | Used for | Standing |
|---|---|---|
| PGAtlas Contour 2 Ft (2023), NAVD 88 | Cross sections, road profile, inundation mapping | County-published LiDAR derivative. Adequate for feasibility. NOT a survey. |
| USGS 3DEP bare-earth DEM | Watershed delineation only | Area is an integral and robust to resolution. |
| PGAtlas Impervious Surface (2023), Tree Canopy (2023) | Curve number | Measured cover. |
| NRCS soil survey MD033 | Hydrologic soil group | |
| NOAA Atlas 14 Vol. 2 Ver. 3 | Rainfall | Partial duration series. |
| NGS marks HV4762/HV4763/HV4728 | Vertical datum | Published control. |
| Field topographic survey, project record | Corroboration; benchmarks; the plotted floodplain limit | See below. |

### 4.1 The field topographic survey

The project record holds a scanned field topographic survey of these lots — `existing site plans/Indian Queen lots floodplain topo.pdf` and two further scans of the same sheet — at 1 in = 50 ft, carrying spot elevations, 2-ft contours, the lot lines, three benchmarks, and a floodplain limit plotted in red around the rear of Lots 55 and 56 and along the frontage of Lots 53 and 54.

**It could not be georeferenced to survey standard from the scan alone, and it was not used as the terrain for this model.** The reasons are specific:

- The sheet is drawn on a **local grid** (labelled N-46500 to N-47000 and E-500 to E-1250 at 250 ft spacing) whose relationship to Maryland State Plane is not printed on the sheet and is not otherwise recorded. The grid's northing increases southward and its easting increases westward, so it is not a State Plane subset.
- Registration was attempted four ways — against the platted lot geometry, against the county road centreline, by Hough line matching on the drawn boundaries, and by correlating the drawn contours against the LiDAR surface. The best fits disagreed with each other by more than 20 ft and none survived visual overlay.
- Its own drawn boundary lines do not match the platted bearings closely enough to serve as control, which suggests they are reference projections rather than surveyed lines.

What the sheet DOES establish, and what has been used:

- **The three benchmarks** (H31A 61.09, H32A 74.37, H32B 88.41) that will close the datum.
- **Spot elevations** in the valley bottom of 47.7 to 49.3 and on Fort Foote Road of 56.3, against LiDAR readings of 46.1 to 47.5 and 54.0 in the same places — a consistent offset of roughly 1 to 2 ft in the direction the datum work in Section 3 predicts.
- **The plotted floodplain limit wraps the rear of the lots and crosses the road**, which is the same picture this model produces and the opposite of a floodplain confined to a channel.

Re-establishing that sheet on State Plane is an hour of a surveyor's time and is in the Section 12 scope. It is not a substitute for the new survey; it is how the 1978 work gets reconciled with the new work.

---

## 5. The regulatory floodplain, floodway and flood zone

| Authority | Mapping | Finding |
|---|---|---|
| FEMA NFHL / FIRM panel 24033C0220E, eff. 2016-09-16 | Zone X, SFHA_TF = F | All four lots are OUTSIDE the FEMA special flood hazard area. No BFE is published. Nearest Zone AE is about 2,000 ft away. |
| PGAtlas Floodplain (FEMA − 2026), Environmental/3 | Zone X | Same finding on the current county rendering. |
| PGAtlas Floodplain (DPIE), Environmental/31 | no feature on the lots | |
| PGAtlas Floodplain − Consultant Study (DPIE), Environmental/33 | FPS-770017 limit line, tangent to Lot 53 at 0.1 ft | The county floodplain of record for this valley. |

**There is no mapped regulatory floodway here**, because there is no detailed FEMA study on this reach — Zone X carries neither a BFE nor a floodway. That is a statement about FEMA's mapping programme, not about the flood risk, and Prince George's County does not treat it as one.

### 5.1 The county floodplain governs, not FEMA

Prince George's County regulates the 100-year floodplain of any watercourse with a drainage area at or above a threshold well below the 397 acres here, whether or not FEMA has studied it. Where the county has no detailed study it requires the applicant to produce one — which is what an FPS number is. Zone X is therefore NOT a finding that these lots are outside the regulated floodplain. It is a finding that FEMA has not mapped this stream.

### 5.2 The chain of studies of record

| Study | Plan date | County comment |
|---|---|---|
| FPS-770017 | 1978-10-09 | "No cross sections on plans, revised based on FPS 960004" |
| FPS 960004 | 1997-07-01 | "multiple plan sheets, revised based on FPS 200546, legacy study FPS 770017" |
| **FPS 200546** | **2005-08-01** | **"post development flood plain used, legacy studies FPS 960004 and FPS 200380"** |

**FPS 200546 is the controlling study of record and it is not in the project file.** It must be obtained from DPIE before anything is filed. This study is built independently of it and will have to be reconciled against it.

### 5.3 The floodplain easement — resolved

The 1979 DPW&T letter in the project record (W. E. Miller) states that the floodplain easement was "apparently not granted on Lots 53 and 54 — check out before release of permits". The title search reports clean. Both are correct, and the county's own easement layer explains why:

> PGAtlas Easement/0 (Environmental and Cultural, Platted) carries **one** floodplain easement named "Indian Queen East", **5.32 acres**, dedicated on **Record Plat 118-083**, recorded **17 January 1984**.

That easement lies **entirely south of Fort Foote Road**, between 83.7 and 237.4 ft from the nearest corner of these lots. **It covers none of Lots 53–56.**

So a floodplain easement in this subdivision was granted — six years after FPS-770017, by record plat dedication, on the downstream side of the road. These four lots were platted a decade earlier on Plat Book WWW 65 folio 60 and were never brought into it. The clean title is not good news; it is the 1979 concern confirmed.

Plat 118-083 is also the template: it is how this county, in this subdivision, on this stream, has already done exactly the dedication that Lots 53–56 now need.

---

## 6. Hydraulic methodology, model and existing-condition results

### 6.1 Method

One-dimensional steady gradually-varied flow by the standard step method, with conveyance subdivided at the bank stations, the energy coefficient alpha computed from the subsection conveyances, average-conveyance friction slope averaging, and automatic expansion/contraction coefficients. This is the HEC-RAS steady-flow formulation (Hydraulic Reference Manual, Chapter 2) implemented directly in the platform at `packages/spatial-engine/src/hydraulics/standard-step.ts`, so that every value in the profile tables traces to the line of code that produced it.

> **HEC-RAS itself was not run and no HEC-RAS plan, geometry or flow files exist.** The deliverable list asks for them. They cannot be produced here and they will be required at permit level. The formulation is the same; the software of record is not. Section 12.

The crossing is analysed to FHWA HDS-5 (FHWA-HIF-12-026, 3rd edition), inlet control and outlet control both computed at every discharge, with the roadway treated as a broad-crested weir and the headwater solved so that culvert plus weir carries the total flow.

### 6.2 Model layout

| Item | Value |
|---|---|
| Cross sections | 7 downstream of the road, 9 upstream |
| Reach modelled | 460 ft below the crossing to 470 ft above it |
| Station convention | RS in feet from the road sag; **+ is upstream** |
| Channel Manning n | 0.045 |
| Overbank n, wooded | 0.100 |
| Overbank n, graded lawn (proposed only) | 0.035 |
| Downstream boundary | Normal depth on the surveyed channel slope of 1.20 percent, applied 460 ft below the crossing so the boundary assumption has decayed out of the answer at the road. |
| Road sag elevation | EL 54.00 |
| Roadway crest available as weir | 185 ft |
| Culvert assumed | 36 in RCP, inlet invert EL 44.66, outlet invert EL 41.00 |

> **The culvert has never been measured.** Its size, material, inverts, length, skew and entrance treatment are all assumed. Section 7 shows that the answer is remarkably insensitive to barrel size — which is itself the finding — but the inverts matter and they are the single highest-value item on the survey scope.

### 6.3 Existing-condition water-surface profiles

**10-year, Q = 351 cfs**

| Section | Invert | Water surface | Energy grade | Velocity | Top width | Froude | Max depth |
|---|---|---|---|---|---|---|---|
| RS -70 | 41.00 | 43.04 | 43.62 | 6.12 fps | 49 ft | 1.00 | 2.04 ft |
| RS -115 | 40.50 | 42.81 | 42.88 | 2.13 fps | 177 ft | 0.39 | 2.31 ft |
| RS -170 | 40.42 | 42.53 | 42.60 | 2.13 fps | 211 ft | 0.43 | 2.11 ft |
| RS -230 | 39.50 | 41.52 | 41.79 | 4.17 fps | 156 ft | 1.00 | 2.02 ft |
| RS -300 | 38.93 | 40.86 | 40.94 | 2.21 fps | 175 ft | 0.41 | 1.93 ft |
| RS -380 | 38.70 | 39.70 | 39.97 | 4.23 fps | 149 ft | 1.00 | 1.00 ft |
| RS -460 | 36.63 | 38.26 | 38.41 | 3.14 fps | 138 ft | 0.62 | 1.63 ft |
| **ROAD** | | **HW EL 54.60** | | | | | inlet control |
| RS +15 | 48.25 | 54.60 | 54.60 | 0.32 fps | 465 ft | 0.04 | 6.35 ft |
| RS +40 | 47.69 | 54.60 | 54.60 | 0.39 fps | 356 ft | 0.04 | 6.91 ft |
| RS +75 | 44.66 | 54.60 | 54.60 | 0.38 fps | 226 ft | 0.03 | 9.94 ft |
| RS +120 | 44.97 | 54.60 | 54.61 | 0.28 fps | 251 ft | 0.02 | 9.63 ft |
| RS +175 | 45.44 | 54.61 | 54.61 | 0.22 fps | 317 ft | 0.02 | 9.17 ft |
| RS +240 | 46.25 | 54.61 | 54.61 | 0.22 fps | 279 ft | 0.02 | 8.36 ft |
| RS +310 | 47.37 | 54.61 | 54.61 | 0.26 fps | 276 ft | 0.02 | 7.24 ft |
| RS +390 | 48.56 | 54.61 | 54.61 | 0.33 fps | 254 ft | 0.03 | 6.05 ft |
| RS +470 | 49.09 | 54.61 | 54.61 | 0.39 fps | 231 ft | 0.04 | 5.52 ft |

Tailwater below the road EL 43.04. Culvert carries 100 cfs; **250 cfs passes over Fort Foote Road.**

**25-year, Q = 571 cfs**

| Section | Invert | Water surface | Energy grade | Velocity | Top width | Froude | Max depth |
|---|---|---|---|---|---|---|---|
| RS -70 | 41.00 | 43.57 | 44.22 | 6.47 fps | 68 ft | 1.00 | 2.57 ft |
| RS -115 | 40.50 | 43.09 | 43.20 | 2.65 fps | 185 ft | 0.43 | 2.59 ft |
| RS -170 | 40.42 | 42.77 | 42.88 | 2.65 fps | 216 ft | 0.47 | 2.35 ft |
| RS -230 | 39.50 | 41.78 | 42.08 | 4.32 fps | 194 ft | 0.92 | 2.28 ft |
| RS -300 | 38.93 | 41.18 | 41.29 | 2.63 fps | 191 ft | 0.44 | 2.25 ft |
| RS -380 | 38.70 | 39.92 | 40.29 | 4.85 fps | 161 ft | 1.00 | 1.22 ft |
| RS -460 | 36.63 | 38.56 | 38.77 | 3.69 fps | 150 ft | 0.64 | 1.93 ft |
| **ROAD** | | **HW EL 54.91** | | | | | inlet control |
| RS +15 | 48.25 | 54.91 | 54.92 | 0.47 fps | 483 ft | 0.05 | 6.66 ft |
| RS +40 | 47.69 | 54.91 | 54.92 | 0.56 fps | 381 ft | 0.06 | 7.22 ft |
| RS +75 | 44.66 | 54.91 | 54.92 | 0.57 fps | 240 ft | 0.05 | 10.25 ft |
| RS +120 | 44.97 | 54.92 | 54.93 | 0.42 fps | 257 ft | 0.03 | 9.95 ft |
| RS +175 | 45.44 | 54.92 | 54.93 | 0.33 fps | 323 ft | 0.03 | 9.48 ft |
| RS +240 | 46.25 | 54.93 | 54.93 | 0.34 fps | 291 ft | 0.03 | 8.68 ft |
| RS +310 | 47.37 | 54.93 | 54.93 | 0.40 fps | 281 ft | 0.03 | 7.56 ft |
| RS +390 | 48.56 | 54.93 | 54.93 | 0.49 fps | 258 ft | 0.04 | 6.37 ft |
| RS +470 | 49.09 | 54.93 | 54.93 | 0.59 fps | 236 ft | 0.05 | 5.84 ft |

Tailwater below the road EL 43.57. Culvert carries 102 cfs; **469 cfs passes over Fort Foote Road.**

**50-year, Q = 792 cfs**

| Section | Invert | Water surface | Energy grade | Velocity | Top width | Froude | Max depth |
|---|---|---|---|---|---|---|---|
| RS -70 | 41.00 | 43.99 | 44.66 | 6.54 fps | 91 ft | 1.00 | 2.99 ft |
| RS -115 | 40.50 | 43.31 | 43.46 | 3.09 fps | 191 ft | 0.47 | 2.81 ft |
| RS -170 | 40.42 | 42.94 | 43.09 | 3.14 fps | 220 ft | 0.52 | 2.52 ft |
| RS -230 | 39.50 | 42.01 | 42.32 | 4.46 fps | 207 ft | 0.85 | 2.51 ft |
| RS -300 | 38.93 | 41.44 | 41.57 | 2.95 fps | 204 ft | 0.45 | 2.51 ft |
| RS -380 | 38.70 | 40.11 | 40.55 | 5.28 fps | 173 ft | 1.00 | 1.41 ft |
| RS -460 | 36.63 | 38.80 | 39.07 | 4.11 fps | 159 ft | 0.66 | 2.17 ft |
| **ROAD** | | **HW EL 55.18** | | | | | inlet control |
| RS +15 | 48.25 | 55.18 | 55.19 | 0.58 fps | 500 ft | 0.06 | 6.93 ft |
| RS +40 | 47.69 | 55.18 | 55.19 | 0.71 fps | 401 ft | 0.07 | 7.49 ft |
| RS +75 | 44.66 | 55.18 | 55.20 | 0.74 fps | 251 ft | 0.06 | 10.52 ft |
| RS +120 | 44.97 | 55.19 | 55.20 | 0.56 fps | 263 ft | 0.04 | 10.22 ft |
| RS +175 | 45.44 | 55.20 | 55.20 | 0.44 fps | 327 ft | 0.03 | 9.76 ft |
| RS +240 | 46.25 | 55.20 | 55.20 | 0.45 fps | 301 ft | 0.03 | 8.95 ft |
| RS +310 | 47.37 | 55.20 | 55.21 | 0.53 fps | 285 ft | 0.04 | 7.83 ft |
| RS +390 | 48.56 | 55.20 | 55.21 | 0.64 fps | 261 ft | 0.05 | 6.64 ft |
| RS +470 | 49.09 | 55.20 | 55.21 | 0.77 fps | 240 ft | 0.07 | 6.11 ft |

Tailwater below the road EL 43.99. Culvert carries 104 cfs; **688 cfs passes over Fort Foote Road.**

**100-year, Q = 1,061 cfs**

| Section | Invert | Water surface | Energy grade | Velocity | Top width | Froude | Max depth |
|---|---|---|---|---|---|---|---|
| RS -70 | 41.00 | 44.45 | 45.00 | 5.97 fps | 161 ft | 1.00 | 3.45 ft |
| RS -115 | 40.50 | 43.54 | 43.73 | 3.52 fps | 196 ft | 0.50 | 3.04 ft |
| RS -170 | 40.42 | 43.15 | 43.34 | 3.56 fps | 223 ft | 0.54 | 2.73 ft |
| RS -230 | 39.50 | 42.22 | 42.58 | 4.80 fps | 214 ft | 0.83 | 2.72 ft |
| RS -300 | 38.93 | 41.71 | 41.87 | 3.27 fps | 216 ft | 0.47 | 2.78 ft |
| RS -380 | 38.70 | 40.32 | 40.82 | 5.72 fps | 182 ft | 1.00 | 1.62 ft |
| RS -460 | 36.63 | 39.06 | 39.38 | 4.51 fps | 169 ft | 0.67 | 2.43 ft |
| **ROAD** | | **HW EL 55.47** | | | | | inlet control |
| RS +15 | 48.25 | 55.47 | 55.48 | 0.70 fps | 525 ft | 0.07 | 7.22 ft |
| RS +40 | 47.69 | 55.47 | 55.49 | 0.86 fps | 434 ft | 0.09 | 7.78 ft |
| RS +75 | 44.66 | 55.46 | 55.49 | 0.93 fps | 263 ft | 0.08 | 10.80 ft |
| RS +120 | 44.97 | 55.49 | 55.50 | 0.71 fps | 269 ft | 0.05 | 10.52 ft |
| RS +175 | 45.44 | 55.50 | 55.51 | 0.56 fps | 332 ft | 0.04 | 10.06 ft |
| RS +240 | 46.25 | 55.50 | 55.51 | 0.58 fps | 309 ft | 0.04 | 9.25 ft |
| RS +310 | 47.37 | 55.50 | 55.51 | 0.67 fps | 289 ft | 0.05 | 8.13 ft |
| RS +390 | 48.56 | 55.50 | 55.51 | 0.81 fps | 265 ft | 0.06 | 6.94 ft |
| RS +470 | 49.09 | 55.51 | 55.52 | 0.96 fps | 244 ft | 0.08 | 6.42 ft |

Tailwater below the road EL 44.45. Culvert carries 106 cfs; **956 cfs passes over Fort Foote Road.**

The profile through the ponding area is flat to within 0.05 ft over 470 ft and the velocities are 0.2 to 1.0 fps. **This reach is a pond, not a channel.** That is why the flood elevation is set almost entirely by the crossing and hardly at all by anything on the lots.

---

## 7. Culvert capacity, inlet and outlet control

**Alternatives at the 100-year flow of 1,061 cfs, tailwater EL 44.45, road sag EL 54.00**

| Barrel | Governing control | Headwater EL | HW/D | Over the road | Outlet velocity | Head lowered vs 36 in |
|---|---|---|---|---|---|---|
| 36 in | inlet | 55.45 | 3.60 | 939 cfs | 17.3 fps | 0.00 ft |
| 48 in | inlet | 55.36 | 2.68 | 855 cfs | 16.6 fps | 0.09 ft |
| 60 in | inlet | 55.26 | 2.12 | 757 cfs | 15.9 fps | 0.20 ft |
| 72 in | inlet | 55.13 | 1.75 | 650 cfs | 15.4 fps | 0.32 ft |
| 84 in | inlet | 55.00 | 1.48 | 541 cfs | 14.9 fps | 0.45 ft |
| 96 in | inlet | 54.87 | 1.28 | 439 cfs | 14.6 fps | 0.58 ft |
| twin 72 in | inlet | 54.64 | — | 273 cfs | 14.9 fps | 0.82 ft |

**Inlet control governs at every single-barrel size.** The entrance is the constriction throughout, which means the barrel is never being used to capacity and that enlarging the pipe without enlarging the inlet buys almost nothing.

**And even with the inlet enlarged, the road governs.** Once the headwater passes EL 54.00 the 185 ft of roadway becomes a weir far more efficient than any pipe that fits under it. Eight times the barrel area moves the 100-year headwater 0.58 ft.

> **This retires the 48-inch pipe proposal.** The 48 in extension previously proposed in the rear easement between Lots 54 and 55 was sized against Q100 = 94.9 cfs on a 39.1-acre watershed. The actual figure is 1,061 cfs on 397 acres. A 48 in pipe passes about 206 cfs at the design headwater. It is not a floodplain measure and should not be presented as one. It may still be justified as an on-lot storm drain for the four lots' own runoff, which is what the rest of the drainage design is about, but that is a separate question with a separate and much smaller drainage area.

### 7.1 Outlet velocity, scour and erosion protection

Outlet velocity at the 100-year condition is 15.0 fps into an unlined earth channel whose permissible velocity is about 5 fps. **An energy dissipator or riprap apron designed to FHWA HEC-14 is required.** It cannot be sized here: it needs the surveyed tailwater and a bed gradation. The existing outlet should also be inspected for scour that has already occurred — at these velocities, over fifty years, some will have.

---

## 8. Proposed-condition analysis

### 8.1 What was modelled

The proposed terrain is the graded surface from the current site plan — four dwelling pads, driveways, aprons and the tie-out grading — merged into the existing surface inside the limit of disturbance, and re-cut at the same cross sections. Overbank roughness on the graded right bank was changed from wooded (0.10) to mown lawn (0.035), which by itself would LOWER the water surface. The crossing is unchanged between conditions.

Fill placed: **3,666 cy** in the modelled reach.

### 8.2 Existing versus proposed water-surface elevations — the no-rise table

**10-year**

| Section | Existing WS | Proposed WS | Rise |
|---|---|---|---|
| RS +15 | 54.60 | 54.60 | +0.000 ft |
| RS +40 | 54.60 | 54.61 | +0.014 ft **RISE** |
| RS +75 | 54.60 | 54.61 | +0.015 ft **RISE** |
| RS +120 | 54.60 | 54.62 | +0.012 ft **RISE** |
| RS +175 | 54.61 | 54.62 | +0.013 ft **RISE** |
| RS +240 | 54.61 | 54.62 | +0.014 ft **RISE** |
| RS +310 | 54.61 | 54.62 | +0.014 ft **RISE** |
| RS +390 | 54.61 | 54.62 | +0.014 ft **RISE** |
| RS +470 | 54.61 | 54.62 | +0.014 ft **RISE** |
| **Maximum** | | | **+0.015 ft at RS +75** |

Downstream of the crossing the maximum change is 0.000 ft — the proposed work is entirely upstream of the road and does not reach the downstream reach.

**25-year**

| Section | Existing WS | Proposed WS | Rise |
|---|---|---|---|
| RS +15 | 54.91 | 54.91 | +0.000 ft |
| RS +40 | 54.91 | 54.93 | +0.021 ft **RISE** |
| RS +75 | 54.91 | 54.94 | +0.024 ft **RISE** |
| RS +120 | 54.92 | 54.94 | +0.017 ft **RISE** |
| RS +175 | 54.92 | 54.94 | +0.020 ft **RISE** |
| RS +240 | 54.93 | 54.95 | +0.021 ft **RISE** |
| RS +310 | 54.93 | 54.95 | +0.021 ft **RISE** |
| RS +390 | 54.93 | 54.95 | +0.021 ft **RISE** |
| RS +470 | 54.93 | 54.95 | +0.021 ft **RISE** |
| **Maximum** | | | **+0.024 ft at RS +75** |

Downstream of the crossing the maximum change is 0.000 ft — the proposed work is entirely upstream of the road and does not reach the downstream reach.

**50-year**

| Section | Existing WS | Proposed WS | Rise |
|---|---|---|---|
| RS +15 | 55.18 | 55.18 | +0.000 ft |
| RS +40 | 55.18 | 55.20 | +0.027 ft **RISE** |
| RS +75 | 55.18 | 55.21 | +0.032 ft **RISE** |
| RS +120 | 55.19 | 55.21 | +0.020 ft **RISE** |
| RS +175 | 55.20 | 55.22 | +0.024 ft **RISE** |
| RS +240 | 55.20 | 55.23 | +0.026 ft **RISE** |
| RS +310 | 55.20 | 55.23 | +0.026 ft **RISE** |
| RS +390 | 55.20 | 55.23 | +0.025 ft **RISE** |
| RS +470 | 55.20 | 55.23 | +0.025 ft **RISE** |
| **Maximum** | | | **+0.032 ft at RS +75** |

Downstream of the crossing the maximum change is 0.000 ft — the proposed work is entirely upstream of the road and does not reach the downstream reach.

**100-year**

| Section | Existing WS | Proposed WS | Rise |
|---|---|---|---|
| RS +15 | 55.47 | 55.47 | +0.000 ft |
| RS +40 | 55.47 | 55.50 | +0.032 ft **RISE** |
| RS +75 | 55.46 | 55.50 | +0.039 ft **RISE** |
| RS +120 | 55.49 | 55.51 | +0.020 ft **RISE** |
| RS +175 | 55.50 | 55.52 | +0.026 ft **RISE** |
| RS +240 | 55.50 | 55.53 | +0.028 ft **RISE** |
| RS +310 | 55.50 | 55.53 | +0.029 ft **RISE** |
| RS +390 | 55.50 | 55.53 | +0.028 ft **RISE** |
| RS +470 | 55.51 | 55.53 | +0.028 ft **RISE** |
| **Maximum** | | | **+0.039 ft at RS +75** |

Downstream of the crossing the maximum change is 0.000 ft — the proposed work is entirely upstream of the road and does not reach the downstream reach.

### 8.3 Finding on no-rise

**The proposed condition does NOT satisfy a no-rise standard.** The 100-year water surface rises **0.04 ft** at RS +75, and by 0.02 ft or more in every storm modelled. Prince George's County and FEMA both work to 0.00 ft reported to two decimals. 0.04 ft is a rise.

The mechanism is loss of conveyance area in the right overbank where the pads are filled. It is not caused by the roughness change, which works the other way.

### 8.4 Floodplain storage and compensatory storage

| Storm | Water surface | Fill below the flood surface | Total fill in reach |
|---|---|---|---|
| 10-year | EL 54.61 | **2,549 cy** | 3,666 cy |
| 25-year | EL 54.93 | **2,686 cy** | 3,666 cy |
| 50-year | EL 55.20 | **2,794 cy** | 3,666 cy |
| 100-year | EL 55.51 | **2,908 cy** | 3,666 cy |

**2,908 cubic yards of 100-year floodplain storage is removed by the proposed grading.** In a reach that functions as a detention pond behind a road embankment, that storage is doing real work: it is what keeps the peak headwater as low as it is. A steady-state model cannot credit the attenuation it provides, so the 0.04 ft rise in Section 8.2 is a FLOOR on the impact, not a ceiling.

**Compensatory storage is required**, cut for fill, below the 100-year surface, hydraulically connected, within the same reach.

### 8.5 Floodplain area on each lot

**100-year (existing WS EL 55.51, proposed WS EL 55.53)**

| Lot | Address | Lot area | Flooded, existing | Flooded, proposed | Change | Fill below flood |
|---|---|---|---|---|---|---|
| 53 | 9588 | 12,500 sf | 11,100 sf (88.8%) | 8,400 sf (67.2%) | -2,700 sf | 281 cy |
| 54 | 9584 | 23,500 sf | 23,500 sf (100.0%) | 20,500 sf (87.2%) | -3,000 sf | 1,491 cy |
| 55 | 9580 | 25,600 sf | 24,500 sf (95.7%) | 21,700 sf (84.8%) | -2,800 sf | 1,038 cy |
| 56 | 9576 | 13,900 sf | 2,800 sf (20.1%) | 2,400 sf (17.3%) | -400 sf | 12 cy |

**10-year (existing WS EL 54.61, proposed WS EL 54.62)**

| Lot | Address | Lot area | Flooded, existing | Flooded, proposed | Change | Fill below flood |
|---|---|---|---|---|---|---|
| 53 | 9588 | 12,500 sf | 9,900 sf (79.2%) | 7,500 sf (60.0%) | -2,400 sf | 195 cy |
| 54 | 9584 | 23,500 sf | 23,400 sf (99.6%) | 18,700 sf (79.6%) | -4,700 sf | 1,365 cy |
| 55 | 9580 | 25,600 sf | 23,500 sf (91.8%) | 19,700 sf (77.0%) | -3,800 sf | 926 cy |
| 56 | 9576 | 13,900 sf | 1,600 sf (11.5%) | 1,500 sf (10.8%) | -100 sf | 3 cy |

### 8.6 Does the proposed work remove any part of the lots from the floodplain?

**Partly, and only by filling — which is the thing that causes the rise and the storage loss.** Raising a pad above the water surface does take that ground out of the mapped floodplain. It does not lower the flood. Lot 54 goes from 100.0% to 88.5% flooded at the 100-year and Lot 55 from 95.7% to 85.5%, while the water surface across both of them goes UP.

That is the distinction the county cares about: **removing ground from the floodplain by filling it is an encroachment, not a mitigation.**

---

## 9. Floodplain delineation, existing and proposed

Delineated by intersecting the modelled water surface with the terrain, connectivity-limited by flood fill from the channel so that a low spot behind a ridge is not mapped as floodplain. The limits and the profiles come from the same computation and cannot disagree.

| Storm | Existing WS | Existing area | Proposed WS | Proposed area |
|---|---|---|---|---|
| 10-year | EL 54.61 | 3.95 ac | EL 54.62 | 3.68 ac |
| 25-year | EL 54.93 | 4.05 ac | EL 54.95 | 3.80 ac |
| 50-year | EL 55.20 | 4.16 ac | EL 55.23 | 3.92 ac |
| 100-year | EL 55.51 | 4.27 ac | EL 55.53 | 4.07 ac |

**Floodway.** No floodway is delineated. A floodway is defined by an encroachment analysis that raises the water surface by a permitted increment (1.00 ft under the NFIP, and Maryland requires the more restrictive of that and the local standard). Running one here would be meaningless: the reach is a pond with velocities under 1 fps, the conveyance is not in a defined channel, and the control is a road weir. **If DPIE requires a floodway it must be developed from the FPS 200546 model, not from this one.**

Deliverables written:

- `output/site-plans/indian-queen-floodplain-delineation.geojson` — existing and proposed polygons for the 10-, 25-, 50- and 100-year storms, EPSG:2248, NAVD 88, attributed with condition, return period, water-surface elevation and area.
- `output/site-plans/indian-queen.floodplain-study-results.json` — full model input and output, every section, every profile point.
- `output/site-plans/indian-queen.floodplain-inundation.json` — per-lot inundation, fill and storage loss.

---

## 10. Regulatory and permitting determination

| Question | Determination |
|---|---|
| County floodplain study required? | **Yes.** A new or revised FPS is required. FPS 200546 is the controlling study of record and must be obtained and reconciled first. |
| County floodplain approval required? | **Yes.** DPIE floodplain review, with the study above. |
| Floodplain waiver? | Not available for this. A waiver addresses minor encroachment, not dwellings below the BFE. |
| Stream alteration / waterway construction permit (MDE)? | **Likely yes** if any work touches the channel, the crossing or the 100-year floodplain of a stream with this drainage area. MDE Nontidal Waterway Construction. Confirm with MDE at pre-application. |
| SWM approval? | **Yes**, independently — ESD to the MEP under the 2007 Act and the MDE Design Manual. Unaffected by the floodplain finding. |
| FEMA CLOMR? | **Not required on the current mapping.** Zone X carries no BFE and no floodway, so there is nothing to revise. |
| FEMA LOMR / LOMA? | **A LOMA cannot help** — the lots are already outside the FEMA SFHA. Being outside Zone AE does not make them outside the county floodplain. |
| Does the work qualify as no-rise / zero-rise? | **No.** 0.04 ft rise at the 100-year. |
| Floodway encroachment analysis required? | Not on the current mapping (no floodway exists). If DPIE establishes one from FPS 200546, then yes. |
| Compensatory storage required? | **Yes.** 2,908 cy below the 100-year surface. |
| Does the proposal meet county, DPIE, MDE and FEMA floodplain regulation? | **No, as currently designed.** Two dwellings at the water surface, four basements below it, a rise, and uncompensated fill. |
| Can the work legally support removing the floodplain designation from the lots? | **No, not as proposed.** See Section 11. |

### 10.1 Requirements before a building permit

1. Obtain **FPS 200546** and any successor from DPIE; reconcile.
2. **Field survey** to Section 12, including the culvert inverts and the datum tie.
3. **Sealed floodplain study** by a Maryland PE, in the software of record, reconciled to FPS 200546.
4. **Redesign** so that the lowest floor of every dwelling, basements included, sits above the BFE with county freeboard — Section 11.
5. **Compensatory storage** designed and shown, cut for fill, below the 100-year surface.
6. **Floodplain easement** dedicated over the 100-year floodplain on each burdened lot and recorded — following Plat 118-083 as the precedent in this subdivision.
7. **MDE waterway construction permit** if the channel or crossing is touched.
8. **SWM concept and site development plan approval.**
9. DPIE grading permit, then building permits.

---

## 11. Options

**Option A — redesign the dwellings to the flood, keep the crossing.** Raise every lowest floor above the BFE plus county freeboard, delete the basements on Lots 54 and 55 or convert them to slab-on-grade, and provide compensatory storage cut for fill. Feasible on Lots 53 and 56 with modest change. On Lots 54 and 55 it means a fundamentally different house: the pads sit at EL 55.5 against a 100-year surface of EL 55.53, and the basements are 8.6 ft under. This is the only option that is within the applicant's control and it does not remove the lots from the floodplain.

**Option B — fill the lots out of the floodplain.** Raise Lots 54 and 55 above EL 57.53. This is the "can we fill to 58–60" question asked earlier, and the answer is now quantified: it would take several thousand additional cubic yards below the flood surface, all of it compensable, and it would raise the water surface on the neighbours. **Not permittable without equivalent compensatory excavation**, and there is nowhere obvious on these lots to put it.

**Option C — fix the crossing.** Replace the Fort Foote Road culvert with a structure sized to stop the road overtopping. This is the only measure that actually lowers the flood elevation for everyone. It is also a county roadway project on a county road, an order of magnitude beyond a four-lot site plan, and Section 7 shows that even a 96 in barrel only reaches EL 54.87 — a box culvert or bridge would be needed. Worth raising with DPIE at pre-application because the overtopping is a public-safety matter independent of this development.

**Recommendation: Option A, and put the overtopping finding in front of DPIE in writing.** The road overtopping in a 10-year storm is not the applicant's problem to solve, but it is the applicant's problem that it sets the flood elevation on the lots, and DPIE should hear it at pre-application rather than at review.

---

## 12. Additional survey, geotechnical, environmental and agency information required

### 12.1 Survey — Meekins Surveyors

*W. L. Meekins RLS #384 is the surveyor of record on Plat Book WWW 65 folio 60.*

| # | Item | Why it matters here |
|---|---|---|
| 1 | **Level to H31A, H32A and H32B** and publish a numerical WSSC-to-NAVD 88 conversion at this site | Closes Section 3. Everything else is conditional on it. |
| 2 | **Existing culvert: invert in and out, diameter, material, length, skew, condition; headwall and endwall type and elevations; inlet throat elevation** | The single highest-value measurement on the project. |
| 3 | **Fort Foote Road profile** through the sag, centreline and both gutter lines, 300 ft each way | The road IS the control structure. |
| 4 | Boundary retracement, Lots 53–56, per WWW 65/60 | |
| 5 | **Field cross sections** perpendicular to flow — minimum five: culvert inlet, culvert outlet, and three through the ponding area, to 2 ft above the 100-year surface | Replaces LiDAR sections. FPS-770017 never had these. |
| 6 | 1-ft topography over all four lots plus 50 ft beyond, and 200 ft up and down the corridor | |
| 7 | Existing swale across the rear of Lots 50–53 described in the 1979 letter | |
| 8 | Utilities, structures within 50 ft, driveways and aprons on adjoining lots | |
| 9 | Trees 2.5 in dbh and over within 75 ft of each dwelling — location, species, dbh, condition | Countable toward Landscape Manual 4.1(c)(1) and Sec. 25-128 canopy. |
| 10 | **Re-establish the 1978 field topo sheet on State Plane** from any recoverable control | Reconciles the historic work with the new. Section 4.1. |
| 11 | **Floodplain easement plat** — metes and bounds of the 100-year limit on each burdened lot, in recordable form | Section 5.3. |
| 12 | As-built certification post-construction: pipe inverts, finished floor elevations | Required for use and occupancy. |

Items 1 and 2 are the critical path and can be a first mobilisation ahead of the rest.

### 12.2 Other professionals

| Discipline | Scope | Why |
|---|---|---|
| **Maryland PE (water resources)** | HEC-RAS model of record, reconciliation to FPS 200546, sealed floodplain study, no-rise or impact analysis, compensatory storage design, HEC-14 outlet protection, seal on every sheet | Nothing is reviewable unsealed. The platform cannot supply this. |
| **Geotechnical engineer** | Borings, bearing, fill placement and compaction specification, slope stability on the 2.5:1 and 2.6:1 graded slopes | Structural fill supporting dwellings in a floodplain. |
| **Landscape architect / certified arborist** | Tree Conservation Plan, canopy worksheet to Sec. 25-128 as amended by CB-021-2024 (20% of net tract, RSF-95), per-lot planting to Landscape Manual 4.1(c)(1) | M-NCPPC signs separately from DPIE. |
| **Environmental / wetland scientist** | Wetland delineation and jurisdictional determination | Wetlands mapped 439 ft from Lot 53. Corps and MDE jurisdiction is independent of the county. |
| **Title attorney** | Floodplain easement deed or plat dedication, execution, recordation | Title is clean; the instrument still has to be created. |
| **Architect** | Redesign of Lots 54 and 55 to a flood-compliant lowest floor | Option A. |
| **Structural engineer** | Only if retaining walls over 4 ft return | None currently proposed. |

### 12.3 Agency information to obtain

- **FPS 200546**, FPS 960004 and FPS 200380 from DPIE, with their models if they exist.
- DPIE as-built records for the Fort Foote Road crossing.
- Any upstream stormwater management facilities in the 397-acre watershed. **None were inventoried for this study.** Upstream detention would reduce the peaks in Section 2.5 and the omission is conservative but real.
- MDE pre-application on waterway construction.

---

## 13. Assumptions, limitations and certification

**Preliminary feasibility results** — everything in this report.

**Permit-level results** — none. There are none in this document.

| Item | Status |
|---|---|
| Horizontal datum | EPSG:2248, Maryland State Plane NAD 83, US survey feet |
| Vertical datum | NAVD 88 |
| Terrain | County 2023 LiDAR 2-ft contours, interpolated to a 10 ft grid. **Not a survey.** |
| Model | Platform 1D steady standard-step; HEC-RAS formulation, **not HEC-RAS** |
| Hydrology | TR-55 graphical peak discharge, Type II |
| Design storms | 10-, 25-, 50-, 100-year, 24-hour |
| Downstream boundary | Normal depth on a 1.2% channel slope, 460 ft below the crossing |
| Culvert | **Assumed 36 in RCP. Never measured.** |
| Upstream SWM | **Not inventoried.** |
| Floodway | Not delineated; none exists on current mapping |
| FPS 200546 | **Not obtained.** The controlling study of record is not in the file. |
| Unsteady / storage routing | Not performed. The reach is a pond and the steady model cannot credit its attenuation. |
| Professional engineer responsible | **NONE. This document is not sealed and no PE has reviewed it.** |

This study was produced by the Kealee site-plan engine from public data. It is analysis a Maryland Professional Engineer can review, adopt, correct or reject. It does not become a certified document by being printed, and no part of it may be submitted as a sealed floodplain study.
