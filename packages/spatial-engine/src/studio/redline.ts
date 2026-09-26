/**
 * Redlines → structured revision commands.
 *
 * A reviewer marks the plan the way reviewers always have — a cloud, an
 * arrow, a sketch, a cross-out, a note. This turns each markup into the same
 * proposal a drafter would build by hand: the markup's geometry decides WHICH
 * objects it is about, its text decides WHAT to do, and the result goes
 * through the command engine, the rules and the preview like any other change.
 * Nothing a reviewer writes is applied until a person accepts the proposal.
 */

import type { StudioModel, StudioObject, StudioObjectType, Pos, StudioGeometry } from './model'
import { RECORD_SOURCES } from './model'
import { intersects, nearestOn, buffer, lineLength, polygonArea, overlapArea, openRing, pointInPolygon } from './geometry'
import { compileIntent, type CompiledIntent, type IntentRequest } from './intent'
import type { StudioCommand } from './commands'

export type MarkupKind = 'TEXT' | 'CLOUD' | 'ARROW' | 'SKETCH' | 'HIGHLIGHT' | 'CROSS_OUT' | 'OBJECT'

export interface Markup {
  id: string
  kind: MarkupKind
  text?: string | null
  /** Cloud/highlight: polygon. Arrow/sketch/cross-out: line (arrow tip = last vertex). Text: point. */
  geometry?: StudioGeometry | null
  targetIds?: string[]
  /** For OBJECT markups: the object the reviewer drew. */
  object?: { type: StudioObjectType; geometry: StudioGeometry; attributes?: Record<string, unknown> } | null
  author: string
  createdAt: string
}

export interface RedlineInterpretation {
  markupId: string
  targets: string[]
  interpretation: string
  compiled: CompiledIntent
}

/** Objects a markup is about, from its geometry and any explicit targets. */
export function markupTargets(m: StudioModel, mk: Markup): string[] {
  // Explicit targets are the reviewer's own statement of what the markup is about.
  if (mk.targetIds?.length) return [...new Set(mk.targetIds)].filter(id => m.objects.some(o => o.id === id))
  const live = m.objects.filter(o => o.status !== 'SUPERSEDED' && !['Label', 'Annotation', 'Dimension', 'SheetViewport'].includes(o.type))
  const g = mk.geometry
  if (!g) return []
  if (mk.kind === 'ARROW' && g.type === 'LineString') {
    const tip = g.coordinates[g.coordinates.length - 1]
    const near = live.map(o => ({ o, d: nearestOn(o.geometry, [tip[0], tip[1]]).distance })).sort((a, b) => a.d - b.d)[0]
    return near && near.d <= 15 ? [near.o.id] : []
  }
  // Base-map features (the lot, the ROW, the ground) are never inferred as the
  // subject of a cloud or cross-out; a reviewer who means them names them.
  const candidates = live.filter(o => !['ParcelBoundary', 'RightOfWay', 'Lot', 'Contour', 'Road'].includes(o.type))
  if (mk.kind === 'CLOUD' || mk.kind === 'HIGHLIGHT') {
    if (g.type !== 'Polygon') return []
    // What the cloud encloses: at least half of the object inside it.
    const inside = candidates.filter(o => fractionInside(o.geometry, g) >= 0.5)
    return (inside.length ? inside : candidates.filter(o => intersects(o.geometry, g))).map(o => o.id)
  }
  if (mk.kind === 'CROSS_OUT') return candidates.filter(o => intersects(o.geometry, g)).map(o => o.id)
  return []
}

/** Share of an object inside a polygon: by area for polygons, by vertices otherwise. */
function fractionInside(g: StudioGeometry, poly: StudioGeometry): number {
  if (g.type === 'Polygon') { const a = polygonArea(g); return a > 0 ? overlapArea(g, poly) / a : 0 }
  const ring = openRing((poly as any).coordinates[0])
  const v = g.type === 'Point' ? [g.coordinates] : g.coordinates
  return v.filter(p => pointInPolygon([p[0], p[1]], ring)).length / v.length
}

function centroidOf(g: StudioGeometry): [number, number] {
  const v = g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' ? g.coordinates : g.coordinates[0]
  return [v.reduce((s, p) => s + p[0], 0) / v.length, v.reduce((s, p) => s + p[1], 0) / v.length]
}

const SKETCH_TYPES: [RegExp, StudioObjectType][] = [
  [/\bswale\b/, 'Swale'], [/\bdriveway\b/, 'Driveway'], [/\b(walk|sidewalk|path)\b/, 'Sidewalk'], [/\bfence\b/, 'Fence'],
  [/\bretaining wall\b/, 'RetainingWall'], [/\b(storm )?pipe|drain\b/, 'Pipe'], [/\bsilt fence|limit of disturbance|lod\b/, 'Annotation'],
]

