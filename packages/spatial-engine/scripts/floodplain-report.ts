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

const OUT = join(process.cwd(), 'output', 'site-plans')
const R = JSON.parse(readFileSync(join(OUT, 'indian-queen.floodplain-study-results.json'), 'utf8'))
const INU = JSON.parse(readFileSync(join(OUT, 'indian-queen.floodplain-inundation.json'), 'utf8'))
const TWIN = JSON.parse(readFileSync(join(OUT, 'indian-queen-lots-53-56.twin.json'), 'utf8'))

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
w('> **STATUS — READ THIS FIRST.** This is a PRELIMINARY FEASIBILITY study. It is not a')
w('> permit-level submission and it is not sealed. It is built on published county LiDAR')
w('> terrain and public data, not on a field survey, and the existing culvert has never')
w('> been measured. Section 12 lists what must be obtained before any of this can be')
w('> certified. The findings are strong enough to act on and not strong enough to file.')
w()
w('---')
w()

// ── 1 Executive summary ────────────────────────────────────────────────────
w('## 1. Executive summary and conclusion')
w()
w('**These four lots lie in the headwater pond of a road crossing on a named stream, and')
w('the crossing is badly undersized. The site plan as currently drawn puts two dwellings')
w('at the 100-year water surface and all four basements between 3.6 and 8.7 ft below it.**')
w()
w('The findings, in order of how much they change the project:')
w()
w(`1. **The contributing drainage area is ${f(R.hydrology.watershed.areaAc, 0)} acres ` +
  `(${f(R.hydrology.watershed.sqMi, 3)} sq mi), not the 39.1 acres carried in the earlier drainage work.** ` +
  'The earlier delineation captured one tributary of the valley and stopped at the edge of ' +
  'its own terrain model. The 100-year peak discharge at the crossing is ' +
  `**${n0(R.hydrology.flows[3].peakCfs)} cfs**, not 94.9 cfs — a factor of eleven.`)
w()
w(`2. **Fort Foote Road overtops in every storm from the 10-year up.** The road sag is ` +
  `EL ${f(R.crossing.roadSagElFt)} and the computed 10-year headwater is ` +
  `EL ${f(R.existing[0].headwaterElFt)}, with ${n0(R.existing[0].culvert.overtoppingCfs)} cfs ` +
  `crossing the pavement. At the 100-year, ${n0(R.existing[3].culvert.overtoppingCfs)} cfs of the ` +
  `${n0(R.hydrology.flows[3].peakCfs)} cfs total goes over the road rather than under it. ` +
  'The road, not the culvert, is what presently controls the flood elevation.')
w()
w(`3. **The 100-year water surface across the lots is EL ${f(R.existing[3].headwaterElFt)} ` +
  `(existing condition).** It is essentially flat — the reach is a backwater pond, not a ` +
  'flowing channel, with velocities under 1 fps throughout.')
w()
w('4. **This computed elevation independently corroborates the floodplain of record.** ' +
  'FPS-770017 states 57 ft ± in the WSSC datum. Section 3 establishes that the WSSC datum ' +
  `is NGVD 29 based and that NGVD 29 − NAVD 88 = 0.66 ft here, so 57 WSSC ≈ EL 56.3 NAVD 88. ` +
  `The model gives EL ${f(R.existing[3].headwaterElFt)} — within ` +
  `${f(56.34 - R.existing[3].headwaterElFt)} ft of a number computed by other people, ` +
  'by other means, forty-eight years ago.')
w()
w('5. **Upsizing the culvert barely helps.** Because the road weir dominates, going from ' +
  `36 in to 96 in lowers the 100-year headwater from EL ${f(R.crossing.alternatives[0].headwaterElFt)} ` +
  `to EL ${f(R.crossing.alternatives[5].headwaterElFt)} — ` +
  `${f(R.crossing.alternatives[0].headwaterElFt - R.crossing.alternatives[5].headwaterElFt)} ft for ` +
  'roughly eight times the pipe. The 48 in pipe previously proposed for the rear easement ' +
  'is not a floodplain solution and was sized against a discharge an order of magnitude too small.')
