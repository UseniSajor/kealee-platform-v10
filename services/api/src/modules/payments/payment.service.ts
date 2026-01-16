import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
// Prisma types available through prismaAny

const DEFAULT_HOLDBACK_PERCENTAGE = 10 // 10% holdback

export const paymentService = {
  /**
   * Get escrow agreement for a project (Prompt 3.4)
   */
  async getEscrowAgreement(projectId: string, userId: string) {
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

    // Only owner or contractor can view escrow
    const isOwner = project.ownerId === userId
    const isContractor = (project.contracts as any[]).some((c: any) => c.contractorId === userId)
    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project owner or contractor can view escrow')
    }

    // Get or create escrow agreement
    let escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!escrow) {
      // Create escrow agreement if it doesn't exist
      const activeContract = (project.contracts as any[]).find((c: any) => c.status === 'ACTIVE')
      if (!activeContract) {
        throw new ValidationError('No active contract found for this project')
      }

      escrow = await prismaAny.escrowAgreement.create({
        data: {
          projectId,
          contractId: activeContract.id,
          currentBalance: 0,
          status: 'ACTIVE',
        },
        include: {
          transactions: [],
        },
      })
    }

    return escrow
  },

  /**
   * Calculate payment amount with holdback (Prompt 3.4)
   */
  calculatePaymentAmount(
    milestoneAmount: number,
    holdbackPercentage: number = DEFAULT_HOLDBACK_PERCENTAGE
  ): {
    releaseAmount: number
    holdbackAmount: number
    totalAmount: number
  } {
    const totalAmount = milestoneAmount
    const holdbackAmount = (totalAmount * holdbackPercentage) / 100
    const releaseAmount = totalAmount - holdbackAmount

    return {
      releaseAmount: Math.round(releaseAmount * 100) / 100,
      holdbackAmount: Math.round(holdbackAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    }
  },

  /**
   * Check if milestone can be paid (Prompt 3.4)
   */
  async canReleasePayment(milestoneId: string, userId: string): Promise<{
    canRelease: boolean
    reasons: string[]
  }> {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true, status: true } },
            contractor: { select: { id: true } },
          },
        },
        evidence: true,
      },
    })

    if (!milestone) {
      return { canRelease: false, reasons: ['Milestone not found'] }
    }

    if (milestone.contract.project.ownerId !== userId) {
      return { canRelease: false, reasons: ['Only project owner can release payment'] }
    }

    const reasons: string[] = []

    // Check milestone status
    if (milestone.status !== 'APPROVED') {
      reasons.push(`Milestone must be APPROVED (current: ${milestone.status})`)
    }

    // Check if already paid
    if (milestone.status === 'PAID') {
      reasons.push('Milestone has already been paid')
    }

    // Check for evidence
    if (!milestone.evidence || milestone.evidence.length === 0) {
      reasons.push('Milestone must have evidence before payment')
    }

    // Check escrow balance
    const escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId: milestone.contract.projectId },
    })

    if (!escrow) {
      reasons.push('Escrow agreement not found')
    } else if (escrow.status === 'FROZEN') {
      // Check if there's an active dispute
      const activeDispute = await prismaAny.dispute.findFirst({
        where: {
          projectId: milestone.contract.projectId,
          status: {
            in: ['FILED', 'FREEZE_APPLIED', 'UNDER_INVESTIGATION', 'PENDING_MEDIATION', 'PENDING_RESOLUTION'],
          },
        },
      })
      if (activeDispute) {
        reasons.push(`Escrow is frozen due to active dispute: ${activeDispute.reason}`)
      } else {
        reasons.push('Escrow is frozen (dispute in progress)')
      }
    } else if (escrow.currentBalance < milestone.amount) {
      reasons.push(
        `Insufficient escrow balance (${escrow.currentBalance} < ${milestone.amount})`
      )
    }

    return {
      canRelease: reasons.length === 0,
      reasons,
    }
  },

  /**
   * Release payment for approved milestone (Prompt 3.4)
   */
  async releasePayment(
    milestoneId: string,
    userId: string,
    options?: {
      skipHoldback?: boolean // For final payment
      notes?: string
    }
  ) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true, status: true } },
            contractor: { select: { id: true, email: true, name: true } },
            owner: { select: { id: true, email: true, name: true } },
          },
        },
        evidence: true,
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can release payment')
    }

    // Check if can release
    const { canRelease, reasons } = await this.canReleasePayment(milestoneId, userId)
    if (!canRelease) {
      throw new ValidationError(`Cannot release payment: ${reasons.join(', ')}`)
    }

    // Get escrow
    const escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId: milestone.contract.projectId },
    })

    if (!escrow) {
      throw new NotFoundError('EscrowAgreement', milestone.contract.projectId)
    }

    // Calculate payment amounts
    const holdbackPercentage = options?.skipHoldback ? 0 : DEFAULT_HOLDBACK_PERCENTAGE
    const { releaseAmount, holdbackAmount } = this.calculatePaymentAmount(
      Number(milestone.amount),
      holdbackPercentage
    )

    // Check balance
    if (escrow.currentBalance < releaseAmount) {
      throw new ValidationError(
        `Insufficient escrow balance: ${escrow.currentBalance} < ${releaseAmount}`
      )
    }

    // Create escrow transaction
    const balanceBefore = escrow.currentBalance
    const balanceAfter = balanceBefore - releaseAmount

    const transaction = await prismaAny.escrowTransaction.create({
      data: {
        escrowId: escrow.id,
        milestoneId: milestoneId,
        type: options?.skipHoldback ? 'RELEASE_FINAL' : 'RELEASE',
        amount: releaseAmount,
        balanceBefore,
        balanceAfter,
        status: 'PENDING', // Will be updated after Stripe transfer
        metadata: {
          milestoneId,
          milestoneName: milestone.name,
          holdbackAmount,
          holdbackPercentage,
          notes: options?.notes || null,
        },
      },
    })

    // Update escrow balance
    await prismaAny.escrowAgreement.update({
      where: { id: escrow.id },
      data: {
        currentBalance: balanceAfter,
      },
    })

    // Update milestone status
    await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'PAYMENT_RELEASED',
        details: {
          amount: releaseAmount,
          holdbackAmount,
          transactionId: transaction.id,
        },
        userId: userId,
        reason: `Payment released for milestone: ${milestone.name}`,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        type: 'MILESTONE_PAID',
        payload: {
          amount: releaseAmount,
          holdbackAmount,
          transactionId: transaction.id,
        },
        userId: userId,
      },
    })

    // TODO: Trigger Stripe transfer to contractor
    // In production, this would call m-finance-trust service or Stripe API
    // For now, we'll simulate it by updating transaction status
    // In real implementation:
    // const stripeTransfer = await stripe.transfers.create({
    //   amount: Math.round(releaseAmount * 100), // cents
    //   currency: 'usd',
    //   destination: contractor.stripeAccountId,
    // })

    // Simulate successful payment
    await prismaAny.escrowTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        stripePaymentId: `sim_${Date.now()}`, // Simulated Stripe payment ID
      },
    })

    // TODO: Send email notifications
    // await emailService.sendPaymentNotification({
    //   to: milestone.contract.contractor.email,
    //   milestoneName: milestone.name,
    //   amount: releaseAmount,
    // })

    return {
      transaction,
      releaseAmount,
      holdbackAmount,
      balanceAfter,
    }
  },

  /**
   * Get payment history for a project (Prompt 3.4)
   */
  async getPaymentHistory(projectId: string, userId: string) {
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
    const isContractor = (project.contracts as any[]).some((c: any) => c.contractorId === userId)
    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Only project owner or contractor can view payment history')
    }

    const escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId },
    })

    if (!escrow) {
      return { transactions: [], escrow: null }
    }

    const transactions = await prismaAny.escrowTransaction.findMany({
      where: { escrowId: escrow.id },
      include: {
        milestone: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      transactions,
      escrow,
    }
  },
}
