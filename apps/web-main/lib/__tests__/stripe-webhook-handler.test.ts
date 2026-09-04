import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fulfillRevenueProduct: vi.fn(),
  triggerV30: vi.fn().mockResolvedValue({ executionId: 'exec-test' }),
  ensureRun: vi.fn().mockResolvedValue({ runId: 'run-test' }),
  patchStage: vi.fn().mockResolvedValue(undefined),
  sendCustomerEmail: vi.fn().mockResolvedValue(undefined),
  trackPurchase: vi.fn().mockResolvedValue(undefined),
  routeToManual: vi.fn().mockResolvedValue(undefined),
  ensureLedger: vi.fn().mockResolvedValue({ intakeId: 'intake-test', projectPath: 'cost_estimate', created: true }),
  updates: [] as Array<Record<string, unknown>>,
  transitioned: true,
  current: {
    form_data: {
      description: 'Keep the original brick wall',
      uploadedFiles: ['current-space.jpg', 'survey.pdf'],
      stylePreferences: 'warm modern',
    } as Record<string, unknown>,
    metadata: {}, status: 'new', stripe_session_id: null as string | null,
  },
}))

vi.mock('@/lib/revenue-fulfillment', () => ({ fulfillRevenueProduct: mocks.fulfillRevenueProduct }))
vi.mock('@/lib/v30-trigger', () => ({
  isV30IntakeMetadata: () => false,
  triggerV30GenerationForIntake: mocks.triggerV30,
}))
vi.mock('@/lib/autonomous-fulfillment', () => ({ ensureAutonomousFulfillmentRun: mocks.ensureRun }))
vi.mock('@/lib/marketing/lifecycle', () => ({
  patchIntakeFunnelStage: mocks.patchStage,
  sendPostPaymentCustomerEmail: mocks.sendCustomerEmail,
}))
vi.mock('@/lib/marketing/ga4-server', () => ({ trackPurchase: mocks.trackPurchase }))
vi.mock('@/lib/manual-fulfillment', () => ({ routeToManualFulfillment: mocks.routeToManual }))
vi.mock('@/lib/paid-order-ledger', () => ({
  isServiceCheckoutSource: (source?: string) => [
    'public_intake', 'public_intake_v30', 'product-order', 'bundle',
    'permit-package', 'pre-design', 'revenue_product',
  ].includes(source ?? ''),
  ensurePaidOrderLedgerEntry: mocks.ensureLedger,
}))

function queryBuilder() {
  let selected = ''
  let updatePayload: Record<string, unknown> | undefined
  const builder = {
    select(columns: string) {
      if (updatePayload) {
        if ('status' in updatePayload) {
          const rows = mocks.transitioned ? [{ id: 'intake-test' }] : []
          mocks.transitioned = false
          mocks.current.status = 'paid'
          mocks.current.stripe_session_id = String(updatePayload.stripe_session_id ?? '')
          mocks.current.form_data = {
            ...(updatePayload.form_data as Record<string, unknown>),
            v30GenerationStartedAt: new Date().toISOString(),
          }
          return Promise.resolve({ data: rows, error: null })
        }
        return Promise.resolve({ data: [], error: null })
      }
      selected = columns
      return builder
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload
      mocks.updates.push(payload)
      return builder
    },
    eq() { return builder },
    single() {
      if (selected === 'form_data') return Promise.resolve({ data: { form_data: mocks.current.form_data }, error: null })
      return Promise.resolve({ data: mocks.current, error: null })
    },
    then(resolve: (value: unknown) => void) { resolve({ data: null, error: null }) },
  }
  return builder
}

vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({ from: () => queryBuilder() }),
}))

import { processStripeWebhookEvent } from '../stripe-webhook-handler'

const request = { nextUrl: { origin: 'http://localhost:3000' } } as never

function checkoutEvent(input: {
  source: string; projectPath?: string; paid?: boolean; id?: string
  type?: 'checkout.session.completed' | 'checkout.session.async_payment_succeeded'
  /** A discount took the session to zero: complete, terminal, nothing owed. */
  fullyDiscounted?: boolean
}) {
  mocks.ensureLedger.mockResolvedValue({
    intakeId: 'intake-test',
    projectPath: input.projectPath ?? 'cost_estimate',
    created: true,
  })
  return {
    id: input.id ?? 'evt_test_1', type: input.type ?? 'checkout.session.completed',
    data: { object: {
      id: 'cs_test_1',
      payment_status: input.fullyDiscounted
        ? 'no_payment_required'
        : input.paid === false ? 'unpaid' : 'paid',
      amount_total: input.fullyDiscounted ? 0 : 55_000,
      metadata: { source: input.source, intakeId: 'intake-test', projectPath: input.projectPath },
      customer_details: { email: 'fixture@example.com', name: 'Fixture Homeowner' },
    } },
  } as never
}