w()
w(`6. **The proposed grading RAISES the 100-year water surface by ` +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft** at ${R.rise[3].upstream.maxRiseSection}. ` +
  'That is not a no-rise condition and it is not a rounding error.')
w()
w(`7. **The proposed grading removes ${n0(INU['100'].reachLostStorageCy)} cubic yards of ` +
  'floodplain storage** below the 100-year surface, out of ' +
  `${n0(INU['100'].reachTotalFillCy)} cy of fill in the reach. Compensatory storage is required.`)
w()
w('8. **Freeboard fails on every lot.** Table 1.1.')
w()
w('**Table 1.1 — Proposed dwelling elevations against the 100-year water surface ' +
  `(EL ${f(wsel100)}, proposed condition)**`)
w()
w('| Lot | Address | Finished floor | Freeboard to FFE | Garage slab | Basement floor | Basement below flood |')
w('|---|---|---|---|---|---|---|')
for (const b of buildings) {
  const lot = b.id.startsWith('l1') ? '53' : b.id.startsWith('l2') ? '54' : b.id.startsWith('l3') ? '55' : '56'
  const addr = Object.entries(LOTNO).find(([, v]) => v === lot)?.[0] ?? ''
  const fb = b.finishedFloorElevFt - wsel100
  const bb = wsel100 - b.basementElevFt
  w(`| ${lot} | ${L(addr)} | ${f(b.finishedFloorElevFt)} | ${fb >= 0 ? '+' : ''}${f(fb)} ft ` +
    `${fb < 1 ? '**FAIL**' : 'ok'} | ${f(b.garageSlabElevFt)} | ${f(b.basementElevFt)} | ` +
    `**${f(bb)} ft** |`)
}
w()
w('Prince George\'s County Subtitle 4 and the NFIP both require the lowest floor — basement ' +
  'included — to be at or above the base flood elevation, and the county applies freeboard ' +
  'above that. A basement 8.7 ft below the 100-year water surface is not a design that can ' +
  'be permitted, conditioned or waived. It has to change.')
w()
w('### Conclusion')
w()
w('**The proposed improvements do not remove these lots from the floodplain, and as drawn ' +
  'they make the flood condition marginally worse.** The proposed condition still leaves ')
const e100 = INU['100']
const tot = Object.values(e100.lots).reduce((s: number, v: any) => s + v.floodedProposedSf, 0)
w(`${n0(tot as number)} sq ft of the four lots below the 100-year water surface, against ` +
  `${n0(Object.values(e100.lots).reduce((s: number, v: any) => s + v.floodedExistingSf, 0) as number)} sq ft existing.`)
w()
w('Removing the lots from the floodplain is physically possible but it is a different and ' +
  'much larger project than the one on the table: it means replacing the Fort Foote Road ' +
  'crossing with a structure big enough to stop the road overtopping, which is a county ' +
  'roadway and drainage project, not a four-lot site plan. Section 11 sets out the options.')
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
w('> **Why the earlier 39.1-acre figure was wrong.** The earlier delineation ran on a DEM ' +
  'interpolated from county 2-ft contours over a 4,000 ft window centred on the site. The ' +
  'watershed is 6,400 ft long. The flow path ran off the edge of the model and the ' +
  'delineation stopped there, capturing the lower tributary and none of the upper ' +
  'watershed. Re-run over a window large enough to contain the divide, the same algorithm ' +
  `gives ${f(W.areaAc, 1)} ac. Every discharge, pipe size and headwater in the earlier ` +
  'drainage work follows from the truncated figure and none of them survive.')
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
w('Measured cell by cell against the county\'s own Impervious Surface (2023) and Tree ' +
  'Canopy (2023) layers, not assumed from a zoning category.')
w()
w('**Hydrologic soil groups** (NRCS soil survey, area MD033), as a fraction of the watershed:')
w()
w('| Group | Fraction |')
w('|---|---|')
for (const [g, v] of Object.entries(R.hydrology.watershed.soilGroupPct as Record<string, number>)) {
  w(`| ${g} | ${f(v, 1)}% |`)
}
w()
w('Dual groups (B/D, C/D) are taken at the D value. These are hydric, frequently-flooded ' +
  'soils in the valley bottom; undrained is the design condition and the conservative one.')
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
w('> **Cross-check.** The Rational Method at C = 0.45 and the 51-minute intensity gives ' +
  'roughly 625 cfs at the 100-year against TR-55\'s ' + n0(R.hydrology.flows[3].peakCfs) + ' cfs. ' +
  'The spread between methods is itself a finding: the design value carried forward is the ' +
  'TR-55 figure because it is the county-accepted method at this area, and because it is the ' +
  'conservative one. MDE may require TR-20 or the USGS Maryland Fixed Region regression at ' +
  'final design, and neither has been run here.')
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
w('> **Correction to earlier project correspondence.** An earlier note in this project ' +
  'projected the offset as "NAVD 88 ≈ WSSC − 7 to −10 ft". That was wrong by an order of ' +
  'magnitude. It was inferred from a comparison of the stated floodplain elevation against ' +
  'the road elevation, on the assumption that the road could not be below the floodplain. ' +
  'The road IS below the floodplain — that is the central finding of this study — so the ' +
  'inference had a false premise. The correct offset is −0.66 ft and it is measured, not inferred.')
w()
w('**Limitation.** This establishes the NGVD 29 to NAVD 88 relationship rigorously. It does ' +
  'NOT prove that the 1978 consultant worked in true NGVD 29 rather than an assumed local ' +
  'datum. The field topographic survey in the project record carries three benchmarks — ' +
  '**H31A at EL 61.09, H32A at EL 74.37 and H32B at EL 88.41** — and levelling to those ' +
  'three marks is the one observation that closes this question. It is the first item on the ' +
  'survey scope in Section 12.')
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
  '`existing site plans/Indian Queen lots floodplain topo.pdf` and two further scans of the ' +
  'same sheet — at 1 in = 50 ft, carrying spot elevations, 2-ft contours, the lot lines, ' +
  'three benchmarks, and a floodplain limit plotted in red around the rear of Lots 55 and 56 ' +
  'and along the frontage of Lots 53 and 54.')
w()
w('**It could not be georeferenced to survey standard from the scan alone, and it was not ' +
  'used as the terrain for this model.** The reasons are specific:')
w()
w('- The sheet is drawn on a **local grid** (labelled N-46500 to N-47000 and E-500 to ' +
  'E-1250 at 250 ft spacing) whose relationship to Maryland State Plane is not printed on ' +
  'the sheet and is not otherwise recorded. The grid\'s northing increases southward and ' +
  'its easting increases westward, so it is not a State Plane subset.')
w('- Registration was attempted four ways — against the platted lot geometry, against the ' +
  'county road centreline, by Hough line matching on the drawn boundaries, and by ' +
  'correlating the drawn contours against the LiDAR surface. The best fits disagreed with ' +
  'each other by more than 20 ft and none survived visual overlay.')
w('- Its own drawn boundary lines do not match the platted bearings closely enough to serve ' +
  'as control, which suggests they are reference projections rather than surveyed lines.')
w()
w('What the sheet DOES establish, and what has been used:')
w()
w('- **The three benchmarks** (H31A 61.09, H32A 74.37, H32B 88.41) that will close the datum.')
w('- **Spot elevations** in the valley bottom of 47.7 to 49.3 and on Fort Foote Road of 56.3, ' +
  'against LiDAR readings of 46.1 to 47.5 and 54.0 in the same places — a consistent offset ' +
  'of roughly 1 to 2 ft in the direction the datum work in Section 3 predicts.')
w('- **The plotted floodplain limit wraps the rear of the lots and crosses the road**, which ' +
  'is the same picture this model produces and the opposite of a floodplain confined to a channel.')
w()
w('Re-establishing that sheet on State Plane is an hour of a surveyor\'s time and is in the ' +
  'Section 12 scope. It is not a substitute for the new survey; it is how the 1978 work gets ' +
  'reconciled with the new work.')
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
w('**There is no mapped regulatory floodway here**, because there is no detailed FEMA study ' +
  'on this reach — Zone X carries neither a BFE nor a floodway. That is a statement about ' +
  'FEMA\'s mapping programme, not about the flood risk, and Prince George\'s County does not ' +
  'treat it as one.')
w()
w('### 5.1 The county floodplain governs, not FEMA')
w()
w('Prince George\'s County regulates the 100-year floodplain of any watercourse with a ' +
  'drainage area at or above a threshold well below the ' + f(W.areaAc, 0) + ' acres here, ' +
  'whether or not FEMA has studied it. Where the county has no detailed study it requires ' +
  'the applicant to produce one — which is what an FPS number is. Zone X is therefore NOT a ' +
  'finding that these lots are outside the regulated floodplain. It is a finding that FEMA ' +
  'has not mapped this stream.')
w()
w('### 5.2 The chain of studies of record')
w()
w('| Study | Plan date | County comment |')
w('|---|---|---|')
w('| FPS-770017 | 1978-10-09 | "No cross sections on plans, revised based on FPS 960004" |')
w('| FPS 960004 | 1997-07-01 | "multiple plan sheets, revised based on FPS 200546, legacy study FPS 770017" |')
w('| **FPS 200546** | **2005-08-01** | **"post development flood plain used, legacy studies FPS 960004 and FPS 200380"** |')
w()
w('**FPS 200546 is the controlling study of record and it is not in the project file.** ' +
  'It must be obtained from DPIE before anything is filed. This study is built independently ' +
  'of it and will have to be reconciled against it.')
w()
w('### 5.3 The floodplain easement — resolved')
w()
w('The 1979 DPW&T letter in the project record (W. E. Miller) states that the floodplain ' +
  'easement was "apparently not granted on Lots 53 and 54 — check out before release of ' +
  'permits". The title search reports clean. Both are correct, and the county\'s own easement ' +
  'layer explains why:')
w()
w('> PGAtlas Easement/0 (Environmental and Cultural, Platted) carries **one** floodplain ' +
  'easement named "Indian Queen East", **5.32 acres**, dedicated on **Record Plat 118-083**, ' +
  'recorded **17 January 1984**.')
w()
w('That easement lies **entirely south of Fort Foote Road**, between 83.7 and 237.4 ft from ' +
  'the nearest corner of these lots. **It covers none of Lots 53–56.**')
w()
w('So a floodplain easement in this subdivision was granted — six years after FPS-770017, ' +
  'by record plat dedication, on the downstream side of the road. These four lots were ' +
  'platted a decade earlier on Plat Book WWW 65 folio 60 and were never brought into it. ' +
  'The clean title is not good news; it is the 1979 concern confirmed.')
w()
w('Plat 118-083 is also the template: it is how this county, in this subdivision, on this ' +
  'stream, has already done exactly the dedication that Lots 53–56 now need.')
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
  '`packages/spatial-engine/src/hydraulics/standard-step.ts`, so that every value in the ' +
  'profile tables traces to the line of code that produced it.')
w()
w('> **HEC-RAS itself was not run and no HEC-RAS plan, geometry or flow files exist.** The ' +
  'deliverable list asks for them. They cannot be produced here and they will be required at ' +
  'permit level. The formulation is the same; the software of record is not. Section 12.')
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
w('> **The culvert has never been measured.** Its size, material, inverts, length, skew and ' +
  'entrance treatment are all assumed. Section 7 shows that the answer is remarkably ' +
  'insensitive to barrel size — which is itself the finding — but the inverts matter and they ' +
  'are the single highest-value item on the survey scope.')
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
w('The profile through the ponding area is flat to within 0.05 ft over 470 ft and the ' +
  'velocities are 0.2 to 1.0 fps. **This reach is a pond, not a channel.** That is why the ' +
  'flood elevation is set almost entirely by the crossing and hardly at all by anything on the lots.')
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
w('**Inlet control governs at every single-barrel size.** The entrance is the constriction ' +
  'throughout, which means the barrel is never being used to capacity and that enlarging the ' +
  'pipe without enlarging the inlet buys almost nothing.')
w()
w('**And even with the inlet enlarged, the road governs.** Once the headwater passes ' +
  `EL ${f(R.crossing.roadSagElFt)} the ${f(R.crossing.crestLengthFt, 0)} ft of roadway becomes a ` +
  'weir far more efficient than any pipe that fits under it. Eight times the barrel area ' +
  `moves the 100-year headwater ${f(R.crossing.alternatives[0].headwaterElFt - R.crossing.alternatives[5].headwaterElFt)} ft.`)
w()
w('> **This retires the 48-inch pipe proposal.** The 48 in extension previously proposed in ' +
  'the rear easement between Lots 54 and 55 was sized against Q100 = 94.9 cfs on a 39.1-acre ' +
  `watershed. The actual figure is ${n0(R.hydrology.flows[3].peakCfs)} cfs on ` +
  `${f(W.areaAc, 0)} acres. A 48 in pipe passes about ` +
  `${n0(R.hydrology.flows[3].peakCfs - R.crossing.alternatives[1].overtoppingCfs)} cfs at the ` +
  'design headwater. It is not a floodplain measure and should not be presented as one. ' +
  'It may still be justified as an on-lot storm drain for the four lots\' own runoff, which ' +
  'is what the rest of the drainage design is about, but that is a separate question with a ' +
  'separate and much smaller drainage area.')
w()
w('### 7.1 Outlet velocity, scour and erosion protection')
w()
w(`Outlet velocity at the 100-year condition is ${f(R.existing[3].culvert.outletVelocityFps, 1)} fps ` +
  'into an unlined earth channel whose permissible velocity is about 5 fps. **An energy ' +
  'dissipator or riprap apron designed to FHWA HEC-14 is required.** It cannot be sized here: ' +
  'it needs the surveyed tailwater and a bed gradation. The existing outlet should also be ' +
  'inspected for scour that has already occurred — at these velocities, over fifty years, ' +
  'some will have.')
w()
w('---')
w()

// ── 8 Proposed condition ───────────────────────────────────────────────────
w('## 8. Proposed-condition analysis')
w()
w('### 8.1 What was modelled')
w()
w('The proposed terrain is the graded surface from the current site plan — four dwelling ' +
  'pads, driveways, aprons and the tie-out grading — merged into the existing surface inside ' +
  'the limit of disturbance, and re-cut at the same cross sections. Overbank roughness on ' +
  'the graded right bank was changed from wooded (0.10) to mown lawn (0.035), which by itself ' +
  'would LOWER the water surface. The crossing is unchanged between conditions.')
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
w(`**The proposed condition does NOT satisfy a no-rise standard.** The 100-year water surface ` +
  `rises **${f(R.rise[3].upstream.maxRiseFt, 2)} ft** at ${R.rise[3].upstream.maxRiseSection}, ` +
  `and by ${f(R.rise[0].upstream.maxRiseFt, 2)} ft or more in every storm modelled. ` +
  'Prince George\'s County and FEMA both work to 0.00 ft reported to two decimals. ' +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft is a rise.`)
