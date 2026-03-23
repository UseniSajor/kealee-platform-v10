/**
 * Test Service — Kealee Platform
 *
 * Simulates and verifies all monetized flows for QA and development.
 * Only active when TEST_MODE=true.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { eventService } from '../events/event.service'

export const TEST_MODE = process.env.TEST_MODE === 'true'

// Fixed test user emails (consistent across runs)
export const TEST_USERS = {
  homeowner:         { email: 'test-homeowner@kealee.test',          name: 'Test Homeowner',   role: 'homeowner' },
  contractorStarter: { email: 'test-contractor-starter@kealee.test', name: 'Test Contractor Starter', role: 'contractor' },
  contractorGrowth:  { email: 'test-contractor-growth@kealee.test',  name: 'Test Contractor Growth',  role: 'contractor' },
  contractorPro:     { email: 'test-contractor-pro@kealee.test',     name: 'Test Contractor Pro',     role: 'contractor' },
  admin:             { email: 'test-admin@kealee.test',              name: 'Test Admin',       role: 'admin' },
}

// Concept package tiers with pricing
export const CONCEPT_TIERS = {
  essential:    { name: 'AI Concept Design Package',          amount: 58500,  priceKey: 'STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION' },
  professional: { name: 'AI Concept Design Package — Priority', amount: 77500, priceKey: 'STRIPE_PRICE_DESIGN_ADVANCED' },
  premium:      { name: 'Premium Concept Package',            amount: 99900,  priceKey: 'STRIPE_PRICE_DESIGN_FULL' },
  white_glove:  { name: 'White Glove Concept Package',        amount: 199900, priceKey: 'STRIPE_PRICE_ESTIMATE_CERTIFIED' },
}

// Contractor subscription plans
export const CONTRACTOR_PLANS = {
  starter: { name: 'Starter',    priceKey: 'STRIPE_PRICE_GROWTH_STARTER',    amount: 9900  },
  growth:  { name: 'Growth',     priceKey: 'STRIPE_PRICE_GROWTH_PRO',         amount: 19900 },
  pro:     { name: 'Pro Growth', priceKey: 'STRIPE_PRICE_GROWTH_ENTERPRISE',  amount: 49900 },
}

// All 25 Stripe price keys
export const ALL_STRIPE_PRICES = [
  'STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION',
  'STRIPE_PRICE_DESIGN_ADVANCED',
  'STRIPE_PRICE_DESIGN_FULL',
  'STRIPE_PRICE_ESTIMATE_DETAILED',
  'STRIPE_PRICE_ESTIMATE_CERTIFIED',
  'STRIPE_PRICE_PERMIT_SIMPLE',
  'STRIPE_PRICE_PERMIT_PACKAGE',
  'STRIPE_PRICE_PERMIT_COORDINATION',
  'STRIPE_PRICE_PERMIT_EXPEDITING',
  'STRIPE_PRICE_PM_ADVISORY',
  'STRIPE_PRICE_PM_OVERSIGHT',
  'STRIPE_PRICE_LISTING_BASIC',
  'STRIPE_PRICE_LISTING_PRO',
  'STRIPE_PRICE_LISTING_PREMIUM',
  'STRIPE_PRICE_GROWTH_STARTER',
  'STRIPE_PRICE_GROWTH_PRO',
  'STRIPE_PRICE_GROWTH_ENTERPRISE',
  'STRIPE_PRICE_OPS_A',
  'STRIPE_PRICE_OPS_B',
  'STRIPE_PRICE_OPS_C',
  'STRIPE_PRICE_OPS_D',
  'STRIPE_PRICE_DEV_FEASIBILITY',
  'STRIPE_PRICE_DEV_PROFORMA',
  'STRIPE_PRICE_DEV_CAPITAL',
  'STRIPE_PRICE_DEV_ENTITLEMENTS',
]

export async function getTestStatus() {
  const users = await Promise.all(
    Object.entries(TEST_USERS).map(async ([key, u]) => {
      const user = await prismaAny.user.findFirst({ where: { email: u.email } })
      return { key, email: u.email, name: u.name, role: u.role, exists: !!user, userId: user?.id }
    })
  )

  const stripeProducts = ALL_STRIPE_PRICES.map(key => ({
    key,
    priceId: process.env[key] ?? null,
    configured: !!process.env[key],
  }))

  const configuredCount = stripeProducts.filter(p => p.configured).length

  const recentEvents = await prismaAny.event.findMany({
    where: { type: { startsWith: 'TEST_' } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => [])

  return {
    testMode: TEST_MODE,
    users,
    stripeProducts: {
      total: stripeProducts.length,
      configured: configuredCount,
      missing: stripeProducts.length - configuredCount,
      items: stripeProducts,
    },
    recentEvents,
  }
}

export async function seedTestUsers() {
  const results: Array<{ key: string; email: string; action: string; userId?: string }> = []

  for (const [key, u] of Object.entries(TEST_USERS)) {
    const existing = await prismaAny.user.findFirst({ where: { email: u.email } })
    if (existing) {
      results.push({ key, email: u.email, action: 'already_exists', userId: existing.id })
      continue
    }

    const user = await prismaAny.user.create({
      data: {
        email: u.email,
        fullName: u.name,
        role: u.role,
        status: 'active',
        emailVerified: true,
        metadata: { isTestUser: true, testKey: key },
      },
    })

    await eventService.recordEvent({
      type: 'TEST_USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      payload: { testKey: key, email: u.email, role: u.role },
    })

    results.push({ key, email: u.email, action: 'created', userId: user.id })
  }

  return results
}

export async function simulateConceptPurchase(tier: keyof typeof CONCEPT_TIERS) {
  const pkg = CONCEPT_TIERS[tier]
  const sessionId = `test_cs_${Date.now()}`
  const paymentIntentId = `test_pi_${Date.now()}`

  const homeowner = await prismaAny.user.findFirst({
    where: { email: TEST_USERS.homeowner.email },
  })
  const userId = homeowner?.id ?? 'test-user-id'

  const order = await prismaAny.conceptPackageOrder.create({
    data: {
      userId,
      stripeSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId,
      packageTier: tier,
      packageName: pkg.name,
      amount: pkg.amount,
      currency: 'usd',
      status: 'completed',
      deliveryStatus: 'pending',
      metadata: {
        isTestOrder: true,
        tier,
        simulatedAt: new Date().toISOString(),
      },
    },
  })

  await eventService.recordEvent({
    type: 'TEST_CONCEPT_PURCHASED',
    entityType: 'ConceptPackageOrder',
    entityId: order.id,
    userId,
    payload: { tier, amount: pkg.amount, packageName: pkg.name, sessionId },
  })

  return {
    success: true,
    orderId: order.id,
    tier,
    amount: pkg.amount,
    amountDisplay: `$${(pkg.amount / 100).toFixed(2)}`,
    packageName: pkg.name,
    sessionId,
    events: ['TEST_CONCEPT_PURCHASED', 'concept.purchased'],
  }
}

export async function simulateContractorSubscription(plan: keyof typeof CONTRACTOR_PLANS) {
  const planConfig = CONTRACTOR_PLANS[plan]
  const contractorEmail = {
    starter: TEST_USERS.contractorStarter.email,
    growth:  TEST_USERS.contractorGrowth.email,
    pro:     TEST_USERS.contractorPro.email,
  }[plan]

  const contractor = await prismaAny.user.findFirst({
    where: { email: contractorEmail },
  })
  const userId = contractor?.id ?? 'test-contractor-id'

  const subscriptionId = `test_sub_${Date.now()}`

  const subscription = await prismaAny.serviceSubscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: process.env[planConfig.priceKey] ?? `test_price_${plan}`,
      status: 'active',
      planName: planConfig.name,
      amount: planConfig.amount,
      currency: 'usd',
      interval: 'month',
      metadata: { isTestSubscription: true, plan, simulatedAt: new Date().toISOString() },
    },
  })

  await eventService.recordEvent({
    type: 'TEST_SUBSCRIPTION_CREATED',
    entityType: 'ServiceSubscription',
    entityId: subscription.id,
    userId,
    payload: { plan, planName: planConfig.name, amount: planConfig.amount },
  })

  return {
    success: true,
    subscriptionId: subscription.id,
    plan,
    planName: planConfig.name,
    amount: planConfig.amount,
    amountDisplay: `$${(planConfig.amount / 100).toFixed(2)}/mo`,
    events: ['TEST_SUBSCRIPTION_CREATED', 'subscription.created'],
  }
}

export async function simulateLeadPurchase() {
  const sessionId = `test_lead_cs_${Date.now()}`

  const lead = await prismaAny.publicIntakeLead.create({
    data: {
      status: 'paid',
      projectType: 'renovation',
      description: 'Test lead — kitchen renovation, $50k budget, 6-month timeline',
      budget: '25k_50k',
      timeline: '6_months',
      location: 'Washington, DC',
      customerEmail: TEST_USERS.homeowner.email,
      customerName: TEST_USERS.homeowner.name,
      stripeSessionId: sessionId,
      paidAt: new Date(),
      score: 75,
      scoreLabel: 'hot',
      metadata: { isTestLead: true, simulatedAt: new Date().toISOString() },
    },
  })

  await eventService.recordEvent({
    type: 'TEST_LEAD_PURCHASED',
    entityType: 'PublicIntakeLead',
    entityId: lead.id,
    payload: { leadId: lead.id, sessionId, score: 75, tier: 'hot' },
  })

  return {
    success: true,
    leadId: lead.id,
    status: 'paid',
    score: 75,
    tier: 'hot',
    sessionId,
    events: ['TEST_LEAD_PURCHASED', 'lead.purchased'],
  }
}

export async function simulateContractAward(contractValue: number) {
  const FEE_PCT = 0.03
  const feeAmount = Math.round(contractValue * FEE_PCT)
  const sessionId = `test_contract_cs_${Date.now()}`

  const feeRecord = await prismaAny.platformFeeRecord.create({
    data: {
      stripeSessionId: sessionId,
      grossAmount: contractValue,
      feePct: FEE_PCT * 100,
      feeAmount,
      status: 'COLLECTED',
      collectedAt: new Date(),
      metadata: { isTestRecord: true, simulatedAt: new Date().toISOString() },
    },
  })

  await eventService.recordEvent({
    type: 'TEST_CONTRACT_AWARDED',
    entityType: 'PlatformFeeRecord',
    entityId: feeRecord.id,
    payload: {
      contractValue,
      feePct: 3,
      feeAmount,
      feeDisplay: `$${(feeAmount / 100).toFixed(2)}`,
      contractDisplay: `$${(contractValue / 100).toLocaleString()}`,
    },
  })

  return {
    success: true,
    feeRecordId: feeRecord.id,
    contractValue,
    contractDisplay: `$${(contractValue / 100).toLocaleString()}`,
    feePct: 3,
    feeAmount,
    feeDisplay: `$${(feeAmount / 100).toFixed(2)}`,
    events: ['TEST_CONTRACT_AWARDED', 'contract.awarded'],
  }
}

export async function simulateOpportunityAssignment(opportunityType: 'post_concept' | 'permit_approved') {
  const contractor = await prismaAny.user.findFirst({
    where: { email: TEST_USERS.contractorPro.email },
  })
  const contractorId = contractor?.id ?? 'test-contractor-pro-id'

  const opportunity = await prismaAny.marketplaceLead.create({
    data: {
      type: opportunityType === 'post_concept' ? 'POST_CONCEPT_NO_PERMIT' : 'PERMIT_APPROVED',
      status: 'assigned',
      assignedContractorId: contractorId,
      projectType: 'renovation',
      estimatedValue: 7500000,
      location: 'Washington, DC',
      metadata: {
        isTestOpportunity: true,
        type: opportunityType,
        assignedPlan: 'pro',
        prioritized: true,
        simulatedAt: new Date().toISOString(),
      },
    },
  })

  await eventService.recordEvent({
    type: 'TEST_OPPORTUNITY_ASSIGNED',
    entityType: 'MarketplaceLead',
    entityId: opportunity.id,
    userId: contractorId,
    payload: {
      opportunityType,
      assignedTo: TEST_USERS.contractorPro.email,
      plan: 'Pro Growth',
      prioritized: true,
    },
  })

  return {
    success: true,
    opportunityId: opportunity.id,
    type: opportunityType,
    assignedTo: TEST_USERS.contractorPro.email,
    plan: 'Pro Growth — prioritized in queue',
    events: ['TEST_OPPORTUNITY_ASSIGNED', 'opportunity.assigned'],
  }
}

export async function getRecentTestEvents(limit = 50) {
  return prismaAny.event.findMany({
    where: { type: { startsWith: 'TEST_' } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }).catch(() => [])
}

export async function cleanupTestData() {
  const testEmails = Object.values(TEST_USERS).map(u => u.email)
  const counts: Record<string, number> = {}

  // Delete orders
  const orders = await prismaAny.conceptPackageOrder.deleteMany({
    where: { metadata: { path: ['isTestOrder'], equals: true } },
  }).catch(() => ({ count: 0 }))
  counts.conceptOrders = orders.count

  // Delete subscriptions
  const subs = await prismaAny.serviceSubscription.deleteMany({
    where: { stripeSubscriptionId: { startsWith: 'test_sub_' } },
  }).catch(() => ({ count: 0 }))
  counts.subscriptions = subs.count

  // Delete test events
  const events = await prismaAny.event.deleteMany({
    where: { type: { startsWith: 'TEST_' } },
  }).catch(() => ({ count: 0 }))
  counts.events = events.count

  // Delete fee records
  const fees = await prismaAny.platformFeeRecord.deleteMany({
    where: { stripeSessionId: { startsWith: 'test_' } },
  }).catch(() => ({ count: 0 }))
  counts.feeRecords = fees.count

  return { success: true, deleted: counts }
}

export async function validateStripeProducts() {
  const stripe = process.env.STRIPE_SECRET_KEY
    ? (await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY!))).catch(() => null)
    : null

  return ALL_STRIPE_PRICES.map(key => {
    const priceId = process.env[key]
    return {
      key,
      priceId: priceId ?? null,
      configured: !!priceId,
      // Stripe validation only available if SDK loaded
      stripeValidated: null as boolean | null,
    }
  })
}
