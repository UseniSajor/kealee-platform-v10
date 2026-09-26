/**
 * The AI site-plan generator, run as a production drafter and engineer would.
 *
 * The existing generator (self-perform/lot-package.ts) produces a SiteTwin.
 * This does not trust that twin as a finished drawing. It walks the plan
 * through the professional sequence — intake, jurisdiction, source inventory,
 * source quality, base map, existing conditions, zoning, buildable area,
 * programme, layout, access, utilities, grading, drainage, E&SC, environmental,
 * dimensions, calculations, rules, discipline QA, sheets, internal QA,
 * professional review, revision, approval, final document — and at each stage
 * it acts THROUGH THE SAME PATHS a person uses:
 *
 *   record data   → importRecords (as a survey or GIS import would)
 *   design        → ADD_OBJECT / CREATE_SETBACK / CREATE_BUILDABLE_AREA /
 *                   DIMENSION commands, validated and accepted into revisions
 *   calculations  → the registry
 *   rules         → evaluateRules
 *   QA            → productionChecklist, draftingIssues, readiness
 *
 * Every stage is recorded as COMPLETED, NOT_APPLICABLE, BLOCKED,
 * REQUIRES_PROFESSIONAL_REVIEW or REQUIRES_FIELD_VERIFICATION. A stage the
 * generator cannot honestly complete says so; it is never marked done because
 * the drawing looks finished.
 */

import type { SiteTwin } from '../site-plan/site-twin'
import { normaliseRing } from '../site-plan/buildable-envelope'
import {
  type StudioModel, type StudioObject, type ZoningContext, STUDIO_ENGINE_VERSION, SURVEYED_SOURCES, UTILITY_TYPES, ENVIRONMENTAL_TYPES,
} from './model'
import { twinToStudioObjects } from './twin-bridge'
import { importRecords } from './import'
import { type StudioCommand } from './commands'
import { propose, accept, type RevisionRecord } from './proposals'
import { runCalculation, type CalculationRecord } from './calculations'
import { evaluateRules, type RuleResult } from './rules'
import { productionChecklist, draftingIssues, readiness, type ProjectFacts, type SheetAudit, type Readiness, type ChecklistItem } from './qa'
import { segmentsOf } from './geometry'
import type { NewEvent } from './telemetry'

export const PRODUCTION_STAGES = [
  'PROJECT_INTAKE', 'JURISDICTION_IDENTIFICATION', 'SOURCE_DATA_INVENTORY', 'SOURCE_QUALITY_CLASSIFICATION',
  'BOUNDARY_BASE_MAP', 'EXISTING_CONDITIONS', 'ZONING_DEVELOPMENT_RULES', 'BUILDABLE_AREA', 'PROPOSED_PROGRAM',
  'INITIAL_LAYOUT', 'ACCESS_DRIVEWAY', 'UTILITY_COORDINATION', 'GRADING', 'DRAINAGE_SWM', 'EROSION_SEDIMENT_CONTROL',
  'FLOODPLAIN_ENVIRONMENTAL', 'DIMENSIONS_ANNOTATION', 'ENGINEERING_CALCULATIONS', 'RULE_VALIDATION', 'DISCIPLINE_QA',
  'SHEET_ASSEMBLY', 'INTERNAL_QA', 'PROFESSIONAL_REVIEW', 'REVISION', 'APPROVAL_FOR_ISSUANCE', 'FINAL_DOCUMENT',
] as const
export type ProductionStage = typeof PRODUCTION_STAGES[number]
export type StageStatus = 'COMPLETED' | 'NOT_APPLICABLE' | 'BLOCKED' | 'REQUIRES_PROFESSIONAL_REVIEW' | 'REQUIRES_FIELD_VERIFICATION'

export interface StageRecord { stage: ProductionStage; status: StageStatus; detail: string; revision: number | null }

export interface GeneratorInput {
  twin: SiteTwin
  zoning: ZoningContext | null
  /** Front/side/rear per edge of the NORMALISED (open, counter-clockwise) parcel ring, as buildable-envelope classified it. */
  edgeYards: ('front' | 'side' | 'rear')[] | null
  facts: ProjectFacts
  sheets: SheetAudit | null
  design?: StudioModel['design']
  ids: { organizationId: string; workspaceId: string; projectId: string }
  newId: () => string
  now: string
}

