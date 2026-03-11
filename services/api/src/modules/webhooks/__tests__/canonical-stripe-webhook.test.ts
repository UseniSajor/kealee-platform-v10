/**
 * Canonical Stripe Webhook Tests
 *
 * Covers:
 *   - checkout.session.completed for concept package purchases (anonymous & existing users)
 *   - User upsert by email on anonymous checkout
 *   - ConceptPackageOrder creation with idempotency
 *   - Concept delivery queue trigger
 *   - Event delegation to paymentWebhookService for milestone events
 *   - Duplicate / idempotency protection (same Stripe session ID)
 *   - Subscription checkout passthrough
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────
// vi.mock factories are hoisted — they must NOT reference variables declared
// below in this file.  Use vi.hoisted() for shared mock state.

const {
  mockTransaction,
  mockPrisma,
  mockStripeInstance,
  mockQueueAdd,
  mockRouteWebhook,
} = vi.hoisted(() => {
  const mockTransaction = vi.fn()
  const mockPrisma = {
    $transaction: mockTransaction,
    user: { upsert: vi.fn(), findUnique: vi.fn() },
    conceptPackageOrder: { findFirst: vi.fn(), create: vi.fn() },
    marketingLead: { create: vi.fn() },
    funnelSession: { update: vi.fn() },
    serviceSubscription: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    servicePlan: { findUnique: vi.fn() },
    payment: { create: vi.fn() },
    invoice: { create: vi.fn() },
    permit: { findUnique: vi.fn(), update: vi.fn() },
  }
  const mockStripeInstance = {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    customers: { retrieve: vi.fn() },
  }
  const mockQueueAdd = vi.fn().mockResolvedValue({})
  const mockRouteWebhook = vi.fn().mockResolvedValue({ handled: false, eventType: 'unknown' })
  return { mockTransaction, mockPrisma, mockStripeInstance, mockQueueAdd, mockRouteWebhook }
})

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: mockPrisma,
}))

vi.mock('../../billing/stripe.client', () => ({
  getStripe: () => mockStripeInstance,
}))

vi.mock('../../audit/audit.service', () => ({
  auditService: { recordAudit: vi.fn().mockResolvedValue(undefined) },
}))
vi.mock('../../events/event.service', () => ({
  eventService: { recordEvent: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../entitlements/entitlement.service', () => ({
  entitlementService: {
    enableModule: vi.fn().mockResolvedValue(undefined),
    disableModule: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../billing/billing.constants', () => ({
  mapStripeSubscriptionStatus: (s: string) => s,
  getPlanSlugFromPriceId: () => null,
  OPS_SERVICES_MODULE_KEY: 'ops-services',
}))

vi.mock('../../../utils/concept-delivery-queue', () => ({
  getConceptDeliveryQueue: () => ({ add: mockQueueAdd }),
}))

vi.mock('../../../utils/email-queue', () => ({
  getEmailQueue: () => ({ add: vi.fn().mockResolvedValue({}) }),
}))

vi.mock('../../integrations/ghl/ghl-sync', () => ({
  syncCheckout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../utils/sanitize-error', () => ({
  sanitizeErrorMessage: (err: any, fallback?: string) => err?.message || fallback || 'Unknown error',
}))

vi.mock('../../payments/payment-webhook.service', () => ({
  paymentWebhookService: { routeWebhook: mockRouteWebhook },
}))

vi.mock('../../payments/stripe-connect.service', () => ({
  stripeConnectService: { handleConnectWebhook: vi.fn().mockResolvedValue(undefined) },
}))

// ── Import SUT after mocks ──
import { handleStripeWebhook } from '../stripe.webhook'

// ── Helpers ──────────────────────────────────────────────────────────────

function buildFastifyRequest(overrides: Record<string, any> = {}) {
  return {
    headers: { 'stripe-signature': 'sig_test_valid' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    rawBody: Buffer.from('{}'),
    body: '{}',
    log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
    ...overrides,
  } as any
}

function buildFastifyReply() {
  const reply: any = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply
}

function makeCheckoutSession(overrides: Record<string, any> = {}): any {
  return {
    id: 'cs_test_' + Math.random().toString(36).slice(2, 10),
    mode: 'payment',
    amount_total: 49900,
    currency: 'usd',
    payment_intent: 'pi_test_123',
    customer: null,
    customer_details: {
      email: 'buyer@example.com',
      name: 'Jane Buyer',
      phone: '+15555555555',
    },
    metadata: {
      source: 'concept-package',
      customerEmail: 'buyer@example.com',
      customerName: 'Jane Buyer',
      customerPhone: '+15555555555',
      funnelSessionId: 'funnel_abc',
      packageTier: 'professional',
      packageName: 'AI Concept Package - Professional',
    },
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('Canonical Stripe Webhook — handleStripeWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default env
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
  })

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  // ─── Signature verification ──────────────────────────────────────────

  it('rejects requests without stripe-signature header', async () => {
    const req = buildFastifyRequest({ headers: {} })
    const reply = buildFastifyReply()

    await handleStripeWebhook(req, reply)

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Missing stripe-signature') })
    )
  })

  it('rejects requests with invalid signature', async () => {
    mockStripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const req = buildFastifyRequest()
    const reply = buildFastifyReply()

    await handleStripeWebhook(req, reply)

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Webhook Error') })
    )
  })

  it('returns 429 when rate limit is exceeded', async () => {
    // Flood requests from a single IP to trigger rate limit
    const req = buildFastifyRequest({ ip: '10.99.99.99' })
    const reply = buildFastifyReply()

    // We need to trigger 100+ calls quickly.  The rate-limiter is per IP so
    // we simulate by calling many times with the same IP.
    for (let i = 0; i < 101; i++) {
      const r = buildFastifyReply()
      await handleStripeWebhook(buildFastifyRequest({ ip: '10.99.99.99' }), r)
    }

    // The 102nd should be rate limited
    const finalReply = buildFastifyReply()
    await handleStripeWebhook(buildFastifyRequest({ ip: '10.99.99.99' }), finalReply)
    expect(finalReply.code).toHaveBeenCalledWith(429)
  })

  // ─── checkout.session.completed — concept package ─────────────────────

  describe('checkout.session.completed — concept package purchase', () => {
    const session = makeCheckoutSession()
    const userId = 'user_new_abc'
    const orderId = 'order_xyz'
    const leadId = 'lead_123'

    beforeEach(() => {
      const event = {
        id: 'evt_test_checkout_' + Math.random().toString(36).slice(2, 8),
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)

      // Simulate the $transaction — execute the callback and return result
      mockTransaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txProxy = {
          user: {
            upsert: vi.fn().mockResolvedValue({ id: userId, email: session.customer_details.email }),
          },
          conceptPackageOrder: {
            findFirst: vi.fn().mockResolvedValue(null), // no existing order
            create: vi.fn().mockResolvedValue({ id: orderId }),
          },
        }
        return cb(txProxy)
      })

      mockPrisma.marketingLead.create.mockResolvedValue({ id: leadId })
      mockPrisma.funnelSession.update.mockResolvedValue({})
      mockPrisma.conceptPackageOrder.findFirst.mockResolvedValue({ id: orderId })
    })

    it('creates a user account via upsert on anonymous checkout', async () => {
      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Should return 200
      expect(reply.code).toHaveBeenCalledWith(200)

      // Transaction should have been called (user upsert + order create are inside it)
      expect(mockTransaction).toHaveBeenCalled()
    })

    it('creates a ConceptPackageOrder record', async () => {
      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // The transaction callback creates the order; just verify transaction ran
      expect(mockTransaction).toHaveBeenCalled()
    })

    it('skips duplicate orders (idempotency)', async () => {
      // Simulate existing order found inside transaction
      mockTransaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txProxy = {
          user: {
            upsert: vi.fn().mockResolvedValue({ id: userId, email: 'buyer@example.com' }),
          },
          conceptPackageOrder: {
            findFirst: vi.fn().mockResolvedValue({ id: orderId }), // already exists
            create: vi.fn(),
          },
        }
        return cb(txProxy)
      })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Reply should still be 200
      expect(reply.code).toHaveBeenCalledWith(200)

      // Marketing lead should NOT be created for duplicate
      expect(mockPrisma.marketingLead.create).not.toHaveBeenCalled()
    })

    it('queues concept generation job', async () => {
      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Allow async processing to complete
      await new Promise((r) => setTimeout(r, 100))

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'generate-concept',
        expect.objectContaining({
          orderId,
          packageTier: 'professional',
          customerEmail: 'buyer@example.com',
        })
      )
    })

    it('creates a marketing lead', async () => {
      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Allow async processing
      await new Promise((r) => setTimeout(r, 100))

      expect(mockPrisma.marketingLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'buyer@example.com',
            source: 'concept-package-purchase',
            status: 'qualified',
          }),
        })
      )
    })
  })

  // ─── checkout.session.completed — subscription ───────────────────────

  describe('checkout.session.completed — subscription checkout', () => {
    it('processes subscription checkout (non-concept-package)', async () => {
      const session = {
        id: 'cs_test_sub_456',
        mode: 'subscription',
        subscription: 'sub_test_789',
        customer: 'cus_test_111',
        metadata: { orgId: 'org_test_222', planSlug: 'package-a' },
        amount_total: 175000,
        currency: 'usd',
        customer_details: { email: 'admin@company.com' },
      }

      const event = {
        id: 'evt_test_sub_checkout',
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test_789',
        metadata: { planSlug: 'package-a' },
        items: { data: [{ price: { id: 'price_123' } }] },
      })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      expect(reply.code).toHaveBeenCalledWith(200)
      // Should NOT trigger concept package flow
      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  // ─── Event delegation to paymentWebhookService ────────────────────────

  describe('event delegation to paymentWebhookService', () => {
    it('delegates unhandled event types to paymentWebhookService', async () => {
      const event = {
        id: 'evt_test_transfer',
        type: 'transfer.created',
        data: { object: { id: 'tr_test_123', amount: 10000 } },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)
      mockRouteWebhook.mockResolvedValueOnce({ handled: true, eventType: 'transfer.created' })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Allow async processing
      await new Promise((r) => setTimeout(r, 100))

      expect(mockRouteWebhook).toHaveBeenCalledWith(event)
    })

    it('delegates charge.refunded to paymentWebhookService', async () => {
      const event = {
        id: 'evt_test_refund',
        type: 'charge.refunded',
        data: { object: { id: 'ch_test_456', payment_intent: 'pi_test_789', amount_refunded: 5000 } },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)
      mockRouteWebhook.mockResolvedValueOnce({ handled: true, eventType: 'charge.refunded' })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      await new Promise((r) => setTimeout(r, 100))

      expect(mockRouteWebhook).toHaveBeenCalledWith(event)
    })

    it('delegates payout.paid to paymentWebhookService', async () => {
      const event = {
        id: 'evt_test_payout',
        type: 'payout.paid',
        data: { object: { id: 'po_test_789', amount: 50000 } },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)
      mockRouteWebhook.mockResolvedValueOnce({ handled: true, eventType: 'payout.paid' })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      await new Promise((r) => setTimeout(r, 100))

      expect(mockRouteWebhook).toHaveBeenCalledWith(event)
    })
  })

  // ─── Permit payment flow ──────────────────────────────────────────────

  describe('checkout.session.completed — permit payment', () => {
    it('processes permit payment when metadata has permitId', async () => {
      const session = {
        id: 'cs_test_permit_789',
        mode: 'payment',
        amount_total: 35000,
        currency: 'usd',
        customer_details: { email: 'owner@build.com' },
        metadata: {
          permitId: 'permit_test_001',
          feeType: 'application',
          orgId: 'org_permit_test',
          userId: 'user_permit_test',
        },
      }

      const event = {
        id: 'evt_test_permit_payment',
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)
      mockPrisma.permit.findUnique.mockResolvedValue({ id: 'permit_test_001', metadata: {} })
      mockPrisma.permit.update.mockResolvedValue({})

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      expect(reply.code).toHaveBeenCalledWith(200)
      // Should NOT trigger concept package flow
      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  // ─── Anonymous user creation ──────────────────────────────────────────

  describe('anonymous checkout — user upsert by email', () => {
    it('creates a new user when none exists for the email', async () => {
      const session = makeCheckoutSession({
        id: 'cs_anon_new_user',
        customer: null,
        customer_details: {
          email: 'newuser@example.com',
          name: 'New User',
          phone: null,
        },
        metadata: {
          source: 'concept-package',
          customerEmail: 'newuser@example.com',
          customerName: 'New User',
          customerPhone: '',
          packageTier: 'essential',
          packageName: 'AI Concept Package - Essential',
        },
      })

      const newUserId = 'user_brand_new'
      const newOrderId = 'order_anon_123'

      const event = {
        id: 'evt_test_anon_new',
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)

      mockTransaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txProxy = {
          user: {
            upsert: vi.fn().mockResolvedValue({
              id: newUserId,
              email: 'newuser@example.com',
              name: 'New User',
            }),
          },
          conceptPackageOrder: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: newOrderId }),
          },
        }
        const result = await cb(txProxy)
        // Verify the upsert was called with create data
        expect(txProxy.user.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email: 'newuser@example.com' },
            create: expect.objectContaining({
              email: 'newuser@example.com',
              name: 'New User',
              status: 'ACTIVE',
            }),
          })
        )
        return result
      })

      mockPrisma.marketingLead.create.mockResolvedValue({ id: 'lead_anon' })
      mockPrisma.conceptPackageOrder.findFirst.mockResolvedValue({ id: newOrderId })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      expect(reply.code).toHaveBeenCalledWith(200)
      expect(mockTransaction).toHaveBeenCalled()
    })

    it('updates existing user info on repeat purchase', async () => {
      const session = makeCheckoutSession({
        id: 'cs_anon_existing_user',
        customer_details: {
          email: 'returning@example.com',
          name: 'Returning User Updated',
          phone: '+19999999999',
        },
        metadata: {
          source: 'concept-package',
          customerEmail: 'returning@example.com',
          customerName: 'Returning User Updated',
          customerPhone: '+19999999999',
          packageTier: 'premium',
          packageName: 'AI Concept Package - Premium',
        },
      })

      const event = {
        id: 'evt_test_anon_existing',
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)

      mockTransaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        const txProxy = {
          user: {
            upsert: vi.fn().mockResolvedValue({
              id: 'user_existing_xyz',
              email: 'returning@example.com',
            }),
          },
          conceptPackageOrder: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'order_return' }),
          },
        }
        const result = await cb(txProxy)
        // Verify update was passed with new name/phone
        expect(txProxy.user.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email: 'returning@example.com' },
            update: expect.objectContaining({
              name: 'Returning User Updated',
              phone: '+19999999999',
            }),
          })
        )
        return result
      })

      mockPrisma.marketingLead.create.mockResolvedValue({ id: 'lead_return' })
      mockPrisma.conceptPackageOrder.findFirst.mockResolvedValue({ id: 'order_return' })

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      expect(reply.code).toHaveBeenCalledWith(200)
    })
  })

  // ─── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('skips concept purchase when customer email is missing', async () => {
      const session = makeCheckoutSession({
        id: 'cs_no_email',
        customer_details: { email: null, name: null },
        metadata: {
          source: 'concept-package',
          customerEmail: '',
          packageTier: 'essential',
          packageName: 'Test',
        },
      })

      const event = {
        id: 'evt_no_email',
        type: 'checkout.session.completed',
        data: { object: session },
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(event)

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      await handleStripeWebhook(req, reply)

      // Should still return 200 (graceful skip)
      expect(reply.code).toHaveBeenCalledWith(200)
      // Should NOT create a user or order
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('handles missing STRIPE_WEBHOOK_SECRET', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const req = buildFastifyRequest()
      const reply = buildFastifyReply()

      // constructEvent will throw because no secret
      mockStripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
      })

      await handleStripeWebhook(req, reply)

      // Should get an error response
      expect(reply.code).toHaveBeenCalledWith(expect.any(Number))
    })
  })
})
