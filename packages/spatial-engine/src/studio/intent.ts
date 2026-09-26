/**
 * The AI command compiler: natural language → inspectable structured intent.
 *
 * Two stages, both of which end in the same typed commands the drawing tools
 * emit:
 *
 *   1. A deterministic parser for the requests professionals make every day
 *      ("move this 4 feet north", "make this driveway 12 feet wide",
 *      "connect this inlet to CB-2"). Same text, same commands, every time.
 *   2. Optionally, a language model for anything the parser does not know. Its
 *      output is JSON that must pass `acceptLlmCompilation` — every command is
 *      schema-checked, every object id must exist, the origin is forced to AI
 *      — before it may become a proposal.
 *
 * Neither stage applies anything. The result is a proposal to preview, a
 * calculation to run, a check, an answer, or a STOP that says what is missing.
 */

import { type StudioModel, type StudioObject, type StudioObjectType, STUDIO_OBJECT_TYPES, type Pos, verticesOf } from './model'
import { type StudioCommand, COMMAND_ACTIONS, validateCommand, type XYv } from './commands'
import { type CopilotMode, MUTATING_MODES } from './access'
import { evaluateRules, type RuleResult } from './rules'
import { centroid, buffer, segmentsOf, openRing, polygonArea, nearestOn } from './geometry'
import { interpolateElevation, surfaceSamples, drivewayProfile } from './calculations'
import { peakDischargeRational } from '../site-plan/engineering'
import type { StopCondition } from './proposals'

export interface IntentRequest {
  text: string
  mode: CopilotMode
  selection: string[]
  model: StudioModel
  requestedBy: string
  origin?: 'AI' | 'REDLINE'
}

export type CompiledIntent =
  | { kind: 'PROPOSAL'; commands: StudioCommand[]; interpretation: string; dependencies: string[]; validations: string[]; compiler: 'deterministic' | 'llm'; assumptions: string[] }
  | { kind: 'ALTERNATIVES'; alternatives: { label: string; commands: StudioCommand[] }[]; interpretation: string; validations: string[]; compiler: 'deterministic' | 'llm'; assumptions: string[] }
  | { kind: 'CALCULATION'; calculations: { calcId: string; inputs: Record<string, unknown> }[]; interpretation: string; compiler: 'deterministic' | 'llm'; assumptions: string[] }
  | { kind: 'CHECK'; codes: string[] | null; interpretation: string; compiler: 'deterministic' }
  | { kind: 'ANSWER'; answer: string; interpretation: string; compiler: 'deterministic' | 'llm'; basis: string[] }
  | { kind: 'RENDER'; interpretation: string; compiler: 'deterministic' }
  | { kind: 'STOP'; condition: StopCondition; reason: string; interpretation: string; compiler: 'deterministic' | 'llm' }

const DEFAULT_VALIDATIONS = ['setbacks', 'easements', 'lotCoverage', 'utilityClearance', 'gradingImpact', 'stormwaterImpact']

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, 'twenty-five': 25, thirty: 30, half: 0.5,
}
const DIRS: Record<string, [number, number]> = {
  north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0], up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0],
  northeast: [Math.SQRT1_2, Math.SQRT1_2], northwest: [-Math.SQRT1_2, Math.SQRT1_2], southeast: [Math.SQRT1_2, -Math.SQRT1_2], southwest: [-Math.SQRT1_2, -Math.SQRT1_2],
}
const TYPE_WORDS: [RegExp, StudioObjectType][] = [
  [/\b(house|dwelling|building|home|footprint)\b/, 'BuildingFootprint'], [/\bdriveway\b/, 'Driveway'], [/\bsidewalk|walk\b/, 'Sidewalk'],
  [/\binlet|catch ?basin|\bcb\b/, 'Inlet'], [/\bmanhole|\bmh\b/, 'Manhole'], [/\boutfall\b/, 'Outfall'], [/\b(storm )?pipe\b/, 'Pipe'],
  [/\bswale\b/, 'Swale'], [/\bpad\b/, 'GradingPad'], [/\bfence\b/, 'Fence'], [/\bretaining wall\b/, 'RetainingWall'],
  [/\bwater ?line|water main\b/, 'WaterLine'], [/\bsewer\b/, 'SewerLine'], [/\btree\b/, 'Tree'], [/\beasement\b/, 'Easement'],
  [/\b(property|lot) line|boundary|parcel\b/, 'ParcelBoundary'], [/\bcontour\b/, 'Contour'],
]

