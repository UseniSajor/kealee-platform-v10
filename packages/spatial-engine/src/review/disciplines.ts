/**
 * Professional review routing.
 *
 * Kealee drafts the package; licensed professionals review, correct and seal
 * within their own statutory practice. A surveyor does not seal drainage design
 * and an engineer does not certify a boundary, so work is routed to the right
 * discipline rather than to a single generic "reviewer".
 *
 * The platform records comments, revisions, approvals and rejected items per
 * discipline. It never reproduces or places a seal.
 */

import type { SheetId } from '../sheets/sheet-template'

export type Discipline =
  | 'surveyor'
  | 'professional_engineer'
  | 'landscape_architect'
  | 'environmental_professional'
  | 'architect'
  | 'geotechnical_engineer'
  | 'land_use_planner'

export interface DisciplineDefinition {
  id: Discipline
  title: string
  /** Licence the reviewer must hold, where one is required by statute. */
  licence: string | null
  state: string
  /** What this discipline is responsible for reviewing and sealing. */
  scope: string[]
  /** Sheets routed to this queue. */
  sheets: SheetId[]
  /** Whether this discipline's sign-off is required before submission. */
  requiredForSubmission: boolean
}

export const DISCIPLINES: Record<Discipline, DisciplineDefinition> = {
  surveyor: {
    id: 'surveyor',
    title: 'Maryland Licensed Surveyor',
    licence: 'Maryland Professional Land Surveyor',
    state: 'MD',
    scope: [
      'Boundary and topographic survey',
      'Benchmark, horizontal and vertical datum',
      'Existing-conditions certification',
    ],
    sheets: ['C-100'],
    requiredForSubmission: true,
  },
  professional_engineer: {
    id: 'professional_engineer',
    title: 'Maryland Professional Engineer',
    licence: 'Maryland Professional Engineer',
    state: 'MD',
    scope: [
      'Civil plan and site layout',
      'Grading and drainage',
      'Stormwater management',
      'Utilities',
      'Road, driveway and sight-distance design',
      'Sediment and erosion control',
    ],
    sheets: ['C-200', 'C-300', 'C-400', 'C-500', 'C-600', 'C-700', 'C-800', 'C-900'],
    requiredForSubmission: true,
  },
  landscape_architect: {
    id: 'landscape_architect',
    title: 'Landscape Architect / Qualified Professional',
    licence: 'Maryland Licensed Landscape Architect',
    state: 'MD',
    scope: ['Landscape and planting plan', 'Screening', 'Tree canopy schedule'],
    sheets: ['L-100'],
    requiredForSubmission: false,
  },
  environmental_professional: {
    id: 'environmental_professional',
    title: 'Qualified Environmental Professional',
    licence: null,
    state: 'MD',
    scope: [
      'Natural Resource Inventory',
      'Tree Conservation Plan',
      'Woodland conservation',
    ],
    sheets: ['TCP-NRI'],
    requiredForSubmission: false,
  },
  architect: {
    id: 'architect',
    title: 'Architect',
    licence: 'Maryland Registered Architect',
    state: 'MD',
    scope: [
      'Architectural plans and elevations',
      'Building footprint and finished-floor elevations',
      'Civil coordination',
    ],
    sheets: ['C-200'],
    requiredForSubmission: false,
  },
  geotechnical_engineer: {
    id: 'geotechnical_engineer',
    title: 'Geotechnical Engineer',
    licence: 'Maryland Professional Engineer',
    state: 'MD',
    scope: [
      'Soil borings and classification',
      'Infiltration testing',
      'Groundwater separation',
      'Foundation constraints',
    ],
    sheets: ['C-400', 'C-600'],
    requiredForSubmission: false,
  },
  land_use_planner: {
    id: 'land_use_planner',
    title: 'Land-Use Planner / Attorney',
    licence: null,
    state: 'MD',
    scope: [
      'Entitlement strategy',
      'Justification statements',
      'Approval-condition compliance',
    ],
    sheets: ['C-000'],
    requiredForSubmission: false,
  },
}

export type ReviewDecision = 'PENDING' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'

