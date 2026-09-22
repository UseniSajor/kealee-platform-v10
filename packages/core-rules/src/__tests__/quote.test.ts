import { describe, it, expect } from 'vitest'
import {
  PRODUCT_PRICING,
  computeQuote,
  priceRangeFor,
  formatPriceRange,
  getAddOn,
  ADD_ONS,
  QUOTE_VALIDITY_DAYS,
} from '../quote'

/** The researched positioning bands. Copy must never state a number outside these. */
const PUBLISHED_RANGES: Record<string, string> = {
  bathroom_remodel: '$395–$595',
  kitchen_remodel: '$495–$795',
  interior_renovation: '$495–$795',
  exterior_concept: '$595–$995',
  garden_concept: '$595–$995',
  addition_expansion: '$895–$1,495',
  whole_home_concept: '$995–$1,995',
  developer_concept: '$1,495–$3,995',
  preliminary_site_plan: '$395–$595',
  verified_site_feasibility: '$895–$1,495',
  permit_site_plan: '$1,995–$4,995',
  cost_estimate: '$495–$795',
  certified_estimate: '$995–$1,850',
  permit_path_only: '$295–$595',
  permit_filing: '$795–$1,495',
  permit_managed: '$1,495–$3,500',
  professional_drawings: '$1,495–$14,995',
  managed_bid: '$495–$995',
}

describe('published ranges are computed, not typed', () => {
  for (const [key, expected] of Object.entries(PUBLISHED_RANGES)) {
    it(`${key} computes ${expected}`, () => {
      expect(formatPriceRange(key)).toBe(expected)
    })
  }
})

describe('every product prices within its own floor and ceiling', () => {
  for (const key of Object.keys(PRODUCT_PRICING)) {
    it(key, () => {
      const product = PRODUCT_PRICING[key]!
      const big = computeQuote(key, {
        squareFeet: 500_000,
        lotAcres: 500,
        structuralChange: true,
        siteConditions: {
          chesapeakeBayCriticalArea: true,
          femaFloodplain: true,
          steepSlope: true,
          streamOrWetlandBuffer: true,
          peStampRequired: true,
          historicOrOverlayDistrict: true,
        },
      })!
      expect(big.packageCents).toBeGreaterThanOrEqual(product.floorCents)
      expect(big.packageCents).toBeLessThanOrEqual(product.ceilingCents)
    })
  }
})

describe('determinism', () => {
  it('same facts produce the same amount', () => {
    const facts = { squareFeet: 480, structuralChange: true, addOns: ['video_presentation'] }
    const a = computeQuote('kitchen_remodel', facts, new Date('2026-09-22T00:00:00Z'))!
    const b = computeQuote('kitchen_remodel', facts, new Date('2026-09-22T00:00:00Z'))!
    expect(a.totalCents).toBe(b.totalCents)
    expect(a.lines.map(l => l.amountCents)).toEqual(b.lines.map(l => l.amountCents))
  })

  it('a larger project never costs less than a smaller one', () => {
    const small = computeQuote('kitchen_remodel', { squareFeet: 120 })!
    const large = computeQuote('kitchen_remodel', { squareFeet: 500 })!
    expect(large.packageCents).toBeGreaterThanOrEqual(small.packageCents)
  })
})

describe('drawings price from their class, then site conditions', () => {
  it('a limited renovation starts below an addition', () => {
    const limited = computeQuote('professional_drawings', { drawingClass: 'limited_renovation', squareFeet: 400 })!
    const addition = computeQuote('professional_drawings', { drawingClass: 'addition_adu', squareFeet: 400 })!
    const whole = computeQuote('professional_drawings', { drawingClass: 'whole_home_new_commercial', squareFeet: 400 })!
    expect(limited.packageCents).toBe(149_500)
    expect(addition.packageCents).toBe(399_500)
    expect(whole.packageCents).toBe(799_500)
  })

  it('names the source of every site-condition surcharge', () => {
    const q = computeQuote('professional_drawings', {
      drawingClass: 'addition_adu',
      squareFeet: 800,
      siteConditions: { chesapeakeBayCriticalArea: true, femaFloodplain: true },
    })!
    const surcharges = q.lines.filter(l => l.kind === 'required_scope')
    expect(surcharges.length).toBe(2)
    for (const line of surcharges) expect(line.source).toBeTruthy()
  })
})

