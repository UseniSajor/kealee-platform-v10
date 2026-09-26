/**
 * Site Plan Studio — core engine: commands, geometry, rules, calculations,
 * provenance, proposals and revisions, on the demo project.
 */
import { describe, it, expect } from 'vitest'
import {
  demoModel, DEMO_ORIGIN, validateCommand, executeCommand, propose, accept, revertChanges, simulate,
  evaluateRules, runCalculation, pipeFullFlow, sizePipe, setbackClearances, type StudioModel, type StudioCommand,
  studioGeometry as geo, interpolateElevation, surfaceSamples, listCalculations,
} from '../studio'

const IDS = { organizationId: 'org-kealee', workspaceId: 'ws-1', projectId: 'demo' }
const fresh = () => demoModel(IDS)
const byLabel = (m: StudioModel, l: string) => m.objects.find(o => o.attributes.label === l)!
let n = 0
const ctx = () => ({ newId: () => `id-${++n}`, now: '2026-09-26T12:00:00.000Z', actorId: 'u-drafter' })
const tool = { requestedBy: 'u-drafter', origin: 'TOOL' as const, units: 'ft' as const }
const ai = { requestedBy: 'u-drafter', origin: 'AI' as const, units: 'ft' as const }
const [X, Y] = DEMO_ORIGIN

describe('demo project', () => {
  it('passes its setbacks and fails what it was built to fail', () => {
    const m = fresh()
    const rules = evaluateRules(m)
    expect(rules.filter(r => r.code.startsWith('SETBACK_')).every(r => r.status === 'PASS')).toBe(true)
    // Driveway 100 → 104 ft over 30 ft = 13.3%, over the project's 12% limit.
    expect(rules.find(r => r.code === 'DRIVEWAY_GRADE')!.status).toBe('FAIL')
    // Water and sewer 8 ft apart in the street; Ten States wants 10.
    expect(rules.find(r => r.code === 'UTILITY_SEPARATION')!.status).toBe('FAIL')
  })

  it('traces a setback to its rule, version and measured clearance', () => {
    const side = evaluateRules(fresh()).find(r => r.code === 'SETBACK_SIDE')!
    expect(side).toMatchObject({ status: 'PASS', ruleVersion: 'pg-2022.1', effectiveDate: '2022-04-01', citation: 'PG Zoning Ordinance §27-4202(e)' })
    expect(side.trace).toMatchObject({ required: '8 ft', measured: '30 ft', calcId: 'setback_clearance' })
  })
})

