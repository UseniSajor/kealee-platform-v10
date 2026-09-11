# Conceptual Drainage and Floodplain Study — Indian Queen East, Lots 53–56

**For county review · PRELIMINARY · not for construction**

| | |
|---|---|
| Project | Indian Queen East, Block "E" and parts of Blocks D & F — Lots 53, 54, 55, 56 |
| Addresses | 9588, 9584, 9580, 9576 Fort Foote Road |
| Plat of record | Plat Book WWW 65, p. 60 (MSA_S1289_51253), M-NCPPC Record File 5197863 |
| Jurisdiction | Prince George's County, Maryland · 12th Election District · Tax Map 113, Block F, Grid E4 |
| Zone | RSF-95 |
| Tract area | 75,178 sq ft (1.726 ac) |
| Datum | Horizontal EPSG:2248 NAD83 · Vertical **NAVD88** unless stated otherwise |
| Prepared | 2026-09-10, Kealee site-plan engine, from the sources listed in §11 |
| Status | **PRELIMINARY — no professional seal. Review and seal by the responsible engineer must follow.** |

---

## 1. Purpose and the finding that governs everything else

This study was commissioned to test whether the four lots can be developed as
proposed, with the existing storm drain extended and its inlet enlarged, and
what that means for the floodplain.

The finding that governs the answer is a **datum conflict that cannot be
resolved from the record**, and it is stated first because every other
conclusion is contingent on it:

> The county's floodplain of record for these lots, **FPS-770017**, states the
> 100-year floodplain elevation adjacent to them as **57 ft ± in the WSSC
> datum**. The proposed dwellings are designed in **NAVD88**. No conversion
> between WSSC datum and NAVD88 has been established for this site, and none is
> published in the project record.

If the offset is near zero, **two of the four dwellings have finished floors
below the county's 100-year flood elevation** and all four have basements far
below it. If the offset is materially negative, none of them do. The difference
between those two outcomes is the project.

**A single benchmark tie is the critical path item for this entire study.**

### 1.1 What was searched for the conversion, and what it turned up

**PGAtlas does not publish it.** `Elevation/MapServer/8 — Ground Control (2020)`
is the county's survey control layer and it is the right place to look. Its
published extent begins at **x = 1,309,821**, and this site sits at
x ≈ 1,308,600–1,309,100 — **west of the layer's coverage**. A query over a
5,000 × 4,400 ft envelope centred on the tract returns **0 features**. No other
PGAtlas service carries a vertical datum note. No WSSC↔NAVD88 conversion exists
anywhere in the project record either.

**The client's own field survey does carry the benchmarks.**
`existing site plans/Indian Queen lots floodplain topo.pdf` is a field
topographic survey of these four lots, annotated "Lots 53–56", with the
floodplain limit traced on it in red. It is on a **local coordinate grid**
(N 46,800 / N 46,750 / N 47,000; E 950 / E 1,000 / E 1,050), not state plane,
and it carries three benchmarks:

