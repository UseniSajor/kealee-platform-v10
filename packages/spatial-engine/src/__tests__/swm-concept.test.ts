import { describe, expect, it } from 'vitest'
import { swmConceptReport } from '../site-plan/swm-concept'
import type { PoiAnalysis } from '../site-plan/poi'

const poi: PoiAnalysis = {
  pois: [{ id: 'POI-1', at: [0, 0], share: 1, longestFlowFt: 600, longestFlowDropFt: 18 }],
  overflow: [], offsiteAreaSqFt: 0, offsiteCells: [], cellFt: 5, method: '',
}
const rainfall = { depthsIn: { 2: 3.19, 10: 4.93, 100: 8.51 }, citation: 'test' }
const base = {
  tractSqFt: 165000, poi, hsg: 'C' as const, rainfall, woodsSqFt: 0,
  proposedImpSqFt: 38000, lodOnSiteSqFt: 66000, receiving: 'the roadside ditch',
  esdvReqCf: 4800, esdvProvCf: 4800, practices: 7,
}

describe('SWM concept report — 100-yr existing vs. proposed', () => {
  it('composites TR-55 curve numbers for HSG C', () => {
    const r = swmConceptReport(base)
    expect(r.pois[0].existing.cn).toBe(74)                       // all open space
    // 38,000 sf at 98 + 127,000 sf at 74
    expect(r.pois[0].proposed.cn).toBeCloseTo((38000 * 98 + 127000 * 74) / 165000, 1)
  })
  it('development raises the 100-yr peak and runoff volume', () => {
    const r = swmConceptReport(base)
    const q = r.pois[0].peaks.find(p => p.yr === 100)!
    expect(q.postCfs).toBeGreaterThan(q.preCfs)
    expect(q.postRunoffCf).toBeGreaterThan(q.preRunoffCf)
  })
  it('woods lower the existing curve number', () => {
    const r = swmConceptReport({ ...base, woodsSqFt: 100000 })
    expect(r.pois[0].existing.cn).toBeLessThan(74)
  })
  it('refuses to compute without the site rainfall', () => {
    expect(() => swmConceptReport({ ...base, rainfall: { depthsIn: { 2: 3.19 }, citation: '' } })).toThrow(/10-yr/)
  })
  it('keeps the downstream analysis outstanding', () => {
    const r = swmConceptReport(base)
    expect(r.outstanding.some(s => /downstream/i.test(s))).toBe(true)
    expect(r.narrative['D-10'].some(s => /POI-1/.test(s))).toBe(true)
  })
  it('states its data source without survey directives or a "current" prior NRI', () => {
    const r = swmConceptReport(base)
    const text = [r.method, ...r.outstanding, ...Object.values(r.narrative).flat()].join(' ')
    expect(text).not.toMatch(/field-run|surveyor shall|to be confirmed by|reset from/i)
    expect(text).not.toMatch(/NRI-015-06, current/)
    expect(text).toMatch(/2-ft contour mapping/)
  })
})
