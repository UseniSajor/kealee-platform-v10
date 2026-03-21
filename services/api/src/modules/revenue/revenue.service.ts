/**
 * revenue.service.ts — Revenue Optimization Layer
 * Subscription plans, lead pricing, sponsored placements, upsell offers, Stripe checkout.
 */
import prisma from '../../lib/prisma'
import type {
  CreateSubscriptionPlanBody,
  UpdateSubscriptionPlanBody,
  CreateLeadPricingBody,
  CreateSponsoredPlacementBody,
  GetUpsellOfferBody,
  StartCheckoutBody,
  SubscriptionPlanDto,
  LeadPricingDto,
  UpsellOfferDto,
  CheckoutSessionDto,
} from './revenue.dto'

const db = prisma as any

// ─── Subscription Plans ───────────────────────────────────────────────────────

export async function listSubscriptionPlans(includeInactive = false): Promise<SubscriptionPlanDto[]> {
  const plans = await db.subscriptionPlan.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ tier: 'asc' }, { monthlyPriceCents: 'asc' }],
  })
  return plans.map(mapPlan)
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlanDto> {
  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })
  return mapPlan(plan)
}

export async function createSubscriptionPlan(body: CreateSubscriptionPlanBody): Promise<SubscriptionPlanDto> {
  const plan = await db.subscriptionPlan.create({ data: { ...body, active: true } })
  return mapPlan(plan)
}

export async function updateSubscriptionPlan(
  planId: string,
  body: UpdateSubscriptionPlanBody,
): Promise<SubscriptionPlanDto> {
  const existing = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!existing) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })
  const plan = await db.subscriptionPlan.update({ where: { id: planId }, data: body })
  return mapPlan(plan)
}

// ─── Lead Pricing ─────────────────────────────────────────────────────────────

export async function listLeadPricing(tradeCategory?: string, jurisdictionCode?: string): Promise<LeadPricingDto[]> {
  const prices = await db.leadPricing.findMany({
    where: {
      active: true,
      ...(tradeCategory ? { tradeCategory } : {}),
      ...(jurisdictionCode ? { jurisdictionCode } : {}),
    },
    orderBy: [{ tradeCategory: 'asc' }, { jurisdictionCode: 'asc' }],
  })
  return prices.map(mapLeadPricing)
}

export async function getLeadPrice(tradeCategory: string, jurisdictionCode: string): Promise<LeadPricingDto | null> {
  const price = await db.leadPricing.findFirst({
    where: { tradeCategory, jurisdictionCode, active: true },
  })
  return price ? mapLeadPricing(price) : null
}

export async function upsertLeadPricing(body: CreateLeadPricingBody): Promise<LeadPricingDto> {
  const price = await db.leadPricing.upsert({
    where: { tradeCategory_jurisdictionCode: { tradeCategory: body.tradeCategory, jurisdictionCode: body.jurisdictionCode } },
    create: { ...body, active: true },
    update: { ...body },
  })
  return mapLeadPricing(price)
}

// ─── Sponsored Placements ─────────────────────────────────────────────────────

export async function createSponsoredPlacement(
  body: CreateSponsoredPlacementBody,
  sponsorId: string,
) {
  const placement = await db.sponsoredPlacement.create({
    data: {
      ...body,
      sponsorId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      active: true,
      impressions: 0,
      clicks: 0,
      spentCents: 0,
    },
  })
  return placement
}

export async function getActivePlacements(placementType: string, context?: { jurisdiction?: string; tradeCategory?: string }) {
  const now = new Date()
  const placements = await db.sponsoredPlacement.findMany({
    where: {
      placementType,
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
      ...(context?.jurisdiction ? { targetJurisdictions: { has: context.jurisdiction } } : {}),
      ...(context?.tradeCategory ? { targetTradeCategories: { has: context.tradeCategory } } : {}),
    },
    orderBy: { budgetCents: 'desc' },
    take: 10,
  })
  return placements
}

export async function recordPlacementImpression(placementId: string) {
  await db.sponsoredPlacement.update({
    where: { id: placementId },
    data: { impressions: { increment: 1 } },
  })
}

export async function recordPlacementClick(placementId: string) {
  await db.sponsoredPlacement.update({
    where: { id: placementId },
    data: { clicks: { increment: 1 } },
  })
}

// ─── Upsell Offers ────────────────────────────────────────────────────────────