function num(s: string): number | null {
  const t = s.trim().toLowerCase()
  if (t in NUMBER_WORDS) return NUMBER_WORDS[t]
  const n = Number(t.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const NUM = String.raw`(\d+(?:\.\d+)?|${Object.keys(NUMBER_WORDS).join('|')})`
const FT = String.raw`\s*(?:-|\s)?(?:feet|foot|ft|')`

/** Objects a phrase refers to: the selection for "this/it/selected", else by label or by type. */
export function resolveTargets(text: string, model: StudioModel, selection: string[]): StudioObject[] {
  const t = text.toLowerCase()
  const live = model.objects.filter(o => o.status !== 'SUPERSEDED')
  if (/\b(this|these|it|selected|selection|them)\b/.test(t) && selection.length) return live.filter(o => selection.includes(o.id))
  const byLabel = live.filter(o => typeof o.attributes.label === 'string' && new RegExp(`\\b${escape(String(o.attributes.label).toLowerCase())}\\b`).test(t))
  if (byLabel.length) return byLabel
  for (const [re, type] of TYPE_WORDS) {
    if (!re.test(t)) continue
    const all = live.filter(o => o.type === type)
    const proposed = all.filter(o => o.status === 'PROPOSED')
    if (/\bexisting\b/.test(t)) return all.filter(o => o.status === 'EXISTING')
    return proposed.length ? proposed : all
  }
  return selection.length ? live.filter(o => selection.includes(o.id)) : []
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function labelOf(o: StudioObject) { return String(o.attributes.label ?? `${o.type} ${o.id.slice(0, 6)}`) }

/** Compile with the deterministic parser; fall through to `llm` when given and the parser has nothing. */
export async function compileIntent(req: IntentRequest, llm?: (req: IntentRequest, schema: string) => Promise<string>): Promise<CompiledIntent> {
  const det = compileDeterministic(req)
  let out: CompiledIntent = det
  if (det.kind === 'STOP' && det.condition === 'REQUIRES_INPUT' && det.reason.startsWith('UNRECOGNISED') && llm) {
    try {
      const raw = await llm(req, llmSchemaDescription(req.model))
      out = acceptLlmCompilation(raw, req)
    } catch (e) {
      out = { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `The language model did not return a usable command: ${e instanceof Error ? e.message : String(e)}`, interpretation: req.text, compiler: 'llm' }
    }
  }
  return enforceMode(out, req.mode)
}

/** ASK, EXPLAIN, CHECK and CALCULATE never return mutations, whatever the text says. */
export function enforceMode(c: CompiledIntent, mode: CopilotMode): CompiledIntent {
  const mutating = c.kind === 'PROPOSAL' || c.kind === 'ALTERNATIVES'
  if (mutating && !MUTATING_MODES.has(mode)) {
    return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `${mode} mode does not change the plan. Switch to EDIT or DRAFT to propose: ${c.interpretation}`, interpretation: c.interpretation, compiler: c.compiler }
  }
  if (mode === 'OPTIMIZE' && c.kind === 'PROPOSAL') return { kind: 'ALTERNATIVES', alternatives: [{ label: 'As requested', commands: c.commands }], interpretation: c.interpretation, validations: c.validations, compiler: c.compiler, assumptions: c.assumptions }
  if (mode === 'ISSUE') return { kind: 'STOP', condition: 'REQUIRES_PROFESSIONAL_REVIEW', reason: 'Issuance is a professional act performed from the issuance controls, never by a prompt.', interpretation: c.interpretation, compiler: 'deterministic' }
  return c
}

export function compileDeterministic(req: IntentRequest): CompiledIntent {
  const text = req.text.trim(), t = text.toLowerCase().replace(/[“”]/g, '"')
  const m = req.model
  const base = { requestedBy: req.requestedBy, origin: (req.origin ?? 'AI') as 'AI' | 'REDLINE', units: 'ft' as const }
  const targets = () => resolveTargets(t, m, req.selection)
  const need = (what: string): CompiledIntent => ({ kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `Which ${what}? Select it on the canvas or name it.`, interpretation: text, compiler: 'deterministic' })
  const proposal = (commands: StudioCommand[], interpretation: string, extra: { dependencies?: string[]; assumptions?: string[] } = {}): CompiledIntent =>
    ({ kind: 'PROPOSAL', commands, interpretation, dependencies: extra.dependencies ?? [], validations: DEFAULT_VALIDATIONS, compiler: 'deterministic', assumptions: extra.assumptions ?? [] })

  // ── Explanations and checks (never mutate) ───────────────────────────────
  if (/\b(explain|why)\b/.test(t) && /\b(fail|failed|failing|conflict|violat|wrong)/.test(t)) {
    const rules = evaluateRules(m).filter(r => r.status === 'FAIL' || r.status === 'BLOCKED' || r.status === 'REQUIRES_REVIEW')
    return { kind: 'ANSWER', answer: explainRules(rules), interpretation: 'Explain the failing and unresolved rules', compiler: 'deterministic', basis: rules.map(r => r.key) }
  }
  if (/\b(check|verify|show)\b/.test(t) && /\bsetbacks?\b/.test(t)) return { kind: 'CHECK', codes: ['SETBACK_FRONT', 'SETBACK_SIDE', 'SETBACK_REAR', 'BUILDABLE_AREA'], interpretation: 'Check every setback against the governing requirement', compiler: 'deterministic' }
  if (/\b(show|list|find|check)\b.*\b(conflicts?|clashes?|violations?|problems?|issues?)\b/.test(t) || /^check (the |this )?(whole |entire )?plan/.test(t)) return { kind: 'CHECK', codes: null, interpretation: 'Run every design check', compiler: 'deterministic' }
  if (/\b(prepare|regenerate|render|produce|update)\b.*\bsheets?\b/.test(t)) return { kind: 'RENDER', interpretation: 'Regenerate the sheet set from the current revision', compiler: 'deterministic' }

  // ── Calculations ─────────────────────────────────────────────────────────
  if (/\b(calculate|compute|what is|what's|run)\b.*\b(drainage|runoff|peak flow|flow|discharge)\b/.test(t) && !/\bpipe\b/.test(t)) {
    const i = m.design?.rainfallIntensityInPerHr
    const lot = m.objects.find(o => o.type === 'ParcelBoundary')
    if (!lot) return need('drainage area (no parcel boundary in the model)')
    if (i == null) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'No design rainfall intensity on the project. Set it from NOAA Atlas 14 for the site and storm before the Rational Method can run.', interpretation: 'Rational Method peak flow for the lot', compiler: 'deterministic' }
    return {
      kind: 'CALCULATION', compiler: 'deterministic', interpretation: `Rational Method peak flow for the lot at ${i} in/hr`,
      calculations: [{ calcId: 'runoff_coefficient', inputs: {} }, { calcId: 'rational_method', inputs: { runoffCoefficient: '$runoff_coefficient.compositeC', intensityInPerHr: i, areaAcres: round(polygonArea(lot.geometry) / 43560, 4) } }],
      assumptions: [`Intensity ${i} in/hr — ${m.design?.intensitySource ?? 'source not stated'}`],
    }
  }
  if (/\b(calculate|check|what is|what's)\b.*\bpipe capacity\b|\bcapacity of (this|the) pipe\b/.test(t)) {
    const p = targets().find(o => o.type === 'Pipe') ?? m.objects.find(o => o.type === 'Pipe')
    if (!p) return need('pipe')
    return { kind: 'CALCULATION', compiler: 'deterministic', interpretation: `Manning full-flow capacity of ${labelOf(p)}`, assumptions: [], calculations: [{ calcId: 'pipe_capacity', inputs: { diameterIn: p.attributes.diameterIn, slopeFtPerFt: p.attributes.slopeFtPerFt, manningN: p.attributes.manningN ?? 0.013, designFlowCfs: p.attributes.designFlowCfs ?? undefined } }] }
  }
  if (/\b(lot )?coverage\b/.test(t) && /\b(calculate|what|check)\b/.test(t)) return { kind: 'CALCULATION', compiler: 'deterministic', interpretation: 'Lot coverage', assumptions: [], calculations: [{ calcId: 'lot_coverage', inputs: {} }] }
  if (/\bimpervious\b/.test(t)) return { kind: 'CALCULATION', compiler: 'deterministic', interpretation: 'Impervious area', assumptions: [], calculations: [{ calcId: 'impervious_area', inputs: {} }] }
  if (/\b(cut|fill|earthwork)\b/.test(t)) {
    const pad = targets().find(o => o.type === 'GradingPad') ?? m.objects.find(o => o.type === 'GradingPad' && o.status === 'PROPOSED')
    if (!pad) return need('grading pad')
    return { kind: 'CALCULATION', compiler: 'deterministic', interpretation: `Earthwork for ${labelOf(pad)}`, assumptions: [], calculations: [{ calcId: 'cut_fill', inputs: { padId: pad.id } }] }
  }

  // ── Edits ────────────────────────────────────────────────────────────────
  let mm: RegExpMatchArray | null
  if ((mm = t.match(new RegExp(`\\b(?:move|shift|slide|nudge)\\b.*?${NUM}${FT}\\s*(?:to the\\s*)?(north|south|east|west|northeast|northwest|southeast|southwest|up|down|left|right)`)))) {
    const d = num(mm[1])!, dir = DIRS[mm[2]]
    const ts = targets().filter(o => o.status === 'PROPOSED' || req.selection.includes(o.id))
    if (!ts.length) return need('object to move')
    const v = { x: round(dir[0] * d, 4), y: round(dir[1] * d, 4) }
    const deps = dependentsOf(m, ts.map(o => o.id))
    return proposal([{ ...base, action: 'MOVE_OBJECT', objectIds: ts.map(o => o.id), vector: v }], `Move ${ts.map(labelOf).join(', ')} ${d} ft ${mm[2]}`, { dependencies: deps })
  }
  if ((mm = t.match(new RegExp(`\\brotate\\b.*?${NUM}\\s*(?:degrees?|°)\\s*(clockwise|counter-?clockwise|anti-?clockwise|cw|ccw)?`)))) {
    const ts = targets(); if (!ts.length) return need('object to rotate')
    const a = num(mm[1])! * (/^(clockwise|cw)$/.test(mm[2] ?? '') ? -1 : 1)
    return proposal([{ ...base, action: 'ROTATE_OBJECT', objectIds: ts.map(o => o.id), angleDeg: a }], `Rotate ${ts.map(labelOf).join(', ')} ${Math.abs(a)}° ${a < 0 ? 'clockwise' : 'counter-clockwise'}`)
  }
  if ((mm = t.match(new RegExp(`\\b(?:make|set|increase|widen|change|reduce)\\b.*\\bdriveway\\b.*?${NUM}${FT}\\s*wide|\\bdriveway width\\b.*?${NUM}`))) || (/\bdriveway\b/.test(t) && (mm = t.match(new RegExp(`${NUM}${FT}\\s*wide`))))) {
    const w = num(mm[1] ?? mm[2])!
    const dw = targets().find(o => o.type === 'Driveway') ?? m.objects.find(o => o.type === 'Driveway' && o.status === 'PROPOSED')
    if (!dw) {
      if (/\badd|create|draw\b/.test(t)) return addDriveway(req, w, base)
      return need('driveway')
    }
    return proposal([{ ...base, action: 'SET_PROPERTY', objectIds: [dw.id], key: 'widthFt', value: w }], `Make ${labelOf(dw)} ${w} ft wide`)
  }
  if ((mm = t.match(new RegExp(`\\b(?:add|create|draw)\\b.*?${NUM}${FT}\\s*(?:wide\\s*)?driveway`)))) return addDriveway(req, num(mm[1])!, base)
  if ((mm = t.match(/\b(?:maintain|keep|limit|reduce|make)\b.*?(?:max(?:imum)?|below|under|less than|at most|no more than)?\s*(\d+(?:\.\d+)?)\s*%/)) && (/\b(slope|grade)\b/.test(t) || /\b(section|driveway|walk|ramp)\b/.test(t))) {
    const limit = Number(mm[1]), strictly = /\b(below|under|less than)\b/.test(t)
    const target = targets().find(o => o.type === 'Driveway' || o.geometry.type === 'LineString')
    if (!target) return need('driveway or alignment to grade')
    const prof = drivewayProfile(target, m)
    const holdEnd = /\b(garage|house|building|slab|ffe|finished floor)\b/.test(t) ? 'end' : 'start'
    if (!prof) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `${labelOf(target)} has no elevations. Set the elevation at the ${holdEnd === 'end' ? 'garage' : 'street'} end first.`, interpretation: text, compiler: 'deterministic' }
    const sign = Math.sign(prof[prof.length - 1][2] - prof[0][2]) || 1
    const pct = strictly ? round(limit - 0.1, 1) : limit
    // Held at the garage, the slope runs from the garage toward the street:
    // opposite sign to the street-to-garage profile.
    const slopePct = holdEnd === 'end' ? -sign * pct : sign * pct
    return proposal([{ ...base, action: 'SET_SLOPE', objectId: target.id, slopePct, hold: holdEnd, holdElevationFt: holdEnd === 'end' ? prof[prof.length - 1][2] : prof[0][2] }],
      `Regrade ${labelOf(target)} to ${pct}% holding the ${holdEnd === 'end' ? 'garage' : 'street'} elevation`,
      { assumptions: [`Constant grade; the ${holdEnd === 'end' ? 'garage' : 'street'} end elevation ${holdEnd === 'end' ? prof[prof.length - 1][2] : prof[0][2]} ft is held.`, 'Transition grades at the apron and garage are a professional refinement.'] })
  }
  if ((mm = t.match(/\bconnect\b\s+(.+?)\s+to\s+(.+)$/)) || /\bsize\b.*\b(connecting|outlet|storm) pipe\b/.test(t)) {
    let from: StudioObject | undefined, to: StudioObject | undefined
    if (mm) {
      from = resolveTargets(mm[1], m, req.selection).find(o => ['Inlet', 'Manhole', 'Outfall', 'StormwaterFacility'].includes(o.type))
      to = resolveTargets(mm[2], m, []).find(o => ['Inlet', 'Manhole', 'Outfall', 'StormwaterFacility'].includes(o.type) && o.id !== from?.id)
    } else {
      from = targets().find(o => o.type === 'Inlet') ?? m.objects.find(o => o.type === 'Inlet' && o.status === 'PROPOSED')
      const down = from?.attributes.outletTo ? m.objects.find(o => o.id === from!.attributes.outletTo || o.attributes.label === from!.attributes.outletTo) : null
      to = down ?? nearestStructure(m, from)
    }
    if (!from) return need('upstream structure')
    if (!to) return need('downstream structure')
    const q = designFlowAt(from, m)
    if (q.flow == null) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `No design flow at ${labelOf(from)}: ${q.reason}`, interpretation: text, compiler: 'deterministic' }
    return proposal([{ ...base, action: 'ROUTE_PIPE', fromId: from.id, toId: to.id, designFlowCfs: q.flow, manningN: 0.013 }],
      `Size and route a storm pipe from ${labelOf(from)} to ${labelOf(to)} for ${q.flow} cfs`, { assumptions: [q.basis, 'RCP, n = 0.013; smallest standard diameter ≥ 15 in that carries the flow flowing full.'] })
  }
  if ((mm = t.match(new RegExp(`\\boffset\\b.*?${NUM}${FT}\\s*(in|inward|out|outward|left|right)?`)))) {
    const o = targets()[0]; if (!o) return need('object to offset')
    const d = num(mm[1])!, side = (mm[2] ?? 'out').startsWith('in') ? 'in' : (mm[2] ?? 'out').startsWith('out') ? 'out' : mm[2] as 'left' | 'right'
    return proposal([{ ...base, action: 'OFFSET', objectId: o.id, distanceFt: d, side: o.geometry.type === 'LineString' ? (side === 'in' ? 'right' : side === 'out' ? 'left' : side) : side }], `Offset ${labelOf(o)} ${d} ft`)
  }
  if (/\bdimension/.test(t) && /\b(property|lot) lines?\b/.test(t)) {
    const b = targets().find(o => o.type === 'BuildingFootprint') ?? m.objects.find(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')
    const lot = m.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')
    if (!b) return need('building'); if (!lot) return need('parcel boundary')
    const n = segmentsOf(lot.geometry).length
    return proposal(Array.from({ length: n }, (_, i) => ({ ...base, action: 'DIMENSION' as const, fromObjectId: b.id, toObjectId: lot.id, toEdgeIndex: i })), `Dimension ${labelOf(b)} to each of the ${n} property lines`)
  }
  if (/\b(delete|remove|erase)\b/.test(t)) {
    const ts = targets(); if (!ts.length) return need('object to delete')
    return proposal([{ ...base, action: 'DELETE_OBJECT', objectIds: ts.map(o => o.id) }], `Delete ${ts.map(labelOf).join(', ')}`)
  }
  if ((mm = t.match(/\b(?:set|make)\b.*\belevation\b.*?(\d+(?:\.\d+)?)/))) {
    const o = targets()[0]; if (!o) return need('object')
    return proposal([{ ...base, action: 'SET_ELEVATION', objectId: o.id, elevationFt: Number(mm[1]) }], `Set ${labelOf(o)} to elevation ${mm[1]} ft`)
  }
  if ((mm = text.match(/\blabel\b[^"]*"([^"]+)"/i))) {
    const o = targets()[0], c = o ? centroid(o.geometry) : null
    if (!c) return need('object to label')
    return proposal([{ ...base, action: 'LABEL', text: mm[1], at: { x: c[0], y: c[1] }, targetId: o!.id }], `Label ${labelOf(o!)} "${mm[1]}"`)
  }
  if (/\b(proposed )?grading\b.*\baround\b|\bgrade around\b|\bcreate (a )?pad\b/.test(t)) return gradeAround(req, base)
  if (/\b(show|create|generate|draw)\b.*\bproposed contours?\b/.test(t)) return proposedContours(req, base)
  if (/\bsetback lines?\b/.test(t) && /\b(create|add|draw|show)\b/.test(t)) return proposal([{ ...base, action: 'CREATE_SETBACK' }], 'Draw the setback (building restriction) lines from the governing requirements')
  if (/\bbuildable (area|envelope)\b/.test(t) && /\b(create|add|draw|show|compute)\b/.test(t)) return proposal([{ ...base, action: 'CREATE_BUILDABLE_AREA' }], 'Compute the buildable area from the governing setbacks')
  if ((mm = t.match(new RegExp(`${NUM}${FT}\\s*buffer`)))) {
    const o = targets()[0]; if (!o) return need('object to buffer')
    return proposal([{ ...base, action: 'CREATE_BUFFER', objectId: o.id, distanceFt: num(mm[1])!, bufferType: /stream/.test(t) ? 'stream' : /tree|root/.test(t) ? 'tree protection' : 'buffer' }], `Buffer ${labelOf(o)} by ${mm[1]} ft`)
  }
  if (/\b(optimi[sz]e|best position|best location|alternatives?)\b/.test(t) && /\b(house|building|dwelling)\b/.test(t)) return optimiseHouse(req, base)

  if (req.mode === 'ASK' || req.mode === 'EXPLAIN') {
    return { kind: 'ANSWER', answer: describeModel(m), interpretation: 'Describe the project', compiler: 'deterministic', basis: [] }
  }
  return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: `UNRECOGNISED: the deterministic compiler does not recognise "${text}". Rephrase, or use a drawing tool.`, interpretation: text, compiler: 'deterministic' }
}

// ── Composite intents ──────────────────────────────────────────────────────

function addDriveway(req: IntentRequest, widthFt: number, base: any): CompiledIntent {
  const m = req.model
  const house = m.objects.find(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')
  const lot = m.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED')
  if (!house || !lot || lot.geometry.type !== 'Polygon') return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'A driveway needs a proposed house and a lot with a classified front line.', interpretation: req.text, compiler: 'deterministic' }
  const yards = (lot.attributes.edgeYards as string[] | undefined) ?? []
  const fi = yards.indexOf('front')
  if (fi < 0) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'The front lot line is not classified; the driveway cannot be oriented.', interpretation: req.text, compiler: 'deterministic' }
  const [a, b] = segmentsOf(lot.geometry)[fi]
  const hc = centroid(house.geometry)
  const onFront = nearestOn({ type: 'LineString', coordinates: [a, b] }, hc).point
  const onHouse = nearestOn(house.geometry, onFront).point
  const cl: Pos[] = [[onFront[0], onFront[1]], [onHouse[0], onHouse[1]]]
  const samples = surfaceSamples(m, 'existing')
  const z = (p: Pos) => interpolateElevation(samples, p[0], p[1])?.z
  const ffe = Number(house.attributes.finishedFloorFt)
  const z0 = z(cl[0]), z1 = Number.isFinite(ffe) ? ffe - 0.5 : z(cl[1])
  const cl3 = z0 != null && z1 != null ? [[cl[0][0], cl[0][1], round(z0, 2)], [cl[1][0], cl[1][1], round(z1, 2)]] as Pos[] : cl
  const slab = buffer({ type: 'LineString', coordinates: cl }, widthFt / 2)
  if (!slab) return { kind: 'STOP', condition: 'BLOCKED', reason: 'Could not build the driveway geometry.', interpretation: req.text, compiler: 'deterministic' }
  return {
    kind: 'PROPOSAL', compiler: 'deterministic', validations: DEFAULT_VALIDATIONS, dependencies: [house.id, lot.id],
    interpretation: `Add a ${widthFt} ft driveway from the front lot line to the proposed house`,
    commands: [{ ...base, action: 'ADD_OBJECT', object: { type: 'Driveway', geometry: slab, status: 'PROPOSED', attributes: { widthFt, centerline: cl3, label: 'Proposed driveway' } } }],
    assumptions: ['Straight driveway on the shortest line from the front lot line to the house.', z1 != null && Number.isFinite(ffe) ? 'Garage end 0.5 ft below the finished floor.' : 'Garage end at existing grade (no finished floor stated).'],
  }
}

function gradeAround(req: IntentRequest, base: any): CompiledIntent {
  const m = req.model
  const house = resolveTargets(req.text, m, req.selection).find(o => o.type === 'BuildingFootprint') ?? m.objects.find(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')
  if (!house) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'Which building?', interpretation: req.text, compiler: 'deterministic' }
  const samples = surfaceSamples(m, 'existing')
  const corners = openRing((house.geometry as any).coordinates[0]).map(p => interpolateElevation(samples, p[0], p[1])?.z).filter((z): z is number => z != null)
  const ffe = Number(house.attributes.finishedFloorFt)
  if (!Number.isFinite(ffe) && !corners.length) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'No finished floor elevation and no existing surface to derive one.', interpretation: req.text, compiler: 'deterministic' }
  // Positive drainage: the pad at FFE − 0.67 ft (8 in reveal), FFE from the
  // highest existing corner + 1 ft where none is stated.
  const floor = Number.isFinite(ffe) ? ffe : round(Math.max(...corners) + 1, 1)
  const pad = round(floor - 0.67, 2)
  const commands: StudioCommand[] = []
  if (!Number.isFinite(ffe)) commands.push({ ...base, action: 'SET_PROPERTY', objectIds: [house.id], key: 'finishedFloorFt', value: floor })
  commands.push({ ...base, action: 'CREATE_PAD', aroundObjectId: house.id, offsetFt: 10, elevationFt: pad, sideSlopeH: 3 })
  const contours = contourRings(house.geometry, pad, samples, 10)
  for (const c of contours) commands.push({ ...base, action: 'CREATE_CONTOUR', coordinates: c.ring, elevationFt: c.z, proposed: true })
  return {
    kind: 'PROPOSAL', compiler: 'deterministic', validations: DEFAULT_VALIDATIONS, dependencies: [house.id],
    interpretation: `Grade a pad 10 ft around ${labelOf(house)} at ${pad} ft with 3:1 slopes to existing ground`,
    commands, assumptions: [
      Number.isFinite(ffe) ? `FFE ${floor} ft as stated.` : `FFE ${floor} ft = highest existing corner + 1 ft (assumed — confirm with the architect).`,
      'Pad 0.67 ft below FFE; 10 ft pad width around the house; 3H:1V daylight slopes.',
      'Proposed contours are pad offsets at whole-foot elevations until they meet existing grade — a screening grading plan, not a final design.',
    ],
  }
}

function contourRings(house: StudioObject['geometry'], padZ: number, samples: ReturnType<typeof surfaceSamples>, padOffset: number) {
  const out: { ring: XYv[]; z: number }[] = []
  if (samples.length < 3) return out
  for (let k = 0; k < 12; k++) {
    const z = Math.floor(padZ) - k
    if (z >= padZ) continue
    const d = padOffset + (padZ - z) * 3
    const g = buffer(house, d)
    if (!g || g.type !== 'Polygon') break
    const ring = openRing(g.coordinates[0])
    const ex = ring.map(p => interpolateElevation(samples, p[0], p[1])!.z)
    const above = ex.filter(e => e > z).length / ex.length
    if (above > 0.9) break // daylighted: the ring is under existing ground everywhere
    out.push({ ring: ring.map(p => ({ x: round(p[0], 2), y: round(p[1], 2) })), z })
  }
  return out
}

function proposedContours(req: IntentRequest, base: any): CompiledIntent {
  const m = req.model
  const pad = m.objects.find(o => o.type === 'GradingPad' && o.status === 'PROPOSED')
  if (!pad) return gradeAround(req, base)
  const around = m.objects.find(o => o.id === pad.attributes.around)
  const samples = surfaceSamples(m, 'existing')
  const z = Number(pad.attributes.elevationFt)
  const rings = around ? contourRings(around.geometry, z, samples, 10) : []
  if (!rings.length) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'No existing surface to daylight the pad into.', interpretation: req.text, compiler: 'deterministic' }
  return { kind: 'PROPOSAL', compiler: 'deterministic', validations: DEFAULT_VALIDATIONS, dependencies: [pad.id], interpretation: `Proposed contours from the ${z} ft pad`, commands: rings.map(r => ({ ...base, action: 'CREATE_CONTOUR', coordinates: r.ring, elevationFt: r.z, proposed: true })), assumptions: ['3H:1V from the pad edge to existing grade.'] }
}

function optimiseHouse(req: IntentRequest, base: any): CompiledIntent {
  const m = req.model
  const house = m.objects.find(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')
  if (!house) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'No proposed house.', interpretation: req.text, compiler: 'deterministic' }
  const env = m.objects.find(o => o.type === 'BuildableArea' && o.status !== 'SUPERSEDED')
  if (!env) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'Compute the buildable area first ("create the buildable area").', interpretation: req.text, compiler: 'deterministic' }
  const hc = centroid(house.geometry), ec = centroid(env.geometry)
  const cands: { label: string; v: XYv }[] = [
    { label: 'Centred in the buildable area', v: { x: ec[0] - hc[0], y: ec[1] - hc[1] } },
  ]
  for (const [lbl, dx, dy] of [['5 ft east', 5, 0], ['5 ft west', -5, 0], ['5 ft north', 0, 5], ['5 ft south', 0, -5]] as const) cands.push({ label: lbl, v: { x: dx, y: dy } })
  const scored = cands.map(c => {
    const moved = { ...m, objects: m.objects.map(o => (o.id === house.id ? { ...o, geometry: translateGeom(o.geometry, c.v) } : o)) }
    const fails = evaluateRules(moved).filter(r => r.status === 'FAIL').length
    return { ...c, fails }
  }).sort((a, b) => a.fails - b.fails).slice(0, 3)
  return {
    kind: 'ALTERNATIVES', compiler: 'deterministic', validations: DEFAULT_VALIDATIONS, assumptions: ['Alternatives are ranked by the number of failing checks; none is applied until accepted.'],
    interpretation: 'Alternative positions for the proposed house',
    alternatives: scored.map(s => ({ label: `${s.label} (${s.fails} failing check${s.fails === 1 ? '' : 's'})`, commands: [{ ...base, action: 'MOVE_OBJECT', objectIds: [house.id], vector: { x: round(s.v.x, 2), y: round(s.v.y, 2) } }] })),
  }
}

