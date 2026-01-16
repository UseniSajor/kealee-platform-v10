import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

// Package tier definitions
export const PACKAGE_TIERS = {
  A: {
    name: 'Package A',
    monthlyPrice: 1750,
    features: ['Basic PM support', 'Weekly reports', 'Email support'],
  },
  B: {
    name: 'Package B',
    monthlyPrice: 3500,
    features: ['Enhanced PM support', 'Bi-weekly reports', 'Priority support'],
  },
  C: {
    name: 'Package C',
    monthlyPrice: 7500,
    features: ['Dedicated PM', 'Weekly reports', 'Phone support', 'Project health monitoring'],
  },
  D: {
    name: 'Package D',
    monthlyPrice: 16500,
    features: ['Dedicated PM team', 'Daily reports', '24/7 support', 'Full project oversight'],
  },
} as const

export const servicePlanService = {
  /**
   * Get package tier info
   */
  getPackageTierInfo(tier: string) {
    const tierKey = tier.toUpperCase() as keyof typeof PACKAGE_TIERS
    return PACKAGE_TIERS[tierKey] || null
  },

  /**
   * Create service plan
   */
  async createServicePlan(data: {
    userId: string
    packageTier: string
    stripeSubscriptionId?: string
  }) {
    const tierInfo = this.getPackageTierInfo(data.packageTier)
    if (!tierInfo) {
      throw new ValidationError(`Invalid package tier: ${data.packageTier}`)
    }

    // Check if user already has an active plan
    const existingPlan = await prismaAny.servicePlan.findFirst({
      where: {
        userId: data.userId,
        status: 'ACTIVE',
      },
    })

    if (existingPlan) {
      throw new ValidationError('User already has an active service plan')
    }

    const plan = await prismaAny.servicePlan.create({
      data: {
        userId: data.userId,
        packageTier: data.packageTier.toUpperCase(),
        monthlyPrice: tierInfo.monthlyPrice,
        status: 'ACTIVE',
        stripeSubscriptionId: data.stripeSubscriptionId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_PLAN_CREATED',
      entityType: 'ServicePlan',
      entityId: plan.id,
      userId: data.userId,
      reason: `Service plan created: ${data.packageTier}`,
      after: {
        packageTier: data.packageTier,
        monthlyPrice: tierInfo.monthlyPrice,
      },
    })

    // Emit event
    await eventService.recordEvent({
      type: 'SERVICE_PLAN_CREATED',
      entityType: 'ServicePlan',
      entityId: plan.id,
      userId: data.userId,
      payload: {
        packageTier: data.packageTier,
        monthlyPrice: tierInfo.monthlyPrice,
      },
    })

    return plan
  },

  /**
   * Get service plan
   */
  async getServicePlan(planId: string, userId?: string) {
    const where: any = { id: planId }

    if (userId) {
      where.userId = userId
    }

    const plan = await prismaAny.servicePlan.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        requests: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
    })

    if (!plan) {
      throw new NotFoundError('ServicePlan', planId)
    }

    return plan
  },

  /**
   * Get user's active service plan
   */
  async getUserServicePlan(userId: string) {
    const plan = await prismaAny.servicePlan.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
    })

    return plan
  },

  /**
   * List service plans
   */
  async listServicePlans(filters?: {
    userId?: string
    status?: string
    packageTier?: string
  }) {
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.packageTier) {
      where.packageTier = filters.packageTier.toUpperCase()
    }

    const plans = await prismaAny.servicePlan.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return plans
  },

  /**
   * Update service plan
   */
  async updateServicePlan(planId: string, data: {
    packageTier?: string
    status?: string
    stripeSubscriptionId?: string
    userId: string
  }) {
    const plan = await prismaAny.servicePlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      throw new NotFoundError('ServicePlan', planId)
    }

    const updateData: any = {}

    if (data.packageTier) {
      const tierInfo = this.getPackageTierInfo(data.packageTier)
      if (!tierInfo) {
        throw new ValidationError(`Invalid package tier: ${data.packageTier}`)
      }
      updateData.packageTier = data.packageTier.toUpperCase()
      updateData.monthlyPrice = tierInfo.monthlyPrice
    }

    if (data.status) {
      updateData.status = data.status as any
      if (data.status === 'CANCELLED') {
        updateData.cancelledAt = new Date()
      }
    }

    if (data.stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = data.stripeSubscriptionId
    }

    const updated = await prismaAny.servicePlan.update({
      where: { id: planId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_PLAN_UPDATED',
      entityType: 'ServicePlan',
      entityId: planId,
      userId: data.userId,
      reason: 'Service plan updated',
      before: {
        packageTier: plan.packageTier,
        status: plan.status,
      },
      after: {
        packageTier: updated.packageTier,
        status: updated.status,
      },
    })

    return updated
  },

  /**
   * Cancel service plan
   */
  async cancelServicePlan(planId: string, data: {
    userId: string
  }) {
    const plan = await prismaAny.servicePlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      throw new NotFoundError('ServicePlan', planId)
    }

    if (plan.status === 'CANCELLED') {
      throw new ValidationError('Service plan is already cancelled')
    }

    const updated = await prismaAny.servicePlan.update({
      where: { id: planId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SERVICE_PLAN_CANCELLED',
      entityType: 'ServicePlan',
      entityId: planId,
      userId: data.userId,
      reason: 'Service plan cancelled',
      after: {
        status: 'CANCELLED',
        cancelledAt: updated.cancelledAt,
      },
    })

    // Emit event
    await eventService.recordEvent({
      type: 'SERVICE_PLAN_CANCELLED',
      entityType: 'ServicePlan',
      entityId: planId,
      userId: data.userId,
      payload: {
        packageTier: plan.packageTier,
      },
    })

    return updated
  },
}
