import type Stripe from 'stripe'
import { prismaAny } from '../../utils/prisma-helper'

export const WHITE_LABEL_BILLING_SCOPE = 'WHITE_LABEL_TENANT'
export const STRIPE_BILLING_SCOPE_METADATA_KEY = 'kealee_billing_scope'
export const STRIPE_ORG_ID_METADATA_KEY = 'kealee_org_id'

export interface TenantSubscriptionReconciliationResult {
  handled: boolean
  orgId?: string
  planId?: string
  billingStatus?: string
  reason?: 'NOT_WHITE_LABEL_SUBSCRIPTION'
}

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

function stripePeriod(subscription: Stripe.Subscription) {
  const raw = subscription as any
  const firstItem = raw.items?.data?.[0]
  const startSeconds = raw.current_period_start ?? firstItem?.current_period_start
  const endSeconds = raw.current_period_end ?? firstItem?.current_period_end
  return {
    currentPeriodStart: Number.isFinite(startSeconds) ? new Date(startSeconds * 1000) : null,
    currentPeriodEnd: Number.isFinite(endSeconds) ? new Date(endSeconds * 1000) : null,
  }
}

function basePriceIds(subscription: Stripe.Subscription): Set<string> {
  const items = (subscription as any).items?.data || []
  return new Set(items.map((item: any) => item.price?.id).filter(Boolean))
}

export function tenantBillingStatusFromStripe(status: Stripe.Subscription.Status | string): string {
  const statuses: Record<string, string> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'PAUSED',
  }
  return statuses[String(status).toLowerCase()] || 'UNKNOWN'
}

async function findTenantPlan(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {}
  const markedWhiteLabel = metadata[STRIPE_BILLING_SCOPE_METADATA_KEY] === WHITE_LABEL_BILLING_SCOPE
  const metadataOrgId = metadata[STRIPE_ORG_ID_METADATA_KEY]

  const existing = await prismaAny.tenantPlan.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: {
      org: {
        select: {
          id: true,
          tenantKind: true,
          whiteLabelProfile: { select: { id: true } },
        },
      },
    },
  })

  // Existing exact subscription mappings remain authoritative, but a
  // conflicting metadata org is rejected rather than silently reassigned.
  if (existing) {
    if (metadataOrgId && metadataOrgId !== existing.orgId) {
      throw Object.assign(new Error('Stripe subscription organization metadata conflicts with its tenant plan'), {
        statusCode: 409,
      })
    }
    return existing
  }

  // Do not let generic homeowner, project, marketplace, or PM subscriptions
  // enter the white-label billing plane merely because they share a customer.
  if (!markedWhiteLabel || !metadataOrgId) return null

  return prismaAny.tenantPlan.findUnique({
    where: { orgId: metadataOrgId },
    include: {
      org: {
        select: {
          id: true,
          tenantKind: true,
          whiteLabelProfile: { select: { id: true } },
        },
      },
    },
  })
}

/**
 * Reconciles a Stripe subscription only when it is already bound to a tenant
 * plan or carries the explicit white-label scope and organization metadata.
 * The function never creates a TenantPlan from untrusted webhook metadata.
 */
export async function reconcileTenantSubscription(
  subscription: Stripe.Subscription,
): Promise<TenantSubscriptionReconciliationResult> {
  const plan = await findTenantPlan(subscription)
  if (!plan) return { handled: false, reason: 'NOT_WHITE_LABEL_SUBSCRIPTION' }

  if (plan.org?.tenantKind !== 'WHITE_LABEL' || !plan.org?.whiteLabelProfile) {
    throw Object.assign(new Error('Tenant plan is not attached to a white-label professional organization'), {
      statusCode: 409,
    })
  }

  const customerId = asId(subscription.customer as any)
  if (!customerId) {
    throw Object.assign(new Error('Stripe subscription does not identify a customer'), { statusCode: 409 })
  }
  if (plan.stripeCustomerId && plan.stripeCustomerId !== customerId) {
    throw Object.assign(new Error('Stripe customer does not match the tenant plan'), { statusCode: 409 })
  }

  const period = stripePeriod(subscription)
  const configuredPriceId = plan.stripeBasePriceId as string | null
  const priceMismatch = Boolean(configuredPriceId && !basePriceIds(subscription).has(configuredPriceId))
  const stripeStatus = tenantBillingStatusFromStripe(subscription.status)
  const billingStatus = priceMismatch && ['ACTIVE', 'TRIALING'].includes(stripeStatus)
    ? 'PRICE_MISMATCH'
    : stripeStatus

  const updated = await prismaAny.tenantPlan.update({
    where: { id: plan.id },
    data: {
      stripeCustomerId: plan.stripeCustomerId || customerId,
      stripeSubscriptionId: subscription.id,
      billingStatus,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean((subscription as any).cancel_at_period_end),
    },
  })

  return {
    handled: true,
    orgId: plan.orgId,
    planId: updated.id,
    billingStatus,
  }
}

/** Fail closed immediately on an invoice failure, but only for an exact
 * subscription-to-tenant-plan binding. Successful invoices are reconciled by
 * Stripe's following subscription.updated event, which is authoritative. */
export async function markTenantInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const raw = invoice as any
  const subscriptionId = asId(
    raw.subscription
      ?? raw.parent?.subscription_details?.subscription
      ?? raw.parent?.subscription_details?.subscription_id,
  )
  if (!subscriptionId) return { handled: false as const }

  const plan = await prismaAny.tenantPlan.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { org: { select: { tenantKind: true } } },
  })
  if (!plan || plan.org?.tenantKind !== 'WHITE_LABEL') return { handled: false as const }

  const customerId = asId(raw.customer)
  if (plan.stripeCustomerId && customerId && plan.stripeCustomerId !== customerId) {
    throw Object.assign(new Error('Stripe invoice customer does not match the tenant plan'), { statusCode: 409 })
  }

  await prismaAny.tenantPlan.update({
    where: { id: plan.id },
    data: { billingStatus: 'PAST_DUE' },
  })
  return { handled: true as const, orgId: plan.orgId, planId: plan.id }
}