export interface ReviewItem {
  id: string
  discipline: Discipline
  sheet: SheetId | null
  /** What the reviewer is being asked to confirm. */
  subject: string
  decision: ReviewDecision
  comment?: string
  /** Raised by the platform for the reviewer's attention. */
  platformNote?: string
  decidedAt?: string
  decidedBy?: string
  licenceNumber?: string
}

export interface ReviewMatrixRow {
  discipline: Discipline
  title: string
  licence: string | null
  sheets: SheetId[]
  requiredForSubmission: boolean
  items: ReviewItem[]
  decision: ReviewDecision
  outstanding: number
}

export interface ReviewMatrix {
  rows: ReviewMatrixRow[]
  /** Disciplines whose sign-off is required and not yet given. */
  blockingDisciplines: Discipline[]
  submissionReady: boolean
  summary: string
}

/** Rolls per-item decisions up to a discipline decision. */
function rollUp(items: ReviewItem[]): ReviewDecision {
  if (items.length === 0) return 'PENDING'
  if (items.some(i => i.decision === 'REJECTED')) return 'REJECTED'
  if (items.some(i => i.decision === 'CHANGES_REQUESTED')) return 'CHANGES_REQUESTED'
  if (items.every(i => i.decision === 'APPROVED')) return 'APPROVED'
  return 'PENDING'
}

/**
 * Delivery item 9 — the professional review matrix.
 *
 * `submissionReady` describes review state only. It is not a claim that the
 * jurisdiction has approved anything.
 */
export function buildReviewMatrix(
  items: ReviewItem[],
  activeSheets: SheetId[],
): ReviewMatrix {
  const rows: ReviewMatrixRow[] = []

  for (const def of Object.values(DISCIPLINES)) {
    const sheets = def.sheets.filter(s => activeSheets.includes(s))
    if (sheets.length === 0 && def.id !== 'geotechnical_engineer') continue

    const mine = items.filter(i => i.discipline === def.id)
    const decision = rollUp(mine)
    rows.push({
      discipline: def.id,
      title: def.title,
      licence: def.licence,
      sheets,
      requiredForSubmission: def.requiredForSubmission,
      items: mine,
      decision,
      outstanding: mine.filter(i => i.decision !== 'APPROVED').length,
    })
  }

  const blocking = rows
    .filter(r => r.requiredForSubmission && r.decision !== 'APPROVED')
    .map(r => r.discipline)

  return {
    rows,
    blockingDisciplines: blocking,
    submissionReady: blocking.length === 0,
    summary: blocking.length
      ? `Awaiting sign-off from ${blocking.length} required discipline${blocking.length === 1 ? '' : 's'}: ` +
        blocking.map(d => DISCIPLINES[d].title).join(', ') + '.'
      : 'All required disciplines have signed off. Jurisdiction approval is separate and not implied.',
  }
}

/**
 * Seeds the review queue from the drafted package: one item per sheet for its
 * responsible discipline, plus items for each stated assumption routed to
 * whoever can resolve it.
 */
export function seedReviewItems(input: {
  sheets: SheetId[]
  assumptions: { feature: string; assumption: string; resolvedBy: string }[]
}): ReviewItem[] {
  const items: ReviewItem[] = []
  let n = 0

  for (const def of Object.values(DISCIPLINES)) {
    for (const sheet of def.sheets.filter(s => input.sheets.includes(s))) {
      items.push({
        id: `rev-${++n}`,
        discipline: def.id,
        sheet,
        subject: `Review and seal ${sheet}`,
        decision: 'PENDING',
      })
    }
  }

  const resolverMap: Record<string, Discipline> = {
    survey: 'surveyor',
    geotechnical: 'geotechnical_engineer',
    utility_owner: 'professional_engineer',
    engineer: 'professional_engineer',
    applicant: 'land_use_planner',
  }

  for (const a of input.assumptions) {
    items.push({
      id: `rev-${++n}`,
      discipline: resolverMap[a.resolvedBy] ?? 'professional_engineer',
      sheet: null,
      subject: `Confirm assumption — ${a.feature}`,
      decision: 'PENDING',
      platformNote: a.assumption,
    })
  }

  return items
}
