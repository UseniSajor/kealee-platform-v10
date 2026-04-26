/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe (checkout.session.completed, charge.failed, etc.)
 * Coordinates with intake system to update funnel status after payment
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import Stripe from 'stripe'
import { prisma } from '@kealee/database'
import { RedisClient } from '@kealee/redis'
// Email jobs are published directly to BullMQ; the worker consumes them independently.
import { Queue as BullQueue } from 'bullmq'
import IORedis from 'ioredis'

let _emailQ: BullQueue | null = null
function getEmailQ(): BullQueue | null {
  if (_emailQ) return _emailQ
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    const conn = new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: true })
    _emailQ = new BullQueue('email', { connection: conn })
  } catch { /* Redis unavailable — emails skipped */ }
  return _emailQ
}

const emailQueue = {
  sendTemplatedEmail: async (to: string, template: string, templateData: Record<string, any>) => {
    const q = getEmailQ()
    if (!q) return
    await q.add('send', { to, template, templateData })
  },
}
import { getProjectExecutionQueue } from '../../utils/project-execution-queue'

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
  redis: any,
  logger: any
): Promise<void> {
  const metadata = session.metadata || {}
  const source = metadata.source // 'concept', 'zoning', 'estimation', 'permits'
  const intakeId = metadata.intakeId
  const funnelSessionId = metadata.funnelSessionId
  const tier = metadata.packageTier

  logger.info({ source, intakeId, sessionId: session.id }, 'Payment completed')

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

  // Create ProjectOutput and enqueue execution job
  if (intakeId && source) {
    const typeMap: Record<string, 'design' | 'permit' | 'estimate' | 'concept'> = {
      concept:    'concept',
      zoning:     'design',
      estimation: 'estimate',
      permits:    'permit',
    }
    const outputType = typeMap[source]
    if (outputType) {
      try {
        const output = await (prisma as any).projectOutput.create({
          data: {
            intakeId,
            type: outputType,
            status: 'pending',
            metadata: { source, tier, sessionId: session.id },
          },
        })
        const queue = getProjectExecutionQueue()
        const orgId = metadata.orgId ?? undefined
        const projectId = metadata.projectId ?? undefined
        await queue.add('execute', {
          outputId: output.id,
          type: outputType,
          intakeId,
          projectId,
          metadata: { source, tier, sessionId: session.id, packageTier: tier, orgId },
        }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
        logger.info({ outputId: output.id, type: outputType, intakeId }, 'ProjectOutput created and execution enqueued')
      } catch (err: any) {
        logger.error({ err: err.message, intakeId, source }, 'Failed to create ProjectOutput or enqueue execution — rethrowing for Stripe retry')
        throw err
      }
    }
  }

  // Update funnel with revenue
  if (funnelSessionId) {
    await updateFunnelRevenue(funnelSessionId, session.amount_total || 0)
  }

  // Queue payment confirmation email
  if (session.customer_email) {
    try {
      await emailQueue.sendTemplatedEmail(session.customer_email, 'concept_package_confirmation', {
        customerName: session.customer_details?.name || 'there',
        packageName: getPackageName(source, tier),
        packageTier: tier || 'Standard',
        amount: ((session.amount_total || 0) / 100).toFixed(2),
      })
      logger.info({ email: session.customer_email, sessionId: session.id }, 'Payment confirmation email queued')
    } catch (err) {
      logger.error({ email: session.customer_email, err }, 'Failed to queue payment confirmation email')
    }
  }
}

/**
 * Handle charge.failed event
 * Updates intake status and tracks failed payment
 */
async function handleChargeFailed(
  charge: Stripe.Charge,
  redis: any,
  logger: any
): Promise<void> {
  const metadata = charge.metadata || {}
  const source = metadata.source
  const intakeId = metadata.intakeId
  const funnelSessionId = metadata.funnelSessionId

  logger.error({ source, intakeId, failureMessage: charge.failure_message, chargeId: charge.id }, 'Payment failed')

  // Queue payment failure notification email
  if (charge.receipt_email) {
    try {
      await emailQueue.sendTemplatedEmail(charge.receipt_email, 'gc_payment_failed', {
        gcName: charge.billing_details?.name || 'there',
        invoiceNumber: charge.invoice || 'Unknown',
        billingPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'}/billing`,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'}/invoices/${charge.invoice}`,
      })
      logger.info({ email: charge.receipt_email, chargeId: charge.id }, 'Payment failure notification email queued')
    } catch (err) {
      logger.error({ email: charge.receipt_email, err }, 'Failed to queue payment failure email')
    }
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
  subscription: Stripe.Subscription,
  logger: any
): Promise<void> {
  logger.info({ subscriptionId: subscription.id }, 'Subscription updated')
  // TODO: Handle subscription updates (price changes, tier upgrades, etc.)
}

/**
 * Handle customer.subscription.deleted event
 * For subscription cancellations
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  logger: any
): Promise<void> {
  logger.info({ subscriptionId: subscription.id }, 'Subscription deleted')
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

/**
 * Map source and tier to display package name for email
 */
function getPackageName(source: string | undefined, tier: string | undefined): string {
  const packageMap: Record<string, Record<string, string>> = {
    concept: {
      starter: 'Concept Engine Starter',
      standard: 'Concept Engine Standard',
      premium: 'Concept Engine Premium',
    },
    permits: {
      simple: 'Permit Filing - Simple',
      package: 'Permit Filing - Complete Package',
      coordination: 'Permit Coordination',
      expediting: 'Expedited Permit Service',
    },
    zoning: {
      analysis: 'Zoning Analysis',
      variance: 'Variance Application',
      appeal: 'Appeal Process',
    },
    estimation: {
      quick: 'Quick Estimate',
      detailed: 'Detailed Estimate',
      professional: 'Professional Cost Estimate',
    },
  }

  if (source && tier && packageMap[source]) {
    return packageMap[source][tier] || 'Service Package'
  }

  return `${source || 'Premium'} Service Package`
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
          fastify.log.error({ err }, 'Stripe webhook signature verification failed')
          return reply.status(400).send({
            error: 'Webhook signature verification failed',
          })
        }

        fastify.log.info({ eventType: event.type }, 'Processing Stripe webhook event')

        // Handle events
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, redis, fastify.log)
            break

          case 'charge.failed':
            await handleChargeFailed(event.data.object as Stripe.Charge, redis, fastify.log)
            break

          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, fastify.log)
            break

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, fastify.log)
            break

          default:
            fastify.log.info({ eventType: event.type }, 'Unhandled webhook event type')
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
