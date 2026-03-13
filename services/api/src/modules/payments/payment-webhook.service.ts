/**
 * Payment Webhook Service
 * Handles Stripe payment webhooks
 */

import { createHmac } from 'crypto'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { getStripe } from '../billing/stripe.client'
import { prismaAny } from '../../utils/prisma-helper'
import { eventService } from '../events/event.service'

// ── Email queue (lazy singleton, same pattern as billing.service.ts) ──────────

type EmailJobData = {
  to: string
  subject: string
  text?: string
  html?: string
  metadata?: Record<string, any>
}

let _emailQueue: Queue<EmailJobData> | null = null
function getEmailQueue(): Queue<EmailJobData> | null {
  if (_emailQueue) return _emailQueue
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null // dev/test: skip silently
  try {
    const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })
    _emailQueue = new Queue<EmailJobData>('email', { connection: connection as any }) as any
    return _emailQueue
  } catch {
    return null
  }
}

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

    // Send notification to project owner about failed payment
    const ownerId = paymentIntent.metadata?.ownerId
    if (ownerId) {
      await prismaAny.notification.create({
        data: {
          userId: ownerId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: 'A payment has failed. Please retry.',
          data: {
            milestoneId,
            paymentIntentId: paymentIntent.id,
          },
          channels: ['email', 'push'],
          status: 'PENDING',
        },
      }).catch((err: any) => {
        console.warn('Failed to create payment failure notification:', err)
      })
    }
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

  // ════════════════════════════════════════════════════════════════════
  // CHECKOUT SESSION HANDLERS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Generate HMAC-signed setup token matching the format expected by
   * POST /auth/setup-account: base64url(userId:timestamp:hmacSignature)
   */
  private _generateSetupToken(userId: string): string {
    const timestamp = Date.now().toString()
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'kealee-setup-secret'
    const sig = createHmac('sha256', secret)
      .update(`${userId}:${timestamp}`)
      .digest('base64url')
    return Buffer.from(`${userId}:${timestamp}:${sig}`).toString('base64url')
  }

  /**
   * Enqueue an email through BullMQ. Fire-and-forget; silently no-ops when
   * REDIS_URL is not set (local dev / CI).
   */
  private async _enqueueEmail(data: EmailJobData): Promise<void> {
    const queue = getEmailQueue()
    if (!queue) return
    await queue.add('send-email', data).catch((err: any) => {
      console.warn('[checkout webhook] Failed to enqueue email:', err?.message)
    })
  }

  /**
   * Handle one-time concept/precon package purchase (owner journey).
   * Creates ConceptPackageOrder → unblocks /orders/verify polling.
   */
  private async _handleConceptPackageCheckout(session: any, customerEmail: string): Promise<void> {
    // Idempotency: if order already exists, nothing to do
    const existing = await prismaAny.conceptPackageOrder.findUnique({
      where: { stripeSessionId: session.id },
    }).catch(() => null)
    if (existing) return

    const meta = session.metadata || {}
    const customerName: string =
      meta.customerName ||
      session.customer_details?.name ||
      customerEmail.split('@')[0]

    // Find or create stub User (no Supabase auth yet — setup-account handles that)
    const user = await prismaAny.user.upsert({
      where: { email: customerEmail },
      update: {},
      create: { email: customerEmail, name: customerName, status: 'ACTIVE' },
    })

    // Create order record (unblocks checkout success polling page)
    await prismaAny.conceptPackageOrder.create({
      data: {
        userId:                user.id,
        stripeSessionId:       session.id,
        stripePaymentIntentId: session.payment_intent || null,
        packageTier:           meta.packageTier    || 'standard',
        packageName:           meta.packageName    || meta.packageTier || 'AI Concept Package',
        amount:                session.amount_total || 0,
        currency:              session.currency    || 'usd',
        status:                'completed',
        deliveryStatus:        'pending',
        funnelSessionId:       meta.funnelSessionId || null,
        metadata: {
          customerName,
          customerPhone: meta.customerPhone || null,
          source: 'stripe-checkout',
        },
      },
    })

    // Generate setup token + send confirmation email with account-setup link
    const setupToken = this._generateSetupToken(user.id)
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'
    const setupUrl = `${appUrl}/auth/setup?token=${encodeURIComponent(setupToken)}&email=${encodeURIComponent(customerEmail)}`
    const pkgName  = meta.packageName || 'AI Concept Package'

    await this._enqueueEmail({
      to:      customerEmail,
      subject: `Your Kealee ${pkgName} — next steps`,
      html: `
        <h1>Payment confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Your <strong>${pkgName}</strong> purchase was successful.</p>
        <p>Your project concepts will be ready within 24 hours.</p>
        <h2>Set up your account</h2>
        <p>Click below to create your password and access your project portal:</p>
        <p><a href="${setupUrl}" style="background:#0070f3;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Set Up My Account</a></p>
        <p><small>This link expires in 48 hours.</small></p>
      `,
      text: `Payment confirmed!\n\nYour ${pkgName} was purchased successfully. Concepts ready within 24 hours.\n\nSet up your account:\n${setupUrl}\n\n(Link expires in 48 hours.)`,
      metadata: {
        eventType:       'concept_package_purchased',
        stripeSessionId: session.id,
        userId:          user.id,
      },
    })

    await eventService.recordEvent({
      type:       'CONCEPT_PACKAGE_ORDER_CREATED',
      entityType: 'ConceptPackageOrder',
      entityId:   session.id,
      userId:     user.id,
      payload: {
        stripeSessionId: session.id,
        packageTier:     meta.packageTier,
        amount:          (session.amount_total || 0) / 100,
        customerEmail,
      },
    })
  }

  /**
   * Handle subscription checkout completion (contractor/ops journey).
   * Subscription record itself is provisioned by customer.subscription.created
   * (handled by billingService.syncSubscription). Here we only send the
   * confirmation + account-setup email so the buyer can access the platform.
   */
  private async _handleSubscriptionCheckout(session: any, customerEmail: string): Promise<void> {
    const meta         = session.metadata || {}
    const planSlug     = meta.planSlug    || ''
    const customerName: string =
      session.customer_details?.name ||
      meta.customerName              ||
      customerEmail.split('@')[0]

    // Find or create stub User
    const user = await prismaAny.user.upsert({
      where: { email: customerEmail },
      update: {},
      create: { email: customerEmail, name: customerName, status: 'ACTIVE' },
    })

    const setupToken = this._generateSetupToken(user.id)
    const appUrl     = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'
    const setupUrl   = `${appUrl}/auth/setup?token=${encodeURIComponent(setupToken)}&email=${encodeURIComponent(customerEmail)}`

    const planLabels: Record<string, string> = {
      'package-a': 'Package A — Starter',
      'package-b': 'Package B — Professional',
      'package-c': 'Package C — Business',
      'package-d': 'Package D — Enterprise',
    }
    const planLabel = planLabels[planSlug] || planSlug || 'Ops Services Subscription'

    await this._enqueueEmail({
      to:      customerEmail,
      subject: 'Your Kealee Ops Services subscription is active',
      html: `
        <h1>Subscription confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Your <strong>${planLabel}</strong> subscription is now active (14-day free trial).</p>
        <h2>Access your account</h2>
        <p>Click below to set up your password and access your dashboard:</p>
        <p><a href="${setupUrl}" style="background:#0070f3;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Set Up My Account</a></p>
        <p>Already have an account? <a href="${appUrl}/dashboard">Log in here</a>.</p>
        <p><small>This setup link expires in 48 hours.</small></p>
      `,
      text: `Subscription confirmed!\n\nYour ${planLabel} is now active.\n\nSet up your account:\n${setupUrl}\n\n(Link expires in 48 hours.)`,
      metadata: {
        eventType:      'subscription_checkout_completed',
        stripeSessionId: session.id,
        subscriptionId: session.subscription,
        userId:         user.id,
        planSlug,
      },
    })

    await eventService.recordEvent({
      type:       'SUBSCRIPTION_CHECKOUT_COMPLETED',
      entityType: 'Subscription',
      entityId:   session.subscription || session.id,
      userId:     user.id,
      payload: {
        stripeSessionId: session.id,
        subscriptionId:  session.subscription,
        planSlug,
        customerEmail,
        orgId: meta.orgId || null,
      },
    })
  }

  /**
   * Handle checkout.session.completed — entry point for both journeys.
   */
  async handleCheckoutSessionCompleted(event: any): Promise<void> {
    const session = event.data.object

    const customerEmail: string | undefined =
      session.customer_email ||
      session.customer_details?.email ||
      session.metadata?.customerEmail

    if (!customerEmail) {
      console.warn('[checkout.session.completed] No customer email — skipping provisioning')
      return
    }

    if (session.mode === 'payment') {
      await this._handleConceptPackageCheckout(session, customerEmail)
    } else if (session.mode === 'subscription') {
      await this._handleSubscriptionCheckout(session, customerEmail)
    } else {
      console.log(`[checkout.session.completed] Unknown mode: ${session.mode}`)
    }
  }

  /**
   * Route webhook to appropriate handler based on event type
   */
  async routeWebhook(event: any): Promise<{ handled: boolean; eventType: string }> {
    const eventType = event.type

    // Checkout session events
    if (eventType === 'checkout.session.completed') {
      await this.handleCheckoutSessionCompleted(event)
      return { handled: true, eventType }
    }

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

    // Subscription events
    if (eventType.startsWith('customer.subscription.')) {
      switch (eventType) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event)
          return { handled: true, eventType }
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event)
          return { handled: true, eventType }
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled subscription event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Invoice events
    if (eventType.startsWith('invoice.')) {
      switch (eventType) {
        case 'invoice.created':
          await this.handleInvoiceCreated(event)
          return { handled: true, eventType }
        case 'invoice.paid':
          await this.handleInvoicePaid(event)
          return { handled: true, eventType }
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event)
          return { handled: true, eventType }
        case 'invoice.finalized':
          await this.handleInvoiceFinalized(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled invoice event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Customer events
    if (eventType.startsWith('customer.') && !eventType.startsWith('customer.subscription.')) {
      switch (eventType) {
        case 'customer.updated':
          await this.handleCustomerUpdated(event)
          return { handled: true, eventType }
        case 'customer.deleted':
          await this.handleCustomerDeleted(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled customer event: ${eventType}`)
          return { handled: false, eventType }
      }
    }

    // Payment method events
    if (eventType.startsWith('payment_method.')) {
      switch (eventType) {
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event)
          return { handled: true, eventType }
        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(event)
          return { handled: true, eventType }
        default:
          console.log(`Unhandled payment_method event: ${eventType}`)
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

  // ════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION LIFECYCLE HANDLERS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Handle customer.subscription.created
   */
  async handleSubscriptionCreated(event: any) {
    const subscription = event.data.object
    const customerId = subscription.customer as string
    const priceId = subscription.items?.data?.[0]?.price?.id

    // Find org by Stripe customer ID
    const org = await prismaAny.org.findFirst({
      where: { stripeCustomerId: customerId },
    }).catch(() => null)

    const orgId = org?.id

    // Upsert subscription record
    await prismaAny.pMServiceSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        orgId: orgId || 'unknown',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: priceId || null,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      },
      update: {
        status: subscription.status.toUpperCase(),
        stripePriceId: priceId || null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      },
    }).catch((err: any) => {
      console.warn('Failed to upsert subscription:', err.message)
    })

    await eventService.recordEvent({
      entityType: 'Subscription',
      entityId: subscription.id,
      type: 'SUBSCRIPTION_CREATED',
      payload: {
        subscriptionId: subscription.id,
        customerId,
        status: subscription.status,
        priceId,
      },
      userId: undefined,
    })
  }

  /**
   * Handle customer.subscription.updated
   */
  async handleSubscriptionUpdated(event: any) {
    const subscription = event.data.object
    const priceId = subscription.items?.data?.[0]?.price?.id

    await prismaAny.pMServiceSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase(),
        stripePriceId: priceId || undefined,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    }).catch((err: any) => {
      console.warn('Failed to update subscription:', err.message)
    })

    await eventService.recordEvent({
      entityType: 'Subscription',
      entityId: subscription.id,
      type: 'SUBSCRIPTION_UPDATED',
      payload: {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      userId: undefined,
    })
  }

  /**
   * Handle customer.subscription.deleted
   */
  async handleSubscriptionDeleted(event: any) {
    const subscription = event.data.object

    await prismaAny.pMServiceSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    }).catch((err: any) => {
      console.warn('Failed to mark subscription as canceled:', err.message)
    })

    await eventService.recordEvent({
      entityType: 'Subscription',
      entityId: subscription.id,
      type: 'SUBSCRIPTION_CANCELED',
      payload: {
        subscriptionId: subscription.id,
        canceledAt: new Date().toISOString(),
      },
      userId: undefined,
    })
  }

  // ════════════════════════════════════════════════════════════════════
  // INVOICE HANDLERS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Handle invoice.created
   */
  async handleInvoiceCreated(event: any) {
    const invoice = event.data.object
    const customerId = invoice.customer as string

    const org = await prismaAny.org.findFirst({
      where: { stripeCustomerId: customerId },
    }).catch(() => null)

    await prismaAny.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        orgId: org?.id || 'unknown',
        stripeInvoiceId: invoice.id,
        invoiceNumber: invoice.number || null,
        amount: (invoice.amount_due || 0) / 100,
        currency: invoice.currency || 'usd',
        status: 'draft',
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
      },
      update: {
        amount: (invoice.amount_due || 0) / 100,
        status: 'draft',
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
      },
    }).catch((err: any) => {
      console.warn('Failed to upsert invoice:', err.message)
    })
  }

  /**
   * Handle invoice.finalized
   */
  async handleInvoiceFinalized(event: any) {
    const invoice = event.data.object

    await prismaAny.invoice.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'open',
        invoiceNumber: invoice.number || undefined,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      },
    }).catch((err: any) => {
      console.warn('Failed to update invoice to open:', err.message)
    })
  }

  /**
   * Handle invoice.paid
   */
  async handleInvoicePaid(event: any) {
    const invoice = event.data.object

    await prismaAny.invoice.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      },
    }).catch((err: any) => {
      console.warn('Failed to mark invoice as paid:', err.message)
    })

    // Also create a Payment record for the invoice
    const customerId = invoice.customer as string
    const org = await prismaAny.org.findFirst({
      where: { stripeCustomerId: customerId },
    }).catch(() => null)

    if (org && invoice.payment_intent) {
      await prismaAny.payment.create({
        data: {
          orgId: org.id,
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: invoice.payment_intent as string,
          amount: (invoice.amount_paid || 0) / 100,
          currency: invoice.currency || 'usd',
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      }).catch((err: any) => {
        console.warn('Failed to create payment from invoice:', err.message)
      })
    }

    await eventService.recordEvent({
      entityType: 'Invoice',
      entityId: invoice.id,
      type: 'INVOICE_PAID',
      payload: {
        invoiceId: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        subscriptionId: invoice.subscription,
      },
      userId: undefined,
    })
  }

  /**
   * Handle invoice.payment_failed
   */
  async handleInvoicePaymentFailed(event: any) {
    const invoice = event.data.object
    const customerId = invoice.customer as string

    await prismaAny.invoice.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: {
        status: 'uncollectible',
      },
    }).catch((err: any) => {
      console.warn('Failed to update invoice payment failure:', err.message)
    })

    // Notify the org admin
    const org = await prismaAny.org.findFirst({
      where: { stripeCustomerId: customerId },
      include: { members: { where: { roleKey: 'admin' }, take: 1, include: { user: true } } },
    }).catch(() => null)

    const adminUser = org?.members?.[0]?.user
    if (adminUser) {
      await prismaAny.notification.create({
        data: {
          userId: adminUser.id,
          type: 'INVOICE_PAYMENT_FAILED',
          title: 'Invoice Payment Failed',
          message: `Payment for invoice ${invoice.number || invoice.id} has failed. Please update your payment method.`,
          data: { invoiceId: invoice.id, amount: (invoice.amount_due || 0) / 100 },
          channels: ['email', 'push'],
          status: 'PENDING',
        },
      }).catch((err: any) => {
        console.warn('Failed to create invoice failure notification:', err)
      })
    }

    await eventService.recordEvent({
      entityType: 'Invoice',
      entityId: invoice.id,
      type: 'INVOICE_PAYMENT_FAILED',
      payload: {
        invoiceId: invoice.id,
        amount: (invoice.amount_due || 0) / 100,
        attemptCount: invoice.attempt_count,
      },
      userId: adminUser?.id || undefined,
    })
  }

  // ════════════════════════════════════════════════════════════════════
  // CUSTOMER & PAYMENT METHOD HANDLERS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Handle customer.updated — sync customer metadata to org
   */
  async handleCustomerUpdated(event: any) {
    const customer = event.data.object

    await prismaAny.org.updateMany({
      where: { stripeCustomerId: customer.id },
      data: {
        billingEmail: customer.email || undefined,
      },
    }).catch((err: any) => {
      console.warn('Failed to sync customer update:', err.message)
    })

    await eventService.recordEvent({
      entityType: 'Customer',
      entityId: customer.id,
      type: 'STRIPE_CUSTOMER_UPDATED',
      payload: { customerId: customer.id, email: customer.email },
      userId: undefined,
    })
  }

  /**
   * Handle customer.deleted — mark org as having no Stripe customer
   */
  async handleCustomerDeleted(event: any) {
    const customer = event.data.object

    await prismaAny.org.updateMany({
      where: { stripeCustomerId: customer.id },
      data: {
        stripeCustomerId: null,
      },
    }).catch((err: any) => {
      console.warn('Failed to clear customer on org:', err.message)
    })

    await eventService.recordEvent({
      entityType: 'Customer',
      entityId: customer.id,
      type: 'STRIPE_CUSTOMER_DELETED',
      payload: { customerId: customer.id },
      userId: undefined,
    })
  }

  /**
   * Handle payment_method.attached — sync to PaymentMethod table
   */
  async handlePaymentMethodAttached(event: any) {
    const pm = event.data.object
    const customerId = pm.customer as string

    // Find user by Stripe customer (through org membership)
    const org = await prismaAny.org.findFirst({
      where: { stripeCustomerId: customerId },
      include: { members: { where: { roleKey: 'admin' }, take: 1 } },
    }).catch(() => null)

    const userId = org?.members?.[0]?.userId
    if (!userId) return

    await prismaAny.paymentMethod.upsert({
      where: { stripePaymentMethodId: pm.id },
      create: {
        userId,
        stripePaymentMethodId: pm.id,
        type: pm.type === 'card' ? 'CARD' : pm.type === 'us_bank_account' ? 'ACH' : 'CARD',
        last4: pm.card?.last4 || pm.us_bank_account?.last4 || null,
        brand: pm.card?.brand || null,
        bankName: pm.us_bank_account?.bank_name || null,
        expiryMonth: pm.card?.exp_month || null,
        expiryYear: pm.card?.exp_year || null,
        status: 'ACTIVE',
        isVerified: true,
      },
      update: {
        status: 'ACTIVE',
        last4: pm.card?.last4 || pm.us_bank_account?.last4 || undefined,
        brand: pm.card?.brand || undefined,
        expiryMonth: pm.card?.exp_month || undefined,
        expiryYear: pm.card?.exp_year || undefined,
      },
    }).catch((err: any) => {
      console.warn('Failed to upsert payment method:', err.message)
    })
  }

  /**
   * Handle payment_method.detached — mark as inactive
   */
  async handlePaymentMethodDetached(event: any) {
    const pm = event.data.object

    await prismaAny.paymentMethod.updateMany({
      where: { stripePaymentMethodId: pm.id },
      data: {
        status: 'INACTIVE',
        isDefault: false,
      },
    }).catch((err: any) => {
      console.warn('Failed to deactivate payment method:', err.message)
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
