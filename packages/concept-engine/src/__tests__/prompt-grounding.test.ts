/**
 * KEALEE.md forbids generic prompts. These tests are the enforcement, and the
 * case they exist for is the one the codebase actually had: a prompt carrying
 * a service type and a style keyword, technically compliant and substantively
 * generic.
 */
import { describe, it, expect } from 'vitest'
import {
  describeGrounding, assertGrounded, buildGroundingBlock, UngroundedPromptError,
} from '../prompt-grounding'

describe('an ungrounded prompt', () => {
  it('is refused outright', () => {
    expect(() => assertGrounded({}, 'render')).toThrow(UngroundedPromptError)
  })

  it('names every missing source so the fix is obvious', () => {
    try {
      assertGrounded({}, 'render')
    } catch (e) {
      const msg = (e as Error).message
      expect(msg).toMatch(/service_type/)
      expect(msg).toMatch(/product_rules/)
      expect(msg).toMatch(/jurisdiction/)
      expect(msg).toMatch(/form_data/)
    }
  })
})

describe('the THIN prompt — the real failure in this codebase', () => {
  // build-visual-prompt-bundle grounds on projectPath and stylePreferences.
  // Style is a preference, not platform data about this site.
  const thin = { serviceType: 'kitchen_remodel' }

  it('is reported as thin, not as grounded', () => {
    const r = describeGrounding(thin)
    expect(r.grounded).toBe(true)
    expect(r.thin).toBe(true)
    expect(r.warning).toMatch(/substantively generic/)
  })

  it('is refused by default', () => {
    expect(() => assertGrounded(thin, 'render')).toThrow(/substantively generic/)
  })

  it('can be allowed DELIBERATELY, and is still recorded as thin', () => {
    const r = assertGrounded(thin, 'render', { allowThin: true })
    expect(r.thin).toBe(true)
    expect(r.warning).toBeTruthy()
  })

  it('treats style preferences as form data, so style plus service is NOT thin', () => {
    // Defensible: a style keyword IS intake data. But the report still shows
    // jurisdiction and product rules missing, which is the useful signal.
    const r = describeGrounding({ serviceType: 'kitchen_remodel', stylePreferences: ['transitional'] })
    expect(r.thin).toBe(false)
    expect(r.missing).toContain('jurisdiction')
    expect(r.missing).toContain('product_rules')
  })
})

describe('a properly grounded prompt', () => {
  const full = {
    serviceType: 'addition_expansion',
    productIncludes: ['Dimensioned floor plan', 'Two exterior renders'],
    productDeliveryDays: '5-7 days',
    zoneCode: 'RSF-65',
    jurisdiction: "Prince George's County",
    parcelAreaSqFt: 9_596,
    maxLotCoveragePercent: 35,
    floorAreaSqFt: 2_400,
    roomCount: 8,
    propertyType: 'single_family',
    stylePreferences: ['craftsman'],
  }

  it('reports all four sources present', () => {
    const r = describeGrounding(full)
    expect(r.present.sort()).toEqual(['form_data', 'jurisdiction', 'product_rules', 'service_type'])
    expect(r.missing).toEqual([])
    expect(r.thin).toBe(false)
    expect(r.warning).toBeNull()
  })

  it('puts what the customer was SOLD into the prompt', () => {
    // The only source of what a customer bought is PRODUCT_PRICING.included.
    const { block } = buildGroundingBlock(full, 'render')
    expect(block).toMatch(/Dimensioned floor plan/)
    expect(block).toMatch(/Two exterior renders/)
  })

  it('computes the coverage cap into a footprint the model must respect', () => {
    // 35% of 9,596 = 3,359 sq ft. A model told "35% coverage" will not do the
    // arithmetic; told "3,359 sq ft" it has a constraint it can honour.
    const { block } = buildGroundingBlock(full, 'render')
    expect(block).toMatch(/3,359 sq ft/)
    expect(block).toMatch(/35% of the lot/)
  })

  it('instructs the model not to invent property facts', () => {
    const { block } = buildGroundingBlock(full, 'render')
    expect(block).toMatch(/Do not invent facts about the property/)
  })
})

describe('partial grounding', () => {
  it('names what is NOT established and forbids depicting it', () => {
    // The alternative is a render that confidently shows a site it knows
    // nothing about.
    const { block, report } = buildGroundingBlock(
      { serviceType: 'kitchen_remodel', floorAreaSqFt: 320, roomCount: 1 },
      'render',
    )
    expect(report.missing).toContain('jurisdiction')
    expect(block).toMatch(/NOT ESTABLISHED/)
    expect(block).toMatch(/Do not depict or assert/)
  })

  it('accepts jurisdiction data alone as substantive grounding', () => {
    const r = describeGrounding({ serviceType: 'x', zoneCode: 'RSF-65', parcelAreaSqFt: 8000 })
    expect(r.thin).toBe(false)
    expect(r.facts.join(' ')).toMatch(/zone RSF-65/)
    expect(r.facts.join(' ')).toMatch(/8,000 sq ft lot/)
  })
})
