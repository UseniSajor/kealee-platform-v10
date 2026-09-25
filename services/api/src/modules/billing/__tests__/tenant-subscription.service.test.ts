import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  tenantPlan: { findUnique: vi.fn(), update: vi.fn() },
}))

vi.mock('../../../utils/prisma-helper', () => ({ prismaAny: db }))

import {
  markTenantInvoicePaymentFailed,
  reconcileTenantSubscription,
  tenantBillingStatusFromStripe,
} from '../tenant-subscription.service'

const plan = {
  id: 'plan-1',
  orgId: 'org-pro',
  stripeCustomerId: 'cus-pro',
  stripeSubscriptionId: 'sub-pro',
  stripeBasePriceId: 'price-pro',
  org: {
    tenantKind: 'WHITE_LABEL',
    whiteLabelProfile: { id: 'profile-1' },
  },
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-pro',
    customer: 'cus-pro',
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: 1_800_000_000,
    current_period_end: 1_802_592_000,
    metadata: {},
    items: { data: [{ price: { id: 'price-pro' } }] },
    ...overrides,
  } as any
}

beforeEach(() => {
  vi.resetAllMocks()
  db.tenantPlan.update.mockResolvedValue({ id: 'plan-1' })
})

describe('white-label Stripe subscription reconciliation', () => {
  it('ignores generic subscriptions and preserves homeowner/project billing separation', async () => {
    db.tenantPlan.findUnique.mockResolvedValue(null)

    await expect(reconcileTenantSubscription(subscription({ id: 'sub-homeowner' }))).resolves.toEqual({
      handled: false,
      reason: 'NOT_WHITE_LABEL_SUBSCRIPTION',
    })
    expect(db.tenantPlan.findUnique).toHaveBeenCalledTimes(1)
    expect(db.tenantPlan.update).not.toHaveBeenCalled()
  })

  it('binds an explicitly scoped subscription to an existing professional tenant plan', async () => {
    db.tenantPlan.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...plan, stripeCustomerId: null, stripeSubscriptionId: null })

    const result = await reconcileTenantSubscription(subscription({
      metadata: {
        kealee_billing_scope: 'WHITE_LABEL_TENANT',
        kealee_org_id: 'org-pro',
      },
    }))

    expect(result).toMatchObject({ handled: true, orgId: 'org-pro', billingStatus: 'ACTIVE' })
    expect(db.tenantPlan.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'plan-1' },
      data: expect.objectContaining({
        stripeCustomerId: 'cus-pro',
        stripeSubscriptionId: 'sub-pro',
        billingStatus: 'ACTIVE',
      }),
    }))
  })

  it('rejects a customer mismatch without mutating the plan', async () => {
    db.tenantPlan.findUnique.mockResolvedValue(plan)

    await expect(reconcileTenantSubscription(subscription({ customer: 'cus-attacker' })))
      .rejects.toThrow('Stripe customer does not match')
    expect(db.tenantPlan.update).not.toHaveBeenCalled()
  })

  it('fails closed when the configured base price is absent', async () => {
    db.tenantPlan.findUnique.mockResolvedValue(plan)

    const result = await reconcileTenantSubscription(subscription({
      items: { data: [{ price: { id: 'price-other' } }] },
    }))

    expect(result.billingStatus).toBe('PRICE_MISMATCH')
    expect(db.tenantPlan.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ billingStatus: 'PRICE_MISMATCH' }),
    }))
  })

  it('keeps cancellation authoritative even if the price also differs', async () => {
    db.tenantPlan.findUnique.mockResolvedValue(plan)

    const result = await reconcileTenantSubscription(subscription({
      status: 'canceled',
      items: { data: [{ price: { id: 'price-other' } }] },
    }))

    expect(result.billingStatus).toBe('CANCELED')
  })

  it('marks only an exactly bound professional tenant invoice past due', async () => {
    db.tenantPlan.findUnique.mockResolvedValue(plan)

    await expect(markTenantInvoicePaymentFailed({
      id: 'in-1',
      customer: 'cus-pro',
      parent: { subscription_details: { subscription: 'sub-pro' } },
    } as any)).resolves.toMatchObject({ handled: true, orgId: 'org-pro' })
    expect(db.tenantPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { billingStatus: 'PAST_DUE' },
    })
  })

  it('maps every non-entitled Stripe state to a fail-closed value', () => {
    expect(tenantBillingStatusFromStripe('past_due')).toBe('PAST_DUE')
    expect(tenantBillingStatusFromStripe('unpaid')).toBe('UNPAID')
    expect(tenantBillingStatusFromStripe('paused')).toBe('PAUSED')
    expect(tenantBillingStatusFromStripe('new_state')).toBe('UNKNOWN')
  })
})
