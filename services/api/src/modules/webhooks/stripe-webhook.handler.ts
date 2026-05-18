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
import { updateReadinessState } from '../orchestration/chain-gating'

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
  // Normalise source: concept-intake.routes.ts sets "concept-package"; treat it as "concept"
  const rawSource = metadata.source
  const source = rawSource === 'concept-package' ? 'concept' : rawSource // 'concept', 'zoning', 'estimation', 'permits'
  const intakeId = metadata.intakeId
  const funnelSessionId = metadata.funnelSessionId
  const tier = metadata.packageTier
  const projectId = metadata.projectId

  logger.info({ source, intakeId, sessionId: session.id }, 'Payment completed')

  // Update intake based on source
  if (source === 'concept') {
    // Concept intakes are created by conceptIntakeRoutes into permitServiceLead.
    // Try permitServiceLead first; fall back to conceptIntake for legacy records.
    const updated = await (prisma as any).permitServiceLead?.updateMany?.({
      where: { id: intakeId },
      data: { status: 'PAID', paidAt: new Date() },
    }).catch(() => ({ count: 0 })) ?? { count: 0 }
    if (!updated.count) {
      await (prisma as any).conceptIntake?.updateMany?.({
        where: { id: intakeId },
        data: { status: 'PAID', paidAt: new Date(), checkoutInitiatedAt: new Date() },
      }).catch(() => {})
    }

    // Track conversion event
    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'CONCEPT_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        tier,
      })
    }

    // Advance readiness state: concept paid → ready for zoning review
    if (projectId) {
      await updateReadinessState(projectId, { conceptCompleted: true }).catch((e: any) =>
        logger.warn({ err: e.message, projectId }, 'updateReadinessState failed (concept) — non-fatal')
      )
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

    // Advance readiness state: zoning paid → ready for estimation
    if (projectId) {
      await updateReadinessState(projectId, { zoningCompleted: true }).catch((e: any) =>
        logger.warn({ err: e.message, projectId }, 'updateReadinessState failed (zoning) — non-fatal')
      )
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

    // Advance readiness state: estimation paid → ready for permit review
    if (projectId) {
      await updateReadinessState(projectId, { estimationCompleted: true }).catch((e: any) =>
        logger.warn({ err: e.message, projectId }, 'updateReadinessState failed (estimation) — non-fatal')
      )
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

    // Advance readiness state: permit paid → ready for checkout
    if (projectId) {
      await updateReadinessState(projectId, { permitReadyForCheckout: true }).catch((e: any) =>
        logger.warn({ err: e.message, projectId }, 'updateReadinessState failed (permits) — non-fatal')
      )
    }
  } else if (source === 'public_intake') {
    await (prisma as any).publicIntakeLead?.updateMany?.({
      where: { id: intakeId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripeSessionId: session.id,
      },
    }).catch((err: any) => {
      logger.warn({ err: err.message, intakeId }, 'Failed to update publicIntakeLead status (non-fatal)')
    })

    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'PUBLIC_INTAKE_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
        projectPath: metadata.projectPath,
      })
    }
  } else if (source === 'bundle') {
    // Full-Stack Design Bundle: concept + estimate + permit
    // No single intake record — create 3 ProjectOutput records and enqueue 3 execution jobs
    const customerEmail = metadata.customerEmail ?? session.customer_email ?? ''
    const customerName = metadata.customerName ?? session.customer_details?.name ?? ''
    const bundleMeta = { source: 'bundle', sessionId: session.id, customerEmail, customerName }
    const bundleTypes: Array<'concept' | 'estimate' | 'permit'> = ['concept', 'estimate', 'permit']

    for (const bundleType of bundleTypes) {
      try {
        const output = await (prisma as any).projectOutput.create({
          data: {
            intakeId: session.id, // Stripe session ID as bundle reference
            type: bundleType,
            status: 'pending',
            metadata: bundleMeta,
          },
        })
        const queue = getProjectExecutionQueue()
        await queue.add('execute', {
          outputId: output.id,
          type: bundleType,
          intakeId: session.id,
          metadata: bundleMeta,
        }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
        logger.info({ outputId: output.id, type: bundleType, sessionId: session.id }, 'Bundle ProjectOutput created and enqueued')
      } catch (err: any) {
        logger.error({ err: err.message, bundleType, sessionId: session.id }, 'Failed to create bundle ProjectOutput — rethrowing for Stripe retry')
        throw err
      }
    }

    if (funnelSessionId) {
      await trackConversionEvent(redis, funnelSessionId, 'BUNDLE_PAID', {
        sessionId: session.id,
        amount: session.amount_total,
      })
    }
  }

  // Create ProjectOutput and enqueue execution job (single-source intakes only; bundle handled above)
  if (intakeId && source) {
    const typeMap: Record<string, 'design' | 'permit' | 'estimate' | 'concept'> = {
      concept:    'concept',
      zoning:     'design',
      estimation: 'estimate',
      permits:    'permit',
      public_intake: 'design',
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
  // Deliverables are accessed through the Owner Portal — email contains payment receipt + login details only
  if (session.customer_email) {
    try {
      const portalUrl = process.env.OWNER_PORTAL_URL ?? process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com'
      await emailQueue.sendTemplatedEmail(session.customer_email, 'payment_confirmation', {
        customerName: session.customer_details?.name || metadata.customerName || 'there',
        packageName: getPackageName(source, tier),
        amount: ((session.amount_total || 0) / 100).toFixed(2),
        portalUrl,
        loginEmail: session.customer_email,
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
  if (source === 'bundle') return 'Kealee Full-Stack Design Bundle'

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

  // Scope a raw-buffer content type parser to just this plugin so it doesn't
  // override the JSON parser for the rest of the API.
  fastify.register(async (scope) => {
    scope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req: FastifyRequest, body: Buffer, done: (err: Error | null, body?: Buffer) => void) => {
        done(null, body)
      }
    )

  scope.post(
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

        // request.body is a raw Buffer — required for signature verification
        const rawBody = request.body as Buffer

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
  }) // end scoped raw-body plugin

  fastify.log.info('Stripe webhook handler registered')
}
