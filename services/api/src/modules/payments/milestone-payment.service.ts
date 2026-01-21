/**
 * Milestone Payment Service
 * Handles milestone payment processing with Stripe Connect and 3% platform fee
 */

import Stripe from 'stripe'
import { getStripe } from '../billing/stripe.client'
import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

// Helper to create audit log
async function createAuditLog(data: {
  entityType: string
  entityId: string
  action: string
  details: any
  userId: string
  reason: string
}) {
  return auditService.recordAudit({
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.userId,
    reason: data.reason,
    after: data.details,
  })
}

const PLATFORM_FEE_PERCENTAGE = 0.03 // 3%

class MilestonePaymentService {
  /**
   * Release payment for approved milestone
   * Uses Stripe Connect with application fee
   */
  async releaseMilestonePayment(
    milestoneId: string,
    userId: string,
    options?: {
      skipHoldback?: boolean
      notes?: string
    }
  ) {
    // Get milestone with full details
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                ownerId: true,
                orgId: true,
                name: true,
              },
            },
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
                stripeCustomerId: true,
              },
            },
            contractor: {
              select: {
                id: true,
                email: true,
                name: true,
                stripeAccountId: true,
              },
            },
          },
        },
        evidence: true,
      },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId)
    }

    // Verify user is project owner
    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can release milestone payments')
    }

    // Verify milestone is approved
    if (milestone.status !== 'APPROVED') {
      throw new ValidationError(`Milestone must be APPROVED (current: ${milestone.status})`)
    }

    // Verify milestone has evidence
    if (!milestone.evidence || milestone.evidence.length === 0) {
      throw new ValidationError('Milestone must have evidence before payment can be released')
    }

    // Verify contractor has Stripe Connect account
    if (!milestone.contract.contractor.stripeAccountId) {
      throw new ValidationError('Contractor must have a Stripe Connect account to receive payments')
    }

    const stripe = getStripe()

    // Verify contractor account is ready
    const contractorAccount = await stripe.accounts.retrieve(
      milestone.contract.contractor.stripeAccountId
    )

    if (!contractorAccount.charges_enabled || !contractorAccount.payouts_enabled) {
      throw new ValidationError(
        'Contractor Stripe account is not fully set up. Please complete onboarding.'
      )
    }

    // Calculate amounts
    const milestoneAmount = Number(milestone.amount)
    const platformFee = Math.round(milestoneAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100
    const contractorAmount = Math.round((milestoneAmount - platformFee) * 100) / 100

    // Get or create escrow agreement
    let escrow = await prismaAny.escrowAgreement.findUnique({
      where: { projectId: milestone.contract.projectId },
    })

    if (!escrow) {
      escrow = await prismaAny.escrowAgreement.create({
        data: {
          projectId: milestone.contract.projectId,
          contractId: milestone.contract.id,
          currentBalance: 0,
          status: 'ACTIVE',
        },
      })
    }

    // Check escrow balance (if using escrow)
    // For now, we'll charge the customer directly per milestone
    // In production, you might want to charge upfront and hold in escrow

    // Get or create customer's Stripe customer ID
    let customerId = milestone.contract.owner.stripeCustomerId

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: milestone.contract.owner.email,
        name: milestone.contract.owner.name,
        metadata: {
          userId: milestone.contract.owner.id,
          type: 'project_owner',
        },
      })

      customerId = customer.id

      // Store customer ID
      await prismaAny.user.update({
        where: { id: milestone.contract.owner.id },
        data: { stripeCustomerId: customer.id },
      })
    }

    // Create PaymentIntent with application fee
    // Using destination charges with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(milestoneAmount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      application_fee_amount: Math.round(platformFee * 100), // Platform fee in cents
      transfer_data: {
        destination: milestone.contract.contractor.stripeAccountId,
      },
      metadata: {
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        projectId: milestone.contract.projectId,
        projectName: milestone.contract.project.name,
        contractorId: milestone.contract.contractor.id,
        ownerId: milestone.contract.owner.id,
        platformFee: platformFee.toString(),
        contractorAmount: contractorAmount.toString(),
      },
      description: `Payment for milestone: ${milestone.name}`,
      statement_descriptor: 'Kealee Milestone',
    })

    // Create escrow transaction record
    const transaction = await prismaAny.escrowTransaction.create({
      data: {
        escrowId: escrow.id,
        milestoneId: milestone.id,
        type: options?.skipHoldback ? 'RELEASE_FINAL' : 'RELEASE',
        amount: milestoneAmount,
        balanceBefore: escrow.currentBalance,
        balanceAfter: escrow.currentBalance - milestoneAmount,
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        metadata: {
          paymentIntentId: paymentIntent.id,
          platformFee,
          contractorAmount,
          milestoneName: milestone.name,
          notes: options?.notes || null,
        },
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

    // Update escrow balance
    await prismaAny.escrowAgreement.update({
      where: { id: escrow.id },
      data: {
        currentBalance: escrow.currentBalance - milestoneAmount,
      },
    })

    // Record platform fee payment
    await prismaAny.payment.create({
      data: {
        orgId: milestone.contract.project.orgId || null,
        subscriptionId: null,
        stripePaymentIntentId: paymentIntent.id,
        stripeInvoiceId: null,
        amount: platformFee,
        currency: 'usd',
        status: 'PENDING', // Will be updated by webhook
        metadata: {
          type: 'platform_fee',
          milestoneId: milestone.id,
          transactionId: transaction.id,
          contractorAmount,
          totalAmount: milestoneAmount,
          paymentIntentId: paymentIntent.id,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      entityType: 'Milestone',
      entityId: milestoneId,
      action: 'PAYMENT_RELEASED',
      details: {
        paymentIntentId: paymentIntent.id,
        amount: milestoneAmount,
        platformFee,
        contractorAmount,
        transactionId: transaction.id,
      },
      userId: userId,
      reason: `Payment released for milestone: ${milestone.name}`,
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_INITIATED',
      payload: {
        paymentIntentId: paymentIntent.id,
        amount: milestoneAmount,
        platformFee,
        contractorAmount,
      },
      userId: userId,
      orgId: milestone.contract.project.orgId || null,
    })

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: milestoneAmount,
      platformFee,
      contractorAmount,
      transactionId: transaction.id,
      status: paymentIntent.status,
    }
  }

  /**
   * Confirm payment (after customer payment method is attached)
   */
  async confirmPayment(paymentIntentId: string, userId: string) {
    const stripe = getStripe()

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent.metadata?.milestoneId) {
      throw new ValidationError('Payment intent is not associated with a milestone')
    }

    const milestoneId = paymentIntent.metadata.milestoneId

    // Verify user is project owner
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId)
    }

    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can confirm payments')
    }

    // Confirm payment intent
    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId)

    return {
      paymentIntentId: confirmed.id,
      status: confirmed.status,
      amount: confirmed.amount / 100,
    }
  }

  /**
   * Process refund for milestone payment
   */
  async processRefund(
    paymentIntentId: string,
    userId: string,
    options?: {
      amount?: number // Partial refund amount
      reason?: string
    }
  ) {
    const stripe = getStripe()

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent.metadata?.milestoneId) {
      throw new ValidationError('Payment intent is not associated with a milestone')
    }

    const milestoneId = paymentIntent.metadata.milestoneId

    // Verify user is project owner
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId)
    }

    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can process refunds')
    }

    // Get charge ID from payment intent
    // Note: listCharges doesn't exist in Stripe API, use retrieve with expand instead
    const paymentIntentWithCharges = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges'],
    }) as any
    const charges = paymentIntentWithCharges.charges 
      ? { data: Array.isArray(paymentIntentWithCharges.charges.data) 
          ? paymentIntentWithCharges.charges.data 
          : [paymentIntentWithCharges.charges.data] } 
      : { data: [] }
    if (charges.data.length === 0) {
      throw new ValidationError('No charges found for this payment intent')
    }

    const chargeId = charges.data[0].id

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: options?.amount ? Math.round(options.amount * 100) : undefined, // Partial refund if specified
      reason: (options?.reason as any) || 'requested_by_customer',
      metadata: {
        milestoneId,
        refundedBy: userId,
      },
    })

    // Update milestone status
    await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PENDING', // Reset to pending
        paidAt: null,
      },
    })

    // Update payment status
    await prismaAny.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: refund.amount / 100,
      },
    })

    // Create audit log
    await createAuditLog({
      entityType: 'Milestone',
      entityId: milestoneId,
      action: 'PAYMENT_REFUNDED',
      details: {
        paymentIntentId,
        refundId: refund.id,
        amount: refund.amount / 100,
        reason: options?.reason || 'requested_by_customer',
      },
      userId: userId,
      reason: `Payment refunded for milestone: ${milestone.name}`,
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_REFUNDED',
      payload: {
        paymentIntentId,
        refundId: refund.id,
        amount: refund.amount / 100,
      },
      userId: userId,
    })

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentIntentId: string, userId: string) {
    const stripe = getStripe()

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (!paymentIntent.metadata?.milestoneId) {
      throw new ValidationError('Payment intent is not associated with a milestone')
    }

    const milestoneId = paymentIntent.metadata.milestoneId

    // Verify user has access
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              select: { ownerId: true },
            },
            contractor: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId)
    }

    const isOwner = milestone.contract.project.ownerId === userId
    const isContractor = milestone.contract.contractor.id === userId

    if (!isOwner && !isContractor) {
      throw new AuthorizationError('Access denied')
    }

    // Get charges - use retrieve with expand instead
    const paymentIntentWithCharges = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges'],
    }) as any
    const charges = paymentIntentWithCharges.charges || { data: [] }

    // Get transfers (to contractor)
    const transfers = await stripe.transfers.list({
      destination: milestone.contract.contractor.stripeAccountId || undefined,
    })

    const relatedTransfer = transfers.data.find(
      (t) => t.metadata?.paymentIntentId === paymentIntentId
    )

    return {
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        applicationFeeAmount: paymentIntent.application_fee_amount
          ? paymentIntent.application_fee_amount / 100
          : null,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        metadata: paymentIntent.metadata,
      },
      charge: charges.data[0]
        ? {
            id: charges.data[0].id,
            status: charges.data[0].status,
            amount: charges.data[0].amount / 100,
            refunded: charges.data[0].refunded,
            refundAmount: charges.data[0].amount_refunded / 100,
          }
        : null,
      transfer: relatedTransfer
        ? {
            id: relatedTransfer.id,
            amount: relatedTransfer.amount / 100,
            status: (relatedTransfer as any).status || 'pending',
            created: new Date(relatedTransfer.created * 1000).toISOString(),
          }
        : null,
    }
  }
}

export const milestonePaymentService = new MilestonePaymentService()
