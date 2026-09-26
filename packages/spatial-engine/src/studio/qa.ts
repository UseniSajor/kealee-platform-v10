/**
 * Production QA — the checklist a competent drafter and engineer work through,
 * executable, run on EVERY plan whoever or whatever drew it.
 *
 * A PDF rendering successfully proves the renderer ran. It says nothing about
 * whether the plan is complete, and nothing here treats it as if it did: each
 * item is established from the model, the rule results, the calculations and
 * the sheet audit, and an item that needs a person says so.
 */

import {
  type StudioModel, type StudioObject, type StudioObjectType, DEFAULT_LAYER, SURVEYED_SOURCES, SOURCE_RELIABILITY,
  UTILITY_TYPES, ENVIRONMENTAL_TYPES, verticesOf,
} from './model'
import type { RuleResult } from './rules'
import type { CalculationRecord } from './calculations'
import { segmentsOf, isValidGeometry, centroid } from './geometry'
import type { ProjectState } from './access'
import { honestLabel } from './access'

export type ItemStatus = 'COMPLETE' | 'MISSING' | 'NOT_APPLICABLE' | 'REQUIRES_INPUT' | 'REQUIRES_FIELD_VERIFICATION' | 'REQUIRES_PROFESSIONAL_REVIEW'

export interface ChecklistItem { key: string; section: string; label: string; status: ItemStatus; detail: string; objectIds: string[] }

export interface SheetAudit {
  sheets: { id: string; title: string; hasTitleBlock: boolean; hasNorthArrow: boolean; hasScale: boolean; hasLegend: boolean; hasNotes: boolean; hasRevisionBlock: boolean; scaleLabel: string | null; references: string[] }[]
  /** Labels the renderer could not place clear of other content. */
  overprints: number
  droppedLabels: number
}

export interface ProjectFacts {
  address: string | null
  parcelId: string | null
  owner: string | null
  projectName: string | null
  horizontalDatum: string | null
  sourceDocuments: string[]
  programme: { use: string | null; bedrooms?: number | null }
  wantsParking: boolean
  landscapingRequired: boolean | null
}

const live = (o: StudioObject) => o.status !== 'SUPERSEDED'
const has = (m: StudioModel, ...types: StudioObjectType[]) => m.objects.filter(o => live(o) && types.includes(o.type))

function item(section: string, key: string, label: string, status: ItemStatus, detail: string, objectIds: string[] = []): ChecklistItem {
  return { section, key, label, status, detail, objectIds }
}

/** Existence check with provenance: present from a survey/plat is COMPLETE; from GIS is REQUIRES_FIELD_VERIFICATION. */
function presence(section: string, key: string, label: string, objs: StudioObject[], opts: { optional?: boolean; fieldVerify?: boolean } = {}): ChecklistItem {
  if (!objs.length) return item(section, key, label, opts.optional ? 'NOT_APPLICABLE' : 'MISSING', opts.optional ? 'none shown — confirm none exist' : 'not in the model', [])
  const unverified = objs.filter(o => o.status !== 'PROPOSED' && !SURVEYED_SOURCES.has(o.source))
  if (opts.fieldVerify !== false && unverified.length) {
    return item(section, key, label, 'REQUIRES_FIELD_VERIFICATION', `${objs.length} shown; ${unverified.length} from ${[...new Set(unverified.map(o => o.source))].join(', ').replace(/_/g, ' ').toLowerCase()} — not field verified`, objs.map(o => o.id))
  }
  return item(section, key, label, 'COMPLETE', `${objs.length} shown`, objs.map(o => o.id))
}

