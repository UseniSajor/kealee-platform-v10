/**
 * Public Permit Intake Routes
 * Consumer-facing API for permit services intake and checkout
 * Pattern: Same as concept/estimation intake
 * Routes: /permits/intake (public), /permits/checkout (public)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { RedisClient } from '@kealee/redis'
import {
  PermitIntakeSchema,
  PermitIntakeResponseSchema,
  DMV_JURISDICTIONS,
  type PermitIntake,
  type PermitIntakeResponse,
} from '@kealee/intake/schemas'

// Pricing model for permit service tiers
const PERMIT_PACKAGE_PRICES = {
  document_assembly: {
    name: 'Permit Document Assembly',
    amount: 49500, // $495 in cents
    turnaround: 2,
    description: 'We prepare all permit documents based on your estimate and design',
  },
  submission: {
    name: 'Permit Submission',
    amount: 79500, // $795 in cents
    turnaround: 1,
    description: 'Full service: document assembly + submission to correct agency',
  },
  tracking: {
    name: 'Permit Tracking & Management',
    amount: 149500, // $1,495 in cents
    turnaround: 3,
    description: 'Full service + review coordination + status tracking',
  },
  inspection_coordination: {
    name: 'Full Inspection Coordination',
    amount: 249500, // $2,495 in cents
    turnaround: 7,
    description: 'Full service + inspection scheduling + coordination through issuance',
  },
} as const

/**
 * Score permit lead based on intake data
 */
function scorePermitLead(data: PermitIntake): {
  total: number
  tier: keyof typeof PERMIT_PACKAGE_PRICES
  readinessState: string
  flags: Record<string, boolean | string>
} {
  let score = 0
  const flags: Record<string, boolean | string> = {
    requiresArchitecturalReview: false,
    requiresStructuralEngineer: false,
    jurisdictionSpecialRequirement: '',
  }

  // Jurisdiction complexity (0-20 points)
  const jurisdiction = data.project.jurisdiction
  const jurisdictionData = DMV_JURISDICTIONS[jurisdiction]
  if (jurisdictionData.reviewDaysExpedited) {
    score += 15 // Expedited jurisdictions are easier
  } else {
    score += 10
  }

  // Contact completeness (0-15 points)
  if (data.contact.email && data.contact.phone && data.contact.name) {
    score += 15
  } else if (data.contact.email) {
    score += 10
  }

  // Project clarity (0-30 points)
  if (data.hasDesignDocuments) {
    score += 20
  }
  if (data.hasContractorSelected) {
    score += 10
  }

  // Project type complexity
  const projectCharacteristics = data.project.projectCharacteristics
  if (projectCharacteristics.isRenovation || projectCharacteristics.isAddition) {
    if (projectCharacteristics.involvesStructuralChange) {
      flags.requiresStructuralEngineer = true
      score -= 5 // Reduces score, increases tier
    }
  }
  if (projectCharacteristics.involvesHistoricDistrict) {
    flags.jurisdictionSpecialRequirement = 'historic_district'
    score -= 5
  }
  if (projectCharacteristics.involvesWetlands) {
    flags.jurisdictionSpecialRequirement = 'wetlands_review'
    score -= 10
  }

  // Permit complexity (0-20 points)
  const permitCount = data.project.permitTypes.length
  if (permitCount === 1) {
    score += 15
  } else if (permitCount <= 3) {
    score += 10
  } else {
    score += 5
  }

  // Tier recommendation
  let tier: keyof typeof PERMIT_PACKAGE_PRICES = 'submission'
  let readinessState = 'NEEDS_ESTIMATE'

  // If all conditions are met, ready for permit
  if (data.relatedEstimateId) {
    readinessState = 'READY_FOR_PERMIT_PREP'
  }

  // Tier selection based on score and project complexity
  if (score <= 30) {
    tier = 'inspection_coordination' // Complex projects need full service
  } else if (score <= 45) {
    tier = 'tracking'
  } else if (score <= 60) {
    tier = 'submission'
  } else {
    tier = 'document_assembly' // Simple projects just need docs
  }

  // If no estimate available, recommend lower tier
  if (!data.relatedEstimateId) {
    readinessState = 'NEEDS_ESTIMATE'
  }

  return { total: score, tier, readinessState, flags }
}

/**
 * Register public permit intake routes
 */
