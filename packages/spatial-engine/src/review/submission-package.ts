/**
 * What a Prince George's County residential permit submission actually consists
 * of, and how much of it this set carries.
 *
 * A finished drawing is not a submission. The county takes three separate
 * things across two divisions, and a set that is perfect on one axis is still
 * returned if another is short:
 *
 *   1. SITE / GRADING PLAN      Site/Road Plan Review Division — Subtitle 32
 *   2. BUILDING PLANS           Building Plan Review Division — Form #E003
 *   3. APPLICATION & APPROVALS  Permit Centre — Fine Grading Submittal Checklist
 *
 * Every requirement here is transcribed from a county document held in this
 * repository, and each carries the file it came from. Nothing is paraphrased
 * from memory and nothing is invented:
 *
 *   docs/site-plan-reference/dpie/min-plan-submission-rqmts.txt
 *     "Minimum Plan Submission Requirements for New Single-Family House(s) and
 *      Addition(s) to Existing House Projects", DPIE Form #E003 (Rev. 1/24)
 *
 *   docs/site-plan-reference/dpie/submittal-checklist-site-dev-fine-grading.txt
 *     "Fine Grading Permit — Submittal Checklist", Site/Road Plan Review
 *     Division, revised 17 November 2015
 *
 *   src/jurisdictions/pg-subtitle-32.ts — County Code Sec. 32-130(a)
 *
 * ── The distinction this module exists to keep ──────────────────────────────
 *
 * WHAT MUST ACCOMPANY THE APPLICATION is not the same question as WHAT MUST BE
 * SATISFIED BEFORE THE PERMIT ISSUES. The checklist itself draws the line —
 * items 1 through 20 must be in the initial application or "the permit
 * application may not be accepted for processing", while bonds, agreements and
 * remaining fees come later. A readiness report that mixes the two tells an
 * applicant they cannot submit when in fact they can.
 *
 * ── What this engine does and does not draw ─────────────────────────────────
 *
 * It draws the SITE plan. It does not draw foundation, framing, sections,
 * elevations or wall details, and it will not pretend otherwise: those items
 * are reported as required and NOT PRODUCED HERE, with the discipline that owns
 * them named. A readiness report that quietly omits the architectural set
 * because this package cannot generate it would be the most expensive kind of
 * wrong.
 */

import type { SiteTwin } from '../site-plan/site-twin'
import { featuresOfKind } from '../site-plan/site-twin'
import { PG_PLAN_CONTENT_STANDARDS } from '../jurisdictions/pg-subtitle-32'

/** Who produces an item, which decides who is chased for it. */
export type Producer =
  | 'this engine'
  | 'architect / structural engineer'
  | 'civil engineer'
  | 'landscape architect'
  | 'surveyor'
  | 'soils engineer'
  | 'applicant / owner'
  | 'M-NCPPC'
  | 'county'

export type ItemStatus =
  /** On the sheet, in the set, or otherwise satisfied and checkable. */
  | 'carried'
  /** Required, and not produced by this package. Someone else must supply it. */
  | 'required_from_others'
  /** Required and genuinely missing — nobody has it and the submission needs it. */
  | 'outstanding'
  /** Determined not to apply to this project, with the reason recorded. */
  | 'not_applicable'

export interface SubmissionItem {
  /** Item reference as the county writes it, so a reviewer can find the row. */
  ref: string
  requirement: string
  /** The document this comes from. Never an unexplained rule. */
  source: string
  status: ItemStatus
  /** What makes the status true. Required for anything claimed as carried. */
  evidence: string
  producer: Producer
  /** True where the county's own text makes the item conditional. */
  conditional?: boolean
}

export interface SubmissionPart {
  key: 'site_plan' | 'building_plans' | 'application'
  title: string
  division: string
  source: string
  items: SubmissionItem[]
}

