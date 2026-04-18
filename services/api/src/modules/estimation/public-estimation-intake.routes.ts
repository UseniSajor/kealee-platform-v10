/**
 * Public Estimation Intake Routes
 * Consumer-facing API for cost estimation intake and checkout
 * Pattern: Same as concept intake, adapted for estimation service
 * Routes: /estimation/intake (public), /estimation/checkout (public)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { RedisClient } from '@kealee/redis'
import {
  EstimationIntakeSchema,
  EstimationIntakeResponseSchema,
  type EstimationIntake,
  type EstimationIntakeResponse,
} from '@kealee/intake/schemas'

// Pricing model for estimation tiers
const ESTIMATION_PACKAGE_PRICES = {
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
    amount: 110000, // $1,100 (starting) in cents
    turnaround: 5,
    description: 'Detailed cost estimate plus permit package preparation',
  },
} as const

/**
 * Score estimation lead based on intake data
 * Returns readiness state and recommended tier
 */
function scoreEstimationLead(data: EstimationIntake): {
  total: number
  tier: keyof typeof ESTIMATION_PACKAGE_PRICES
  readinessState: string
  flags: Record<string, boolean | number>
} {
  let score = 0
  const flags = {
    requiresArchitect: data.requiresArchitecturalReview ?? false,
    requiresEngineer: data.requiresEngineeringReview ?? false,
    hasDesignDrawings: data.hasDesignDrawings,
    hasContractorFeedback: data.hasContractorFeedback ?? false,
  }

  // Scope completeness (0-30 points)
  if (data.project.scopeDetail === 'construction_documents') {
    score += 30
  } else if (data.project.scopeDetail === 'design_drawing') {
    score += 25
  } else if (data.project.scopeDetail === 'schematic_drawing') {
    score += 20
  } else if (data.project.scopeDetail === 'sketch') {
    score += 10
  }

  // Project stage (0-20 points)
  if (['construction_documents', 'bidding', 'pricing'].includes(data.project.projectStage)) {
    score += 20
  } else if (['design_development'].includes(data.project.projectStage)) {
    score += 15
  } else if (['schematic'].includes(data.project.projectStage)) {
    score += 10
  }

  // Contact completeness (0-20 points)
  if (data.contact.email && data.contact.phone && data.contact.name) {
    score += 15
  } else if (data.contact.email) {
    score += 10
  }

  // Project characteristics (0-20 points)
  if (data.project.projectScope === 'interior_remodel' || data.project.projectScope === 'exterior_renovation') {
    score += 15
  } else if (data.project.projectScope === 'addition' || data.project.projectScope === 'mep_upgrade') {
    score += 12
  }

  // Budget info (0-10 points)
  if (data.project.estimatedBudget) {
    score += 5
  }

  // Tier recommendation based on score
  let tier: keyof typeof ESTIMATION_PACKAGE_PRICES = 'cost_estimate'
  let readinessState = 'NEEDS_MORE_INFO'

  if (score >= 75) {
    readinessState = 'READY_FOR_ESTIMATE'
    tier = data.tierPreference ?? 'certified_estimate' // Higher-confidence gets certified
  } else if (score >= 50) {
    readinessState = 'READY_FOR_ESTIMATE'
    tier = data.tierPreference ?? 'cost_estimate'
  }

  return { total: score, tier, readinessState, flags }
}

/**
 * Register public estimation intake routes
 */
