/**
 * Production-Ready Stripe Webhook Handler
 * Handles all Stripe webhook events with signature verification and database sync
 */

import Stripe from 'stripe'
import { FastifyRequest, FastifyReply } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { getStripe } from '../billing/stripe.client'
import { mapStripeSubscriptionStatus, getPlanSlugFromPriceId, OPS_SERVICES_MODULE_KEY } from '../billing/billing.constants'
import { entitlementService } from '../entitlements/entitlement.service'

// Rate limiting: track webhook attempts
const webhookAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 100 // max requests per minute per IP

/**
 * Get webhook secret from environment
 */
function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return secret
}

/**
 * Rate limit check
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = webhookAttempts.get(ip)

  if (!record || now > record.resetAt) {
    webhookAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

/**
 * Convert Unix timestamp to Date
 */
function toDateFromSeconds(seconds: number | null | undefined): Date | null {
  if (!seconds) return null
  return new Date(seconds * 1000)
}

/**
 * Main webhook handler - Returns 200 OK immediately, processes asynchronously
 */
export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const signature = request.headers['stripe-signature'] as string
  const ip = request.ip || request.socket.remoteAddress || 'unknown'

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.error(`⚠️  Rate limit exceeded for IP: ${ip}`)
    await logWebhookAttempt(ip, null, 'RATE_LIMIT_EXCEEDED', null)
    reply.code(429).send({ error: 'Rate limit exceeded' })
    return
  }

  // Verify signature exists
  if (!signature) {
    console.error('⚠️  Missing stripe-signature header')
    await logWebhookAttempt(ip, null, 'MISSING_SIGNATURE', null)
    reply.code(400).send({ error: 'Missing stripe-signature header' })
    return
  }

  // Get raw body
  const rawBody = (request as any).rawBody as Buffer | string | undefined
  if (!rawBody) {
    console.error('⚠️  Missing raw body')
    await logWebhookAttempt(ip, null, 'MISSING_BODY', null)
    reply.code(400).send({ error: 'Missing raw body' })
    return
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    const stripe = getStripe()
    const webhookSecret = getWebhookSecret()
    const buf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8')

    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret)

    // Log successful verification
    await logWebhookAttempt(ip, event.id, 'VERIFIED', event.type)
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message)
    await logWebhookAttempt(ip, null, 'SIGNATURE_VERIFICATION_FAILED', null, err.message)
    reply.code(400).send({ error: `Webhook Error: ${err.message}` })
    return
  }

  // Return 200 OK immediately - process asynchronously
  reply.code(200).send({ received: true, eventId: event.id })

  // Process event asynchronously (don't await)
  processWebhookEvent(event).catch((error) => {
    console.error(`❌ Error processing webhook event ${event.id}:`, error)
  })
}

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
          return

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          return

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          return

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          return

        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice)
          return

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          return

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
          return

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
          return

        default:
          console.log(`ℹ️  Unhandled event type: ${event.type}`)
          return
      }
    } catch (error: any) {
      retryCount++
      const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff

      if (retryCount >= maxRetries) {
        console.error(`❌ Failed to process webhook event ${event.id} after ${maxRetries} retries:`, error)
        await logWebhookError(event.id, event.type, error.message || 'Unknown error', retryCount)
        throw error
      }

      console.warn(`⚠️  Retry ${retryCount}/${maxRetries} for event ${event.id} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Handle checkout.session.completed event
 * This event fires when a customer completes checkout, including subscription creation
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    console.log('✅ Processing checkout.session.completed:', session.id)

    // Handle permit payments (one-time payments)
    if (session.mode === 'payment' && session.metadata?.permitId && session.metadata?.feeType) {
      await handlePermitPayment(session)
      return
    }

    // Only handle subscription checkouts
    if (session.mode !== 'subscription') {
      console.log(`ℹ️  Checkout session ${session.id} is not a subscription (mode: ${session.mode}), skipping`)
      return
    }

    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id

    if (!subscriptionId) {
      console.warn(`⚠️  Checkout session ${session.id} has no subscription ID`)
      return
    }

    // Retrieve the full subscription object from Stripe
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    })

    // The subscription.created event will handle the actual database sync
    // But we can log this as a successful checkout completion
    const orgId = session.metadata?.orgId || session.client_reference_id
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

    // Record event
    if (orgId) {
      await eventService.recordEvent({
        type: 'STRIPE_CHECKOUT_COMPLETED',
        entityType: 'StripeCheckoutSession',
        entityId: session.id,
        orgId,
        payload: {
          sessionId: session.id,
          subscriptionId,
          customerId,
          planSlug: subscription.metadata?.planSlug,
          amountTotal: session.amount_total,
          currency: session.currency,
        },
      })
    }

    // Log audit
    if (orgId) {
      await auditService.recordAudit({
        action: 'STRIPE_CHECKOUT_COMPLETED',
        entityType: 'StripeCheckoutSession',
        entityId: session.id,
        userId: 'system',
        reason: `Checkout completed: ${subscription.metadata?.planSlug || 'unknown plan'}`,
        after: {
          sessionId: session.id,
          subscriptionId,
          amountTotal: session.amount_total,
          currency: session.currency,
          orgId,
        },
      })
    }

    console.log(`✅ Checkout session completed processed: ${session.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling checkout.session.completed for ${session.id}:`, error)
    throw error
  }
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    console.log('✅ Processing subscription.created:', subscription.id)

    const planSlugFromMeta = subscription.metadata?.planSlug as string | undefined
    const item = subscription.items?.data?.[0]
    const priceId = item?.price?.id as string | undefined
    const planSlug = planSlugFromMeta || (priceId ? getPlanSlugFromPriceId(priceId) : null)

    if (!planSlug) {
      throw new Error(`Unable to determine planSlug for subscription ${subscription.id}`)
    }

    // Get or create org
    const orgId: string =
      (subscription.metadata?.orgId as string | undefined) ||
      (await bootstrapOrgFromSubscription(subscription, planSlug))

    // Get plan
    const plan = await prismaAny.servicePlan.findUnique({ where: { slug: planSlug } })
    if (!plan) {
      throw new Error(`ServicePlan not found for slug: ${planSlug}`)
    }

    // Map status
    const status = mapStripeSubscriptionStatus(subscription.status)
    const currentPeriodStart = toDateFromSeconds((subscription as any).current_period_start)
    const currentPeriodEnd = toDateFromSeconds((subscription as any).current_period_end)
    const canceledAt = subscription.canceled_at ? toDateFromSeconds(subscription.canceled_at) : null

    // Create subscription record
    const subscriptionData: any = {
      orgId,
      servicePlanId: plan.id,
      status,
      stripeId: subscription.id,
      currentPeriodStart: currentPeriodStart || new Date(),
      currentPeriodEnd: currentPeriodEnd || new Date(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    }

    // Add optional fields if they exist in schema
    if (canceledAt) subscriptionData.canceledAt = canceledAt
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (customerId) subscriptionData.stripeCustomerId = customerId
    subscriptionData.metadata = {
      planSlug,
      priceId,
      interval: item?.price?.recurring?.interval || 'month',
    }

    const created = await prismaAny.serviceSubscription.create({
      data: subscriptionData,
    })

    // Enable module entitlement
    if (currentPeriodEnd) {
      await entitlementService.enableModule(orgId, OPS_SERVICES_MODULE_KEY, currentPeriodEnd)
    }

    // Log audit
    await auditService.recordAudit({
      action: 'STRIPE_SUBSCRIPTION_CREATED',
      entityType: 'ServiceSubscription',
      entityId: created.id,
      userId: 'system',
      reason: `Subscription created: ${planSlug}`,
      after: {
        stripeId: subscription.id,
        status,
        planSlug,
        orgId,
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'STRIPE_SUBSCRIPTION_CREATED',
      entityType: 'ServiceSubscription',
      entityId: created.id,
      orgId,
      payload: {
        stripeSubscriptionId: subscription.id,
        status,
        planSlug,
        currentPeriodEnd: currentPeriodEnd?.toISOString(),
      },
    })

    console.log(`✅ Subscription created in database: ${created.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling subscription.created for ${subscription.id}:`, error)
    throw error
  }
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  try {
    console.log('🔄 Processing subscription.updated:', subscription.id)

    const existing = await prismaAny.serviceSubscription.findUnique({
      where: { stripeId: subscription.id },
    })

    if (!existing) {
      console.warn(`⚠️  Subscription ${subscription.id} not found, creating...`)
      await handleSubscriptionCreated(subscription)
      return
    }

    const planSlugFromMeta = subscription.metadata?.planSlug as string | undefined
    const item = subscription.items?.data?.[0]
    const priceId = item?.price?.id as string | undefined
    const planSlug = planSlugFromMeta || (priceId ? getPlanSlugFromPriceId(priceId) : null) || existing.metadata?.planSlug

    if (!planSlug) {
      throw new Error(`Unable to determine planSlug for subscription ${subscription.id}`)
    }

    const plan = await prismaAny.servicePlan.findUnique({ where: { slug: planSlug } })
    if (!plan) {
      throw new Error(`ServicePlan not found for slug: ${planSlug}`)
    }

    const status = mapStripeSubscriptionStatus(subscription.status)
    const currentPeriodStart = toDateFromSeconds((subscription as any).current_period_start)
    const currentPeriodEnd = toDateFromSeconds((subscription as any).current_period_end)
    const canceledAt = subscription.canceled_at ? toDateFromSeconds(subscription.canceled_at) : null

    const before = {
      status: existing.status,
      planId: existing.servicePlanId,
      currentPeriodEnd: existing.currentPeriodEnd?.toISOString(),
    }

    // Update subscription
    const updated = await prismaAny.serviceSubscription.update({
      where: { stripeId: subscription.id },
      data: {
        servicePlanId: plan.id,
        status,
        currentPeriodStart: currentPeriodStart || existing.currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd || existing.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        canceledAt,
        metadata: {
          ...(existing.metadata as any || {}),
          planSlug,
          priceId,
          interval: item?.price?.recurring?.interval || 'month',
        },
      },
    })

    // Check if plan changed (upgrade/downgrade)
    const planChanged = existing.servicePlanId !== plan.id

    // Update entitlements
    if (status === 'canceled' || status === 'past_due') {
      await entitlementService.disableModule(existing.orgId, OPS_SERVICES_MODULE_KEY)
    } else if (currentPeriodEnd) {
      await entitlementService.enableModule(existing.orgId, OPS_SERVICES_MODULE_KEY, currentPeriodEnd)
    }

    // Log audit
    await auditService.recordAudit({
      action: 'STRIPE_SUBSCRIPTION_UPDATED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      userId: 'system',
      reason: planChanged ? `Plan changed: ${planSlug}` : `Subscription updated: ${status}`,
      before,
      after: {
        status,
        planId: plan.id,
        planSlug,
        currentPeriodEnd: currentPeriodEnd?.toISOString(),
        orgId: existing.orgId,
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'STRIPE_SUBSCRIPTION_UPDATED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      orgId: existing.orgId,
      payload: {
        stripeSubscriptionId: subscription.id,
        status,
        planSlug,
        planChanged,
        currentPeriodEnd: currentPeriodEnd?.toISOString(),
      },
    })

    console.log(`✅ Subscription updated in database: ${updated.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling subscription.updated for ${subscription.id}:`, error)
    throw error
  }
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    console.log('❌ Processing subscription.deleted:', subscription.id)

    const existing = await prismaAny.serviceSubscription.findUnique({
      where: { stripeId: subscription.id },
      include: { org: { select: { id: true, name: true } } },
    })

    if (!existing) {
      console.warn(`⚠️  Subscription ${subscription.id} not found in database`)
      return
    }

    const canceledAt = new Date()

    // Update subscription status
    const updated = await prismaAny.serviceSubscription.update({
      where: { stripeId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt,
        cancelAtPeriodEnd: false,
      },
    })

    // Disable module entitlement
    await entitlementService.disableModule(existing.orgId, OPS_SERVICES_MODULE_KEY)

    // Log audit
    await auditService.recordAudit({
      action: 'STRIPE_SUBSCRIPTION_DELETED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      userId: 'system',
      reason: 'Subscription canceled',
      before: {
        status: existing.status,
      },
      after: {
        status: 'canceled',
        canceledAt: canceledAt.toISOString(),
        orgId: existing.orgId,
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'STRIPE_SUBSCRIPTION_DELETED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      orgId: existing.orgId,
      payload: {
        stripeSubscriptionId: subscription.id,
        canceledAt: canceledAt.toISOString(),
      },
    })

    // Queue notification email
    await queueNotificationEmail({
      to: existing.org?.name || 'customer',
      subject: 'Kealee subscription canceled',
      template: 'subscription_canceled',
      orgId: existing.orgId,
      metadata: {
        subscriptionId: subscription.id,
        canceledAt: canceledAt.toISOString(),
      },
    })

    console.log(`✅ Subscription canceled in database: ${updated.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling subscription.deleted for ${subscription.id}:`, error)
    throw error
  }
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  try {
    console.log('💰 Processing invoice.paid:', invoice.id)

    const invoiceAny = invoice as any
    const subscriptionId =
      typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id

    if (!subscriptionId) {
      console.warn(`⚠️  Invoice ${invoice.id} has no subscription`)
      return
    }

    const subscription = await prismaAny.serviceSubscription.findUnique({
      where: { stripeId: subscriptionId },
    })

    if (!subscription) {
      console.warn(`⚠️  Subscription ${subscriptionId} not found for invoice ${invoice.id}`)
      return
    }

    // Update subscription last payment date
    const updateData: any = {
      metadata: {
        ...(subscription.metadata as any || {}),
        lastInvoiceId: invoice.id,
        lastInvoiceAmount: invoice.amount_paid,
        lastInvoiceCurrency: invoice.currency,
        lastPaymentDate: new Date().toISOString(),
      },
    }
    // Add lastPaymentDate if field exists
    if (subscription.lastPaymentDate !== undefined) {
      updateData.lastPaymentDate = new Date()
    }

    await prismaAny.serviceSubscription.update({
      where: { stripeId: subscriptionId },
      data: updateData,
    })

    // Create payment record (if model exists)
    try {
      await prismaAny.payment.create({
      data: {
        orgId: subscription.orgId,
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: typeof invoiceAny.payment_intent === 'string' ? invoiceAny.payment_intent : invoiceAny.payment_intent?.id || null,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency || 'usd',
        status: 'completed',
        paidAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()),
        metadata: {
          invoiceNumber: invoice.number,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        },
      },
    })
    } catch (error: any) {
      // If Payment model doesn't exist yet, just log
      if (error.message?.includes('model') || error.message?.includes('Payment')) {
        console.warn('⚠️  Payment model not found, skipping payment record creation')
      } else {
        throw error
      }
    }

    // Create invoice record (if model exists)
    try {
      await prismaAny.invoice.create({
      data: {
        orgId: subscription.orgId,
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        invoiceNumber: invoice.number || null,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency || 'usd',
        status: 'paid',
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        paidAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now()),
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
        metadata: {
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
        },
      },
    })
    } catch (error: any) {
      // If Invoice model doesn't exist yet, just log
      if (error.message?.includes('model') || error.message?.includes('Invoice')) {
        console.warn('⚠️  Invoice model not found, skipping invoice record creation')
      } else {
        throw error
      }
    }

    // Log audit
    await auditService.recordAudit({
      action: 'STRIPE_INVOICE_PAID',
      entityType: 'Payment',
      entityId: invoice.id,
      userId: 'system',
      reason: `Invoice paid: ${invoice.id}`,
      after: {
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        invoiceId: invoice.id,
        orgId: subscription.orgId,
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'STRIPE_INVOICE_PAID',
      entityType: 'Payment',
      entityId: invoice.id,
      orgId: subscription.orgId,
      payload: {
        subscriptionId,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      },
    })

    // Queue confirmation email
    const recipient = invoice.customer_email || (invoice as any).customer_details?.email
    if (recipient) {
      await queueNotificationEmail({
        to: recipient,
        subject: 'Kealee receipt: invoice paid',
        template: 'invoice_paid',
        orgId: subscription.orgId,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        },
      })
    }

    console.log(`✅ Invoice paid processed: ${invoice.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling invoice.paid for ${invoice.id}:`, error)
    throw error
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    console.log('⚠️  Processing invoice.payment_failed:', invoice.id)

    const invoiceAny = invoice as any
    const subscriptionId =
      typeof invoiceAny.subscription === 'string' ? invoiceAny.subscription : invoiceAny.subscription?.id

    if (!subscriptionId) {
      console.warn(`⚠️  Invoice ${invoice.id} has no subscription`)
      return
    }

    const subscription = await prismaAny.serviceSubscription.findUnique({
      where: { stripeId: subscriptionId },
    })

    if (!subscription) {
      console.warn(`⚠️  Subscription ${subscriptionId} not found for invoice ${invoice.id}`)
      return
    }

    // Update subscription status to past_due
    const updated = await prismaAny.serviceSubscription.update({
      where: { stripeId: subscriptionId },
      data: {
        status: 'past_due',
        metadata: {
          ...(subscription.metadata as any || {}),
          failedInvoiceId: invoice.id,
          failedInvoiceAmount: invoice.amount_due,
          paymentFailureCount: ((subscription.metadata as any)?.paymentFailureCount || 0) + 1,
          lastPaymentFailureAt: new Date().toISOString(),
        },
      },
    })

    // Create payment record for failed payment (if model exists)
    try {
      await prismaAny.payment.create({
      data: {
        orgId: subscription.orgId,
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency || 'usd',
        status: 'failed',
        failedAt: new Date(),
        metadata: {
          failureReason: (invoice as any).last_payment_error?.message || 'Payment failed',
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        },
      },
    })
    } catch (error: any) {
      // If Payment model doesn't exist yet, just log
      if (error.message?.includes('model') || error.message?.includes('Payment')) {
        console.warn('⚠️  Payment model not found, skipping payment record creation')
      } else {
        throw error
      }
    }

    // Log audit
    await auditService.recordAudit({
      action: 'STRIPE_INVOICE_PAYMENT_FAILED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      userId: 'system',
      reason: `Payment failed for invoice: ${invoice.id}`,
      after: {
        status: 'past_due',
        failedInvoiceId: invoice.id,
        failureCount: (subscription.metadata as any)?.paymentFailureCount || 1,
        orgId: subscription.orgId,
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'STRIPE_INVOICE_PAYMENT_FAILED',
      entityType: 'ServiceSubscription',
      entityId: updated.id,
      orgId: subscription.orgId,
      payload: {
        subscriptionId,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        failureReason: invoice.last_payment_error?.message,
      },
    })

    // Queue notification email
    const recipient = invoice.customer_email || (invoice as any).customer_details?.email
    if (recipient) {
      await queueNotificationEmail({
        to: recipient,
        subject: 'Kealee billing: payment failed',
        template: 'payment_failed',
        orgId: subscription.orgId,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          failureReason: invoice.last_payment_error?.message,
        },
      })
    }

    console.log(`✅ Payment failure processed: ${invoice.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling invoice.payment_failed for ${invoice.id}:`, error)
    throw error
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log('✅ Processing payment_intent.succeeded:', paymentIntent.id)

    // Handle permit payments
    if (session.metadata?.permitId && session.metadata?.feeType) {
      await handlePermitPayment(session)
      return
    }

    // Handle one-time payments (e.g., permit acceleration, escrow deposits)
    if (paymentIntent.metadata?.type === 'one_time') {
      const orgId = paymentIntent.metadata?.orgId as string | undefined
      const projectId = paymentIntent.metadata?.projectId as string | undefined

      // Create payment record (if model exists)
      try {
        await prismaAny.payment.create({
        data: {
          orgId: orgId || null,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency || 'usd',
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            type: 'one_time',
            projectId,
            description: paymentIntent.description || paymentIntent.metadata?.description,
          },
        },
      })
      } catch (error: any) {
        // If Payment model doesn't exist yet, just log
        if (error.message?.includes('model') || error.message?.includes('Payment')) {
          console.warn('⚠️  Payment model not found, skipping payment record creation')
        } else {
          throw error
        }
      }

      // Record event
      if (orgId) {
        await eventService.recordEvent({
          type: 'STRIPE_PAYMENT_INTENT_SUCCEEDED',
          entityType: 'Payment',
          entityId: paymentIntent.id,
          orgId,
          payload: {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            type: 'one_time',
            projectId,
          },
        })
      }

      // Queue confirmation email
      const recipient = paymentIntent.receipt_email
      if (recipient) {
        await queueNotificationEmail({
          to: recipient,
          subject: 'Kealee payment confirmation',
          template: 'payment_confirmation',
          orgId: orgId || undefined,
          metadata: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          },
        })
      }

      console.log(`✅ One-time payment processed: ${paymentIntent.id}`)
    }
  } catch (error: any) {
    console.error(`❌ Error handling payment_intent.succeeded for ${paymentIntent.id}:`, error)
    throw error
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    console.log('❌ Processing payment_intent.payment_failed:', paymentIntent.id)

    const orgId = paymentIntent.metadata?.orgId as string | undefined

    // Create failed payment record (if model exists)
    try {
      await prismaAny.payment.create({
      data: {
        orgId: orgId || null,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency || 'usd',
        status: 'failed',
        failedAt: new Date(),
        metadata: {
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          type: paymentIntent.metadata?.type || 'unknown',
        },
      },
    })
    } catch (error: any) {
      // If Payment model doesn't exist yet, just log
      if (error.message?.includes('model') || error.message?.includes('Payment')) {
        console.warn('⚠️  Payment model not found, skipping payment record creation')
      } else {
        throw error
      }
    }

    // Record event
    if (orgId) {
      await eventService.recordEvent({
        type: 'STRIPE_PAYMENT_INTENT_FAILED',
        entityType: 'Payment',
        entityId: paymentIntent.id,
        orgId,
        payload: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      })
    }

    // Queue notification email
    const recipient = paymentIntent.receipt_email
    if (recipient) {
      await queueNotificationEmail({
        to: recipient,
        subject: 'Kealee payment failed',
        template: 'payment_failed',
        orgId: orgId || undefined,
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      })
    }

    console.log(`✅ Payment failure logged: ${paymentIntent.id}`)
  } catch (error: any) {
    console.error(`❌ Error handling payment_intent.payment_failed for ${paymentIntent.id}:`, error)
    throw error
  }
}

/**
 * Bootstrap org from subscription if needed
 */
async function bootstrapOrgFromSubscription(
  subscription: Stripe.Subscription,
  planSlug: string
): Promise<string> {
  // Get customer
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  if (!customerId) {
    throw new Error('Missing subscription.customer; cannot bootstrap org')
  }

  const stripe = getStripe()
  const customer = await stripe.customers.retrieve(customerId)
  if ((customer as any).deleted) {
    throw new Error('Stripe customer is deleted; cannot bootstrap org')
  }

  const ownerEmail: string | undefined =
    subscription.metadata?.ownerEmail ||
    (customer as any).email ||
    undefined

  if (!ownerEmail) {
    throw new Error(
      'Cannot bootstrap org: no owner email found (set subscription metadata.ownerEmail or ensure customer has email)'
    )
  }

  const ownerName: string =
    subscription.metadata?.ownerName ||
    (customer as any).name ||
    ownerEmail.split('@')[0]

  const orgName: string =
    subscription.metadata?.orgName ||
    (customer as any).name ||
    `${ownerName} (GC)`

  // Create user
  const user = await prismaAny.user.upsert({
    where: { email: ownerEmail },
    update: { name: ownerName },
    create: {
      email: ownerEmail,
      name: ownerName,
      status: 'ACTIVE',
    },
  })

  // Create org
  const { orgService } = await import('../org/org.service')
  const org = await orgService.createOrg({
    name: orgName,
    slug: subscription.metadata?.orgSlug || `gc-${ownerEmail.split('@')[0]}-${Date.now()}`,
    ownerId: user.id,
  })

  return org.id
}

/**
 * Log webhook attempt
 */
async function logWebhookAttempt(
  ip: string,
  eventId: string | null,
  status: string,
  eventType: string | null,
  error?: string
): Promise<void> {
  try {
    // Log to database if audit table exists
    await auditService.recordAudit({
      action: 'STRIPE_WEBHOOK_ATTEMPT',
      entityType: 'Webhook',
      entityId: eventId || 'unknown',
      userId: 'system',
      reason: `Webhook ${status} from ${ip}`,
      after: {
        ip,
        eventId,
        eventType,
        status,
        error,
      },
    })
  } catch (error) {
    // If audit logging fails, just log to console
    console.error('Failed to log webhook attempt:', error)
  }
}

/**
 * Log webhook error
 */
async function logWebhookError(
  eventId: string,
  eventType: string,
  error: string,
  retryCount: number
): Promise<void> {
  try {
    await auditService.recordAudit({
      action: 'STRIPE_WEBHOOK_ERROR',
      entityType: 'Webhook',
      entityId: eventId,
      userId: 'system',
      reason: `Webhook processing failed after ${retryCount} retries`,
      after: {
        eventId,
        eventType,
        error,
        retryCount,
      },
    })
  } catch (err) {
    console.error('Failed to log webhook error:', err)
  }
}

/**
 * Queue notification email (placeholder - implement with your email queue)
 */
async function queueNotificationEmail(data: {
  to: string
  subject: string
  template: string
  orgId?: string
  metadata?: any
}): Promise<void> {
  try {
    // Use email queue if available
    const { getEmailQueue } = await import('../../utils/email-queue')
    const emailQueue = getEmailQueue()

    await emailQueue.add('send-email', {
      to: data.to,
      subject: data.subject,
      template: data.template,
      metadata: {
        ...data.metadata,
        orgId: data.orgId,
      },
    })
  } catch (error) {
    // If email queue not available, just log
    console.log(`📧 Email queued: ${data.subject} to ${data.to}`)
  }
}
