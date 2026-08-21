/**
 * Content-scoped professional responsibility.
 *
 * Discipline routing identifies who is authorised to resolve and certify each
 * SUBJECT. It does not assume a sheet belongs to one profession. A combined
 * one- or two-sheet infill plan routinely carries surveying, civil and landscape
 * content at once, and that is normal practice, not a defect.
 *
 * So responsibility attaches to objects and sections, the title block shows the
 * division, and the platform never splits a sheet in two merely to give each
 * seal its own page. Forcing that split makes the drawing worse and the review
 * harder, and no jurisdiction asks for it.
 */

import type { SiteFeature, SiteTwin } from '../site-plan/site-twin'
import type { SheetId } from '../sheets/sheet-template'
import { DISCIPLINES, type Discipline, type ReviewDecision } from './disciplines'

export type ContentSubject =
  | 'boundary_determination'
  | 'topographic_survey'
  | 'easement_depiction'
  | 'existing_improvements'
  | 'zoning_compliance'
  | 'site_layout'
  | 'grading_design'
  | 'stormwater_design'
  | 'sediment_control'
  | 'utility_design'
  | 'roadway_design'
  | 'demolition'
  | 'planting_design'
  | 'tree_conservation'
  | 'architectural_footprint'
  | 'geotechnical'
  | 'entitlement'

export interface SubjectAuthority {
  subject: ContentSubject
  label: string
  /** The discipline that may certify this subject. Exactly one, by statute. */
  certifiedBy: Discipline
  /** Disciplines that may comment or coordinate but may not certify it. */
  mayReview: Discipline[]
  /** Why that discipline and not another. */
  basis: string
  /** Whether a seal on this subject is needed before a permit submission. */
  requiredForSubmission: boolean
}

