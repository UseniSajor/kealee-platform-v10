import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
import { getStripe } from '../billing/stripe.client'
import { milestonePaymentService } from './milestone-payment.service'
// Prisma types available through prismaAny

const DEFAULT_HOLDBACK_PERCENTAGE = 10 // 10% holdback
const PLATFORM_FEE_PERCENTAGE = 0.03 // 3% platform fee

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

    // Use new milestone payment service for Stripe Connect
    try {
      const paymentResult = await milestonePaymentService.releaseMilestonePayment(
        milestoneId,
        userId,
        {
          skipHoldback: options?.skipHoldback,
          notes: options?.notes,
        }
      )

      // Update transaction with payment intent ID
      await prismaAny.escrowTransaction.update({
        where: { id: transaction.id },
        data: {
          stripePaymentId: paymentResult.paymentIntentId,
          status: 'PENDING', // Will be updated by webhook
        },
      })

      return {
        transaction,
        releaseAmount,
        holdbackAmount,
        balanceAfter,
        paymentIntentId: paymentResult.paymentIntentId,
        clientSecret: paymentResult.clientSecret,
      }
    } catch (error: any) {
      // Fallback to old method if new service fails
      console.warn('Milestone payment service failed, using fallback:', error)
      await this.processStripePayment(milestone, releaseAmount, transaction.id, userId)
      
      return {
        transaction,
        releaseAmount,
        holdbackAmount,
        balanceAfter,
      }
    }
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

    // Send notification records for payer (owner) and payee (contractor)
    const contractorId = milestone.contract.contractor?.id
    const ownerId = milestone.contract.owner?.id || milestone.contract.project?.ownerId
    if (contractorId) {
      await prismaAny.notification.create({
        data: {
          userId: contractorId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: 'Payment released for milestone: ' + milestone.name,
          data: { milestoneId, amount: releaseAmount, transactionId: transaction.id },
          channels: ['email', 'push'],
          status: 'PENDING',
        },
      }).catch((e: any) => { console.error('Failed to create contractor payment notification:', e.message) })
    }
    if (ownerId) {
      await prismaAny.notification.create({
        data: {
          userId: ownerId,
          type: 'PAYMENT_RELEASED',
          title: 'Payment Released',
          message: 'Payment released for milestone: ' + milestone.name,
          data: { milestoneId, amount: releaseAmount, transactionId: transaction.id },
          channels: ['email'],
          status: 'PENDING',
        },
      }).catch((e: any) => { console.error('Failed to create owner payment notification:', e.message) })
    }

    return {
      transaction,
      releaseAmount,
      holdbackAmount,
      balanceAfter,
    }
  },

  /**
   * Get payment history for a project (Prompt 3.4)
   * Enhanced with filtering, pagination, and detailed transaction info
   */
  /**
   * Create payment intent with flexible options
   * Supports creating payment intents with/without customer, with/without payment method
   */
  async createPaymentIntent(data: {
    amount: number
    currency: string
    description?: string
    customerId?: string
    paymentMethodId?: string
    savePaymentMethod?: boolean
    metadata?: Record<string, any>
    userId: string
    userEmail?: string
  }) {
    const stripe = getStripe()

    // Attach payment method to customer if provided
    if (data.paymentMethodId && data.customerId) {
      await stripe.paymentMethods.attach(data.paymentMethodId, {
        customer: data.customerId,
      })

      if (data.savePaymentMethod) {
        // Set as default payment method
        await stripe.customers.update(data.customerId, {
          invoice_settings: {
            default_payment_method: data.paymentMethodId,
          },
        })
      }
    }

    let paymentIntent: any

    if (data.paymentMethodId && data.customerId) {
      // Create payment intent with specific payment method
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        payment_method: data.paymentMethodId,
        off_session: false,
        confirm: true,
        description: data.description,
        metadata: {
          ...data.metadata,
          userId: data.userId,
          userEmail: data.userEmail || '',
        },
        return_url: `${process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/return`,
      })
    } else if (data.customerId) {
      // Create payment intent for customer (will use default payment method)
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        description: data.description,
        metadata: {
          ...data.metadata,
          userId: data.userId,
          userEmail: data.userEmail || '',
        },
      })
    } else {
      // Create payment intent without customer
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        description: data.description,
        metadata: {
          ...data.metadata,
          userId: data.userId,
          userEmail: data.userEmail || '',
        },
      })
    }

    // Save payment record in database
    const payment = await prismaAny.payment.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        status: paymentIntent.status.toUpperCase() as any,
        description: data.description,
        metadata: data.metadata || {},
        createdBy: data.userId,
        orgId: data.metadata?.orgId || null,
        projectId: data.metadata?.projectId || null,
        milestoneId: data.metadata?.milestoneId || null,
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
      },
    })

    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    }
  },

  /**
   * Get payment history for a user (across all projects/orgs)
   */
  async getUserPaymentHistory(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      status?: string
      startDate?: Date
      endDate?: Date
      startingAfter?: string
    }
  ) {
    const where: any = {
      createdBy: userId,
    }

    if (options?.status) {
      where.status = options.status.toUpperCase()
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options?.startDate) {
        where.createdAt.gte = options.startDate
      }
      if (options?.endDate) {
        where.createdAt.lte = options.endDate
      }
    }

    if (options?.startingAfter) {
      const afterPayment = await prismaAny.payment.findUnique({
        where: { id: options.startingAfter },
        select: { createdAt: true },
      })
      if (afterPayment) {
        where.createdAt = {
          ...where.createdAt,
          lt: afterPayment.createdAt,
        }
      }
    }

    const payments = await prismaAny.payment.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        org: {
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
    })

    // Get Stripe payment intent details
    const stripe = getStripe()
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripePaymentIntentId,
            { expand: ['customer', 'payment_method'] }
          )

          return {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            metadata: payment.metadata,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt,
            org: payment.org,
            project: payment.project,
            stripe_details: {
              status: paymentIntent.status,
              amount_received: paymentIntent.amount_received ? paymentIntent.amount_received / 100 : null,
              customer: paymentIntent.customer,
              payment_method: paymentIntent.payment_method
                ? {
                    type: (paymentIntent.payment_method as any).type,
                    card: (paymentIntent.payment_method as any).card
                      ? {
                          brand: (paymentIntent.payment_method as any).card?.brand,
                          last4: (paymentIntent.payment_method as any).card?.last4,
                          exp_month: (paymentIntent.payment_method as any).card?.exp_month,
                          exp_year: (paymentIntent.payment_method as any).card?.exp_year,
                        }
                      : null,
                  }
                : null,
            },
          }
        } catch (error) {
          // Return without Stripe details if retrieval fails
          return {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            metadata: payment.metadata,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt,
            org: payment.org,
            project: payment.project,
            stripe_details: null,
          }
        }
      })
    )

    return {
      payments: paymentsWithDetails,
      hasMore: payments.length === (options?.limit || 50),
    }
  },

  async getPaymentHistory(
    projectId: string,
    userId: string,
    filters?: {
      limit?: number
      offset?: number
      status?: string
      startDate?: Date
      endDate?: Date
    }
  ) {
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
      return { transactions: [], escrow: null, total: 0 }
    }

    // Build where clause
    const where: any = { escrowId: escrow.id }
    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // Get total count
    const total = await prismaAny.escrowTransaction.count({ where })

    // Get transactions with pagination
    const transactions = await prismaAny.escrowTransaction.findMany({
      where,
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
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    })

    return {
      transactions,
      escrow,
    }
  },

  /**
   * Process Stripe payment with 3% platform fee
   */
  async processStripePayment(
    milestone: any,
    releaseAmount: number,
    transactionId: string,
    userId: string
  ) {
    try {
      const stripe = getStripe()

      // Calculate 3% platform fee
      const platformFee = Math.round(releaseAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100
      const contractorPayout = Math.round((releaseAmount - platformFee) * 100) / 100

      // Get contractor's Stripe account ID
      const contractor = await prismaAny.user.findUnique({
        where: { id: milestone.contract.contractorId },
        select: { id: true, stripeAccountId: true },
      })

      if (!contractor?.stripeAccountId) {
        throw new ValidationError('Contractor does not have a Stripe account connected')
      }

      // Create Stripe transfer to contractor (97% of milestone amount)
      const transfer = await stripe.transfers.create({
        amount: Math.round(contractorPayout * 100), // Convert to cents
        currency: 'usd',
        destination: contractor.stripeAccountId,
        metadata: {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          transactionId,
          projectId: milestone.contract.projectId,
        },
      })

      // Record platform fee payment
      await prismaAny.payment.create({
        data: {
          orgId: milestone.contract.project.orgId || null,
          subscriptionId: null,
          stripePaymentIntentId: transfer.id, // Use transfer ID as payment intent ID
          stripeInvoiceId: null,
          amount: platformFee,
          currency: 'usd',
          status: 'COMPLETED',
          paidAt: new Date(),
          metadata: {
            type: 'platform_fee',
            milestoneId: milestone.id,
            transactionId,
            contractorPayout,
            totalAmount: releaseAmount,
            stripeTransferId: transfer.id,
          },
        },
      })

      // Update transaction with Stripe payment ID
      await prismaAny.escrowTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          stripePaymentId: transfer.id,
          metadata: {
            ...((await prismaAny.escrowTransaction.findUnique({ where: { id: transactionId } }))?.metadata as any || {}),
            platformFee,
            contractorPayout,
            stripeTransferId: transfer.id,
          },
        },
      })

      // Create audit log for platform fee
      await prismaAny.auditLog.create({
        data: {
          entityType: 'Payment',
          entityId: transactionId,
          action: 'PLATFORM_FEE_COLLECTED',
          details: {
            platformFee,
            contractorPayout,
            totalAmount: releaseAmount,
            stripeTransferId: transfer.id,
          },
          userId: userId,
          reason: `Platform fee collected for milestone: ${milestone.name}`,
        },
      })
    } catch (error: any) {
      // Log error but don't fail the payment release
      console.error('Stripe payment processing failed:', error)
      
      // Update transaction status to indicate payment processing failed
      await prismaAny.escrowTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          metadata: {
            error: error.message,
            retryable: true,
          },
        },
      })

      throw new ValidationError(`Payment processing failed: ${error.message}`)
    }
  },

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(data: {
    customerId: string
    paymentMethodId: string
    setAsDefault?: boolean
    userId: string
  }) {
    const stripe = getStripe()

    // Attach payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: data.customerId,
    })

    // Set as default payment method if requested
    if (data.setAsDefault) {
      await stripe.customers.update(data.customerId, {
        invoice_settings: {
          default_payment_method: data.paymentMethodId,
        },
      })
    }

    // Retrieve the payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(data.paymentMethodId, {
      expand: ['customer'],
    })

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          }
        : null,
      isDefault: data.setAsDefault || false,
      customerId: data.customerId,
    }
  },

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string, userId: string) {
    const stripe = getStripe()

    // Verify user has access to this customer
    // (You may want to add additional authorization checks here)

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(customerId)
    const customerAny = customer as any
    const defaultPaymentMethodId =
      typeof customerAny.invoice_settings?.default_payment_method === 'string'
        ? customerAny.invoice_settings.default_payment_method
        : customerAny.invoice_settings?.default_payment_method?.id

    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : null,
      isDefault: pm.id === defaultPaymentMethodId,
      created: new Date(pm.created * 1000),
    }))
  },

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string, userId: string) {
    const stripe = getStripe()

    // Retrieve payment method to get customer ID
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    const customerId =
      typeof paymentMethod.customer === 'string'
        ? paymentMethod.customer
        : paymentMethod.customer?.id

    if (!customerId) {
      throw new ValidationError('Payment method is not attached to a customer')
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId)

    return { success: true, paymentMethodId, customerId }
  },

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string, userId: string) {
    const stripe = getStripe()

    // Verify payment method is attached to customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    const pmCustomerId =
      typeof paymentMethod.customer === 'string'
        ? paymentMethod.customer
        : paymentMethod.customer?.id

    if (pmCustomerId !== customerId) {
      throw new ValidationError('Payment method is not attached to this customer')
    }

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return { success: true, customerId, paymentMethodId }
  },

  /**
   * Generate invoice for a payment
   */
  async generateInvoice(data: {
    projectId: string
    amount: number
    description?: string
    dueDate?: string
    metadata?: Record<string, any>
  }) {
    // Create invoice record in database
    const invoice = await prismaAny.invoice.create({
      data: {
        projectId: data.projectId,
        amount: data.amount,
        description: data.description || 'Payment invoice',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'PENDING',
        metadata: data.metadata || {},
      },
    })

    return invoice
  },
}
