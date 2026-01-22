/**
 * Dispute Service
 * Handles dispute initiation, evidence submission, mediation, and resolution
 */

import { prisma, Decimal } from '@kealee/database'
import {
  DisputeType,
  DisputeStatus,
  DisputeResolutionType,
  EscrowHoldReason,
} from '@kealee/database'

export interface InitiateDisputeDTO {
  escrowId: string  // Changed from escrowAgreementId to match schema
  contractId: string
  projectId: string
  initiatedBy: string
  respondentId: string
  type: DisputeType
  title: string
  description: string
  disputedAmount: number
}

export interface SubmitEvidenceDTO {
  disputeId: string
  submittedBy: string
  evidenceType: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType?: string
  description?: string
}

export interface ResolveDisputeDTO {
  disputeId: string
  mediatorId: string
  resolutionType: DisputeResolutionType
  ownerAmount: number
  contractorAmount: number
  refundAmount: number
  reasoning: string
}

export interface SendMessageDTO {
  disputeId: string
  senderId: string
  message: string
  isInternal?: boolean
}

export class DisputeService {
  /**
   * Generate unique dispute number
   */
  private static async generateDisputeNumber(): Promise<string> {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const datePrefix = `${year}${month}${day}`

    // Count disputes created today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const count = await prisma.dispute.count({
      where: {
        createdAt: {
          gte: startOfDay,
        },
      },
    })

    const sequence = String(count + 1).padStart(4, '0')
    return `DISP-${datePrefix}-${sequence}`
  }

  /**
   * Initiate a dispute and automatically freeze escrow
   */
  static async initiateDispute(data: InitiateDisputeDTO) {
    const {
      escrowId,
      contractId,
      projectId,
      initiatedBy,
      respondentId,
      type,
      title,
      description,
      disputedAmount,
    } = data

    // Validate escrow agreement exists
    const escrowAgreement = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        contract: true,
      },
    })

    if (!escrowAgreement) {
      throw new Error('Escrow agreement not found')
    }

    // Validate user is party to the contract
    const contract = escrowAgreement.contract
    const isParty =
      contract.ownerId === initiatedBy || contract.contractorId === initiatedBy

    if (!isParty) {
      throw new Error('User is not a party to this contract')
    }

    // Check if there's sufficient available balance
    const availableBalance = escrowAgreement.availableBalance.toNumber()
    if (disputedAmount > availableBalance) {
      throw new Error(
        `Insufficient available balance. Available: $${availableBalance}, Requested: $${disputedAmount}`
      )
    }

    // Generate dispute number
    const disputeNumber = await this.generateDisputeNumber()

    // Calculate deadlines
    const evidenceDeadline = new Date()
    evidenceDeadline.setDate(evidenceDeadline.getDate() + 7) // 7 days

    const mediationDeadline = new Date()
    mediationDeadline.setDate(mediationDeadline.getDate() + 14) // 14 days

    // Create dispute and freeze escrow in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create dispute
      const dispute = await tx.dispute.create({
        data: {
          disputeNumber,
          escrowId,
          contractId,
          projectId,
          initiatedBy,
          respondentId,
          type,
          title,
          description,
          status: 'OPEN',
          disputedAmount: new Decimal(disputedAmount),
          frozenAmount: new Decimal(disputedAmount),
          evidenceDeadline,
          mediationDeadline,
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          respondent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          escrowAgreement: true,
        },
      })

      // Create escrow hold
      const hold = await tx.escrowHold.create({
        data: {
          escrowId: escrowId,
          amount: new Decimal(disputedAmount),
          reason: 'DISPUTE',
          status: 'ACTIVE',
          notes: `Dispute ${disputeNumber}: ${title}`,
          placedBy: initiatedBy,
        },
      })

      // Update escrow balances
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          heldBalance: {
            increment: disputedAmount,
          },
          availableBalance: {
            decrement: disputedAmount,
          },
          status: 'FROZEN',
        },
      })

      return { dispute, hold }
    })

    // TODO: Send notifications to all parties
    // TODO: Auto-assign mediator based on workload

    return result.dispute
  }

  /**
   * Submit evidence for a dispute
   */
  static async submitEvidence(data: SubmitEvidenceDTO) {
    const {
      disputeId,
      submittedBy,
      evidenceType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      description,
    } = data

    // Validate dispute exists and is in valid status
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    })

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    if (!['OPEN', 'UNDER_REVIEW', 'MEDIATION'].includes(dispute.status)) {
      throw new Error(
        `Cannot submit evidence for dispute with status: ${dispute.status}`
      )
    }

    // Check if evidence deadline has passed
    if (dispute.evidenceDeadline && new Date() > dispute.evidenceDeadline) {
      throw new Error('Evidence submission deadline has passed')
    }

    // Validate user is party to the dispute
    if (
      submittedBy !== dispute.initiatedBy &&
      submittedBy !== dispute.respondentId &&
      submittedBy !== dispute.mediatorId
    ) {
      throw new Error('User is not a party to this dispute')
    }

    // Create evidence record
    const evidence = await prisma.disputeEvidence.create({
      data: {
        disputeId,
        submittedBy,
        evidenceType: evidenceType as any,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        description,
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update dispute status to UNDER_REVIEW if still OPEN
    if (dispute.status === 'OPEN') {
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'UNDER_REVIEW',
        },
      })
    }

    // TODO: Notify other party of new evidence
    // TODO: Notify mediator if assigned

    return evidence
  }

  /**
   * Send a message in a dispute
   */
  static async sendMessage(data: SendMessageDTO) {
    const { disputeId, senderId, message, isInternal = false } = data

    // Validate dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    })

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    // Validate user is party to the dispute
    const isParty =
      senderId === dispute.initiatedBy ||
      senderId === dispute.respondentId ||
      senderId === dispute.mediatorId

    if (!isParty) {
      throw new Error('User is not a party to this dispute')
    }

    // Only mediators can send internal messages
    if (isInternal && senderId !== dispute.mediatorId) {
      throw new Error('Only mediators can send internal messages')
    }

    // Create message
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        message,
        isInternal,
        readBy: JSON.parse(JSON.stringify([senderId])), // Mark as read by sender
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Notify other parties of new message (unless internal)

    return disputeMessage
  }

  /**
   * Assign a mediator to a dispute
   */
  static async assignMediator(disputeId: string, mediatorId: string) {
    // Validate dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    })

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new Error(
        `Cannot assign mediator to dispute with status: ${dispute.status}`
      )
    }

    // Update dispute with mediator
    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        mediatorId,
        status: 'MEDIATION',
      },
      include: {
        mediator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send notification to mediator
    // TODO: Notify both parties that mediator has been assigned

    return updated
  }

  /**
   * Resolve a dispute
   */
  static async resolveDispute(data: ResolveDisputeDTO) {
    const {
      disputeId,
      mediatorId,
      resolutionType,
      ownerAmount,
      contractorAmount,
      refundAmount,
      reasoning,
    } = data

    // Validate dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        escrowAgreement: {
          include: {
            contract: true,
          },
        },
      },
    })

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    // Validate mediator is assigned to this dispute
    if (dispute.mediatorId !== mediatorId) {
      throw new Error('Mediator is not assigned to this dispute')
    }

    // Validate amounts
    const totalAmount = ownerAmount + contractorAmount + refundAmount
    if (Math.abs(totalAmount - dispute.disputedAmount.toNumber()) > 0.01) {
      throw new Error(
        `Resolution amounts ($${totalAmount}) must equal disputed amount ($${dispute.disputedAmount})`
      )
    }

    // Calculate appeal deadline (7 days from now)
    const appealDeadline = new Date()
    appealDeadline.setDate(appealDeadline.getDate() + 7)

    // Create resolution and update dispute in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create resolution record
      const resolution = await tx.disputeResolution.create({
        data: {
          disputeId,
          mediatorId,
          resolutionType,
          ownerAmount: new Decimal(ownerAmount),
          contractorAmount: new Decimal(contractorAmount),
          refundAmount: new Decimal(refundAmount),
          reasoning,
          appealDeadline,
        },
        include: {
          mediator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Update dispute status
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution: reasoning,
          resolvedAt: new Date(),
        },
      })

      // Release escrow hold
      const holds = await tx.escrowHold.findMany({
        where: {
          escrowId: dispute.escrowId,
          reason: 'DISPUTE',
          status: 'ACTIVE',
          notes: {
            contains: dispute.disputeNumber,
          },
        },
      })

      for (const hold of holds) {
        await tx.escrowHold.update({
          where: { id: hold.id },
          data: {
            status: 'RELEASED',
            releasedBy: mediatorId,
            releasedAt: new Date(),
          },
        })
      }

      // Update escrow balances
      await tx.escrowAgreement.update({
        where: { id: dispute.escrowId },
        data: {
          heldBalance: {
            decrement: dispute.frozenAmount.toNumber(),
          },
          availableBalance: {
            increment: dispute.frozenAmount.toNumber(),
          },
          status: 'ACTIVE', // Unfreeze escrow
        },
      })

      // TODO: Create escrow transactions for releases
      // TODO: Create payouts if amounts awarded

      return { resolution, dispute: updatedDispute }
    })

    // TODO: Notify all parties of resolution
    // TODO: Send appeal instructions

    return result
  }

  /**
   * File an appeal
   */
  static async fileAppeal(
    disputeId: string,
    appealedBy: string,
    appealReason: string
  ) {
    // Get dispute with resolution
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        resolutions: {
          orderBy: { decidedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!dispute) {
      throw new Error('Dispute not found')
    }

    if (dispute.status !== 'RESOLVED') {
      throw new Error('Can only appeal resolved disputes')
    }

    // Validate user is party to the dispute
    if (
      appealedBy !== dispute.initiatedBy &&
      appealedBy !== dispute.respondentId
    ) {
      throw new Error('Only parties to the dispute can file an appeal')
    }

    const resolution = dispute.resolutions[0]
    if (!resolution) {
      throw new Error('No resolution found for this dispute')
    }

    // Check if appeal deadline has passed
    if (new Date() > resolution.appealDeadline) {
      throw new Error('Appeal deadline has passed')
    }

    // Check if already appealed
    if (resolution.appealStatus !== 'NONE') {
      throw new Error('Appeal has already been filed')
    }

    // Update resolution with appeal
    const updated = await prisma.disputeResolution.update({
      where: { id: resolution.id },
      data: {
        appealStatus: 'PENDING',
        appealReason,
        appealedBy,
        appealedAt: new Date(),
      },
    })

    // TODO: Notify mediator and admins of appeal
    // TODO: Trigger admin review process

    return updated
  }

  /**
   * Get dispute details
   */
  static async getDispute(disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        mediator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evidence: {
          include: {
            submitter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { uploadedAt: 'desc' },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        resolutions: {
          include: {
            mediator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { decidedAt: 'desc' },
        },
        escrowAgreement: true,
        contract: true,
        project: true,
      },
    })

    return dispute
  }

  /**
   * List disputes with filters
   */
  static async listDisputes(filters?: {
    status?: DisputeStatus
    type?: DisputeType
    userId?: string
    mediatorId?: string
    projectId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.userId) {
      where.OR = [
        { initiatedBy: filters.userId },
        { respondentId: filters.userId },
      ]
    }

    if (filters?.mediatorId) {
      where.mediatorId = filters.mediatorId
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
            },
          },
          respondent: {
            select: {
              id: true,
              name: true,
            },
          },
          mediator: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispute.count({ where }),
    ])

    return {
      disputes,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Get disputes for mediator queue
   */
  static async getMediatorQueue(mediatorId: string) {
    const disputes = await prisma.dispute.findMany({
      where: {
        mediatorId,
        status: {
          in: ['UNDER_REVIEW', 'MEDIATION'],
        },
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        evidence: {
          select: {
            id: true,
            isReviewed: true,
          },
        },
        messages: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return disputes
  }

  /**
   * Get dispute statistics
   */
  static async getDisputeStats(filters?: {
    startDate?: Date
    endDate?: Date
    projectId?: string
  }) {
    const where: any = {}

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    if (filters?.projectId) {
      where.projectId = filters.projectId
    }

    const [total, byStatus, byType, avgResolutionTime] = await Promise.all([
      prisma.dispute.count({ where }),
      prisma.dispute.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.dispute.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      prisma.dispute.aggregate({
        where: {
          ...where,
          resolvedAt: { not: null },
        },
        _avg: {
          disputedAmount: true,
        },
      }),
    ])

    return {
      total,
      byStatus,
      byType,
      avgDisputedAmount: avgResolutionTime._avg.disputedAmount?.toNumber() || 0,
    }
  }
}

// Export singleton instance
export const disputeService = new DisputeService()