export interface GeneratorResult {
  model: StudioModel
  revisions: RevisionRecord[]
  stages: StageRecord[]
  calculations: CalculationRecord[]
  rules: RuleResult[]
  checklist: ChecklistItem[]
  readiness: Readiness
  events: NewEvent[]
  /** One line per stage that needs a person — the professional's worklist. */
  worklist: string[]
}

const ACTOR = 'kealee-generator'

export function runProductionWorkflow(input: GeneratorInput): GeneratorResult {
  const stages: StageRecord[] = []
  const revisions: RevisionRecord[] = []
  const events: NewEvent[] = []
  const { ids, now } = input
  let model: StudioModel = {
    ...ids, revision: 0, revisionId: `${ids.projectId}-r0`, crs: input.twin.crs, verticalDatum: input.twin.verticalDatum,
    units: 'US_SURVEY_FT', zoning: input.zoning, design: input.design, objects: [],
  }
  const stage = (s: ProductionStage, status: StageStatus, detail: string) => {
    stages.push({ stage: s, status, detail, revision: model.revision })
    events.push(ev('GENERATOR_STAGE', { stage: s, status, detail }))
  }
  const ev = (eventType: NewEvent['eventType'], detail: unknown, extra: Partial<NewEvent> = {}): NewEvent => ({
    id: input.newId(), organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId: ids.projectId,
    eventType, userId: ACTOR, role: null, actorType: 'system', mode: null, origin: 'GENERATOR', prompt: null, selectedObjectIds: [],
    aiInterpretation: null, proposedCommands: null, validationResults: null, decision: null, manualEdits: null,
    resultingRevision: model.revision, proposalId: null, rulesVersion: input.zoning?.ruleVersion ?? null, durationMs: null, detail, ...extra, occurredAt: now,
  })
  /** Design goes through propose → accept like anyone's. */
  const apply = (commands: StudioCommand[], label: string): boolean => {
    if (!commands.length) return true
    const p = propose(model, commands, { proposalId: input.newId(), newId: input.newId, now, actorId: ACTOR })
    events.push(ev('PROPOSAL_CREATED', { label }, { proposalId: p.id, proposedCommands: commands, validationResults: p.preview?.rules ?? p.errors }))
    if (p.status !== 'PROPOSED') return false
    const r = accept(model, p, { newId: input.newId, now, actorId: ACTOR, revisionId: `${ids.projectId}-r${model.revision + 1}` })
    if (!r.ok) return false
    model = r.model; revisions.push(r.revision)
    // Accepted by the generator into the DRAFT — not a professional acceptance.
    events.push(ev('PROPOSAL_ACCEPTED', { label, acceptedAs: 'generator draft' }, { proposalId: p.id, decision: 'ACCEPTED', resultingRevision: model.revision }))
    return true
  }
  const base = { requestedBy: ACTOR, origin: 'GENERATOR' as const, units: 'ft' as const }

  // 1–4 Intake, jurisdiction, source inventory, source quality.
  stage('PROJECT_INTAKE', input.facts.address ? 'COMPLETED' : 'BLOCKED', input.facts.address ?? 'no address')
  stage('JURISDICTION_IDENTIFICATION', input.zoning?.jurisdictionCode ? 'COMPLETED' : 'BLOCKED', input.zoning?.jurisdictionCode ?? 'jurisdiction not determined')
  stage('SOURCE_DATA_INVENTORY', input.twin.sources.length ? 'COMPLETED' : 'BLOCKED', `${input.twin.sources.length} sources: ${input.twin.sources.map(s => s.dataset).join('; ')}`)
  const lvl = input.twin.sources.map(s => s.reliabilityLevel)
  stage('SOURCE_QUALITY_CLASSIFICATION', 'COMPLETED', `reliability levels ${[...new Set(lvl)].sort().join(', ') || 'none'} (2 = professional record, 1 = GIS/LiDAR, 0 = unverified)`)

  // 5–6 Base map and existing conditions: IMPORTED, as a survey or GIS import would be.
  const all = twinToStudioObjects(input.twin, { ...ids, actorId: ACTOR, revisionId: `${ids.projectId}-r1`, now })
  const records = all.filter(o => o.status !== 'PROPOSED' && o.type !== 'Setback' && o.type !== 'BuildableArea')
  for (const o of records.filter(o => o.type === 'ParcelBoundary' && o.geometry.type === 'Polygon')) {
    const ring = normaliseRing({ coordinates: o.geometry.type === 'Polygon' ? o.geometry.coordinates[0] as any : [] })
    o.geometry = { type: 'Polygon', coordinates: [[...ring, ring[0]] as any] }
  }
  const surveyRef = input.twin.sources.find(s => s.reliabilityLevel === 2)?.dataset ?? null
  const imp = importRecords(model, { objects: records, importedBy: ACTOR, capabilities: { importSurvey: records.some(o => SURVEYED_SOURCES.has(o.source)), importSourceData: true }, documentRef: surveyRef ?? 'jurisdiction GIS', revisionId: `${ids.projectId}-r1`, now })
  if (!imp.ok) { stage('BOUNDARY_BASE_MAP', 'BLOCKED', imp.reason) } else {
    model = imp.model; revisions.push(imp.revision)
    events.push(ev('IMPORT', { count: records.length, discrepancies: imp.discrepancies }))
    const lot = model.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')
    stage('BOUNDARY_BASE_MAP', !lot ? 'BLOCKED' : SURVEYED_SOURCES.has(lot.source) ? 'COMPLETED' : 'REQUIRES_FIELD_VERIFICATION',
      !lot ? 'no parcel boundary' : `${lot.source.replace(/_/g, ' ').toLowerCase()}${SURVEYED_SOURCES.has(lot.source) ? '' : ' — not a survey; a boundary survey or recorded plat governs'}`)
    const existing = model.objects.filter(o => o.status === 'EXISTING')
    const gisOnly = existing.filter(o => !SURVEYED_SOURCES.has(o.source))
    stage('EXISTING_CONDITIONS', !existing.length ? 'BLOCKED' : gisOnly.length ? 'REQUIRES_FIELD_VERIFICATION' : 'COMPLETED', `${existing.length} existing features; ${gisOnly.length} from GIS/LiDAR, not field verified`)
  }

  // 7 Zoning.
  const z = input.zoning
  if (!z || [z.frontFt, z.sideFt, z.rearFt].some(v => v == null)) stage('ZONING_DEVELOPMENT_RULES', 'BLOCKED', z ? 'setbacks not determined for this zone' : 'no zoning resolved')
  else stage('ZONING_DEVELOPMENT_RULES', z.certification === 'CERTIFIED' ? 'COMPLETED' : 'REQUIRES_PROFESSIONAL_REVIEW', `${z.zone}: ${z.frontFt}/${z.sideFt}/${z.rearFt} ft, coverage ${z.coveragePct ?? '—'}% — ${z.citation ?? ''} [${z.certification}]`)

  // 8 Buildable area — the same commands a drafter runs.
  const lot = model.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')
  if (lot && input.edgeYards && input.edgeYards.length === segmentsOf(lot.geometry).length) {
    apply([{ ...base, action: 'SET_PROPERTY', objectIds: [lot.id], key: 'edgeYards', value: input.edgeYards }], 'classify lot lines')
  }
  const envOk = z && lot && Array.isArray(model.objects.find(o => o.id === lot.id)?.attributes.edgeYards)
    && apply([{ ...base, action: 'CREATE_SETBACK' }, { ...base, action: 'CREATE_BUILDABLE_AREA' }], 'setbacks and buildable area')
  stage('BUILDABLE_AREA', envOk ? (z!.certification === 'CERTIFIED' ? 'COMPLETED' : 'REQUIRES_PROFESSIONAL_REVIEW') : 'BLOCKED', envOk ? 'setback lines and buildable area from the governing requirements' : 'lot lines unclassified or no requirements')

  // 9–10 Programme and layout: the generator's design, added as proposed objects.
  const design = all.filter(o => o.status === 'PROPOSED' && o.type !== 'Setback' && o.type !== 'BuildableArea')
  const add = (types: string[], label: string) => apply(design.filter(o => types.includes(o.type)).map(o => ({ ...base, action: 'ADD_OBJECT' as const, object: { type: o.type, geometry: o.geometry, attributes: o.attributes, status: 'PROPOSED' as const, source: 'PROPOSED_DESIGN' as const } })), label)
  stage('PROPOSED_PROGRAM', input.facts.programme.use ? 'COMPLETED' : 'REQUIRES_PROFESSIONAL_REVIEW', input.facts.programme.use ?? 'use not stated — estimated programme')
  const houseOk = add(['BuildingFootprint', 'Structure'], 'layout')
  const house = model.objects.find(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')
  stage('INITIAL_LAYOUT', house && houseOk ? 'COMPLETED' : 'BLOCKED', house ? 'proposed footprint placed against the front building line' : 'no footprint')
  add(['Driveway', 'Parking', 'Sidewalk'], 'access')
  stage('ACCESS_DRIVEWAY', model.objects.some(o => o.type === 'Driveway' && o.status === 'PROPOSED') ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'BLOCKED', 'driveway apron and entrance permit are the jurisdiction\'s — confirm with the road authority')
  add([...UTILITY_TYPES].filter(t => t !== 'Pipe' && t !== 'Culvert'), 'utilities')
  const utilExisting = model.objects.filter(o => UTILITY_TYPES.has(o.type) && o.status === 'EXISTING')
  stage('UTILITY_COORDINATION', utilExisting.length ? 'REQUIRES_FIELD_VERIFICATION' : 'REQUIRES_PROFESSIONAL_REVIEW', utilExisting.length ? `${utilExisting.length} existing utilities from GIS — Miss Utility locate and utility-owner connection approval required` : 'no existing utility mapping — connection points unconfirmed')
  add(['GradingPad', 'Contour', 'SpotElevation', 'SlopeArrow', 'RetainingWall'], 'grading')
  const graded = model.objects.some(o => ['GradingPad', 'SlopeArrow'].includes(o.type) || (o.type === 'Contour' && o.status === 'PROPOSED'))
  stage('GRADING', graded ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'BLOCKED', graded ? 'grading drafted from LiDAR/GIS terrain — engineer of record reviews' : 'no grading design')
  add(['Swale', 'Ditch', 'Pipe', 'Culvert', 'Inlet', 'Manhole', 'Outfall', 'StormwaterFacility', 'BMP'], 'drainage')
  const drains = model.objects.some(o => ['StormwaterFacility', 'BMP', 'Pipe', 'Swale'].includes(o.type) && o.status === 'PROPOSED')
  stage('DRAINAGE_SWM', drains ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'BLOCKED', drains ? 'drainage and SWM drafted; sizing is sealed engineering' : 'no drainage design')
  const esc = all.some(o => /silt|sediment|entrance|disturbance/i.test(String(o.attributes.type ?? o.attributes.label ?? '')))
  add(['Annotation'], 'erosion and sediment control')
  stage('EROSION_SEDIMENT_CONTROL', esc ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'BLOCKED', esc ? 'LOD and controls drafted' : 'no erosion and sediment controls')
  const env = model.objects.filter(o => ENVIRONMENTAL_TYPES.has(o.type))
  stage('FLOODPLAIN_ENVIRONMENTAL', env.length ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'COMPLETED', env.length ? `${env.length} environmental feature(s) mapped from GIS` : 'no mapped floodplain, wetland or buffer on the lot (GIS screen)')

  // 17 Dimensions — the drafter's convention: the house to every lot line.
  if (house && lot) apply(segmentsOf(lot.geometry).map((_, i) => ({ ...base, action: 'DIMENSION' as const, fromObjectId: house.id, toObjectId: lot.id, toEdgeIndex: i })), 'dimensions')
  const dims = model.objects.filter(o => o.type === 'Dimension').length
  stage('DIMENSIONS_ANNOTATION', dims ? 'COMPLETED' : house ? 'BLOCKED' : 'NOT_APPLICABLE', `${dims} dimension(s)`)

  // 18 Calculations.
  const calcs: CalculationRecord[] = []
  const calc = (id: string, inputs: Record<string, unknown> = {}) => {
    const r = runCalculation(id, inputs, { actor: { type: 'system', id: ACTOR }, model, now: () => now })
    calcs.push(r); events.push(ev('CALCULATION', { calcId: id, status: r.status, message: r.message }))
    return r
  }
  const c = calc('runoff_coefficient')
  const i = model.design?.rainfallIntensityInPerHr
  if (i != null && c.status === 'INFO') calc('rational_method', { runoffCoefficient: c.outputs.compositeC, intensityInPerHr: i, areaAcres: c.outputs.totalAreaAcres })
  calc('lot_coverage'); calc('impervious_area'); calc('setback_clearance'); calc('utility_clearance')
  for (const d of model.objects.filter(o => o.type === 'Driveway' && o.status === 'PROPOSED' && o.attributes.centerline)) calc('driveway_grade', { drivewayId: d.id, maxGradePct: model.design?.maxDrivewayGradePct ?? 15 })
  for (const p of model.objects.filter(o => o.type === 'Pipe' && o.status === 'PROPOSED' && o.attributes.diameterIn)) calc('pipe_capacity', { diameterIn: p.attributes.diameterIn, slopeFtPerFt: p.attributes.slopeFtPerFt, manningN: p.attributes.manningN ?? 0.013, designFlowCfs: p.attributes.designFlowCfs ?? undefined })
  const calcFail = calcs.filter(x => x.status === 'FAIL').length, calcMissing = calcs.filter(x => x.status === 'REQUIRES_INPUT').length
  stage('ENGINEERING_CALCULATIONS', calcFail ? 'BLOCKED' : 'REQUIRES_PROFESSIONAL_REVIEW', `${calcs.length} calculations; ${calcFail} failing; ${calcMissing} awaiting input${i == null ? ' (no design rainfall intensity)' : ''}`)

  // 19 Rules.
  const rules = evaluateRules(model)
  const ruleFail = rules.filter(r => r.status === 'FAIL' || r.status === 'BLOCKED').length
  events.push(ev('CHECK', { failing: ruleFail, errors: rules.filter(r => r.severity === 'ERROR').length }))
  stage('RULE_VALIDATION', ruleFail ? 'BLOCKED' : rules.some(r => r.status === 'REQUIRES_REVIEW') ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'COMPLETED', `${rules.length} checks; ${ruleFail} failing; ${rules.filter(r => r.status === 'REQUIRES_REVIEW').length} need review`)

  // 20–22 QA.
  const issues = draftingIssues(model, input.sheets)
  stage('DISCIPLINE_QA', 'REQUIRES_PROFESSIONAL_REVIEW', 'each discipline\'s subjects are routed to its licensed reviewer')
  stage('SHEET_ASSEMBLY', input.sheets?.sheets.length ? 'COMPLETED' : 'BLOCKED', input.sheets ? `${input.sheets.sheets.length} sheet(s)` : 'no sheets rendered')
  const checklist = productionChecklist(model, rules, calcs, input.facts, input.sheets)
  const missing = checklist.filter(x => x.status === 'MISSING')
  stage('INTERNAL_QA', missing.length || issues.some(x => x.kind === 'BROKEN_GEOMETRY') ? 'BLOCKED' : 'REQUIRES_PROFESSIONAL_REVIEW', `${missing.length} checklist item(s) missing; ${issues.length} drafting issue(s)`)

  // 23–26 The professional stages are never the generator's to complete.
  stage('PROFESSIONAL_REVIEW', 'REQUIRES_PROFESSIONAL_REVIEW', 'awaiting the licensed professional of record')
  stage('REVISION', 'NOT_APPLICABLE', 'no review comments yet')
  stage('APPROVAL_FOR_ISSUANCE', 'BLOCKED', 'only a licensed professional approves for issuance')
  stage('FINAL_DOCUMENT', 'BLOCKED', 'no final document without professional approval and execution')

  const rd = readiness(model, 'DRAFTING', checklist, rules, calcs, 'NONE', true)
  const worklist = stages.filter(s => s.status !== 'COMPLETED' && s.status !== 'NOT_APPLICABLE').map(s => `${s.stage.replace(/_/g, ' ')}: ${s.status.replace(/_/g, ' ')} — ${s.detail}`)
  return { model, revisions, stages, calculations: calcs, rules, checklist, readiness: rd, events, worklist }
}

export { STUDIO_ENGINE_VERSION }
export type { StudioObject }
