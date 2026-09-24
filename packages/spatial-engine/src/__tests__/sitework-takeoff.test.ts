/**
 * Quantities, not an estimate. The tests are about whether an estimator can
 * trust what they are handed — which means provenance, confidence, and an
 * explicit list of what a site plan cannot tell them.
 */
import { describe, it, expect } from 'vitest'
import { buildSiteworkTakeoff, toEstimationQuantities } from '../site-plan/sitework-takeoff'
import type { DisturbanceResult } from '../site-plan/disturbance'
import type { SiteTwin } from '../site-plan/site-twin'

const twin = { features: [], sources: [] } as unknown as SiteTwin

function disturbance(over: Partial<DisturbanceResult> = {}): DisturbanceResult {
  return {
    knownTotalSqFt: 7_827,
    unknownComponents: [],
    meetsThreshold: true,
    indeterminate: false,
    thresholdSqFt: 5_000,
    percentOfThreshold: 156,
    reliabilityLevel: 1 as never,
    explanation: 'x',
    breakdown: [
      { component: 'Building footprint', sqFt: 1_640 },
      { component: 'Driveway', sqFt: 720 },
      { component: 'Stormwater facilities', sqFt: 300 },
      { component: 'Grading', sqFt: 5_167 },
    ],
    ...over,
  } as DisturbanceResult
}

describe('quantities from a real Rollins-shaped plan', () => {
  const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })

  it('produces CSI-coded sitework in divisions 31, 32 and 33 only', () => {
    // A site plan speaks to earthwork, exterior improvements and utilities.
    // It says nothing about Division 03 for the structure.
    for (const q of t.quantities) {
      expect(q.code, q.name).toMatch(/^3[123] /)
    }
  })

  it('converts areas to the units an estimator prices in', () => {
    const clearing = t.quantities.find(q => q.code === '31 10 00')!
    expect(clearing.unit).toBe('SY')
    expect(clearing.quantity).toBeCloseTo(7827 / 9, 0)
  })

  it('carries sediment control because the site is over the county threshold', () => {
    // The item most often missed in a residential estimate, and a permit
    // condition rather than an option.
    const esc = t.quantities.find(q => q.code === '31 25 00')!
    expect(esc).toBeTruthy()
    expect(esc.unit).toBe('AC')
    expect(esc.notes).toMatch(/permit condition/)
  })

  it('states provenance and confidence on every single item', () => {
    for (const q of t.quantities) {
      expect(q.derivedFrom.length, q.name).toBeGreaterThan(10)
      expect(q.confidence, q.name).toBeGreaterThan(0)
      expect(q.confidence, q.name).toBeLessThanOrEqual(1)
      expect(q.improvedBy.length, q.name).toBeGreaterThan(10)
    }
  })

  it('prices GIS geometry at lower confidence than survey geometry', () => {
    const gis = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    const surveyed = buildSiteworkTakeoff({
      twin, disturbance: disturbance({ reliabilityLevel: 2 as never }),
    })
    const g = gis.quantities.find(q => q.code === '31 10 00')!
    const s = surveyed.quantities.find(q => q.code === '31 10 00')!
    expect(s.confidence).toBeGreaterThan(g.confidence)
    expect(gis.reliabilityLevel).toBe(1)
    expect(surveyed.reliabilityLevel).toBe(2)
  })
})

describe('assumptions are labelled as assumptions', () => {
  it('says the topsoil DEPTH is assumed, not measured', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    const topsoil = t.quantities.find(q => q.code === '31 23 16.13')!
    expect(topsoil.name).toMatch(/assumed depth/)
    expect(topsoil.notes).toMatch(/assumption, not a measurement/)
    // And its confidence is discounted below the geometry it derives from.
    const clearing = t.quantities.find(q => q.code === '31 10 00')!
    expect(topsoil.confidence).toBeLessThan(clearing.confidence)
  })

  it('honours a supplied strip depth instead of the default', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance(), topsoilStripInches: 12 })
    const topsoil = t.quantities.find(q => q.code === '31 23 16.13')!
    expect(topsoil.name).toMatch(/12"/)
  })

  it('gives an area for building excavation and refuses to imply a volume', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    const exc = t.quantities.find(q => q.code === '31 23 16')!
    expect(exc.unit).toBe('SF')
    expect(exc.notes).toMatch(/needs a foundation depth/)
  })
})

describe('what a site plan cannot establish', () => {
  it('names the gaps rather than leaving an estimator to discover them', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    const text = t.notEstablished.join(' ')
    expect(text).toMatch(/Cut and fill/)
    expect(text).toMatch(/Quality Level D/)
    expect(text).toMatch(/geotechnical/)
  })

  it('reports an absent driveway rather than a zero quantity', () => {
    // A zero prices as "nothing to do". An absence prices as "find out".
    const t = buildSiteworkTakeoff({
      twin,
      disturbance: disturbance({ breakdown: [{ component: 'Grading', sqFt: 6_000 }] }),
    })
    expect(t.quantities.find(q => q.code === '32 12 16')).toBeUndefined()
    expect(t.notEstablished.join(' ')).toMatch(/Driveway area/)
  })
})

describe('the indeterminate case', () => {
  it('still carries sediment control when the threshold might be crossed', () => {
    const t = buildSiteworkTakeoff({
      twin,
      disturbance: disturbance({ knownTotalSqFt: 4_200, meetsThreshold: false, indeterminate: true }),
    })
    const esc = t.quantities.find(q => q.code === '31 25 00')!
    expect(esc).toBeTruthy()
    expect(esc.notes).toMatch(/INDETERMINATE/)
    expect(esc.notes).toMatch(/discovered late than priced early/)
  })
})

describe('handoff to the estimation tool', () => {
  it('maps to the shape the takeoff module consumes, keeping provenance', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    const mapped = toEstimationQuantities(t)
    expect(mapped.length).toBe(t.quantities.length)
    for (const m of mapped) {
      expect(m.code).toBeTruthy()
      expect(m.notes).toMatch(/Improved by:/)
    }
  })

  it('never loses the confidence figure in the handoff', () => {
    const t = buildSiteworkTakeoff({ twin, disturbance: disturbance() })
    for (const m of toEstimationQuantities(t)) {
      expect(m.confidence).toBeGreaterThan(0)
    }
  })
})
