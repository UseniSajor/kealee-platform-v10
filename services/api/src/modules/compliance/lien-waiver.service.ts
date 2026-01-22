/**
 * Lien Waiver Service
 * Handles automated lien waiver generation, state-specific templates, and digital signing
 */

import { prisma, Decimal } from '@kealee/database'
import {
  LienWaiverType,
  LienWaiverScope,
  LienWaiverStatus,
  LienWaiverSignerRole,
} from '@kealee/database'

export interface GenerateWaiverDTO {
  escrowTransactionId: string
  contractId: string
  projectId: string
  milestoneId?: string
  waiverType: LienWaiverType
  waiverScope: LienWaiverScope
  throughDate: Date
  waiverAmount: number
  cumulativeAmount: number
  createdBy: string
}

export interface SignWaiverDTO {
  lienWaiverId: string
  signerId: string
  signerRole: LienWaiverSignerRole
  signerName: string
  signerTitle?: string
  signerCompany?: string
  signerEmail: string
  signatureImageUrl?: string
  ipAddress?: string
  userAgent?: string
  electronicConsentGiven: boolean
}

export interface NotarizeWaiverDTO {
  lienWaiverId: string
  signatureId: string
  notaryName: string
  notaryCommission: string
  notaryExpiration: Date
  notarySealUrl?: string
}

export class LienWaiverService {
  /**
   * State-specific template configurations
   */
  private static readonly STATE_REQUIREMENTS = {
    CA: {
      // California - Civil Code 8132
      requiresNotarization: false,
      templateId: 'ca-statutory',
      specialClauses: [
        'This document waives and releases lien rights for labor and/or materials provided through the date specified.',
        'This document is not valid unless the claimant has been paid the claimed amount.',
      ],
    },
    TX: {
      // Texas - Property Code 53.281-53.284
      requiresNotarization: false,
      templateId: 'tx-statutory',
      specialClauses: [
        'This is a statutory lien waiver under Texas Property Code.',
      ],
    },
    FL: {
      // Florida - Requires notarization for final waivers
      requiresNotarization: true, // For FINAL waivers only
      templateId: 'fl-statutory',
      specialClauses: [
        'Final waivers must be notarized in the State of Florida.',
      ],
    },
    NY: {
      // New York - Custom requirements
      requiresNotarization: false,
      templateId: 'ny-custom',
      specialClauses: [
        'This waiver is subject to New York Lien Law Article 3.',
      ],
    },
    // Default for other states
    DEFAULT: {
      requiresNotarization: false,
      templateId: 'aia-g706',
      specialClauses: [],
    },
  }

  /**
   * Determine waiver type based on payment status
   */
  static determineWaiverType(
    paymentCleared: boolean
  ): LienWaiverType {
    return paymentCleared ? 'UNCONDITIONAL' : 'CONDITIONAL'
  }

  /**
   * Determine waiver scope based on payment stage
   */
  static async determineWaiverScope(
    contractId: string,
    milestoneId?: string
  ): Promise<LienWaiverScope> {
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        milestones: true,
      },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // If no milestone specified, this is for final payment
    if (!milestoneId) {
      return 'FINAL'
    }

    // Check if this is the last milestone
    const milestone = contract.milestones.find((m) => m.id === milestoneId)
    if (!milestone) {
      throw new Error('Milestone not found')
    }

    const incompleteMilestones = contract.milestones.filter(
      (m) => m.status !== 'PAID' && m.id !== milestoneId
    )