export const SUBJECT_AUTHORITY: Record<ContentSubject, SubjectAuthority> = {
  boundary_determination: {
    subject: 'boundary_determination',
    label: 'Property boundary, monuments, metes and bounds',
    certifiedBy: 'surveyor',
    mayReview: ['professional_engineer', 'land_use_planner'],
    basis: 'Boundary determination is the practice of land surveying. An engineer may rely on it but may not certify it.',
    requiredForSubmission: true,
  },
  topographic_survey: {
    subject: 'topographic_survey',
    label: 'Existing contours, spot elevations, benchmarks, datum',
    certifiedBy: 'surveyor',
    mayReview: ['professional_engineer', 'geotechnical_engineer'],
    basis: 'Field topography and the vertical datum tie are surveying work.',
    requiredForSubmission: true,
  },
  easement_depiction: {
    subject: 'easement_depiction',
    label: 'Easements, rights-of-way and recorded encumbrances as plotted',
    certifiedBy: 'surveyor',
    mayReview: ['land_use_planner', 'professional_engineer'],
    basis: 'Plotting a recorded instrument onto the parcel is surveying. Its legal effect is a title question.',
    requiredForSubmission: true,
  },
  existing_improvements: {
    subject: 'existing_improvements',
    label: 'Existing structures, pavement, walls and fences as located',
    certifiedBy: 'surveyor',
    mayReview: ['professional_engineer', 'architect'],
    basis: 'Located improvements are part of the existing-conditions survey.',
    requiredForSubmission: false,
  },
  zoning_compliance: {
    subject: 'zoning_compliance',
    label: 'Zone, setbacks, lot coverage, height and density compliance',
    certifiedBy: 'professional_engineer',
    mayReview: ['land_use_planner', 'architect', 'surveyor'],
    basis: 'Applying dimensional standards to a design is engineering; the planner advises on interpretation.',
    requiredForSubmission: true,
  },
  site_layout: {
    subject: 'site_layout',
    label: 'Proposed building placement, parking, walks and site geometry',
    certifiedBy: 'professional_engineer',
    mayReview: ['architect', 'landscape_architect'],
    basis: 'Site civil layout is engineering. The building envelope itself is architectural.',
    requiredForSubmission: true,
  },
  grading_design: {
    subject: 'grading_design',
    label: 'Proposed grades, slopes, retaining structures, earthwork',
    certifiedBy: 'professional_engineer',
    mayReview: ['geotechnical_engineer', 'surveyor'],
    basis: 'Grading design is engineering, and depends on certified existing topography.',
    requiredForSubmission: true,
  },
  stormwater_design: {
    subject: 'stormwater_design',
    label: 'Drainage areas, storm conveyance, ESD practices, water-quality volume',
    certifiedBy: 'professional_engineer',
    mayReview: ['geotechnical_engineer'],
    basis: 'Stormwater management design is engineering under the Maryland Stormwater Design Manual.',
    requiredForSubmission: true,
  },
  sediment_control: {
    subject: 'sediment_control',
    label: 'Limits of disturbance, sediment control measures, sequencing',
    certifiedBy: 'professional_engineer',
    mayReview: ['environmental_professional'],
    basis: 'Erosion and sediment control plans are engineered and approved by the soil conservation district.',
    requiredForSubmission: true,
  },
  utility_design: {
    subject: 'utility_design',
    label: 'Water, sewer, storm, gas and dry-utility layout and connections',
    certifiedBy: 'professional_engineer',
    mayReview: ['architect'],
    basis: 'Utility design is engineering; the serving utility separately approves its own connections.',
    requiredForSubmission: true,
  },
  roadway_design: {
    subject: 'roadway_design',
    label: 'Driveways, aprons, sight distance, pavement section',
    certifiedBy: 'professional_engineer',
    mayReview: [],
    basis: 'Roadway geometry and sight-distance design are engineering.',
    requiredForSubmission: false,
  },
  demolition: {
    subject: 'demolition',
    label: 'Structures and improvements to be removed',
    certifiedBy: 'professional_engineer',
    mayReview: ['architect', 'surveyor'],
    basis: 'What is removed and how the site is stabilised afterwards is engineering.',
    requiredForSubmission: false,
  },
  planting_design: {
    subject: 'planting_design',
    label: 'Planting, screening, buffer and street-tree requirements',
    certifiedBy: 'landscape_architect',
    mayReview: ['environmental_professional', 'professional_engineer'],
    basis: 'Landscape design under the Prince George\'s County Landscape Manual.',
    requiredForSubmission: false,
  },
  tree_conservation: {
    subject: 'tree_conservation',
    label: 'Woodland conservation, specimen trees, NRI/TCP content',
    certifiedBy: 'environmental_professional',
    mayReview: ['landscape_architect', 'professional_engineer'],
    basis: 'NRI and TCP content is prepared by a qualified professional under the Woodland Conservation Ordinance.',
    requiredForSubmission: false,
  },
  architectural_footprint: {
    subject: 'architectural_footprint',
    label: 'Building footprint, finished-floor elevation, entries',
    certifiedBy: 'architect',
    mayReview: ['professional_engineer'],
    basis: 'The building itself is architectural; the civil set depicts it for coordination.',
    requiredForSubmission: false,
  },
  geotechnical: {
    subject: 'geotechnical',
    label: 'Soil classification, infiltration rates, groundwater separation',
    certifiedBy: 'geotechnical_engineer',
    mayReview: ['professional_engineer'],
    basis: 'Subsurface characterisation is geotechnical engineering and underpins any infiltration practice.',
    requiredForSubmission: false,
  },
  entitlement: {
    subject: 'entitlement',
    label: 'Approvals, conditions, variance and special-exception status',
    certifiedBy: 'land_use_planner',
    mayReview: ['professional_engineer'],
    basis: 'Entitlement status is a planning and legal question, not an engineering certification.',
    requiredForSubmission: false,
  },
}

/** Which subject a twin object belongs to. */
export const KIND_SUBJECT: Record<SiteFeature['kind'], ContentSubject> = {
  Parcel: 'boundary_determination',
  BoundarySegment: 'boundary_determination',
  Easement: 'easement_depiction',
  Building: 'architectural_footprint',
  Setback: 'zoning_compliance',
  EnvironmentalBuffer: 'tree_conservation',
  Floodplain: 'tree_conservation',
  Woodland: 'tree_conservation',
  Tree: 'tree_conservation',
  LimitOfDisturbance: 'sediment_control',
  ExistingFeature: 'existing_improvements',
  ProposedFeature: 'site_layout',
  Surface: 'grading_design',
  Contour: 'topographic_survey',
  Breakline: 'topographic_survey',
  SpotElevation: 'topographic_survey',
  Pavement: 'site_layout',
  ParkingSpace: 'site_layout',
  Sidewalk: 'site_layout',
  Utility: 'utility_design',
  StormPipe: 'stormwater_design',
  Structure: 'utility_design',
  DrainageArea: 'stormwater_design',
  SWMPractice: 'stormwater_design',
  DemolitionFeature: 'demolition',
}

