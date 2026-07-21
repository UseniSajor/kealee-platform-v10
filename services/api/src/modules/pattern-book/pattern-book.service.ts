/**
 * KEALEE - PATTERN BOOK HOUSING GENERATOR SERVICE
 * 21st Century ROAD to Housing Act — Sec 210 (Accelerating Home Building Act)
 *
 * Pre-approved housing designs with public availability, cost estimation,
 * and permit submission integration.
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface DesignFilters {
  housingType?: string
  minSqFt?: number
  maxSqFt?: number
  bedrooms?: number
  style?: string
  minCost?: number
  maxCost?: number
  jurisdictionId?: string
  status?: string
  page?: number
  limit?: number
}

export interface DesignInput {
  housingType: string
  name: string
  slug: string
  description: string
  style: string
  totalSqFt: number
  stories: number
  bedrooms: number
  bathrooms: number
  garageSpaces?: number
  costRangeLow: number
  costRangeHigh: number
  constructionDays?: number
  floorPlanUrl?: string
  elevationUrl?: string
  renderingUrl?: string
  roomSchedule?: any
  complianceNotes?: string
  isPublic?: boolean
  jurisdictionId?: string
}

// ─── Location Cost Multipliers ──────────────────────────────────────────────────

const STATE_COST_MULTIPLIERS: Record<string, number> = {
  AL: 0.82, AK: 1.30, AZ: 0.90, AR: 0.80, CA: 1.25, CO: 0.98, CT: 1.15, DE: 1.02,
  DC: 1.10, FL: 0.90, GA: 0.85, HI: 1.35, ID: 0.88, IL: 1.00, IN: 0.88, IA: 0.88,
  KS: 0.85, KY: 0.84, LA: 0.83, ME: 0.96, MD: 1.05, MA: 1.18, MI: 0.92, MN: 1.00,
  MS: 0.78, MO: 0.88, MT: 0.90, NE: 0.86, NV: 0.98, NH: 1.02, NJ: 1.15, NM: 0.88,
  NY: 1.20, NC: 0.86, ND: 0.88, OH: 0.90, OK: 0.82, OR: 1.02, PA: 1.00, RI: 1.10,
  SC: 0.82, SD: 0.84, TN: 0.84, TX: 0.88, UT: 0.90, VT: 1.00, VA: 0.98, WA: 1.08,
  WV: 0.88, WI: 0.94, WY: 0.88,
}

// ─── Service ────────────────────────────────────────────────────────────────────

class PatternBookService {
  /**
   * List designs with filters — PUBLIC (Sec 210 mandate).
   */
  async listDesigns(filters: DesignFilters) {
    const page = filters.page || 1
    const limit = Math.min(filters.limit || 20, 50)
    const skip = (page - 1) * limit

    const where: any = {
      status: filters.status || 'PUBLISHED',
      isPublic: true,
    }

    if (filters.housingType) where.housingType = filters.housingType
    if (filters.bedrooms) where.bedrooms = filters.bedrooms
    if (filters.style) where.style = filters.style
    if (filters.jurisdictionId) where.jurisdictionId = filters.jurisdictionId

    if (filters.minSqFt || filters.maxSqFt) {
      where.totalSqFt = {}
      if (filters.minSqFt) where.totalSqFt.gte = filters.minSqFt
      if (filters.maxSqFt) where.totalSqFt.lte = filters.maxSqFt
    }

    if (filters.minCost || filters.maxCost) {
      where.costRangeLow = {}
      if (filters.minCost) where.costRangeLow.gte = filters.minCost
      if (filters.maxCost) where.costRangeHigh = { lte: filters.maxCost }
    }

    const [designs, total] = await Promise.all([
      prismaAny.patternBookDesign.findMany({
        where,
        orderBy: { selectCount: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.patternBookDesign.count({ where }),
    ])

    return {
      designs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  /**
   * Get design by ID or slug — PUBLIC.
   */
  async getDesign(idOrSlug: string) {
    const design = await prismaAny.patternBookDesign.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
        isPublic: true,
      },
      include: { jurisdiction: true },
    })
    if (!design) throw new NotFoundError('Design not found')
    return design
  }

  /**
   * Get location-adjusted cost estimate — PUBLIC.
   */
  async getCostEstimate(designId: string, zipCode?: string, state?: string) {
    const design = await prismaAny.patternBookDesign.findUnique({
      where: { id: designId },
    })
    if (!design) throw new NotFoundError('Design not found')

    const multiplier = state ? (STATE_COST_MULTIPLIERS[state.toUpperCase()] || 1.0) : 1.0

    const adjustedLow = Math.round(design.costRangeLow * multiplier)
    const adjustedHigh = Math.round(design.costRangeHigh * multiplier)
    const costPerSqFt = design.totalSqFt > 0
      ? Math.round(((adjustedLow + adjustedHigh) / 2) / design.totalSqFt)
      : 0

    return {
      designId: design.id,
      designName: design.name,
      housingType: design.housingType,
      totalSqFt: design.totalSqFt,
      baseCostRange: { low: design.costRangeLow, high: design.costRangeHigh },
      locationMultiplier: multiplier,
      adjustedCostRange: { low: adjustedLow, high: adjustedHigh },
      costPerSqFt,
      state: state || 'National Average',
      zipCode: zipCode || null,
      disclaimer: 'Cost estimates are approximate and based on regional averages. Actual costs may vary based on site conditions, material selections, and local labor rates.',
    }
  }

  /**
   * Get housing types with counts — PUBLIC.
   */
  async getHousingTypes() {
    const types = await prismaAny.patternBookDesign.groupBy({
      by: ['housingType'],
      where: { status: 'PUBLISHED', isPublic: true },
      _count: { id: true },
    })

    return types.map((t: any) => ({
      type: t.housingType,
      count: t._count.id,
    }))
  }

  /**
   * Get featured designs for homepage — PUBLIC.
   */
  async getFeatured(limit = 6) {
    return prismaAny.patternBookDesign.findMany({
      where: { status: 'PUBLISHED', isPublic: true },
      orderBy: { selectCount: 'desc' },
      take: limit,
    })
  }

  /**
   * User selects/downloads a design (auth required).
   */
  async selectDesign(designId: string, userId: string, customizations?: any) {
    const design = await prismaAny.patternBookDesign.findUnique({
      where: { id: designId },
    })
    if (!design) throw new NotFoundError('Design not found')

    // Create selection record
    const selection = await prismaAny.patternBookSelection.create({
      data: {
        designId,
        userId,
        customizations: customizations || {},
      },
    })

    // Increment counters
    await prismaAny.patternBookDesign.update({
      where: { id: designId },
      data: {
        selectCount: { increment: 1 },
        downloadCount: { increment: 1 },
      },
    })

    return selection
  }

  /**
   * Create a new design (admin only).
   */
  async createDesign(input: DesignInput, userId: string) {
    return prismaAny.patternBookDesign.create({
      data: {
        ...input,
        status: 'DRAFT',
        createdById: userId,
        selectCount: 0,
        downloadCount: 0,
        viewCount: 0,
      },
    })
  }

  /**
   * Generate permit checklist for a design + jurisdiction.
   */
  async getPermitChecklist(designId: string, jurisdictionId: string) {
    const design = await prismaAny.patternBookDesign.findUnique({
      where: { id: designId },
    })
    if (!design) throw new NotFoundError('Design not found')

    const jurisdiction = await prismaAny.jurisdiction.findUnique({
      where: { id: jurisdictionId },
    })

    // Generate checklist based on housing type and jurisdiction requirements
    const basePermits = [
      { permit: 'Building Permit', required: true, notes: design.status === 'PRE_APPROVED' ? 'Pre-approved design — expedited review' : 'Standard review' },
      { permit: 'Grading Permit', required: true, notes: 'Required for new construction' },
      { permit: 'Electrical Permit', required: true, notes: 'Separate application required' },
      { permit: 'Plumbing Permit', required: true, notes: 'Separate application required' },
      { permit: 'Mechanical Permit', required: true, notes: 'Separate application required' },
    ]

    // Pre-approved designs get expedited review
    const isPreApproved = design.status === 'PRE_APPROVED'
    const estimatedReviewDays = isPreApproved ? 7 : 21

    return {
      designId,
      designName: design.name,
      jurisdiction: jurisdiction?.name || 'Unknown',
      isPreApproved,
      estimatedReviewDays,
      permits: basePermits,
      requiredDocuments: [
        'Completed application form',
        'Site plan with setbacks',
        isPreApproved ? 'Pattern book design reference number' : 'Full construction drawings',
        'Engineering calculations (if required)',
        'Stormwater management plan',
        'Energy code compliance documentation',
      ],
      notes: isPreApproved
        ? 'This is a pre-approved pattern book design per Sec. 210 of the 21st Century ROAD to Housing Act. Expedited review applies.'
        : 'Standard permit review process applies.',
    }
  }
}

export const patternBookService = new PatternBookService()