    return incompleteMilestones.length === 0 ? 'FINAL' : 'PARTIAL'
  }

  /**
   * Generate a lien waiver automatically
   */
  static async generateWaiver(data: GenerateWaiverDTO) {
    const {
      escrowTransactionId,
      contractId,
      projectId,
      milestoneId,
      waiverType,
      waiverScope,
      throughDate,
      waiverAmount,
      cumulativeAmount,
      createdBy,
    } = data

    // Fetch related entities
    const [contract, project, escrowTransaction] = await Promise.all([
      prisma.contractAgreement.findUnique({
        where: { id: contractId },
        include: {
          owner: true,
          contractor: true,
        },
      }),
      prisma.project.findUnique({
        where: { id: projectId },
      }),
      prisma.escrowTransaction.findUnique({
        where: { id: escrowTransactionId },
      }),
    ])

    if (!contract || !project || !escrowTransaction) {
      throw new Error('Required entities not found')
    }

    // Extract state from project (you may need to adjust based on your schema)
    const state = 'CA' // TODO: Extract from project.state or similar field

    // Get state-specific requirements
    const stateConfig =
      LienWaiverService.STATE_REQUIREMENTS[state as keyof typeof LienWaiverService.STATE_REQUIREMENTS] ||
      LienWaiverService.STATE_REQUIREMENTS.DEFAULT

    // Determine if notarization is required
    const requiresNotarization =
      stateConfig.requiresNotarization && waiverScope === 'FINAL'

    // Calculate expiration for conditional waivers (30 days)
    const expiresAt =
      waiverType === 'CONDITIONAL'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined

    // Create lien waiver
    const lienWaiver = await prisma.lienWaiver.create({
      data: {
        escrowTransactionId,
        contractId,
        projectId,
        milestoneId,
        waiverType,
        waiverScope,
        status: 'GENERATED',
        projectName: project.name || 'Unnamed Project',
        projectAddress: 'Project Address', // TODO: Get from project
        state,
        claimantName: contract.contractor.name || '',
        claimantAddress: 'Contractor Address', // TODO: Get from user profile
        claimantEmail: contract.contractor.email || '',
        ownerName: contract.owner.name || '',
        ownerAddress: 'Owner Address', // TODO: Get from user profile
        throughDate,
        waiverAmount: new Decimal(waiverAmount),
        cumulativeAmount: new Decimal(cumulativeAmount),
        templateUsed: stateConfig.templateId,
        expiresAt,
        createdBy,
        metadata: {
          stateRequirements: stateConfig,
          requiresNotarization,
          specialClauses: stateConfig.specialClauses,
        },
      },
      include: {
        contract: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // TODO: Generate PDF document
    // await this.generatePdfDocument(lienWaiver)

    // TODO: Send notification to contractor
    // await this.sendWaiverNotification(lienWaiver)

    return lienWaiver
  }

  /**
   * Auto-generate waiver on payment release
   */
  static async autoGenerateOnPaymentRelease(
    escrowTransactionId: string,
    userId: string
  ) {
    // Fetch escrow transaction with related data
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: escrowTransactionId },
      include: {
        escrow: {
          include: {
            contract: {
              include: {
                milestones: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      throw new Error('Escrow transaction not found')
    }

    if (transaction.type !== 'RELEASE') {
      throw new Error('Can only generate waivers for RELEASE transactions')
    }

    const contract = transaction.escrow.contract
    const projectId = transaction.escrow.projectId

    // Determine waiver type based on transaction status
    const waiverType = this.determineWaiverType(
      transaction.status === 'COMPLETED'
    )

    // Find milestone from transaction reference
    const milestoneId = transaction.reference?.startsWith('milestone:')
      ? transaction.reference.split(':')[1]
      : undefined

    // Determine waiver scope
    const waiverScope = await this.determineWaiverScope(
      contract.id,
      milestoneId
    )

    // Calculate cumulative amount
    const previousWaivers = await prisma.lienWaiver.findMany({
      where: {
        contractId: contract.id,
        status: 'SIGNED',
      },
    })

    const cumulativeAmount = previousWaivers.reduce(
      (sum, w) => sum + w.waiverAmount.toNumber(),
      transaction.amount.toNumber()
    )

    // Generate waiver
    return await this.generateWaiver({
      escrowTransactionId,
      contractId: contract.id,
      projectId,
      milestoneId,
      waiverType,
      waiverScope,
      throughDate: transaction.processedDate || new Date(),
      waiverAmount: transaction.amount.toNumber(),
      cumulativeAmount,
      createdBy: userId,
    })
  }

  /**
   * Send waiver for digital signature
   */
  static async sendForSignature(
    lienWaiverId: string,
    senderId: string
  ) {
    const waiver = await prisma.lienWaiver.findUnique({
      where: { id: lienWaiverId },
      include: {
        contract: {
          include: {
            contractor: true,
          },
        },
      },
    })

    if (!waiver) {
      throw new Error('Lien waiver not found')
    }

    if (waiver.status !== 'GENERATED') {
      throw new Error(
        `Cannot send waiver with status: ${waiver.status}`
      )
    }

    // Update status to SENT
    const updated = await prisma.lienWaiver.update({
      where: { id: lienWaiverId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    // TODO: Integrate with DocuSign/HelloSign
    // await this.sendToDocuSign(waiver)

    // TODO: Send email notification
    // await this.sendSignatureRequestEmail(waiver)

    return updated
  }

  /**
   * Record a manual signature
   */
  static async recordSignature(data: SignWaiverDTO) {
    const {
      lienWaiverId,
      signerId,
      signerRole,
      signerName,
      signerTitle,
      signerCompany,
      signerEmail,
      signatureImageUrl,
      ipAddress,
      userAgent,
      electronicConsentGiven,
    } = data

    // Validate waiver exists and is in correct status
    const waiver = await prisma.lienWaiver.findUnique({
      where: { id: lienWaiverId },
    })

    if (!waiver) {
      throw new Error('Lien waiver not found')
    }

    if (waiver.status !== 'SENT' && waiver.status !== 'GENERATED') {
      throw new Error(
        `Cannot sign waiver with status: ${waiver.status}`
      )
    }

    // Check if conditional waiver has expired
    if (waiver.expiresAt && new Date() > waiver.expiresAt) {
      await prisma.lienWaiver.update({
        where: { id: lienWaiverId },
        data: { status: 'EXPIRED' },
      })
      throw new Error('This conditional waiver has expired')
    }

    // Create signature record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create signature
      const signature = await tx.lienWaiverSignature.create({
        data: {
          lienWaiverId,
          signerId,
          signerRole,
          signerName,
          signerTitle,
          signerCompany,
          signerEmail,
          signatureImageUrl,
          ipAddress,
          userAgent,
          electronicConsentGiven,
          consentTimestamp: electronicConsentGiven
            ? new Date()
            : undefined,
        },
      })

      // Update waiver status to SIGNED
      const updatedWaiver = await tx.lienWaiver.update({
        where: { id: lienWaiverId },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
        },
        include: {
          signatures: true,
          contract: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              contractor: {
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

      return { signature, waiver: updatedWaiver }
    })

    // TODO: Generate unconditional waiver if payment cleared
    // if (waiver.waiverType === 'CONDITIONAL') {
    //   await this.checkAndGenerateUnconditional(lienWaiverId)
    // }

    // TODO: Notify all parties
    // await this.sendSignatureCompletedNotification(result.waiver)

    return result
  }

  /**
   * Notarize a waiver (for states requiring it)
   */
  static async notarizeWaiver(data: NotarizeWaiverDTO) {
    const {
      lienWaiverId,
      signatureId,
      notaryName,
      notaryCommission,
      notaryExpiration,
      notarySealUrl,
    } = data

    // Validate waiver
    const waiver = await prisma.lienWaiver.findUnique({
      where: { id: lienWaiverId },
      include: {
        signatures: true,
      },
    })

    if (!waiver) {
      throw new Error('Lien waiver not found')
    }

    // Check if state requires notarization
    const stateConfig =
      LienWaiverService.STATE_REQUIREMENTS[waiver.state as keyof typeof LienWaiverService.STATE_REQUIREMENTS] ||
      LienWaiverService.STATE_REQUIREMENTS.DEFAULT

    if (
      !stateConfig.requiresNotarization &&
      waiver.waiverScope !== 'FINAL'
    ) {
      throw new Error(
        `State ${waiver.state} does not require notarization for ${waiver.waiverScope} waivers`
      )
    }

    // Update signature with notary info
    const updatedSignature = await prisma.lienWaiverSignature.update({
      where: { id: signatureId },
      data: {
        isNotarized: true,
        notaryName,
        notaryCommission,
        notaryExpiration,
        notarySeal: notarySealUrl,
      },
    })

    // Update waiver to RECORDED status
    const updatedWaiver = await prisma.lienWaiver.update({
      where: { id: lienWaiverId },
      data: {
        status: 'RECORDED',
        recordedAt: new Date(),
      },
    })

    return { signature: updatedSignature, waiver: updatedWaiver }
  }

  /**
   * Get waiver details
   */
  static async getWaiver(lienWaiverId: string) {
    const waiver = await prisma.lienWaiver.findUnique({
      where: { id: lienWaiverId },
      include: {
        contract: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        escrowTransaction: true,
        milestone: true,
        signatures: {
          include: {
            signer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return waiver
  }

  /**
   * List waivers with filters
   */
  static async listWaivers(filters?: {
    contractId?: string
    projectId?: string
    status?: LienWaiverStatus
    waiverType?: LienWaiverType
    waiverScope?: LienWaiverScope
    state?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.contractId) where.contractId = filters.contractId
    if (filters?.projectId) where.projectId = filters.projectId
    if (filters?.status) where.status = filters.status
    if (filters?.waiverType) where.waiverType = filters.waiverType
    if (filters?.waiverScope) where.waiverScope = filters.waiverScope
    if (filters?.state) where.state = filters.state

    const [waivers, total] = await Promise.all([
      prisma.lienWaiver.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              status: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          signatures: {
            select: {
              id: true,
              signerName: true,
              signedAt: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { generatedAt: 'desc' },
      }),
      prisma.lienWaiver.count({ where }),
    ])

    return {
      waivers,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Get waivers for a payment/escrow transaction
   */
  static async getWaiversForPayment(escrowTransactionId: string) {
    const waivers = await prisma.lienWaiver.findMany({
      where: { escrowTransactionId },
      include: {
        signatures: {
          include: {
            signer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    })

    return waivers
  }

  /**
   * Get all waivers for a contract
   */
  static async getWaiversForContract(contractId: string) {
    const waivers = await prisma.lienWaiver.findMany({
      where: { contractId },
      include: {
        milestone: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signerName: true,
            signerRole: true,
            signedAt: true,
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    })

    return waivers
  }

  /**
   * Verify waiver authenticity (public endpoint)
   */
  static async verifyWaiver(lienWaiverId: string) {
    const waiver = await prisma.lienWaiver.findUnique({
      where: { id: lienWaiverId },
      select: {
        id: true,
        status: true,
        waiverType: true,
        waiverScope: true,
        projectName: true,
        claimantName: true,
        ownerName: true,
        waiverAmount: true,
        throughDate: true,
        generatedAt: true,
        signedAt: true,
        signatures: {
          select: {
            signerName: true,
            signerRole: true,
            signedAt: true,
            isNotarized: true,
          },
        },
      },
    })

    if (!waiver) {
      return {
        valid: false,
        message: 'Lien waiver not found',
      }
    }

    return {
      valid: true,
      waiver,
      message: 'Waiver verified successfully',
    }
  }

  /**
   * Check compliance for contract
   */
  static async checkCompliance(contractId: string) {
    const [contract, milestones, waivers] = await Promise.all([
      prisma.contractAgreement.findUnique({
        where: { id: contractId },
      }),
      prisma.milestone.findMany({
        where: { contractId },
      }),
      prisma.lienWaiver.findMany({
        where: { contractId },
      }),
    ])

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Check for paid milestones without signed waivers
    const paidMilestones = milestones.filter((m) => m.status === 'PAID')
    const signedWaivers = waivers.filter((w) => w.status === 'SIGNED')

    const missingWaivers = paidMilestones.filter((milestone) => {
      return !signedWaivers.some((w) => w.milestoneId === milestone.id)
    })

    // Check for expired conditional waivers
    const expiredWaivers = waivers.filter(
      (w) =>
        w.waiverType === 'CONDITIONAL' &&
        w.expiresAt &&
        new Date() > w.expiresAt &&
        w.status !== 'EXPIRED'
    )

    // Check if final waiver exists for completed contract
    const hasFinalWaiver = waivers.some(
      (w) => w.waiverScope === 'FINAL' && w.status === 'SIGNED'
    )

    return {
      contractId,
      isCompliant:
        missingWaivers.length === 0 &&
        expiredWaivers.length === 0 &&
        (contract.status !== 'COMPLETED' || hasFinalWaiver),
      missingWaivers,
      expiredWaivers,
      hasFinalWaiver,
      signedWaiversCount: signedWaivers.length,
      totalWaiversCount: waivers.length,
    }
  }

  /**
   * Get waiver statistics
   */
  static async getWaiverStats(filters?: {
    startDate?: Date
    endDate?: Date
    projectId?: string
    state?: string
  }) {
    const where: any = {}

    if (filters?.startDate || filters?.endDate) {
      where.generatedAt = {}
      if (filters.startDate) where.generatedAt.gte = filters.startDate
      if (filters.endDate) where.generatedAt.lte = filters.endDate
    }

    if (filters?.projectId) where.projectId = filters.projectId
    if (filters?.state) where.state = filters.state

    const [total, byStatus, byType, byScope, byState] = await Promise.all([
      prisma.lienWaiver.count({ where }),
      prisma.lienWaiver.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.lienWaiver.groupBy({
        by: ['waiverType'],
        where,
        _count: true,
      }),
      prisma.lienWaiver.groupBy({
        by: ['waiverScope'],
        where,
        _count: true,
      }),
      prisma.lienWaiver.groupBy({
        by: ['state'],
        where,
        _count: true,
      }),
    ])

    return {
      total,
      byStatus,
      byType,
      byScope,
      byState,
    }
  }
}