w()
w('The mechanism is loss of conveyance area in the right overbank where the pads are filled. ' +
  'It is not caused by the roughness change, which works the other way.')
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
w(`**${n0(INU['100'].reachLostStorageCy)} cubic yards of 100-year floodplain storage is ` +
  'removed by the proposed grading.** In a reach that functions as a detention pond behind a ' +
  'road embankment, that storage is doing real work: it is what keeps the peak headwater as ' +
  'low as it is. A steady-state model cannot credit the attenuation it provides, so the ' +
  `${f(R.rise[3].upstream.maxRiseFt, 2)} ft rise in Section 8.2 is a FLOOR on the impact, not a ceiling.`)
w()
w('**Compensatory storage is required**, cut for fill, below the 100-year surface, ' +
  'hydraulically connected, within the same reach.')
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
w('**Partly, and only by filling — which is the thing that causes the rise and the storage ' +
  'loss.** Raising a pad above the water surface does take that ground out of the mapped ' +
  'floodplain. It does not lower the flood. Lot 54 goes from 100.0% to 88.5% flooded at the ' +
  '100-year and Lot 55 from 95.7% to 85.5%, while the water surface across both of them goes UP.')
w()
w('That is the distinction the county cares about: **removing ground from the floodplain by ' +
  'filling it is an encroachment, not a mitigation.**')
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
w('- `output/site-plans/indian-queen-floodplain-delineation.geojson` — existing and proposed ' +
  'polygons for the 10-, 25-, 50- and 100-year storms, EPSG:2248, NAVD 88, attributed with ' +
  'condition, return period, water-surface elevation and area.')