const UPSELL_COPY: Record<string, { headline: string; body: string; ctaLabel: string; tier: string }> = {
  LEAD_LIMIT_REACHED: {
    headline: 'You\'ve reached your monthly lead limit',
    body: 'Upgrade to Professional to unlock unlimited leads in your market.',
    ctaLabel: 'Upgrade to Professional',
    tier: 'PROFESSIONAL',
  },
  READINESS_ADVANCE_BLOCKED: {
    headline: 'Unlock Construction Readiness Tracking',
    body: 'Starter and above includes full readiness gate advancement and milestone tracking.',
    ctaLabel: 'Upgrade to Starter',
    tier: 'STARTER',
  },
  REPORT_EXPORT_BLOCKED: {
    headline: 'Export your project reports',
    body: 'Professional plan includes PDF exports, CSV downloads, and custom reporting.',
    ctaLabel: 'Upgrade to Professional',
    tier: 'PROFESSIONAL',
  },
  AI_CHAT_LIMIT_REACHED: {
    headline: 'You\'ve used your free AI chats',
    body: 'Professional plan includes unlimited KeaBot conversations for your projects.',
    ctaLabel: 'Unlock Unlimited AI',
    tier: 'PROFESSIONAL',
  },
  ADVANCED_ANALYTICS_BLOCKED: {
    headline: 'Unlock Advanced Analytics',
    body: 'Enterprise plan includes market intelligence, conversion analytics, and competitor insights.',
    ctaLabel: 'Explore Enterprise',
    tier: 'ENTERPRISE',
  },
}

export async function getUpsellOffer(body: GetUpsellOfferBody): Promise<UpsellOfferDto> {
  const copy = UPSELL_COPY[body.trigger]
  if (!copy) throw Object.assign(new Error('Unknown upsell trigger'), { statusCode: 400 })

  // Find the recommended plan
  const plan = await db.subscriptionPlan.findFirst({
    where: { tier: copy.tier, active: true },
    orderBy: { monthlyPriceCents: 'asc' },
  })

  return {
    trigger: body.trigger,
    headline: copy.headline,
    body: copy.body,
    ctaLabel: copy.ctaLabel,
    ctaUrl: `/upgrade?tier=${copy.tier.toLowerCase()}`,
    recommendedPlanId: plan?.id ?? null,
  }
}

// ─── Stripe Checkout ──────────────────────────────────────────────────────────

export async function startCheckout(
  userId: string,
  body: StartCheckoutBody,
): Promise<CheckoutSessionDto> {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) throw Object.assign(new Error('Stripe not configured'), { statusCode: 503 })

  const plan = await db.subscriptionPlan.findUnique({ where: { id: body.planId } })
  if (!plan) throw Object.assign(new Error('Plan not found'), { statusCode: 404 })

  const priceId =
    body.interval === 'ANNUAL' ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly
  if (!priceId) throw Object.assign(new Error('Stripe price not configured for this plan/interval'), { statusCode: 422 })

  // Lazy Stripe import — only fails if STRIPE_SECRET_KEY is set but stripe package is missing
  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any })

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user?.email,
    success_url: body.successUrl,
    cancel_url: body.cancelUrl,
    metadata: { userId, planId: body.planId, interval: body.interval },
  })

  return { checkoutUrl: session.url!, sessionId: session.id }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPlan(p: any): SubscriptionPlanDto {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    monthlyPriceCents: p.monthlyPriceCents,
    annualPriceCents: p.annualPriceCents,
    features: p.features ?? {},
    leadCreditsPerMonth: p.leadCreditsPerMonth ?? null,
    maxProjects: p.maxProjects ?? null,
    maxTeamMembers: p.maxTeamMembers ?? null,
    active: p.active,
    stripePriceIdMonthly: p.stripePriceIdMonthly ?? null,
    stripePriceIdAnnual: p.stripePriceIdAnnual ?? null,
  }
}

function mapLeadPricing(p: any): LeadPricingDto {
  return {
    id: p.id,
    tradeCategory: p.tradeCategory,
    jurisdictionCode: p.jurisdictionCode,
    strategy: p.strategy,
    flatPriceCents: p.flatPriceCents ?? null,
    minBidCents: p.minBidCents ?? null,
    maxBidCents: p.maxBidCents ?? null,
    active: p.active,
  }
}