export async function registerPublicEstimationRoutes(fastify: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
  })

  const redis = await RedisClient.getInstance()

  /**
   * POST /estimation/intake
   * Public endpoint: No auth required
   * Validates estimation intake, scores lead, prepares for checkout
   */
  fastify.post<{ Body: EstimationIntake }>('/estimation/intake', async (request, reply) => {
    try {
      // Validate intake
      const validatedIntake = EstimationIntakeSchema.parse(request.body)

      // Score lead
      const scoring = scoreEstimationLead(validatedIntake)

      // Generate unique IDs
      const intakeId = `est_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const funnelSessionId = (request.cookies as any)?.funnelSessionId || `fs_${Date.now()}`

      // Store intake in Redis with 7-day TTL
      await redis.setex(
        `estimation_intake:${intakeId}`,
        86400 * 7,
        JSON.stringify({
          ...validatedIntake,
          intakeId,
          funnelSessionId,
          scoring,
          createdAt: new Date().toISOString(),
        })
      )

      // Log intake
      fastify.log.info({
        event: 'estimation.intake.submitted',
        intakeId,
        score: scoring.total,
        tier: scoring.tier,
        email: validatedIntake.contact.email,
      })

      const response: EstimationIntakeResponse = {
        intakeId,
        leadScore: scoring.total,
        tier: scoring.tier,
        route: scoring.total >= 75 ? 'immediate' : scoring.total >= 50 ? 'standard' : 'requires_followup',
        readinessState: scoring.readinessState as any,
        flags: {
          requiresArchitect: scoring.flags.requiresArchitect as boolean,
          requiresEngineer: scoring.flags.requiresEngineer as boolean,
          complexityLevel: scoring.flags.requiresArchitect ? 'high' : 'medium',
          estimatedTurnaround: ESTIMATION_PACKAGE_PRICES[scoring.tier].turnaround,
        },
        estimatedPrice: ESTIMATION_PACKAGE_PRICES[scoring.tier].amount,
        nextStep: 'Ready for checkout. Choose your estimate package and proceed to payment.',
      }

      return reply.status(201).send(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          details: error.errors,
        })
      }
      fastify.log.error(error)
      throw error
    }
  })

  /**
   * POST /estimation/checkout
   * Public endpoint: No auth required
   * Creates Stripe checkout session for estimation package
   */
  fastify.post<{ Body: { intakeId: string; tier: string; email: string } }>(
    '/estimation/checkout',
    async (request, reply) => {
      try {
        const { intakeId, tier, email } = request.body

        // Validate tier
        if (!(tier in ESTIMATION_PACKAGE_PRICES)) {
          return reply.status(400).send({
            error: 'INVALID_TIER',
            message: `Tier must be one of: ${Object.keys(ESTIMATION_PACKAGE_PRICES).join(', ')}`,
          })
        }

        // Retrieve intake to validate
        const intakeData = await redis.get(`estimation_intake:${intakeId}`)
        if (!intakeData) {
          return reply.status(404).send({
            error: 'INTAKE_NOT_FOUND',
            message: 'Intake session expired or does not exist',
          })
        }

        const intake = JSON.parse(intakeData)
        const packageInfo = ESTIMATION_PACKAGE_PRICES[tier as keyof typeof ESTIMATION_PACKAGE_PRICES]

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: email || intake.contact.email,
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
          success_url: `${process.env.APP_URL}/estimation/success?sessionId={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/estimation/checkout-cancelled`,
          metadata: {
            source: 'estimation',
            packageTier: tier,
            packageName: packageInfo.name,
            intakeId,
            userId: (request.user as any)?.id,
            funnelSessionId: intake.funnelSessionId,
            customerEmail: email || intake.contact.email,
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
          email,
        })

        return reply.send({
          sessionId: session.id,
          url: session.url,
          amount: packageInfo.amount,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          error: 'CHECKOUT_ERROR',
          message: 'Failed to create checkout session',
        })
      }
    }
  )

  /**
   * GET /estimation/{intakeId}/status
   * Public endpoint: Check intake status
   */
  fastify.get<{ Params: { intakeId: string } }>('/estimation/:intakeId/status', async (request, reply) => {
    try {
      const { intakeId } = request.params
      const intakeData = await redis.get(`estimation_intake:${intakeId}`)

      if (!intakeData) {
        return reply.status(404).send({
          error: 'INTAKE_NOT_FOUND',
          message: 'Intake not found or expired',
        })
      }

      const intake = JSON.parse(intakeData)
      return reply.send({
        intakeId,
        status: 'intake_submitted',
        readinessState: intake.scoring.readinessState,
        recommendedTier: intake.scoring.tier,
        createdAt: intake.createdAt,
      })
    } catch (error) {
      fastify.log.error(error)
      throw error
    }
  })

  fastify.log.info('Public estimation intake routes registered')
}