export async function interpretRedline(m: StudioModel, mk: Markup, requestedBy: string, llm?: Parameters<typeof compileIntent>[1]): Promise<RedlineInterpretation> {
  const targets = markupTargets(m, mk)
  const text = (mk.text ?? '').trim()
  const base = { requestedBy, origin: 'REDLINE' as const, units: 'ft' as const, note: `redline ${mk.id} by ${mk.author}` }
  const done = (compiled: CompiledIntent, interpretation: string): RedlineInterpretation => ({ markupId: mk.id, targets, interpretation, compiled })

  if (mk.kind === 'CROSS_OUT' && !/\b(move|shift|reduce|increase|make)\b/i.test(text)) {
    if (!targets.length) return done({ kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'The cross-out does not touch any object.', interpretation: 'Cross-out', compiler: 'deterministic' }, 'Cross-out')
    const objs = targets.map(id => m.objects.find(o => o.id === id)!).filter(Boolean)
    const commands: StudioCommand[] = []
    const del = objs.filter(o => o.status === 'PROPOSED').map(o => o.id)
    const demo = objs.filter(o => o.status === 'EXISTING').map(o => o.id)
    if (del.length) commands.push({ ...base, action: 'DELETE_OBJECT', objectIds: del })
    // Crossing out existing work means demolish it — marked, never erased.
    if (demo.length) commands.push({ ...base, action: 'SET_PROPERTY', objectIds: demo, key: 'status', value: 'TO_BE_REMOVED' })
    const what = objs.map(o => String(o.attributes.label ?? o.type)).join(', ')
    return done({ kind: 'PROPOSAL', commands, interpretation: `Remove ${what}${demo.length ? ' (existing items marked to be removed)' : ''}`, dependencies: [], validations: ['setbacks', 'lotCoverage'], compiler: 'deterministic', assumptions: [] }, `Cross-out of ${what}`)
  }

  if (mk.kind === 'OBJECT' && mk.object) {
    return done({ kind: 'PROPOSAL', compiler: 'deterministic', dependencies: [], validations: ['setbacks', 'easements', 'utilityClearance'], assumptions: ['Drawn by the reviewer as markup; proposed design until accepted.'],
      interpretation: `Add the ${mk.object.type} drawn on the redline`, commands: [{ ...base, action: 'ADD_OBJECT', object: { ...mk.object, status: 'PROPOSED' } }] }, `Reviewer-drawn ${mk.object.type}`)
  }

  if (mk.kind === 'SKETCH' && mk.geometry?.type === 'LineString') {
    const t = text.toLowerCase()
    const type = SKETCH_TYPES.find(([re]) => re.test(t))?.[1]
    if (type && type !== 'Pipe') {
      const width = Number(t.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')\s*wide/)?.[1] ?? (type === 'Driveway' ? 12 : type === 'Sidewalk' ? 4 : 0))
      const g: StudioGeometry | null = type === 'Driveway' || type === 'Sidewalk' ? buffer(mk.geometry, width / 2) : mk.geometry
      if (!g) return done({ kind: 'STOP', condition: 'BLOCKED', reason: 'Could not build geometry from the sketch.', interpretation: text, compiler: 'deterministic' }, text)
      const attrs: Record<string, unknown> = { label: `Proposed ${type.toLowerCase()} (redline)`, ...(width ? { widthFt: width } : {}), ...(type === 'Driveway' ? { centerline: mk.geometry.coordinates } : {}), ...(type === 'Swale' ? { bottomWidthFt: 2, sideSlopeZ: 3, depthFt: 1, manningN: 0.035 } : {}) }
      return done({ kind: 'PROPOSAL', compiler: 'deterministic', dependencies: [], validations: ['setbacks', 'easements', 'utilityClearance', 'gradingImpact'], assumptions: [`Sketched alignment, ${Math.round(lineLength(mk.geometry.coordinates))} ft long.`, ...(width ? [`${width} ft wide.`] : [])],
        interpretation: `Add the sketched ${type.toLowerCase()}`, commands: [{ ...base, action: 'ADD_OBJECT', object: { type, geometry: g, status: 'PROPOSED', attributes: attrs } }] }, `Sketch: ${text || type}`)
    }
  }

  if (!text) return done({ kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'The markup has no note. Add what should change.', interpretation: 'Markup without text', compiler: 'deterministic' }, 'Markup without text')
  const req: IntentRequest = { text, mode: 'REDLINE', selection: targets, model: m, requestedBy, origin: 'REDLINE' }
  const compiled = await compileIntent(req, llm)
  return done(compiled, compiled.interpretation)
}

/** Record objects a redline may not reshape — surfaced before the proposal is even built. */
export function redlineTouchesRecord(m: StudioModel, targets: string[]): StudioObject[] {
  return targets.map(id => m.objects.find(o => o.id === id)).filter((o): o is StudioObject => !!o && RECORD_SOURCES.has(o.source))
}

export type { Pos }