function translateGeom(g: StudioObject['geometry'], v: XYv): StudioObject['geometry'] {
  const f = (p: Pos): Pos => (p.length === 3 ? [p[0] + v.x, p[1] + v.y, p[2]] : [p[0] + v.x, p[1] + v.y])
  if (g.type === 'Point') return { type: 'Point', coordinates: f(g.coordinates) }
  if (g.type === 'LineString') return { type: 'LineString', coordinates: g.coordinates.map(f) }
  return { type: 'Polygon', coordinates: g.coordinates.map(r => r.map(f)) }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Objects that will change because these do: pipes on structures, dimensions on either end. */
export function dependentsOf(m: StudioModel, ids: string[]): string[] {
  return m.objects.filter(o =>
    (o.type === 'Pipe' && (ids.includes(String(o.attributes.fromId)) || ids.includes(String(o.attributes.toId)))) ||
    (o.type === 'Dimension' && Array.isArray(o.attributes.refs) && (o.attributes.refs as string[]).some(r => ids.includes(r)))).map(o => o.id)
}

function nearestStructure(m: StudioModel, from?: StudioObject): StudioObject | undefined {
  if (!from) return undefined
  const c = centroid(from.geometry)
  return m.objects.filter(o => o.id !== from.id && ['Manhole', 'Outfall', 'Inlet', 'StormwaterFacility'].includes(o.type))
    .sort((a, b) => dist(centroid(a.geometry), c) - dist(centroid(b.geometry), c))[0]
}
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Design flow at a structure: stated, or Rational Method from its drainage area with the project intensity. */
export function designFlowAt(o: StudioObject, m: StudioModel): { flow: number | null; basis: string; reason: string } {
  if (o.attributes.designFlowCfs != null) return { flow: Number(o.attributes.designFlowCfs), basis: `Design flow ${o.attributes.designFlowCfs} cfs as stated on ${labelOf(o)}.`, reason: '' }
  const A = Number(o.attributes.drainageAreaAcres), C = Number(o.attributes.runoffCoefficient), i = m.design?.rainfallIntensityInPerHr
  if (Number.isFinite(A) && Number.isFinite(C) && i != null) {
    const q = peakDischargeRational(C, i, A)
    return { flow: q.value, basis: `Q = C·i·A = ${C} × ${i} × ${A} = ${q.value} cfs (Rational Method; intensity ${m.design?.intensitySource ?? 'source not stated'}).`, reason: '' }
  }
  const missing = [!Number.isFinite(A) && 'drainage area', !Number.isFinite(C) && 'runoff coefficient', i == null && 'design rainfall intensity'].filter(Boolean)
  return { flow: null, basis: '', reason: `missing ${missing.join(', ')}.` }
}

export function explainRules(rules: RuleResult[]): string {
  if (!rules.length) return 'Every design check passes, and no requirement is awaiting review.'
  return rules.map(r => {
    const lines = [`${r.title}: ${r.status.replace(/_/g, ' ')} — ${r.result}.`]
    if (r.trace.required) lines.push(`  Required ${r.trace.required}${r.citation ? ` (${r.citation})` : ''}; measured ${r.trace.measured ?? 'n/a'} by ${r.trace.method}.`)
    if (r.ruleVersion || r.effectiveDate) lines.push(`  Rule ${r.ruleSource ?? ''} ${r.ruleVersion ?? ''}${r.effectiveDate ? `, effective ${r.effectiveDate}` : ''}.`)
    if (r.requiredReview) lines.push(`  Needs ${r.requiredReview.discipline.replace(/_/g, ' ')}: ${r.requiredReview.reason}.`)
    return lines.join('\n')
  }).join('\n')
}

function describeModel(m: StudioModel): string {
  const counts = new Map<string, number>()
  for (const o of m.objects.filter(o => o.status !== 'SUPERSEDED')) counts.set(o.type, (counts.get(o.type) ?? 0) + 1)
  const z = m.zoning
  return `Revision ${m.revision}. ${[...counts].map(([k, v]) => `${v} ${k}`).join(', ')}.` +
    (z ? ` Zone ${z.zone ?? 'unknown'} (${z.jurisdictionCode}): front ${z.frontFt ?? '?'} ft, side ${z.sideFt ?? '?'} ft, rear ${z.rearFt ?? '?'} ft — ${z.citation ?? 'no citation'} [${z.certification}].` : ' No zoning context.')
}

// ── Language-model gate ────────────────────────────────────────────────────

/** The JSON contract given to the model. It can only speak these commands. */
export function llmSchemaDescription(m: StudioModel): string {
  const objs = m.objects.filter(o => o.status !== 'SUPERSEDED').slice(0, 200).map(o => ({ id: o.id, type: o.type, status: o.status, label: o.attributes.label ?? null, centroid: centroid(o.geometry).map(v => round(v, 1)), source: o.source }))
  return JSON.stringify({
    instructions: 'Return ONLY JSON: {"interpretation": string, "commands": StudioCommand[]} or {"interpretation": string, "calculations": [{"calcId": string, "inputs": object}]} or {"interpretation": string, "answer": string}. Never compute engineering numbers yourself — request a calculation. Use only object ids listed. Coordinates are feet in the project CRS, +x east, +y north. Do not set source, confidence, certification or seal properties.',
    commandActions: COMMAND_ACTIONS,
    objectTypes: STUDIO_OBJECT_TYPES,
    objects: objs,
  })
}

/** Validates model output. Anything off-contract becomes a STOP, never a command. */
export function acceptLlmCompilation(raw: string, req: IntentRequest): CompiledIntent {
  const jsonText = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  let parsed: any
  try { parsed = JSON.parse(jsonText) } catch { return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'The language model returned text that is not JSON.', interpretation: req.text, compiler: 'llm' } }
  const interp = String(parsed.interpretation ?? req.text)
  if (typeof parsed.answer === 'string') return { kind: 'ANSWER', answer: parsed.answer + '\n\n(Generated explanation — not a calculation or a professional opinion.)', interpretation: interp, compiler: 'llm', basis: [] }
  if (Array.isArray(parsed.calculations)) return { kind: 'CALCULATION', calculations: parsed.calculations.map((c: any) => ({ calcId: String(c.calcId), inputs: c.inputs ?? {} })), interpretation: interp, compiler: 'llm', assumptions: ['Inputs were chosen by the language model — check them.'] }
  if (!Array.isArray(parsed.commands) || !parsed.commands.length) return { kind: 'STOP', condition: 'REQUIRES_INPUT', reason: 'The language model proposed nothing.', interpretation: interp, compiler: 'llm' }
  const commands: StudioCommand[] = parsed.commands.map((c: any) => ({ ...c, requestedBy: req.requestedBy, origin: req.origin ?? 'AI', units: 'ft' }))
  for (const c of commands) {
    const errs = validateCommand(req.model, c)
    if (errs.length) return { kind: 'STOP', condition: 'BLOCKED', reason: `The model proposed an invalid ${c.action}: ${errs.map(e => e.message).join(' ')}`, interpretation: interp, compiler: 'llm' }
  }
  return { kind: 'PROPOSAL', commands, interpretation: interp, dependencies: [], validations: DEFAULT_VALIDATIONS, compiler: 'llm', assumptions: ['Compiled by a language model; every command was schema-checked, and nothing is applied until accepted.'] }
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
export { verticesOf }