export function productionChecklist(m: StudioModel, rules: RuleResult[], calcs: CalculationRecord[], facts: ProjectFacts, sheets: SheetAudit | null): ChecklistItem[] {
  const out: ChecklistItem[] = []
  const B = 'BASE INFORMATION', E = 'EXISTING CONDITIONS', Z = 'ZONING / LAND USE', P = 'PROPOSED SITE', G = 'ENGINEERING', D = 'DRAFTING QA', F = 'FINAL QA'
  const lot = has(m, 'ParcelBoundary')[0]
  const z = m.zoning

  out.push(item(B, 'jurisdiction', 'Jurisdiction identified', z?.jurisdictionCode ? 'COMPLETE' : 'MISSING', z?.jurisdictionCode ?? 'no jurisdiction on the project'))
  out.push(item(B, 'parcel', 'Parcel identified', facts.parcelId || lot?.attributes.parcelId ? 'COMPLETE' : 'MISSING', String(facts.parcelId ?? lot?.attributes.parcelId ?? 'no parcel id')))
  out.push(item(B, 'crs', 'Coordinate system identified', m.crs ? 'COMPLETE' : 'MISSING', m.crs || 'none'))
  out.push(item(B, 'units', 'Drawing units confirmed', m.units === 'US_SURVEY_FT' ? 'COMPLETE' : 'MISSING', 'US survey feet'))
  out.push(item(B, 'hdatum', 'Horizontal datum known', facts.horizontalDatum ? 'COMPLETE' : 'REQUIRES_INPUT', facts.horizontalDatum ?? 'not stated'))
  out.push(item(B, 'vdatum', 'Vertical datum known', m.verticalDatum ? 'COMPLETE' : has(m, 'Contour', 'SpotElevation').length ? 'REQUIRES_INPUT' : 'NOT_APPLICABLE', m.verticalDatum ?? 'not stated'))
  out.push(item(B, 'documents', 'Source documents catalogued', facts.sourceDocuments.length ? 'COMPLETE' : 'MISSING', facts.sourceDocuments.join('; ') || 'none'))
  out.push(item(B, 'geometry', 'Property geometry loaded', lot ? 'COMPLETE' : 'MISSING', lot ? `${lot.source.replace(/_/g, ' ').toLowerCase()}` : 'no parcel boundary', lot ? [lot.id] : []))
  const unclassified = m.objects.filter(o => live(o) && !o.source)
  out.push(item(B, 'reliability', 'Source reliability classified', unclassified.length ? 'MISSING' : 'COMPLETE', unclassified.length ? `${unclassified.length} objects without provenance` : 'every object carries provenance'))

  out.push(lot ? item(E, 'boundary', 'Property boundary', SURVEYED_SOURCES.has(lot.source) ? 'COMPLETE' : 'REQUIRES_FIELD_VERIFICATION', SURVEYED_SOURCES.has(lot.source) ? lot.source : `${lot.source.replace(/_/g, ' ').toLowerCase()} — a boundary survey or recorded plat governs`, [lot.id]) : item(E, 'boundary', 'Property boundary', 'MISSING', ''))
  const bd = lot?.attributes.bearings as unknown[] | undefined
  out.push(item(E, 'bearings', 'Bearings and distances', bd?.length ? 'COMPLETE' : lot ? 'REQUIRES_FIELD_VERIFICATION' : 'MISSING', bd?.length ? `${bd.length} courses` : 'computed from GIS geometry, not record courses'))
  out.push(item(E, 'adjacent', 'Adjacent parcels', has(m, 'Lot').length ? 'COMPLETE' : 'REQUIRES_INPUT', `${has(m, 'Lot').length} shown`))
  out.push(presence(E, 'row', 'Right-of-way', has(m, 'RightOfWay')))
  out.push(presence(E, 'roads', 'Roads', has(m, 'Road')))
  out.push(presence(E, 'curb', 'Curb and gutter', has(m, 'Curb', 'Gutter'), { optional: true }))
  out.push(presence(E, 'sidewalks', 'Sidewalks', has(m, 'Sidewalk').filter(o => o.status !== 'PROPOSED'), { optional: true }))
  out.push(presence(E, 'structures', 'Existing structures', has(m, 'BuildingFootprint', 'Structure').filter(o => o.status !== 'PROPOSED'), { optional: true }))
  out.push(presence(E, 'driveways', 'Existing driveways', has(m, 'Driveway').filter(o => o.status !== 'PROPOSED'), { optional: true }))
  out.push(presence(E, 'utilities', 'Existing utilities', m.objects.filter(o => live(o) && UTILITY_TYPES.has(o.type) && o.status !== 'PROPOSED')))
  out.push(presence(E, 'easements', 'Easements', has(m, 'Easement'), { optional: true }))
  out.push(presence(E, 'contours', 'Existing contours', has(m, 'Contour').filter(o => o.status !== 'PROPOSED')))
  out.push(presence(E, 'spots', 'Spot elevations', has(m, 'SpotElevation').filter(o => o.status !== 'PROPOSED'), { optional: true }))
  out.push(presence(E, 'drainage', 'Existing drainage features', has(m, 'Swale', 'Ditch', 'Inlet', 'Manhole', 'Outfall', 'Culvert').filter(o => o.status !== 'PROPOSED'), { optional: true }))
  out.push(presence(E, 'environmental', 'Environmental constraints', m.objects.filter(o => live(o) && ENVIRONMENTAL_TYPES.has(o.type)), { optional: true }))

  const req = (k: string) => z?.requirements?.find(r => r.key === k)
  const zoneStatus = (v: number | null | undefined, k: string): ItemStatus => v == null ? 'REQUIRES_INPUT' : (req(k)?.outcome ?? (z?.certification === 'CERTIFIED' ? 'APPLIED_CERTIFIED' : 'REVIEW_REQUIRED')) === 'APPLIED_CERTIFIED' ? 'COMPLETE' : 'REQUIRES_PROFESSIONAL_REVIEW'
  out.push(item(Z, 'zoning', 'Zoning', z?.zone ? 'COMPLETE' : 'MISSING', z?.zone ?? 'no zone'))
  out.push(item(Z, 'use', 'Use', facts.programme.use ? 'COMPLETE' : 'REQUIRES_INPUT', facts.programme.use ?? 'not stated'))
  out.push(item(Z, 'lotarea', 'Lot area', lot ? 'COMPLETE' : 'MISSING', lot ? `${Math.round(Number(lot.attributes.areaSqFt ?? 0)) || 'computed'} sf` : ''))
  out.push(item(Z, 'lotwidth', 'Lot width', lot?.attributes.lotWidthFt != null ? 'COMPLETE' : 'REQUIRES_INPUT', lot?.attributes.lotWidthFt != null ? `${lot.attributes.lotWidthFt} ft` : 'not measured'))
  const fronts = ((lot?.attributes.edgeYards as string[] | undefined) ?? []).filter(y => y === 'front').length
  out.push(item(Z, 'frontage', 'Frontage', fronts ? 'COMPLETE' : 'MISSING', fronts ? `${fronts} front line(s) classified` : 'front lot line not established'))
  out.push(item(Z, 'setbacks', 'Setbacks', zoneStatus(z?.frontFt, 'front') === 'COMPLETE' && zoneStatus(z?.sideFt, 'side') === 'COMPLETE' && zoneStatus(z?.rearFt, 'rear') === 'COMPLETE' ? 'COMPLETE' : [z?.frontFt, z?.sideFt, z?.rearFt].some(v => v == null) ? 'REQUIRES_INPUT' : 'REQUIRES_PROFESSIONAL_REVIEW', z ? `${z.frontFt ?? '?'} / ${z.sideFt ?? '?'} / ${z.rearFt ?? '?'} ft — ${z.citation ?? 'no citation'}` : 'no zoning'))
  out.push(item(Z, 'coverage', 'Lot coverage', zoneStatus(z?.coveragePct, 'coverage'), z?.coveragePct != null ? `${z.coveragePct}% max` : 'no limit determined'))
  out.push(item(Z, 'height', 'Building height', zoneStatus(z?.heightFt, 'height'), z?.heightFt != null ? `${z.heightFt} ft max` : 'no limit determined'))
  out.push(item(Z, 'parking', 'Parking', facts.wantsParking ? (has(m, 'Parking', 'Driveway').some(o => o.status === 'PROPOSED') ? 'COMPLETE' : 'MISSING') : 'NOT_APPLICABLE', ''))
  out.push(presence(Z, 'buffers', 'Buffers', has(m, 'Buffer'), { optional: true, fieldVerify: false }))
  out.push(item(Z, 'overlays', 'Overlays', 'REQUIRES_PROFESSIONAL_REVIEW', 'overlay applicability is confirmed by the reviewer'))
  out.push(presence(Z, 'critical', 'Critical areas', has(m, 'CriticalArea'), { optional: true }))
  out.push(presence(Z, 'floodplain', 'Floodplain', has(m, 'Floodplain', 'Floodway'), { optional: true }))

  const bad = (code: string) => rules.filter(r => r.code.startsWith(code) && (r.status === 'FAIL' || r.status === 'BLOCKED') && !r.override)
  const proposedHouse = has(m, 'BuildingFootprint').filter(o => o.status === 'PROPOSED')
  out.push(presence(P, 'structure', 'Structure placement', proposedHouse, { fieldVerify: false }))
  const sb = bad('SETBACK')
  out.push(item(P, 'setbacksVerified', 'Setbacks verified', !proposedHouse.length ? 'NOT_APPLICABLE' : sb.length ? 'MISSING' : rules.some(r => r.code.startsWith('SETBACK') && r.status === 'REQUIRES_REVIEW') ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'COMPLETE', sb.map(r => r.result).join('; ') || 'all yards met', sb.flatMap(r => r.objectIds)))
  out.push(presence(P, 'driveway', 'Driveway', has(m, 'Driveway').filter(o => o.status === 'PROPOSED'), { fieldVerify: false }))
  out.push(presence(P, 'parkingP', 'Parking', has(m, 'Parking').filter(o => o.status === 'PROPOSED'), { optional: true, fieldVerify: false }))
  out.push(presence(P, 'walk', 'Pedestrian access', has(m, 'Sidewalk').filter(o => o.status === 'PROPOSED'), { optional: true, fieldVerify: false }))
  out.push(presence(P, 'utilitiesP', 'Proposed utilities', m.objects.filter(o => live(o) && UTILITY_TYPES.has(o.type) && o.status === 'PROPOSED'), { fieldVerify: false }))
  out.push(presence(P, 'grading', 'Grading', has(m, 'GradingPad', 'SlopeArrow').concat(has(m, 'Contour', 'SpotElevation').filter(o => o.status === 'PROPOSED')), { fieldVerify: false }))
  out.push(presence(P, 'drainageP', 'Drainage', has(m, 'Swale', 'Pipe', 'Inlet', 'Outfall', 'Ditch').filter(o => o.status === 'PROPOSED'), { fieldVerify: false }))
  out.push(presence(P, 'swm', 'Stormwater management', has(m, 'StormwaterFacility', 'BMP'), { fieldVerify: false }))
  out.push(item(P, 'esc', 'Erosion and sediment control', m.objects.some(o => live(o) && /silt|sediment|lod|construction entrance/i.test(String(o.attributes.type ?? o.attributes.label ?? ''))) ? 'COMPLETE' : 'MISSING', ''))
  out.push(presence(P, 'walls', 'Retaining walls', has(m, 'RetainingWall'), { optional: true, fieldVerify: false }))
  out.push(item(P, 'landscape', 'Landscaping where required', facts.landscapingRequired === false ? 'NOT_APPLICABLE' : facts.landscapingRequired ? (has(m, 'Tree').some(o => o.status === 'PROPOSED') ? 'COMPLETE' : 'MISSING') : 'REQUIRES_PROFESSIONAL_REVIEW', ''))

  const calc = (id: string) => calcs.filter(c => c.calcId === id)
  const calcItem = (key: string, label: string, ids: string[], applies: boolean) => {
    if (!applies) return item(G, key, label, 'NOT_APPLICABLE', '')
    const rs = ids.flatMap(calc)
    if (!rs.length) return item(G, key, label, 'MISSING', 'not calculated')
    const failing = rs.filter(r => r.status === 'FAIL'), missing = rs.filter(r => r.status === 'REQUIRES_INPUT' || r.status === 'UNSUPPORTED')
    return item(G, key, label, failing.length ? 'MISSING' : missing.length ? 'REQUIRES_INPUT' : 'REQUIRES_PROFESSIONAL_REVIEW', failing.map(r => r.message).concat(missing.map(r => r.message)).join('; ') || `${rs.length} calculation(s) — review by the engineer of record`)
  }
  const hasDrainage = has(m, 'Pipe', 'Inlet', 'Swale', 'StormwaterFacility', 'BMP').some(o => o.status === 'PROPOSED')
  out.push(calcItem('drainageCalc', 'Drainage calculations', ['rational_method', 'runoff_coefficient', 'time_of_concentration'], true))
  out.push(calcItem('gradingChecks', 'Grading checks', ['cut_fill', 'slope', 'driveway_grade'], has(m, 'GradingPad', 'Driveway').some(o => o.status === 'PROPOSED')))
  const uc = bad('UTILITY_SEPARATION')
  out.push(item(G, 'utilityConflicts', 'Utility conflicts', uc.length ? 'MISSING' : 'COMPLETE', uc.map(r => r.result).join('; ') || 'no separation conflicts', uc.flatMap(r => r.objectIds)))
  const dg = bad('DRIVEWAY_GRADE')
  out.push(item(G, 'slopes', 'Slopes', dg.length ? 'MISSING' : 'COMPLETE', dg.map(r => r.result).join('; ') || 'within limits'))
  out.push(calcItem('earthwork', 'Earthwork', ['cut_fill'], has(m, 'GradingPad').length > 0))
  out.push(calcItem('pipes', 'Pipe / inlet / culvert calculations', ['pipe_capacity', 'inlet_capacity', 'culvert_capacity', 'hydraulic_grade_line'], has(m, 'Pipe', 'Inlet', 'Culvert').some(o => o.status === 'PROPOSED')))
  out.push(item(G, 'floodCheck', 'Floodplain checks', has(m, 'Floodplain', 'Floodway').length ? (bad('ENVIRONMENTAL').length ? 'MISSING' : 'REQUIRES_PROFESSIONAL_REVIEW') : 'NOT_APPLICABLE', ''))
  out.push(calcItem('swmCalc', 'SWM calculations', ['rational_method'], hasDrainage))

  // Drafting QA.
  const s0 = sheets?.sheets ?? []
  const all = (f: (s: SheetAudit['sheets'][number]) => boolean) => s0.length ? (s0.every(f) ? 'COMPLETE' : 'MISSING') : 'REQUIRES_INPUT' as ItemStatus
  out.push(item(D, 'titleBlock', 'Title block', all(s => s.hasTitleBlock), s0.length ? '' : 'no sheets rendered'))
  out.push(item(D, 'projectName', 'Project name', facts.projectName ? 'COMPLETE' : 'MISSING', facts.projectName ?? ''))
  out.push(item(D, 'address', 'Address', facts.address ? 'COMPLETE' : 'MISSING', facts.address ?? ''))
  out.push(item(D, 'parcelD', 'Parcel', facts.parcelId ? 'COMPLETE' : 'MISSING', facts.parcelId ?? ''))
  out.push(item(D, 'owner', 'Owner', facts.owner ? 'COMPLETE' : 'REQUIRES_INPUT', facts.owner ?? 'owner of record not stated'))
  out.push(item(D, 'scale', 'Scale', all(s => s.hasScale), ''))
  out.push(item(D, 'north', 'North arrow', all(s => s.hasNorthArrow), ''))
  out.push(item(D, 'legend', 'Legend', all(s => s.hasLegend), ''))
  out.push(item(D, 'notes', 'Notes', all(s => s.hasNotes), ''))
  const dq = draftingIssues(m, sheets)
  const kind = (k: DraftingIssue['kind']) => dq.filter(i => i.kind === k)
  out.push(item(D, 'dimensions', 'Dimensions', kind('MISSING_DIMENSION').length ? 'MISSING' : 'COMPLETE', kind('MISSING_DIMENSION').map(i => i.detail).join('; '), kind('MISSING_DIMENSION').flatMap(i => i.objectIds)))
  out.push(item(D, 'labels', 'Labels', kind('OVERLAPPING_LABELS').length + kind('DUPLICATE_LABEL').length + kind('ILLEGIBLE_ANNOTATION').length ? 'MISSING' : 'COMPLETE', [...kind('OVERLAPPING_LABELS'), ...kind('DUPLICATE_LABEL'), ...kind('ILLEGIBLE_ANNOTATION')].map(i => i.detail).join('; ')))
  out.push(item(D, 'linework', 'Linework and layers', kind('WRONG_LAYER').length + kind('BROKEN_GEOMETRY').length ? 'MISSING' : 'COMPLETE', [...kind('WRONG_LAYER'), ...kind('BROKEN_GEOMETRY')].map(i => i.detail).join('; ')))
  out.push(item(D, 'sheetRefs', 'Sheet references', kind('MISSING_REFERENCE').length ? 'MISSING' : s0.length ? 'COMPLETE' : 'REQUIRES_INPUT', kind('MISSING_REFERENCE').map(i => i.detail).join('; ')))
  out.push(item(D, 'revisionInfo', 'Revision information', all(s => s.hasRevisionBlock), `revision ${m.revision}`))

  const errors = rules.filter(r => r.severity === 'ERROR' && !r.override)
  const warnings = rules.filter(r => r.severity === 'WARNING' && !r.override)
  const fieldV = out.filter(i => i.status === 'REQUIRES_FIELD_VERIFICATION')
  const incompleteCalcs = calcs.filter(c => c.status === 'REQUIRES_INPUT' || c.status === 'UNSUPPORTED')
  out.push(item(F, 'errors', 'Unresolved errors', errors.length ? 'MISSING' : 'COMPLETE', `${errors.length} error(s)`, errors.flatMap(r => r.objectIds)))
  out.push(item(F, 'warnings', 'Unresolved warnings', warnings.length ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'COMPLETE', `${warnings.length} warning(s)`))
  out.push(item(F, 'assumptions', 'Assumptions stated', 'REQUIRES_PROFESSIONAL_REVIEW', `${calcs.reduce((s, c) => s + c.assumptions.length, 0)} calculation assumption(s) for the engineer to accept`))
  out.push(item(F, 'fieldVerification', 'Missing field verification', fieldV.length ? 'REQUIRES_FIELD_VERIFICATION' : 'COMPLETE', fieldV.map(i => i.label).join(', ')))
  out.push(item(F, 'professionalReview', 'Missing professional review', 'REQUIRES_PROFESSIONAL_REVIEW', 'every plan is reviewed by the professional of record before issuance'))
  out.push(item(F, 'calcs', 'Incomplete calculations', incompleteCalcs.length ? 'REQUIRES_INPUT' : 'COMPLETE', incompleteCalcs.map(c => `${c.name}: ${c.message}`).join('; ')))
  const jr = rules.filter(r => r.status === 'REQUIRES_REVIEW' && r.requiredReview?.discipline === 'land_use_planner')
  out.push(item(F, 'jurisdiction', 'Unresolved jurisdiction requirements', jr.length ? 'REQUIRES_PROFESSIONAL_REVIEW' : 'COMPLETE', jr.map(r => r.title).join(', ')))
  return out
}

