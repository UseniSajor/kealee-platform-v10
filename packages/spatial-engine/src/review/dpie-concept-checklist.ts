/**
 * Prince George's County DPIE — SITE DEVELOPMENT CONCEPT PLAN DESIGN REVIEW
 * CHECKLIST (Site/Road Plan Review Division, last edited August 25, 2021).
 *
 * "PLANS SUBMITTED WITHOUT A COMPLETED CHECKLIST MAY BE RETURNED WITHOUT
 * REVIEW." Every item is answered ON THE SHEETS, in the consultant's column:
 *   C = complete / shown   X = not applicable   O = outstanding, to be addressed
 * with where it is shown or why it does not apply. Item text and references are
 * the checklist's own (existing site plans/Site Development Concept App/).
 *
 * The evaluation reads facts the engine already holds; anything it cannot know
 * (a report not yet written, an affidavit not yet mailed) is 'O' and says what
 * is owed. A project may override an item with a stated reason.
 */

export type ChecklistStatus = 'C' | 'X' | 'O'
export interface ChecklistItem { id: string; section: string; text: string; reference: string }
export interface ChecklistRow extends ChecklistItem { status: ChecklistStatus; comment: string; sheet: string }

export const DPIE_CONCEPT_CHECKLIST_EDITION = 'DPIE Site Development Concept Plan Design Review Checklist, last edited August 25, 2021'

