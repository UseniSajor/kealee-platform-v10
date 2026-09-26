/**
 * The shared deterministic command layer.
 *
 * The drawing tools, the AI copilot, a reviewer's redline and the automated
 * site-plan generator all speak THIS language. Nothing mutates the model any
 * other way: a command is validated, executed on a copy, previewed as a diff
 * with its rule and calculation consequences, and only then accepted into a
 * new revision. Every executed command records the objects it touched before
 * and after, which is what makes it reversible and auditable.
 */

import {
  type StudioModel, type StudioObject, type StudioObjectType, type StudioGeometry, type SourceKind,
  type ObjectStatus, type Pos, type Discipline, STUDIO_OBJECT_TYPES, RECORD_SOURCES, COMMAND_CREATABLE_SOURCES,
  DEFAULT_LAYER, DEFAULT_DISCIPLINE, objectById, requirementFor,
} from './model'
import * as geo from './geometry'
import { interpolateElevation, surfaceSamples, sizePipe, pipeFullFlow } from './calculations'
import { dischargeAt } from '../site-plan/swale'

export type CommandOrigin = 'TOOL' | 'AI' | 'REDLINE' | 'GENERATOR' | 'IMPORT'
export interface XYv { x: number; y: number }

interface Base { requestedBy: string; origin: CommandOrigin; units?: 'ft'; note?: string }

export interface NewObjectSpec {
  type: StudioObjectType
  geometry: StudioGeometry
  attributes?: Record<string, unknown>
  layer?: string
  discipline?: Discipline
  status?: ObjectStatus
  source?: SourceKind
  sourceAuthority?: string | null
  sourceDate?: string | null
  confidence?: number
}

export type StudioCommand = Base & (
  | { action: 'ADD_OBJECT'; object: NewObjectSpec }
  | { action: 'DELETE_OBJECT'; objectIds: string[] }
  | { action: 'MOVE_OBJECT'; objectIds: string[]; vector: XYv }
  | { action: 'ROTATE_OBJECT'; objectIds: string[]; angleDeg: number; pivot?: XYv }
  | { action: 'SCALE_OBJECT'; objectIds: string[]; factor: number; pivot?: XYv }
  | { action: 'MIRROR'; objectIds: string[]; axis: { a: XYv; b: XYv }; copy?: boolean }
  | { action: 'OFFSET'; objectId: string; distanceFt: number; side: 'left' | 'right' | 'out' | 'in' }
  | { action: 'TRIM'; objectId: string; boundaryId: string; keep: 'start' | 'end' }
  | { action: 'EXTEND'; objectId: string; boundaryId: string; end: 'start' | 'end' }
  | { action: 'SPLIT'; objectId: string; at: XYv }
  | { action: 'JOIN'; objectIds: [string, string] }
  | { action: 'COPY'; objectIds: string[]; vector: XYv }
  | { action: 'FILLET'; objectId: string; vertexIndex: number; radiusFt: number }
  | { action: 'DIMENSION'; fromObjectId: string; toObjectId: string; toEdgeIndex?: number; label?: string }
  | { action: 'LABEL'; text: string; at: XYv; targetId?: string }
  | { action: 'SET_ELEVATION'; objectId: string; elevationFt: number; vertexIndex?: number }
  | { action: 'SET_SLOPE'; objectId: string; slopePct: number; hold: 'start' | 'end'; holdElevationFt?: number }
  | { action: 'CREATE_CONTOUR'; coordinates: XYv[]; elevationFt: number; proposed?: boolean }
  | { action: 'CREATE_PAD'; elevationFt: number; polygon?: XYv[]; aroundObjectId?: string; offsetFt?: number; sideSlopeH?: number }
  | { action: 'GRADE_REGION'; polygon: XYv[]; anchor: { x: number; y: number; z: number }; slopePct: number; directionDeg: number }
  | { action: 'CREATE_SWALE'; coordinates: XYv[]; bottomWidthFt: number; sideSlopeZ: number; depthFt: number; manningN?: number; slopePct?: number; designFlowCfs?: number }
  | { action: 'ROUTE_PIPE'; fromId: string; toId: string; diameterIn?: number; designFlowCfs?: number; manningN?: number; slopePct?: number; label?: string }
  | { action: 'CREATE_PROFILE'; alignmentId: string; intervalFt?: number }
  | { action: 'CREATE_SECTION'; line: [XYv, XYv]; intervalFt?: number; label?: string }
  | { action: 'ASSIGN_LAYER'; objectIds: string[]; layer: string }
  | { action: 'SET_PROPERTY'; objectIds: string[]; key: string; value: unknown }
  | { action: 'CREATE_SETBACK'; lotId?: string }
  | { action: 'CREATE_BUILDABLE_AREA'; lotId?: string }
  | { action: 'CREATE_BUFFER'; objectId: string; distanceFt: number; bufferType: string }
)