export async function registerPublicPermitRoutes(fastify: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
  })

  const redis = await RedisClient.getInstance()

  /**
   * POST /permits/intake
   * Public endpoint: No auth required
   * Validates permit intake, scores lead, prepares for checkout
   */
  fastify.post<{ Body: PermitIntake }>('/permits/intake', async (request, reply) => {
    try {
      // Validate intake
      const validatedIntake = PermitIntakeSchema.parse(request.body)

      // Score lead
      const scoring = scorePermitLead(validatedIntake)

      // Generate unique IDs
      const intakeId = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const funnelSessionId = (request.cookies as any)?.funnelSessionId || `fs_${Date.now()}`

      // Store intake in Redis with 7-day TTL
      await redis.setex(
        `permit_intake:${intakeId}`,
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
        event: 'permit.intake.submitted',
        intakeId,
        score: scoring.total,
        tier: scoring.tier,
        jurisdiction: validatedIntake.project.jurisdiction,
        email: validatedIntake.contact.email,
      })

      const response: PermitIntakeResponse = {
        intakeId,
        jurisdiction: validatedIntake.project.jurisdiction,
        estimatedProcessingTime: PERMIT_PACKAGE_PRICES[scoring.tier].turnaround,
        permitTypesNeeded: validatedIntake.project.permitTypes,
        readinessState: scoring.readinessState as any,
        flags: {
          requiresArchitecturalReview: scoring.flags.requiresArchitecturalReview as boolean,
          requiresStructuralEngineer: scoring.flags.requiresStructuralEngineer as boolean,
          flaggedForComplexReview: scoring.total < 40,
          jurisdictionSpecialRequirement: scoring.flags.jurisdictionSpecialRequirement as string | undefined,
        },
        estimatedPrice: PERMIT_PACKAGE_PRICES[scoring.tier].amount,
        nextStep:
          scoring.readinessState === 'NEEDS_ESTIMATE'
            ? 'Get a cost estimate first, then we can prepare your permit package.'
            : 'Ready for permit service selection. Choose your service tier and proceed to checkout.',
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
   * POST /permits/checkout
   * Public endpoint: No auth required
   * Creates Stripe checkout session for permit service package
   */
  fastify.post<{ Body: { intakeId: string; tier: string; email: string } }>(
    '/permits/checkout',
    async (request, reply) => {
      try {
        const { intakeId, tier, email } = request.body

        // Validate tier
        if (!(tier in PERMIT_PACKAGE_PRICES)) {
          return reply.status(400).send({
            error: 'INVALID_TIER',
            message: `Tier must be one of: ${Object.keys(PERMIT_PACKAGE_PRICES).join(', ')}`,
          })
        }

        // Retrieve intake to validate
        const intakeData = await redis.get(`permit_intake:${intakeId}`)
        if (!intakeData) {
          return reply.status(404).send({
            error: 'INTAKE_NOT_FOUND',
            message: 'Intake session expired or does not exist',
          })
        }

        const intake = JSON.parse(intakeData)

        // Validate that if score indicates "needs estimate", they still need to provide one
        if (intake.scoring.readinessState === 'NEEDS_ESTIMATE' && !intake.relatedEstimateId) {
          return reply.status(400).send({
            error: 'MISSING_ESTIMATE',
            message: 'This project requires a cost estimate before permit services. Please complete estimation first.',
            nextStep: 'Complete cost estimation at /estimation',
          })
        }

        const packageInfo = PERMIT_PACKAGE_PRICES[tier as keyof typeof PERMIT_PACKAGE_PRICES]

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
          success_url: `${process.env.APP_URL}/permits/success?sessionId={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/permits/checkout-cancelled`,
          metadata: {
            source: 'permits',
            packageTier: tier,
            packageName: packageInfo.name,
            intakeId,
            jurisdiction: intake.project.jurisdiction,
            userId: (request.user as any)?.id,
            funnelSessionId: intake.funnelSessionId,
            customerEmail: email || intake.contact.email,
          },
        })

        // Store session mapping
        await redis.setex(
          `permit_session:${session.id}`,
          3600, // 1 hour TTL
          JSON.stringify({
            intakeId,
            tier,
            jurisdiction: intake.project.jurisdiction,
            createdAt: new Date().toISOString(),
          })
        )

        fastify.log.info({
          event: 'permit.checkout.initiated',
          intakeId,
          sessionId: session.id,
          tier,
          jurisdiction: intake.project.jurisdiction,
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
   * GET /permits/{intakeId}/status
   * Public endpoint: Check intake status
   */
  fastify.get<{ Params: { intakeId: string } }>('/permits/:intakeId/status', async (request, reply) => {
    try {
      const { intakeId } = request.params
      const intakeData = await redis.get(`permit_intake:${intakeId}`)

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
        jurisdiction: intake.project.jurisdiction,
        createdAt: intake.createdAt,
      })
    } catch (error) {
      fastify.log.error(error)
      throw error
    }
  })

  fastify.log.info('Public permit intake routes registered')
}
