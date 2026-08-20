/**
 * Launch-path guarantees for the four preconstruction products.
 *
 * These cover the rules a customer's money depends on: nationwide intake never
 * dead-ends, unknown facts are reported as unknown rather than invented, and
 * every product a customer can buy is actually routed somewhere.
 */

import { resolveAddressParcel } from '../lib/site-intelligence/authoritative-gis'
import { resolveOrderStatus, ORDER_STATUS_META } from '../lib/order-status'
import { buildOrderChecklist } from '../lib/order-view'
import { SERVICE_DELIVERABLES } from '../lib/service-deliverables'
import { resolveProductAutomationRoute } from '../lib/product-automation'
import { PRECONSTRUCTION_SUITE } from '../lib/preconstruction-suite'
import { INTAKE_PRICE_CENTS } from '@kealee/core-rules'

const CORE_PRODUCT_KEYS = [
  'whole_home_concept',
  'cost_estimate',
  'certified_estimate',
  'preliminary_site_plan',
  'verified_site_feasibility',
  'permit_site_plan',
  'permit_path_only',
]

describe('nationwide site intelligence', () => {
  const realFetch = global.fetch

  afterEach(() => {
    global.fetch = realFetch
  })

  it('degrades to manual review instead of throwing when the geocoder is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch

    const result = await resolveAddressParcel('1 Nowhere Rd, Anytown, ZZ', { timeoutMs: 500 })

    expect(result.status).toBe('not_found')
    expect(result.coverage).toBe('manual-review')
    expect(result.requiresProfessionalVerification).toBe(true)
    expect(result.itemsRequiringConfirmation.length).toBeGreaterThan(0)
  })

  it('never invents zoning or setback values for an unmatched address', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { addressMatches: [] } }),
    }) as unknown as typeof fetch

    const result = await resolveAddressParcel('Somewhere unmatched')

    expect(result.parcel).toBeNull()
    expect(result.parcelCandidates).toHaveLength(0)
    expect(result.jurisdiction.state).toBeNull()
    // The open items must name the facts we did NOT determine.
    expect(result.itemsRequiringConfirmation.join(' ')).toMatch(/[Zz]oning/)
  })

  it('reports jurisdiction with a named source when the geocoder matches', async () => {
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('geocoding.geo.census.gov')) {
        return {
          ok: true,
          json: async () => ({
            result: {
              addressMatches: [{
                matchedAddress: '1 MAIN ST, RALEIGH, NC, 27601',
                coordinates: { x: -78.6, y: 35.8 },
                geographies: {
                  States: [{ STUSAB: 'NC', NAME: 'North Carolina', STATE: '37' }],
                  Counties: [{ NAME: 'Wake County', COUNTY: '183' }],
                  'Incorporated Places': [{ NAME: 'Raleigh city' }],
                },
              }],
            },
          }),
        }
      }
      return { ok: false, json: async () => ({}) }
    }) as unknown as typeof fetch

    const result = await resolveAddressParcel('1 Main St, Raleigh, NC')

    expect(result.jurisdiction.state).toBe('NC')
    expect(result.jurisdiction.county).toBe('Wake County')
    expect(result.jurisdiction.countyFips).toBe('37183')
    expect(result.coverage).toBe('data-assisted')
    expect(result.dataSources[0].authority).toContain('Census')
    expect(result.dataSources[0].retrievedAt).toBeTruthy()
  })
})

describe('order lifecycle', () => {
  it('falls back to the legacy status column for pre-lifecycle orders', () => {
    expect(resolveOrderStatus({}, 'paid')).toBe('processing')
    expect(resolveOrderStatus({}, 'delivered')).toBe('delivered')
    expect(resolveOrderStatus({}, 'new')).toBe('intake_submitted')
  })

  it('prefers the explicit lifecycle status when one is set', () => {
    expect(resolveOrderStatus({ orderStatus: 'needs_professional_review' }, 'paid'))
      .toBe('needs_professional_review')
  })

  it('names an actor for every status so nothing stalls unattributed', () => {
    for (const meta of Object.values(ORDER_STATUS_META)) {
      expect(['kealee', 'customer', 'none']).toContain(meta.actor)
      expect(meta.label.length).toBeGreaterThan(0)
    }
  })
})