/**
 * An existing Contour is surveyed; a proposed one is designed. The object kind
 * alone does not settle the subject, so proposed grading objects reroute to the
 * engineer even though their kind maps to survey.
 */
export function subjectForFeature(f: SiteFeature): ContentSubject {
  const base = KIND_SUBJECT[f.kind]
  const attrs = 'attributes' in f ? (f.attributes ?? {}) : {}
  const proposed = attrs.proposed === true || attrs.status === 'proposed'
  if (proposed && (base === 'topographic_survey' || base === 'existing_improvements')) {
    return 'grading_design'
  }
  if (f.kind === 'Building' && 'existing' in f && f.existing === false) {
    return 'architectural_footprint'
  }
  return base
}

export interface SheetResponsibility {
  discipline: Discipline
  title: string
  licence: string | null
  /** Subjects on this sheet that this professional certifies. */
  certifies: ContentSubject[]
  /** Object ids within their scope — responsibility is object-level, not page-level. */
  objectIds: string[]
  /** Subjects on the same sheet that are explicitly NOT theirs. */
  excludes: ContentSubject[]
  requiredForSubmission: boolean
}

export interface DividedResponsibilityBlock {
  sheet: SheetId
  /** One row per professional with content on the sheet. */
  rows: SheetResponsibility[]
  /** Printed under the seal boxes. */
  divisionNote: string
  /** Subjects present that nobody is authorised for — a routing gap, surfaced not hidden. */
  unassigned: ContentSubject[]
}

/**
 * Builds the title-block responsibility division for one sheet from the objects
 * actually drawn on it.
 */
export function buildResponsibilityBlock(input: {
  sheet: SheetId
  features: SiteFeature[]
  /** Extra subjects present as notes or tables rather than geometry. */
  additionalSubjects?: ContentSubject[]
}): DividedResponsibilityBlock {
  const bySubject = new Map<ContentSubject, string[]>()
  for (const f of input.features) {
    const s = subjectForFeature(f)
    const list = bySubject.get(s) ?? []
    list.push(f.id)
    bySubject.set(s, list)
  }
  for (const s of input.additionalSubjects ?? []) {
    if (!bySubject.has(s)) bySubject.set(s, [])
  }

  const subjects = [...bySubject.keys()]
  const byDiscipline = new Map<Discipline, ContentSubject[]>()
  const unassigned: ContentSubject[] = []
  for (const s of subjects) {
    const auth = SUBJECT_AUTHORITY[s]
    if (!auth) { unassigned.push(s); continue }
    const list = byDiscipline.get(auth.certifiedBy) ?? []
    list.push(s)
    byDiscipline.set(auth.certifiedBy, list)
  }

  const rows: SheetResponsibility[] = [...byDiscipline.entries()].map(([discipline, certifies]) => {
    const def = DISCIPLINES[discipline]
    return {
      discipline,
      title: def.title,
      licence: def.licence,
      certifies,
      objectIds: certifies.flatMap(s => bySubject.get(s) ?? []),
      excludes: subjects.filter(s => !certifies.includes(s)),
      requiredForSubmission: certifies.some(s => SUBJECT_AUTHORITY[s].requiredForSubmission),
    }
  })

  rows.sort((a, b) => b.objectIds.length - a.objectIds.length)

  return {
    sheet: input.sheet,
    rows,
    unassigned,
    divisionNote:
      rows.length <= 1
        ? 'All content on this sheet falls within one professional scope.'
        : 'This sheet carries content from more than one professional discipline. Each seal below applies ' +
          'only to the subjects listed beside it. No professional certifies content outside their stated ' +
          'scope, and the sheet is not divided into separate drawings for that purpose.',
  }
}

/**
 * The platform never splits a sheet to separate seals. This function exists so
 * that the answer is explicit and testable rather than an omission.
 */
