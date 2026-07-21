/**
 * Subscription Tier Validation Middleware
 *
 * Enforces project count and project value limits based on the user's
 * active software tier (S1-S4) or PM service subscription (A-D).
 *
 * Usage:
 *   fastify.post('/projects', {
 *     preHandler: [authenticateUser, enforceTierProjectLimit],
 *   }, handler)
 */
import { FastifyRequest, FastifyReply } from 'fastify'
import { prismaAny } from '../utils/prisma-helper'
import {
  SOFTWARE_TIERS,
  PM_SERVICE_TIERS,
  ENTERPRISE_SUB_TIERS,
  isAtLimit,
  isApproachingLimit,
  type SoftwareTier,
  type PMServiceTier,
} from '@kealee/shared/software-tiers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionInfo {
  type: 'SOFTWARE' | 'PM_SERVICE'
  tier: string // e.g. 'S1', 'S2', 'PACKAGE_A'
  pricingTierIndex: number // which sub-tier (Basic/Standard/Plus)
  maxProjects: number
  maxProjectValue: number // in cents (0 = unlimited)
  maxPortfolioValue: number // in cents (0 = unlimited)
  enterpriseSubTier?: string // D1, D2, D3, D4
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
  // Check for PM service subscription first (higher priority)
  const pmSub = await prismaAny.pMServiceSubscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'active'] },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null)

  if (pmSub) {
    const tierKey = pmSub.tier as PMServiceTier
    const tierConfig = PM_SERVICE_TIERS[tierKey]
    if (tierConfig) {
      const maxProjects =
        typeof tierConfig.maxProjects === 'number'
          ? tierConfig.maxProjects
          : 999 // unlimited

      // Enterprise sub-tier handling
      let enterpriseSubTier: string | undefined
      let actualMaxProjects = maxProjects
      if (tierKey === 'PACKAGE_D' && pmSub.tierLevel) {
        const subTier = ENTERPRISE_SUB_TIERS[pmSub.tierLevel as keyof typeof ENTERPRISE_SUB_TIERS]
        if (subTier) {
          actualMaxProjects = subTier.projects
          enterpriseSubTier = pmSub.tierLevel
        }
      }

      return {
        type: 'PM_SERVICE',
        tier: tierKey,
        pricingTierIndex: 0,
        maxProjects: actualMaxProjects,
        maxProjectValue: tierConfig.maxProjectValue || 0,
        maxPortfolioValue: tierConfig.maxPortfolioValue || 0,
        enterpriseSubTier,
      }
    }
  }

  // Check for software-only subscription
  const softSub = await prismaAny.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'active', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null)

  if (softSub) {
    const tierKey = softSub.tier as SoftwareTier
    const tierConfig = SOFTWARE_TIERS[tierKey]
    if (tierConfig) {
      const pricingIdx = softSub.pricingTierIndex ?? 0
      const pricing = tierConfig.pricingTiers[pricingIdx] ?? tierConfig.pricingTiers[0]
      return {
        type: 'SOFTWARE',
        tier: tierKey,
        pricingTierIndex: pricingIdx,
        maxProjects: pricing.maxProjects,
        maxProjectValue: 0, // software tiers don't have value limits
        maxPortfolioValue: 0,
      }
    }
  }

  return null
}

async function countActiveProjects(userId: string): Promise<number> {
  const count = await prismaAny.project.count({
    where: {
      ownerId: userId,
      status: { notIn: ['CANCELLED', 'COMPLETED', 'ARCHIVED'] },
    },
  }).catch(() => 0)

  return count
}

async function getPortfolioValue(userId: string): Promise<number> {
  const projects = await prismaAny.project.findMany({
    where: {
      ownerId: userId,
      status: { notIn: ['CANCELLED', 'COMPLETED', 'ARCHIVED'] },
    },
    select: { budgetTotal: true },
  }).catch(() => [])

  return projects.reduce((total: number, p: any) => {
    if (p.budgetTotal) {
      return total + Number(p.budgetTotal)
    }
    return total
  }, 0)
}

// ---------------------------------------------------------------------------
// Middleware: Enforce tier project count limit
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler that blocks project creation if the user
 * has reached their subscription tier's project limit.
 *
 * Attaches `request.tierInfo` with subscription details for downstream use.
 */