export type CommandAction = StudioCommand['action']
export const COMMAND_ACTIONS: CommandAction[] = [
  'ADD_OBJECT', 'DELETE_OBJECT', 'MOVE_OBJECT', 'ROTATE_OBJECT', 'SCALE_OBJECT', 'MIRROR', 'OFFSET', 'TRIM',
  'EXTEND', 'SPLIT', 'JOIN', 'COPY', 'FILLET', 'DIMENSION', 'LABEL', 'SET_ELEVATION', 'SET_SLOPE',
  'CREATE_CONTOUR', 'CREATE_PAD', 'GRADE_REGION', 'CREATE_SWALE', 'ROUTE_PIPE', 'CREATE_PROFILE',
  'CREATE_SECTION', 'ASSIGN_LAYER', 'SET_PROPERTY', 'CREATE_SETBACK', 'CREATE_BUILDABLE_AREA', 'CREATE_BUFFER',
]

/** Commands that do not change what is built or what is measured. */
const NON_MATERIAL: ReadonlySet<CommandAction> = new Set(['LABEL', 'ASSIGN_LAYER', 'DIMENSION'])

/** Which objects a command changes geometry of (must not be record data). */
function geometryTargets(c: StudioCommand): string[] {
  switch (c.action) {
    case 'DELETE_OBJECT': case 'MOVE_OBJECT': case 'ROTATE_OBJECT': case 'SCALE_OBJECT': return c.objectIds
    case 'MIRROR': return c.copy ? [] : c.objectIds
    case 'TRIM': case 'EXTEND': case 'SPLIT': case 'FILLET': case 'SET_ELEVATION': case 'SET_SLOPE': return [c.objectId]
    case 'JOIN': return c.objectIds
    default: return []
  }
}

/** Attributes nobody sets by command: provenance and professional state are not editable facts. */
const PROTECTED_KEYS = new Set(['source', 'sourceAccuracy', 'sourceAuthority', 'sourceDate', 'confidence', 'createdBy', 'createdAt', 'revisionId', 'organizationId', 'projectId', 'workspaceId', 'id', 'type', 'geometry', 'sealed', 'certified', 'fieldVerified', 'surveyed', 'reviewStatus'])

export interface CommandError { code: string; message: string; objectIds?: string[] }

