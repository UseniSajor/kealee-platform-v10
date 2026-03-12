import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { engagementService } from '../engagement/engagement.service'
// Prisma Decimal type - use any for now
type PrismaDecimal = any

// Configuration
const DEFAULT_DISTRIBUTION_COUNT = 5 // Top N contractors to distribute to

export interface DistributeLeadInput {
  leadId: string
  userId?: string // User who triggered distribution (for audit)
  distributionCount?: number // Override default (default: 5)
}

export interface ContractorCandidate {
  profileId: string
  userId: string
  businessName: string
  verified: boolean
  performanceScore: number | null
  rating: number | null
  projectsCompleted: number
  subscriptionTier: string | null
  currentPipelineValue: PrismaDecimal
  maxPipelineValue: PrismaDecimal
  lastWonAt: Date | null
  canAccept: boolean
  rejectionReason?: string
}

export const leadsService = {
  /**
   * Create a new lead
   */
  async createLead(input: {
    category: string
    description: string
    estimatedValue?: number
    srp?: number
    location: string
    city?: string
    state?: string
    projectId?: string
    userId?: string
  }) {
    const lead = await prismaAny.lead.create({
      data: {
        category: input.category,
        description: input.description,
        estimatedValue: input.estimatedValue as any,
        srp: input.srp as any,
        location: input.location,
        city: input.city,
        state: input.state,
        projectId: input.projectId,
        stage: 'OPEN',
      },
    })

    // Create canonical Engagement and link it to the Lead
    const engagementId = await engagementService.createEngagement({
      type: 'MARKETPLACE_PROJECT',
      status: 'LEAD_CAPTURED',
      deliveryModel: 'MARKETPLACE',
      assignmentMode: 'ROTATING_QUEUE',
      initiatorUserId: input.userId,
      sourceLeadId: lead.id,
      projectId: input.projectId,
      totalValue: input.estimatedValue,
    })
    await prismaAny.lead.update({
      where: { id: lead.id },
      data: { engagementId },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      userId: input.userId || 'system',
      after: lead,
    })

    // Log event
    await eventService.recordEvent({
      type: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      userId: input.userId,
      payload: lead,
    })

    return lead
  },

  /**
   * Distribute a lead to eligible contractors based on capacity and performance
   */
  async distributeLead(input: DistributeLeadInput) {
    const { leadId, userId, distributionCount = DEFAULT_DISTRIBUTION_COUNT } = input

    // Fetch lead
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
      include: {
        distributedTo: true,
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    // Check if lead already distributed
    if (lead.distributedTo.length > 0) {
      throw new Error(`Lead ${leadId} has already been distributed`)
    }

    // Find eligible contractors
    const candidates = await this.findEligibleContractors(lead, distributionCount)

    if (candidates.length === 0) {
      // Log that no eligible contractors found
      await Promise.all([
        auditService.recordAudit({
          action: 'LEAD_DISTRIBUTION_FAILED',
          entityType: 'Lead',
          entityId: leadId,
          userId: userId || 'system',
          reason: 'No eligible contractors found',
          before: { stage: lead.stage },
          after: { stage: lead.stage },
        }),
        eventService.recordEvent({
          type: 'LEAD_DISTRIBUTION_FAILED',
          entityType: 'Lead',
          entityId: leadId,
          userId: userId,
          payload: {
            reason: 'No eligible contractors found',
            estimatedValue: lead.estimatedValue?.toString(),
          },
        }),
      ])

      return {
        success: false,
        reason: 'NO_ELIGIBLE_CONTRACTORS',
        message: 'No eligible contractors found for this lead',
        candidates: [],
      }
    }

    // Filter to only contractors that can accept
    const acceptedCandidates = candidates.filter((c) => c.canAccept)

    if (acceptedCandidates.length === 0) {
      // All candidates rejected due to capacity
      await Promise.all([
        auditService.recordAudit({
          action: 'LEAD_DISTRIBUTION_FAILED',
          entityType: 'Lead',
          entityId: leadId,
          userId: userId || 'system',
          reason: 'All contractors exceeded capacity',
          before: { stage: lead.stage },
          after: { stage: lead.stage },
        }),
        eventService.recordEvent({
          type: 'LEAD_DISTRIBUTION_FAILED',
          entityType: 'Lead',
          entityId: leadId,
          userId: userId,
          payload: {
            reason: 'All contractors exceeded capacity',
            candidates: candidates.map((c) => ({
              profileId: c.profileId,
              rejectionReason: c.rejectionReason,
            })),
          },
        }),
      ])

      return {
        success: false,
        reason: 'ALL_CONTRACTORS_EXCEEDED_CAPACITY',
        message: 'All eligible contractors exceeded their capacity limits',
        candidates: candidates,
      }
    }

    // Select top N contractors
    const selectedCandidates = acceptedCandidates.slice(0, distributionCount)

    // Update lead stage if estimatedValue is missing (mark as INTAKE)
    const shouldMarkAsIntake = !lead.estimatedValue
    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        stage: shouldMarkAsIntake ? 'INTAKE' : lead.stage,
        stageChangedAt: shouldMarkAsIntake ? new Date() : lead.stageChangedAt,
        distributedTo: {
          connect: selectedCandidates.map((c) => ({ id: c.profileId })),
        },
      },
    })

    // Log distribution decision
    const distributionPayload = {
      leadId,
      leadValue: lead.estimatedValue?.toString(),
      selectedCount: selectedCandidates.length,
      selectedContractors: selectedCandidates.map((c) => ({
        profileId: c.profileId,
        businessName: c.businessName,
        subscriptionTier: c.subscriptionTier,
        currentPipelineValue: c.currentPipelineValue.toString(),
        maxPipelineValue: c.maxPipelineValue.toString(),
      })),
      rejectedCount: candidates.length - acceptedCandidates.length,
      rejectedContractors: candidates
        .filter((c) => !c.canAccept)
        .map((c) => ({
          profileId: c.profileId,
          rejectionReason: c.rejectionReason,
        })),
    }

    await Promise.all([
      auditService.recordAudit({
        action: 'LEAD_DISTRIBUTED',
        entityType: 'Lead',
        entityId: leadId,
        userId: userId || 'system',
        before: {
          stage: lead.stage,
          distributedToCount: lead.distributedTo.length,
        },
        after: {
          stage: updatedLead.stage,
          distributedToCount: selectedCandidates.length,
        },
      }),
      eventService.recordEvent({
        type: 'LEAD_DISTRIBUTED',
        entityType: 'Lead',
        entityId: leadId,
        userId: userId,
        payload: distributionPayload,
      }),
    ])

    return {
      success: true,
      lead: updatedLead,
      distributedTo: selectedCandidates.map((c) => ({
        profileId: c.profileId,
        businessName: c.businessName,
        subscriptionTier: c.subscriptionTier,
      })),
      distributionDetails: distributionPayload,
    }
  },

  /**
   * Find eligible contractors for a lead based on capacity and performance
   */
  async findEligibleContractors(
    lead: {
      id: string
      estimatedValue: PrismaDecimal | null
      projectType?: string | null
      city?: string | null
      state?: string | null
    },
    limit: number
  ): Promise<ContractorCandidate[]> {
    // Base query: Only contractors accepting leads
    const profiles = await prismaAny.marketplaceProfile.findMany({
      where: {
        acceptingLeads: true,
        user: {
          status: 'ACTIVE',
        },
      },
      include: {
        user: true,
        distributedLeads: {
          where: {
            stage: {
              in: ['INTAKE', 'QUALIFIED', 'SCOPED', 'QUOTED'],
            },
          },
          select: {
            estimatedValue: true,
          },
        },
        awardedLeads: {
          where: {
            stage: 'WON',
          },
          select: {
            id: true,
          },
        },
        quotes: {
          where: {
            status: 'accepted',
          },
          select: {
            id: true,
          },
        },
      },
    })

    // Calculate candidate metrics
    const candidates: ContractorCandidate[] = []

    for (const profile of profiles) {
      // Calculate current pipeline value (sum of distributed leads in pipeline)
      const currentPipelineValue = profile.distributedLeads.reduce(
        (sum: any, l: any) => {
          if (!l.estimatedValue) return sum
          return (sum || 0) + Number(l.estimatedValue || 0)
        },
        0 as any
      )

      // Calculate projects completed (awarded leads that became projects)
      const projectsCompleted = profile.awardedLeads.length

      // Check capacity constraints
      let canAccept = true
      let rejectionReason: string | undefined

      // Check if contractor is accepting leads
      if (!profile.acceptingLeads) {
        canAccept = false
        rejectionReason = 'Not accepting leads'
      }

      // Check maxPipelineValue constraint
      if (lead.estimatedValue) {
        const newPipelineValue = currentPipelineValue.plus(lead.estimatedValue)
        if (newPipelineValue.gt(profile.maxPipelineValue)) {
          canAccept = false
          rejectionReason = `Would exceed maxPipelineValue (current: ${currentPipelineValue}, max: ${profile.maxPipelineValue}, lead: ${lead.estimatedValue})`
        }
      }

      // Calculate performance metrics
      // Note: These fields don't exist in schema yet, so we'll use calculated values
      const verified = profile.user.status === 'ACTIVE'

      // Performance score: on-time rate from completed milestones
      let performanceScore: number | null = null
      const completedMilestones = await prismaAny.milestone.findMany({
        where: { contract: { contractorId: profile.userId }, status: 'PAID' },
        select: { completedAt: true, dueDate: true },
      }).catch(() => [])
      if (completedMilestones.length > 0) {
        const onTimeCount = completedMilestones.filter(
          (m: any) => !m.dueDate || !m.completedAt || m.completedAt <= m.dueDate
        ).length
        performanceScore = Math.round((onTimeCount / completedMilestones.length) * 100)
      }

      // Rating: average from contractor reviews
      let rating: number | null = null
      const reviews = await prismaAny.contractorReview.findMany({
        where: { contractorId: profile.userId },
        select: { rating: true },
      }).catch(() => [])
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
        rating = Math.round((totalRating / reviews.length) * 10) / 10
      }

      candidates.push({
        profileId: profile.id,
        userId: profile.userId,
        businessName: profile.businessName,
        verified,
        performanceScore,
        rating,
        projectsCompleted,
        subscriptionTier: profile.subscriptionTier,
        currentPipelineValue,
        lastWonAt: profile.lastWonAt,
        maxPipelineValue: profile.maxPipelineValue,
        canAccept,
        rejectionReason,
      })
    }

    // Sort candidates by selection criteria:
    // 1. verified (desc)
    // 2. lastWonAt (asc, nulls first - front of queue)
    // 3. performanceScore (desc)
    // 4. rating (desc)
    // 5. projectsCompleted (desc)
    candidates.sort((a, b) => {
      // 1. Verified first
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1
      }

      // 2. Fair Rotation: Last won at (asc, nulls first)
      if (a.lastWonAt !== b.lastWonAt) {
        if (!a.lastWonAt) return -1
        if (!b.lastWonAt) return 1
        return a.lastWonAt.getTime() - b.lastWonAt.getTime()
      }

      // 3. Performance score
      if (a.performanceScore !== b.performanceScore) {
        if (a.performanceScore === null) return 1
        if (b.performanceScore === null) return -1
        return b.performanceScore - a.performanceScore
      }

      // 4. Rating
      if (a.rating !== b.rating) {
        if (a.rating === null) return 1
        if (b.rating === null) return -1
        return b.rating - a.rating
      }

      // 5. Projects completed
      return b.projectsCompleted - a.projectsCompleted
    })

    // Optional: Prioritize by subscription tier (Premium first)
    // This is a secondary sort after the main criteria
    candidates.sort((a, b) => {
      const tierPriority: Record<string, number> = {
        enterprise: 4,
        premium: 3,
        pro: 2,
        basic: 1,
        free: 0,
      }

      const aPriority = tierPriority[a.subscriptionTier?.toLowerCase() || 'free'] || 0
      const bPriority = tierPriority[b.subscriptionTier?.toLowerCase() || 'free'] || 0

      // Only use tier as tiebreaker if other metrics are equal
      if (a.verified === b.verified && a.performanceScore === b.performanceScore && a.rating === b.rating && a.projectsCompleted === b.projectsCompleted) {
        return bPriority - aPriority
      }

      return 0
    })

    return candidates.slice(0, limit * 2) // Return more than needed for filtering
  },

  /**
   * List leads with filtering
   */
  async listLeads(filters: {
    stage?: string
    estimatedValueMin?: number
    estimatedValueMax?: number
    city?: string
    state?: string
    projectType?: string
    assignedSalesRepId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters.stage) {
      where.stage = filters.stage
    }

    if (filters.estimatedValueMin !== undefined || filters.estimatedValueMax !== undefined) {
      where.estimatedValue = {}
      if (filters.estimatedValueMin !== undefined) {
        where.estimatedValue.gte = filters.estimatedValueMin as any
      }
      if (filters.estimatedValueMax !== undefined) {
        where.estimatedValue.lte = filters.estimatedValueMax as any
      }
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' }
    }

    if (filters.state) {
      where.state = filters.state
    }

    if (filters.projectType) {
      where.projectType = filters.projectType
    }

    if (filters.assignedSalesRepId) {
      where.assignedSalesRepId = filters.assignedSalesRepId
    }

    const [leads, total] = await Promise.all([
      prismaAny.lead.findMany({
        where,
        include: {
          assignedSalesRep: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          awardedProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          distributedTo: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prismaAny.lead.count({ where }),
    ])

    return { leads, total, limit: filters.limit || 100, offset: filters.offset || 0 }
  },

  /**
   * Update lead stage
   */
  async updateLeadStage(leadId: string, newStage: string, userId?: string) {
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    const oldStage = lead.stage
    const now = new Date()

    // Update stage-specific timestamps
    const updateData: any = {
      stage: newStage,
      stageChangedAt: now,
    }

    if (newStage === 'QUALIFIED' && !lead.qualifiedAt) {
      updateData.qualifiedAt = now
    } else if (newStage === 'SCOPED' && !lead.scopedAt) {
      updateData.scopedAt = now
    } else if (newStage === 'QUOTED' && !lead.quotedAt) {
      updateData.quotedAt = now
    } else if (newStage === 'WON' && !lead.wonAt) {
      updateData.wonAt = now
    } else if (newStage === 'LOST' && !lead.lostAt) {
      updateData.lostAt = now
    }

    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedSalesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        awardedProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'LEAD_STAGE_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId || 'system',
      reason: `Lead stage changed from ${oldStage} to ${newStage}`,
      before: { stage: oldStage },
      after: { stage: newStage },
    })

    // Log event
    await eventService.recordEvent({
      type: 'LEAD_STAGE_UPDATED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId,
      payload: {
        oldStage,
        newStage,
        leadId,
      },
    })

    return updatedLead
  },

  /**
   * Assign sales rep to lead
   */
  async assignSalesRep(leadId: string, salesRepId: string, userId?: string) {
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    // Verify sales rep exists
    const salesRep = await prismaAny.user.findUnique({
      where: { id: salesRepId },
      select: { id: true, name: true, email: true },
    })

    if (!salesRep) {
      throw new NotFoundError('User', salesRepId)
    }

    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        assignedSalesRepId: salesRepId,
      },
      include: {
        assignedSalesRep: {
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
      action: 'LEAD_SALES_REP_ASSIGNED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId || 'system',
      reason: `Sales rep ${salesRep.name} assigned to lead`,
      before: { assignedSalesRepId: lead.assignedSalesRepId },
      after: { assignedSalesRepId: salesRepId },
    })

    // Log event
    await eventService.recordEvent({
      type: 'LEAD_SALES_REP_ASSIGNED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId,
      payload: {
        leadId,
        salesRepId,
        salesRepName: salesRep.name,
      },
    })

    return updatedLead
  },

  /**
   * Award contractor to lead
   */
  async awardContractor(leadId: string, profileId: string, userId?: string) {
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        stage: true,
        awardedProfileId: true,
        lostReason: true,
        engagementId: true,
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    // Verify profile exists
    const profile = await prismaAny.marketplaceProfile.findUnique({
      where: { id: profileId },
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

    if (!profile) {
      throw new NotFoundError('MarketplaceProfile', profileId)
    }

    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        awardedProfileId: profileId,
        stage: 'WON', // Awarding contractor means lead is won
        wonAt: new Date(),
        stageChangedAt: new Date(),
      },
      include: {
        awardedProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Update contractor's lastWonAt for rotation system
    await prismaAny.marketplaceProfile.update({
      where: { id: profileId },
      data: {
        lastWonAt: new Date(),
        projectsCompleted: { increment: 1 },
      },
    })

    // Advance canonical Engagement to AWARDED
    await engagementService.advanceEngagement(lead.engagementId, 'AWARDED', {
      awardedToUserId: profile.userId,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'LEAD_CONTRACTOR_AWARDED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId || 'system',
      reason: `Contractor ${profile.businessName} awarded to lead`,
      before: {
        awardedProfileId: lead.awardedProfileId,
        stage: lead.stage,
      },
      after: {
        awardedProfileId: profileId,
        stage: 'WON',
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'LEAD_CONTRACTOR_AWARDED',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId,
      payload: {
        leadId,
        profileId,
        contractorName: profile.businessName,
        stage: 'WON',
      },
    })

    return updatedLead
  },

  /**
   * Close lead as lost
   */
  async closeLost(leadId: string, reason: string, userId?: string) {
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
      select: { id: true, stage: true, lostReason: true, engagementId: true },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    const updatedLead = await prismaAny.lead.update({
      where: { id: leadId },
      data: {
        stage: 'LOST',
        lostAt: new Date(),
        lostReason: reason,
        stageChangedAt: new Date(),
      },
    })

    // Advance canonical Engagement to LOST
    await engagementService.advanceEngagement(lead.engagementId, 'LOST')

    // Log audit
    await auditService.recordAudit({
      action: 'LEAD_CLOSED_LOST',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId || 'system',
      reason: `Lead closed as lost: ${reason}`,
      before: {
        stage: lead.stage,
        lostReason: lead.lostReason,
      },
      after: {
        stage: 'LOST',
        lostReason: reason,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'LEAD_CLOSED_LOST',
      entityType: 'Lead',
      entityId: leadId,
      userId: userId,
      payload: {
        leadId,
        reason,
        oldStage: lead.stage,
      },
    })

    return updatedLead
  },

  /**
   * Get lead by ID
   */
  async getLead(leadId: string) {
    const lead = await prismaAny.lead.findUnique({
      where: { id: leadId },
      include: {
        distributedTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        quotes: {
          include: {
            profile: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        assignedSalesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        awardedProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!lead) {
      throw new NotFoundError('Lead', leadId)
    }

    return lead
  },
}