export const DPIE_CONCEPT_CHECKLIST: ChecklistItem[] = [
  { id: 'A-1', section: 'A GENERAL INFORMATION', text: 'Plan is labeled as Site Development Concept Plan (aka Concept Plan from MDE step 1)', reference: '' },
  { id: 'A-2', section: 'A GENERAL INFORMATION', text: 'Plan sheet size does not exceed 30" x 42" and all sheets are printed on same size paper.', reference: '5.3.2' },
  { id: 'A-3', section: 'A GENERAL INFORMATION', text: 'A 5-inch, full-height open area is provided on the right-hand side of the drawing for County approval block.', reference: '2.2.1.A' },
  { id: 'A-4', section: 'A GENERAL INFORMATION', text: 'If more than 4 plan sheets: composite plan showing match lines and sheet numbers (scale not to exceed 1"=200\'); key map on each plan sheet.', reference: '2.2.1.O' },
  { id: 'A-5', section: 'A GENERAL INFORMATION', text: 'Match lines have a minimum length of 4 inches and identify the matching sheet number.', reference: '2.2.1.M' },
  { id: 'A-6', section: 'A GENERAL INFORMATION', text: 'Vicinity map at a minimum scale of 1"=2,000\' with north arrow and scale, upper right hand corner of cover sheet.', reference: '2.2.1.B' },
  { id: 'A-7', section: 'A GENERAL INFORMATION', text: 'A bar scale is provided on every sheet.', reference: '' },
  { id: 'A-8', section: 'A GENERAL INFORMATION', text: 'Three grid ticks are provided as described in the manual.', reference: '2.2.1.E' },
  { id: 'A-9', section: 'A GENERAL INFORMATION', text: 'Horizontal (MD Coordinate System, NAD 83) and vertical (NGVD 29 preferred) datum is stated on the plan.', reference: '' },
  { id: 'A-10', section: 'A GENERAL INFORMATION', text: 'General notes about the project are provided.', reference: '' },
  { id: 'A-11', section: 'A GENERAL INFORMATION', text: 'The entire property is shown at a maximum plan scale of 1 inch = 50 feet (preferred) within the plan set.', reference: '5.3.2' },
  { id: 'A-12', section: 'A GENERAL INFORMATION', text: 'All existing structures and site features including cultural features, historic sites and easements, and any visible foundations or ruins are shown.', reference: '5.3.2' },
  { id: 'A-13', section: 'A GENERAL INFORMATION', text: 'Topographic contours at maximum 2 foot interval, extending at least 100 feet beyond the property.', reference: '32-182' },
  { id: 'A-14', section: 'A GENERAL INFORMATION', text: 'All existing utilities and utility easements are shown.', reference: '' },
  { id: 'A-15', section: 'A GENERAL INFORMATION', text: 'The County BMP Summary Table is provided. Preferred location is on the cover sheet.', reference: '5.3.1' },
  { id: 'B-1', section: 'B ENVIRONMENTAL FEATURES', text: 'Banks of all regulated streams or a centerline if the banks are too close together to graphically show.', reference: 'MDE 5.7' },
  { id: 'B-2', section: 'B ENVIRONMENTAL FEATURES', text: 'Location of stream and stream buffers and/or enhanced buffers per MNCPPC and SCD criteria.', reference: 'MDE 5.7' },
  { id: 'B-3', section: 'B ENVIRONMENTAL FEATURES', text: 'Location of wetlands and/or wetlands of special state concern and appropriate wetland buffers.', reference: 'MDE 5.7' },
  { id: 'B-4', section: 'B ENVIRONMENTAL FEATURES', text: 'Delineation of the 100-year floodplain, per Techno-Gram 004-2020.', reference: 'MDE 5.7' },
  { id: 'B-5', section: 'B ENVIRONMENTAL FEATURES', text: 'Location of steep slopes (15% and greater) clearly shown on the plan and in the legend.', reference: 'M-NCPPC' },
  { id: 'B-6', section: 'B ENVIRONMENTAL FEATURES', text: 'The Primary Management Area is delineated.', reference: 'MDE 5.7' },
  { id: 'B-7', section: 'B ENVIRONMENTAL FEATURES', text: 'Existing woodland is delineated on the property.', reference: 'MDE 5.7' },
  { id: 'B-8', section: 'B ENVIRONMENTAL FEATURES', text: 'Existing environmental features extend off the property 100 feet in all directions.', reference: 'MNCPPC' },
  { id: 'B-9', section: 'B ENVIRONMENTAL FEATURES', text: 'Soils types and soil boundaries from USDA NRCS Soil Survey (Dec. 2009 or latest).', reference: '' },
  { id: 'B-10', section: 'B ENVIRONMENTAL FEATURES', text: 'Plan notes identify TMDL watershed (sediment, nitrogen, phosphorus) and Tier II waters/watershed.', reference: '' },
  { id: 'B-11', section: 'B ENVIRONMENTAL FEATURES', text: 'Highly erodible soils noted.', reference: 'MDE 5.7' },
  { id: 'B-12', section: 'B ENVIRONMENTAL FEATURES', text: 'Springs and seeps noted.', reference: 'MDE 5.7' },
  { id: 'B-13', section: 'B ENVIRONMENTAL FEATURES', text: 'Bedrock and Marlboro Clay outcrops noted.', reference: 'MDE 5.7' },
  { id: 'B-14', section: 'B ENVIRONMENTAL FEATURES', text: 'Chesapeake Bay Critical Areas delineated.', reference: 'MDE 5.7' },
  { id: 'C-1', section: 'C PLAN VIEW', text: 'Project layout is shown, including roads, buildings, parking, sidewalk and other improvements and associated grading.', reference: '32-182' },
  { id: 'C-2', section: 'C PLAN VIEW', text: 'Preliminary locations of ESD and structural stormwater practices; grading for devices where slopes exceed 15%.', reference: '32-182' },
  { id: 'C-3', section: 'C PLAN VIEW', text: 'Preliminary locations of storm drain inlets and culverts; entrance and outfall structures located beyond project limits (easements may be required).', reference: '5.2.4.4.2B / 32-162.A.6' },
  { id: 'C-4', section: 'C PLAN VIEW', text: 'Limit of Disturbance shown for all site work, incl. water, sewer, storm drain, SWM, road improvements, sediment control, stockpile.', reference: '32-182' },
  { id: 'C-5', section: 'C PLAN VIEW', text: 'Existing easements shown and any required offsite proposed easements.', reference: '' },
  { id: 'C-6', section: 'C PLAN VIEW', text: 'Locations, names and widths of existing and ultimate rights-of-way of adjacent streets and alleys; public vs. private noted.', reference: '' },
  { id: 'C-7', section: 'C PLAN VIEW', text: 'Existing and proposed water well and septic field locations are shown.', reference: '' },
  { id: 'C-8', section: 'C PLAN VIEW', text: 'Proposed public dedication area including any proposed parkland is shown and labeled.', reference: '' },
  { id: 'C-9', section: 'C PLAN VIEW', text: 'Point(s) of Investigation shown; ESDv computations and BMP Summary Table broken out to show ESD Required is Provided within each POI.', reference: '' },
  { id: 'C-10', section: 'C PLAN VIEW', text: 'The ultimate 100-year stormwater overflow path is shown throughout the site using flow arrows.', reference: '' },
  { id: 'C-11', section: 'C PLAN VIEW', text: 'Drainage areas to each device, offsite drainage onto the site, and to site outfalls; diverted areas analysed for no increase in 100-yr discharge.', reference: '' },
  { id: 'C-12', section: 'C PLAN VIEW', text: 'Where grading blocks a drainage course, ponding limits before and after grading are shown.', reference: '' },
  { id: 'D-1', section: 'D REPORT', text: 'Report addresses natural resource protection, natural flow patterns, impervious reduction, ESC integration, ESD planning to the MEP.', reference: 'MDE 5.11' },
  { id: 'D-2', section: 'D REPORT', text: 'If in the Chesapeake Bay Critical Area, discussion of how requirements are met; preliminary computations.', reference: '' },
  { id: 'D-3', section: 'D REPORT', text: 'Outfalls located outside the site, to existing storm drain or 100-yr floodplain; otherwise the discharge area is described.', reference: '' },
  { id: 'D-4', section: 'D REPORT', text: 'Stabilization at downstream outfall and upstream inflow evaluated; measures against gully formation discussed.', reference: '' },
  { id: 'D-5', section: 'D REPORT', text: 'Photographs of the stream at the downstream outfall and upstream property line; eroded slopes.', reference: '' },
  { id: 'D-6', section: 'D REPORT', text: 'If outfall is to an existing SWM facility, its capacity for the added area and flow is documented.', reference: '' },
  { id: 'D-7', section: 'D REPORT', text: 'If rezoned to higher imperviousness, effects on downstream properties analysed.', reference: '' },
  { id: 'D-8', section: 'D REPORT', text: 'Floodplain ordinance discussion (drainage courses, buildings within 25 ft of floodplain, dams, downstream crossings).', reference: '' },
  { id: 'D-9', section: 'D REPORT', text: 'If a waiver of water quality or quantity is requested, the basis is provided.', reference: '' },
  { id: 'D-10', section: 'D REPORT', text: 'Computations: ESD/WQv required and provided; 100-yr existing and proposed runoff; downstream storm drain analysis with 10-yr control if inadequate.', reference: '5.3.3 / 5.2.6.1 / 5.2.4.2 / TG 002-2019' },
  { id: 'E-1', section: 'E OTHER SUBMITTALS', text: 'A Geotechnical Report for SWM is provided to support concept development and feasibility.', reference: '5.3.3 / TG 004-2018' },
  { id: 'E-2', section: 'E OTHER SUBMITTALS', text: 'Geotechnical Report addresses Marlboro and Christiana clays, sulfidic and diatomaceous soils.', reference: '5.3.3 / TG 005-2018 / PGSCD I-8' },
  { id: 'E-3', section: 'E OTHER SUBMITTALS', text: 'Affidavit of Public Informational mailing is provided with second submission.', reference: '32-182(g)' },
  { id: 'E-4', section: 'E OTHER SUBMITTALS', text: 'A draft Natural Resource Inventory is provided with initial submission (approved copy required prior to approval).', reference: '32-182(a)' },
]

