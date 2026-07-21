/**
 * Payout Service
 * Handles contractor payouts via Stripe Connect
 */

import Stripe from 'stripe'
import { prisma, Decimal } from '@kealee/database'
import { PayoutMethod, PayoutStatus } from '@kealee/database'
import { withRetry } from '../../utils/retry'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export interface CreatePayoutDTO {
  connectedAccountId: string
  amount: number
  currency?: string
  method?: PayoutMethod
  escrowTransactionId?: string
  milestoneId?: string
  initiatedBy: string
  description?: string
  metadata?: Record<string, any>
}

export interface ProcessPayoutDTO {
  payoutId: string
  approvedBy?: string
}

export class PayoutService {
  /**
   * Create a payout to a connected account
   */
  static async createPayout(data: CreatePayoutDTO) {
    const {
      connectedAccountId,
      amount,
      currency = 'USD',
      method = 'STANDARD',
      escrowTransactionId,
      milestoneId,
      initiatedBy,
      description,
      metadata,
    } = data

    // Get connected account
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { id: connectedAccountId },
    })

    if (!connectedAccount) {
      throw new Error('Connected account not found')
    }

    // Check if account is active and can receive payouts
    if (connectedAccount.status !== 'ACTIVE') {
      throw new Error(
        `Connected account is ${connectedAccount.status}. Must be ACTIVE to receive payouts.`
      )
    }

    if (!connectedAccount.payoutsEnabled) {
      throw new Error('Payouts are not enabled for this connected account')
    }

    // Calculate fees
    const platformFeeAmount =
      amount * (connectedAccount.platformFeePercentage.toNumber() / 100)

    let instantPayoutFee = 0
    if (method === 'INSTANT') {
      // Instant payout fee: 1% of amount, max $10
      instantPayoutFee = Math.min(amount * 0.01, 10)
    }

    // Calculate expected arrival date
    let arrivalDate = new Date()
    if (method === 'STANDARD') {
      // Next business day
      arrivalDate.setDate(arrivalDate.getDate() + 1)
      // Skip weekends (simplified - doesn't account for holidays)
      if (arrivalDate.getDay() === 0) arrivalDate.setDate(arrivalDate.getDate() + 1) // Sunday -> Monday
      if (arrivalDate.getDay() === 6) arrivalDate.setDate(arrivalDate.getDate() + 2) // Saturday -> Monday
    } else {
      // Instant: within 30 minutes
      arrivalDate.setMinutes(arrivalDate.getMinutes() + 30)
    }

    // Create payout record in database
    const payout = await prisma.payout.create({
      data: {
        connectedAccountId,
        amount: new Decimal(amount),
        currency: currency.toUpperCase(),
        status: 'PENDING',
        method,
        arrivalDate,
        platformFee: new Decimal(platformFeeAmount),
        stripeFee: new Decimal(0), // Will be updated after Stripe processes
        instantPayoutFee: new Decimal(instantPayoutFee),
        escrowTransactionId,
        milestoneId,
        initiatedBy,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
      include: {
        connectedAccount: {
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

    return payout
  }

  /**
   * Process a payout by creating Stripe Transfer
   */
  static async processPayout(data: ProcessPayoutDTO) {
    const { payoutId, approvedBy } = data

    // Get payout with connected account
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        connectedAccount: true,
      },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status !== 'PENDING') {
      throw new Error(`Payout is already ${payout.status}`)
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(payout.amount.toNumber() * 100)
    const platformFeeInCents = Math.round(payout.platformFee.toNumber() * 100)

    try {
      // Create Stripe Transfer to connected account
      const transfer = await withRetry(
        () => stripe.transfers.create({
          amount: amountInCents - platformFeeInCents, // Amount minus platform fee
          currency: payout.currency.toLowerCase(),
          destination: payout.connectedAccount.stripeAccountId,
          description: `Payout for milestone/escrow transaction`,
          metadata: {
            payoutId: payout.id,
            milestoneId: payout.milestoneId || '',
            escrowTransactionId: payout.escrowTransactionId || '',
          },
        }),
        { label: 'Stripe.transfers.create' }
      )

      // For instant payouts, create a payout on the connected account
      let stripePayout: Stripe.Payout | null = null
      if (payout.method === 'INSTANT') {
        stripePayout = await withRetry(
          () => stripe.payouts.create(
            {
              amount: amountInCents - platformFeeInCents,
              currency: payout.currency.toLowerCase(),
              method: 'instant',
            },
            {
              stripeAccount: payout.connectedAccount.stripeAccountId,
            }
          ),
          { label: 'Stripe.payouts.create' }
        )
      }

      // Update payout with Stripe IDs and status
      const updated = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          stripeTransferId: transfer.id,
          stripePayoutId: stripePayout?.id || null,
          status: 'PAID', // Transfers are immediate in Stripe
          processedAt: new Date(),
          approvedBy,
        },
        include: {
          connectedAccount: {
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

      return updated
    } catch (error: any) {
      // Handle Stripe errors
      let failureCode = 'unknown'
      let failureMessage = error.message || 'Unknown error'

      if (error.type === 'StripeInvalidRequestError') {
        failureCode = 'invalid_request'
      } else if (error.type === 'StripeAPIError') {
        failureCode = 'api_error'
      } else if (error.code === 'insufficient_funds') {
        failureCode = 'insufficient_funds'
      }

      // Mark payout as failed
      const failed = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureCode,
          failureMessage,
        },
        include: {
          connectedAccount: {
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

      throw new Error(`Payout failed: ${failureMessage}`)
    }
  }

  /**
   * Get payout details
   */
  static async getPayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        connectedAccount: {
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
        escrowTransaction: true,
        milestone: true,
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return payout
  }

  /**
   * List payouts with filters
   */
  static async listPayouts(filters?: {
    connectedAccountId?: string
    status?: PayoutStatus
    milestoneId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.connectedAccountId) {
      where.connectedAccountId = filters.connectedAccountId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.milestoneId) {
      where.milestoneId = filters.milestoneId
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          connectedAccount: {
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
          milestone: {
            select: {
              id: true,
              name: true,
              amount: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payout.count({ where }),
    ])

    return {
      payouts,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Retry a failed payout
   */
  static async retryPayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status !== 'FAILED') {
      throw new Error('Can only retry failed payouts')
    }

    // Reset payout to pending
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PENDING',
        failureCode: null,
        failureMessage: null,
        failedAt: null,
      },
    })

    // Process payout again
    return this.processPayout({ payoutId })
  }

  /**
   * Cancel a pending payout
   */
  static async cancelPayout(payoutId: string) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status !== 'PENDING') {
      throw new Error('Can only cancel pending payouts')
    }

    const canceled = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'CANCELED',
      },
    })

    return canceled
  }

  /**
   * Get payout statistics for a connected account
   */
  static async getPayoutStats(connectedAccountId: string) {
    const payouts = await prisma.payout.findMany({
      where: { connectedAccountId },
    })

    const stats = {
      total: payouts.length,
      pending: payouts.filter((p) => p.status === 'PENDING').length,
      paid: payouts.filter((p) => p.status === 'PAID').length,
      failed: payouts.filter((p) => p.status === 'FAILED').length,
      canceled: payouts.filter((p) => p.status === 'CANCELED').length,
      totalAmount: payouts
        .filter((p) => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount.toNumber(), 0),
      totalFees: payouts
        .filter((p) => p.status === 'PAID')
        .reduce(
          (sum, p) =>
            sum +
            p.platformFee.toNumber() +
            p.stripeFee.toNumber() +
            p.instantPayoutFee.toNumber(),
          0
        ),
    }

    return stats
  }

  /**
   * Verify payout arrival (called by webhook)
   */
  static async verifyPayoutArrival(stripePayoutId: string) {
    const payout = await prisma.payout.findFirst({
      where: { stripePayoutId },
      include: {
        connectedAccount: true,
      },
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    // Fetch payout from Stripe
    const stripePayout = await withRetry(
      () => stripe.payouts.retrieve(stripePayoutId, {
        stripeAccount: payout.connectedAccount.stripeAccountId,
      }),
      { label: 'Stripe.payouts.retrieve' }
    )

    // Update payout with arrival information
    const updated = await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: stripePayout.status === 'paid' ? 'PAID' : 'FAILED',
        arrivalDate: stripePayout.arrival_date
          ? new Date(stripePayout.arrival_date * 1000)
          : payout.arrivalDate,
        failureCode: stripePayout.failure_code || null,
        failureMessage: stripePayout.failure_message || null,
      },
    })

    return updated
  }
}

