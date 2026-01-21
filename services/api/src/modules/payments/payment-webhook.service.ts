/**
 * Payment Webhook Service
 * Handles Stripe payment webhooks
 */

import { getStripe } from '../billing/stripe.client'
import { prismaAny } from '../../utils/prisma-helper'
import { eventService } from '../events/event.service'

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
      userId: paymentIntent.metadata?.ownerId || undefined,
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
      userId: paymentIntent.metadata?.ownerId || undefined,
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
      userId: undefined,
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
      userId: undefined,
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
      userId: paymentIntent.metadata?.ownerId || undefined,
    })
  }

  /**
   * Route webhook to appropriate handler based on event type
   */
  async routeWebhook(event: any): Promise<{ handled: boolean; eventType: string }> {
    const eventType = event.type

    // Payment intent events
    if (eventType.startsWith('payment_intent.')) {
      switch (eventType) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event)
          return { handled: true, eventType }
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event)
          return { handled: true, eventType }
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled payment_intent event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Transfer events
    if (eventType.startsWith('transfer.')) {
      switch (eventType) {
        case 'transfer.created':
          await this.handleTransferCreated(event)
          return { handled: true, eventType }
        case 'transfer.paid':
          await this.handleTransferPaid(event)
          return { handled: true, eventType }
        case 'transfer.failed':
          await this.handleTransferFailed(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled transfer event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Payout events
    if (eventType.startsWith('payout.')) {
      switch (eventType) {
        case 'payout.paid':
          await this.handlePayoutPaid(event)
          return { handled: true, eventType }
        case 'payout.failed':
          await this.handlePayoutFailed(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled payout event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Charge events
    if (eventType.startsWith('charge.')) {
      switch (eventType) {
        case 'charge.refunded':
          await this.handleChargeRefunded(event)
          return { handled: true, eventType }
        case 'charge.dispute.created':
          await this.handleChargeDisputeCreated(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled charge event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    return { handled: false, eventType }
  }

  /**
   * Handle payment_intent.canceled
   */
  async handlePaymentIntentCanceled(event: any) {
    const paymentIntent = event.data.object
    const milestoneId = paymentIntent.metadata?.milestoneId

    if (!milestoneId) return

    // Update payment status
    await prismaAny.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'CANCELLED',
        metadata: {
          cancellationReason: paymentIntent.cancellation_reason || 'canceled',
        },
      },
    })

    // Update milestone status
    await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED', // Back to approved
        paidAt: null,
      },
    })

    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_CANCELED',
      payload: {
        paymentIntentId: paymentIntent.id,
      },
      userId: paymentIntent.metadata?.ownerId || undefined,
    })
  }

  /**
   * Handle transfer.paid
   */
  async handleTransferPaid(event: any) {
    const transfer = event.data.object

    await eventService.recordEvent({
      entityType: 'Payment',
      entityId: transfer.id,
      type: 'STRIPE_TRANSFER_PAID',
      payload: {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        destination: transfer.destination,
      },
      userId: undefined,
    })
  }

  /**
   * Handle transfer.failed
   */
  async handleTransferFailed(event: any) {
    const transfer = event.data.object

    await eventService.recordEvent({
      entityType: 'Payment',
      entityId: transfer.id,
      type: 'STRIPE_TRANSFER_FAILED',
      payload: {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        failureCode: transfer.failure_code,
        failureMessage: transfer.failure_message,
      },
      userId: undefined,
    })
  }

  /**
   * Handle payout.failed
   */
  async handlePayoutFailed(event: any) {
    const payout = event.data.object

    await eventService.recordEvent({
      entityType: 'Payment',
      entityId: payout.id,
      type: 'STRIPE_PAYOUT_FAILED',
      payload: {
        payoutId: payout.id,
        amount: payout.amount / 100,
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
      },
      userId: undefined,
    })
  }

  /**
   * Handle charge.dispute.created
   */
  async handleChargeDisputeCreated(event: any) {
    const charge = event.data.object
    const paymentIntentId = charge.payment_intent as string

    if (!paymentIntentId) return

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
    const milestoneId = paymentIntent.metadata?.milestoneId

    if (!milestoneId) return

    // Create dispute record
    await prismaAny.dispute.create({
      data: {
        milestoneId,
        type: 'PAYMENT',
        status: 'FILED',
        amount: charge.amount / 100,
        currency: charge.currency,
        stripeChargeId: charge.id,
        metadata: {
          disputeId: charge.dispute?.id,
          reason: charge.dispute?.reason,
        },
      },
    })

    await eventService.recordEvent({
      entityType: 'Milestone',
      entityId: milestoneId,
      type: 'MILESTONE_PAYMENT_DISPUTED',
      payload: {
        paymentIntentId,
        chargeId: charge.id,
        disputeId: charge.dispute?.id,
      },
      userId: paymentIntent.metadata?.ownerId || undefined,
    })
  }

  /**
   * Main webhook handler
   */
  async handleWebhook(event: any) {
    const { handled, eventType } = await this.routeWebhook(event)
    
    if (!handled) {
      console.log(`Unhandled payment webhook event: ${eventType}`)
    }
  }
}

export const paymentWebhookService = new PaymentWebhookService()