/** Structural and policy validation. Never mutates. */
export function validateCommand(model: StudioModel, c: StudioCommand): CommandError[] {
  const errs: CommandError[] = []
  const need = (id: string | undefined, what = 'object') => {
    if (!id || !objectById(model, id)) errs.push({ code: 'OBJECT_NOT_FOUND', message: `No ${what} ${id ?? '(missing id)'} in revision ${model.revision}.`, objectIds: id ? [id] : [] })
  }
  if (!COMMAND_ACTIONS.includes(c.action)) return [{ code: 'UNKNOWN_ACTION', message: `Unknown command ${(c as any).action}.` }]
  if (!c.requestedBy) errs.push({ code: 'NO_ACTOR', message: 'Every command names who requested it.' })
  if (c.units && c.units !== 'ft') errs.push({ code: 'UNITS', message: 'Commands are in US survey feet.' })

  // Record geometry is evidence. It is replaced by a new import, never edited.
  for (const id of geometryTargets(c)) {
    const o = objectById(model, id)
    if (!o) { need(id); continue }
    if (RECORD_SOURCES.has(o.source)) {
      errs.push({ code: 'RECORD_GEOMETRY_PROTECTED', message: `${o.type} ${o.id} is ${o.source.replace(/_/g, ' ').toLowerCase()} data. It cannot be moved, reshaped or deleted by a command; import a new survey or record to change it.`, objectIds: [id] })
    }
  }
  switch (c.action) {
    case 'ADD_OBJECT': {
      const o = c.object
      if (!o || !STUDIO_OBJECT_TYPES.includes(o.type)) errs.push({ code: 'BAD_TYPE', message: `Unknown object type ${o?.type}.` })
      else {
        const bad = geo.isValidGeometry(o.geometry)
        if (bad) errs.push({ code: 'BAD_GEOMETRY', message: bad })
      }
      if (o?.source && !COMMAND_CREATABLE_SOURCES.has(o.source)) {
        errs.push({ code: 'SOURCE_NOT_CREATABLE', message: `A command cannot create ${o.source.replace(/_/g, ' ').toLowerCase()} data. Surveyed, record and GIS data arrive only by import with their source document.` })
      }
      if (c.origin === 'AI' && o?.source && o.source !== 'AI_INFERRED' && o.source !== 'PROPOSED_DESIGN') {
        errs.push({ code: 'AI_SOURCE_FORBIDDEN', message: `The AI may only create AI-inferred or proposed-design objects, not ${o.source}.` })
      }
      break
    }
    case 'COPY': case 'ASSIGN_LAYER': c.objectIds.forEach(id => need(id)); break
    case 'MIRROR': c.objectIds.forEach(id => need(id)); if (c.axis.a.x === c.axis.b.x && c.axis.a.y === c.axis.b.y) errs.push({ code: 'BAD_AXIS', message: 'Mirror axis needs two distinct points.' }); break
    case 'SCALE_OBJECT': if (!(c.factor > 0)) errs.push({ code: 'BAD_FACTOR', message: 'Scale factor must be positive.' }); break
    case 'OFFSET': need(c.objectId); if (!(c.distanceFt > 0)) errs.push({ code: 'BAD_DISTANCE', message: 'Offset distance must be positive.' }); break
    case 'TRIM': case 'EXTEND': need(c.boundaryId, 'boundary'); break
    case 'JOIN': {
      const [a, b] = c.objectIds.map(id => objectById(model, id))
      if (a && b && (a.geometry.type !== 'LineString' || b.geometry.type !== 'LineString')) errs.push({ code: 'JOIN_LINES', message: 'Only lines join.' })
      if (a && b && a.type !== b.type) errs.push({ code: 'JOIN_TYPES', message: `Cannot join a ${a.type} to a ${b.type}.` })
      break
    }
    case 'DIMENSION': need(c.fromObjectId); need(c.toObjectId); break
    case 'LABEL': if (!c.text?.trim()) errs.push({ code: 'EMPTY_LABEL', message: 'A label needs text.' }); if (c.targetId) need(c.targetId); break
    case 'ROUTE_PIPE': need(c.fromId, 'structure'); need(c.toId, 'structure'); if (c.diameterIn == null && c.designFlowCfs == null) errs.push({ code: 'PIPE_SIZE', message: 'Give a diameter, or a design flow to size one.' }); break
    case 'CREATE_PROFILE': need(c.alignmentId, 'alignment'); break
    case 'CREATE_BUFFER': need(c.objectId); if (!(c.distanceFt > 0)) errs.push({ code: 'BAD_DISTANCE', message: 'Buffer distance must be positive.' }); break
    case 'SET_PROPERTY': {
      c.objectIds.forEach(id => need(id))
      if (PROTECTED_KEYS.has(c.key)) errs.push({ code: 'PROTECTED_PROPERTY', message: `"${c.key}" is provenance or professional state; it is set by import, review or issuance, never by an edit.` })
      for (const id of c.objectIds) {
        const o = objectById(model, id)
        if (o && RECORD_SOURCES.has(o.source) && c.key !== 'status' && c.key !== 'note' && !(c.key === 'edgeYards' && o.type === 'ParcelBoundary')) errs.push({ code: 'RECORD_ATTRIBUTE_PROTECTED', message: `${o.type} ${id} is record data; only its status (e.g. to be removed), a note, or — on a parcel — the front/side/rear classification of its lines may be set.`, objectIds: [id] })
        if (o && c.key === 'status' && RECORD_SOURCES.has(o.source) && !['EXISTING', 'TO_BE_REMOVED'].includes(String(c.value))) errs.push({ code: 'RECORD_STATUS', message: 'Record data may only be marked existing or to be removed.', objectIds: [id] })
      }
      break
    }
    case 'CREATE_SETBACK': case 'CREATE_BUILDABLE_AREA': {
      const lot = c.lotId ? objectById(model, c.lotId) : model.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')
      if (!lot) errs.push({ code: 'NO_LOT', message: 'No parcel boundary to measure setbacks from.' })
      else if (!Array.isArray(lot.attributes.edgeYards)) errs.push({ code: 'EDGES_UNCLASSIFIED', message: 'The lot lines are not classified front/side/rear — set edgeYards on the parcel first.' })
      if (!model.zoning) errs.push({ code: 'NO_ZONING', message: 'No zoning requirements in the project; the rule engine has not resolved them.' })
      break
    }
    default: {
      const id = (c as any).objectId
      if (id) need(id)
    }
  }
  return errs
}

export interface ObjectChange { before: StudioObject | null; after: StudioObject | null }

export interface ExecuteContext {
  newId: () => string
  now: string
  actorId: string
}