| Benchmark | Elevation on the survey |
|---|---|
| **H31A** | **61.09** (annotated 0.00 — the survey's vertical origin) |
| H32A | 74.37 |
| H32B | 66.41 |

`BM H31A EL 61.09` is already cited on the current permit set as the basis of
the field topographic survey exhibit.

**A corroboration worth having, which is not a substitute for the tie.** The
field survey's spot elevations across the rear of the lots read **46.2 to 51.3**.
The engine's independent NAVD88 lidar surface reads **46 to 48** across the same
ground. Two independent sources, one a field survey on an unstated datum and one
NAVD88 lidar, agreeing to within a foot or two.

That **suggests the WSSC↔NAVD88 offset here is small — on the order of a foot,
not tens of feet.** If that holds, the §2.4 comparison at zero offset is close to
the real one, and Lots 54 and 55 are the exposure.

It is a suggestion and it is written as one. Two surfaces agreeing at the rear of
four lots is not a datum tie, and no permit should be sought on it. What it does
establish is that **the tie is a short job with a known answer to check against**,
which is why §10 concludes the determination is reachable rather than remote.

---

## 2. Floodplain status — what each authority actually says

The three authorities do not agree, and the disagreement is not an error. FEMA
maps studied streams; the county regulates from its own floodplain studies,
which cover tributaries FEMA never studied. Both are live.

### 2.1 FEMA — the lots are NOT in the Special Flood Hazard Area

Queried live against the FEMA National Flood Hazard Layer, 2026-09-10, at each
lot's address point and again over the whole tract envelope:

| Source | Result |
|---|---|
| NFHL layer 28, Flood Hazard Zones, four address points | `FLD_ZONE = X`, `ZONE_SUBTY = AREA OF MINIMAL FLOOD HAZARD`, `SFHA_TF = F`, `STATIC_BFE` null |
| NFHL layer 28, whole-tract envelope | **One** polygon intersects — `FLD_AR_ID 24033C_641`, Zone X. No SFHA touches the tract. |
| PGAtlas `Environmental/3` (Floodplain, FEMA 2026) | Zone X, area of minimal flood hazard — agrees |
| Nearest SFHA | A Zone AE polygon lies roughly 2,000 ft away. It does not reach the tract. |
| FIRM panel | `24033C0220E`, effective 2016-09-16 (confirm on the FIRMette; the panel index returned adjoining jurisdictions as well) |

**No Base Flood Elevation is published by FEMA for these lots**, because there
is no SFHA on them to publish one for.

### 2.2 Prince George's County DPIE — mapped floodplain: none

| Source | Result |
|---|---|
| PGAtlas `Environmental/31` (Floodplain, DPIE) | **0 features** on the tract |
| PGAtlas `Environmental/33` (Floodplain — Consultant Study, DPIE) | **1 feature: `FPS 770017`**, plan date 1978-10-09, comment *"No cross sections on plans, revised based on FPS 960004"* |
| PGAtlas `Environmental/25` (Wetland, DNR) | 0 features |
| PGAtlas `Environmental/1` (Stream Center and Drainage, 2023) | 13 features including **North Branch Broad Creek** |

`FPS 770017` is published as a **polyline** — a floodplain study limit line, not
an area. Measured against the recorded lot geometry:

| Lot | Nearest approach of the FPS 770017 limit line |
|---|---|
| **LOT 53** | **0.1 ft** — the line runs along the east property line |
| LOT 54 | 28.8 ft |
| LOT 55 | 186.3 ft |
| LOT 56 | 313.7 ft |

The line runs north from the tract's east edge to y ≈ 399,668, consistent with
the North Branch Broad Creek valley. **On the mapping, it is tangent to Lot 53
and does not cross into any of the four lots.**

### 2.3 FPS-770017 itself — the document contradicts the comfort the mapping gives

`existing site plans/Indian Queen FPS.pdf` is the study. It is two pages: a
county letter and the approved grading plan.

**Page 1** — Prince George's County DPW&T, Bureau of Engineering, 16 July 1979,
signed William E. Miller, Senior Structural Design Engineer, re *Floodplain,
Broad Creek (Trib.), Permit #3201-3203-79 RGU*:

> "The 100 year floodplain elevation adjacent to these lots is **57'±** in the
> **WSSC datum** along the stream. There is an **overflow swale** running with
> the SD easement across the rear of lots 50 to 53 Blk. F Indian Queen East Sub."
>
> "The possible problem we see with this project is that **floodplain easement
> does not appear to have been granted on Lots 53 and 54, Block F.** Please have
> this checked out before release of permits."

**Page 2** — *Grading Plan, Indian Queen East*, Baldwin & Sampson Inc., 7900 Old
Branch Avenue, Clinton MD, SP-197, WWW 65/60, sealed, scale 1" = 50'. Its legend
distinguishes **natural 100-year flood line**, **filled**, existing contour and
proposed. It carries a typical grading section calling up a 100-year water
surface with the area right of the toe of slope to be inundated, and fill
callouts across the rear of the block.

Three things follow, and none of them are in the GIS layers:

1. **A numeric 100-year elevation exists — 57 ft ± WSSC — and it is the
   county's, not FEMA's.** It is the number a DPIE reviewer will hold this
   project to.
2. **An overflow swale is stated to run in the storm drain easement across the
   rear of lots 50 to 53.** Lot 53 is in this project. The rear-yard swale this
   design proposes occupies that same corridor.
3. **A floodplain easement was flagged in 1979 as possibly never granted on
   Lots 53 and 54** — two of the four lots here — with an explicit instruction
   to resolve it *before release of permits*. There is no evidence in the
   project record that it ever was.

### 2.4 Elevation comparison, on the stated numbers

Design elevations are NAVD88. The 57 ft is WSSC datum. **The two columns are not
directly comparable until the offset is established** — this table is the
comparison the study is asked for, presented with that stated and unresolved.

| Lot | Basement | Subfloor | Finished floor | Garage slab | FF vs 57 ft, offset assumed zero |
|---|---|---|---|---|---|
| LOT 53 | 50.22 | 58.22 | **59.22** | 58.89 | +2.22 ft above |
| LOT 54 | 46.97 | 54.97 | **55.97** | 55.64 | **−1.03 ft below** |
| LOT 55 | 47.00 | 55.00 | **56.00** | 55.67 | **−1.00 ft below** |
| LOT 56 | 52.01 | 60.01 | **61.01** | 60.68 | +4.01 ft above |

Every basement — 46.97 to 52.01 — sits below 57 on any small offset.

Existing ground at the rear of the lots reads EL 46–48 NAVD88 off the county
2 ft contour mapping, which is consistent with an overflow corridor there.

**This is why the conclusion in §10 is what it is.** Not because the design is
wrong, but because the design cannot be shown to be right or wrong until one
surveyor spends one day tying a benchmark.

---

## 3. Existing drainage exhibit

**Producible now from the model; drawn on sheet C-400 of the permit set.**

Existing conditions carried in the model:

- Existing grade from Prince George's County 2 ft contour mapping,
  `Elevation/MapServer/1`, NAVD88 (feet). **Lidar-derived mapping, not a
  field-run survey.**
- Existing curb, gutter and 3 ft sidewalk along the Fort Foote Road frontage,
  with a 4 ft planting strip. Right-of-way 78–83 ft, centreline 39–42 ft out
  from the front line.
- Existing 36 in RCP outfall pipe below the tract.
- Existing culvert inlet at Fort Foote Road, at the street end of the recorded
  60 ft storm drain easement on the Lot 54 / Lot 55 party line.
- Recorded easements: the 60 ft storm drain easement (30 ft each side of the
  54/55 party line, 9,299 sq ft within the boundary) and the rear storm drain
  easements.
- North Branch Broad Creek and associated drainage, PGAtlas
  `Environmental/1` (2023).

## 4. Existing pipe and inlet inventory

**Producible now. The controlling item is the existing outfall pipe.**

| Item | Value | Basis |
|---|---|---|
| Existing outfall pipe | **36 in RCP** | Project record |
| Contributing area to it | **39.1 ac** | D8 delineation on the contour DEM |
| Q10 on that area | **71.9 cfs** | C = 0.40, i₁₀ = 4.60 in/hr |
| 36 in capacity at S = 0.0108 | **69.3 cfs** | Manning, n = 0.013 |
| **Existing utilisation at Q10** | **104% of capacity** | 71.9 / 69.3 |
| Existing culvert inlet | At Fort Foote Road, street end of the 60 ft easement | FPS-770017 and project record |
| Existing overflow swale | Stated in the SD easement across the rear of lots 50–53 | FPS-770017 letter, 1979 |

**The existing 36 in outfall is already over capacity at the 10-year storm,
before this project adds anything.** That is a pre-existing condition and it is
the reason an extension-and-enlargement concept was raised at all.

**Not established, requires survey:** existing pipe inverts, actual slope,
material and class, structural condition, degree of siltation, inlet type and
throat dimensions, and whether the 36 in is continuous or has been extended
before.

## 5. Proposed pipe-extension concept

**Producible now; drawn and scheduled on C-400.**

| Item | Proposed |
|---|---|
| Extension | **48 in RCP CL IV**, 162.01 ft |
| Location | Within the recorded 60 ft storm drain easement, Lot 54 / Lot 55 party line, running from the street end to the rear |
| Nature | **Extension of the existing Fort Foote Road culvert inlet** |
| Sizing basis | **48 in, revised from 42 in on the inlet/outlet control analysis in §10B.** 48 in RCP carries 149.3 cfs against a 100-year demand of 94.9 cfs — 64% utilisation against 91% for a 42 in — and it is the size at which control passes from the inlet to the outlet. The same size is carried through the extension, the culvert and the outfall so the run is not constricted anywhere along it. |
| Cover | 48 in OD is **4.83 ft**, 1.5 ft minimum cover — finished grade over the main must be **no lower than invert + 6.33 ft**, which is 0.58 ft deeper than a 42 in would need. Fill where existing ground is lower. **This is the condition that could send the size back to 42 in.** |
| Inverts and slope | **NOT SET. To be established from the field-run topographic survey.** |

## 6. Inlet-enlargement or replacement concept

**Concept only. The existing inlet has not been measured.**

The existing inlet is the control at the upstream end of a run that is already
at 104% of capacity. Enlarging the barrel without enlarging the inlet moves the
constriction rather than removing it.

Concept: replace the existing Fort Foote Road inlet with a county standard
structure sized to the 48 in barrel, with the throat and grate checked for
inlet control at Q10 and Q100 on the 39.1 ac area, and the structure lined with
4 in minimum granite blocks per DER requirements as the approved county practice
in this area requires.

**Cannot be advanced further without:** field measurement of the existing
structure, its throat, invert and condition; and confirmation of whether inlet
or outlet control governs.

## 7. Preliminary drainage-area map and hydraulic calculations

**DELIVERED — these are already drawn and computed on the current plan set**
(sheet C-001 and C-400, drainage area computations block, drainage swale
schedule and grade control schedule). They are reproduced here so this study
stands on its own, not because they are outstanding.

On-site catchments, rational method, NOAA Atlas 14 Vol. 2 Ver. 3 point estimates
at 38.7611 N, 77.0115 W:

| Catchment | Area sq ft | Impervious | Pre Q | Post Q | Increase | WQv |
|---|---|---|---|---|---|---|
| LOT 53 | 12,389 | 15.1% | 0.49 | 0.69 | 0.20 | 192 cf |
| LOT 54 | 23,371 | 9.4% | 0.92 | 1.16 | 0.24 | 263 cf |
| LOT 55 | 25,733 | 8.2% | 1.01 | 1.24 | 0.23 | 266 cf |
| LOT 56 | 13,690 | 14.2% | 0.54 | 0.75 | 0.21 | 203 cf |
| **Project total** | **75,184** | **10.8%** | **2.96** | **3.84** | **0.88** | **924 cf** |

Q in cfs, 10-year. System at the low point: 1.726 ac, **Q10 3.57 cfs, Q100 4.71
cfs**.

Conveyance — proposed rear-yard swale, 2 ft bottom, 3:1 sides, n = 0.041,
0.5 ft freeboard, inverts solved across the network from the outlet upward:

| Reach | Length | Grade | DA (ac) | Q10 | Q100 | Depth | V100 | Inv in | Inv out | Cut |
|---|---|---|---|---|---|---|---|---|---|---|
| ST-1 — ST-2 | 110' | 3.01% | 0.2844 | 0.59 | 0.78 | 0.18' | 1.73 | 50.20 | 46.90 | 1.0' |
| ST-4 — ST-3 | 157' | 4.98% | 0.3143 | 0.65 | 0.86 | 0.16' | 2.12 | 60.30 | 52.50 | 1.0' |
| ST-3 — ST-2 | 177' | 3.17% | 0.9051 | 1.87 | 2.47 | 0.33' | 2.51 | 52.50 | 46.90 | 1.0' |

Worst velocity 2.51 fps at Q100 against 5 fps permissible for established grass.

**Model summary:** this is a **rational-method and Manning analysis**, which is
appropriate for conveyance sizing at concept stage. **It is not a flood model.**
No backwater, no water-surface profile, no unsteady routing. Nothing here
computes a flood elevation, and nothing here should be represented as doing so.

## 8. Existing/proposed flood-elevation comparison, and the four-lot floodplain impact exhibit

**NOT PRODUCIBLE from current information. This is the honest answer, and the
reason is specific rather than general.**

To produce either deliverable, four things are needed and none exist:

1. **The datum tie.** 57 ft WSSC cannot be compared with a NAVD88 design.
2. **Cross sections.** FPS 770017's own county comment records *"No cross
   sections on plans."* A flood elevation comparison without sections is an
   assertion.
3. **FPS 960004.** The mapping states 770017 was *"revised based on FPS 960004."*
   That revision is the current floodplain of record and is not in the project
   file.
4. **Field topography at the rear.** Existing grade at the rear of these lots is
   county lidar contour mapping. The overflow corridor is exactly where lidar is
   least reliable and where the answer is decided.

What **can** be stated now is §2.4 — the design elevations against the stated
57 ft, with the datum unresolved and shown as unresolved. Presenting anything
more definite would be presenting a number nobody has computed.

## 9. Preliminary profile showing pipe inverts and slopes

**Partially producible.**

- **Proposed swale** — full invert profile solved and published: inverts,
  grades, and depth of cut at every structure (§7, and the grade control
  schedule on C-400). Grades were derived from county lidar contours and must be
  reset from field survey.
- **Proposed 48 in extension** — alignment, length and size established;
  **inverts and slope not set.** They depend on the existing culvert inlet
  invert, which has not been measured.
- **Existing 36 in outfall** — no invert data whatsoever.

A profile drawing showing the existing inlet, the 48 in extension and the tie to
the existing 36 in requires the survey in §11.1 first. Drawing it before then
would be drawing an assumption.

## 10. Floodplain mitigation — options, and the recommended concept

### 10.0 The question that has to be answered first: does grading lower the floodplain?

**No. It does not.**

A 100-year flood elevation is set by the watershed and by the conveyance
capacity at the control. It is not set by what the lots are graded to. Filling a
lot raises the *ground* relative to the water surface; it does not move the water
surface down. In a floodplain it usually pushes the water somewhere else, which
is precisely what a no-rise analysis and compensatory storage exist to prevent.

Only three things lower a stated 100-year elevation:

1. **More conveyance at the control** — here, the Fort Foote Road culvert.
2. **Storage upstream** — a watershed-scale measure, not this project's.
3. **A corrected study** — FPS 960004 may already have done this.

So "fill to 58–60 and the floodplain resolves" is the wrong model of the
problem. Fill can take the *lots* out of inundation. It cannot take the *water*
out of the valley, and the county will ask what happened to it.

### 10.1 How much of the tract is actually below 57

Computed on the county 2 ft contour surface, 5 ft grid, NAVD88:

| Lot | Lot area | Area below EL 57 | % below | Fill to 58 | Fill to 60 |
|---|---|---|---|---|---|
| LOT 53 | 12,225 sf | 11,700 sf | 95.7% | 2,707 cy | 3,573 cy |
| LOT 54 | 23,325 sf | 23,325 sf | **100.0%** | 8,981 cy | 10,708 cy |
| LOT 55 | 25,750 sf | 25,450 sf | 98.8% | 6,960 cy | 8,845 cy |
| LOT 56 | 13,575 sf | 5,000 sf | 36.8% | 565 cy | 936 cy |
| **Total** | **74,875 sf** | **65,475 sf** | **87.4%** | **19,212 cy** | **24,062 cy** |

**And a result that should stop the reader:** Fort Foote Road at the frontage of
Lots 54 and 55 reads **EL 54.0 NAVD88** — three feet *below* the stated 57.
A county road is not built three feet below the 100-year flood elevation.

That is strong evidence that **57 ft WSSC is not 57 ft NAVD88**, and that the
datum offset is material rather than incidental. It does not tell us the sign or
the size. It does tell us that sizing mitigation against 57 ft NAVD88 today
would probably be sizing it against the wrong number. **§11.1 item 1 remains the
gate.**

The options below are therefore presented as *the concept to be built once the
elevation is confirmed*, with volumes stated so the scale is understood.

### 10.2 Option A — Blanket fill to 58–60. **NOT RECOMMENDED**

| | |
|---|---|
| Volume | **19,212 cy to EL 58 · 24,062 cy to EL 60** |
| Against | The whole current earthwork is 4,775 cy. This is **4 to 5 times the entire project.** |

It fails on more than cost:

- **It fills the overflow swale.** FPS-770017 records an overflow swale running
  with the storm drain easement across the rear of lots 50–53. That is a
  **conveyance path**, not merely storage. Filling it across four lots forces the
  overflow onto adjoining property and raises the upstream water surface.
- **Compensatory storage would be required** for 19,000+ cy placed below the
  flood elevation, and there is nowhere on a 1.7 ac tract to put it.
- **A no-rise demonstration would almost certainly fail**, and it cannot even be
  attempted — FPS 770017 has no cross sections.

### 10.3 Option B — Conveyance upgrade at the control. **RECOMMENDED — this is the mitigation**

This is the one measure that can *lower* the flood elevation rather than
displace the water, and the project is already proposing most of it.

| Element | Concept |
|---|---|
| **New pipe in the 54/55 easement** | **48 in RCP CL IV, 162.01 ft**, within the **recorded 60 ft storm drain easement on the Lot 54 / Lot 55 party line**, running from the street end to the rear |
| Nature | **Extension of the existing Fort Foote Road culvert inlet** — not a new system |
| Inlet | Enlarge or replace the existing Fort Foote Road inlet to a county standard structure sized to the 48 in barrel, throat checked for inlet control at Q10 and Q100 on the 39.1 ac area, lined with 4 in minimum granite blocks per DER. **Not optional** — inlet control governs at 36 and 42 in, and the 48 in only reaches outlet control with the inlet enlarged to suit |
| Capacity | 48 in carries **149.3 cfs** against a 100-year demand of **94.9 cfs** — 64% utilisation, against 91% for a 42 in |
| Replaces | Existing 36 in at **104% of capacity at Q10** — the present constriction |
| Cover | Finished grade over the main no lower than **invert + 6.33 ft** (OD 4.83 ft, 1.5 ft min cover) |
| Right of way | **Already recorded.** No new easement acquisition for the pipe itself. |

**Why this is the floodplain measure and not just a storm drain measure.** The
overflow swale across the rear exists because the culvert cannot pass the flow.
If the 57 ft is backwater from an undersized 36 in culvert on a 39.1 ac
watershed — and 104% of capacity at the *10-year* storm says it may well be —
then enlarging the barrel and the inlet **lowers the local water surface and
shrinks the overflow**. That removes floodplain instead of moving it.

**This must be demonstrated by modelling, not asserted.** It is the single item
that would justify additional hydraulic analysis, and it is the reason to do it.

### 10.4 Option C — Targeted pad raise, Lots 54 and 55 only. **RECOMMENDED**

Two of the four lots already clear the elevation. Only two need anything.

| Lot | Pad | Finished floor | FF vs 57 | Lift required to reach 58.5 |
|---|---|---|---|---|
| LOT 53 | 58.72 | 59.22 | **+2.22** | none |
| LOT 54 | 55.47 | 55.97 | −1.03 | **3.0 ft** |
| LOT 55 | 55.50 | 56.00 | −1.00 | **3.0 ft** |
| LOT 56 | 60.51 | 61.01 | **+4.01** | none |

Target EL 58.5 = 57 + 1.5 ft freeboard. Raising Lots 54 and 55 by 3.0 ft:

| | |
|---|---|
| Pad + 10 ft apron area | 2,868 + 2,925 = **5,793 sf** |
| Core lift, 3.0 ft | 644 cy |
| 3:1 transition skirts | ≈ 354 cy |
| **Incremental fill** | **≈ 1,000 cy** |
| Against Option A | **5% of the blanket-fill volume** |

Revised elevations: Lot 54 FF 55.97 → **58.97**, Lot 55 FF 56.00 → **59.00**.

The rear overflow corridor stays at existing grade. The fill is a pad island in
the front half of each lot, where the ground is highest already.

### 10.5 Option D — No basements on Lots 54 and 55. **RECOMMENDED**

This is the exposure that fill does not fix.

| Lot | Basement | vs EL 57 |
|---|---|---|
| LOT 53 | 50.22 | −6.8 |
| LOT 54 | 46.97 | **−10.0** |
| LOT 55 | 47.00 | **−10.0** |
| LOT 56 | 52.01 | −5.0 |

Every basement is below the stated elevation, and a 3 ft pad raise still leaves
Lots 54 and 55 around EL 50 — seven feet under. **Prince George's County will not
permit habitable space below the flood elevation.**

Concept: **slab-on-grade or vented crawlspace on Lots 54 and 55**, lowest floor
at or above 58.5. Lots 53 and 56 are reviewed against the confirmed elevation.

**The driveway still works.** Lot 54 frontage is EL 54.0; a garage slab near
58.2 over the ~48 ft driveway run is **8.7%**, inside the 12.5% maximum in
PGC Code Sec. 32-151 Table 4. The grade is buildable, not marginal.

### 10.6 Option E — Compensatory storage

Any fill placed below the confirmed flood elevation is offset by excavation
below it elsewhere on the tract. At ~1,000 cy the targeted concept is small
enough that the offset can be cut from the rear of Lots 54 and 55 — which
**deepens the overflow corridor and assists conveyance at the same time**. At
19,000 cy it could not be.

### 10.7 Option F — Resolve the floodplain easement on Lots 53 and 54

The 1979 county condition, still open. A title search, then dedication of the
floodplain easement if it was never granted. **This is independent of every
hydraulic question above and may govern regardless of them.**

### 10.8 The recommended concept, in order

1. **Tie the datum** (§11.1 item 1). Everything else is sized off it.
2. **Build the 48 in extension and enlarge the inlet** in the recorded 54/55
   easement — the conveyance upgrade, and the only measure that lowers rather
   than displaces. Confirm cover at the surveyed invert; if it cannot be held,
   fall back to 42 in, which still buys 2.97 ft.
3. **Raise the Lot 54 and Lot 55 pads 3.0 ft** to EL 58.5 — ≈ 1,000 cy.
4. **Slab-on-grade or vented crawlspace on Lots 54 and 55.**
5. **Compensatory storage** cut from the rear of those two lots.
6. **Leave the rear overflow corridor at existing grade** and keep the rear-yard
   swale within it.
7. **Resolve the floodplain easement** on Lots 53 and 54.

Total incremental earthwork against the current design: **on the order of
1,000 cy**, against 19,212 cy for the blanket fill that was asked about.

---

## 10B. Culvert model — the mitigation, quantified

Inlet and outlet control computed on the 39.1 ac watershed at the Fort Foote
Road culvert. Rational method flows; FHWA HDS-5 form for inlet control, full-flow
energy for outlet control. n = 0.013, S = 0.0108, L = 60 ft assumed, groove end
projecting, no tailwater.

**Q10 = 71.9 cfs · Q100 = 94.9 cfs** (C = 0.40, i₁₀ = 4.60, i₁₀₀ = 6.07 in/hr)

| Barrel | Capacity full | Q10 | Q100 | V at Q100 | Control |
|---|---|---|---|---|---|
| **36 in — existing** | 69.3 cfs | **104%** | **137%** | **13.43 fps** | INLET |
| **42 in — proposed** | 104.6 cfs | 69% | 91% | 9.87 fps | INLET |
| 48 in — alternative | 149.3 cfs | 48% | 64% | 7.55 fps | OUTLET |

Headwater above the inlet invert — the number that sets the upstream water
surface, and therefore the floodplain:

| Barrel | HW at Q10 | HW at Q100 |
|---|---|---|
| **36 in existing** | **6.12 ft** | **9.17 ft** |
| **42 in proposed** | 4.55 ft | 6.20 ft |
| 48 in alternative | 3.96 ft | 4.93 ft |

### What the upgrade buys

| Upgrade | Q10 headwater | Q100 headwater |
|---|---|---|
| **36 in → 42 in** | **down 1.57 ft** | **down 2.97 ft** |
| 36 in → 48 in | down 1.85 ft | down 4.23 ft |

**This is the finding that justifies the whole concept, and it is what selects
the size.** A 42 in extension lowers the 100-year headwater by 2.97 ft; **a 48 in
lowers it by 4.23 ft.** If the stated 57 ft is backwater off this culvert — and a
barrel running at 137% of capacity with a 13.4 fps velocity at Q100 says it
plausibly is — then **the mitigation removes four feet of floodplain rather than
displacing it.**

**Why 48 in and not 42 in.** The marginal gain per size step decides it: 36 → 42
buys 2.97 ft, **42 → 48 buys a further 1.26 ft**, and 48 → 54 buys 0.12 ft. 48 in
is the knee. It is also where a 42 in's 91% utilisation at Q100 — no margin at
all on a barrel whose whole purpose is lowering a water surface — falls to 64%,
where velocity drops from 9.87 to 7.55 fps, and where control passes from the
inlet to the outlet. Choosing the size that is still at capacity, and still
inlet-controlled, would be choosing not to use the barrel.

Two further readings matter:

- **Inlet control governs on both the 36 in and the 42 in.** The inlet is the
  constriction. Enlarging the barrel without enlarging the inlet moves the
  problem; §6 is not optional, it is the controlling half of the work.
- **At 48 in, control passes to the outlet.** That is the point at which the
  barrel is actually being used rather than being throttled by its inlet, and it
  is why 48 in is the selected size. Past it, 54 in buys 0.12 ft — nothing.

**Caveats.** Assumed length, slope, entrance type and zero tailwater. The
surveyed invert, actual length and entrance condition (§11.1 items 3–5) will move
these numbers. This is a concept-level model and is not a no-rise demonstration.

## 10C. Cross sections — existing ground, front to rear

FPS 770017's own county comment reads *"No cross sections on plans."* These are
cut through the existing surface at the centre of each lot, front lot line to
rear, at 10 ft stations — perpendicular to the overflow, which runs along the
rear. County 2 ft contour mapping, NAVD88.

| Lot | Station 10 → rear, elevation (ft) |
|---|---|
| **LOT 53** | 56 · 54 · 52 · 52 · 52 · 52 · 52 · 51 · 50 · 50 · 50 · 50 · 50 · 50 · 50 |
| **LOT 54** | 53 · 50 · 48 · 48 · 48 · 47 · **46** · **46** · **46** · 48 · 48 · 48 · 47 · 46 · 46 |
| **LOT 55** | 50 · 48 · 48 · 48 · 48 · 48 · 48 · 50 · 50 · 50 · 52 · 52 · 52 · 54 · 54 |
| **LOT 56** | 60 · 60 · 60 · 58 · 58 · 58 · 58 · 56 · 56 · 56 · 56 · 56 · 55 · 54 · 54 · 55 · 58 |

| Lot | Below EL 57 | Max depth below it |
|---|---|---|
| LOT 53 | sta 10 – 150 (all) | 7.0 ft at sta 90 |
| LOT 54 | sta 10 – 150 (all) | **11.2 ft at sta 70** |
| LOT 55 | sta 30 – 170 (all) | 9.0 ft at sta 70 |
| LOT 56 | sta 80 – 160 | 3.0 ft at sta 150 |

**What the sections show that the plan does not.** There is a **defined low
corridor** crossing the tract, deepest on Lot 54 at EL 46 around station 70–90,
with the ground rising again behind it. That is the overflow swale FPS-770017
describes, and it is a real topographic feature, not an artefact. Lots 55 and 56
**rise toward the rear** — the corridor crosses them diagonally rather than
running along the back of every lot.

This is the corridor the recommended concept leaves at existing grade, and the
one blanket fill would obliterate.

## 10D. Projected benchmarks once H31A / H32A / H32B are tied

**This is a projection with stated reasoning, not a measurement.** It is offered
so the survey has an expected answer to check against — a tie that comes back
far outside this range should be questioned before it is used.

### The bound from physical evidence

1. **Fort Foote Road at Lots 54 and 55 reads EL 54.0 NAVD88.** A county road is
   not built below the 100-year flood elevation. Therefore flood elevation in
   NAVD88 is **below 54.0**, so the offset is **more negative than −3.0 ft**.
2. **FPS-770017 states an overflow swale runs across the rear.** The sections
   above put that corridor at **EL 46–48 NAVD88**. An overflow swale operates at
   or just below the flood level, so the flood elevation in NAVD88 is
   **approximately 47–50**, giving an offset of **−7 to −10 ft**.

Both bounds agree. **Projected: NAVD88 ≈ WSSC − 7 to − 10 ft.**

### Projected benchmark values

| Benchmark | On the field survey | Projected NAVD88 |
|---|---|---|
| **H31A** | 61.09 | **≈ 51.1 – 54.1** |
| H32A | 74.37 | ≈ 64.4 – 67.4 |
| H32B | 66.41 | ≈ 56.4 – 59.4 |

**The caveat that matters.** This assumes the field survey is on the WSSC datum,
which its own sheet does not state. If it is instead on an assumed datum close to
NAVD88 — which its rear spot elevations of 46.2–51.3 against lidar 46–48 would
suggest — then **the benchmarks are already near NAVD88 and it is the 1979
letter that carries the offset**. Either way the flood elevation lands near
EL 47–50 NAVD88. The tie decides which document moves, not whether.

### What it means if the projection holds

At an offset of −7 to −10, the flood elevation is **EL 47–50 NAVD88** and:

| | |
|---|---|
| Finished floors | **All four clear it** — 55.97 to 61.01, by 6 to 14 ft |
| Pad raise on Lots 54 and 55 | **Not required** |
| Basements at 46.97 / 47.00 | **Still at or below it.** This is the exposure that survives |
| Blanket fill | Emphatically unnecessary |

**So the most likely outcome is that the problem is a basement problem, not a
fill problem** — and Option D alone (no habitable space below the flood
elevation on Lots 54 and 55) may be the whole of the mitigation. The culvert
upgrade remains worth doing on its own merits: a barrel at 137% of capacity at
Q100 is a deficiency regardless of where the floodplain sits.

**Do not build on this projection.** Tie the benchmarks.

## 10A. Conclusion

> ### FEASIBLE WITH MODIFICATIONS — subject to two verification gates

The modifications are named, sized and buildable: a 48 in extension in an
easement that already exists, a 3 ft pad raise on two lots of roughly 1,000 cy,
two houses without basements, and compensatory storage cut from the same two
lots. None of that is a redesign and none of it is speculative construction.

**Gate 1 — the datum tie.** 57 ft WSSC against a NAVD88 design, with Fort Foote
Road itself reading 3 ft below the stated elevation. Until benchmarks H31A, H32A
and H32B are tied to NAVD88, the mitigation above is correctly *shaped* and may
be wrongly *sized*.

**Gate 2 — no-rise and the culvert model.** The 48 in extension must be shown to
lower or at worst not raise the water surface, and the fill must be shown not to
displace flow onto adjoining property. FPS 770017 has no cross sections and its
controlling revision FPS 960004 is not in the file; both are needed.

**If Gate 2 fails** — if the culvert upgrade cannot be shown to achieve no-rise —
the determination drops to *requires additional modeling*, and the fallback is
Option D alone: raise the floors, take no fill below the flood elevation, and
leave the floodplain untouched.

**What would make it "not feasible":** only the easement question. If a
floodplain easement on Lots 53 and 54 was granted to the county and forbids
structures, no amount of grading answers it.

## 11. Required surveys, testing, permits and agency approvals

### 11.1 Survey and field work — the critical path

| # | Item | Why | By |
|---|---|---|---|
| 1 | **Tie benchmarks H31A (61.09), H32A (74.37) and H32B (66.41) to NAVD88, and state the WSSC datum offset** | Resolves §1. Nothing else can be concluded first. The benchmarks already exist on the client's field survey; they need occupying, not establishing. County Ground Control does not cover this site (§1.1). | Surveyor |
| 2 | Field-run topographic survey, rear of the four lots and the overflow corridor | Replaces lidar where the answer is decided | Surveyor |
| 3 | Field location and invert survey of the existing culvert inlet and 36 in outfall | Sets the extension inverts and the downstream control | Surveyor |
| 4 | Condition and siltation assessment of the existing 36 in | Its actual capacity may be below the theoretical 69.3 cfs | Civil / CCTV |
| 5 | Measurement of the existing inlet throat and structure | Inlet-control check (§6) | Surveyor / civil |

### 11.2 Records and title

| # | Item | Why |
|---|---|---|
| 6 | **Title search for a floodplain easement on Lots 53 and 54, Block F** | The 1979 county condition. Potentially dispositive. |
| 7 | **FPS 960004** from DPIE | The controlling revision to the floodplain of record |
| 8 | FIRMette for panel 24033C0220E | Documentary confirmation of Zone X |
| 9 | Confirmation of the storm drain easement of record across the rear of lots 50–53 and the overflow swale within it | FPS-770017 states it exists |

### 11.3 Approvals anticipated

DPIE grading and building permits; DPIE storm drain and stormwater management
concept, then final; DPIE floodplain review against FPS 770017/960004; Prince
George's Soil Conservation District for sediment control; M-NCPPC for tree
conservation and landscape; WSSC for water and sewer connection; DPW&T for work
in the Fort Foote Road right-of-way, the driveway aprons and the culvert inlet;
MDE Waterway Construction if any work falls within the stream buffer or the
100-year floodplain once it is delineated.

### 11.4 A note on stormwater management concept approval

This set would **not** presently pass SWM concept approval, for reasons
independent of the floodplain question: no ESD practice is sized or drawn against
the computed WQv of 924 cf, the swale is designed as a conveyance rather than a
credited ESD practice under the MDE Design Manual, and the reach below the system
low point leaves the property with no easement of record. Those are recorded in
the project manifest and are separate from this study.

---

## 12. Exclusions

The following are **excluded** from this study and are not authorised:

new topographic or boundary survey · FEMA CLOMR or LOMR · full floodplain study ·
detailed HEC-RAS modeling, if required · geotechnical or infiltration testing ·
wetland delineation · final stormwater management design · final sediment and
erosion-control plan · construction documents · utility relocation ·
construction cost · county, FEMA, WSSC or other agency fees · more than one
revision cycle · **any guarantee that the lots will be removed from the
floodplain**.

On that last exclusion, one thing is worth saying plainly rather than leaving
inside a list: **on the effective FEMA mapping these lots are not in a Special
Flood Hazard Area to begin with**, so there may be nothing to be removed from.
The exposure here is the county's own floodplain of record and the 1979 easement
condition, and neither is addressed by a LOMR.

---

## 13. Sources

| Source | Retrieved | Use |
|---|---|---|
| FEMA NFHL, layers 3, 16, 27, 28 — `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer` | 2026-09-10, live | Flood zone, SFHA, BFE, FIRM panel |
| PGAtlas `Environmental/MapServer` layers 1, 3, 25, 31, 33 | 2026-09-10, live | County floodplain, consultant study, streams, wetlands |
| PGAtlas `Elevation/MapServer/1` — 2 ft contours, NAVD88 | project record | Existing grade |
| PGAtlas `Elevation/MapServer/8` — Ground Control (2020) | 2026-09-10, live | Searched for the datum tie — **does not cover this site** |
| Field topographic survey, Lots 53–56, local grid, BM H31A 61.09 / H32A 74.37 / H32B 66.41 | `existing site plans/Indian Queen lots floodplain topo.pdf` | Benchmarks, rear spot elevations, floodplain limit traced |
| **FPS-770017** — PG County DPW&T letter, 16 July 1979, W. E. Miller; and Grading Plan, Indian Queen East, Baldwin & Sampson Inc., SP-197 | `existing site plans/Indian Queen FPS.pdf` | 100-year elevation, overflow swale, easement condition |
| Plat Book WWW 65 p. 60 | project record | Boundary, easements |
| NOAA Atlas 14 Vol. 2 Ver. 3, PFDS point estimates | project record | Rainfall intensity |
| Maryland Stormwater Design Manual Vol. I & II | project record | WQv |
| `indian-queen-lots-53-56.twin.json`, `indian-queen.storm-trunk.json` | this project | Model, hydraulics, elevations |

**Reliability.** Every elevation in this study except the design elevations comes
from county lidar contour mapping or from a 1979 document in a datum that has
not been tied. Nothing here has been field-verified. That is the finding, not a
disclaimer.
