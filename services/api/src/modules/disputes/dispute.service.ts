import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
// Prisma types available through prismaAny

export const disputeService = {
  /**
   * Initiate a dispute (Prompt 3.5)
   */
  async initiateDispute(
    userId: string,
    input: {
      projectId: string
      milestoneId?: string
      reason: string
      description: string
      evidenceIds?: string[]
      priority?: string
    }
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: input.projectId },
      include: {
        owner: { select: { id: true } },
        contracts: {
          include: {
            contractor: { select: { id: true } },
            owner: { select: { id: true } },
          },
        },
      },
    })

    if (!project) throw new NotFoundError('Project', input.projectId)

    // Determine if user is owner or contractor
    const isOwner = project.ownerId === userId
    const isContractor = project.contracts.some((c) => c.contractorId === userId)

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project owner or contractor can initiate disputes')
    }

    // Get active contract and escrow
    const activeContract = project.contracts.find((c: any) => c.status === 'ACTIVE')
    if (!activeContract) {
      throw new ValidationError('No active contract found for this project')
    }

    const escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId: input.projectId },
    })

    if (!escrow) {
      throw new ValidationError('Escrow agreement not found')
    }

    // Check if there's already an active dispute
    const activeDispute = await prismaAny.dispute.findFirst({
      where: {
        projectId: input.projectId,
        status: {
          in: ['FILED', 'FREEZE_APPLIED', 'UNDER_INVESTIGATION', 'PENDING_MEDIATION', 'PENDING_RESOLUTION'],
        },
      },
    })

    if (activeDispute) {
      throw new ValidationError('An active dispute already exists for this project')
    }

    // Create dispute
    const dispute = await prismaAny.dispute.create({
      data: {
        projectId: input.projectId,
        milestoneId: input.milestoneId || null,
        contractId: activeContract.id,
        escrowId: escrow.id,
        initiatedBy: userId,
        initiatedByRole: isOwner ? 'OWNER' : 'CONTRACTOR',
        reason: input.reason,
        description: input.description,
        priority: input.priority || 'normal',
        status: 'FILED',
      },
    })

    // Add evidence if provided
    if (input.evidenceIds && input.evidenceIds.length > 0) {
      const evidenceRecords = await prismaAny.evidence.findMany({
        where: {
          id: { in: input.evidenceIds },
          projectId: input.projectId,
        },
      })

      await prismaAny.disputeEvidence.createMany({
        data: evidenceRecords.map((ev: any) => ({
          disputeId: dispute.id,
          evidenceId: ev.id,
          url: ev.url,
          fileName: ev.fileName,
          description: `Evidence from milestone submission`,
          uploadedBy: userId,
        })),
      })
    }

    // Freeze escrow (Prompt 3.5: Escrow freeze during dispute)
    await prismaAny.escrowAgreement.update({
      where: { id: escrow.id },
      data: {
        status: 'FROZEN',
      },
    })

    // Update dispute status to FREEZE_APPLIED
    await prismaAny.dispute.update({
      where: { id: dispute.id },
      data: {
        status: 'FREEZE_APPLIED',
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Dispute',
        entityId: dispute.id,
        action: 'DISPUTE_FILED',
        details: {
          reason: input.reason,
          milestoneId: input.milestoneId,
        },
        userId: userId,
        reason: `Dispute filed: ${input.reason}`,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Dispute',
        entityId: dispute.id,
        type: 'DISPUTE_FILED',
        payload: {
          reason: input.reason,
          milestoneId: input.milestoneId,
          escrowFrozen: true,
        },
        userId: userId,
      },
    })

    return dispute
  },

  /**
   * Get dispute details (Prompt 3.5)
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await prismaAny.dispute.findUnique({
      where: { id: disputeId },
      include: {
        project: { select: { ownerId: true } },
        contract: {
          include: {
            contractor: { select: { id: true } },
            owner: { select: { id: true } },
          },
        },
        evidence: true,
        comments: {
          include: {
            dispute: false, // Avoid circular reference
          },
          orderBy: { createdAt: 'asc' },
        },
        initiator: { select: { id: true, name: true, email: true } },
        resolver: { select: { id: true, name: true, email: true } },
        mediator: { select: { id: true, name: true, email: true } },
      },
    })

    if (!dispute) throw new NotFoundError('Dispute', disputeId)

    // Check authorization
    const isOwner = dispute.project.ownerId === userId
    const isContractor = dispute.contract?.contractorId === userId
    // TODO: Check if user is admin/mediator

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project parties can view this dispute')
    }

    return dispute
  },

  /**
   * List disputes for a project (Prompt 3.5)
   */
  async listProjectDisputes(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
        contracts: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const isOwner = project.ownerId === userId
    const isContractor = project.contracts.some((c) => c.contractorId === userId)

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project parties can view disputes')
    }

    const disputes = await prismaAny.dispute.findMany({
      where: { projectId },
      include: {
        milestone: { select: { id: true, name: true } },
        initiator: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return disputes
  },

  /**
   * Request mediation (Prompt 3.5)
   */
  async requestMediation(disputeId: string, userId: string, notes?: string) {
    const dispute = await prismaAny.dispute.findUnique({
      where: { id: disputeId },
      include: {
        project: { select: { ownerId: true } },
        contract: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    })

    if (!dispute) throw new NotFoundError('Dispute', disputeId)

    // Check authorization
    const isOwner = dispute.project.ownerId === userId
    const isContractor = dispute.contract?.contractorId === userId

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project parties can request mediation')
    }

    if (dispute.status === 'RESOLVED' || dispute.status === 'CANCELLED') {
      throw new ValidationError('Cannot request mediation for resolved or cancelled disputes')
    }

    // Update dispute
    const updated = await prismaAny.dispute.update({
      where: { id: disputeId },
      data: {
        mediationRequested: true,
        mediationRequestedAt: new Date(),
        status: 'PENDING_MEDIATION',
        mediationNotes: notes || null,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Dispute',
        entityId: disputeId,
        type: 'MEDIATION_REQUESTED',
        payload: { notes },
        userId: userId,
      },
    })

    return updated
  },

  /**
   * Add comment to dispute (Prompt 3.5)
   */
  async addComment(disputeId: string, userId: string, comment: string, isInternal: boolean = false) {
    const dispute = await prismaAny.dispute.findUnique({
      where: { id: disputeId },
      include: {
        project: { select: { ownerId: true } },
        contract: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    })

    if (!dispute) throw new NotFoundError('Dispute', disputeId)

    // Check authorization
    const isOwner = dispute.project.ownerId === userId
    const isContractor = dispute.contract?.contractorId === userId
    // TODO: Check if user is admin (for internal comments)

    if (!isOwner && !isContractor && !isInternal) {
      throw new AuthorizationError('Only project parties can add comments')
    }

    const disputeComment = await prismaAny.disputeComment.create({
      data: {
        disputeId,
        comment,
        createdBy: userId,
        isInternal,
      },
    })

    return disputeComment
  },

  /**
   * Resolve dispute (Prompt 3.5: Resolution tracking with outcome documentation)
   */
  async resolveDispute(
    disputeId: string,
    resolverId: string,
    input: {
      resolution: 'OWNER_WINS' | 'CONTRACTOR_WINS' | 'PARTIAL_OWNER' | 'PARTIAL_CONTRACTOR' | 'MEDIATED_SETTLEMENT' | 'WITHDRAWN'
      resolutionNotes: string
      mediatorId?: string
    }
  ) {
    const dispute = await prismaAny.dispute.findUnique({
      where: { id: disputeId },
      include: {
        escrow: true,
        milestone: true,
      },
    })

    if (!dispute) throw new NotFoundError('Dispute', disputeId)

    if (dispute.status === 'RESOLVED' || dispute.status === 'CANCELLED') {
      throw new ValidationError('Dispute is already resolved or cancelled')
    }

    // Update dispute
    const updated = await prismaAny.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: input.resolution,
        resolutionNotes: input.resolutionNotes,
        resolvedBy: resolverId,
        resolvedAt: new Date(),
        mediatorId: input.mediatorId || null,
      },
    })

    // Prompt 3.5: Automatic unfreeze upon resolution
    if (dispute.escrow && dispute.escrow.status === 'FROZEN') {
      await prismaAny.escrowAgreement.update({
        where: { id: dispute.escrow.id },
        data: {
          status: 'ACTIVE',
        },
      })
    }

    // If contractor wins, approve milestone if applicable
    if (
      (input.resolution === 'CONTRACTOR_WINS' || input.resolution === 'PARTIAL_CONTRACTOR') &&
      dispute.milestoneId
    ) {
      const milestone = await prismaAny.milestone.findUnique({
        where: { id: dispute.milestoneId },
      })

      if (milestone && milestone.status === 'SUBMITTED') {
        await prismaAny.milestone.update({
          where: { id: dispute.milestoneId },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: resolverId,
          },
        })
      }
    }

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Dispute',
        entityId: disputeId,
        action: 'DISPUTE_RESOLVED',
        details: {
          resolution: input.resolution,
          notes: input.resolutionNotes,
        },
        userId: resolverId,
        reason: `Dispute resolved: ${input.resolution}`,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Dispute',
        entityId: disputeId,
        type: 'DISPUTE_RESOLVED',
        payload: {
          resolution: input.resolution,
          escrowUnfrozen: true,
        },
        userId: resolverId,
      },
    })

    return updated
  },

  /**
   * Add evidence to dispute (Prompt 3.5)
   */
  async addEvidence(
    disputeId: string,
    userId: string,
    input: {
      evidenceId?: string
      url?: string
      fileName?: string
      description?: string
    }
  ) {
    const dispute = await prismaAny.dispute.findUnique({
      where: { id: disputeId },
      include: {
        project: { select: { ownerId: true } },
        contract: {
          include: {
            contractor: { select: { id: true } },
          },
        },
      },
    })

    if (!dispute) throw new NotFoundError('Dispute', disputeId)

    // Check authorization
    const isOwner = dispute.project.ownerId === userId
    const isContractor = dispute.contract?.contractorId === userId

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project parties can add evidence')
    }

    if (!input.evidenceId && !input.url) {
      throw new ValidationError('Either evidenceId or url must be provided')
    }

    const evidence = await prismaAny.disputeEvidence.create({
      data: {
        disputeId,
        evidenceId: input.evidenceId || null,
        url: input.url || null,
        fileName: input.fileName || null,
        description: input.description || null,
        uploadedBy: userId,
      },
    })

    return evidence
  },
}
