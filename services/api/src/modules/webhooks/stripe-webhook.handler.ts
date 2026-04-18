/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe (checkout.session.completed, charge.failed, etc.)
 * Coordinates with intake system to update funnel status after payment
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import Stripe from 'stripe'
import { prisma } from '@kealee/database'
import { RedisClient } from '@kealee/redis'

// ============================================================================
// TYPES
// ============================================================================

interface StripeWebhookEvent {
  type: string
  data: {
    object: any
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Handle checkout.session.completed event
 * Updates intake status and creates conversion funnel entry
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  redis: any
): Promise<void> {
  const metadata = session.metadata || {}
  const source = metadata.source // 'concept', 'zoning', 'estimation', 'permits'
  const intakeId = metadata.intakeId
  const funnelSessionId = metadata.funnelSessionId
  const tier = metadata.packageTier

  console.log(`✅ Payment completed: ${source} intake #${intakeId}`)

  // Update intake based on source
  if (source === 'concept') {
    await prisma.conceptIntake.updateMany({
      where: { id: intakeId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        checkoutInitiatedAt: new Date(),
      },
    })

    // Track conversion event
    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'CONCEPT_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        tier,
      })
    }
  } else if (source === 'zoning') {
    await prisma.zoningIntake.updateMany({
      where: { id: intakeId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        checkoutInitiatedAt: new Date(),
      },
    })

    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'ZONING_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        tier,
      })
    }
  } else if (source === 'estimation') {
    await prisma.estimationIntake.updateMany({
      where: { id: intakeId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        checkoutInitiatedAt: new Date(),
      },
    })

    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'ESTIMATION_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        tier,
      })
    }
  } else if (source === 'permits') {
    await prisma.permitIntake.updateMany({
      where: { id: intakeId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        checkoutInitiatedAt: new Date(),
      },
    })

    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'PERMIT_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        tier,
      })
    }
  }

  // Update funnel with revenue
  if (funnelSessionId) {
    await updateFunnelRevenue(funnelSessionId, session.amount_total || 0)
  }

  // Send notification email
  if (session.customer_email) {
    // Queue email notification job
    console.log(`📧 Sending payment confirmation email to ${session.customer_email}`)
    // TODO: Queue job using BullMQ or similar
    // await emailQueue.add('payment-confirmation', { email: session.customer_email, sessionId: session.id })
  }
}

/**
 * Handle charge.failed event
 * Updates intake status and tracks failed payment
 */
async function handleChargeFailed(
  charge: Stripe.Charge,
  redis: any
): Promise<void> {
  const metadata = charge.metadata || {}
  const source = metadata.source
  const intakeId = metadata.intakeId
  const funnelSessionId = metadata.funnelSessionId

  console.error(`❌ Payment failed: ${source} intake #${intakeId} - ${charge.failure_message}`)

  // Send notification email to customer
  if (charge.receipt_email) {
    console.log(`📧 Sending payment failure notification to ${charge.receipt_email}`)
    // TODO: Queue email notification
  }

  // Track failure event
  if (funnelSessionId) {
    await trackConversionEvent(redis, funnelSessionId, 'PAYMENT_FAILED', {
      chargeId: charge.id,
      reason: charge.failure_message,
      failureCode: charge.failure_code,
    })
  }
}

/**
 * Handle customer.subscription.updated event
 * For recurring billing scenarios (future use)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log(`📋 Subscription updated: ${subscription.id}`)
  // TODO: Handle subscription updates (price changes, tier upgrades, etc.)
}

/**
 * Handle customer.subscription.deleted event
 * For subscription cancellations
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log(`📋 Subscription deleted: ${subscription.id}`)
  // TODO: Handle subscription cancellations
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Track a conversion event in the funnel
 */
async function trackConversionEvent(
  redis: any,
  funnelSessionId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString()

  // Store event in Redis
  const eventKey = `analytics:event:${funnelSessionId}:${event}`
  await redis.setex(
    eventKey,
    86400 * 30, // 30-day retention
    JSON.stringify({
      event,
      timestamp,
      metadata,
    })
  )

  // Add to session event list
  const sessionKey = `analytics:session:${funnelSessionId}`
  const sessionData = await redis.get(sessionKey)
  const existingEvents = sessionData ? JSON.parse(sessionData) : []

  await redis.setex(
    sessionKey,
    86400 * 30,
    JSON.stringify([
      ...existingEvents,
      {
        event,
        timestamp,
        metadata,
      },
    ])
  )
}

/**
 * Update funnel revenue after payment
 */
async function updateFunnelRevenue(funnelSessionId: string, amount: number): Promise<void> {
  const funnel = await prisma.conversionFunnel.findFirst({
    where: { funnelSessionId },
  })

  if (funnel) {
    await prisma.conversionFunnel.update({
      where: { funnelSessionId },
      data: {
        totalRevenue: (funnel.totalRevenue || 0) + amount,
      },
    })
  }
}

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

/**
 * POST /webhooks/stripe
 * Stripe webhook endpoint for handling payment events
 * Requires raw body for signature verification
 */
export async function registerStripeWebhookHandler(fastify: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
  })

  const redis = await RedisClient.getInstance()

  fastify.post(
    '/webhooks/stripe',
    {
      // Raw body required for Stripe signature verification
      bodyLimit: 1000000, // 1MB
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get Stripe signature from headers
        const sig = request.headers['stripe-signature'] as string

        if (!sig) {
          return reply.status(400).send({
            error: 'Missing signature',
          })
        }

        // Get raw body for verification
        const rawBody = (request as any).rawBody || request.body

        // Verify webhook signature
        let event: StripeWebhookEvent
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET || ''
          ) as StripeWebhookEvent
        } catch (err: any) {
          console.error(`⚠️  Webhook signature verification failed: ${err.message}`)
          return reply.status(400).send({
            error: 'Webhook signature verification failed',
          })
        }

        console.log(`🔔 Stripe webhook: ${event.type}`)

        // Handle events
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, redis)
            break

          case 'charge.failed':
            await handleChargeFailed(event.data.object as Stripe.Charge, redis)
            break

          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
            break

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
            break

          default:
            console.log(`ℹ️  Unhandled webhook event: ${event.type}`)
        }

        // Acknowledge receipt
        return reply.status(200).send({
          received: true,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          error: 'Webhook processing failed',
        })
      }
    }
  )

  fastify.log.info('Stripe webhook handler registered')
}
