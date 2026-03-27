/**
 * Feature Gating Middleware for Fastify
 *
 * Checks the requesting user's software tier and gates access to features.
 * Works for both software-only (S1-S4) and PM service (A-D) subscriptions.
 *
 * Usage:
 *   fastify.addHook('preHandler', requireFeature('ai-takeoff-analysis'));
 *   fastify.addHook('preHandler', requireTier('S3'));
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  type SoftwareTier,
  type FeatureKey,
  hasFeature,
  getMinimumTier,
  isAtLimit,
  isHardLocked,
  isApproachingLimit,
  TIER_FEATURES,
} from '@kealee/shared/software-tiers';

import { prismaAny as prisma } from '../utils/prisma-helper';

// ── Types ───────────────────────────────────────────────────────

interface UserSubscription {
  packageType: 'SOFTWARE_ONLY' | 'PM_SERVICE';
  softwareTier: SoftwareTier | null;
  pmTier: string | null;
  maxProjects: number;
  maxUsers: number;
  status: string;
}

// ── Subscription Lookup ─────────────────────────────────────────

/**
 * Get the user's active subscription from the database.
 * Checks SoftwareSubscription first, then falls back to PMServiceSubscription.
 */
async function getUserSubscription(userId: string, orgId?: string): Promise<UserSubscription | null> {
  // Check software-only subscription
  const softwareSub = await prisma.softwareSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      ...(orgId && { organizationId: orgId }),
    },
    orderBy: { createdAt: 'desc' },
  });

  if (softwareSub) {
    return {
      packageType: 'SOFTWARE_ONLY',
      softwareTier: softwareSub.softwareTier as SoftwareTier,
      pmTier: null,
      maxProjects: softwareSub.maxProjects,
      maxUsers: softwareSub.maxUsers,
      status: softwareSub.status,
    };
  }

  // Check PM service subscription
  const pmSub = await prisma.pMServiceSubscription.findFirst({
    where: {
      clientId: userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (pmSub) {
    return {
      packageType: 'PM_SERVICE',
      softwareTier: null,
      pmTier: pmSub.packageTier,
      maxProjects: pmSub.maxConcurrentProjects,
      maxUsers: 999, // PM service packages have generous user limits
      status: pmSub.status as string,
    };
  }

  return null;
}

// ── Middleware Factories ────────────────────────────────────────

/**
 * Require a specific feature to be available in the user's tier.
 * Returns 403 if feature is not available, with upgrade info.
 */
export function requireFeature(featureKey: FeatureKey) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId ?? (request.headers['x-user-id'] as string);
    const orgId = (request as any).orgId ?? (request.headers['x-org-id'] as string);

    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const subscription = await getUserSubscription(userId, orgId);

    if (!subscription) {
      return reply.status(403).send({
        error: 'subscription_required',
        message: 'An active subscription is required to access this feature.',
        feature: featureKey,
        upgradeUrl: '/pricing/software',
      });
    }

    // PM service subscribers get access to all software features
    if (subscription.packageType === 'PM_SERVICE') {
      return; // All features unlocked
    }

    // Software-only: check tier
    if (subscription.softwareTier && hasFeature(subscription.softwareTier, featureKey)) {
      return; // Feature available
    }

    // Feature not available — return upgrade info
    const requiredTier = getMinimumTier(featureKey);
    return reply.status(403).send({
      error: 'feature_locked',
      message: `This feature requires ${requiredTier} tier or higher.`,
      feature: featureKey,
      currentTier: subscription.softwareTier,
      requiredTier,
      upgradeUrl: `/pricing/software?highlight=${requiredTier}`,
    });
  };
}

/**
 * Require a minimum software tier.
 */