export async function enforceTierProjectLimit(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = (request as any).user
  if (!user?.id) return // authenticateUser should have already caught this

  // Admin override bypasses tier checks
  const body = request.body as any
  if (body?.adminOverride) return

  try {
    const sub = await getUserSubscription(user.id)

    // No subscription found — allow project creation (free tier / trial)
    if (!sub) {
      ;(request as any).tierInfo = null
      return
    }

    const activeCount = await countActiveProjects(user.id)

    // Attach tier info for downstream use
    ;(request as any).tierInfo = {
      ...sub,
      activeProjects: activeCount,
      isApproaching: isApproachingLimit(activeCount, sub.maxProjects),
      isAtLimit: isAtLimit(activeCount, sub.maxProjects),
    }

    // Block if at or over limit
    if (isAtLimit(activeCount, sub.maxProjects)) {
      return reply.code(403).send({
        error: 'Project limit reached',
        code: 'TIER_PROJECT_LIMIT',
        details: {
          tier: sub.tier,
          maxProjects: sub.maxProjects,
          activeProjects: activeCount,
          message: `Your ${sub.type === 'PM_SERVICE' ? 'PM service' : 'software'} subscription allows up to ${sub.maxProjects} concurrent projects. You currently have ${activeCount} active projects. Please upgrade your plan or complete/archive existing projects.`,
        },
      })
    }
  } catch (error: any) {
    // Log but don't block — tier enforcement failure should not prevent work
    console.error('[tier-validation] Error checking project limits:', error.message)
  }
}

// ---------------------------------------------------------------------------
// Middleware: Enforce project value cap
// ---------------------------------------------------------------------------

/**
 * Fastify preHandler that blocks project creation or update if the
 * project's budget exceeds the subscription tier's per-project value cap.
 *
 * Should be used on PATCH /projects/:id when budgetTotal is being set.
 */
export async function enforceTierValueLimit(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = (request as any).user
  if (!user?.id) return

  const body = request.body as any
  if (body?.adminOverride) return

  // Only check when budgetTotal is being set
  const budgetTotal = body?.budgetTotal
  if (budgetTotal === undefined || budgetTotal === null) return

  try {
    const sub = await getUserSubscription(user.id)
    if (!sub || sub.maxProjectValue === 0) return // no value limit

    const budgetCents = Math.round(Number(budgetTotal) * 100)

    if (budgetCents > sub.maxProjectValue) {
      const maxFormatted = (sub.maxProjectValue / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
      const budgetFormatted = (budgetCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })

      return reply.code(403).send({
        error: 'Project value exceeds tier limit',
        code: 'TIER_VALUE_LIMIT',
        details: {
          tier: sub.tier,
          maxProjectValue: sub.maxProjectValue,
          requestedValue: budgetCents,
          message: `Your subscription allows projects up to ${maxFormatted}. This project's budget of ${budgetFormatted} exceeds that limit. Please upgrade your plan.`,
        },
      })
    }

    // Also check portfolio-level value cap
    if (sub.maxPortfolioValue > 0) {
      const portfolioValue = await getPortfolioValue(user.id)
      const newPortfolioTotal = portfolioValue + budgetCents

      if (newPortfolioTotal > sub.maxPortfolioValue) {
        const maxFormatted = (sub.maxPortfolioValue / 100).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        })

        return reply.code(403).send({
          error: 'Portfolio value exceeds tier limit',
          code: 'TIER_PORTFOLIO_LIMIT',
          details: {
            tier: sub.tier,
            maxPortfolioValue: sub.maxPortfolioValue,
            currentPortfolioValue: portfolioValue,
            requestedAddition: budgetCents,
            message: `Your subscription allows a total portfolio value up to ${maxFormatted}. Adding this project would exceed that limit. Please upgrade your plan.`,
          },
        })
      }
    }
  } catch (error: any) {
    console.error('[tier-validation] Error checking value limits:', error.message)
  }
}

// ---------------------------------------------------------------------------
// Middleware: Warn approaching limit (non-blocking)
// ---------------------------------------------------------------------------

/**
 * Fastify onSend hook that adds a warning header when the user
 * is approaching their project limit (80% threshold).
 */
export async function warnApproachingLimit(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const tierInfo = (request as any).tierInfo
  if (!tierInfo || !tierInfo.isApproaching) return

  reply.header(
    'X-Tier-Warning',
    JSON.stringify({
      code: 'APPROACHING_PROJECT_LIMIT',
      activeProjects: tierInfo.activeProjects,
      maxProjects: tierInfo.maxProjects,
      message: `You are using ${tierInfo.activeProjects} of ${tierInfo.maxProjects} project slots.`,
    }),
  )
}