describe('commands', () => {
  it('moves an object and records before/after for undo', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house')
    const r = executeCommand(m, { ...tool, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: 6, y: 0 } }, ctx())
    const moved = r.model.objects.find(o => o.id === h.id)!
    expect(geo.centroid(moved.geometry)[0] - geo.centroid(h.geometry)[0]).toBeCloseTo(6, 6)
    const undone = revertChanges(r.model, r.changes)
    expect(undone.objects.find(o => o.id === h.id)!.geometry).toEqual(h.geometry)
  })

  it('refuses to move, reshape or delete record geometry — for the AI and for a person', () => {
    const m = fresh(), lot = m.objects.find(o => o.type === 'ParcelBoundary')!
    for (const origin of ['AI', 'TOOL'] as const) {
      const errs = validateCommand(m, { requestedBy: 'u', origin, action: 'MOVE_OBJECT', objectIds: [lot.id], vector: { x: 1, y: 0 } })
      expect(errs.map(e => e.code)).toContain('RECORD_GEOMETRY_PROTECTED')
    }
    expect(validateCommand(m, { ...tool, action: 'DELETE_OBJECT', objectIds: [byLabel(m, 'CB-2').id] }).map(e => e.code)).toContain('RECORD_GEOMETRY_PROTECTED')
  })

  it('never lets a command create surveyed or GIS data', () => {
    const m = fresh()
    const g = { type: 'Point' as const, coordinates: [X + 5, Y + 5] as [number, number] }
    expect(validateCommand(m, { ...tool, action: 'ADD_OBJECT', object: { type: 'SpotElevation', geometry: g, source: 'BOUNDARY_SURVEY' } }).map(e => e.code)).toContain('SOURCE_NOT_CREATABLE')
    expect(validateCommand(m, { ...ai, action: 'ADD_OBJECT', object: { type: 'SpotElevation', geometry: g, source: 'USER_SUPPLIED' } }).map(e => e.code)).toContain('AI_SOURCE_FORBIDDEN')
  })

  it('marks an existing feature drawn by the AI as AI_INFERRED with capped confidence', () => {
    const m = fresh()
    const r = executeCommand(m, { ...ai, action: 'ADD_OBJECT', object: { type: 'Tree', geometry: { type: 'Point', coordinates: [X + 80, Y + 100] }, status: 'EXISTING', confidence: 0.99 } }, ctx())
    const t = r.changes[0].after!
    expect(t.source).toBe('AI_INFERRED')
    expect(t.confidence).toBeLessThanOrEqual(0.6)
    expect(evaluateRules(r.model).find(x => x.code === 'AI_INFERRED_UNCONFIRMED' && x.objectIds[0] === t.id)!.status).toBe('REQUIRES_REVIEW')
  })

  it('refuses to set provenance or professional state by property', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house')
    for (const key of ['source', 'confidence', 'sealed', 'fieldVerified']) {
      expect(validateCommand(m, { ...tool, action: 'SET_PROPERTY', objectIds: [h.id], key, value: 'x' }).map(e => e.code)).toContain('PROTECTED_PROPERTY')
    }
  })

  it('widens a driveway by rebuilding its slab from the centreline', () => {
    const m = fresh(), d = byLabel(m, 'Proposed driveway')
    const r = executeCommand(m, { ...tool, action: 'SET_PROPERTY', objectIds: [d.id], key: 'widthFt', value: 12 }, ctx())
    const after = r.model.objects.find(o => o.id === d.id)!
    expect(after.attributes.widthFt).toBe(12)
    expect(geo.polygonArea(after.geometry)).toBeCloseTo(12 * 30, 0)
  })

  it('regrades a driveway holding the garage end', () => {
    const m = fresh(), d = byLabel(m, 'Proposed driveway')
    const r = executeCommand(m, { ...tool, action: 'SET_SLOPE', objectId: d.id, slopePct: -7.9, hold: 'end', holdElevationFt: 104 }, ctx())
    const cl = r.model.objects.find(o => o.id === d.id)!.attributes.centerline as number[][]
    expect(cl[1][2]).toBe(104)
    expect(cl[0][2]).toBeCloseTo(104 - 0.079 * 30, 2)
    expect(evaluateRules(r.model).find(x => x.code === 'DRIVEWAY_GRADE')!.status).toBe('PASS')
  })

  it('routes a pipe sized by Manning, and the pipe follows its structure', () => {
    const m = fresh(), cb1 = byLabel(m, 'CB-1'), cb2 = byLabel(m, 'CB-2')
    const r = executeCommand(m, { ...tool, action: 'ROUTE_PIPE', fromId: cb1.id, toId: cb2.id, designFlowCfs: 1.12 }, ctx())
    const pipe = r.changes.find(c => c.after?.type === 'Pipe')!.after!
    expect(pipe.attributes.diameterIn).toBe(15)
    expect(Number(pipe.attributes.slopeFtPerFt)).toBeCloseTo((104 - 95.5) / 137, 4)
    const moved = executeCommand(r.model, { ...tool, action: 'MOVE_OBJECT', objectIds: [cb1.id], vector: { x: -10, y: 0 } }, ctx())
    const p2 = moved.model.objects.find(o => o.id === pipe.id)!
    expect((p2.geometry as any).coordinates[0][0]).toBeCloseTo(X + 75, 6)
  })

  it('dimensions to each property line and re-measures when the house moves', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house'), lot = m.objects.find(o => o.type === 'ParcelBoundary')!
    let model = m
    for (let i = 0; i < 4; i++) model = executeCommand(model, { ...tool, action: 'DIMENSION', fromObjectId: h.id, toObjectId: lot.id, toEdgeIndex: i }, ctx()).model
    const dims = () => model.objects.filter(o => o.type === 'Dimension').map(d => Number(d.attributes.measuredFt)).sort((a, b) => a - b)
    expect(dims()).toEqual([30, 30, 30, 90])
    model = executeCommand(model, { ...tool, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: 5, y: 0 } }, ctx()).model
    expect(dims()).toEqual([25, 30, 35, 90])
  })

  it('computes the buildable area and setback lines from the governing requirements', () => {
    const m = fresh()
    const r = simulate(m, [{ ...tool, action: 'CREATE_BUILDABLE_AREA' }, { ...tool, action: 'CREATE_SETBACK' }], ctx())
    expect(r.errors).toEqual([])
    const env = r.model.objects.find(o => o.type === 'BuildableArea')!
    // 100 − 8 − 8 wide, 150 − 25 − 20 deep.
    expect(geo.polygonArea(env.geometry)).toBeCloseTo(84 * 105, -1)
    expect(env.source).toBe('ENGINE_CALCULATED')
    expect(r.model.objects.filter(o => o.type === 'Setback')).toHaveLength(4)
  })
})