export function shouldSplitSheetForSeals(block: DividedResponsibilityBlock): {
  split: false
  reason: string
} {
  return {
    split: false,
    reason:
      block.rows.length > 1
        ? `${block.rows.length} disciplines have content on ${block.sheet}. Responsibility is divided in the ` +
          'title block by subject and by object. Duplicating the sheet would produce two drawings that can ' +
          'drift apart, which is a worse outcome than a divided title block.'
        : `${block.sheet} carries a single discipline's content; there is nothing to divide.`,
  }
}

export interface ScopedApproval {
  id: string
  discipline: Discipline
  subject: ContentSubject
  /** Sheets the subject appears on — informational; the approval is not per sheet. */
  appearsOn: SheetId[]
  objectIds: string[]
  decision: ReviewDecision
  decidedAt?: string
  decidedBy?: string
  licenceNumber?: string
  comment?: string
}

/**
 * Seeds approvals by subject across the whole package, so a professional signs
 * their content once rather than once per sheet it happens to appear on.
 */
export function seedScopedApprovals(input: {
  twin: SiteTwin
  sheetFeatures: { sheet: SheetId; features: SiteFeature[] }[]
  additionalSubjects?: { sheet: SheetId; subjects: ContentSubject[] }[]
}): ScopedApproval[] {
  const bySubject = new Map<ContentSubject, { sheets: Set<SheetId>; objects: Set<string> }>()
  const touch = (s: ContentSubject) => {
    let e = bySubject.get(s)
    if (!e) { e = { sheets: new Set(), objects: new Set() }; bySubject.set(s, e) }
    return e
  }

  for (const { sheet, features } of input.sheetFeatures) {
    for (const f of features) {
      const e = touch(subjectForFeature(f))
      e.sheets.add(sheet)
      e.objects.add(f.id)
    }
  }
  for (const { sheet, subjects } of input.additionalSubjects ?? []) {
    for (const s of subjects) touch(s).sheets.add(sheet)
  }

  let n = 0
  return [...bySubject.entries()].map(([subject, e]) => ({
    id: `apr-${++n}`,
    discipline: SUBJECT_AUTHORITY[subject].certifiedBy,
    subject,
    appearsOn: [...e.sheets].sort(),
    objectIds: [...e.objects],
    decision: 'PENDING' as ReviewDecision,
  }))
}

export interface ScopedReviewSummary {
  approvals: ScopedApproval[]
  byDiscipline: {
    discipline: Discipline
    title: string
    subjects: ContentSubject[]
    outstanding: number
    decision: ReviewDecision
  }[]
  blockingSubjects: ContentSubject[]
  submissionReady: boolean
  summary: string
}

export function summariseScopedReview(approvals: ScopedApproval[]): ScopedReviewSummary {
  const byDiscipline = new Map<Discipline, ScopedApproval[]>()
  for (const a of approvals) {
    const l = byDiscipline.get(a.discipline) ?? []
    l.push(a)
    byDiscipline.set(a.discipline, l)
  }

  const rollUp = (items: ScopedApproval[]): ReviewDecision => {
    if (items.length === 0) return 'PENDING'
    if (items.some(i => i.decision === 'REJECTED')) return 'REJECTED'
    if (items.some(i => i.decision === 'CHANGES_REQUESTED')) return 'CHANGES_REQUESTED'
    if (items.every(i => i.decision === 'APPROVED')) return 'APPROVED'
    return 'PENDING'
  }

  const rows = [...byDiscipline.entries()].map(([discipline, items]) => ({
    discipline,
    title: DISCIPLINES[discipline].title,
    subjects: items.map(i => i.subject),
    outstanding: items.filter(i => i.decision !== 'APPROVED').length,
    decision: rollUp(items),
  }))

  const blockingSubjects = approvals
    .filter(a => SUBJECT_AUTHORITY[a.subject].requiredForSubmission && a.decision !== 'APPROVED')
    .map(a => a.subject)

  return {
    approvals,
    byDiscipline: rows,
    blockingSubjects,
    submissionReady: blockingSubjects.length === 0,
    summary: blockingSubjects.length
      ? `${blockingSubjects.length} subject(s) still require certification: ` +
        blockingSubjects.map(s => SUBJECT_AUTHORITY[s].label).join('; ') + '.'
      : 'Every subject requiring certification has been signed within its own scope. ' +
        'Jurisdiction approval is separate and not implied.',
  }
}