/** Apply one command to a copy of the model. Throws on an invalid command — call validateCommand first. */
export function executeCommand(model: StudioModel, c: StudioCommand, ctx: ExecuteContext): { model: StudioModel; changes: ObjectChange[] } {
  const objects = new Map(model.objects.map(o => [o.id, o]))
  const changes = new Map<string, ObjectChange>()
  const touch = (before: StudioObject | null, after: StudioObject | null) => {
    const id = (after ?? before)!.id
    const prev = changes.get(id)
    changes.set(id, { before: prev ? prev.before : before, after })
    if (after) objects.set(id, after); else objects.delete(id)
  }
  const get = (id: string) => { const o = objects.get(id); if (!o) throw new Error(`object ${id} not found`); return o }
  const edit = (o: StudioObject, patch: Partial<StudioObject>) =>
    touch(o, { ...o, ...patch, modifiedBy: ctx.actorId, modifiedAt: ctx.now })
  const create = (spec: NewObjectSpec): StudioObject => {
    const existingCondition = (spec.status ?? 'PROPOSED') !== 'PROPOSED'
    // Provenance is decided HERE, not by the caller's wish: an AI cannot
    // create measured data, and a person drawing an existing feature by hand
    // is supplying it, not surveying it.
    let source: SourceKind = spec.source ?? (existingCondition ? (c.origin === 'AI' ? 'AI_INFERRED' : 'USER_SUPPLIED') : 'PROPOSED_DESIGN')
    if (c.origin === 'AI' && existingCondition) source = 'AI_INFERRED'
    const confidence = Math.min(spec.confidence ?? (source === 'AI_INFERRED' ? 0.5 : source === 'USER_SUPPLIED' ? 0.7 : 0.9), source === 'AI_INFERRED' ? 0.6 : 1)
    const o: StudioObject = {
      id: ctx.newId(), organizationId: model.organizationId, workspaceId: model.workspaceId, projectId: model.projectId,
      type: spec.type, geometry: spec.geometry, attributes: { ...(spec.attributes ?? {}), ...(c.origin === 'AI' ? { draftedBy: 'ai' } : {}) },
      layer: spec.layer ?? DEFAULT_LAYER[spec.type], discipline: spec.discipline ?? DEFAULT_DISCIPLINE[spec.type] ?? 'CIVIL_SITE',
      source, sourceDate: spec.sourceDate ?? ctx.now, sourceAccuracy: source === 'ENGINE_CALCULATED' ? 'schematic' : source === 'PROPOSED_DESIGN' ? 'schematic' : 'approximate',
      sourceAuthority: spec.sourceAuthority ?? (source === 'AI_INFERRED' ? 'Kealee AI (inferred)' : source === 'ENGINE_CALCULATED' ? 'Kealee engine' : null),
      confidence, createdBy: ctx.actorId, createdAt: ctx.now, modifiedBy: ctx.actorId, modifiedAt: ctx.now,
      revisionId: 'pending', status: spec.status ?? 'PROPOSED',
    }
    touch(null, o)
    return o
  }
  const origin = (o?: XYv, ids: string[] = []): geo.XY => {
    if (o) return [o.x, o.y]
    const cs = ids.map(id => geo.centroid(get(id).geometry))
    return [cs.reduce((s, p) => s + p[0], 0) / cs.length, cs.reduce((s, p) => s + p[1], 0) / cs.length]
  }
  const line = (o: StudioObject): Pos[] => {
    if (o.geometry.type !== 'LineString') throw new Error(`${o.type} ${o.id} is not a line`)
    return o.geometry.coordinates
  }
  const pts = (xs: XYv[]): Pos[] => xs.map(p => [p.x, p.y])

  switch (c.action) {
    case 'ADD_OBJECT': create(c.object); break
    case 'DELETE_OBJECT': c.objectIds.forEach(id => touch(get(id), null)); break
    case 'MOVE_OBJECT': c.objectIds.forEach(id => { const o = get(id); edit(o, { geometry: geo.translate(o.geometry, c.vector.x, c.vector.y) }) }); break
    case 'ROTATE_OBJECT': { const org = origin(c.pivot, c.objectIds); c.objectIds.forEach(id => { const o = get(id); edit(o, { geometry: geo.rotate(o.geometry, c.angleDeg, org) }) }); break }
    case 'SCALE_OBJECT': { const org = origin(c.pivot, c.objectIds); c.objectIds.forEach(id => { const o = get(id); edit(o, { geometry: geo.scale(o.geometry, c.factor, org) }) }); break }
    case 'MIRROR': c.objectIds.forEach(id => {
      const o = get(id), g = geo.mirror(o.geometry, [c.axis.a.x, c.axis.a.y], [c.axis.b.x, c.axis.b.y])
      if (c.copy) create({ ...specOf(o), geometry: g }); else edit(o, { geometry: g })
    }); break
    case 'OFFSET': {
      const o = get(c.objectId)
      let g: StudioGeometry | null
      if (o.geometry.type === 'LineString') g = { type: 'LineString', coordinates: geo.offsetLine(o.geometry.coordinates, c.side === 'right' ? -c.distanceFt : c.distanceFt) }
      else g = geo.buffer(o.geometry, c.side === 'in' ? -c.distanceFt : c.distanceFt)
      if (!g) throw new Error('offset leaves nothing')
      // An offset of record geometry is a new PROPOSED line (a building line,
      // a limit of work) — the record itself is untouched.
      create({ ...specOf(o), geometry: g, status: 'PROPOSED', source: 'PROPOSED_DESIGN', attributes: { ...o.attributes, offsetOf: o.id, offsetFt: c.distanceFt } })
      break
    }
    case 'TRIM': { const o = get(c.objectId), res = geo.trimLine(line(o), get(c.boundaryId).geometry, c.keep); if (!res) throw new Error('the line does not cross the boundary'); edit(o, { geometry: { type: 'LineString', coordinates: res } }); break }
    case 'EXTEND': { const o = get(c.objectId), res = geo.extendLine(line(o), get(c.boundaryId).geometry, c.end); if (!res) throw new Error('the line does not reach the boundary when extended'); edit(o, { geometry: { type: 'LineString', coordinates: res } }); break }
    case 'SPLIT': {
      const o = get(c.objectId), parts = geo.splitLine(line(o), [c.at.x, c.at.y])
      if (!parts) throw new Error('split point is at an end of the line')
      edit(o, { geometry: { type: 'LineString', coordinates: parts[0] } })
      create({ ...specOf(o), geometry: { type: 'LineString', coordinates: parts[1] }, attributes: { ...o.attributes, splitFrom: o.id } })
      break
    }
    case 'JOIN': {
      const [a, b] = c.objectIds.map(get), res = geo.joinLines(line(a), line(b))
      if (!res) throw new Error('the lines do not share an endpoint')
      edit(a, { geometry: { type: 'LineString', coordinates: res } }); touch(b, null)
      break
    }
    case 'COPY': c.objectIds.forEach(id => { const o = get(id); create({ ...specOf(o), geometry: geo.translate(o.geometry, c.vector.x, c.vector.y), attributes: { ...o.attributes, copiedFrom: o.id } }) }); break
    case 'FILLET': { const o = get(c.objectId), res = geo.filletVertex(line(o), c.vertexIndex, c.radiusFt); if (!res) throw new Error('radius does not fit at that vertex'); edit(o, { geometry: { type: 'LineString', coordinates: res } }); break }
    case 'DIMENSION': {
      const a = get(c.fromObjectId), b = get(c.toObjectId)
      const target = c.toEdgeIndex != null ? edgeGeometry(b.geometry, c.toEdgeIndex) : b.geometry
      if (!target) throw new Error(`edge ${c.toEdgeIndex} not found on ${b.type}`)
      const { p, q, d } = nearestPair(a.geometry, target)
      create({ type: 'Dimension', geometry: { type: 'LineString', coordinates: [p, q] }, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { refs: [a.id, b.id], toEdgeIndex: c.toEdgeIndex ?? null, measuredFt: round(d), text: c.label ?? `${round(d, 1)}'` } })
      break
    }
    case 'LABEL': create({ type: 'Label', geometry: { type: 'Point', coordinates: [c.at.x, c.at.y] }, status: 'PROPOSED', attributes: { text: c.text, targetId: c.targetId ?? null } }); break
    case 'SET_ELEVATION': {
      const o = get(c.objectId)
      if (c.vertexIndex == null) {
        const g = geo.mapCoords(o.geometry, p => [p[0], p[1], c.elevationFt])
        edit(o, { geometry: g, attributes: { ...o.attributes, elevationFt: c.elevationFt } })
      } else {
        const vs = o.geometry.type === 'LineString' ? [...o.geometry.coordinates] : null
        if (!vs || !vs[c.vertexIndex]) throw new Error('vertex not found')
        vs[c.vertexIndex] = [vs[c.vertexIndex][0], vs[c.vertexIndex][1], c.elevationFt]
        edit(o, { geometry: { type: 'LineString', coordinates: vs } })
      }
      break
    }
    case 'SET_SLOPE': {
      const o = get(c.objectId)
      const base = (o.attributes.centerline as Pos[] | undefined) ?? (o.geometry.type === 'LineString' ? o.geometry.coordinates : null)
      if (!base || base.length < 2) throw new Error(`${o.type} has no alignment to grade`)
      const seq = c.hold === 'start' ? base : [...base].reverse()
      const z0 = c.holdElevationFt ?? Number(seq[0][2] ?? o.attributes.elevationFt)
      if (!Number.isFinite(z0)) throw new Error('no elevation at the held end — set one first')
      let s = 0
      // The slope is measured AWAY from the held end, falling for a negative
      // value: "-8%" from a garage slab runs down to the street.
      const graded = seq.map((p, k) => { if (k) s += Math.hypot(p[0] - seq[k - 1][0], p[1] - seq[k - 1][1]); return [p[0], p[1], round(z0 + (c.slopePct / 100) * s, 3)] as Pos })
      const out = c.hold === 'start' ? graded : graded.reverse()
      if (o.attributes.centerline || o.geometry.type !== 'LineString') edit(o, { attributes: { ...o.attributes, centerline: out, gradePct: c.slopePct } })
      else edit(o, { geometry: { type: 'LineString', coordinates: out }, attributes: { ...o.attributes, gradePct: c.slopePct } })
      break
    }
    case 'CREATE_CONTOUR': create({ type: 'Contour', geometry: { type: 'LineString', coordinates: c.coordinates.map(p => [p.x, p.y, c.elevationFt]) }, status: c.proposed === false ? 'EXISTING' : 'PROPOSED', attributes: { elevationFt: c.elevationFt, major: c.elevationFt % 10 === 0 }, layer: c.proposed === false ? 'C-TOPO-MAJR' : 'C-GRAD-CONT' }); break
    case 'CREATE_PAD': {
      let ring: Pos[]
      if (c.polygon) ring = geo.closeRing(c.polygon.map(p => [p.x, p.y]))
      else {
        const around = get(c.aroundObjectId!)
        const g = geo.buffer(around.geometry, c.offsetFt ?? 5)
        if (!g || g.type !== 'Polygon') throw new Error('cannot build a pad around that object')
        ring = g.coordinates[0]
      }
      create({ type: 'GradingPad', geometry: { type: 'Polygon', coordinates: [ring.map(p => [p[0], p[1], c.elevationFt])] }, status: 'PROPOSED', attributes: { elevationFt: c.elevationFt, sideSlopeH: c.sideSlopeH ?? 3, around: c.aroundObjectId ?? null } })
      break
    }
    case 'GRADE_REGION': {
      const a = (c.directionDeg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), g = c.slopePct / 100
      const zAt = (x: number, y: number) => round(c.anchor.z + g * ((x - c.anchor.x) * ux + (y - c.anchor.y) * uy), 3)
      const ring = c.polygon.map(p => [p.x, p.y, zAt(p.x, p.y)] as Pos)
      const pad = create({ type: 'GradingPad', geometry: { type: 'Polygon', coordinates: [geo.closeRing(ring.map(p => [p[0], p[1]])).map(p => [p[0], p[1], zAt(p[0], p[1])])] }, status: 'PROPOSED', attributes: { plane: { anchor: c.anchor, slopePct: c.slopePct, directionDeg: c.directionDeg } } })
      ring.forEach(p => create({ type: 'SpotElevation', geometry: { type: 'Point', coordinates: p }, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { elevationFt: p[2], region: pad.id } }))
      const cen = geo.centroid(pad.geometry)
      create({ type: 'SlopeArrow', geometry: { type: 'LineString', coordinates: [[cen[0], cen[1]], [cen[0] + ux * 10, cen[1] + uy * 10]] }, status: 'PROPOSED', attributes: { slopePct: c.slopePct, region: pad.id } })
      break
    }
    case 'CREATE_SWALE': {
      const P = pts(c.coordinates), n = c.manningN ?? 0.035, S = (c.slopePct ?? 1) / 100
      const cap = dischargeAt(Math.max(0, c.depthFt - 0.5), { bottomWidthFt: c.bottomWidthFt, sideSlopeZ: c.sideSlopeZ, manningN: n }, S)
      create({ type: 'Swale', geometry: { type: 'LineString', coordinates: P }, status: 'PROPOSED', attributes: { bottomWidthFt: c.bottomWidthFt, sideSlopeZ: c.sideSlopeZ, depthFt: c.depthFt, manningN: n, slopeFtPerFt: S, designFlowCfs: c.designFlowCfs ?? null, capacityCfs: round(cap), capacityMethod: 'Manning trapezoid, 0.5 ft freeboard' } })
      break
    }
    case 'ROUTE_PIPE': {
      const a = get(c.fromId), b = get(c.toId)
      const pa = geo.centroid(a.geometry), pb = geo.centroid(b.geometry)
      const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1])
      const invA = numOr(a.attributes.invertOutFt ?? a.attributes.invertFt), invB = numOr(b.attributes.invertInFt ?? b.attributes.invertFt)
      const S = c.slopePct != null ? c.slopePct / 100 : invA != null && invB != null && L > 0 ? (invA - invB) / L : null
      if (S == null || S <= 0) throw new Error('no fall between the structures — give a slope or set inverts that fall downstream')
      const n = c.manningN ?? 0.013
      const D = c.diameterIn ?? sizePipe(c.designFlowCfs!, S, n)
      if (D == null) throw new Error(`no standard pipe up to 60 in carries ${c.designFlowCfs} cfs at ${round(S * 100)}%`)
      const f = pipeFullFlow(D, S, n)
      create({ type: 'Pipe', geometry: { type: 'LineString', coordinates: [[pa[0], pa[1]], [pb[0], pb[1]]] }, status: 'PROPOSED', attributes: {
        fromId: a.id, toId: b.id, diameterIn: D, slopeFtPerFt: round(S, 5), manningN: n, lengthFt: round(L), designFlowCfs: c.designFlowCfs ?? null,
        capacityCfs: round(f.qFullCfs), label: c.label ?? `${D}" RCP @ ${round(S * 100)}%`, sizedBy: c.diameterIn == null ? 'Manning full flow, smallest standard size ≥ 15 in' : 'stated',
      } })
      break
    }
    case 'CREATE_PROFILE': {
      const al = get(c.alignmentId)
      const P = al.geometry.type === 'LineString' ? al.geometry.coordinates : (al.attributes.centerline as Pos[] | undefined)
      if (!P) throw new Error('alignment is not a line')
      const ex = surfaceSamples({ ...model, objects: [...objects.values()] }, 'existing')
      const stations = sampleAlong(P, c.intervalFt ?? 10).map(s => ({ stationFt: round(s.station, 1), existingFt: ex.length >= 3 ? round(interpolateElevation(ex, s.x, s.y)!.z) : null, proposedFt: s.z == null ? null : round(s.z) }))
      create({ type: 'Profile', geometry: { type: 'LineString', coordinates: P.map(p => [p[0], p[1]]) }, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { alignmentId: al.id, stations, method: 'existing grade by IDW between mapped elevations' } })
      break
    }
    case 'CREATE_SECTION': {
      const P: Pos[] = [[c.line[0].x, c.line[0].y], [c.line[1].x, c.line[1].y]]
      const ex = surfaceSamples({ ...model, objects: [...objects.values()] }, 'existing')
      const pr = surfaceSamples({ ...model, objects: [...objects.values()] }, 'proposed')
      const stations = sampleAlong(P, c.intervalFt ?? 5).map(s => ({ offsetFt: round(s.station, 1), existingFt: ex.length >= 3 ? round(interpolateElevation(ex, s.x, s.y)!.z) : null, proposedFt: pr.length >= 3 ? round(interpolateElevation(pr, s.x, s.y)!.z) : null }))
      create({ type: 'Section', geometry: { type: 'LineString', coordinates: P }, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { label: c.label ?? 'A-A', stations } })
      break
    }
    case 'ASSIGN_LAYER': c.objectIds.forEach(id => edit(get(id), { layer: c.layer })); break
    case 'SET_PROPERTY': c.objectIds.forEach(id => {
      const o = get(id)
      if (c.key === 'status') edit(o, { status: c.value as ObjectStatus })
      else if (c.key === 'layer') edit(o, { layer: String(c.value) })
      else if (c.key === 'widthFt' && o.type === 'Driveway' && o.attributes.centerline) {
        // A driveway's width is its GEOMETRY: rebuild the slab from the centreline.
        const cl = o.attributes.centerline as Pos[]
        const g = geo.buffer({ type: 'LineString', coordinates: cl }, Number(c.value) / 2)
        if (!g) throw new Error('cannot widen the driveway')
        edit(o, { geometry: squareEnds(cl, Number(c.value)) ?? g, attributes: { ...o.attributes, widthFt: Number(c.value) } })
      } else edit(o, { attributes: { ...o.attributes, [c.key]: c.value } })
    }); break
    case 'CREATE_SETBACK': case 'CREATE_BUILDABLE_AREA': {
      const lot = c.lotId ? get(c.lotId) : [...objects.values()].find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')!
      const yards = lot.attributes.edgeYards as ('front' | 'side' | 'rear')[]
      const dist = yards.map(y => requirementFor(model.zoning, y)?.value ?? 0)
      const cite = model.zoning?.citation ?? null
      if (c.action === 'CREATE_BUILDABLE_AREA') {
        const env = geo.insetPerEdgeDistance(lot.geometry, dist)
        if (!env) throw new Error('the setbacks consume the whole lot')
        for (const old of [...objects.values()].filter(o => o.type === 'BuildableArea' && o.status !== 'SUPERSEDED')) edit(old, { status: 'SUPERSEDED' })
        create({ type: 'BuildableArea', geometry: env, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { lotId: lot.id, yardsFt: dist, citation: cite, areaSf: round(geo.polygonArea(env), 0) } })
      } else {
        const ring = geo.openRing((lot.geometry as any).coordinates[0])
        for (const old of [...objects.values()].filter(o => o.type === 'Setback' && o.status !== 'SUPERSEDED' && o.attributes.lotId === lot.id)) edit(old, { status: 'SUPERSEDED' })
        ring.forEach((a, i) => {
          if (!dist[i]) return
          const b = ring[(i + 1) % ring.length]
          create({ type: 'Setback', geometry: { type: 'LineString', coordinates: geo.offsetLine([a, b], ccw(ring) ? dist[i] : -dist[i]) }, status: 'PROPOSED', source: 'ENGINE_CALCULATED', attributes: { lotId: lot.id, edgeIndex: i, yard: yards[i], distanceFt: dist[i], citation: cite } })
        })
      }
      break
    }
    case 'CREATE_BUFFER': {
      const o = get(c.objectId), g = geo.buffer(o.geometry, c.distanceFt)
      if (!g) throw new Error('cannot buffer that object')
      create({ type: 'Buffer', geometry: g, status: o.status === 'PROPOSED' ? 'PROPOSED' : 'REFERENCE', source: 'ENGINE_CALCULATED', attributes: { of: o.id, distanceFt: c.distanceFt, bufferType: c.bufferType } })
      break
    }
  }

  // ── Dependencies: what else moves because this moved ─────────────────────
  propagate(objects, changes, touch, ctx)

  const next: StudioModel = { ...model, objects: [...objects.values()] }
  return { model: next, changes: [...changes.values()] }
}

