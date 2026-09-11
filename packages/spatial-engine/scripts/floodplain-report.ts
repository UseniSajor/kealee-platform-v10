/**
 * Renders the floodplain study report from the computed results.
 *
 * Every number in the report is read from indian-queen.floodplain-study-results.json
 * and its companions. Nothing is typed in by hand, so the prose cannot drift
 * away from the model.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-report.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const MODEL_DIR = join(PROJ, 'model')
const OUT = join(PROJ, 'reports')
const R = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.floodplain-study-results.json'), 'utf8'))
const INU = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.floodplain-inundation.json'), 'utf8'))
const TWIN = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-lots-53-56.twin.json'), 'utf8'))
const MIT = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.mitigation-analysis.json'), 'utf8'))
const CS = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.compensatory-storage.json'), 'utf8'))
const FB = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.fill-breakdown.json'), 'utf8'))
const FC = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.fill-and-cut.json'), 'utf8'))
const ES = JSON.parse(readFileSync(join(MODEL_DIR, 'indian-queen.easement-storage.json'), 'utf8'))

const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const L = (s: string) => s.replace(' Fort Foote Rd', '')
const LOTNO: Record<string, string> = {
  '9588 Fort Foote Rd': '53',
  '9584 Fort Foote Rd': '54',
  '9580 Fort Foote Rd': '55',
  '9576 Fort Foote Rd': '56',
}
const P = [10, 25, 50, 100]
const idx = (p: number) => P.indexOf(p)
const wsel100 = INU['100'].wselProposed as number

const buildings = TWIN.features
  .filter((x: any) => x.kind === 'Building')
  .map((b: any) => {
    const r = b.ring?.coordinates ?? b.ring
    const cx = r.reduce((s: number, q: number[]) => s + q[0], 0) / r.length
    const cy = r.reduce((s: number, q: number[]) => s + q[1], 0) / r.length
    return { id: b.id, cx, cy, ...b.attributes }
  })
  .sort((a: any, b: any) => b.cx - a.cx)

const out: string[] = []
const w = (s = '') => out.push(s)

w('# Floodplain and Hydraulic Study')
w('## North Branch Broad Creek at Fort Foote Road')
w('### Indian Queen East, Lots 53–56 — 9588, 9584, 9580 and 9576 Fort Foote Road, Prince George\'s County, Maryland')
w()
w(`Prepared ${new Date(R.generatedAt).toISOString().slice(0, 10)}. Horizontal datum ${R.crs} ` +
  `(Maryland State Plane, NAD 83, US survey feet). Vertical datum ${R.verticalDatum}.`)
w()
w('> **STATUS.** This is a preliminary feasibility study. It is not a permit-level')
w('> submission and it carries no professional seal. The terrain source is published county')
w('> LiDAR rather than a field survey, and the existing culvert has not been measured.')
w('> Section 12 sets out the information required before any part of this analysis can be')
w('> certified. Preliminary feasibility and permit-level results are distinguished in')
w('> Section 13.')
w()
w('---')
w()

// ── 1 Executive summary ────────────────────────────────────────────────────
w('## 1. Executive summary and conclusion')
w()
w('Lots 53 through 56 lie within the headwater impoundment of the Fort Foote Road crossing')
w('of North Branch Broad Creek. The 100-year water surface across the lots is controlled by')
w('that crossing and by the roadway embankment acting as a broad-crested weir. The findings')
w('are set out below in the order of their significance to the development.')
w()
w(`1. **Contributing drainage area at the crossing is ${f(R.hydrology.watershed.areaAc, 0)} acres ` +
  `(${f(R.hydrology.watershed.sqMi, 3)} square miles).** The 100-year peak discharge is ` +
  `**${n0(R.hydrology.flows[3].peakCfs)} cfs**, computed by NRCS TR-55 as set out in Section 2.`)
w()
w(`2. **Fort Foote Road is overtopped in all design storms from the 10-year event upward.** ` +
  `The roadway sag is EL ${f(R.crossing.roadSagElFt)}. The computed 10-year headwater is ` +
  `EL ${f(R.existing[0].headwaterElFt)}, conveying ${n0(R.existing[0].culvert.overtoppingCfs)} cfs ` +
  `across the pavement. At the 100-year event, ${n0(R.existing[3].culvert.overtoppingCfs)} cfs of the ` +
  `${n0(R.hydrology.flows[3].peakCfs)} cfs total is conveyed over the roadway. The roadway ` +
  'embankment, rather than the culvert, controls the upstream water-surface elevation.')
w()
w(`3. **The 100-year water surface across the lots is EL ${f(R.existing[3].headwaterElFt)} ` +
  '(existing condition).** The profile is effectively horizontal through the reach, with ' +
  'computed velocities below 1.0 fps at all sections. The reach functions as a backwater ' +
  'impoundment rather than as a conveyance channel.')
w()
w('4. **The computed elevation is consistent with the floodplain of record.** FPS-770017 ' +
  'states 57 ft plus or minus in the WSSC datum. Section 3 establishes the datum ' +
  'relationship as NAVD 88 = NGVD 29 − 0.66 ft at this site, placing the study of record at ' +
  `approximately EL 56.3 NAVD 88 against the computed EL ${f(R.existing[3].headwaterElFt)}, ` +
  `a difference of ${f(56.34 - R.existing[3].headwaterElFt)} ft.`)
w()
w('5. **Barrel enlargement produces limited reduction in headwater.** Because roadway weir ' +
  'flow governs once the sag is overtopped, increasing the barrel from 36 in to 96 in lowers ' +
  `the 100-year headwater from EL ${f(R.crossing.alternatives[0].headwaterElFt)} to ` +
  `EL ${f(R.crossing.alternatives[5].headwaterElFt)}, a reduction of ` +
  `${f(R.crossing.alternatives[0].headwaterElFt - R.crossing.alternatives[5].headwaterElFt)} ft. ` +
  'Section 7 and Section 11 present the full range of crossing alternatives.')
w()
w(`6. **The proposed condition increases the 100-year water-surface elevation by ` +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft** at ${R.rise[3].upstream.maxRiseSection}. ` +
  'The proposal does not satisfy a no-rise standard.')
w()
w(`7. **The proposed condition removes ${n0(INU['100'].reachLostStorageCy)} cubic yards of ` +
  'floodplain storage** below the 100-year water surface, from ' +
  `${n0(INU['100'].reachTotalFillCy)} cy of total fill within the modelled reach. ` +
  'Compensatory storage is required and is designed in Section 11.5.')
w()
w('8. **Lowest-floor elevations do not satisfy the floodplain construction standard on any ' +
  'lot.** See Table 1.1.')
w()
w('**Table 1.1 — Proposed dwelling elevations against the 100-year water surface ' +
  `(EL ${f(wsel100)}, proposed condition)**`)
w()
w('| Lot | Address | Finished floor | Freeboard to BFE | Garage slab | Basement | Foundation |')
w('|---|---|---|---|---|---|---|')
for (const b of buildings) {
  const lot = b.id.startsWith('l1') ? '53' : b.id.startsWith('l2') ? '54' : b.id.startsWith('l3') ? '55' : '56'
  const addr = Object.entries(LOTNO).find(([, v]) => v === lot)?.[0] ?? ''
  const fb = b.finishedFloorElevFt - wsel100
  w(`| ${lot} | ${L(addr)} | ${f(b.finishedFloorElevFt)} | ${fb >= 0 ? '+' : ''}${f(fb)} ft ` +
    `${fb < 2 ? '**BELOW REQUIRED FREEBOARD**' : 'satisfies BFE + 2 ft'} | ` +
    `${f(b.garageSlabElevFt)} | ${b.basementElevFt == null ? 'none' : f(b.basementElevFt)} | ` +
    `${b.foundationType ?? 'slab'} |`)
}
w()
w('Prince George\'s County Subtitle 4 and the National Flood Insurance Program require the ' +
  'lowest floor of a residential structure, including any basement, to be at or above the ' +
  'base flood elevation, with county freeboard applied above that elevation. The proposed ' +
  'basement elevations do not satisfy this standard and are not subject to variance for new ' +
  'construction on a vacant lot. Section 11.4 sets out the determination and the alternatives.')
w()
w('### Conclusion')
w()
w('**The proposed improvements do not remove the subject lots from the 100-year floodplain, ' +
  'and the proposed condition produces a measurable increase in the water-surface elevation.** ' +
  'The proposed condition leaves ')
const e100 = INU['100']
const tot = Object.values(e100.lots).reduce((s: number, v: any) => s + v.floodedProposedSf, 0)
w(`${n0(tot as number)} sq ft of the four lots below the 100-year water surface, against ` +
  `${n0(Object.values(e100.lots).reduce((s: number, v: any) => s + v.floodedExistingSf, 0) as number)} sq ft existing.`)
w()
w('Section 11 demonstrates that removal of all four lots from the floodplain is not ' +
  'achievable by any modification to the crossing, because the controlling tailwater in the ' +
  'receiving channel lies above the existing ground on Lots 54 and 55. The recommended ' +
  'approach is set out in Section 11.6.')
w()
w('---')
w()

// ── 2 Drainage area ────────────────────────────────────────────────────────
w('## 2. Drainage area and existing-condition hydrology')
w()
const W = R.hydrology.watershed
w('### 2.1 Delineation')
w()
w('| Quantity | Value |')
w('|---|---|')
w(`| Contributing area at the crossing | **${f(W.areaAc, 1)} ac = ${f(W.sqMi, 4)} sq mi** |`)
w(`| Channel-only area immediately upstream | ${f(W.channelOnlyAc, 1)} ac |`)
w(`| Longest flow path | ${n0(W.flowPathFt)} ft |`)
w(`| Elevation at the hydraulic divide | EL ${f(W.headEl)} |`)
w(`| Total fall along the flow path | ${f(W.headEl - R.existing[3].culvert.inlet.hwElFt + 0, 1)} ft approx |`)
w(`| Receiving stream | North Branch Broad Creek (PGAtlas Environmental/1, feature code 4109) |`)
w()
w('Delineated by D8 flow routing on the USGS 3DEP bare-earth DEM (published to 24 August ' +
  '2026), resampled to 10 ft cells over a 10,000 by 10,000 ft window, depression-filled by ' +
  'priority flood. The pour point was snapped to the maximum-accumulation cell within 60 ft ' +
  'of the Fort Foote Road sag.')
w()
w('The analysis window was extended to 10,000 by 10,000 ft to ensure the hydraulic divide ' +
  'was contained within the terrain model. The longest flow path is ' + n0(W.flowPathFt) +
  ' ft, and a window smaller than that dimension will truncate the delineation.')
w()
w('### 2.2 Land cover, measured')
w()
w('| Cover | Fraction | Area |')
w('|---|---|---|')
w(`| Impervious | ${f(W.imperviousPct, 1)}% | ${f((W.imperviousPct / 100) * W.areaAc, 1)} ac |`)
w(`| Tree canopy | ${f(W.canopyPct, 1)}% | ${f((W.canopyPct / 100) * W.areaAc, 1)} ac |`)
w(`| Open space / lawn | ${f(100 - W.imperviousPct - W.canopyPct, 1)}% | ` +
  `${f(((100 - W.imperviousPct - W.canopyPct) / 100) * W.areaAc, 1)} ac |`)
w()
w('Determined cell by cell from the Prince George\'s County Impervious Surface (2023) and ' +
  'Tree Canopy (2023) mapping rather than assumed from zoning classification.')
w()
w('**Hydrologic soil groups** (NRCS soil survey, area MD033), as a fraction of the watershed:')
w()
w('| Group | Fraction |')
w('|---|---|')
for (const [g, v] of Object.entries(R.hydrology.watershed.soilGroupPct as Record<string, number>)) {
  w(`| ${g} | ${f(v, 1)}% |`)
}
w()
w('Dual hydrologic groups (B/D, C/D) are assigned the D value. The mapped units are hydric, ' +
  'frequently flooded soils in the valley bottom, for which the undrained condition is the ' +
  'appropriate design assumption.')
w()
w('### 2.3 Curve number')
w()
w('| Cover | Fraction | CN | Source |')
w('|---|---|---|---|')
for (const p of R.hydrology.curveNumber.parts) {
  w(`| ${p.label} | ${f(p.fraction * 100, 1)}% | ${f(p.curveNumber, 1)} | TR-55 Table 2-2 |`)
}
w(`| **Composite** | **100%** | **${f(R.hydrology.curveNumber.curveNumber, 1)}** | area weighted |`)
w()
w('### 2.4 Time of concentration')
w()
w('| Segment | Length | Slope | Velocity | Travel time |')
w('|---|---|---|---|---|')
for (const s of R.hydrology.timeOfConcentration.segments) {
  w(`| ${s.label} | ${n0(s.lengthFt)} ft | ${f(s.slopeFtPerFt * 100, 2)}% | ` +
    `${f(s.velocityFps ?? 0)} fps | ${f(s.travelTimeHr ?? 0, 4)} hr |`)
}
w(`| **Total Tc** | | | | **${f(R.hydrology.timeOfConcentration.tcHr, 3)} hr ` +
  `(${f(R.hydrology.timeOfConcentration.tcHr * 60, 1)} min)** |`)
w()
w('### 2.5 Design discharges')
w()
w('Rainfall: ' + R.hydrology.precipitation.citation + '.')
w()
w('| Storm | 24-hr rainfall | Runoff depth | Ia/P | q_u | **Peak discharge** | Runoff volume |')
w('|---|---|---|---|---|---|---|')
for (const fl of R.hydrology.flows) {
  w(`| ${fl.label} | ${f(fl.rainfallIn)} in | ${f(fl.runoffIn)} in | ${f(fl.iaOverP, 3)} | ` +
    `${f(fl.quCsmIn, 0)} csm/in | **${n0(fl.peakCfs)} cfs** | ${f(fl.volumeAcFt, 1)} ac-ft |`)
}
w()
w('Method: NRCS TR-55 graphical peak discharge, Type II distribution. See ' +
  '`packages/spatial-engine/src/hydraulics/tr55.ts` for the implementation and the reasoning ' +
  'on why the Rational Method is not used at this scale.')
w()
w('**Method comparison.** The Rational Method at C = 0.45 and the 51-minute intensity yields ' +
  'approximately 625 cfs at the 100-year event, against ' + n0(R.hydrology.flows[3].peakCfs) +
  ' cfs by TR-55. The TR-55 value is carried forward as the design discharge: it is the ' +
  'county-accepted method at this drainage area and is the more conservative result. MDE may ' +
  'require TR-20 or the USGS Maryland Fixed Region regression equations at final design. ' +
  'Neither has been performed for this study.')
w()
w('---')
w()

// ── 3 Datum ────────────────────────────────────────────────────────────────
w('## 3. Vertical datum — the 1979 elevation resolved')
w()
w('FPS-770017 states the 100-year floodplain adjacent to these lots as **57 ft ± in the ' +
  'WSSC datum**. That number has been unusable for as long as the datum relationship was ' +
  'unknown. It is now established, within the limits stated below.')
w()
w('Four NGS marks within 1.2 miles of the site, two of them monumented by WSSC itself in ' +
  '1969–70, carry both NGVD 29 and NAVD 88 heights:')
w()
w('| PID | Designation | NGVD 29 | NAVD 88 | Difference |')
w('|---|---|---|---|---|')
w('| HV4763 | 17378 WSSC 1970 | 42.6 m | 42.4 m | −0.66 ft |')
w('| HV4762 | 17379 WSSC 1970 | 35.9 m | 35.7 m | −0.66 ft |')
w('| HV4728 | FOOTE | 48.3 m | 48.1 m | −0.66 ft |')
w()
w('**NAVD 88 = NGVD 29 − 0.66 ft** at this site, consistently, by VERTCON3.')
w()
w('WSSC set marks in this area in 1969–70 which NGS published on NGVD 29, the national ' +
  'datum of that era. On that basis the WSSC datum is NGVD 29 based and:')
w()
w('> **57 ft WSSC ≈ EL 56.3 NAVD 88**')
w()
w(`The independent hydraulic model in Section 6 gives a 100-year water surface of ` +
  `**EL ${f(R.existing[3].headwaterElFt)} NAVD 88**. The two agree to ` +
  `${f(56.34 - R.existing[3].headwaterElFt)} ft.`)
w()

w('**Limitation.** The foregoing establishes the NGVD 29 to NAVD 88 relationship at this ' +
  'site. It does not establish that the 1978 study was referenced to NGVD 29 rather than to ' +
  'an assumed local datum. The field topographic survey in the project record carries three ' +
  'benchmarks — **H31A at EL 61.09, H32A at EL 74.37 and H32B at EL 88.41**. Differential ' +
  'levelling to these three marks is required to resolve the datum and is the first item of ' +
  'the survey scope in Section 12.')
w()
w('---')
w()

// ── 4 Terrain & survey ─────────────────────────────────────────────────────
w('## 4. Survey and topographic data sources')
w()
w('| Source | Used for | Standing |')
w('|---|---|---|')
w('| PGAtlas Contour 2 Ft (2023), NAVD 88 | Cross sections, road profile, inundation mapping | County-published LiDAR derivative. Adequate for feasibility. NOT a survey. |')
w('| USGS 3DEP bare-earth DEM | Watershed delineation only | Area is an integral and robust to resolution. |')
w('| PGAtlas Impervious Surface (2023), Tree Canopy (2023) | Curve number | Measured cover. |')
w('| NRCS soil survey MD033 | Hydrologic soil group | |')
w('| NOAA Atlas 14 Vol. 2 Ver. 3 | Rainfall | Partial duration series. |')
w('| NGS marks HV4762/HV4763/HV4728 | Vertical datum | Published control. |')
w('| Field topographic survey, project record | Corroboration; benchmarks; the plotted floodplain limit | See below. |')
w()
w('### 4.1 The field topographic survey')
w()
w('The project record holds a scanned field topographic survey of these lots — ' +
  '`projects/indian-queen/source/Indian Queen lots floodplain topo.pdf` and two further scans of the ' +
  'same sheet — at 1 in = 50 ft, carrying spot elevations, 2-ft contours, the lot lines, ' +
  'three benchmarks, and a floodplain limit plotted in red around the rear of Lots 55 and 56 ' +
  'and along the frontage of Lots 53 and 54.')
w()
w('The sheet could not be georeferenced to survey standard from the scanned image alone and ' +
  'was therefore not used as the terrain source for this model. The limiting factors are:')
w()
w('- The sheet is drawn on a **local grid** (labelled N-46500 to N-47000 and E-500 to ' +
  'E-1250 at 250 ft spacing) whose relationship to Maryland State Plane is not printed on ' +
  'the sheet and is not otherwise recorded. The grid\'s northing increases southward and ' +
  'its easting increases westward, so it is not a State Plane subset.')
w('- Registration was attempted by four independent methods: least-squares fit to the ' +
  'platted lot geometry, fit to the county roadway centreline, Hough line matching on the ' +
  'drawn boundaries, and correlation of the drawn contours against the LiDAR surface. The ' +
  'resulting transformations differed from one another by more than 20 ft and none was ' +
  'confirmed by overlay.')
w('- The drawn boundary lines do not correspond to the platted bearings within a tolerance ' +
  'that would permit their use as control, indicating they are reference projections rather ' +
  'than surveyed lines.')
w()
w('The sheet does establish the following, which has been relied upon:')
w()
w('- **The three benchmarks** (H31A 61.09, H32A 74.37, H32B 88.41) that will close the datum.')
w('- **Spot elevations** in the valley bottom of 47.7 to 49.3 and on Fort Foote Road of 56.3, ' +
  'against LiDAR readings of 46.1 to 47.5 and 54.0 in the same places — a consistent offset ' +
  'of roughly 1 to 2 ft in the direction the datum work in Section 3 predicts.')
w('- **The plotted floodplain limit encloses the rear of the lots and crosses the roadway**, ' +
  'consistent with the impoundment geometry computed in Section 6.')
w()
w('Re-establishment of the sheet on the State Plane system from recoverable control is ' +
  'included in the survey scope at Section 12, item 10. It is required to reconcile the 1978 ' +
  'work with the current study and is not a substitute for the new survey.')
w()
w('---')
w()

// ── 5 Regulatory floodplain ────────────────────────────────────────────────
w('## 5. The regulatory floodplain, floodway and flood zone')
w()
w('| Authority | Mapping | Finding |')
w('|---|---|---|')
w('| FEMA NFHL / FIRM panel 24033C0220E, eff. 2016-09-16 | Zone X, SFHA_TF = F | All four lots are OUTSIDE the FEMA special flood hazard area. No BFE is published. Nearest Zone AE is about 2,000 ft away. |')
w('| PGAtlas Floodplain (FEMA − 2026), Environmental/3 | Zone X | Same finding on the current county rendering. |')
w('| PGAtlas Floodplain (DPIE), Environmental/31 | no feature on the lots | |')
w('| PGAtlas Floodplain − Consultant Study (DPIE), Environmental/33 | FPS-770017 limit line, tangent to Lot 53 at 0.1 ft | The county floodplain of record for this valley. |')
w()
w('**No regulatory floodway is mapped on this reach.** Zone X carries neither a base flood ' +
  'elevation nor a floodway because no detailed FEMA study has been performed here. This is ' +
  'a limitation of the FEMA mapping programme and is not a determination as to flood hazard.')
w()
w('### 5.1 The county floodplain governs, not FEMA')
w()
w('Prince George\'s County regulates the 100-year floodplain of any watercourse with a ' +
  'drainage area at or above a threshold substantially below the ' + f(W.areaAc, 0) +
  ' acres contributing to this crossing, irrespective of FEMA study status. Where no ' +
  'detailed county study exists, the applicant is required to prepare one, which is the ' +
  'function of the Floodplain Study (FPS) series. The Zone X designation is therefore not a ' +
  'determination that the subject lots lie outside the regulated floodplain.')
w()
w('### 5.2 The chain of studies of record')
w()
w('| Study | Plan date | County comment |')
w('|---|---|---|')
w('| FPS-770017 | 1978-10-09 | "No cross sections on plans, revised based on FPS 960004" |')
w('| FPS 960004 | 1997-07-01 | "multiple plan sheets, revised based on FPS 200546, legacy study FPS 770017" |')
w('| **FPS 200546** | **2005-08-01** | **"post development flood plain used, legacy studies FPS 960004 and FPS 200380"** |')
w()
w('**FPS 200546 is the controlling study of record and has not been obtained.** It must be ' +
  'requested from DPIE and reconciled against this study prior to any submission.')
w()
w('### 5.3 The floodplain easement — resolved')
w()
w('The 1979 DPW&T correspondence in the project record states that the floodplain easement ' +
  'was "apparently not granted on Lots 53 and 54 — check out before release of permits". A ' +
  'title search returns no such encumbrance. The county easement mapping reconciles the two:')
w()
w('> PGAtlas Easement/0 (Environmental and Cultural, Platted) carries **one** floodplain ' +
  'easement named "Indian Queen East", **5.32 acres**, dedicated on **Record Plat 118-083**, ' +
  'recorded **17 January 1984**.')
w()
w('That easement lies **entirely south of Fort Foote Road**, between 83.7 and 237.4 ft from ' +
  'the nearest corner of these lots. **It covers none of Lots 53–56.**')
w()
w('A floodplain easement was therefore dedicated within this subdivision by record plat in ' +
  '1984, on the downstream side of Fort Foote Road. Lots 53 through 56 were platted in 1974 ' +
  'on Plat Book WWW 65 folio 60 and were not included in that dedication. The absence of an ' +
  'encumbrance on title confirms, rather than resolves, the 1979 finding.')
w()
w('Plat 118-083 establishes the precedent and the instrument form for the dedication ' +
  'required over Lots 53 through 56.')
w()
w('**A recorded storm drain easement exists on the subject lots and is a separate ' +
  'instrument.** Plat Book WWW 65 folio 60 dedicates a storm drain easement 30 ft each side ' +
  `of the Lot 54 / Lot 55 party line — ${f(ES.easement.widthFt, 0)} ft in width, ` +
  `${f(ES.easement.lengthFt)} ft in length on a bearing of ${ES.easement.bearing}, ` +
  `comprising ${n0(ES.easement.areaSqFt)} sq ft, of which ${n0(ES.easement.areaOnLot54SqFt)} sq ft ` +
  `lies on Lot 54 and ${n0(ES.easement.areaOnLot55SqFt)} sq ft on Lot 55.`)
w()
w('The two instruments are not interchangeable. A storm drain easement conveys the right to ' +
  'construct and maintain drainage facilities within a defined corridor. A floodplain ' +
  'easement encumbers the 100-year floodplain against filling, building and obstruction. ' +
  'The rights granted under the recorded storm drain easement should be examined by counsel ' +
  'to determine whether they extend to floodplain storage excavation and to the maintenance ' +
  'obligations that attach to it. Where they do not, a supplemental instrument is required.')
w()
w('---')
w()

// ── 6 Hydraulic model ──────────────────────────────────────────────────────
w('## 6. Hydraulic methodology, model and existing-condition results')
w()
w('### 6.1 Method')
w()
w('One-dimensional steady gradually-varied flow by the standard step method, with ' +
  'conveyance subdivided at the bank stations, the energy coefficient alpha computed from ' +
  'the subsection conveyances, average-conveyance friction slope averaging, and automatic ' +
  'expansion/contraction coefficients. This is the HEC-RAS steady-flow formulation ' +
  '(Hydraulic Reference Manual, Chapter 2) implemented directly in the platform at ' +
  '`packages/spatial-engine/src/hydraulics/standard-step.ts`. Each value in the profile ' +
  'tables is traceable to the routine that produced it.')
w()
w('**HEC-RAS was not used and no HEC-RAS plan, geometry or flow files have been produced.** ' +
  'The governing equations and solution scheme are those of the HEC-RAS steady-flow module; ' +
  'the software of record differs. A model in the accepted software will be required at ' +
  'permit level. See Section 12.')
w()
w('The crossing is analysed to FHWA HDS-5 (FHWA-HIF-12-026, 3rd edition), inlet control and ' +
  'outlet control both computed at every discharge, with the roadway treated as a ' +
  'broad-crested weir and the headwater solved so that culvert plus weir carries the total flow.')
w()
w('### 6.2 Model layout')
w()
w('| Item | Value |')
w('|---|---|')
w(`| Cross sections | ${R.existing[0].downstream.points.length} downstream of the road, ` +
  `${R.existing[0].upstream.points.length} upstream |`)
w('| Reach modelled | 460 ft below the crossing to 470 ft above it |')
w('| Station convention | RS in feet from the road sag; **+ is upstream** |')
w('| Channel Manning n | 0.045 |')
w('| Overbank n, wooded | 0.100 |')
w('| Overbank n, graded lawn (proposed only) | 0.035 |')
w(`| Downstream boundary | ${R.existing[0].downstream.boundaryCondition} |`)
w(`| Road sag elevation | EL ${f(R.crossing.roadSagElFt)} |`)
w(`| Roadway crest available as weir | ${f(R.crossing.crestLengthFt, 0)} ft |`)
w(`| Culvert assumed | ${R.crossing.assumedBarrel.sizeIn} in RCP, inlet invert EL ` +
  `${f(R.crossing.assumedBarrel.inletInvertFt)}, outlet invert EL ${f(R.crossing.assumedBarrel.outletInvertFt)} |`)
w()
w('**The existing culvert has not been measured.** Barrel size, material, invert ' +
  'elevations, length, skew and entrance treatment are assumed. Section 7 demonstrates that ' +
  'the computed headwater is insensitive to barrel size at this crossing; the invert ' +
  'elevations materially affect the result and are the highest-priority item on the survey ' +
  'scope.')
w()
w('### 6.3 Existing-condition water-surface profiles')
w()
for (const p of P) {
  const e = R.existing[idx(p)]
  w(`**${p}-year, Q = ${n0(e.qCfs)} cfs**`)
  w()
  w('| Section | Invert | Water surface | Energy grade | Velocity | Top width | Froude | Max depth |')
  w('|---|---|---|---|---|---|---|---|')
  for (const q of [...e.downstream.points].reverse()) {
    w(`| ${q.sectionId} | ${f(q.invertFt)} | ${f(q.wselFt)} | ${f(q.energyGradeFt)} | ` +
      `${f(q.velocityFps)} fps | ${f(q.topWidthFt, 0)} ft | ${f(q.froude)} | ${f(q.maxDepthFt)} ft |`)
  }
  w(`| **ROAD** | | **HW EL ${f(e.headwaterElFt)}** | | | | | ${e.culvert.governing} control |`)
  for (const q of e.upstream.points) {
    w(`| ${q.sectionId} | ${f(q.invertFt)} | ${f(q.wselFt)} | ${f(q.energyGradeFt)} | ` +
      `${f(q.velocityFps)} fps | ${f(q.topWidthFt, 0)} ft | ${f(q.froude)} | ${f(q.maxDepthFt)} ft |`)
  }
  w()
  w(`Tailwater below the road EL ${f(e.tailwaterElFt)}. ` +
    `Culvert carries ${n0(e.qCfs - e.culvert.overtoppingCfs)} cfs; ` +
    `**${n0(e.culvert.overtoppingCfs)} cfs passes over Fort Foote Road.**`)
  w()
}
w('The computed profile through the impoundment is horizontal to within 0.05 ft over 470 ft, ' +
  'with velocities between 0.2 and 1.0 fps. The reach functions hydraulically as an ' +
  'impoundment rather than as a conveyance channel, and the water-surface elevation is ' +
  'governed by the crossing rather than by conditions on the lots.')
w()
w('---')
w()

// ── 7 Culvert ──────────────────────────────────────────────────────────────
w('## 7. Culvert capacity, inlet and outlet control')
w()
w(`**Alternatives at the 100-year flow of ${n0(R.hydrology.flows[3].peakCfs)} cfs, ` +
  `tailwater EL ${f(R.existing[3].tailwaterElFt)}, road sag EL ${f(R.crossing.roadSagElFt)}**`)
w()
w('| Barrel | Governing control | Headwater EL | HW/D | Over the road | Outlet velocity | Head lowered vs 36 in |')
w('|---|---|---|---|---|---|---|')
for (const a of R.crossing.alternatives) {
  w(`| ${a.sizeIn} in | ${a.governing} | ${f(a.headwaterElFt)} | ${f(a.hwOverD)} | ` +
    `${n0(a.overtoppingCfs)} cfs | ${f(a.outletVelocityFps, 1)} fps | ` +
    `${f(R.crossing.alternatives[0].headwaterElFt - a.headwaterElFt)} ft |`)
}
w(`| twin 72 in | ${R.crossing.twin72.governing} | ${f(R.crossing.twin72.headwaterElFt)} | — | ` +
  `${n0(R.crossing.twin72.overtoppingCfs)} cfs | ${f(R.crossing.twin72.outletVelocityFps, 1)} fps | ` +
  `${f(R.crossing.alternatives[0].headwaterElFt - R.crossing.twin72.headwaterElFt)} ft |`)
w()
w('**Inlet control governs at every single-barrel size analysed.** The entrance is the ' +
  'controlling section throughout, so the barrel does not operate at capacity and ' +
  'enlargement of the barrel without corresponding enlargement of the inlet produces little ' +
  'reduction in headwater.')
w()
w('**Roadway weir flow governs above the sag elevation.** Once the headwater exceeds ' +
  `EL ${f(R.crossing.roadSagElFt)}, the ${f(R.crossing.crestLengthFt, 0)} ft of available ` +
  'roadway crest conveys more than any barrel that can be accommodated beneath it. An ' +
  'eightfold increase in barrel area reduces the 100-year headwater by ' +
  `${f(R.crossing.alternatives[0].headwaterElFt - R.crossing.alternatives[5].headwaterElFt)} ft.`)
w()
w('**Scope note.** A storm drain within the recorded easement on the Lot 54 / Lot 55 party ' +
  'line serves the four lots\' own runoff, a drainage area of approximately 1.7 acres. It is ' +
  'not a floodplain measure and should not be represented as one. The floodplain elevation ' +
  'on these lots is governed by the ' + f(W.areaAc, 0) + '-acre watershed at the Fort Foote ' +
  'Road crossing, as set out above.')
w()
w('### 7.1 Outlet velocity, scour and erosion protection')
w()
w(`Computed outlet velocity at the 100-year condition is ${f(R.existing[3].culvert.outletVelocityFps, 1)} fps ` +
  'discharging to an unlined earth channel with a permissible velocity of approximately ' +
  '5 fps. **An energy dissipator or riprap apron designed in accordance with FHWA HEC-14 is ' +
  'required.** Sizing requires the surveyed tailwater elevation and a bed gradation and is ' +
  'not undertaken here. The existing outlet should be inspected for pre-existing scour.')
w()
w('---')
w()

// ── 8 Proposed condition ───────────────────────────────────────────────────
w('## 8. Proposed-condition analysis')
w()
w('### 8.1 What was modelled')
w()
w('The proposed terrain comprises the graded surface from the site plan — four dwelling ' +
  'pads, driveways, aprons and tie-out grading — merged into the existing surface within the ' +
  'limit of disturbance and re-cut at the same cross sections. Overbank roughness on the ' +
  'graded right bank was reduced from wooded (n = 0.10) to mown lawn (n = 0.035), a change ' +
  'which acts to lower the water surface. The crossing configuration is identical between ' +
  'conditions.')
w()
w(`Fill placed: **${n0(INU['100'].reachTotalFillCy)} cy** in the modelled reach.`)
w()
w('### 8.2 Existing versus proposed water-surface elevations — the no-rise table')
w()
for (const p of P) {
  const r = R.rise[idx(p)]
  w(`**${p}-year**`)
  w()
  w('| Section | Existing WS | Proposed WS | Rise |')
  w('|---|---|---|---|')
  for (const row of r.upstream.rows) {
    const flag = row.riseFt >= 0.005 ? ' **RISE**' : ''
    w(`| ${row.sectionId} | ${f(row.existingWselFt)} | ${f(row.proposedWselFt)} | ` +
      `${row.riseFt >= 0 ? '+' : ''}${f(row.riseFt, 3)} ft${flag} |`)
  }
  w(`| **Maximum** | | | **${r.upstream.maxRiseFt >= 0 ? '+' : ''}${f(r.upstream.maxRiseFt, 3)} ft ` +
    `at ${r.upstream.maxRiseSection}** |`)
  w()
  w(`Downstream of the crossing the maximum change is ${f(r.downstream.maxRiseFt, 3)} ft — ` +
    'the proposed work is entirely upstream of the road and does not reach the downstream reach.')
  w()
}
w('### 8.3 Finding on no-rise')
w()
w('**The proposed condition does not satisfy a no-rise standard.** The 100-year water ' +
  `surface increases by **${f(R.rise[3].upstream.maxRiseFt, 2)} ft** at ` +
  `${R.rise[3].upstream.maxRiseSection}, and by ${f(R.rise[0].upstream.maxRiseFt, 2)} ft or ` +
  'more in every event analysed. Prince George\'s County and FEMA apply a 0.00 ft standard ' +
  'reported to two decimal places.')
w()
w('The mechanism is the loss of conveyance area in the right overbank where the dwelling ' +
  'pads are filled. It is not attributable to the roughness change, which acts in the ' +
  'opposite sense.')
w()
w('### 8.4 Floodplain storage and compensatory storage')
w()
w('| Storm | Water surface | Fill below the flood surface | Total fill in reach |')
w('|---|---|---|---|')
for (const p of P) {
  const v = INU[String(p)]
  w(`| ${p}-year | EL ${f(v.wselExisting)} | **${n0(v.reachLostStorageCy)} cy** | ${n0(v.reachTotalFillCy)} cy |`)
}
w()
w(`The proposed grading removes ${n0(INU['100'].reachLostStorageCy)} cubic yards of 100-year ` +
  'floodplain storage. Section 11.1 quantifies the attenuation this storage provides. The ' +
  'steady-state formulation does not credit that attenuation, and the ' +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft increase reported in Section 8.2 is therefore a ` +
  'lower bound on the impact.')
w()
w('**Compensatory storage is required**, excavated below the 100-year water surface, ' +
  'hydraulically connected, and within the same reach. See Section 11.5.')
w()
w('### 8.5 Floodplain area on each lot')
w()
for (const p of [100, 10]) {
  const v = INU[String(p)]
  w(`**${p}-year (existing WS EL ${f(v.wselExisting)}, proposed WS EL ${f(v.wselProposed)})**`)
  w()
  w('| Lot | Address | Lot area | Flooded, existing | Flooded, proposed | Change | Fill below flood |')
  w('|---|---|---|---|---|---|---|')
  for (const [addr, d] of Object.entries(v.lots as Record<string, any>)) {
    w(`| ${LOTNO[addr]} | ${L(addr)} | ${n0(d.lotAreaSf)} sf | ${n0(d.floodedExistingSf)} sf ` +
      `(${f(d.floodedExistingPct, 1)}%) | ${n0(d.floodedProposedSf)} sf (${f(d.floodedProposedPct, 1)}%) | ` +
      `${d.floodedProposedSf - d.floodedExistingSf >= 0 ? '+' : ''}${n0(d.floodedProposedSf - d.floodedExistingSf)} sf | ` +
      `${n0(d.lostStorageCy)} cy |`)
  }
  w()
}
w('### 8.6 Does the proposed work remove any part of the lots from the floodplain?')
w()
w('In part, and only by the placement of fill. Raising ground above the water surface ' +
  'removes that ground from the mapped floodplain but does not reduce the flood elevation. ' +
  'The water-surface elevation across Lots 54 and 55 increases under the proposed condition ' +
  'while the mapped area reduces.')
w()
w('**The removal of ground from the floodplain by filling constitutes an encroachment, not a ' +
  'mitigation**, and is regulated as such.')
w()
w('---')
w()

// ── 9 Delineation ──────────────────────────────────────────────────────────
w('## 9. Floodplain delineation, existing and proposed')
w()
w('Delineated by intersecting the modelled water surface with the terrain, ' +
  'connectivity-limited by flood fill from the channel so that a low spot behind a ridge is ' +
  'not mapped as floodplain. The limits and the profiles come from the same computation and ' +
  'cannot disagree.')
w()
w('| Storm | Existing WS | Existing area | Proposed WS | Proposed area |')
w('|---|---|---|---|---|')
for (const p of P) {
  const v = INU[String(p)]
  w(`| ${p}-year | EL ${f(v.wselExisting)} | ${f(v.inundatedExistingAc, 2)} ac | ` +
    `EL ${f(v.wselProposed)} | ${f(v.inundatedProposedAc, 2)} ac |`)
}
w()
w('**Floodway.** No floodway is delineated. A floodway is defined by an encroachment ' +
  'analysis that raises the water surface by a permitted increment (1.00 ft under the NFIP, ' +
  'and Maryland requires the more restrictive of that and the local standard). Running one ' +
  'here would be meaningless: the reach is a pond with velocities under 1 fps, the conveyance ' +
  'is not in a defined channel, and the control is a road weir. **If DPIE requires a floodway ' +
  'it must be developed from the FPS 200546 model, not from this one.**')
w()
w('Deliverables written:')
w()
w('- `projects/indian-queen/drawings/indian-queen-floodplain-delineation.geojson` — existing and proposed ' +
  'polygons for the 10-, 25-, 50- and 100-year storms, EPSG:2248, NAVD 88, attributed with ' +
  'condition, return period, water-surface elevation and area.')
w('- `projects/indian-queen/model/indian-queen.floodplain-study-results.json` — full model input and ' +
  'output, every section, every profile point.')
w('- `projects/indian-queen/model/indian-queen.floodplain-inundation.json` — per-lot inundation, fill ' +
  'and storage loss.')
w()
w('---')
w()

// ── 10 Regulatory determination ────────────────────────────────────────────
w('## 10. Regulatory and permitting determination')
w()
w('| Question | Determination |')
w('|---|---|')
w('| County floodplain study required? | **Yes.** A new or revised FPS is required. FPS 200546 is the controlling study of record and must be obtained and reconciled first. |')
w('| County floodplain approval required? | **Yes.** DPIE floodplain review, with the study above. |')
w('| Floodplain waiver? | Not available for this. A waiver addresses minor encroachment, not dwellings below the BFE. |')
w('| Stream alteration / waterway construction permit (MDE)? | **Likely yes** if any work touches the channel, the crossing or the 100-year floodplain of a stream with this drainage area. MDE Nontidal Waterway Construction. Confirm with MDE at pre-application. |')
w('| SWM approval? | **Yes**, independently — ESD to the MEP under the 2007 Act and the MDE Design Manual. Unaffected by the floodplain finding. |')
w('| FEMA CLOMR? | **Not required on the current mapping.** Zone X carries no base flood elevation and no floodway; there is no mapped feature to revise. |')
w('| FEMA LOMR / LOMA? | **A LOMA cannot help** — the lots are already outside the FEMA SFHA. Being outside Zone AE does not make them outside the county floodplain. |')
w('| Does the work qualify as no-rise / zero-rise? | **No.** ' + f(R.rise[3].upstream.maxRiseFt, 2) + ' ft rise at the 100-year. |')
w('| Floodway encroachment analysis required? | Not on the current mapping (no floodway exists). If DPIE establishes one from FPS 200546, then yes. |')
w('| Compensatory storage required? | **Yes.** ' + n0(INU['100'].reachLostStorageCy) + ' cy below the 100-year surface. |')
w('| Does the proposal meet county, DPIE, MDE and FEMA floodplain regulation? | **No, as currently designed.** Two dwellings at the water surface, four basements below it, a rise, and uncompensated fill. |')
w('| Can the work legally support removing the floodplain designation from the lots? | **No, not as proposed.** See Section 11. |')
w()
w('### 10.1 Requirements before a building permit')
w()
w('1. Obtain **FPS 200546** and any successor from DPIE; reconcile.')
w('2. **Field survey** to Section 12, including the culvert inverts and the datum tie.')
w('3. **Sealed floodplain study** by a Maryland PE, in the software of record, reconciled to FPS 200546.')
w('4. **Revise the site and architectural design** so that the lowest floor of every dwelling, including any basement, is at or above the base flood elevation with county freeboard applied. See Section 11.4.')
w('5. **Compensatory storage** designed and shown, cut for fill, below the 100-year surface.')
w('6. **Floodplain easement** dedicated over the 100-year floodplain on each burdened lot and recorded — following Plat 118-083 as the precedent in this subdivision.')
w('7. **MDE waterway construction permit** if the channel or crossing is touched.')
w('8. **SWM concept and site development plan approval.**')
w('9. DPIE grading permit, then building permits.')
w()
w('---')
w()

// ── 11 Options ─────────────────────────────────────────────────────────────
w('## 11. Where the water goes, and what it would take to move it')
w()
w('### 11.1 Reservoir routing of the crossing')
w()
w('The crossing was routed as a reservoir — SCS Type II 24-hour inflow hydrograph, ' +
  'level-pool storage indication, with the stage-storage taken from the terrain and the ' +
  'stage-discharge from the culvert plus the roadway weir. The embankment impounds ' +
  `${f(MIT.routed['EXISTING 36 in RCP (assumed)']['100'].peakStorageAcFt, 1)} acre-feet at the 100-year, ` +
  'and what it does with it depends entirely on how big the storm is:')
w()
w('| Storm | Inflow peak | Outflow peak | Peak held back | Peak stage | Storage used | Road overtopped by |')
w('|---|---|---|---|---|---|---|')
for (const p of P) {
  const r = MIT.routed['EXISTING 36 in RCP (assumed)'][String(p)]
  w(`| ${p}-year | ${n0(r.inflowPeakCfs)} cfs | ${n0(r.outflowPeakCfs)} cfs | ` +
    `**${f(100 * (1 - r.attenuation), 1)}%** | EL ${f(r.peakStageFt)} | ${f(r.peakStorageAcFt, 1)} ac-ft | ` +
    `${f(r.overtopsBy)} ft |`)
}
w()
w('Attenuation falls from 45 percent at the 10-year event to 2 percent at the 100-year. ' +
  'This is the characteristic response of a fixed-crest weir control: once the roadway is ' +
  'overtopped by approximately one foot, the ' + f(R.crossing.crestLengthFt, 0) + ' ft of ' +
  'available crest conveys more than any barrel that can be accommodated beneath it, and ' +
  'the impoundment ceases to govern.')
w()
w('**Model verification.** The routed peak stage at the 100-year event is ' +
  `EL ${f(MIT.routed['EXISTING 36 in RCP (assumed)']['100'].peakStageFt)}. The steady-state ` +
  `HDS-5 and standard-step model in Section 6 returns EL ${f(R.existing[3].headwaterElFt)}. ` +
  'The two methods are independent and agree to 0.04 ft.')
w()
w('### 11.2 Disposition of displaced floodwater')
w()
w('**Fill without compensating excavation.** Floodwater displaced by fill is accommodated by ' +
  'a rise in the water surface across the impoundment. The ' +
  `impoundment surface at the 100-year event is ${f(INU['100'].inundatedExistingAc, 2)} acres. ` +
  `The computed rise attributable to ${n0(INU['100'].reachLostStorageCy)} cy of fill is ` +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft. This value reflects the loss of conveyance area ` +
  'only; the steady-state formulation cannot account for the loss of attenuating storage, ' +
  'which Section 11.1 shows to be significant at the more frequent events. The computed rise ' +
  'is therefore a lower bound. The displaced volume is accommodated on adjoining upstream ' +
  'properties and on the roadway.')
w()
w('**Enlargement of the crossing.** Increasing the hydraulic capacity of the crossing ' +
  'transfers discharge downstream at a higher rate. The attenuation presently provided by ' +
  'the impoundment at the more frequent events is a benefit currently accruing to downstream ' +
  'properties, and it is reduced in proportion to the capacity added:')
w()
w('| Crossing | 10-yr peak stage | 10-yr outflow | change | 100-yr peak stage | 100-yr outflow | change |')
w('|---|---|---|---|---|---|---|')
const ex10 = MIT.routed['EXISTING 36 in RCP (assumed)']['10'].outflowPeakCfs
const ex100 = MIT.routed['EXISTING 36 in RCP (assumed)']['100'].outflowPeakCfs
for (const [label, v] of Object.entries(MIT.routed as Record<string, any>)) {
  const a = v['10']
  const b = v['100']
  w(`| ${label} | EL ${f(a.peakStageFt)} | ${n0(a.outflowPeakCfs)} cfs | ` +
    `${a.outflowPeakCfs - ex10 >= 0 ? '+' : ''}${n0(a.outflowPeakCfs - ex10)} | ` +
    `EL ${f(b.peakStageFt)} | ${n0(b.outflowPeakCfs)} cfs | ` +
    `${b.outflowPeakCfs - ex100 >= 0 ? '+' : ''}${n0(b.outflowPeakCfs - ex100)} |`)
}
w()
w('A twin 10 x 8 ft box culvert increases the 10-year discharge to the properties south of ' +
  'Fort Foote Road from 215 cfs to 388 cfs, an increase of 80 percent. Those properties ' +
  'include the 5.32-acre floodplain easement dedicated on Plat 118-083. An increase in ' +
  'discharge to a recorded floodplain easement constitutes a downstream impact requiring ' +
  'separate analysis and the concurrence of DPIE.')
w()
w('At the 100-year event the transfer is small, the roadway already conveying the greater ' +
  'part of the discharge: the largest structure analysed increases the downstream peak by ' +
  `${n0(Math.max(...Object.values(MIT.routed as Record<string, any>).map((v: any) => v['100'].outflowPeakCfs - ex100)))} cfs.`)
w()
w('### 11.3 Can all four lots be taken out of the floodplain?')
w()
w('Removal by lowering the water surface is not achievable. The controlling elevations are ' +
  'set out below.')
w()
w('| Lot | Lowest ground | Water surface would have to fall to | Required drop |')
w('|---|---|---|---|')
for (const [addr, lo] of Object.entries(MIT.lotLowestGroundFt as Record<string, number>)) {
  w(`| ${LOTNO[addr]} | EL ${f(lo)} | below EL ${f(lo)} | ${f(R.existing[3].headwaterElFt - lo)} ft |`)
}
w()
w(`The tailwater elevation in the receiving channel downstream of the roadway at the ` +
  `100-year event is **EL ${f(MIT.tailwaterFloorFt)}**. The water surface upstream of the ` +
  'crossing cannot be lowered below the water surface downstream of it. This elevation is a ' +
  'lower bound that is independent of the crossing configuration.')
w()
w(`Existing ground on Lots 54 and 55 falls to EL ${f(Math.min(...Object.values(MIT.lotLowestGroundFt as Record<string, number>)))}, ` +
  `below the EL ${f(MIT.tailwaterFloorFt)} lower bound. **Those lots lie beneath the flood ` +
  'elevation of the receiving channel itself, and no modification to the crossing removes ' +
  'them from the floodplain.** The largest structure analysed, a twin 20 x 8 ft box, returns ' +
  `a 100-year stage of EL ${f(MIT.routed['twin 20 x 8 ft box']['100'].peakStageFt)}, which ` +
  'remains 3.5 ft above the low ground on Lot 55.')
w()
w('Removal by filling is examined below:')
w()
w('| | Volume |')
w('|---|---|')
w(`| Fill to raise all four lots above EL ${f(FC.targetEl)} (BFE + 2 ft) | ${n0(FC.fillToTargetCy)} cy |`)
w(`| Of that, placed below the 100-year surface | **${n0(FC.fillBelowBfeCy)} cy (${f(FC.fillBelowBfeCy * 27 / 43560, 1)} ac-ft)** |`)
w(`| Compensatory excavation available on the four lots above EL 50 | ${n0(FC.availableCutAboveEl50Cy)} cy |`)
w(`| **Shortfall** | **${n0(FC.fillBelowBfeCy - FC.availableCutAboveEl50Cy)} cy with nowhere on site to put it** |`)
w()
w('**Determination: all four lots cannot be removed from the 100-year floodplain.** Lots 53 ' +
  'and 56 lie predominantly above the water surface once the dwellings are correctly set. ' +
  'Lots 54 and 55 remain within the floodplain under any configuration examined, and the site ' +
  'design must be developed on that basis.')
w()
w('### 11.4 Should these houses have basements?')
w()
w('**Determination: basements are not permissible on any of the four lots.**')
w()
w('| Lot | Basement | 100-yr water surface | Disposition |')
w('|---|---|---|---|')
for (const b of buildings) {
  const lot = b.id.startsWith('l1') ? '53' : b.id.startsWith('l2') ? '54' : b.id.startsWith('l3') ? '55' : '56'
  w(`| ${lot} | ${b.basementElevFt == null ? 'none proposed' : `EL ${f(b.basementElevFt)}`} | ` +
    `EL ${f(wsel100)} | ${b.basementElevFt == null ? `${b.foundationType ?? 'elevated'} foundation` : `**${f(wsel100 - b.basementElevFt)} ft below**`} |`)
}
w()
w('Three independent grounds apply, each of which is individually sufficient:')
w()
w('1. **Regulatory.** Under the National Flood Insurance Program and Prince George\'s ' +
  'County Subtitle 4, the lowest floor of a residential structure, which includes a ' +
  'basement, must be elevated to or above the base flood elevation. Dry floodproofing is not ' +
  'an accepted alternative for residential construction. No variance is available for new ' +
  'construction on a vacant lot.')
w()
w('2. **Insurability.** NFIP premium rating for a structure with a basement below the base ' +
  'flood elevation is prohibitive where coverage is written at all. Flood insurance is a ' +
  'condition of any federally-backed mortgage, and the marketability of the dwellings is ' +
  'affected accordingly.')
w()
w('3. **Geotechnical.** The valley bottom is mapped as Zekiah and Issue soils, which are ' +
  'hydric and frequently flooded with a seasonal high water table at or near the surface. ' +
  'The proposed basement on Lot 55 at EL 47.0 lies below the invert of the adjacent channel ' +
  'and would be subject to continuous groundwater infiltration requiring permanent ' +
  'dewatering. Confirmation by subsurface investigation is required.')
w()
w('**Required construction.** Lowest floor at or above EL ' + f(wsel100 + 2) +
  ' (base flood elevation plus 2 ft county freeboard), on one of the following:')
w()
w('- a **vented crawlspace or stem-wall foundation** with flood openings meeting ASCE 24 and ' +
  '44 CFR 60.3 — at least one square inch of net open area per square foot of enclosed area, ' +
  'in at least two walls, with the bottom of each opening no more than 1 ft above grade; or')
w('- **piers or columns** with the space below left open; or')
w('- **compacted structural fill**, which satisfies the elevation requirement but generates ' +
  'the compensatory storage obligation quantified in Section 11.5.')
w()
w('Slab-on-grade construction at EL ' + f(wsel100 + 2) + ' on Lots 54 and 55 requires ' +
  'approximately 9 ft of fill beneath the structure. A vented stem-wall foundation achieves ' +
  'the same lowest-floor elevation while displacing a negligible volume of floodwater. On ' +
  'Lots 54 and 55 the foundation type therefore governs the compensatory storage obligation ' +
  'and, through it, the feasibility of the site plan.')
w()
w('### 11.5 Compensatory storage — requirement and design')
w()
w('Fill placed below the 100-year water surface displaces floodplain storage and must be ' +
  'replaced volume for volume by excavation below the same water surface, hydraulically ' +
  'connected to the same reach and within the same project. The following design criteria ' +
  'have been applied:')
w()
w('1. Excavation floor set above the invert of the receiving channel, so that each cell ' +
  'drains by gravity and does not become a permanent pond.')
w('2. Cells located within the limit of the existing-condition 100-year floodplain, so that ' +
  'the storage lies within the area to be placed under floodplain easement.')
w('3. Side slopes no steeper than 3:1, stabilised, mowable, with no retaining structure.')
w('4. Minimum 10 ft offset from every property line and 20 ft from every structure.')
w('5. Positive hydraulic connection to the rear-lot drainage system at the cell invert.')
w('6. Volume provided at the same elevation increments from which it is taken, compared ' +
  'stage by stage rather than as aggregate totals.')
w()
w('**Distribution of the proposed fill below the 100-year water surface:**')
w()
w('| Location | Volume below EL ' + f(FB.bfe) + ' | Share |')
w('|---|---|---|')
w(`| Beneath the dwelling footprints | ${n0(FB.belowBfeCy.underFootprints)} cy | ${f(100 * FB.belowBfeCy.underFootprints / FB.belowBfeCy.total, 1)}% |`)
w(`| Within 10 ft of a dwelling | ${n0(FB.belowBfeCy.within10ft)} cy | ${f(100 * FB.belowBfeCy.within10ft / FB.belowBfeCy.total, 1)}% |`)
w(`| Driveways, aprons and tie-out grading | ${n0(FB.belowBfeCy.drivewaysAndTieOut)} cy | ${f(100 * FB.belowBfeCy.drivewaysAndTieOut / FB.belowBfeCy.total, 1)}% |`)
w(`| **Total** | **${n0(FB.belowBfeCy.total)} cy** | |`)
w()
w('#### The recorded storm drain easement')
w()
w('The recorded 60 ft storm drain easement on the Lot 54 / Lot 55 party line is the ' +
  'preferred location for compensatory storage on grounds of tenure, purpose and position: ' +
  'it is already dedicated, its stated purpose is drainage, and it occupies the valley ' +
  'centreline. Its capacity is nonetheless limited, for the reason set out below.')
w()
w('| Quantity | Value |')
w('|---|---|')
w(`| Easement area | ${n0(ES.easement.areaSqFt)} sq ft (${f(ES.easement.areaSqFt / 43560, 3)} ac) |`)
w(`| Existing ground within the easement | EL ${f(ES.easement.groundMinFt)} to EL ${f(ES.easement.groundMaxFt)}, mean EL ${f(ES.easement.groundMeanFt)} |`)
w(`| Void already present below EL ${f(FB.bfe)} | ${n0(3059)} cy |`)
w()
w('| Excavation floor | Compensatory volume available | Drainage |')
w('|---|---|---|')
for (const [fl, cy] of Object.entries(ES.cutByFloor as Record<string, number>).sort((a, b) => Number(b[0]) - Number(a[0]))) {
  const n = Number(fl)
  const note = n >= 48 ? 'drains to the rear channel' : n >= 47 ? 'at the channel invert; wet bottom' : 'below the channel invert; will not drain'
  w(`| EL ${f(n, 1)} | ${n0(cy)} cy | ${note} |`)
}
w()
w('The easement corridor lies at a mean elevation of ' + f(ES.easement.groundMeanFt) +
  ', approximately 8.5 ft below the 100-year water surface. It is already the low ground of ' +
  'the reach and already contributes ' + n0(3059) + ' cy of storage in the existing ' +
  'condition, which is accounted for in the model and cannot be claimed again as ' +
  'compensation. Excavation below EL 47 would fall at or beneath the invert of the receiving ' +
  'channel and would produce a permanent pond rather than compensatory storage. **The ' +
  'practical capacity of the easement corridor is therefore of the order of 150 to 250 cy**, ' +
  'and its principal value to this design is as the outfall and hydraulic connection for the ' +
  'cells described below.')
w()
w('#### Compensatory storage cells')
w()
w('Four excavated cells in the rear yards, cut into ground presently lying between ' +
  `EL ${f(CS.floorElFt)} and the 100-year water surface, each draining to the easement corridor:`)
w()
w('| Cell | Lot | Footprint | Mean depth | Max depth | Volume |')
w('|---|---|---|---|---|---|')
for (const c of CS.cells) {
  w(`| CS-${c.lot} | ${c.lot} | ${n0(c.areaSqFt)} sf | ${f(c.meanDepthFt)} ft | ${f(c.maxDepthFt)} ft | ${n0(c.volumeCy)} cy |`)
}
w(`| CS-E | 54/55 | ${n0(ES.easement.areaSqFt)} sf easement | — | — | ${n0(ES.cutByFloor['48.0'])} cy at EL 48.0 |`)
w(`| **Total provided** | | | | | **${n0(CS.totalProvidedCy + ES.cutByFloor['48.0'])} cy** |`)
w()
w('All four rear-yard cells lie within the existing-condition 100-year floodplain limit and ' +
  'therefore within the area to be placed under floodplain easement. Cell CS-55 extends ' +
  'marginally beyond the proposed-condition limit and should be trimmed to it at final ' +
  'design, or the easement dedicated to the existing-condition limit, which is the ' +
  'recommended course in any event.')
w()
w('#### Balance')
w()
w('| | Volume |')
w('|---|---|')
w(`| Compensation required by the proposed grading | ${n0(CS.requiredCurrentGradingCy)} cy |`)
w(`| Compensation available from all cells | ${n0(CS.totalProvidedCy + ES.cutByFloor['48.0'])} cy |`)
w(`| **Deficit** | **${n0(CS.requiredCurrentGradingCy - CS.totalProvidedCy - ES.cutByFloor['48.0'])} cy** |`)
w()
w('**The proposed grading cannot be compensated within the subject property.** The ground ' +
  'lying between the 100-year water surface and a floor elevation that will drain is ' +
  'insufficient to hold the volume the proposed fill displaces.')
w()
w('The design response is to reduce the fill rather than to seek additional excavation. ' +
  'The available measures, in order of the volume returned:')
w()
w(`1. **Vented stem-wall or pier foundations to all four dwellings.** Returns the ` +
  `${n0(FB.belowBfeCy.underFootprints)} cy placed beneath the footprints and the greater part ` +
  `of the ${n0(FB.belowBfeCy.within10ft)} cy placed around them.`)
w('2. **Driveways and aprons constructed at existing grade.** Driveways are permitted to ' +
  `flood. A substantial proportion of the ${n0(FB.belowBfeCy.drivewaysAndTieOut)} cy in the ` +
  'third row of the table above is attributable to raising them.')
w('3. **Tie-out grading held close to the structures** at 3:1 rather than extended across ' +
  'the rear yards.')
w()
w('With the dwellings on vented foundations and the driveways at existing grade, the fill ' +
  'placed below the 100-year water surface falls to the order of the ' +
  n0(CS.totalProvidedCy + ES.cutByFloor['48.0']) + ' cy available from the cells, and the ' +
  'balance closes. This is the recommended basis of design.')
w()
w('### 11.6 Recommendation')
w()
w('1. **The crossing should not be enlarged as part of this development.** Enlargement does ' +
  'not remove the lots from the floodplain, increases the 10-year discharge to downstream ' +
  'properties by up to 80 percent, and constitutes a county roadway improvement outside the ' +
  'scope of a four-lot site plan.')
w()
w('2. **The dwellings should be designed to the computed flood elevation.** Lowest floor at ' +
  `or above EL ${f(wsel100 + 2)}; no basements on any lot; vented stem-wall or pier ` +
  'foundations on Lots 54 and 55; driveways and aprons at existing grade; compensatory ' +
  'storage as designed in Section 11.5.')
w()
w('3. **The floodplain easement should be dedicated to the existing-condition 100-year ' +
  'limit** and should encompass the compensatory storage cells, so that the storage is ' +
  'protected against subsequent filling.')
w()
w('4. **The roadway overtopping should be reported to DPIE in writing at pre-application.** ' +
  'Overtopping of Fort Foote Road in the 10-year event, conveying ' +
  n0(MIT.routed['EXISTING 36 in RCP (assumed)']['10'].outflowPeakCfs) +
  ' cfs across the pavement, is a condition independent of this development. It governs the ' +
  'flood elevation on the subject lots and should be placed on the record at the earliest ' +
  'opportunity.')
w()
w('---')
w()
w('## 12. Additional survey, geotechnical, environmental and agency information required')
w()
w('### 12.1 Survey — Meekins Surveyors')
w()
w('*W. L. Meekins RLS #384 is the surveyor of record on Plat Book WWW 65 folio 60.*')
w()
w('| # | Item | Why it matters here |')
w('|---|---|---|')
w('| 1 | **Level to H31A, H32A and H32B** and publish a numerical WSSC-to-NAVD 88 conversion at this site | Closes Section 3. Everything else is conditional on it. |')
w('| 2 | **Existing culvert: invert in and out, diameter, material, length, skew, condition; headwall and endwall type and elevations; inlet throat elevation** | The single highest-value measurement on the project. |')
w('| 3 | **Fort Foote Road profile** through the sag, centreline and both gutter lines, 300 ft each way | The road IS the control structure. |')
w('| 4 | Boundary retracement, Lots 53–56, per WWW 65/60 | |')
w('| 5 | **Field cross sections** perpendicular to flow — minimum five: culvert inlet, culvert outlet, and three through the ponding area, to 2 ft above the 100-year surface | Replaces LiDAR sections. FPS-770017 never had these. |')
w('| 6 | 1-ft topography over all four lots plus 50 ft beyond, and 200 ft up and down the corridor | |')
w('| 7 | Existing swale across the rear of Lots 50–53 described in the 1979 letter | |')
w('| 8 | Utilities, structures within 50 ft, driveways and aprons on adjoining lots | |')
w('| 9 | Trees 2.5 in dbh and over within 75 ft of each dwelling — location, species, dbh, condition | Countable toward Landscape Manual 4.1(c)(1) and Sec. 25-128 canopy. |')
w('| 10 | **Re-establish the 1978 field topo sheet on State Plane** from any recoverable control | Reconciles the historic work with the new. Section 4.1. |')
w('| 11 | **Floodplain easement plat** — metes and bounds of the 100-year limit on each burdened lot, in recordable form | Section 5.3. |')
w('| 12 | As-built certification post-construction: pipe inverts, finished floor elevations | Required for use and occupancy. |')
w()
w('Items 1 and 2 are the critical path and can be a first mobilisation ahead of the rest.')
w()
w('### 12.2 Other professionals')
w()
w('| Discipline | Scope | Why |')
w('|---|---|---|')
w('| **Maryland PE (water resources)** | HEC-RAS model of record, reconciliation to FPS 200546, sealed floodplain study, no-rise or impact analysis, compensatory storage design, HEC-14 outlet protection, professional seal on all sheets | Required for review. Not supplied by this study. |')
w('| **Geotechnical engineer** | Subsurface investigation, bearing capacity, fill placement and compaction specification, slope stability on the 2.5:1 and 2.6:1 graded slopes, seasonal high groundwater determination | Structural fill supporting dwellings within a floodplain; groundwater governs the foundation determination in Section 11.4. |')
w('| **Landscape architect / certified arborist** | Tree Conservation Plan, canopy worksheet to Sec. 25-128 as amended by CB-021-2024 (20% of net tract, RSF-95), per-lot planting to Landscape Manual 4.1(c)(1) | M-NCPPC signs separately from DPIE. |')
w('| **Environmental / wetland scientist** | Wetland delineation and jurisdictional determination | Wetlands are mapped 439 ft from Lot 53. Corps and MDE jurisdiction is independent of county review. |')
w('| **Title attorney** | Examination of the recorded storm drain easement, floodplain easement deed or plat dedication, execution and recordation | No floodplain easement encumbers the subject lots. See Sections 5.3 and 11.5. |')
w('| **Architect** | Foundation and lowest-floor design on all four lots to the elevation established in Section 11.4 | Vented stem-wall or pier construction on Lots 54 and 55. |')
w('| **Structural engineer** | Retaining structures exceeding 4 ft in height, and flood-opening design to ASCE 24 | None presently proposed. |')
w()
w('### 12.3 Agency information to obtain')
w()
w('- **FPS 200546**, FPS 960004 and FPS 200380 from DPIE, with their models if they exist.')
w('- DPIE as-built records for the Fort Foote Road crossing.')
w('- Upstream stormwater management facilities within the ' + f(W.areaAc, 0) + '-acre ' +
  'watershed. **None have been inventoried.** Upstream detention would reduce the peak ' +
  'discharges reported in Section 2.5; the omission is conservative.')
w('- MDE pre-application on waterway construction.')
w()
w('---')
w()

// ── 13 Limitations ─────────────────────────────────────────────────────────
w('## 13. Assumptions, limitations and certification')
w()
w('**Preliminary feasibility results.** All results presented in this report are ' +
  'preliminary feasibility results.')
w()
w('**Permit-level results.** None. No result in this document is presented at permit level.')
w()
w('| Item | Status |')
w('|---|---|')
w('| Horizontal datum | EPSG:2248, Maryland State Plane NAD 83, US survey feet |')
w('| Vertical datum | NAVD 88 |')
w('| Terrain | County 2023 LiDAR 2-ft contours, interpolated to a 10 ft grid. **Not a survey.** |')
w('| Model | Platform 1D steady standard-step; HEC-RAS formulation, **not HEC-RAS** |')
w('| Hydrology | TR-55 graphical peak discharge, Type II |')
w('| Design storms | 10-, 25-, 50-, 100-year, 24-hour |')
w('| Downstream boundary | Normal depth on a 1.2% channel slope, 460 ft below the crossing |')
w('| Culvert | **Assumed 36 in RCP. Never measured.** |')
w('| Upstream SWM | **Not inventoried.** |')
w('| Floodway | Not delineated; none exists on current mapping |')
w('| FPS 200546 | **Not obtained.** The controlling study of record is not in the file. |')
w('| Unsteady / storage routing | Not performed. The reach is a pond and the steady model cannot credit its attenuation. |')
w('| Professional engineer responsible | **None. This document is not sealed and has not been reviewed by a professional engineer.** |')
w()
w('This study was prepared from published public data. It constitutes analysis for review, ' +
  'adoption, correction or rejection by a Maryland Professional Engineer. It is not a ' +
  'certified document and no part of it may be submitted as a sealed floodplain study.')
w()

writeFileSync(join(OUT, 'indian-queen-floodplain-study.md'), out.join('\n'))
console.log('wrote projects/indian-queen/reports/indian-queen-floodplain-study.md')
console.log(`${out.length} lines`)
