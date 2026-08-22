/**
 * The Site Plan rule seam.
 *
 * This code runs inside the Stripe webhook on an order that has already been
 * paid for, so the behaviour that matters most is what happens when things go
 * wrong. It must never throw, never guess a jurisdiction, and never let a
 * customer believe the county has approved anything.
 */

import {
  isSitePlanOrder, resolveJurisdiction, evaluateSitePlanOrder,
  sitePlanRuleFormData, SITE_PLAN_PROJECT_PATHS,
} from '../site-plan-rules'

const PG_ORDER = {
  address: '4500 Rhode Island Ave, Brentwood, MD 20722',
  state: 'MD',
  zone: 'RSF-65',
  overlays: [],
  environmentalOverlays: [],
  historicOverlays: [],
  use: 'single_family_detached',
  cornerLot: false,
  lot_size: '6500',
  lotWidthFt: 65,
  subdivisionStatus: 'not_required',
  applicationDate: '2026-08-22',
}

describe('which orders the engine handles', () => {
  it('recognises the three saleable Site Plan products', () => {
    expect(SITE_PLAN_PROJECT_PATHS).toHaveLength(3)
    for (const p of SITE_PLAN_PROJECT_PATHS) expect(isSitePlanOrder(p)).toBe(true)
  })

  it('ignores every other product', () => {
    for (const p of ['cost_estimate', 'permit_path_only', 'design_estimate_permit_bundle', '', undefined]) {
      expect(isSitePlanOrder(p as string)).toBe(false)
    }
  })
})

describe('jurisdiction resolution never guesses', () => {
  it('accepts an explicit jurisdiction code', () => {
    expect(resolveJurisdiction({ jurisdictionCode: 'prince_georges_md' })).toBe('prince_georges_md')
  })

  it('recognises the county by name', () => {
    expect(resolveJurisdiction({ county: "Prince George's County", state: 'MD' })).toBe('prince_georges_md')
  })

  it('recognises a municipality inside the county, but only in Maryland', () => {
    expect(resolveJurisdiction({ address: '4500 Rhode Island Ave, Brentwood, MD' })).toBe('prince_georges_md')
    // Brentwood also exists in California, Tennessee and New York.
    expect(resolveJurisdiction({ address: '100 Main St, Brentwood, CA' })).toBeNull()
  })

  it('returns null rather than assuming, for anywhere unrecognised', () => {
    expect(resolveJurisdiction({ address: '1 Loudoun St, Leesburg, VA' })).toBeNull()
    expect(resolveJurisdiction({ address: '500 Congress Ave, Austin, TX' })).toBeNull()
    expect(resolveJurisdiction({})).toBeNull()
  })
})

describe('evaluating a paid order', () => {
  it('runs against the PG pack and reports which sections govern', () => {
    const out = evaluateSitePlanOrder({
      intakeId: 'intake-1', projectPath: 'preliminary_site_plan', formData: PG_ORDER,
    })
    expect(out.ran).toBe(true)
    expect(out.jurisdiction).toBe('prince_georges_md')
    expect(out.error).toBeUndefined()
    // Nothing is certified yet, so applicable rules come back as review items.
    // That is the pre-certification state, and it is still useful output.
    expect(out.reviewItems.length).toBeGreaterThan(0)
    expect(out.reviewItems.every(i => i.discipline.length > 0)).toBe(true)
  })

  it('routes an out-of-area order to manual review without pretending', () => {
    const out = evaluateSitePlanOrder({
      intakeId: 'intake-2', projectPath: 'permit_site_plan',
      formData: { address: '500 Congress Ave, Austin, TX', zone: 'SF-3' },
    })
    expect(out.ran).toBe(false)
    expect(out.coverage).toBe('manual-review')
    expect(out.determinedRequirements).toEqual([])
    expect(out.customerSummary).toMatch(/prepares the zoning analysis by hand/i)
  })

  it('never claims the county approved anything', () => {
    const out = evaluateSitePlanOrder({
      intakeId: 'intake-3', projectPath: 'verified_site_feasibility', formData: PG_ORDER,
    })
    expect(out.customerSummary).not.toMatch(/approved/i)
    expect(out.regulatorilyResolved).toBe(false)
  })

  it('surfaces the intake questions that forced a review', () => {
    const out = evaluateSitePlanOrder({
      intakeId: 'intake-4', projectPath: 'preliminary_site_plan',
      formData: { address: 'Brentwood, MD', zone: 'RSF-65' },
    })
    expect(out.unknownFields).toContain('lotType')
    expect(out.opsSummary).toMatch(/Intake did not establish/i)
  })

  it('does NOT throw on malformed intake data — a paid order must not be lost', () => {
    const hostile: Record<string, unknown> = {
      address: 'Brentwood, MD',
      zone: { nope: true },          // wrong type
      overlays: 42,                  // wrong type
      lot_size: 'not a number',
      cornerLot: 'maybe',
    }
    expect(() => evaluateSitePlanOrder({
      intakeId: 'intake-5', projectPath: 'preliminary_site_plan', formData: hostile,
    })).not.toThrow()
  })

  it('degrades to manual review rather than throwing when a required field is absent', () => {
    expect(() => evaluateSitePlanOrder({
      intakeId: 'intake-6', projectPath: 'preliminary_site_plan', formData: {},
    })).not.toThrow()
    const out = evaluateSitePlanOrder({
      intakeId: 'intake-6', projectPath: 'preliminary_site_plan', formData: {},
    })
    expect(out.coverage).toBe('manual-review')
  })
})

describe('what gets written to form_data', () => {
  it('nests everything under one key so it cannot collide with intake fields', () => {
    const patch = sitePlanRuleFormData(evaluateSitePlanOrder({
      intakeId: 'intake-7', projectPath: 'preliminary_site_plan', formData: PG_ORDER,
    }))
    expect(Object.keys(patch)).toEqual(['sitePlanRuleReport'])
    const r = patch.sitePlanRuleReport as Record<string, unknown>
    expect(r.jurisdiction).toBe('prince_georges_md')
    expect(typeof r.evaluatedAt).toBe('string')
    expect(r.error).toBeNull()
  })

  it('is JSON-serialisable, since it lands in a JSONB column', () => {
    const patch = sitePlanRuleFormData(evaluateSitePlanOrder({
      intakeId: 'intake-8', projectPath: 'permit_site_plan', formData: PG_ORDER,
    }))
    expect(() => JSON.parse(JSON.stringify(patch))).not.toThrow()
  })
})
