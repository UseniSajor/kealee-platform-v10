/**
 * POST /api/intake/checkout
 *
 * The regression that mattered: with v30 enabled server-side, the /concept
 * funnel sends `useV30Pricing: true`, and the route REFUSED the sale with 400
 * whenever the intake carried no v30 quote. The price is server-authoritative
 * either way, so a missing dynamic quote falls back to the tier table.
 */

import { NextRequest } from 'next/server'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  formData: {} as Record<string, unknown>,
  v30Enabled: true,
  sessionsCreate: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { form_data: mocks.formData, metadata: {} }, error: null }),
        }),
      }),
    }),
  }),
}))
vi.mock('@kealee/kealee-agent-stack', () => ({ isV30Enabled: () => mocks.v30Enabled }))
vi.mock('@/lib/stripe-vercel-guard', () => ({ guardStripeSecretForHttp: () => null }))
vi.mock('@/lib/stripe-client', () => ({
  createStripe: () => ({ checkout: { sessions: { create: mocks.sessionsCreate } } }),
}))
vi.mock('@/lib/marketing/ga4-server', () => ({ trackCheckoutStarted: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/marketing/utm-metadata', () => ({ parseUtmFromBody: () => ({}) }))

import { POST } from '../../app/api/intake/checkout/route'

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/intake/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeId: 'intake-1', projectPath: 'kitchen_remodel',
      successUrl: 'http://localhost/s', cancelUrl: 'http://localhost/c',
      ...body,
    }),
  })
}

describe('POST /api/intake/checkout', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x')
    mocks.formData = { tier: 2 }
    mocks.v30Enabled = true
    mocks.sessionsCreate.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/x', client_secret: 'cs_x_secret' })
  })

  it('falls back to the tier price when v30 pricing is requested but no quote exists', async () => {
    const res = await POST(request({ useV30Pricing: true }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/x' })

    const params = mocks.sessionsCreate.mock.calls[0][0]
    expect(params.line_items[0].price_data.unit_amount).toBeGreaterThan(0)
    expect(params.line_items[0].price_data.product_data.name).toMatch(/kitchen/i)
    // The webhook must see this as an ordinary tier sale, not a v30 one.
    expect(params.metadata.pricingModel).toBe('tier_fixed')
    expect(params.metadata.source).toBe('public_intake')
    expect(params.metadata.tier).toBe('2')
  })

  it('prices from the v30 quote when a valid one is on the intake', async () => {
    mocks.formData = { tier: 2, v30Quote: { totalPriceCents: 79900, features: ['design', 'estimate'] } }
    const res = await POST(request({ useV30Pricing: true }))
    expect(res.status).toBe(200)
    const params = mocks.sessionsCreate.mock.calls[0][0]
    expect(params.line_items[0].price_data.unit_amount).toBe(79900)
    expect(params.metadata.pricingModel).toBe('v30_dynamic')
    expect(params.metadata.source).toBe('public_intake_v30')
  })

  it('ignores an out-of-range quote and still sells at the tier price', async () => {
    mocks.formData = { tier: 1, v30Quote: { totalPriceCents: 1 } }
    const res = await POST(request({ useV30Pricing: true }))
    expect(res.status).toBe(200)
    expect(mocks.sessionsCreate.mock.calls[0][0].metadata.pricingModel).toBe('tier_fixed')
  })

  it('still refuses an unknown product', async () => {
    const res = await POST(request({ projectPath: 'not_a_product', useV30Pricing: true }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Unknown projectPath/)
    expect(mocks.sessionsCreate).not.toHaveBeenCalled()
  })

  it('returns a client secret for embedded checkout', async () => {
    const res = await POST(request({ embedded: true, returnUrl: 'http://localhost/r', successUrl: undefined, cancelUrl: undefined }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ clientSecret: 'cs_x_secret' })
    expect(mocks.sessionsCreate.mock.calls[0][0].ui_mode).toBe('embedded')
  })
})
