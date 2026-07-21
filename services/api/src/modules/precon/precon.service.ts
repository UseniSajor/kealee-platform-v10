/**
 * KEALEE PLATFORM - PRE-CONSTRUCTION SERVICE
 * Manages project owner pre-con workflow with guaranteed fee collection
 *
 * Fee Collection Method:
 * 1. Design Package Fee - Paid upfront before design starts
 * 2. Platform Commission - Automatically held in escrow at contract ratification
 *    and deducted from contractor's first milestone payment
 */

import { prismaAny } from '../../utils/prisma-helper'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { NotFoundError, ValidationError, AuthorizationError } from '../../errors/app.error'

// Types
export type PreConPhase =
  | 'INTAKE'
  | 'DESIGN_IN_PROGRESS'
  | 'DESIGN_REVIEW'
  | 'DESIGN_APPROVED'
  | 'SRP_GENERATED'
  | 'MARKETPLACE_READY'
  | 'BIDDING_OPEN'
  | 'AWARDED'
  | 'CONTRACT_PENDING'
  | 'CONTRACT_RATIFIED'
  | 'COMPLETED'

export type DesignPackageTier = 'BASIC' | 'STANDARD' | 'PREMIUM'

// Fee Configuration
export const DESIGN_PACKAGE_FEES: Record<DesignPackageTier, number> = {
  BASIC: 199,
  STANDARD: 499,
  PREMIUM: 999,
}

export const PLATFORM_COMMISSION_RATE = 0.035 // 3.5% of contract value

export interface CreatePreConInput {
  name: string
  category: string
  description: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  squareFootage?: number
  rooms?: number
  floors?: number
  features?: string[]
  complexity?: string
  designPackageTier?: DesignPackageTier
}

export interface UpdatePreConInput {
  name?: string
  description?: string
  squareFootage?: number
  rooms?: number
  floors?: number
  features?: string[]
  complexity?: string
  minimumBid?: number
  biddingDeadline?: string
}

export interface SelectConceptInput {
  conceptId: string
  feedback?: string
  rating?: number
}

export interface AwardBidInput {
  bidId: string
  notes?: string
}

