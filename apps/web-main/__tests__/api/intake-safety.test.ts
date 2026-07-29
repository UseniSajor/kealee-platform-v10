import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
  checkoutCreate: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}))

vi.mock('@sentry/nextjs', () => ({
  captureMessage: mocks.captureMessage,
  captureException: mocks.captureException,
}))

vi.mock('@/lib/marketing/ga4-server', () => ({
  trackLeadSubmitted: vi.fn(),
  trackCheckoutStarted: vi.fn(),
}))

vi.mock('@/lib/marketing/drip-schedule', () => ({
  buildConceptFunnelUrl: vi.fn(() => 'https://kealee.com/concept'),
  schedulePrePaymentDrip: vi.fn(),
}))

vi.mock('@/lib/stripe-vercel-guard', () => ({
  guardStripeSecretForHttp: vi.fn(() => null),
}))

vi.mock('@/lib/stripe-client', () => ({
  createStripe: vi.fn(() => ({
    checkout: { sessions: { create: mocks.checkoutCreate } },
  })),
}))

function request(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('public intake payment safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_intake_safety'
  })

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })

  it('returns 503 and no intake ID when durable persistence fails', async () => {
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { message: 'database unavailable' },
            })),
          })),
        })),
      })),
    })

    const { POST } = await import('@/app/api/intake/route')
    const response = await POST(request('http://localhost/api/intake', {
      projectPath: 'cost_estimate',
      clientName: 'Project Owner',
      contactEmail: 'owner@example.com',
      projectAddress: '100 Main Street',
      formData: { uploadedFiles: ['project-photo.jpg'] },
    }))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.intakeId).toBeUndefined()
    expect(body.code).toBe('INTAKE_PERSISTENCE_FAILED')
    expect(mocks.captureMessage).toHaveBeenCalled()
  })

  it('blocks checkout when the intake record does not exist', async () => {
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    })

    const { POST } = await import('@/app/api/intake/checkout/route')
    const response = await POST(request('http://localhost/api/intake/checkout', {
      intakeId: 'missing-intake',
      projectPath: 'cost_estimate',
      successUrl: 'https://kealee.com/estimate/success',
      cancelUrl: 'https://kealee.com/estimate',
    }))
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body.error).toMatch(/could not be found/i)
    expect(mocks.checkoutCreate).not.toHaveBeenCalled()
    expect(mocks.captureMessage).toHaveBeenCalled()
  })
})