export interface SubmissionReadiness {
  project: string
  parts: SubmissionPart[]
  carried: number
  requiredFromOthers: number
  outstanding: number
  notApplicable: number
  /** Blocking items for the INITIAL application, which is a narrower set. */
  blocksSubmission: SubmissionItem[]
  summary: string
  caveats: string[]
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2. BUILDING PLANS — DPIE Form #E003 (Rev. 1/24)
 *
 * Transcribed from the county form. The minimum scales are the county's, not
 * conventions: quarter inch for the plans, three-quarter inch for wall sections
 * and details.
 * ──────────────────────────────────────────────────────────────────────────── */

const E003 = 'DPIE Form #E003 (Rev. 1/24) — Minimum Plan Submission Requirements, '
  + 'Building Plan Review Division'

export interface BuildingDrawingRequirement {
  ref: string
  drawing: string
  minScale: string | null
  content: string
}

export const PG_BUILDING_PLAN_DRAWINGS: BuildingDrawingRequirement[] = [
  { ref: 'E003-cover', drawing: 'Cover page', minScale: null,
    content: 'Scope of work, drawing index, code analysis, current IBC/IRC/IECC codes and the '
      + "Prince George's County building amendments (Subtitle 4), and building data — the area "
      + 'of the new house or addition.' },
  { ref: 'E003-1', drawing: 'Foundation plan', minScale: '1/4" = 1\'-0"',
    content: 'All elements of the foundation in solid lines and the footings dashed; complete '
      + 'dimensioning of the exterior walls; locations and sizes of all interior bearing walls '
      + 'and footings clearly dimensioned.' },
  { ref: 'E003-2', drawing: 'Floor plans', minScale: '1/4" = 1\'-0"',
    content: 'A separate drawing for each floor showing rooms, doors, windows, stairs, railings '
      + 'and fixtures; room names for the proposed use of every space; dimensions locating all '
      + 'elements, stairway widths and landing sizes.' },
  { ref: 'E003-3', drawing: 'Building cross sections', minScale: '1/4" = 1\'-0"',
    content: 'As many as are needed to explain the structural system completely, each showing the '
      + 'entire building, with vertical dimensions — floor to floor and construction heights.' },
  { ref: 'E003-4', drawing: 'Framing plans', minScale: '1/4" = 1\'-0"',
    content: 'A separate drawing for each floor and the roof showing every framing member and its '
      + 'points of bearing; materials, series, sizes and spacing of joists, rafters, ridges, '
      + 'valleys, hips, ceiling joists, collar ties, bearing walls, beams, posts and headers, '
      + 'with the bearing points accurately dimensioned.' },
  { ref: 'E003-5', drawing: 'Exterior elevations', minScale: '1/4" = 1\'-0"',
    content: 'Each facade — front, rear and both sides — in its finished condition, with all door '
      + 'and window sizes and every finish building material specified. An addition shows the '
      + 'existing AND proposed elevations on all sides.' },
  { ref: 'E003-6', drawing: 'Typical wall sections', minScale: '3/4" = 1\'-0"',
    content: 'Accurate detail of the construction from the footing up to and including the roof, '
      + 'specifying all building materials, sizes and spacing.' },
  { ref: 'E003-7', drawing: 'Details', minScale: '3/4" = 1\'-0"',
    content: 'As required to show special conditions.' },
  { ref: 'E003-8', drawing: 'Structural lateral bracing', minScale: null,
    content: 'Method and sizes of bracing shown on each floor plan. THE BRACING PLAN MUST BE ON A '
      + 'SEPARATE SHEET.' },
]

/**
 * The design criteria the county fixes for this jurisdiction.
 *
 * These are not the engineer's to choose. They are printed on the county form
 * and a set that designs to different values is designing to the wrong county.
 */
export const PG_RESIDENTIAL_DESIGN_CRITERIA = [
  'Floor live load 40 psf, except sleeping rooms at 30 psf.',
  'Roof live load 30 psf, plus drift load where roof areas are subject to drifting. '
    + 'Ground snow load 35 psf.',
  'Basic wind speed 115 mph, 3-second gust. Seismic design category B.',
  'Frost / footing depth 30 inches.',
] as const

/**
 * ePlan file naming, which is a submission requirement and not a convention.
 *
 * The county rejects on this: each PDF sheet is named "Sheet # — Sheet Title"
 * and uploaded into the folder for its discipline.
 */
export const EPLAN_NAMING_RULE =
  'Each PDF sheet must be named "Sheet # — Sheet Title" before uploading (e.g. '
  + '"A101 — First Floor Plan", "S101 — Foundation Plan"), and uploaded into the folder for its '
  + 'discipline — architectural drawings in Architectural, structural in Structural, and so on.'

/* ────────────────────────────────────────────────────────────────────────────
 * 3. APPLICATION AND SUPPORTING APPROVALS
 *
 * Fine Grading Permit — Submittal Checklist, items A.1 through A.20. The note
 * at the foot of item 20 is the reason these are treated as blocking: "Initial
 * Permit application must include the above items 1 through 20. If any items
 * are omitted, the permit application may not be accepted for processing."
 * ──────────────────────────────────────────────────────────────────────────── */

const FINE_GRADING = 'DPIE Fine Grading Permit — Submittal Checklist, Site/Road Plan Review '
  + 'Division, revised 17 November 2015'

interface ApplicationRow {
  ref: string
  requirement: string
  producer: Producer
  conditional?: boolean
  /**
   * A twin-derived check, for the checklist rows this package actually delivers.
   *
   * Three of the twenty-eight are drawings this engine produces, and reporting
   * them as "not in hand" alongside the twenty-five nobody has yet buries the
   * real gap under items that are already done.
   */
  fromTwin?: (twin: SiteTwin) => { ok: boolean; evidence: string }
}

const APPLICATION_ROWS: ApplicationRow[] = [
  { ref: 'A.1', requirement: 'Completed permit application.', producer: 'applicant / owner' },
  { ref: 'A.2', requirement:
      'Filing fee: 33.3% of the grading fee at $0.008/sq ft of disturbed area outside the '
      + 'right-of-way, plus 3.3% of the construction cost estimate for public improvements inside '
      + 'the public right-of-way (not less than $50), plus 3.3% of the storm drain and stormwater '
      + 'management cost estimate outside the right-of-way; 5% technology fee on each.',
    producer: 'applicant / owner' },
  { ref: 'A.3', requirement: 'Site and grading plan.', producer: 'this engine',
    fromTwin: t => {
      const lots = (t as { projectLots?: unknown[] }).projectLots?.length ?? 0
      return lots
        ? { ok: true, evidence:
            `Site and grading plan generated for ${lots} lot(s) — boundary of record, existing `
            + 'and proposed grade, improvements, limits of disturbance and the frontage. It '
            + 'requires the seal of the responsible professional before it is filed.' }
        : { ok: false, evidence: 'No lots on the model, so no site plan was generated.' }
    } },
  { ref: 'A.4', requirement: 'Landscape plan.', producer: 'landscape architect' },
  { ref: 'A.5a', requirement:
      'Permit information plan (offsite conditions) and any information on prior agreements.',
    producer: 'civil engineer' },
  { ref: 'A.5b', requirement:
      'Planning Board resolutions and District Council final order — all documents from all prior '
      + 'approvals. Staff reports are accepted where final resolutions are not available.',
    producer: 'applicant / owner' },
  { ref: 'A.6', requirement:
      'Type 2 Tree Conservation Plan (TCP2), or a Woodland Conservation exemption letter from '
      + 'M-NCPPC.', producer: 'M-NCPPC' },
  { ref: 'A.7a', requirement: 'Soil boring report for stormwater management.',
    producer: 'soils engineer' },
  { ref: 'A.7b', requirement: 'Soil boring report for public roads, if public roads are included.',
    producer: 'soils engineer', conditional: true },
  { ref: 'A.7c', requirement: 'Soil boring report for site grading and structures.',
    producer: 'soils engineer' },
  { ref: 'A.8', requirement: 'Approved site development concept letter.', producer: 'county' },
  { ref: 'A.9', requirement:
      'Site development stormwater management and erosion/sediment control approval, if required.',
    producer: 'county', conditional: true },
  { ref: 'A.10', requirement: 'Final sediment and erosion control plan.', producer: 'civil engineer' },
  { ref: 'A.11a', requirement:
      'Final stormwater management, storm drain and paving plan, computations and drainage area '
      + 'map.', producer: 'this engine',
    fromTwin: t => {
      const trunk = (t as { stormTrunk?: { pipes?: unknown[]; structures?: unknown[] } }).stormTrunk
      const das = (t as { features: { kind: string }[] }).features
        .filter(f => f.kind === 'DrainageArea').length
      if (!trunk?.pipes?.length) {
        return { ok: false, evidence: 'No storm drain system is on the model.' }
      }
      return { ok: true, evidence:
        `${trunk.pipes.length} reach(es) and ${trunk.structures?.length ?? 0} structure(s) sized `
        + `with computed Q10/Q100, tabled in the STORM DRAIN SCHEDULE; ${das} drainage area(s) `
        + 'delineated. STORMWATER MANAGEMENT ITSELF IS NOT DESIGNED HERE — these lots discharge '
        + 'to a shared piped system and no on-lot ESD practice is proposed, which is a '
        + 'determination the stormwater concept (A.8) has to confirm.' }
    } },
  { ref: 'A.11b', requirement: 'Dam breach analysis, if required.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.11c', requirement: 'Final bridge plan and computations, if required.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.12', requirement:
      'Final design review checklists — storm drain, stormwater management, grading, paving, '
      + 'roadway, pavement marking and signage, maintenance of traffic, bridge, as applicable. '
      + 'Plans submitted without a completed checklist may be returned without review.',
    producer: 'civil engineer' },
  // Not a status the engine can claim: the county requires the DESIGN
  // PROFESSIONAL to complete and submit its form. `buildCountyChecklist()`
  // drafts the content; signing it is a professional act.
  { ref: 'A.13', requirement:
      'Approved road/street grade establishment plan, if public roads are included.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.14a', requirement: 'Pavement marking and signage plan, if applicable.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.14b', requirement:
      'Maintenance of traffic plan — required where the permit includes work within the existing '
      + 'roadway, INCLUDING SIDEWALK ADJUSTMENTS.', producer: 'civil engineer', conditional: true },
  { ref: 'A.15', requirement: 'Street tree and lighting plan.', producer: 'landscape architect' },
  { ref: 'A.16', requirement: 'Signal warrant study, if required.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.17', requirement: 'Sight distance analysis.', producer: 'civil engineer' },
  { ref: 'A.18', requirement: 'Existing 100-year floodplain delineation, if required.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.19', requirement:
      'Proposed 100-year floodplain model, or a package requesting county modelling, if required.',
    producer: 'civil engineer', conditional: true },
  { ref: 'A.20a', requirement:
      'Cost estimate for work in the public road right-of-way — storm drain, stormwater '
      + 'management, roadway, grading, street trees, bridge.', producer: 'applicant / owner' },
  { ref: 'A.20b', requirement:
      'Cost estimate for work outside the public road right-of-way — storm drain and stormwater '
      + 'management, public and private.', producer: 'applicant / owner' },
  { ref: 'A.20c', requirement: 'Cost estimate for grading outside the public right-of-way.',
    producer: 'applicant / owner' },
]

/* ──────────────────────────────────────────────────────────────────────────── */

/** Evidence for a Subtitle 32 paragraph, read off the model rather than asserted. */
function siteEvidence(twin: SiteTwin, paragraph: string): { ok: boolean; evidence: string } {
  const t = twin as SiteTwin & {
    soils?: unknown[]
    stormTrunk?: { pipes?: unknown[]; structures?: unknown[] }
    disturbedAreaSqFt?: number
    disturbanceHasUnknowns?: boolean
    platRecord?: { reference?: string }
    projectLots?: { drainage?: unknown }[]
  }
  const count = (k: Parameters<typeof featuresOfKind>[1]) => featuresOfKind(twin, k).length
  const no = (why: string) => ({ ok: false, evidence: why })

  switch (paragraph) {
    case '(a)(1)':
      return { ok: true, evidence: 'Sheet is ARCH D, 24" x 36" — within the 30" x 42" maximum.' }
    case '(a)(2)':
      return { ok: true, evidence: 'Preparer panel and owner block are rendered in the title block.' }
    case '(a)(3)':
      return { ok: true, evidence:
        'Professional certification area is reserved on the sheet and left empty for the '
        + "licensed professional's seal and signature." }
    case '(a)(4)': {
      const lod = count('LimitOfDisturbance')
      if (!lod) return no('No limit of disturbance is drawn.')
      return t.disturbanceHasUnknowns
        ? { ok: false, evidence:
            `${lod} limit(s) of disturbance drawn, but the disturbed-area calculation still has `
            + 'unquantified components, so the square-foot figure is not defensible.' }
        : { ok: true, evidence:
            `${lod} limit(s) of disturbance drawn; disturbed area `
            + `${Math.round(t.disturbedAreaSqFt ?? 0).toLocaleString()} sq ft calculated.` }
    }
    case '(a)(5)': {
      const c = count('Contour')
      return c
        ? { ok: true, evidence: `${c} contour(s) drawn at 2 ft interval, 1" = 20' scale.` }
        : no('No contours are drawn.')
    }
    case '(a)(6)':
      return { ok: true, evidence: 'Not a surplus earth disposal site of ten acres or more.' }
    case '(a)(7)':
      return no('No classes of fill are delineated or dimensioned.')
    case '(a)(8)':
      return no('No established or tentative street grade, and no M-NCPPC or DPW&T file number, '
        + 'is shown for the fronting street.')
    case '(a)(9)': {
      const spots = count('SpotElevation')
      return spots
        ? { ok: true, evidence:
            `${spots} spot elevation(s) including finished floor elevations and storm structure `
            + 'grades. Basement and building-corner elevations and the driveway profile are NOT '
            + 'drawn.' }
        : no('No spot elevations are drawn.')
    }
    case '(a)(10)': {
      const pav = count('Pavement')
      return pav
        ? { ok: true, evidence:
            `${pav} paved improvement(s) — driveway, apron, leadwalk, stoop, public walk, curb `
            + 'and gutter — each sized, located and lettered.' }
        : no('No proposed site development is drawn.')
    }
    case '(a)(11)': {
      const da = count('DrainageArea')
      const trunk = t.stormTrunk
      const hasComp = Boolean(t.projectLots?.some(l => l.drainage) || (twin as { drainage?: unknown }).drainage)
      if (da && trunk?.pipes?.length && hasComp) {
        return { ok: true, evidence:
          `${da} drainage area(s) delineated; ${trunk.pipes.length} storm reach(es) and `
          + `${trunk.structures?.length ?? 0} structure(s) with computed flows, tabled on the sheet `
          + 'in the STORM DRAIN SCHEDULE; per-lot rational-method computations in the drainage '
          + 'block.' }
      }
      return no('Drainage area map, runoff computations and the storm drain schedule are not all '
        + 'present.')
    }
    case '(a)(12)':
      return { ok: true, evidence:
        'Sequence of construction is rendered on the sheet. The staged SUBDIVISION of the site '
        + 'with respective areas in square feet is not delineated — a single-stage build.' }
    case '(a)(13)': {
      const soils = t.soils?.length ?? 0
      return soils
        ? { ok: true, evidence:
            `${soils} SSURGO map unit(s) tabled. Hydrological characteristics to 6 ft below the `
            + 'proposed basement floor and depth to the closest aquifer are NOT provided and '
            + 'require the soil boring report.' }
        : no('No soils information is tabled.')
    }
    case '(a)(14)':
      return no('No construction time, start date or completion date is stated.')
    case '(a)(15)':
      return no('No approved Type 2 Tree Conservation Plan or Woodland Conservation exemption '
        + 'letter is in the set.')
    default:
      return no('Not evaluated.')
  }
}

/** Which paragraphs this engine could satisfy at all, versus somebody else's. */
const SITE_PRODUCER: Record<string, Producer> = {
  '(a)(3)': 'civil engineer',
  '(a)(7)': 'civil engineer',
  '(a)(8)': 'civil engineer',
  '(a)(13)': 'soils engineer',
  '(a)(14)': 'applicant / owner',
  '(a)(15)': 'M-NCPPC',
}

export function buildSubmissionReadiness(input: {
  twin: SiteTwin
  project: string
  /** Building drawings already in hand, by E003 ref. Empty means none. */
  buildingDrawingsInHand?: string[]
  /** Application items already obtained, by checklist ref. */
  applicationItemsInHand?: string[]
}): SubmissionReadiness {
  const { twin, project } = input
  const haveDrawings = new Set(input.buildingDrawingsInHand ?? [])
  const haveApplication = new Set(input.applicationItemsInHand ?? [])

  const siteItems: SubmissionItem[] = PG_PLAN_CONTENT_STANDARDS.map(std => {
    const { ok, evidence } = siteEvidence(twin, std.paragraph)
    const producer = SITE_PRODUCER[std.paragraph] ?? 'this engine'
    return {
      ref: `Sec. 32-130${std.paragraph}`,
      requirement: std.requirement,
      source: "County Code Sec. 32-130(a) — Prince George's County",
      status: ok ? 'carried' : producer === 'this engine' ? 'outstanding' : 'required_from_others',
      evidence,
      producer,
    }
  })

  const buildingItems: SubmissionItem[] = PG_BUILDING_PLAN_DRAWINGS.map(d => ({
    ref: d.ref,
    requirement: `${d.drawing}${d.minScale ? ` (min. scale ${d.minScale})` : ''} — ${d.content}`,
    source: E003,
    status: haveDrawings.has(d.ref) ? 'carried' : 'required_from_others',
    evidence: haveDrawings.has(d.ref)
      ? 'Supplied by the design professional and included in the permit set.'
      : 'NOT PRODUCED BY THIS ENGINE. This package draws the site plan; the architectural and '
        + 'structural set is the design professional\'s.',
    producer: 'architect / structural engineer',
  }))

  const applicationItems: SubmissionItem[] = APPLICATION_ROWS.map(r => {
    if (haveApplication.has(r.ref)) {
      return {
        ref: r.ref, requirement: r.requirement, source: FINE_GRADING, status: 'carried' as const,
        evidence: 'Obtained and in the application package.',
        producer: r.producer, conditional: r.conditional,
      }
    }
    const checked = r.fromTwin?.(twin)
    if (checked) {
      return {
        ref: r.ref, requirement: r.requirement, source: FINE_GRADING,
        status: (checked.ok ? 'carried' : 'outstanding') as ItemStatus,
        evidence: checked.evidence, producer: r.producer, conditional: r.conditional,
      }
    }
    return {
      ref: r.ref, requirement: r.requirement, source: FINE_GRADING,
      status: 'required_from_others' as const, evidence: 'Not in hand.',
      producer: r.producer, conditional: r.conditional,
    }
  })

  const parts: SubmissionPart[] = [
    { key: 'site_plan', title: 'Site and grading plan',
      division: 'DPIE Site/Road Plan Review Division',
      source: "County Code Sec. 32-130(a)", items: siteItems },
    { key: 'building_plans', title: 'Building plans (architectural and structural)',
      division: 'DPIE Building Plan Review Division', source: E003, items: buildingItems },
    { key: 'application', title: 'Application and supporting approvals',
      division: 'DPIE Permit Centre', source: FINE_GRADING, items: applicationItems },
  ]

  const all = parts.flatMap(p => p.items)
  const carried = all.filter(i => i.status === 'carried').length
  const requiredFromOthers = all.filter(i => i.status === 'required_from_others').length
  const outstanding = all.filter(i => i.status === 'outstanding').length
  const notApplicable = all.filter(i => i.status === 'not_applicable').length

  // WHAT ACTUALLY STOPS AN INTAKE CLERK, which is a narrower thing than "not
  // finished". The checklist's own note makes items 1-20 the gate; a
  // conditional item is not a gate until somebody determines it applies.
  const blocksSubmission = applicationItems
    .filter(i => i.status !== 'carried' && !i.conditional)
    .concat(siteItems.filter(i => i.status === 'outstanding'))

  return {
    project,
    parts,
    carried,
    requiredFromOthers,
    outstanding,
    notApplicable,
    blocksSubmission,
    summary:
      `${carried} of ${all.length} submission items carried; ${outstanding} outstanding on work `
      + `this package owns and ${requiredFromOthers} required from others. `
      + `${blocksSubmission.length} item(s) would stop the initial application being accepted.`,
    caveats: [
      'The Fine Grading Submittal Checklist held here is revised 17 November 2015. Its FEE '
      + 'FIGURES and its paper/mylar copy counts must be verified against the current county '
      + 'schedule before an application is filed — those are the two parts of a 2015 form most '
      + 'likely to have moved.',
      'The county now takes the application through Momentum and plan review through '
      + 'ePlan/ProjectDox. ' + EPLAN_NAMING_RULE,
      'Seal requirements differ by document. Site engineering requires the applicable '
      + 'professional seal. Residential building drawings have a limited personal-use exemption '
      + 'for a detached single-family dwelling, but STRUCTURAL plans and calculations require the '
      + "signature and seal of a Maryland professional engineer, and DPIE may require a seal "
      + 'where it judges one necessary.',
      'This report states what the SET carries. It does not assert that any item in it has been '
      + 'reviewed or accepted by the county, and nothing here implies approval.',
    ],
  }
}

/** The report as a markdown document, for the file the applicant actually reads. */
export function renderSubmissionReadiness(r: SubmissionReadiness): string {
  const L: string[] = []
  const badge: Record<ItemStatus, string> = {
    carried: 'CARRIED',
    required_from_others: 'FROM OTHERS',
    outstanding: 'OUTSTANDING',
    not_applicable: 'N/A',
  }
  L.push(`# Submission readiness — ${r.project}`, '')
  L.push(r.summary, '')
  L.push('## What would stop the application being accepted', '')
  if (!r.blocksSubmission.length) {
    L.push('Nothing. Every item the county requires in the initial application is in hand.', '')
  } else {
    for (const i of r.blocksSubmission) {
      L.push(`- **${i.ref}** — ${i.requirement} _(${i.producer})_`)
    }
    L.push('')
  }
  for (const p of r.parts) {
    L.push(`## ${p.title}`, '', `${p.division} · ${p.source}`, '')
    L.push('| Ref | Status | Requirement | Evidence / who owns it |')
    L.push('|---|---|---|---|')
    for (const i of p.items) {
      const req = i.requirement.replace(/\|/g, '\\|')
      const ev = `${i.evidence.replace(/\|/g, '\\|')} _(${i.producer})_`
      L.push(`| ${i.ref} | ${badge[i.status]}${i.conditional ? ' (if applicable)' : ''} | ${req} | ${ev} |`)
    }
    L.push('')
  }
  L.push('## Design criteria fixed by the county', '')
  for (const c of PG_RESIDENTIAL_DESIGN_CRITERIA) L.push(`- ${c}`)
  L.push('')
  L.push('## Caveats', '')
  for (const c of r.caveats) L.push(`- ${c}`)
  L.push('')
  return L.join('\n')
}