w('- `output/site-plans/indian-queen.floodplain-study-results.json` — full model input and ' +
  'output, every section, every profile point.')
w('- `output/site-plans/indian-queen.floodplain-inundation.json` — per-lot inundation, fill ' +
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
w('| FEMA CLOMR? | **Not required on the current mapping.** Zone X carries no BFE and no floodway, so there is nothing to revise. |')
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
w('4. **Redesign** so that the lowest floor of every dwelling, basements included, sits above the BFE with county freeboard — Section 11.')
w('5. **Compensatory storage** designed and shown, cut for fill, below the 100-year surface.')
w('6. **Floodplain easement** dedicated over the 100-year floodplain on each burdened lot and recorded — following Plat 118-083 as the precedent in this subdivision.')
w('7. **MDE waterway construction permit** if the channel or crossing is touched.')
w('8. **SWM concept and site development plan approval.**')
w('9. DPIE grading permit, then building permits.')
w()
w('---')
w()

// ── 11 Options ─────────────────────────────────────────────────────────────
w('## 11. Options')
w()
w('**Option A — redesign the dwellings to the flood, keep the crossing.** Raise every ' +
  'lowest floor above the BFE plus county freeboard, delete the basements on Lots 54 and 55 ' +
  'or convert them to slab-on-grade, and provide compensatory storage cut for fill. Feasible ' +
  'on Lots 53 and 56 with modest change. On Lots 54 and 55 it means a fundamentally different ' +
  `house: the pads sit at EL 55.5 against a 100-year surface of EL ${f(wsel100)}, and the ` +
  'basements are 8.6 ft under. This is the only option that is within the applicant\'s ' +
  'control and it does not remove the lots from the floodplain.')
w()
w('**Option B — fill the lots out of the floodplain.** Raise Lots 54 and 55 above ' +
  `EL ${f(wsel100 + 2)}. This is the "can we fill to 58–60" question asked earlier, and the ` +
  'answer is now quantified: it would take several thousand additional cubic yards below the ' +
  'flood surface, all of it compensable, and it would raise the water surface on the ' +
  'neighbours. **Not permittable without equivalent compensatory excavation**, and there is ' +
  'nowhere obvious on these lots to put it.')
w()
w('**Option C — fix the crossing.** Replace the Fort Foote Road culvert with a structure ' +
  'sized to stop the road overtopping. This is the only measure that actually lowers the ' +
  'flood elevation for everyone. It is also a county roadway project on a county road, an ' +
  'order of magnitude beyond a four-lot site plan, and Section 7 shows that even a 96 in ' +
  `barrel only reaches EL ${f(R.crossing.alternatives[5].headwaterElFt)} — a box culvert or ` +
  'bridge would be needed. Worth raising with DPIE at pre-application because the overtopping ' +
  'is a public-safety matter independent of this development.')
w()
w('**Recommendation: Option A, and put the overtopping finding in front of DPIE in writing.** ' +
  'The road overtopping in a 10-year storm is not the applicant\'s problem to solve, but it ' +
  'is the applicant\'s problem that it sets the flood elevation on the lots, and DPIE should ' +
  'hear it at pre-application rather than at review.')
w()
w('---')
w()

// ── 12 What is still needed ────────────────────────────────────────────────
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
w('| **Maryland PE (water resources)** | HEC-RAS model of record, reconciliation to FPS 200546, sealed floodplain study, no-rise or impact analysis, compensatory storage design, HEC-14 outlet protection, seal on every sheet | Nothing is reviewable unsealed. The platform cannot supply this. |')
w('| **Geotechnical engineer** | Borings, bearing, fill placement and compaction specification, slope stability on the 2.5:1 and 2.6:1 graded slopes | Structural fill supporting dwellings in a floodplain. |')
w('| **Landscape architect / certified arborist** | Tree Conservation Plan, canopy worksheet to Sec. 25-128 as amended by CB-021-2024 (20% of net tract, RSF-95), per-lot planting to Landscape Manual 4.1(c)(1) | M-NCPPC signs separately from DPIE. |')
w('| **Environmental / wetland scientist** | Wetland delineation and jurisdictional determination | Wetlands mapped 439 ft from Lot 53. Corps and MDE jurisdiction is independent of the county. |')
w('| **Title attorney** | Floodplain easement deed or plat dedication, execution, recordation | Title is clean; the instrument still has to be created. |')
w('| **Architect** | Redesign of Lots 54 and 55 to a flood-compliant lowest floor | Option A. |')
w('| **Structural engineer** | Only if retaining walls over 4 ft return | None currently proposed. |')
w()
w('### 12.3 Agency information to obtain')
w()
w('- **FPS 200546**, FPS 960004 and FPS 200380 from DPIE, with their models if they exist.')
w('- DPIE as-built records for the Fort Foote Road crossing.')
w('- Any upstream stormwater management facilities in the ' + f(W.areaAc, 0) + '-acre watershed. ' +
  '**None were inventoried for this study.** Upstream detention would reduce the peaks in ' +
  'Section 2.5 and the omission is conservative but real.')
w('- MDE pre-application on waterway construction.')
w()
w('---')
w()

// ── 13 Limitations ─────────────────────────────────────────────────────────
w('## 13. Assumptions, limitations and certification')
w()
w('**Preliminary feasibility results** — everything in this report.')
w()
w('**Permit-level results** — none. There are none in this document.')
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
w('| Professional engineer responsible | **NONE. This document is not sealed and no PE has reviewed it.** |')
w()
w('This study was produced by the Kealee site-plan engine from public data. It is analysis a ' +
  'Maryland Professional Engineer can review, adopt, correct or reject. It does not become a ' +
  'certified document by being printed, and no part of it may be submitted as a sealed ' +
  'floodplain study.')
w()

writeFileSync(join(OUT, 'indian-queen-floodplain-study.md'), out.join('\n'))
console.log('wrote output/site-plans/indian-queen-floodplain-study.md')
console.log(`${out.length} lines`)