describe('missing-information checklist', () => {
  const emptyOrder = { project_address: null, contact_email: null, contact_phone: null }

  it('requires a survey and parcel confirmation for a permit site plan', () => {
    const items = buildOrderChecklist('permit_site_plan', {}, emptyOrder)
    const survey = items.find(item => item.key === 'survey')
    expect(survey?.state).toBe('missing')
    expect(items.find(item => item.key === 'parcel_confirmed')?.state).toBe('missing')
  })

  it('treats a survey as optional for a preliminary site plan', () => {
    const items = buildOrderChecklist('preliminary_site_plan', {}, emptyOrder)
    expect(items.find(item => item.key === 'survey')?.state).toBe('optional')
  })

  it('requires a plan set for permit work and an estimate purpose for estimates', () => {
    expect(
      buildOrderChecklist('permit_path_only', {}, emptyOrder).find(i => i.key === 'drawings')?.state,
    ).toBe('missing')
    expect(
      buildOrderChecklist('cost_estimate', {}, emptyOrder).find(i => i.key === 'estimate_purpose')?.state,
    ).toBe('missing')
  })

  it('marks supplied information as provided', () => {
    const items = buildOrderChecklist(
      'cost_estimate',
      {
        description: 'Full gut renovation of a 1,800 sq ft single-family home in Bethesda.',
        estimatePurpose: 'lender',
        uploadedFileMeta: [{ name: 'plans.pdf', type: 'document' }],
      },
      { project_address: '7 Wisconsin Cir', contact_email: 'a@b.com', contact_phone: '555' },
    )
    expect(items.find(i => i.key === 'scope')?.state).toBe('provided')
    expect(items.find(i => i.key === 'address')?.state).toBe('provided')
    expect(items.find(i => i.key === 'plans')?.state).toBe('provided')
  })
})

describe('every buyable preconstruction product is fulfillable', () => {
  it.each(CORE_PRODUCT_KEYS)('%s has a price, a deliverable definition, and a delivery window', key => {
    expect(INTAKE_PRICE_CENTS[key]).toBeDefined()
    const deliverable = SERVICE_DELIVERABLES[key]
    expect(deliverable).toBeDefined()
    expect(deliverable.includes.length).toBeGreaterThan(0)
    expect(deliverable.deliveryDays).toBeTruthy()
  })

  it.each(['cost_estimate', 'certified_estimate', 'permit_path_only', 'preliminary_site_plan',
    'verified_site_feasibility', 'permit_site_plan'])(
    '%s resolves to an automation route',
    key => {
      expect(resolveProductAutomationRoute({ source: 'public_intake', projectPath: key })).toBeDefined()
    },
  )

  it('states a preliminary-vs-professional disclaimer on all four suite products', () => {
    expect(PRECONSTRUCTION_SUITE).toHaveLength(4)
    for (const product of PRECONSTRUCTION_SUITE) {
      expect(product.disclaimer.length).toBeGreaterThan(40)
      expect(product.startHref.startsWith('/')).toBe(true)
      expect(product.priceLabel).toBeTruthy()
      expect(product.deliveryRange).toBeTruthy()
    }
  })

  it('never claims Kealee approves permits', () => {
    const permit = PRECONSTRUCTION_SUITE.find(p => p.id === 'permitting')!
    expect(permit.disclaimer).toMatch(/does not issue permits/i)
    expect(SERVICE_DELIVERABLES.permit_path_only.includes.join(' '))
      .toMatch(/does not issue permits/i)
  })
})
