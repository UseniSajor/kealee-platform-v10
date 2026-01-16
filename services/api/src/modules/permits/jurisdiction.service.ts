import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import crypto from 'crypto'

// Generate unique license key
function generateLicenseKey(): string {
  const prefix = 'JUR-'
  const randomBytes = crypto.randomBytes(16).toString('hex').toUpperCase()
  return `${prefix}${randomBytes}`
}

export const jurisdictionService = {
  /**
   * Create jurisdiction (onboarding wizard)
   */
  async createJurisdiction(data: {
    name: string
    code: string
    state: string
    county?: string
    city?: string
    contactEmail: string
    contactPhone: string
    websiteUrl?: string
    serviceArea: any // GeoJSON
    createdById: string
  }) {
    // Check if code already exists
    const existing = await prismaAny.jurisdiction.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw new ValidationError(`Jurisdiction with code ${data.code} already exists`)
    }

    // Generate license key
    const licenseKey = generateLicenseKey()

    const jurisdiction = await prismaAny.jurisdiction.create({
      data: {
        name: data.name,
        code: data.code,
        state: data.state,
        county: data.county,
        city: data.city,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        websiteUrl: data.websiteUrl,
        serviceArea: data.serviceArea as any,
        status: 'PENDING_SETUP',
        licenseKey,
        settings: {},
        feeSchedule: {},
      },
      include: {
        _count: {
          select: {
            permits: true,
            staff: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'JURISDICTION_CREATED',
      entityType: 'Jurisdiction',
      entityId: jurisdiction.id,
      userId: data.createdById,
      reason: `Jurisdiction created: ${data.name}`,
      after: {
        code: data.code,
        status: 'PENDING_SETUP',
      },
    })

    // Emit event
    await eventService.emitEvent({
      type: 'JURISDICTION_CREATED',
      entityType: 'Jurisdiction',
      entityId: jurisdiction.id,
      userId: data.createdById,
      payload: {
        jurisdictionId: jurisdiction.id,
        code: data.code,
        name: data.name,
      },
    })

    return jurisdiction
  },

  /**
   * Update jurisdiction subscription tier
   */
  async updateSubscriptionTier(jurisdictionId: string, data: {
    subscriptionTier: string
    monthlyFee: number
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    updatedById: string
  }) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    if (!jurisdiction) {
      throw new NotFoundError('Jurisdiction', jurisdictionId)
    }

    const updated = await prismaAny.jurisdiction.update({
      where: { id: jurisdictionId },
      data: {
        subscriptionTier: data.subscriptionTier as any,
        monthlyFee: data.monthlyFee.toString(),
        subscriptionStartDate: jurisdiction.subscriptionStartDate || new Date(),
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'JURISDICTION_SUBSCRIPTION_UPDATED',
      entityType: 'Jurisdiction',
      entityId: jurisdictionId,
      userId: data.updatedById,
      reason: `Subscription tier updated to ${data.subscriptionTier}`,
      before: {
        subscriptionTier: jurisdiction.subscriptionTier,
        monthlyFee: jurisdiction.monthlyFee?.toString(),
      },
      after: {
        subscriptionTier: data.subscriptionTier,
        monthlyFee: data.monthlyFee.toString(),
      },
    })

    return updated
  },

  /**
   * Regenerate license key
   */
  async regenerateLicenseKey(jurisdictionId: string, data: { updatedById: string }) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    if (!jurisdiction) {
      throw new NotFoundError('Jurisdiction', jurisdictionId)
    }

    const newLicenseKey = generateLicenseKey()

    const updated = await prismaAny.jurisdiction.update({
      where: { id: jurisdictionId },
      data: {
        licenseKey: newLicenseKey,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'JURISDICTION_LICENSE_KEY_REGENERATED',
      entityType: 'Jurisdiction',
      entityId: jurisdictionId,
      userId: data.updatedById,
      reason: 'License key regenerated',
      before: {
        licenseKey: jurisdiction.licenseKey,
      },
      after: {
        licenseKey: newLicenseKey,
      },
    })

    return updated
  },

  /**
   * Validate license key
   */
  async validateLicenseKey(licenseKey: string) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { licenseKey },
      include: {
        _count: {
          select: {
            permits: true,
            staff: true,
          },
        },
      },
    })

    if (!jurisdiction) {
      return { valid: false, jurisdiction: null }
    }

    if (jurisdiction.status !== 'ACTIVE') {
      return { valid: false, jurisdiction: null, reason: 'Jurisdiction is not active' }
    }

    return { valid: true, jurisdiction }
  },

  /**
   * Get jurisdiction by ID
   */
  async getJurisdiction(jurisdictionId: string) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
      include: {
        _count: {
          select: {
            permits: true,
            inspections: true,
            staff: true,
          },
        },
      },
    })

    if (!jurisdiction) {
      throw new NotFoundError('Jurisdiction', jurisdictionId)
    }

    return jurisdiction
  },

  /**
   * List jurisdictions
   */
  async listJurisdictions(filters?: {
    status?: string
    subscriptionTier?: string
    state?: string
    search?: string
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.subscriptionTier) {
      where.subscriptionTier = filters.subscriptionTier
    }

    if (filters?.state) {
      where.state = filters.state
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { county: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const jurisdictions = await prismaAny.jurisdiction.findMany({
      where,
      include: {
        _count: {
          select: {
            permits: true,
            inspections: true,
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return jurisdictions
  },

  /**
   * Get usage metrics dashboard
   */
  async getUsageMetrics(jurisdictionId: string, period?: { year?: number; month?: number }) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    if (!jurisdiction) {
      throw new NotFoundError('Jurisdiction', jurisdictionId)
    }

    // Get current month metrics or specific period
    const now = new Date()
    const year = period?.year || now.getFullYear()
    const month = period?.month || now.getMonth() + 1

    // Get or create metrics for this period
    let metrics = await prismaAny.jurisdictionUsageMetrics.findUnique({
      where: {
        jurisdictionId_year_month: {
          jurisdictionId,
          year,
          month,
        },
      },
    })

    if (!metrics) {
      // Calculate current metrics from permits
      const permits = await prismaAny.permit.findMany({
        where: {
          jurisdictionId,
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      })

      const permitsSubmitted = permits.length
      const permitsApproved = permits.filter((p) => p.status === 'APPROVED' || p.status === 'ISSUED' || p.status === 'ACTIVE').length
      const permitsIssued = permits.filter((p) => p.status === 'ISSUED' || p.status === 'ACTIVE').length
      const permitsCompleted = permits.filter((p) => p.status === 'COMPLETED').length

      const permitFeesCollected = permits.reduce((sum, p) => {
        return sum + (p.feeAmount ? parseFloat(p.feeAmount.toString()) : 0)
      }, 0)

      const expeditedFeesCollected = permits.reduce((sum, p) => {
        return sum + (p.expeditedFee ? parseFloat(p.expeditedFee.toString()) : 0)
      }, 0)

      metrics = await prismaAny.jurisdictionUsageMetrics.create({
        data: {
          jurisdictionId,
          year,
          month,
          permitsSubmitted,
          permitsApproved,
          permitsIssued,
          permitsCompleted,
          permitFeesCollected: permitFeesCollected.toString(),
          expeditedFeesCollected: expeditedFeesCollected.toString(),
          totalRevenue: (permitFeesCollected + expeditedFeesCollected).toString(),
        },
      })
    }

    // Get staff metrics
    const staff = await prismaAny.jurisdictionStaff.findMany({
      where: {
        jurisdictionId,
        active: true,
      },
    })

    return {
      jurisdiction: {
        id: jurisdiction.id,
        name: jurisdiction.name,
        code: jurisdiction.code,
        subscriptionTier: jurisdiction.subscriptionTier,
      },
      metrics: {
        ...metrics,
        activeStaffCount: staff.length,
        currentPeriod: { year, month },
      },
      summary: {
        totalPermitsProcessed: jurisdiction.permitsProcessedCount,
        totalRevenueCollected: jurisdiction.revenueCollected?.toString() || '0',
        lastUpdated: jurisdiction.lastMetricsUpdate,
      },
    }
  },

  /**
   * Update jurisdiction status
   */
  async updateStatus(jurisdictionId: string, data: {
    status: string
    updatedById: string
  }) {
    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    if (!jurisdiction) {
      throw new NotFoundError('Jurisdiction', jurisdictionId)
    }

    const updated = await prismaAny.jurisdiction.update({
      where: { id: jurisdictionId },
      data: {
        status: data.status as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'JURISDICTION_STATUS_UPDATED',
      entityType: 'Jurisdiction',
      entityId: jurisdictionId,
      userId: data.updatedById,
      reason: `Status updated to ${data.status}`,
      before: {
        status: jurisdiction.status,
      },
      after: {
        status: data.status,
      },
    })

    return updated
  },
}