export function requireTier(minTier: SoftwareTier) {
  const tierOrder: SoftwareTier[] = ['S1', 'S2', 'S3', 'S4'];

  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId ?? (request.headers['x-user-id'] as string);
    const orgId = (request as any).orgId ?? (request.headers['x-org-id'] as string);

    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const subscription = await getUserSubscription(userId, orgId);

    if (!subscription) {
      return reply.status(403).send({
        error: 'subscription_required',
        message: 'An active subscription is required.',
        upgradeUrl: '/pricing/software',
      });
    }

    // PM service subscribers always pass
    if (subscription.packageType === 'PM_SERVICE') return;

    const currentIdx = tierOrder.indexOf(subscription.softwareTier!);
    const requiredIdx = tierOrder.indexOf(minTier);

    if (currentIdx < requiredIdx) {
      return reply.status(403).send({
        error: 'tier_insufficient',
        message: `This requires ${minTier} tier or higher. You are on ${subscription.softwareTier}.`,
        currentTier: subscription.softwareTier,
        requiredTier: minTier,
        upgradeUrl: `/pricing/software?highlight=${minTier}`,
      });
    }
  };
}

/**
 * Check project limits before creating a new project.
 * Returns warning at 80% threshold, blocks at limit.
 */
export function checkProjectLimit() {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId ?? (request.headers['x-user-id'] as string);
    const orgId = (request as any).orgId ?? (request.headers['x-org-id'] as string);

    if (!userId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const subscription = await getUserSubscription(userId, orgId);

    if (!subscription) {
      return reply.status(403).send({
        error: 'subscription_required',
        message: 'An active subscription is required to create projects.',
        upgradeUrl: '/pricing/software',
      });
    }

    // Count current active projects
    const projectCount = await prisma.project.count({
      where: {
        ...(orgId ? { orgId } : {}),
        status: { not: 'ARCHIVED' },
      },
    });

    const maxProjects = subscription.maxProjects;

    if (isHardLocked(projectCount, maxProjects)) {
      return reply.status(403).send({
        error: 'project_limit_exceeded',
        message: `You have exceeded your project limit of ${maxProjects}. Please upgrade your plan.`,
        currentCount: projectCount,
        maxProjects,
        upgradeUrl: '/pricing/software',
      });
    }

    if (isAtLimit(projectCount, maxProjects)) {
      return reply.status(403).send({
        error: 'project_limit_reached',
        message: `You have reached your project limit of ${maxProjects}. Upgrade to add more projects.`,
        currentCount: projectCount,
        maxProjects,
        upgradeUrl: '/pricing/software',
      });
    }

    // Add warning header if approaching limit
    if (isApproachingLimit(projectCount, maxProjects)) {
      reply.header('X-Usage-Warning', 'approaching_project_limit');
      reply.header('X-Projects-Used', String(projectCount));
      reply.header('X-Projects-Max', String(maxProjects));
    }
  };
}

/**
 * Check user/team member limits before inviting.
 */
export function checkUserLimit() {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId ?? (request.headers['x-user-id'] as string);
    const orgId = (request as any).orgId ?? (request.headers['x-org-id'] as string);

    if (!userId || !orgId) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const subscription = await getUserSubscription(userId, orgId);

    if (!subscription) {
      return reply.status(403).send({
        error: 'subscription_required',
        message: 'An active subscription is required to invite team members.',
        upgradeUrl: '/pricing/software',
      });
    }

    // Count current org members
    const memberCount = await prisma.orgMember.count({
      where: { orgId },
    });

    const maxUsers = subscription.maxUsers;

    if (isAtLimit(memberCount, maxUsers)) {
      return reply.status(403).send({
        error: 'user_limit_reached',
        message: `You have reached your team member limit of ${maxUsers}. Upgrade to add more.`,
        currentCount: memberCount,
        maxUsers,
        upgradeUrl: '/pricing/software',
      });
    }

    if (isApproachingLimit(memberCount, maxUsers)) {
      reply.header('X-Usage-Warning', 'approaching_user_limit');
      reply.header('X-Users-Used', String(memberCount));
      reply.header('X-Users-Max', String(maxUsers));
    }
  };
}

export { getUserSubscription };