describe('geometry operations', () => {
  const L = (...p: [number, number][]) => ({ type: 'LineString' as const, coordinates: p })
  it('offsets, trims, extends, splits, joins and fillets', () => {
    expect(geo.offsetLine([[0, 0], [10, 0]], 2)).toEqual([[0, 2], [10, 2]])
    const wall = L([5, -5], [5, 5])
    expect(geo.trimLine([[0, 0], [10, 0]], wall, 'start')).toEqual([[0, 0], [5, 0]])
    expect(geo.extendLine([[0, 0], [2, 0]], wall, 'end')).toEqual([[0, 0], [5, 0]])
    expect(geo.splitLine([[0, 0], [10, 0]], [4, 1])).toEqual([[[0, 0], [4, 0]], [[4, 0], [10, 0]]])
    expect(geo.joinLines([[0, 0], [5, 0]], [[5, 0], [5, 5]])).toEqual([[0, 0], [5, 0], [5, 5]])
    const f = geo.filletVertex([[0, 0], [10, 0], [10, 10]], 1, 3)!
    expect(f.length).toBeGreaterThan(3)
    expect(Math.hypot(f[1][0] - 7, f[1][1] - 0)).toBeLessThan(1e-9)
  })
  it('mirrors and buffers', () => {
    const sq = { type: 'Polygon' as const, coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]] as [number, number][]] }
    const mir = geo.mirror(sq, [20, 0], [20, 1])
    expect(geo.centroid(mir)[0]).toBeCloseTo(35, 6)
    expect(geo.polygonArea(geo.buffer(sq, -2)!)).toBeCloseTo(36, 1)
  })
})

describe('proposals and revisions', () => {
  it('previews a rule violation before anything is committed, and resolves it on the way back', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house')
    const p = propose(m, [{ ...ai, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: 28, y: 0 } }], { ...ctx(), proposalId: 'p1' })
    expect(p.status).toBe('PROPOSED')
    expect(m.objects.find(o => o.id === h.id)!.geometry).toEqual(h.geometry) // untouched
    const nw = p.preview!.rules.newWarnings.find(r => r.code === 'SETBACK_SIDE')!
    expect(nw.status).toBe('FAIL')
    expect(nw.trace.measured).toBe('2 ft')
    expect(p.preview!.modified[0].movedBy).toEqual({ dx: 28, dy: 0 })
    expect(p.stopConditions.map(s => s.condition)).toContain('REQUIRES_PROFESSIONAL_REVIEW')
    const a = accept(m, p, { ...ctx(), revisionId: 'r2' })
    expect(a.ok).toBe(true)
    if (!a.ok) return
    expect(a.model.revision).toBe(2)
    const back = propose(a.model, [{ ...ai, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: -28, y: 0 } }], { ...ctx(), proposalId: 'p2' })
    expect(back.preview!.rules.resolvedWarnings.map(r => r.code)).toContain('SETBACK_SIDE')
  })

  it('refuses a proposal computed on an older revision', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house')
    const p1 = propose(m, [{ ...tool, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: 1, y: 0 } }], { ...ctx(), proposalId: 'a' })
    const p2 = propose(m, [{ ...tool, action: 'MOVE_OBJECT', objectIds: [h.id], vector: { x: 2, y: 0 } }], { ...ctx(), proposalId: 'b' })
    const a1 = accept(m, p1, { ...ctx(), revisionId: 'r2' })
    expect(a1.ok).toBe(true)
    const a2 = accept((a1 as any).model, p2, { ...ctx(), revisionId: 'r3' })
    expect(a2).toMatchObject({ ok: false, status: 'STALE' })
  })

  it('re-runs affected calculations in the preview', () => {
    const m = fresh(), h = byLabel(m, 'Proposed house')
    const p = propose(m, [{ ...tool, action: 'SCALE_OBJECT', objectIds: [h.id], factor: 1.5 }], { ...ctx(), proposalId: 'c' })
    const cov = p.preview!.affectedCalculations.find(c => c.calcId === 'lot_coverage')!
    expect(cov.before!.outputs.coveragePct).toBe(8)
    expect(cov.after.outputs.coveragePct).toBe(18)
  })
})