/** Facts the engine holds that answer the checklist. */
export interface ChecklistFacts {
  sheetSizeIn: [number, number]
  sheets: { id: string; title: string }[]
  coverSheet: string
  planSheet: string
  swmSheet: string
  utilitySheet: string
  existingSheet: string
  escSheet: string
  planScaleFtPerIn: number
  approvalStripIn: number
  datum: { horizontal: string; vertical: string }
  contoursBeyondFt: number
  bmpRows: number
  pois: number
  overflowPaths: number
  offsiteAreaSqFt: number
  esdPractices: number
  culverts: number
  lodSqFt: number
  dedicationSqFt: number
  env: {
    streams: boolean; wetlands: boolean; floodplain: boolean; pma: boolean; cbca: boolean
    steep15SqFt: number; steep25SqFt: number; woodland: string; soils: string
    tmdl: string; tierII: boolean; highlyErodible: string; marlboroClay: boolean; springs: boolean
    wells: string; approvals: string
  }
}

export function evaluateChecklist(f: ChecklistFacts, overrides: Record<string, { status: ChecklistStatus; comment: string; sheet?: string }> = {}): ChecklistRow[] {
  const S = f.sheets.length
  const r = (status: ChecklistStatus, comment: string, sheet = ''): { status: ChecklistStatus; comment: string; sheet: string } => ({ status, comment, sheet })
  const e = f.env
  const ans: Record<string, ReturnType<typeof r>> = {
    'A-1': r('C', 'Every sheet is titled SITE DEVELOPMENT CONCEPT PLAN.', 'ALL'),
    'A-2': r(f.sheetSizeIn[0] <= 42 && f.sheetSizeIn[1] <= 30 ? 'C' : 'O', `All sheets ${f.sheetSizeIn[1]}" x ${f.sheetSizeIn[0]}" (ARCH D).`, 'ALL'),
    'A-3': r(f.approvalStripIn >= 5 ? 'C' : 'O', `${f.approvalStripIn}-inch full-height strip at the right edge, kept clear for DPIE.`, 'ALL'),
    'A-4': S > 4 ? r('C', `${S} sheets: the whole site is on each plan sheet at one scale, so no match lines; key map in every title block.`, 'ALL') : r('X', `${S} sheets.`),
    'A-5': r('X', 'No match lines — the entire site fits one viewport.'),
    'A-6': r('C', 'Vicinity map at 1" = 2,000\' with north arrow and bar scale, upper right.', f.coverSheet),
    'A-7': r('C', 'Graphic bar scale in every plan viewport.', 'ALL'),
    'A-8': r('C', 'Three State Plane grid ticks with N/E values on each plan.', f.planSheet),
    'A-9': r('C', `Horizontal ${f.datum.horizontal}; vertical ${f.datum.vertical}. NGVD 29 conversion to be stated by the field-run survey.`, 'ALL'),
    'A-10': r('C', 'General notes on the cover sheet.', f.coverSheet),
    'A-11': r(f.planScaleFtPerIn <= 50 ? 'C' : 'O', `Entire property at 1" = ${f.planScaleFtPerIn}'.`, f.planSheet),
    'A-12': r('C', 'Existing structures, adjoining houses, fences, sheds, well, easements of record shown; no historic sites or ruins.', f.existingSheet),
    'A-13': r(f.contoursBeyondFt >= 100 ? 'C' : 'O', `M-NCPPC 2-ft contours, ${f.contoursBeyondFt} ft beyond the property.`, f.existingSheet),
    'A-14': r('C', 'WSSC easement L.51799 F.399 and the proposed Lot 4 WSSC easement; public utility easements along the frontage; existing mains in Henrietta Dr noted (sizes to verify on WSSC 220SE01).', f.utilitySheet),
    'A-15': r(f.bmpRows > 0 ? 'C' : 'O', `County BMP Summary Table, ${f.bmpRows} practices.`, f.coverSheet),
    'B-1': e.streams ? r('C', 'Stream banks shown.', f.existingSheet) : r('X', `No streams on site. ${e.approvals}`),
    'B-2': e.streams ? r('C', 'Stream buffers shown.', f.existingSheet) : r('X', 'No streams, no stream buffers.'),
    'B-3': e.wetlands ? r('C', 'Wetlands shown.', f.existingSheet) : r('X', 'No wetlands on or within 100 ft (DNR; NRI).'),
    'B-4': e.floodplain ? r('C', 'Floodplain delineated.', f.existingSheet) : r('X', 'FEMA Zone X; no 100-yr floodplain on or within 100 ft.'),
    'B-5': r('C', `Slopes 15–25%: ${Math.round(e.steep15SqFt).toLocaleString()} sf; >25%: ${Math.round(e.steep25SqFt).toLocaleString()} sf — shown and in the legend.`, f.existingSheet),
    'B-6': e.pma ? r('C', 'PMA delineated.', f.existingSheet) : r('X', 'No PMA on the property.'),
    'B-7': r('C', e.woodland, f.existingSheet),
    'B-8': r('C', 'Environmental layers drawn 100 ft beyond the property.', f.existingSheet),
    'B-9': r('C', e.soils, f.existingSheet),
    'B-10': r('C', `${e.tmdl} Tier II: ${e.tierII ? 'yes' : 'no'}.`, f.coverSheet),
    'B-11': r('C', e.highlyErodible, f.coverSheet),
    'B-12': r(e.springs ? 'C' : 'X', e.springs ? 'Springs/seeps noted.' : 'None observed or mapped.'),
    'B-13': r(e.marlboroClay ? 'C' : 'X', e.marlboroClay ? 'Marlboro clay noted.' : 'No bedrock or Marlboro clay mapped (PGAtlas); geotechnical report to confirm (E-2).'),
    'B-14': r(e.cbca ? 'C' : 'X', e.cbca ? 'CBCA delineated.' : 'Not in the Chesapeake Bay Critical Area.'),
    'C-1': r('C', 'Estates Court, 6 dwellings, driveways and courts, entrance at MD 210, grading.', f.planSheet),
    'C-2': r(f.esdPractices > 0 ? 'C' : 'O', `${f.esdPractices} ESD practices (micro-bioretention M-6 per lot; roadside dry swales M-8).`, f.swmSheet),
    'C-3': r('C', `Open section — no inlets; ${f.culverts} driveway culverts (15" RCP) with end sections; swales outfall at the entrance to the MD 210 roadside ditch (SHA).`, f.swmSheet),
    'C-4': r('C', `LOD ${Math.round(f.lodSqFt).toLocaleString()} sf incl. mains, easement work off site, sediment control and stockpile.`, f.escSheet),
    'C-5': r('C', 'Recorded WSSC easement (Outlot A, Lot 20) and proposed Lot 4 WSSC easement; private SWM easements over ESD practices.', f.utilitySheet),
    'C-6': r('C', 'MD 210 (variable R/W, SHA), Estates Ct (60\' public), Henrietta Dr and Jennifer Dr (50\' public), 30\' R/W in common L.10142 F.725 (private).', f.planSheet),
    'C-7': r('C', e.wells, f.existingSheet),
    'C-8': r('C', `Estates Court public dedication ${Math.round(f.dedicationSqFt).toLocaleString()} sf (plat PM 228 @ 83); no parkland.`, f.planSheet),
    'C-9': r(f.pois > 0 ? 'C' : 'O', `${f.pois} POI(s); ESDv required vs. provided tabulated per POI.`, f.swmSheet),
    'C-10': r(f.overflowPaths > 0 ? 'C' : 'O', `100-yr overflow arrows from every practice to its POI (${f.overflowPaths}).`, f.swmSheet),
    'C-11': r('C', `Drainage area to each practice; off-site area onto the site ${(f.offsiteAreaSqFt / 43560).toFixed(2)} ac; no diversion between POIs.`, f.swmSheet),
    'C-12': r('X', 'No fill across a drainage course.'),
    'D-1': r('O', 'SWM concept narrative (ESD to the MEP, flow patterns, ESC integration) — to accompany the plans.'),
    'D-2': r('X', 'Not in the Chesapeake Bay Critical Area.'),
    'D-3': r('O', 'Narrative: outfalls at the POIs; swales discharge to the MD 210 roadside ditch; describe receiving areas.'),
    'D-4': r('O', 'Narrative: outfall stabilization (level spreaders / riprap) at each POI.'),
    'D-5': r('X', 'No stream at the outfalls.'),
    'D-6': r('X', 'No existing SWM facility receives the site.'),
    'D-7': r('X', 'No rezoning (RR remains RR).'),
    'D-8': r('X', 'No floodplain or drainage course on or downstream within the site; no dams.'),
    'D-9': r('X', 'No waiver requested.'),
    'D-10': r('O', 'ESDv computations are on the cover; 100-yr existing/proposed runoff at each POI and downstream analysis to follow in the report.'),
    'E-1': r('O', 'Geotechnical report for SWM (borings and Sec. 32-131 infiltration tests at each practice) — to be submitted.'),
    'E-2': r('O', 'Geotechnical report to address Marlboro/Christiana clays, sulfidic and diatomaceous soils.'),
    'E-3': r('O', 'Affidavit of the adjacent-owner mailing (within 7 days of submittal) — with second submission.'),
    'E-4': r('C', e.approvals),
  }
  return DPIE_CONCEPT_CHECKLIST.map(it => ({ ...it, ...(ans[it.id] ?? r('O', 'Not evaluated.')), ...(overrides[it.id] ?? {}) }))
}