/** Pipes follow their structures; dimensions re-measure their references. */
function propagate(objects: Map<string, StudioObject>, changes: Map<string, ObjectChange>, touch: (b: StudioObject | null, a: StudioObject | null) => void, ctx: ExecuteContext) {
  const moved = new Set([...changes.values()].filter(c => c.before && c.after && JSON.stringify(c.before.geometry) !== JSON.stringify(c.after.geometry)).map(c => c.after!.id))
  const removed = new Set([...changes.values()].filter(c => c.before && !c.after).map(c => c.before!.id))
  if (!moved.size && !removed.size) return
  for (const o of [...objects.values()]) {
    if (o.type === 'Pipe' && (moved.has(String(o.attributes.fromId)) || moved.has(String(o.attributes.toId)))) {
      const a = objects.get(String(o.attributes.fromId)), b = objects.get(String(o.attributes.toId))
      if (!a || !b) continue
      const pa = geo.centroid(a.geometry), pb = geo.centroid(b.geometry)
      const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1])
      touch(o, { ...o, geometry: { type: 'LineString', coordinates: [[pa[0], pa[1]], [pb[0], pb[1]]] }, attributes: { ...o.attributes, lengthFt: round(L) }, modifiedBy: ctx.actorId, modifiedAt: ctx.now })
    }
    if (o.type === 'Dimension' && Array.isArray(o.attributes.refs)) {
      const [ra, rb] = o.attributes.refs as string[]
      if (removed.has(ra) || removed.has(rb)) { touch(o, { ...o, status: 'SUPERSEDED', attributes: { ...o.attributes, orphaned: true }, modifiedBy: ctx.actorId, modifiedAt: ctx.now }); continue }
      if (!moved.has(ra) && !moved.has(rb)) continue
      const A = objects.get(ra), B = objects.get(rb)
      if (!A || !B) continue
      const edge = o.attributes.toEdgeIndex != null ? edgeGeometry(B.geometry, Number(o.attributes.toEdgeIndex)) : B.geometry
      if (!edge) continue
      const { p, q, d } = nearestPair(A.geometry, edge)
      touch(o, { ...o, geometry: { type: 'LineString', coordinates: [p, q] }, attributes: { ...o.attributes, measuredFt: round(d), text: `${round(d, 1)}'` }, modifiedBy: ctx.actorId, modifiedAt: ctx.now })
    }
  }
}

