/**
 * checkout-webhook.test.ts
 *
 * Tests for checkout.session.completed webhook handling in PaymentWebhookService.
 *
 * Coverage:
 *   A. Owner-side one-time payment (concept/precon package) — anonymous user
 *   B. Owner-side one-time payment — existing user
 *   C. Contractor/Ops subscription checkout — anonymous user
 *   D. Contractor/Ops subscription checkout — existing user
 *   E. Idempotency: duplicate session.completed events ignored
 *   F. Missing customer email — graceful skip
 *   G. Unknown session mode — graceful skip
 *
 * TO RUN:  pnpm --filter services/api test -- checkout-webhook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paymentWebhookService } from '../payment-webhook.service'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    user:               { upsert: vi.fn() },
    conceptPackageOrder: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('../../events/event.service', () => ({
  eventService: { recordEvent: vi.fn() },
}))

// Suppress BullMQ / IORedis instantiation in tests (no REDIS_URL set)
vi.mock('bullmq', () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny } from '../../../utils/prisma-helper'
import { eventService } from '../../events/event.service'

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SESSION_ID_PAYMENT      = 'cs_test_payment_001'
const SESSION_ID_SUBSCRIPTION = 'cs_test_sub_001'
const USER_ID                 = 'user-uuid-001'
const PAYMENT_INTENT_ID       = 'pi_test_001'
const SUBSCRIPTION_ID         = 'sub_test_001'

const mockUser = { id: USER_ID, email: 'buyer@example.com', name: 'Jane Buyer' }

function buildPaymentSessionEvent(overrides: Record<string, any> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id:              SESSION_ID_PAYMENT,
        mode:            'payment',
        customer_email:  'buyer@example.com',
        payment_intent:  PAYMENT_INTENT_ID,
        amount_total:    49900,
        currency:        'usd',
        customer_details: { name: 'Jane Buyer', email: 'buyer@example.com' },
        metadata: {
          source:          'concept-package',
          customerEmail:   'buyer@example.com',
          customerName:    'Jane Buyer',
          customerPhone:   '555-0100',
          packageTier:     'professional',
          packageName:     'AI Concept Package — Professional',
          funnelSessionId: 'funnel-xyz',
        },
        ...overrides,
      },
    },
  }
}

function buildSubscriptionSessionEvent(overrides: Record<string, any> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id:              SESSION_ID_SUBSCRIPTION,
        mode:            'subscription',
        customer_email:  'contractor@example.com',
        subscription:    SUBSCRIPTION_ID,
        amount_total:    175000,
        currency:        'usd',
        customer_details: { name: 'Bob Builder', email: 'contractor@example.com' },
        metadata: {
          orgId:    'org-uuid-001',
          planSlug: 'package-a',
          interval: 'month',
        },
        ...overrides,
      },
    },
  }
}

// ─── A. Owner-side one-time payment — anonymous user ─────────────────────────

describe('A — Owner concept package checkout (anonymous user)', () => {
  it('upserts user, creates ConceptPackageOrder, records event', async () => {
    ;(prismaAny.user.upsert as any).mockResolvedValue(mockUser)
    ;(prismaAny.conceptPackageOrder.findUnique as any).mockResolvedValue(null)
    ;(prismaAny.conceptPackageOrder.create as any).mockResolvedValue({ id: 'order-1' })

    const event = buildPaymentSessionEvent()
    const result = await paymentWebhookService.routeWebhook(event)

    expect(result.handled).toBe(true)
    expect(result.eventType).toBe('checkout.session.completed')

    // User was upserted from email
    expect(prismaAny.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'buyer@example.com' },
      })
    )

    // Order created with correct fields
    expect(prismaAny.conceptPackageOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId:                USER_ID,
          stripeSessionId:       SESSION_ID_PAYMENT,
          stripePaymentIntentId: PAYMENT_INTENT_ID,
          packageTier:           'professional',
          packageName:           'AI Concept Package — Professional',
          amount:                49900,
          status:                'completed',
          deliveryStatus:        'pending',
          funnelSessionId:       'funnel-xyz',
        }),
      })
    )

    // Event recorded
    expect(eventService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type:   'CONCEPT_PACKAGE_ORDER_CREATED',
        userId: USER_ID,
        payload: expect.objectContaining({
          stripeSessionId: SESSION_ID_PAYMENT,
          packageTier:     'professional',
          amount:          499,
        }),
      })
    )
  })
})

// ─── B. Owner-side one-time payment — existing user ──────────────────────────

describe('B — Owner concept package checkout (existing user)', () => {
  it('upserts (updates) existing user and creates order without error', async () => {
    const existingUser = { id: 'existing-user', email: 'buyer@example.com', name: 'Jane Buyer' }
    ;(prismaAny.user.upsert as any).mockResolvedValue(existingUser)
    ;(prismaAny.conceptPackageOrder.findUnique as any).mockResolvedValue(null)
    ;(prismaAny.conceptPackageOrder.create as any).mockResolvedValue({ id: 'order-2' })

    await paymentWebhookService.handleCheckoutSessionCompleted(buildPaymentSessionEvent())

    // user.upsert called with update: {} — existing user record untouched
    expect(prismaAny.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} })
    )
    expect(prismaAny.conceptPackageOrder.create).toHaveBeenCalledOnce()
  })
})

// ─── C. Contractor/Ops subscription checkout — anonymous user ────────────────

describe('C — Contractor subscription checkout (anonymous user)', () => {
  it('upserts user, records SUBSCRIPTION_CHECKOUT_COMPLETED event', async () => {
    const contractorUser = { id: 'contractor-user-1', email: 'contractor@example.com', name: 'Bob Builder' }
    ;(prismaAny.user.upsert as any).mockResolvedValue(contractorUser)

    const event = buildSubscriptionSessionEvent()
    const result = await paymentWebhookService.routeWebhook(event)

    expect(result.handled).toBe(true)

    // User upserted
    expect(prismaAny.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'contractor@example.com' },
      })
    )

    // No ConceptPackageOrder for subscription mode
    expect(prismaAny.conceptPackageOrder.create).not.toHaveBeenCalled()

    // Event recorded
    expect(eventService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type:   'SUBSCRIPTION_CHECKOUT_COMPLETED',
        userId: contractorUser.id,
        payload: expect.objectContaining({
          stripeSessionId: SESSION_ID_SUBSCRIPTION,
          subscriptionId:  SUBSCRIPTION_ID,
          planSlug:        'package-a',
          orgId:           'org-uuid-001',
        }),
      })
    )
  })

  it('derives customerName from customer_details when metadata.customerName is absent', async () => {
    ;(prismaAny.user.upsert as any).mockResolvedValue({ id: 'u2', email: 'contractor@example.com', name: 'Bob Builder' })

    const event = buildSubscriptionSessionEvent()
    delete (event.data.object.metadata as any).customerName

    await paymentWebhookService.handleCheckoutSessionCompleted(event)

    expect(prismaAny.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ name: 'Bob Builder' }),
      })
    )
  })
})

// ─── D. Contractor/Ops subscription checkout — existing user ─────────────────

describe('D — Contractor subscription checkout (existing user)', () => {
  it('upserts existing user with update:{} and records event', async () => {
    ;(prismaAny.user.upsert as any).mockResolvedValue({ id: 'existing-gc', email: 'contractor@example.com', name: 'Bob Builder' })

    await paymentWebhookService.handleCheckoutSessionCompleted(buildSubscriptionSessionEvent())

    expect(prismaAny.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} })
    )
    expect(eventService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SUBSCRIPTION_CHECKOUT_COMPLETED' })
    )
  })
})

// ─── E. Idempotency ───────────────────────────────────────────────────────────

describe('E — Idempotency: duplicate checkout.session.completed events', () => {
  it('skips ConceptPackageOrder creation when order already exists', async () => {
    ;(prismaAny.user.upsert as any).mockResolvedValue(mockUser)
    ;(prismaAny.conceptPackageOrder.findUnique as any).mockResolvedValue({
      id: 'existing-order',
      stripeSessionId: SESSION_ID_PAYMENT,
    })

    await paymentWebhookService.handleCheckoutSessionCompleted(buildPaymentSessionEvent())

    // order.create must NOT be called
    expect(prismaAny.conceptPackageOrder.create).not.toHaveBeenCalled()
    // event must NOT be re-fired
    expect(eventService.recordEvent).not.toHaveBeenCalled()
  })
})

// ─── F. Missing customer email ────────────────────────────────────────────────

describe('F — Missing customer email', () => {
  it('skips all provisioning when no email is available', async () => {
    const event = buildPaymentSessionEvent({
      customer_email:   null,
      customer_details: {},
      metadata:         { source: 'concept-package' }, // no customerEmail
    })

    await paymentWebhookService.handleCheckoutSessionCompleted(event)

    expect(prismaAny.user.upsert).not.toHaveBeenCalled()
    expect(prismaAny.conceptPackageOrder.create).not.toHaveBeenCalled()
    expect(eventService.recordEvent).not.toHaveBeenCalled()
  })
})

// ─── G. Unknown session mode ──────────────────────────────────────────────────

describe('G — Unknown session mode', () => {
  it('logs and skips without throwing for unrecognised mode', async () => {
    const event = buildPaymentSessionEvent({ mode: 'setup' })

    await expect(
      paymentWebhookService.handleCheckoutSessionCompleted(event)
    ).resolves.not.toThrow()

    expect(prismaAny.user.upsert).not.toHaveBeenCalled()
  })
})