export const preconService = {
  /**
   * Create new pre-con project (INTAKE phase)
   */
  async createPreConProject(input: CreatePreConInput, userId: string, orgId?: string) {
    // Create the pre-con project
    const precon = await prismaAny.preConProject.create({
      data: {
        ownerId: userId,
        orgId: orgId ?? null,
        name: input.name,
        category: input.category,
        description: input.description,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        squareFootage: input.squareFootage ?? null,
        rooms: input.rooms ?? null,
        floors: input.floors ?? null,
        features: input.features ?? [],
        complexity: input.complexity ?? 'STANDARD',
        designPackageTier: input.designPackageTier ?? 'STANDARD',
        phase: 'INTAKE',
        intakeCompletedAt: new Date(),
      },
    })

    // Create phase history
    await prismaAny.preConPhaseHistory.create({
      data: {
        preConProjectId: precon.id,
        fromPhase: null,
        toPhase: 'INTAKE',
        triggeredBy: userId,
        triggerType: 'USER',
        notes: 'Project intake submitted',
      },
    })

    // Create pending design package fee
    const designFee = DESIGN_PACKAGE_FEES[input.designPackageTier ?? 'STANDARD']
    await prismaAny.platformFee.create({
      data: {
        preConProjectId: precon.id,
        feeType: 'DESIGN_PACKAGE',
        amount: designFee,
        flatFee: designFee,
        status: 'PENDING',
        payerId: userId,
        payerType: 'OWNER',
        description: `Design Package Fee - ${input.designPackageTier ?? 'STANDARD'}`,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PRECON_PROJECT_CREATED',
      entityType: 'PreConProject',
      entityId: precon.id,
      userId,
      reason: 'Pre-construction project intake submitted',
      before: null,
      after: { id: precon.id, name: precon.name, phase: precon.phase },
    })

    return precon
  },

  /**
   * Get pre-con project by ID
   */
  async getPreConProject(preconId: string, userId: string) {
    const precon = await prismaAny.preConProject.findUnique({
      where: { id: preconId },
      include: {
        designConcepts: { orderBy: { createdAt: 'desc' } },
        bids: {
          orderBy: { bidAmount: 'asc' },
          include: {
            contractorProfile: {
              select: { id: true, businessName: true, rating: true, reviewCount: true },
            },
          },
        },
        platformFees: { orderBy: { createdAt: 'desc' } },
        phaseHistory: { orderBy: { occurredAt: 'desc' }, take: 10 },
      },
    })

    if (!precon) {
      throw new NotFoundError('PreConProject', preconId)
    }

    if (precon.ownerId !== userId) {
      throw new AuthorizationError('Not authorized to view this project')
    }

    return precon
  },

  /**
   * List pre-con projects for user
   */
  async listPreConProjects(userId: string, filters?: { phase?: PreConPhase; category?: string }) {
    const where: any = { ownerId: userId }

    if (filters?.phase) {
      where.phase = filters.phase
    }
    if (filters?.category) {
      where.category = filters.category
    }

    const precons = await prismaAny.preConProject.findMany({
      where,
      include: {
        designConcepts: { where: { isSelected: true }, take: 1 },
        bids: { where: { isAwarded: true }, take: 1 },
        platformFees: { where: { status: 'PENDING' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return precons
  },

  /**
   * Pay design package fee (advances to DESIGN_IN_PROGRESS)
   */
  async payDesignPackageFee(
    preconId: string,
    userId: string,
    paymentIntentId: string
  ) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'INTAKE') {
      throw new ValidationError('Design package already paid or project in wrong phase')
    }

    // Update fee status
    await prismaAny.platformFee.updateMany({
      where: {
        preConProjectId: preconId,
        feeType: 'DESIGN_PACKAGE',
        status: 'PENDING',
      },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
        collectedAmount: DESIGN_PACKAGE_FEES[precon.designPackageTier],
        stripePaymentIntentId: paymentIntentId,
        collectionMethod: 'DIRECT_CHARGE',
      },
    })

    // Advance phase
    const updated = await this.advancePhase(preconId, userId, 'DESIGN_IN_PROGRESS', 'Design package fee paid')

    return updated
  },

  /**
   * Add design concept (by platform/architect)
   */
  async addDesignConcept(
    preconId: string,
    conceptData: {
      name: string
      description: string
      style?: string
      primaryImageUrl?: string
      estimatedCost: number
      estimatedTimeline: number
      features?: string[]
    },
    creatorId: string
  ) {
    // Verify project exists and is in correct phase
    const precon = await prismaAny.preConProject.findUnique({
      where: { id: preconId },
    })

    if (!precon) {
      throw new NotFoundError('PreConProject', preconId)
    }

    if (!['DESIGN_IN_PROGRESS', 'DESIGN_REVIEW'].includes(precon.phase)) {
      throw new ValidationError('Cannot add concepts in current phase')
    }

    const concept = await prismaAny.designConcept.create({
      data: {
        preConProjectId: preconId,
        name: conceptData.name,
        description: conceptData.description,
        style: conceptData.style ?? null,
        primaryImageUrl: conceptData.primaryImageUrl ?? null,
        estimatedCost: conceptData.estimatedCost,
        estimatedTimeline: conceptData.estimatedTimeline,
        features: conceptData.features ?? [],
        createdById: creatorId,
      },
    })

    // If first concept, advance to DESIGN_REVIEW
    if (precon.phase === 'DESIGN_IN_PROGRESS') {
      await this.advancePhase(preconId, creatorId, 'DESIGN_REVIEW', 'First design concept added')
    }

    return concept
  },

  /**
   * Owner selects a design concept
   */
  async selectDesignConcept(preconId: string, userId: string, input: SelectConceptInput) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'DESIGN_REVIEW') {
      throw new ValidationError('Cannot select concept in current phase')
    }

    // Deselect any previously selected
    await prismaAny.designConcept.updateMany({
      where: { preConProjectId: preconId, isSelected: true },
      data: { isSelected: false },
    })

    // Select the new concept
    const concept = await prismaAny.designConcept.update({
      where: { id: input.conceptId },
      data: {
        isSelected: true,
        selectedAt: new Date(),
        ownerFeedback: input.feedback ?? null,
        ownerRating: input.rating ?? null,
      },
    })

    // Update precon with selected concept
    await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        selectedConceptId: input.conceptId,
        designApprovedAt: new Date(),
      },
    })

    // Advance to DESIGN_APPROVED
    await this.advancePhase(preconId, userId, 'DESIGN_APPROVED', `Selected concept: ${concept.name}`)

    return concept
  },

  /**
   * Generate Suggested Retail Price (SRP)
   */
  async generateSRP(preconId: string, userId: string) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'DESIGN_APPROVED') {
      throw new ValidationError('Design must be approved before generating SRP')
    }

    const concept = precon.designConcepts.find((c: any) => c.isSelected)
    if (!concept) {
      throw new ValidationError('No design concept selected')
    }

    // Calculate SRP based on concept estimates
    const laborCost = concept.estimatedLaborCost ?? concept.estimatedCost * 0.4
    const materialCost = concept.estimatedMaterialCost ?? concept.estimatedCost * 0.35
    const contingency = concept.estimatedCost * 0.1
    const markup = concept.estimatedCost * 0.15
    const srp = concept.estimatedCost + contingency + markup

    // Update precon with SRP
    const updated = await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        suggestedRetailPrice: srp,
        srpLaborCost: laborCost,
        srpMaterialCost: materialCost,
        srpContingency: contingency,
        srpMarkup: markup,
        srpBreakdown: {
          labor: laborCost,
          materials: materialCost,
          contingency,
          markup,
          total: srp,
          estimatedTimeline: concept.estimatedTimeline,
        },
        srpConfidence: 85, // Default confidence
        srpValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid 30 days
        srpGeneratedAt: new Date(),
      },
    })

    // Advance to SRP_GENERATED
    await this.advancePhase(preconId, userId, 'SRP_GENERATED', `SRP generated: $${srp.toFixed(2)}`)

    return updated
  },

  /**
   * Open marketplace for bidding
   */
  async openMarketplace(
    preconId: string,
    userId: string,
    settings: { minimumBid?: number; biddingDeadline?: string; maxBids?: number }
  ) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'SRP_GENERATED') {
      throw new ValidationError('SRP must be generated before opening marketplace')
    }

    const updated = await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        minimumBid: settings.minimumBid ?? precon.suggestedRetailPrice * 0.8,
        biddingDeadline: settings.biddingDeadline ? new Date(settings.biddingDeadline) : null,
        maxBids: settings.maxBids ?? 5,
        marketplaceReadyAt: new Date(),
        biddingOpenedAt: new Date(),
      },
    })

    // Advance to BIDDING_OPEN
    await this.advancePhase(preconId, userId, 'BIDDING_OPEN', 'Marketplace opened for contractor bids')

    // Emit event for marketplace notification
    await eventService.recordEvent({
      type: 'PRECON_BIDDING_OPENED',
      entityType: 'PreConProject',
      entityId: preconId,
      userId,
      payload: {
        category: precon.category,
        srp: precon.suggestedRetailPrice,
        minimumBid: updated.minimumBid,
        city: precon.city,
        state: precon.state,
      },
    })

    return updated
  },

  /**
   * Award bid to contractor
   */
  async awardBid(preconId: string, userId: string, input: AwardBidInput) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'BIDDING_OPEN') {
      throw new ValidationError('Can only award bids during bidding phase')
    }

    const bid = precon.bids.find((b: any) => b.id === input.bidId)
    if (!bid) {
      throw new NotFoundError('ContractorBid', input.bidId)
    }

    // Update bid status
    await prismaAny.contractorBid.update({
      where: { id: input.bidId },
      data: {
        status: 'AWARDED',
        isAwarded: true,
        awardedAt: new Date(),
      },
    })

    // Reject other bids
    await prismaAny.contractorBid.updateMany({
      where: {
        preConProjectId: preconId,
        id: { not: input.bidId },
      },
      data: { status: 'REJECTED' },
    })

    // Update precon
    await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        awardedBidId: input.bidId,
        awardedContractorId: bid.contractorProfileId,
        contractAmount: bid.bidAmount,
        awardedAt: new Date(),
      },
    })

    // Advance to AWARDED
    await this.advancePhase(preconId, userId, 'AWARDED', `Bid awarded to contractor: ${bid.contractorName}`)

    // Create PENDING platform commission fee (collected at contract ratification)
    const commissionAmount = Number(bid.bidAmount) * PLATFORM_COMMISSION_RATE
    await prismaAny.platformFee.create({
      data: {
        preConProjectId: preconId,
        feeType: 'CONTRACT_COMMISSION',
        amount: commissionAmount,
        baseAmount: bid.bidAmount,
        feePercentage: PLATFORM_COMMISSION_RATE,
        status: 'PENDING',
        payerId: bid.contractorProfileId,
        payerType: 'CONTRACTOR',
        description: `Platform commission (${PLATFORM_COMMISSION_RATE * 100}% of contract)`,
      },
    })

    return bid
  },

  /**
   * Ratify contract - GUARANTEED FEE COLLECTION POINT
   * Called when contract is signed by both parties
   */
  async ratifyContract(
    preconId: string,
    userId: string,
    contractDetails: {
      contractId: string
      escrowAgreementId: string
      signedAt: string
    }
  ) {
    const precon = await this.getPreConProject(preconId, userId)

    if (!['AWARDED', 'CONTRACT_PENDING'].includes(precon.phase)) {
      throw new ValidationError('Cannot ratify contract in current phase')
    }

    // GUARANTEED FEE COLLECTION: Hold commission in escrow
    const commissionFee = await prismaAny.platformFee.findFirst({
      where: {
        preConProjectId: preconId,
        feeType: 'CONTRACT_COMMISSION',
        status: 'PENDING',
      },
    })

    if (commissionFee) {
      // Mark fee as HOLD (will be deducted from first milestone payment)
      await prismaAny.platformFee.update({
        where: { id: commissionFee.id },
        data: {
          status: 'HOLD',
          escrowHoldId: contractDetails.escrowAgreementId,
          collectionMethod: 'ESCROW_DEDUCTION',
          notes: 'Fee held in escrow. Will be deducted from contractor first milestone payment.',
        },
      })
    }

    // Update precon
    const updated = await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        contractRatifiedAt: new Date(),
      },
    })

    // Advance to CONTRACT_RATIFIED
    await this.advancePhase(preconId, userId, 'CONTRACT_RATIFIED', 'Contract signed and ratified')

    // Log audit for fee hold
    await auditService.recordAudit({
      action: 'PLATFORM_FEE_ESCROWED',
      entityType: 'PlatformFee',
      entityId: commissionFee?.id || preconId,
      userId,
      reason: 'Platform commission held in escrow at contract ratification',
      before: { status: 'PENDING' },
      after: {
        status: 'HOLD',
        amount: commissionFee?.amount,
        escrowAgreementId: contractDetails.escrowAgreementId,
      },
    })

    return updated
  },

  /**
   * Complete pre-con (link to main project)
   */
  async completePreCon(preconId: string, userId: string, projectId: string) {
    const precon = await this.getPreConProject(preconId, userId)

    if (precon.phase !== 'CONTRACT_RATIFIED') {
      throw new ValidationError('Contract must be ratified before completing pre-con')
    }

    const updated = await prismaAny.preConProject.update({
      where: { id: preconId },
      data: {
        projectId,
        phase: 'COMPLETED',
      },
    })

    // Advance to COMPLETED
    await this.advancePhase(preconId, userId, 'COMPLETED', `Linked to project: ${projectId}`)

    return updated
  },

  /**
   * Get dashboard summary for project owner
   */
  async getDashboardSummary(userId: string) {
    const [
      totalProjects,
      byPhase,
      pendingFees,
      recentProjects,
    ] = await Promise.all([
      // Total count
      prismaAny.preConProject.count({ where: { ownerId: userId } }),

      // Count by phase
      prismaAny.preConProject.groupBy({
        by: ['phase'],
        where: { ownerId: userId },
        _count: true,
      }),

      // Pending fees
      prismaAny.platformFee.findMany({
        where: {
          preConProject: { ownerId: userId },
          status: 'PENDING',
        },
        include: { preConProject: { select: { id: true, name: true } } },
      }),

      // Recent projects
      prismaAny.preConProject.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          designConcepts: { where: { isSelected: true }, take: 1 },
        },
      }),
    ])

    // Calculate phase counts
    const phaseCounts: Record<string, number> = {}
    for (const p of byPhase) {
      phaseCounts[p.phase] = p._count
    }

    // Calculate total pending fees
    const totalPendingFees = pendingFees.reduce(
      (sum: number, f: any) => sum + Number(f.amount),
      0
    )

    return {
      totalProjects,
      phaseCounts,
      activeProjects: totalProjects - (phaseCounts['COMPLETED'] || 0),
      pendingFees: {
        count: pendingFees.length,
        total: totalPendingFees,
        items: pendingFees,
      },
      recentProjects,
      pipeline: {
        intake: phaseCounts['INTAKE'] || 0,
        design: (phaseCounts['DESIGN_IN_PROGRESS'] || 0) + (phaseCounts['DESIGN_REVIEW'] || 0),
        approved: phaseCounts['DESIGN_APPROVED'] || 0,
        marketplace: (phaseCounts['SRP_GENERATED'] || 0) + (phaseCounts['MARKETPLACE_READY'] || 0) + (phaseCounts['BIDDING_OPEN'] || 0),
        awarded: (phaseCounts['AWARDED'] || 0) + (phaseCounts['CONTRACT_PENDING'] || 0) + (phaseCounts['CONTRACT_RATIFIED'] || 0),
        completed: phaseCounts['COMPLETED'] || 0,
      },
    }
  },

  /**
   * Helper: Advance phase with history tracking
   */
  async advancePhase(
    preconId: string,
    userId: string,
    newPhase: PreConPhase,
    notes?: string
  ) {
    const precon = await prismaAny.preConProject.findUnique({
      where: { id: preconId },
      select: { phase: true },
    })

    if (!precon) {
      throw new NotFoundError('PreConProject', preconId)
    }

    // Update phase
    const updated = await prismaAny.preConProject.update({
      where: { id: preconId },
      data: { phase: newPhase },
    })

    // Record history
    await prismaAny.preConPhaseHistory.create({
      data: {
        preConProjectId: preconId,
        fromPhase: precon.phase,
        toPhase: newPhase,
        triggeredBy: userId,
        triggerType: 'USER',
        notes,
      },
    })

    return updated
  },
}