export function edgeGeometry(g: StudioGeometry, i: number): StudioGeometry | null {
  const seg = geo.segmentsOf(g)[i]
  return seg ? { type: 'LineString', coordinates: [seg[0], seg[1]] } : null
}

function specOf(o: StudioObject): NewObjectSpec {
  return { type: o.type, geometry: o.geometry, attributes: { ...o.attributes }, layer: o.layer, discipline: o.discipline, status: o.status === 'EXISTING' ? 'PROPOSED' : o.status, source: 'PROPOSED_DESIGN' }
}

function nearestPair(a: StudioGeometry, b: StudioGeometry): { p: Pos; q: Pos; d: number } {
  let best = { p: [0, 0] as Pos, q: [0, 0] as Pos, d: Infinity }
  const vsA = a.type === 'Point' ? [a.coordinates] : geo.segmentsOf(a).flat()
  const vsB = b.type === 'Point' ? [b.coordinates] : geo.segmentsOf(b).flat()
  for (const v of vsA) { const n = geo.nearestOn(b, [v[0], v[1]]); if (n.distance < best.d) best = { p: [v[0], v[1]], q: n.point, d: n.distance } }
  for (const v of vsB) { const n = geo.nearestOn(a, [v[0], v[1]]); if (n.distance < best.d) best = { p: n.point, q: [v[0], v[1]], d: n.distance } }
  return best
}