export interface DraftingIssue {
  kind: 'OVERLAPPING_LABELS' | 'MISSING_DIMENSION' | 'ILLEGIBLE_ANNOTATION' | 'ORPHANED_OBJECT' | 'WRONG_LAYER' | 'OUTSIDE_VIEWPORT' | 'INCONSISTENT_UNITS' | 'BROKEN_GEOMETRY' | 'DUPLICATE_LABEL' | 'MISSING_REFERENCE'
  detail: string
  objectIds: string[]
}

/** The drafter's pass over the model and the rendered sheets. */
export function draftingIssues(m: StudioModel, sheets: SheetAudit | null): DraftingIssue[] {
  const out: DraftingIssue[] = []
  const objs = m.objects.filter(live)
  const byId = new Map(objs.map(o => [o.id, o]))
  const labels = objs.filter(o => o.type === 'Label' || o.type === 'Annotation')
  // Text at 0.1 in plotted height at 1"=20' is 2 ft on the ground; a label is ~ 1 ft/char wide.
  const box = (o: StudioObject) => { const c = centroid(o.geometry), w = String(o.attributes.text ?? '').length * 1.2, h = 2.4; return [c[0] - w / 2, c[1] - h / 2, c[0] + w / 2, c[1] + h / 2] }
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = box(labels[i]), b = box(labels[j])
    if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) out.push({ kind: 'OVERLAPPING_LABELS', detail: `"${labels[i].attributes.text}" overlaps "${labels[j].attributes.text}"`, objectIds: [labels[i].id, labels[j].id] })
  }
  const seen = new Map<string, string>()
  for (const l of labels) {
    const k = `${String(l.attributes.text ?? '').trim().toLowerCase()}|${l.attributes.targetId ?? ''}`
    if (seen.has(k) && l.attributes.text) out.push({ kind: 'DUPLICATE_LABEL', detail: `"${l.attributes.text}" appears twice on the same object`, objectIds: [seen.get(k)!, l.id] })
    else seen.set(k, l.id)
    const h = Number(l.attributes.textHeightIn)
    if (Number.isFinite(h) && h < 0.08) out.push({ kind: 'ILLEGIBLE_ANNOTATION', detail: `"${l.attributes.text}" at ${h} in — below the 0.08 in minimum plotted height`, objectIds: [l.id] })
    if (l.attributes.targetId && !byId.has(String(l.attributes.targetId))) out.push({ kind: 'ORPHANED_OBJECT', detail: `label "${l.attributes.text}" points at a deleted object`, objectIds: [l.id] })
  }
  for (const d of objs.filter(o => o.type === 'Dimension')) {
    const refs = (d.attributes.refs as string[] | undefined) ?? []
    if (refs.some(r => !byId.has(r))) out.push({ kind: 'ORPHANED_OBJECT', detail: 'dimension references a deleted object', objectIds: [d.id] })
  }
  for (const p of objs.filter(o => o.type === 'Pipe' && o.status === 'PROPOSED')) {
    for (const k of ['fromId', 'toId']) if (p.attributes[k] && !byId.has(String(p.attributes[k]))) out.push({ kind: 'ORPHANED_OBJECT', detail: `pipe ${p.attributes.label ?? p.id} ends at a deleted structure`, objectIds: [p.id] })
  }
  // Building-to-lot-line dimensions: one per classified edge is the convention on a site plan.
  const lot = objs.find(o => o.type === 'ParcelBoundary')
  for (const b of objs.filter(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')) {
    if (!lot) break
    const n = segmentsOf(lot.geometry).length
    const dims = objs.filter(o => o.type === 'Dimension' && (o.attributes.refs as string[] | undefined)?.includes(b.id) && (o.attributes.refs as string[]).includes(lot.id))
    const edges = new Set(dims.map(d => d.attributes.toEdgeIndex).filter(v => v != null))
    if (edges.size < n && dims.length < n) out.push({ kind: 'MISSING_DIMENSION', detail: `${n - Math.max(edges.size, dims.length)} of ${n} lot lines not dimensioned from the proposed building`, objectIds: [b.id] })
  }
  for (const o of objs) {
    const expected = DEFAULT_LAYER[o.type]
    const family = expected.split('-').slice(0, 2).join('-')
    if (!o.layer.startsWith(family) && !o.layer.startsWith(expected.split('-')[0] + '-') ) out.push({ kind: 'WRONG_LAYER', detail: `${o.type} on ${o.layer}; expected the ${family} family`, objectIds: [o.id] })
    const bad = isValidGeometry(o.geometry)
    if (bad) out.push({ kind: 'BROKEN_GEOMETRY', detail: `${o.type}: ${bad}`, objectIds: [o.id] })
    const u = o.attributes.units
    if (u && u !== 'ft' && u !== 'US_SURVEY_FT') out.push({ kind: 'INCONSISTENT_UNITS', detail: `${o.type} ${o.id} states units "${u}"`, objectIds: [o.id] })
  }
  for (const vp of objs.filter(o => o.type === 'SheetViewport' && o.geometry.type === 'Polygon')) {
    const xs = verticesOf(vp.geometry).map(p => p[0]), ys = verticesOf(vp.geometry).map(p => p[1])
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const outside = objs.filter(o => o.status === 'PROPOSED' && o.type !== 'SheetViewport' && verticesOf(o.geometry).some(p => p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1))
    if (outside.length) out.push({ kind: 'OUTSIDE_VIEWPORT', detail: `${outside.length} proposed object(s) extend outside viewport ${vp.attributes.label ?? vp.id}`, objectIds: outside.map(o => o.id) })
  }
  if (sheets) {
    const ids = new Set(sheets.sheets.map(s => s.id))
    for (const s of sheets.sheets) for (const ref of s.references) if (!ids.has(ref)) out.push({ kind: 'MISSING_REFERENCE', detail: `${s.id} refers to ${ref}, which is not in the set`, objectIds: [] })
    if (sheets.overprints) out.push({ kind: 'OVERLAPPING_LABELS', detail: `${sheets.overprints} required label(s) overprint other content on the rendered sheets`, objectIds: [] })
  }
  return out
}

