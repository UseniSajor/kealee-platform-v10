/**
 * Software Billing Service
 *
 * Handles Stripe checkout, usage tracking, plan changes, and cancellation
 * for Software-Only packages (S1 Starter – S4 Enterprise).
 */

import Stripe from 'stripe'
import { prismaAny } from '../../utils/prisma-helper'
import { getStripe } from './stripe.client'

// ── Tier slug mapping (matches setup-software-packages.ts lookup keys) ──

const TIER_SLUGS: Record<string, string> = {
  S1: 's1-starter',
  S2: 's2-builder',
  S3: 's3-pro',
  S4: 's4-enterprise',
}

const TIER_LABELS: Record<string, string> = {
  S1: 'Starter',
  S2: 'Builder',
  S3: 'Pro',
  S4: 'Enterprise',
}

// Limits per tier per pricing sub-tier
const TIER_LIMITS: Record<string, Record<string, { projects: number; users: number }>> = {
  S1: { basic: { projects: 1, users: 1 }, standard: { projects: 2, users: 1 }, plus: { projects: 3, users: 1 } },
  S2: { basic: { projects: 5, users: 3 }, standard: { projects: 7, users: 4 }, plus: { projects: 10, users: 5 } },
  S3: { basic: { projects: 15, users: 8 }, standard: { projects: 20, users: 10 }, plus: { projects: 30, users: 15 } },
  S4: { basic: { projects: 50, users: 25 }, standard: { projects: 75, users: 35 }, plus: { projects: 100, users: 50 } },
}

const TIER_ORDER = ['S1', 'S2', 'S3', 'S4']

export class SoftwareBillingService {
  private get stripe() {
    return getStripe()
  }

  /**
   * Build the Stripe price lookup_key for a software package.
   * Format: software-{tierSlug}-{pricingTier}-{monthly|annual}
   */
  private buildLookupKey(tier: string, pricingTier: string, interval: 'month' | 'year'): string {
    const slug = TIER_SLUGS[tier]
    if (!slug) throw new Error(`Invalid tier: ${tier}`)
    const intervalLabel = interval === 'year' ? 'annual' : 'monthly'
    return `software-${slug}-${pricingTier}-${intervalLabel}`
  }