function sampleAlong(P: Pos[], step: number) {
  const out: { station: number; x: number; y: number; z: number | null }[] = []
  let s = 0
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1])
    for (let t = i === 1 ? 0 : step - ((s) % step || step); t <= L + 1e-9; t += step) {
      const f = L ? t / L : 0
      const z = a[2] != null && b[2] != null ? a[2] + f * (b[2] - a[2]) : null
      out.push({ station: s + t, x: a[0] + f * (b[0] - a[0]), y: a[1] + f * (b[1] - a[1]), z })
    }
    s += L
  }
  return out
}

function squareEnds(cl: Pos[], width: number): StudioGeometry | null {
  if (cl.length < 2) return null
  const left = geo.offsetLine(cl, width / 2), right = geo.offsetLine(cl, -width / 2)
  return { type: 'Polygon', coordinates: [[...left.map(p => [p[0], p[1]] as Pos), ...[...right].reverse().map(p => [p[0], p[1]] as Pos), [left[0][0], left[0][1]]]] }
}

const ccw = (r: geo.XY[]) => geo.signedArea(r) > 0
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
const numOr = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

export function isMaterial(cmds: StudioCommand[]): boolean {
  return cmds.some(c => !NON_MATERIAL.has(c.action))
}

/** Undo: the inverse of a set of changes, applied to the model they produced. */
export function revertChanges(model: StudioModel, changes: ObjectChange[]): StudioModel {
  const objects = new Map(model.objects.map(o => [o.id, o]))
  for (const ch of [...changes].reverse()) {
    const id = (ch.after ?? ch.before)!.id
    if (ch.before) objects.set(id, ch.before); else objects.delete(id)
  }
  return { ...model, objects: [...objects.values()] }
}