describe('calculations', () => {
  it('pipe capacity by Manning matches hand calculation', () => {
    // 15 in RCP at 1.1%, n 0.013: A = 1.2272 ft², R = 0.3125 ft → Q = 6.78 cfs.
    const r = runCalculation('pipe_capacity', { diameterIn: 15, slopeFtPerFt: 0.011, manningN: 0.013, designFlowCfs: 3 }, { actor: { type: 'user', id: 'u' } })
    expect(r.outputs.capacityCfs).toBeCloseTo(6.78, 1)
    expect(r.status).toBe('PASS')
    expect(r).toMatchObject({ method: "Manning's equation, circular", calculationVersion: expect.stringContaining('studio'), actor: { type: 'user', id: 'u' } })
    expect(pipeFullFlow(15, 0.011, 0.013).qFullCfs).toBeCloseTo(6.78, 1)
    expect(sizePipe(10, 0.011, 0.013)).toBe(18)
  })
  it('asks for missing inputs and refuses unregistered methods', () => {
    expect(runCalculation('pipe_capacity', { diameterIn: 15 }, { actor: { type: 'ai', id: 'x' } })).toMatchObject({ status: 'REQUIRES_INPUT', message: expect.stringContaining('slopeFtPerFt') })
    expect(runCalculation('bernoulli_by_vibes', {}, { actor: { type: 'ai', id: 'x' } }).status).toBe('UNSUPPORTED')
  })
  it('registers every method the professional workflow needs', () => {
    const ids = listCalculations().map(c => c.id)
    for (const id of ['rational_method', 'time_of_concentration', 'runoff_coefficient', 'manning_open_channel', 'pipe_capacity', 'culvert_capacity', 'inlet_capacity', 'hydraulic_grade_line', 'water_surface_profile', 'swale_capacity', 'slope', 'grade_interpolation', 'contour_interpolation', 'cut_fill', 'lot_coverage', 'impervious_area', 'setback_clearance', 'utility_clearance', 'sight_distance', 'ada_slope', 'driveway_grade']) expect(ids).toContain(id)
  })
  it('interpolates existing grade between the demo contours', () => {
    const z = interpolateElevation(surfaceSamples(fresh()), X + 50, Y + 22.5)!.z
    expect(z).toBeGreaterThan(101)
    expect(z).toBeLessThan(102)
  })
  it('computes sump inlet capacity, HGL and culvert headwater deterministically', () => {
    expect(runCalculation('inlet_capacity', { grateLengthFt: 2, grateWidthFt: 2, pondingDepthFt: 0.5, designFlowCfs: 1 }, { actor: { type: 'user', id: 'u' } }).status).toBe('PASS')
    expect(runCalculation('inlet_capacity', { grateLengthFt: 2, grateWidthFt: 2, pondingDepthFt: 0.5, location: 'on_grade' }, { actor: { type: 'user', id: 'u' } }).status).toBe('UNSUPPORTED')
    const h = runCalculation('hydraulic_grade_line', { tailwaterElFt: 96, runs: [{ id: 'P1', flowCfs: 2, diameterIn: 15, manningN: 0.013, lengthFt: 137, minorLossK: 0.5, rimElFt: 107.5 }] }, { actor: { type: 'user', id: 'u' } })
    expect(h.status).toBe('PASS')
    const c = runCalculation('culvert_capacity', { diameterFt: 1.5, lengthFt: 40, manningN: 0.012, inletInvertFt: 100, outletInvertFt: 99.6, dischargeCfs: 6, tailwaterElFt: 100 }, { actor: { type: 'user', id: 'u' } })
    expect(['PASS', 'FAIL']).toContain(c.status)
    expect(Number(c.outputs.hwOverD)).toBeGreaterThan(0)
  })
  it('measures setback clearances per yard', () => {
    const rows = setbackClearances(fresh())
    expect(Object.fromEntries(rows.map(r => [r.yard, r.clearanceFt]))).toEqual({ front: 30, side: 30, rear: 90 })
  })
})