  /**
   * Resolve a Stripe Price from its lookup key.
   */
  private async resolvePriceByLookup(lookupKey: string): Promise<Stripe.Price> {
    const prices = await this.stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    })
    if (prices.data.length === 0) {
      throw new Error(`No active Stripe price found for lookup key: ${lookupKey}`)
    }
    return prices.data[0]
  }

  /**
   * Get the user's org ID (first org they belong to).
   */
  private async getUserOrgId(userId: string): Promise<string> {
    const membership = await prismaAny.orgMember.findFirst({
      where: { userId },
      select: { orgId: true },
    })
    if (!membership) throw new Error('User is not a member of any organization')
    return membership.orgId
  }

  // ────────────────────────────────────────────────────────────────────
  // 1. Create Checkout Session
  // ────────────────────────────────────────────────────────────────────

  async createCheckoutSession(params: {
    userId: string
    tier: string
    pricingTier: string
    interval: 'month' | 'year'
    successUrl: string
    cancelUrl: string
  }) {
    const { userId, tier, pricingTier, interval, successUrl, cancelUrl } = params
    const orgId = await this.getUserOrgId(userId)

    // Resolve price
    const lookupKey = this.buildLookupKey(tier, pricingTier, interval)
    const price = await this.resolvePriceByLookup(lookupKey)

    // Get or create Stripe customer
    const user = await prismaAny.user.findUnique({ where: { id: userId }, select: { id: true, email: true, stripeCustomerId: true } })
    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user?.email || undefined,
        metadata: { userId, orgId },
      })
      customerId = customer.id
      await prismaAny.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          orgId,
          tier,
          pricingTier,
          packageType: 'software_only',
        },
      },
      metadata: {
        userId,
        orgId,
        tier,
        pricingTier,
        packageType: 'software_only',
      },
    })

    return { url: session.url, id: session.id }
  }

  // ────────────────────────────────────────────────────────────────────
  // 2. Get Usage
  // ────────────────────────────────────────────────────────────────────

  async getUsage(userId: string) {
    const orgId = await this.getUserOrgId(userId)

    // Count active projects
    const projectCount = await prismaAny.project.count({
      where: { orgId, status: { not: 'ARCHIVED' } },
    })

    // Count org members
    const memberCount = await prismaAny.orgMember.count({
      where: { orgId },
    })

    // Get software subscription
    const subscription = await prismaAny.softwareSubscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      // Check for PM service subscription as fallback
      const pmSub = await prismaAny.pMServiceSubscription.findFirst({
        where: { clientId: orgId, status: { in: ['ACTIVE', 'active'] } },
      })

      if (pmSub) {
        return {
          projects: { used: projectCount, max: pmSub.maxConcurrentProjects || 999, percentage: 0 },
          users: { used: memberCount, max: 999, percentage: 0 },
          tier: null,
          pricingTier: null,
          packageType: 'PM_SERVICE' as const,
          pmTier: pmSub.packageTier,
          status: 'ACTIVE',
          currentPeriodEnd: pmSub.endDate,
        }
      }

      return {
        projects: { used: projectCount, max: 0, percentage: 0 },
        users: { used: memberCount, max: 0, percentage: 0 },
        tier: null,
        pricingTier: null,
        packageType: null,
        pmTier: null,
        status: 'NONE',
        currentPeriodEnd: null,
      }
    }

    const maxProjects = subscription.maxProjects || 1
    const maxUsers = subscription.maxUsers || 1

    return {
      projects: {
        used: projectCount,
        max: maxProjects,
        percentage: Math.round((projectCount / maxProjects) * 100),
      },
      users: {
        used: memberCount,
        max: maxUsers,
        percentage: Math.round((memberCount / maxUsers) * 100),
      },
      tier: subscription.softwareTier,
      pricingTier: subscription.pricingTier || 'standard',
      packageType: 'SOFTWARE_ONLY' as const,
      pmTier: null,
      status: subscription.status,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      trialEnd: subscription.trialEndsAt,
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 3. Get Subscription Details
  // ────────────────────────────────────────────────────────────────────

  async getSubscription(userId: string) {
    const subscription = await prismaAny.softwareSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      // Fallback: check PM service
      const orgId = await this.getUserOrgId(userId)
      const pmSub = await prismaAny.pMServiceSubscription.findFirst({
        where: { clientId: orgId, status: { in: ['ACTIVE', 'active'] } },
      })

      if (pmSub) {
        return {
          type: 'PM_SERVICE',
          tier: pmSub.packageTier,
          status: 'ACTIVE',
          maxProjects: pmSub.maxConcurrentProjects,
          maxUsers: 999,
          currentPeriodEnd: pmSub.endDate,
          cancelAtPeriodEnd: false,
        }
      }

      return null
    }

    return {
      id: subscription.id,
      type: 'SOFTWARE_ONLY',
      tier: subscription.softwareTier,
      pricingTier: subscription.pricingTier,
      status: subscription.status,
      maxProjects: subscription.maxProjects,
      maxUsers: subscription.maxUsers,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      trialEnd: subscription.trialEndsAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      createdAt: subscription.createdAt,
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 4. Change Plan (Upgrade / Downgrade)
  // ────────────────────────────────────────────────────────────────────

  async changePlan(params: {
    userId: string
    newTier: string
    newPricingTier: string
    interval: 'month' | 'year'
  }) {
    const { userId, newTier, newPricingTier, interval } = params

    // Find existing subscription
    const subscription = await prismaAny.softwareSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    })
    if (!subscription) throw new Error('No active software subscription found')
    if (!subscription.stripeSubscriptionId) throw new Error('Subscription has no Stripe ID')

    // Resolve new price
    const lookupKey = this.buildLookupKey(newTier, newPricingTier, interval)
    const newPrice = await this.resolvePriceByLookup(lookupKey)

    // Get current Stripe subscription
    const stripeSub = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)

    // Update Stripe subscription with proration
    const updatedStripeSub = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSub.items.data[0].id,
        price: newPrice.id,
      }],
      proration_behavior: 'create_prorations',
      metadata: {
        tier: newTier,
        pricingTier: newPricingTier,
        packageType: 'software_only',
      },
    })

    // Get new limits
    const limits = TIER_LIMITS[newTier]?.[newPricingTier]
    if (!limits) throw new Error(`Invalid tier/pricingTier combo: ${newTier}/${newPricingTier}`)

    // Update database
    const updated = await prismaAny.softwareSubscription.update({
      where: { id: subscription.id },
      data: {
        softwareTier: newTier,
        pricingTier: newPricingTier,
        maxProjects: limits.projects,
        maxUsers: limits.users,
        stripePriceId: newPrice.id,
      },
    })

    return {
      subscription: updated,
      prorationAmount: null, // Stripe handles proration automatically
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 5. Cancel Subscription
  // ────────────────────────────────────────────────────────────────────

  async cancelSubscription(userId: string, immediately: boolean = false) {
    const subscription = await prismaAny.softwareSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    })
    if (!subscription) throw new Error('No active software subscription found')
    if (!subscription.stripeSubscriptionId) throw new Error('Subscription has no Stripe ID')

    if (immediately) {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      await prismaAny.softwareSubscription.update({
        where: { id: subscription.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
    } else {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
      await prismaAny.softwareSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      })
    }

    return { cancelled: true, immediately }
  }

  // ────────────────────────────────────────────────────────────────────
  // 6. Create Portal Session
  // ────────────────────────────────────────────────────────────────────

  async createPortalSession(userId: string, returnUrl: string) {
    const subscription = await prismaAny.softwareSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED'] } },
      orderBy: { createdAt: 'desc' },
    })

    let customerId: string | undefined

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId
    } else {
      const user = await prismaAny.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })
      customerId = user?.stripeCustomerId
    }

    if (!customerId) throw new Error('No Stripe customer found. Please subscribe first.')

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  // ────────────────────────────────────────────────────────────────────
  // 7. Handle Webhook Events (called from webhook handler)
  // ────────────────────────────────────────────────────────────────────

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const metadata = session.metadata || {}
    if (metadata.packageType !== 'software_only') return

    const { userId, orgId, tier, pricingTier } = metadata
    if (!userId || !tier) return

    const limits = TIER_LIMITS[tier]?.[pricingTier || 'standard']
    if (!limits) return

    // Get subscription details from Stripe
    const stripeSubId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id
    let stripeSub: Stripe.Subscription | null = null
    if (stripeSubId) {
      stripeSub = await this.stripe.subscriptions.retrieve(stripeSubId)
    }

    // Create SoftwareSubscription record
    await prismaAny.softwareSubscription.create({
      data: {
        userId,
        softwareTier: tier,
        pricingTier: pricingTier || 'standard',
        maxProjects: limits.projects,
        maxUsers: limits.users,
        status: 'ACTIVE',
        stripeSubscriptionId: stripeSubId || null,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id || null,
        stripePriceId: stripeSub?.items?.data?.[0]?.price?.id || null,
        stripeCurrentPeriodEnd: stripeSub ? new Date((stripeSub as any).current_period_end * 1000) : null,
        trialEndsAt: stripeSub?.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      },
    })
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata || {}
    if (metadata.packageType !== 'software_only') return

    const existing = await prismaAny.softwareSubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })
    if (!existing) return

    const statusMap: Record<string, string> = {
      active: 'ACTIVE',
      trialing: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELLED',
      unpaid: 'PAUSED',
      incomplete: 'PAUSED',
      incomplete_expired: 'CANCELLED',
      paused: 'PAUSED',
    }

    await prismaAny.softwareSubscription.update({
      where: { id: existing.id },
      data: {
        status: statusMap[subscription.status] || 'ACTIVE',
        stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existing = await prismaAny.softwareSubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })
    if (!existing) return

    await prismaAny.softwareSubscription.update({
      where: { id: existing.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })
  }
}

export const softwareBillingService = new SoftwareBillingService()
