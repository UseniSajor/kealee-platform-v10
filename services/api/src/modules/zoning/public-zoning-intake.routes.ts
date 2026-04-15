/**
 * Public Zoning & Feasibility Report Routes  
 * Consumer-facing API for zoning analysis and buildability assessment
 * Pattern: Second-stage discovery service - analyze property zoning and constraints
 * Routes: /zoning/intake (public), /zoning/checkout (public)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { RedisClient } from '@kealee/redis'
import {
  ZoningIntakeSchema,
  ZoningIntakeResponseSchema,
  DMV_JURISDICTIONS,
  type ZoningIntake,
  type ZoningIntakeResponse,
} from '@kealee/intake/schemas'

// Pricing model for zoning analysis tiers
const ZONING_PACKAGE_PRICES = {
  zoning_research: {
    name: 'Zoning Research Report',
    amount: 19500, // $195 in cents
    turnaround: 1,
    description: 'jurisdiction zoning district, overlays, permitted uses, basic standards',
  },
  feasibility_assessment: {
    name: 'Buildability Assessment',
    amount: 49500, // $495 in cents
    turnaround: 2,
    description: 'Full feasibility analysis, setbacks, height, parking, environmental constraints',
  },
  entitlement_path: {
    name: 'Entitlement Path Strategy',
    amount: 99500, // $995 in cents
    turnaround: 3,
    description: 'Feasibility + variance/CUP requirements + approval timeline + risk assessment',
  },
  pre_submission_consulting: {
    name: 'Pre-Submission Consulting',
    amount: 199500, // $1,995 in cents
    turnaround: 5,
    description: 'Entitlement strategy + consultation call + preliminary submission package',
  },
} as const

/**
 * Score zoning lead based on intake data
 */
function scoreZoningLead(data: ZoningIntake): {
  total: number
  tier: keyof typeof ZONING_PACKAGE_PRICES
  readinessState: string
  flags: Record<string, boolean | string>
  buildabilityScore: number
} {
  let score = 0
  let complexityDeduction = 0
  const flags: Record<string, boolean | string> = {
    jurisdictionSimplified: false,
    structuralRequired: false,
    environmentalConstraints: false,
    historicDistrict: false,
    wetlands: false,
    floodZone: false,
    varianceRequired: false,
    cupRequired: false,
  }

  // Address provided (0-15 points)
  if (data.address) {
    score += 15
  } else if (data.zipCode) {
    score += 10
  }

  // Jurisdiction research (0-20 points)
  if (data.address) {
    const jurisdiction = data.jurisdiction || 'UNKNOWN'
    const jurisdictionData = DMV_JURISDICTIONS[jurisdiction as any]
    if (jurisdictionData) {
      if (jurisdictionData.averagePermitDays <= 30) {
        score += 20
        flags.jurisdictionSimplified = true
      } else if (jurisdictionData.averagePermitDays <= 60) {
        score += 15
      } else {
        score += 10
      }
    }
  }

  // Project intent clarity (0-20 points)
  if (data.projectIntent) {
    const intent = data.projectIntent.toLowerCase()
    if (intent.includes('addition') || intent.includes('remodel')) {
      score += 15
    } else if (intent.includes('adu') || intent.includes('accessory')) {
      score += 12
    } else if (intent.includes('new') || intent.includes('construction')) {
      score += 18
      complexityDeduction += 5 // New construction more complex
    }
  }

  // Property information provided (0-15 points)
  if (data.lotSize) {
    score += 10
  }
  if (data.existingStructureInfo) {
    score += 5
  }

  // Project type (0-20 points)
  if (data.desiredBuild) {
    const buildType = data.desiredBuild.toLowerCase()
    if (buildType.includes('adu')) {
      score += 12
      complexityDeduction += 3 // ADU has specific requirements
    } else if (buildType.includes('addition')) {
      score += 10
    } else if (buildType.includes('renovation')) {
      score += 8
    } else if (buildType.includes('new')) {
      score += 18
      complexityDeduction += 8
    }
  }

  // Environmental/Risk factors (can reduce score)
  if (data.environmentalConstraints) {
    complexityDeduction += 10
    const constraints = data.environmentalConstraints.toLowerCase()
    if (constraints.includes('historic')) {
      flags.historicDistrict = true
      complexityDeduction += 5
    }
    if (constraints.includes('wetland')) {
      flags.wetlands = true
      complexityDeduction += 8
    }
    if (constraints.includes('flood')) {
      flags.floodZone = true
      complexityDeduction += 5
    }
  }

  // Documentation provided (0-10 points)
  if (data.uploadedPhotos || data.uploadedDocuments) {
    score += 8
  }

  // Calculate buildability score
  const buildabilityScore = Math.max(0, score - complexityDeduction)

  // Tier recommendation based on buildability and complexity
  let tier: keyof typeof ZONING_PACKAGE_PRICES = 'zoning_research'
  if (buildabilityScore >= 70) {
    tier = 'pre_submission_consulting'
  } else if (buildabilityScore >= 50) {
    tier = 'entitlement_path'
  } else if (buildabilityScore >= 35) {
    tier = 'feasibility_assessment'
  }

  // Readiness state
  let readinessState = 'NEEDS_MORE_INFO'
  if (data.address && data.projectIntent) {
    if (buildabilityScore >= 50 && !complexityDeduction) {
      readinessState = 'READY_FOR_ESTIMATE'
    } else if (buildabilityScore >= 35) {
      readinessState = 'READY_FOR_ZONING_REVIEW'
    } else {
      readinessState = 'REQUIRES_CONSULTATION'
    }
  }

  // Check if variance or CUP required
  if (complexityDeduction >= 8) {
    if (buildType?.includes('adu')) flags.cupRequired = true
    else flags.varianceRequired = true
  }

  return {
    total: score,
    tier,
    readinessState,
    flags,
    buildabilityScore,
  }
}

