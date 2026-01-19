/**
 * Payment Webhook Service
 * Handles Stripe payment webhooks
 */

import { getStripe } from '../billing/stripe.client'
import { prismaAny } from '../../utils/prisma-helper'
import { eventService } from '../events/event.service'
import { auditService } from '../audit/audit.service'

class PaymentWebhookService {
  /**
   * Handle payment_intent.succeeded
   */
  async handlePaymentIntentSucceeded(event: any) {
    const paymentIntent = event.data.object
    const milestoneId = paymentIntent.metadata?.milestoneId

    if (!milestoneId) {
      console.log('Payment intent not associated with milestone, skipping')
      return
    }

    // Update payment status
    await prismaAny.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    })

    // Update escrow transaction
    await prismaAny.escrowTransaction.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_SUCCEEDED',
      payload: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      },
      userId: paymentIntent.metadata?.ownerId || null,
    })
  }

  /**
   * Handle payment_intent.payment_failed
   */
  async handlePaymentIntentFailed(event: any) {
    const paymentIntent = event.data.object
    const milestoneId = paymentIntent.metadata?.milestoneId

    if (!milestoneId) {
      return
    }

    // Update payment status
    await prismaAny.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
      },
    })

    // Update escrow transaction
    await prismaAny.escrowTransaction.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        status: 'FAILED',
        metadata: {
          error: paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      },
    })

    // Reset milestone status
    await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED', // Back to approved, payment can be retried
        paidAt: null,
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_FAILED',
      payload: {
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      },
      userId: paymentIntent.metadata?.ownerId || null,
    })

    // TODO: Send notification email to project owner
  }

  /**
   * Handle transfer.created
   */
  async handleTransferCreated(event: any) {
    const transfer = event.data.object

    // Log transfer for reporting
    await eventService.recordEvent({
      entityType: 'Payment',
      entityId: transfer.id,
      type: 'STRIPE_TRANSFER_CREATED',
      payload: {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        destination: transfer.destination,
        currency: transfer.currency,
      },
      userId: null,
    })
  }

  /**
   * Handle payout.paid
   */
  async handlePayoutPaid(event: any) {
    const payout = event.data.object

    // Update contractor payout status if needed
    // This would be used for tracking when contractor actually receives funds

    await eventService.recordEvent({
      entityType: 'Payment',
      entityId: payout.id,
      type: 'STRIPE_PAYOUT_PAID',
      payload: {
        payoutId: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
      },
      userId: null,
    })
  }

  /**
   * Handle charge.refunded
   */
  async handleChargeRefunded(event: any) {
    const charge = event.data.object

    // Find payment by charge ID
    const paymentIntentId = charge.payment_intent as string

    if (!paymentIntentId) {
      return
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
    const milestoneId = paymentIntent.metadata?.milestoneId

    if (!milestoneId) {
      return
    }

    // Update payment status
    await prismaAny.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded / 100,
      },
    })

    // Update milestone
    await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PENDING',
        paidAt: null,
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_REFUNDED',
      payload: {
        paymentIntentId,
        chargeId: charge.id,
        refundAmount: charge.amount_refunded / 100,
      },
      userId: paymentIntent.metadata?.ownerId || null,
    })
  }

  /**
   * Main webhook handler
   */
  async handleWebhook(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event)
        break

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event)
        break

      case 'transfer.created':
        await this.handleTransferCreated(event)
        break

      case 'payout.paid':
        await this.handlePayoutPaid(event)
        break

      case 'charge.refunded':
        await this.handleChargeRefunded(event)
        break

      default:
        console.log(`Unhandled payment webhook event: ${event.type}`)
    }
  }
}

export const paymentWebhookService = new PaymentWebhookService()