export type ComponentStatus = 'PASS' | 'PASS_WITH_REVIEW_ITEMS' | 'FAIL' | 'NOT_STARTED' | 'NOT_COMPLETE' | 'NOT_READY' | 'READY' | 'COMPLETE'

export interface Readiness {
  label: string
  designCompleteness: { percent: number; complete: number; applicable: number }
  draftingQa: { status: ComponentStatus; issues: number }
  engineeringCalculations: { status: ComponentStatus; reviewItems: number; failing: number }
  jurisdictionRules: { status: ComponentStatus; failing: number; reviewItems: number }
  sourceReliability: { itemsRequiringVerification: number; lowestLevel: 0 | 1 | 2 }
  professionalReview: { status: 'NOT_COMPLETE' | 'IN_PROGRESS' | 'COMPLETE' }
  issuance: { status: 'NOT_READY' | 'READY_FOR_SEAL' | 'SIGNED_SEALED' | 'INVALIDATED' }
}

/** Component readiness. Deliberately never one number. */
export function readiness(m: StudioModel, state: ProjectState, checklist: ChecklistItem[], rules: RuleResult[], calcs: CalculationRecord[], issuanceState: 'NONE' | 'PREPARED' | 'APPROVED' | 'EXECUTED' | 'INVALIDATED', aiGenerated: boolean): Readiness {
  const design = checklist.filter(i => ['EXISTING CONDITIONS', 'ZONING / LAND USE', 'PROPOSED SITE', 'ENGINEERING'].includes(i.section) && i.status !== 'NOT_APPLICABLE')
  const done = design.filter(i => i.status === 'COMPLETE' || i.status === 'REQUIRES_PROFESSIONAL_REVIEW').length
  const dq = checklist.filter(i => i.section === 'DRAFTING QA' && i.status === 'MISSING').length
  const calcFail = calcs.filter(c => c.status === 'FAIL').length, calcReview = calcs.filter(c => c.reviewStatus !== 'REVIEWED').length
  const ruleFail = rules.filter(r => (r.status === 'FAIL' || r.status === 'BLOCKED') && !r.override).length
  const ruleReview = rules.filter(r => r.status === 'REQUIRES_REVIEW').length
  const fieldV = checklist.filter(i => i.status === 'REQUIRES_FIELD_VERIFICATION').length
  const lowest = m.objects.filter(o => o.status !== 'PROPOSED' && o.status !== 'SUPERSEDED').reduce<0 | 1 | 2>((lo, o) => Math.min(lo, SOURCE_RELIABILITY[o.source]) as 0 | 1 | 2, 2)
  const engineeringPassed = calcs.length > 0 && calcFail === 0 && ruleFail === 0
  return {
    label: honestLabel(state, { aiGenerated, engineeringChecksPassed: engineeringPassed, fieldVerificationOutstanding: fieldV > 0 }),
    designCompleteness: { percent: design.length ? Math.round((100 * done) / design.length) : 0, complete: done, applicable: design.length },
    draftingQa: { status: dq ? 'FAIL' : 'PASS', issues: dq },
    engineeringCalculations: { status: !calcs.length ? 'NOT_STARTED' : calcFail ? 'FAIL' : calcReview ? 'PASS_WITH_REVIEW_ITEMS' : 'PASS', reviewItems: calcReview, failing: calcFail },
    jurisdictionRules: { status: ruleFail ? 'FAIL' : ruleReview ? 'PASS_WITH_REVIEW_ITEMS' : 'PASS', failing: ruleFail, reviewItems: ruleReview },
    sourceReliability: { itemsRequiringVerification: fieldV, lowestLevel: lowest },
    professionalReview: { status: state === 'PE_REVIEW' ? 'IN_PROGRESS' : ['APPROVED_FOR_ISSUANCE', 'READY_FOR_SEAL', 'SIGNED_SEALED', 'SUBMITTED', 'AHJ_COMMENTS', 'REISSUED', 'APPROVED'].includes(state) ? 'COMPLETE' : 'NOT_COMPLETE' },
    issuance: { status: issuanceState === 'EXECUTED' ? 'SIGNED_SEALED' : issuanceState === 'INVALIDATED' ? 'INVALIDATED' : state === 'READY_FOR_SEAL' ? 'READY_FOR_SEAL' : 'NOT_READY' },
  }
}