export async function registerPublicZoningRoutes(fastify: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
  })

  const redis = await RedisClient.getInstance()

  /**
   * POST /zoning/intake
   * Public endpoint: No auth required
   * Validates zoning intake, scores feasibility, prepares for checkout
   */
  fastify.post<{ Body: ZoningIntake }>('/zoning/intake', async (request, reply) => {
    try {
      // Validate intake
      const validatedIntake = ZoningIntakeSchema.parse(request.body)

      // Score lead
      const scoring = scoreZoningLead(validatedIntake)

      // Generate unique IDs
      const intakeId = `zoning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const funnelSessionId = (request.cookies as any)?.funnelSessionId || `fs_${Date.now()}`

      // Store intake in Redis with 7-day TTL
      await redis.setex(
        `zoning_intake:${intakeId}`,
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
        event: 'zoning.intake.submitted',
        intakeId,
        jurisdiction: validatedIntake.jurisdiction,
        score: scoring.total,
        buildabilityScore: scoring.buildabilityScore,
        tier: scoring.tier,
        email: validatedIntake.email,
      })

      const response: ZoningIntakeResponse = {
        intakeId,
        jurisdiction: validatedIntake.jurisdiction || 'To be determined',
        zoningDistrict: validatedIntake.zoningDistrict || 'Unknown',
        buildabilityScore: scoring.buildabilityScore,
        readinessState: scoring.readinessState as any,
        flags: {
          structuralRequired: scoring.flags.structuralRequired as boolean,
          environmentalConstraints: scoring.flags.environmentalConstraints as boolean,
          historicDistrict: scoring.flags.historicDistrict as boolean,
          wetlands: scoring.flags.wetlands as boolean,
          floodZone: scoring.flags.floodZone as boolean,
          varianceRequired: scoring.flags.varianceRequired as boolean,
          cupRequired: scoring.flags.cupRequired as boolean,
        },
        feasibilityNotes:
          scoring.buildabilityScore >= 70
            ? 'Property appears well-suited for your project. Consultation recommended.'
            : scoring.buildabilityScore >= 50
              ? 'Project is feasible but may require variance or special review.'
              : 'Property has constraints. Professional entitlement strategy recommended.',
        recommendedTier: scoring.tier,
        estimatedPrice: ZONING_PACKAGE_PRICES[scoring.tier].amount,
        estimatedTurnaround: ZONING_PACKAGE_PRICES[scoring.tier].turnaround,
        nextStep: 'Review your results. Choose an analysis tier and proceed to payment.',
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
   * POST /zoning/checkout
   * Public endpoint: No auth required
   * Creates Stripe checkout session for zoning analysis package
   */
  fastify.post<{ Body: { intakeId: string; tier: string; email: string } }>(
    '/zoning/checkout',
    async (request, reply) => {
      try {
        const { intakeId, tier, email } = request.body

        // Validate tier
        if (!(tier in ZONING_PACKAGE_PRICES)) {
          return reply.status(400).send({
            error: 'INVALID_TIER',
            message: `Tier must be one of: ${Object.keys(ZONING_PACKAGE_PRICES).join(', ')}`,
          })
        }

        // Retrieve intake to validate
        const intakeData = await redis.get(`zoning_intake:${intakeId}`)
        if (!intakeData) {
          return reply.status(404).send({
            error: 'INTAKE_NOT_FOUND',
            message: 'Intake session expired or does not exist',
          })
        }

        const intake = JSON.parse(intakeData)
        const packageInfo = ZONING_PACKAGE_PRICES[tier as keyof typeof ZONING_PACKAGE_PRICES]

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: email || intake.email,
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
          success_url: `${process.env.APP_URL}/zoning/success?sessionId={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/zoning/checkout-cancelled`,
          metadata: {
            source: 'zoning',
            packageTier: tier,
            packageName: packageInfo.name,
            intakeId,
            jurisdiction: intake.jurisdiction,
            buildabilityScore: intake.scoring.buildabilityScore,
            userId: (request.user as any)?.id,
            funnelSessionId: intake.funnelSessionId,
            customerEmail: email || intake.email,
          },
        })

        // Store session mapping
        await redis.setex(
          `zoning_session:${session.id}`,
          3600, // 1 hour TTL
          JSON.stringify({
            intakeId,
            tier,
            createdAt: new Date().toISOString(),
          })
        )

        fastify.log.info({
          event: 'zoning.checkout.initiated',
          intakeId,
          sessionId: session.id,
          tier,
          buildabilityScore: intake.scoring.buildabilityScore,
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
   * GET /zoning/{intakeId}/status
   * Public endpoint: Check intake status and view analysis summary
   */
  fastify.get<{ Params: { intakeId: string } }>('/zoning/:intakeId/status', async (request, reply) => {
    try {
      const { intakeId } = request.params
      const intakeData = await redis.get(`zoning_intake:${intakeId}`)

      if (!intakeData) {
        return reply.status(404).send({
          error: 'INTAKE_NOT_FOUND',
          message: 'Intake not found or expired',
        })
      }

      const intake = JSON.parse(intakeData)
      return reply.send({
        intakeId,
        status: 'analysis_ready',
        jurisdiction: intake.jurisdiction,
        zoningDistrict: intake.zoningDistrict,
        buildabilityScore: intake.scoring.buildabilityScore,
        readinessState: intake.scoring.readinessState,
        recommendedTier: intake.scoring.tier,
        flags: intake.scoring.flags,
        createdAt: intake.createdAt,
      })
    } catch (error) {
      fastify.log.error(error)
      throw error
    }
  })

  /**
   * POST /zoning/{intakeId}/schedule-consultation
   * Public endpoint: Schedule follow-up consultation with zoning specialist
   */
  fastify.post<{ Body: { intakeId: string; preferredDate?: string; notes?: string } }>(
    '/zoning/:intakeId/schedule-consultation',
    async (request, reply) => {
      try {
        const { intakeId } = request.params
        const { preferredDate, notes } = request.body

        const intakeData = await redis.get(`zoning_intake:${intakeId}`)
        if (!intakeData) {
          return reply.status(404).send({
            error: 'INTAKE_NOT_FOUND',
            message: 'Intake not found or expired',
          })
        }

        // Queue consultation scheduling job
        const consultationId = `consult_${intakeId}_${Date.now()}`
        await redis.setex(
          `zoning_consultation:${consultationId}`,
          86400 * 30, // 30-day TTL
          JSON.stringify({
            intakeId,
            consultationId,
            preferredDate,
            notes,
            status: 'SCHEDULED',
            createdAt: new Date().toISOString(),
          })
        )

        fastify.log.info({
          event: 'zoning.consultation.scheduled',
          intakeId,
          consultationId,
          preferredDate,
        })

        return reply.send({
          consultationId,
          status: 'SCHEDULED',
          message: 'Consultation scheduled. Our team will contact you shortly.',
        })
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  fastify.log.info('Public zoning intake routes registered')
}
