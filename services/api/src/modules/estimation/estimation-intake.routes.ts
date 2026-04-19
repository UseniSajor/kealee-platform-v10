/**
 * services/api/src/modules/estimation/estimation-intake.routes.ts
 *
 * Public estimation intake + Stripe checkout — no auth required.
 * Wrapper for /public/estimation endpoints at /api/v1/estimation path
 *
 * POST /estimation/intake            — save intake, return intakeId
 * POST /estimation/checkout          — create Stripe checkout session
 * GET  /estimation/intake/:id        — get intake status (polling)
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { RedisClient } from '@kealee/redis'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' })

// ── Estimation tiers ──────────────────────────────────────────────────────────────
const ESTIMATION_TIERS = {
  cost_estimate: {
    name: 'Detailed Cost Estimate',
    amount: 59500, // $595 in cents
    turnaround: 3,
    description: 'Human-reviewed, trade-by-trade breakdown validated against RSMeans',
  },
  certified_estimate: {
    name: 'Certified Cost Estimate',
    amount: 185000, // $1,850 in cents
    turnaround: 5,
    description: 'Notarized licensed estimator sign-off, full RSMeans source documentation',
  },
  bundle: {
    name: 'Estimate + Permit Bundle',
    amount: 110000, // $1,100 in cents
    turnaround: 5,
    description: 'Detailed cost estimate plus permit package preparation',
  },
} as const

type EstimationTier = keyof typeof ESTIMATION_TIERS

// ── Schemas ───────────────────────────────────────────────────────────────────
const IntakeSchema = z.object({
  project: z.object({
    scopeDetail: z.string().optional(),
    projectStage: z.string().optional(),
    projectScope: z.string().optional(),
    estimatedBudget: z.number().optional(),
  }).optional(),
  contact: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  description: z.string().min(10),
  hasDesignDrawings: z.boolean().optional(),
  tierPreference: z.enum(['cost_estimate', 'certified_estimate', 'bundle']).optional(),
})

const CheckoutSchema = z.object({
  intakeId: z.string(),
  tier: z.enum(['cost_estimate', 'certified_estimate', 'bundle']),
  email: z.string().email().optional(),
})

export async function estimationIntakeRoutes(fastify: FastifyInstance) {
  const redis = await RedisClient.getInstance()

  // ── POST /estimation/intake ──────────────────────────────────────────────────
  fastify.post<{ Body: z.infer<typeof IntakeSchema> }>('/intake', async (request, reply) => {
    try {
      const body = IntakeSchema.parse(request.body)

      // Generate unique intakeId
      const intakeId = `est_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const funnelSessionId = (request.cookies as any)?.funnelSessionId || `fs_${Date.now()}`

      // Store intake in Redis with 7-day TTL
      await redis.setex(
        `estimation_intake:${intakeId}`,
        86400 * 7,
        JSON.stringify({
          intakeId,
          funnelSessionId,
          contact: body.contact,
          project: body.project,
          description: body.description,
          hasDesignDrawings: body.hasDesignDrawings,
          tierPreference: body.tierPreference || 'cost_estimate',
          createdAt: new Date().toISOString(),
        })
      )

      fastify.log.info({
        event: 'estimation.intake.submitted',
        intakeId,
        email: body.contact.email,
      })

      return reply.status(201).send({
        intakeId,
        message: 'Intake received. Proceed to checkout.',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: error.errors,
        })
      }
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'INTAKE_ERROR',
        message: sanitizeErrorMessage((error as Error).message),
      })
    }
  })

  // ── POST /estimation/checkout ────────────────────────────────────────────────
  fastify.post<{ Body: z.infer<typeof CheckoutSchema> }>('/checkout', async (request, reply) => {
    try {
      const { intakeId, tier, email } = CheckoutSchema.parse(request.body)

      // Validate tier
      if (!(tier in ESTIMATION_TIERS)) {
        return reply.status(400).send({
          error: 'INVALID_TIER',
          message: `Tier must be one of: ${Object.keys(ESTIMATION_TIERS).join(', ')}`,
        })
      }

      // Retrieve intake to validate
      const intakeData = await redis.get(`estimation_intake:${intakeId}`).catch(() => null)
      if (!intakeData) {
        return reply.status(404).send({
          error: 'INTAKE_NOT_FOUND',
          message: 'Intake session expired or does not exist',
        })
      }

      const intake = JSON.parse(intakeData)
      const packageInfo = ESTIMATION_TIERS[tier]
      const customerEmail = email || intake.contact?.email

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: packageInfo.name,
                description: packageInfo.description,
              },
              unit_amount: packageInfo.amount,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.APP_URL || 'https://kealee.com'}/estimate/success?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'https://kealee.com'}/estimate/checkout?cancelled=true`,
        metadata: {
          source: 'estimation-package',
          packageTier: tier,
          packageName: packageInfo.name,
          intakeId,
          funnelSessionId: intake.funnelSessionId,
          customerEmail: customerEmail,
        },
      })

      // Store session mapping
      await redis.setex(
        `estimation_session:${session.id}`,
        3600, // 1 hour TTL
        JSON.stringify({
          intakeId,
          tier,
          createdAt: new Date().toISOString(),
        })
      )

      fastify.log.info({
        event: 'estimation.checkout.initiated',
        intakeId,
        sessionId: session.id,
        tier,
        email: customerEmail,
      })

      return reply.send({
        sessionId: session.id,
        url: session.url,
        amount: packageInfo.amount,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: error.errors,
        })
      }
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'CHECKOUT_ERROR',
        message: sanitizeErrorMessage((error as Error).message),
      })
    }
  })

  // ── GET /estimation/intake/:intakeId ─────────────────────────────────────────
  fastify.get<{ Params: { intakeId: string } }>('/intake/:intakeId', async (request, reply) => {
    try {
      const { intakeId } = request.params
      const intakeData = await redis.get(`estimation_intake:${intakeId}`).catch(() => null)

      if (!intakeData) {
        return reply.status(404).send({
          error: 'INTAKE_NOT_FOUND',
          message: 'Intake not found or expired',
        })
      }

      const intake = JSON.parse(intakeData)
      return reply.send({
        intakeId,
        status: 'pending',
        intake: {
          contact: intake.contact,
          description: intake.description,
          createdAt: intake.createdAt,
        },
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'STATUS_ERROR',
        message: sanitizeErrorMessage((error as Error).message),
      })
    }
  })

  fastify.log.info('✅ Estimation intake routes registered at /api/v1/estimation')
}