describe('scope beyond a package becomes a scoping request, not a bigger charge', () => {
  it('flags an over-ceiling scope', () => {
    const q = computeQuote('professional_drawings', {
      drawingClass: 'limited_renovation',
      squareFeet: 600,
      siteConditions: { chesapeakeBayCriticalArea: true, peStampRequired: true },
    })!
    expect(q.customQuoteRequired).toBe(true)
    expect(q.packageCents).toBeLessThanOrEqual(q.ceilingCents)
  })

  it('flags a size beyond the product', () => {
    const q = computeQuote('kitchen_remodel', { squareFeet: 9_000 })!
    expect(q.customQuoteRequired).toBe(true)
  })

  it('flags an unsupported jurisdiction', () => {
    const q = computeQuote('kitchen_remodel', { squareFeet: 200, jurisdictionSupported: false })!
    expect(q.customQuoteRequired).toBe(true)
  })

  it('prices ordinary work instantly', () => {
    const q = computeQuote('kitchen_remodel', { squareFeet: 200, structuralChange: true })!
    expect(q.customQuoteRequired).toBe(false)
  })
})

describe('add-ons are optional and never folded into the package', () => {
  it('adds on top of the package and is not clamped by the ceiling', () => {
    const bare = computeQuote('bathroom_remodel', { squareFeet: 100 })!
    const withAddOns = computeQuote('bathroom_remodel', {
      squareFeet: 100,
      addOns: ['video_presentation', 'interactive_walk'],
      extraRenderViews: 2,
    })!
    expect(withAddOns.packageCents).toBe(bare.packageCents)
    expect(withAddOns.totalCents).toBe(
      bare.packageCents + 44_900 + 54_900 + 2 * 14_500,
    )
  })

  it('routes a scoped add-on to a scoping request', () => {
    const q = computeQuote('kitchen_remodel', { squareFeet: 200, addOns: ['licensed_review'] })!
    expect(q.customQuoteRequired).toBe(true)
  })

  it('every add-on id is unique', () => {
    const ids = ADD_ONS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rush applies to the package only', () => {
    const q = computeQuote('kitchen_remodel', { squareFeet: 200, rush: true, addOns: ['video_presentation'] })!
    expect(q.rushCents).toBe(Math.round(q.packageCents * 0.35))
    expect(q.addOnsCents).toBe(44_900)
  })
})

describe('a quote is auditable', () => {
  it('records its inputs, expiry and credit policy', () => {
    const now = new Date('2026-09-22T00:00:00Z')
    const q = computeQuote('kitchen_remodel', { squareFeet: 300 }, now)!
    expect(q.inputs.squareFeet).toBe(300)
    expect(new Date(q.expiresAt).getTime() - now.getTime()).toBe(QUOTE_VALIDITY_DAYS * 86_400_000)
    expect(q.credit.shortCopy).toMatch(/credited/i)
  })

  it('states exclusions and third-party fees', () => {
    const q = computeQuote('permit_site_plan', { lotAcres: 1 })!
    expect(q.exclusions.length).toBeGreaterThan(0)
    expect(q.thirdPartyFees).toContain('Boundary survey by a licensed surveyor')
  })

  it('returns null for a product with no published price', () => {
    expect(computeQuote('not_a_product', {})).toBeNull()
    expect(priceRangeFor('not_a_product')).toBeNull()
    expect(getAddOn('nope')).toBeNull()
  })
})