describe('shared Stripe webhook handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Automated fulfillment is behind a feature flag read from the environment.
    // Without this the suite silently asserts the flag-off path on any machine
    // that has no local .env, so pin it for the automation cases below.
    vi.stubEnv('KEALEE_V30_ENABLED', 'true')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    mocks.updates.length = 0
    mocks.transitioned = true
    mocks.current = {
      form_data: {
        description: 'Keep the original brick wall', uploadedFiles: ['current-space.jpg', 'survey.pdf'],
        stylePreferences: 'warm modern',
      },
      metadata: {}, status: 'new', stripe_session_id: null,
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('passes the signed Stripe event id into revenue fulfillment', async () => {
    await processStripeWebhookEvent(checkoutEvent({ source: 'revenue_product', id: 'evt_revenue_123' }), request)
    expect(mocks.fulfillRevenueProduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'cs_test_1' }), 'evt_revenue_123')
  })

  it('does not fulfill unpaid or unknown checkout sources', async () => {
    await processStripeWebhookEvent(checkoutEvent({ source: 'revenue_product', paid: false }), request)
    await processStripeWebhookEvent(checkoutEvent({ source: 'unknown' }), request)
    expect(mocks.fulfillRevenueProduct).not.toHaveBeenCalled()
    expect(mocks.triggerV30).not.toHaveBeenCalled()
  })

  it('fulfills a session a promotion code took to zero', async () => {
    // `no_payment_required` is NOT `unpaid`. The session is complete and no
    // further Stripe event will ever arrive for it, so returning early here
    // dropped every fully-discounted order permanently — the customer checks
    // out and receives nothing. Eight checkout routes set
    // allow_promotion_codes, so this was reachable from all of them.
    await processStripeWebhookEvent(
      checkoutEvent({ source: 'revenue_product', fullyDiscounted: true }), request)
    expect(mocks.fulfillRevenueProduct).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'no_payment_required' }), 'evt_test_1')
  })

  it('still waits on an unpaid session, which settles later', async () => {
    // The async-payment case is the one the early return is FOR: an unpaid
    // session fires checkout.session.async_payment_succeeded once it settles.
    await processStripeWebhookEvent(
      checkoutEvent({ source: 'revenue_product', paid: false }), request)
    expect(mocks.fulfillRevenueProduct).not.toHaveBeenCalled()
  })

  it('fulfills an asynchronous payment when Stripe reports settlement', async () => {
    await processStripeWebhookEvent(checkoutEvent({
      source: 'public_intake',
      projectPath: 'cost_estimate',
      type: 'checkout.session.async_payment_succeeded',
    }), request)
    expect(mocks.triggerV30).toHaveBeenCalledWith(
      'intake-test',
      expect.objectContaining({ workflowTemplateId: 'wf_estimate_v1' }),
    )
  })

  it('creates an operational ledger entry for a direct product checkout', async () => {
    await processStripeWebhookEvent(checkoutEvent({ source: 'product-order' }), request)
    expect(mocks.ensureLedger).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cs_test_1' }),
      'evt_test_1',
    )
    expect(mocks.triggerV30).toHaveBeenCalledWith(
      'intake-test',
      expect.objectContaining({ workflowTemplateId: 'wf_estimate_v1' }),
    )
  })

  it.each([
    ['cost_estimate', ['estimate', 'project']],
    ['permit_path_only', ['zoning', 'permit', 'project']],
    ['estimate_permit_bundle', ['estimate', 'zoning', 'permit', 'project']],
    ['design_estimate_permit_bundle', ['design', 'estimate', 'zoning', 'permit', 'project']],
    ['preliminary_site_plan', ['zoning', 'permit', 'floorplan', 'project']],
    ['whole_home_concept', ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project']],
  ] as const)('routes %s to its exact automation set and preserves intake data', async (projectPath, botTypes) => {
    await processStripeWebhookEvent(checkoutEvent({ source: 'public_intake', projectPath }), request)
    expect(mocks.ensureRun).toHaveBeenCalledWith(expect.objectContaining({ botTypes, productKey: projectPath }))
    expect(mocks.triggerV30).toHaveBeenCalledWith('intake-test', expect.objectContaining({ fulfillmentBotTypes: botTypes }))
    expect(mocks.updates[0].form_data).toEqual(expect.objectContaining({
      description: 'Keep the original brick wall', uploadedFiles: ['current-space.jpg', 'survey.pdf'],
      stylePreferences: 'warm modern', fulfillmentBotTypes: botTypes,
    }))
  })

  it('forces v30 fulfillment on for a paid permit product', async () => {
    await processStripeWebhookEvent(
      checkoutEvent({ source: 'public_intake', projectPath: 'permit_path_only' }),
      request,
    )

    expect(mocks.triggerV30).toHaveBeenCalledWith(
      'intake-test',
      expect.objectContaining({
        forceEnabled: true,
        fulfillmentBotTypes: ['zoning', 'permit', 'project'],
        workflowTemplateId: 'wf_permit_roadmap_v1',
      }),
    )
  })

  it('hands a paid order to the human queue when automation is switched off', async () => {
    vi.stubEnv('KEALEE_V30_ENABLED', 'false')
    await processStripeWebhookEvent(
      checkoutEvent({ source: 'public_intake', projectPath: 'cost_estimate' }),
      request,
    )
    expect(mocks.ensureRun).not.toHaveBeenCalled()
    expect(mocks.triggerV30).not.toHaveBeenCalled()
    expect(mocks.routeToManual).toHaveBeenCalledWith(
      expect.objectContaining({ intakeId: 'intake-test', projectPath: 'cost_estimate', reason: 'automation_disabled' }),
    )
  })

  it('suppresses duplicate generation for the same paid checkout session', async () => {
    const event = checkoutEvent({ source: 'public_intake', projectPath: 'cost_estimate' })
    await processStripeWebhookEvent(event, request)
    await processStripeWebhookEvent(event, request)
    expect(mocks.ensureRun).toHaveBeenCalledTimes(1)
    expect(mocks.triggerV30).toHaveBeenCalledTimes(1)
    expect(mocks.sendCustomerEmail).toHaveBeenCalledTimes(1)
  })
})
