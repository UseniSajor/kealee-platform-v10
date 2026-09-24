import { describe, it, expect } from 'vitest'
import {
  sitePlanUnitEconomics, plotPlanFeasibilityAt, computeUnitEconomics,
  SITE_PLAN_MACHINE_COSTS, CONCEPT_MACHINE_COSTS, HUMAN_COSTS,
} from '../unit-economics'

describe('cost inputs', () => {
  it('states a basis and a source for every line', () => {
    for (const c of [...SITE_PLAN_MACHINE_COSTS, ...CONCEPT_MACHINE_COSTS, ...HUMAN_COSTS]) {
      expect(c.basis, c.id).toBeTruthy()
      expect(c.source.length, c.id).toBeGreaterThan(20)
    }
  })

  it('leaves an unmeasured cost NULL rather than inventing a plausible figure', () => {
    // A cost model with invented inputs produces a margin that looks exactly
    // like a real one.
    const pe = HUMAN_COSTS.find(c => c.id === 'pe_review')!
    expect(pe.cents).toBeNull()
    expect(pe.basis).toBe('unknown')
    expect(pe.source).toMatch(/MEASURE/)
  })

  it('records that the site-plan engine makes no paid AI calls', () => {
    const gis = SITE_PLAN_MACHINE_COSTS.find(c => c.id === 'gis_queries')!
    expect(gis.cents).toBe(0)
    expect(gis.source).toMatch(/free public services/)
  })
})

describe('the site-plan ladder', () => {
  const rows = sitePlanUnitEconomics()

  it('reports the preliminary margin, which is fully costed', () => {
    const prelim = rows.find(r => r.productKey === 'preliminary_site_plan')!
    // Support time is unmeasured, so even here the verdict must be honest.
    expect(prelim.verdict).toBe('unknown')
    expect(prelim.note).toMatch(/Margin is UNKNOWN/)
    // But the known costs are genuinely tiny: machine + Stripe only.
    expect(prelim.knownCostCents).toBeLessThan(1_500)
  })

  it('refuses to report a margin on the reviewed products while review is unmeasured', () => {
    for (const key of ['verified_site_feasibility', 'permit_site_plan']) {
      const r = rows.find(x => x.productKey === key)!
      expect(r.verdict, key).toBe('unknown')
      expect(r.unknownCosts.map(c => c.id), key).toContain('pe_review')
      expect(r.note).toMatch(/must not be quoted as the margin/)
    }
  })

  it('names the permit product as carrying two unmeasured professional costs', () => {
    const permit = rows.find(r => r.productKey === 'permit_site_plan')!
    const ids = permit.unknownCosts.map(c => c.id)
    expect(ids).toContain('pe_review')
    expect(ids).toContain('architect_review')
  })
})

describe('the $99 entry tier the market prices at', () => {
  it('is feasible on machine costs alone', () => {
    const r = plotPlanFeasibilityAt(9_900)
    // Stripe takes 2.9% + 30c = ~317c. Machine costs ~3c. So ~96% before
    // support time — which is exactly why support time is the thing to measure.
    expect(r.knownCostCents).toBeLessThan(400)
    expect(r.marginOnKnownCents).toBeGreaterThan(9_000)
  })

  it('still reports UNKNOWN, because support time is not measured', () => {
    const r = plotPlanFeasibilityAt(9_900)
    expect(r.verdict).toBe('unknown')
  })

  it('goes negative below Stripe\u2019s fixed 30c floor plus machine cost', () => {
    // The floor is structural, not a rounding artefact: 30c per transaction
    // plus ~3c of machine cost means nothing can be sold under ~33c at all.
    const r = computeUnitEconomics({
      productKey: 'below_the_floor', revenueCents: 25,
      machineCosts: SITE_PLAN_MACHINE_COSTS, humanCosts: [],
    })
    expect(r.marginOnKnownCents).toBeLessThan(0)
    expect(r.verdict).toBe('negative')
  })

  it('clears at a dollar, so the floor is low and the constraint is human time', () => {
    const r = computeUnitEconomics({
      productKey: 'one_dollar', revenueCents: 100,
      machineCosts: SITE_PLAN_MACHINE_COSTS, humanCosts: [],
    })
    expect(r.marginOnKnownCents).toBeGreaterThan(0)
  })
})

describe('payment processing', () => {
  it('is counted, because 2.9% + 30c is real money on a $99 product', () => {
    const withFee = plotPlanFeasibilityAt(9_900)
    const without = computeUnitEconomics({
      productKey: 'x', revenueCents: 9_900, paymentProcessing: false,
      machineCosts: SITE_PLAN_MACHINE_COSTS, humanCosts: [],
    })
    expect(withFee.knownCostCents).toBeGreaterThan(without.knownCostCents + 300)
  })
})
