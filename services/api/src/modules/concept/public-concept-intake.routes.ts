/**
 * Public Concept Intake Routes
 * Consumer-facing API for architectural concept generation and intake
 * Pattern: First-stage discovery service - user describes project, we generate visual concepts
 * Routes: /concept/intake (public), /concept/checkout (public)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { RedisClient } from '@kealee/redis'
import { prismaAny } from '../../utils/prisma-helper'
import { uploadFileWithTracking } from '../../lib/file-upload-handler'
import {
  ConceptIntakeSchema,
  ConceptIntakeResponseSchema,
  type ConceptIntake,
  type ConceptIntakeResponse,
} from '@kealee/intake/schemas'

// Pricing model for concept tiers
const CONCEPT_PACKAGE_PRICES = {
  concept_basic: {
    name: 'Concept Visualization',
    amount: 29500, // $295 in cents
    turnaround: 2,
    description: '2-3 AI-generated concept renderings with scope summary',
    conceptCount: 3,
    withStyleGuide: false,
    withFeasibilityFlags: true,
  },
  concept_advanced: {
    name: 'Advanced Concept + Validation',
    amount: 69500, // $695 in cents
    turnaround: 3,
    description: '5 concept variations + feasibility analysis + style direction',
    conceptCount: 5,
    withStyleGuide: true,
    withFeasibilityFlags: true,
  },
  concept_full: {
    name: 'Concept + Design Package',
    amount: 149500, // $1,495 in cents
    turnaround: 5,
    description: 'Advanced concepts + preliminary design drawings + specification start',
    conceptCount: 5,
    withStyleGuide: true,
    withFeasibilityFlags: true,
    withPreliminaryDrawings: true,
  },
} as const

/**
 * Score concept lead based on intake data
 * Returns readiness state and recommended tier
 */
function scoreConceptLead(data: ConceptIntake): {
  total: number
  tier: keyof typeof CONCEPT_PACKAGE_PRICES
  readinessState: string
  flags: Record<string, boolean | string>
  complexity: 'simple' | 'moderate' | 'complex'
} {
  let score = 0
  const flags: Record<string, boolean | string> = {
    hasPhotos: data.hasPhotos ?? false,
    hasRoughDimensions: data.roughDimensions?.sqft ? true : false,
    hasBudgetRange: data.budgetRange ? true : false,
    hasStylePreference: data.stylePreference ? true : false,
    requiresArchitect: false,
    requiresEngineer: false,
  }

  // Project type complexity (0-20 points)
  const complexityMap: Record<string, number> = {
    kitchen: 15,
    bathroom: 12,
    addition: 20,
    adu: 25,
    facade: 18,
    landscape: 10,
    multifamily: 30,
    interior_remodel: 14,
    exterior_renovation: 18,
    structural_change: 25,
    new_construction: 30,
  }
  const typeScore = complexityMap[data.projectType] || 15
  score += typeScore

  // Photos provided (0-15 points)
  if (data.hasPhotos) {
    if (data.photoCount && data.photoCount >= 3) {
      score += 15
    } else if (data.photoCount) {
      score += 10
    }
  }

  // Scope clarity (0-20 points)
  if (data.description && data.description.length > 100) {
    score += 15
  } else if (data.description && data.description.length > 50) {
    score += 10
  } else if (data.description) {
    score += 5
  }

  // Address provided (0-10 points)
  if (data.address || data.zipCode) {
    score += 10
  }

  // Budget info (0-10 points)
  if (data.budgetRange) {
    score += 8
  }

  // Style preference (0-5 points)
  if (data.stylePreference) {
    score += 5
  }

  // Dimensions provided (0-10 points)
  if (data.roughDimensions?.sqft) {
    score += 10
  }

  // Determine complexity level
  let complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  if (typeScore >= 25 || (data.projectType?.includes('multi') || data.projectType?.includes('structural'))) {
    complexity = 'complex'
    flags.requiresArchitect = true
  }
  if (typeScore <= 15) {
    complexity = 'simple'
  }

  // Tier recommendation based on score
  let tier: keyof typeof CONCEPT_PACKAGE_PRICES = 'concept_basic'
  if (score >= 75) {
    tier = 'concept_full'
  } else if (score >= 55) {
    tier = 'concept_advanced'
  }

  // Readiness state
  let readinessState = 'NEEDS_MORE_INFO'
  if (data.address && data.projectType && data.description) {
    readinessState = score >= 50 ? 'READY_FOR_CONCEPT' : 'NEEDS_MORE_INFO'
  }

  return {
    total: score,
    tier,
    readinessState,
    flags,
    complexity,
  }
}

export async function registerPublicConceptRoutes(fastify: FastifyInstance) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10',
  })

  const redis = await RedisClient.getInstance()

  /**
   * POST /concept/intake
   * Public endpoint: No auth required
   * Validates concept intake, scores lead, generates AI concepts, prepares for checkout
   */
  fastify.post<{ Body: ConceptIntake }>('/concept/intake', async (request, reply) => {
    try {
      // Validate intake
      const validatedIntake = ConceptIntakeSchema.parse(request.body)

      // Score lead
      const scoring = scoreConceptLead(validatedIntake)

      // Generate unique IDs
      let intakeId: string
      const funnelSessionId = (request.cookies as any)?.funnelSessionId || `fs_${Date.now()}`

      // Create DB record first (use UUID as intakeId for better referential integrity)
      try {
        const dbRecord = await prismaAny.conceptServiceLead.create({
          data: {
            fullName: validatedIntake.name || 'Unnamed',
            email: validatedIntake.email,
            phone: validatedIntake.phone,
            company: validatedIntake.company,
            projectType: validatedIntake.projectType,
            location: validatedIntake.address,
            zipCode: validatedIntake.zipCode,
            description: validatedIntake.description,
            roughDimensions: validatedIntake.roughDimensions ? JSON.stringify(validatedIntake.roughDimensions) : null,
            stylePreference: validatedIntake.stylePreference,
            budgetRange: validatedIntake.budgetRange,
            hasPhotos: validatedIntake.hasPhotos ?? false,
            photoCount: validatedIntake.photoCount,
            tier: scoring.tier,
            leadScore: scoring.total,
            complexity: scoring.complexity,
            readinessState: scoring.readinessState,
            source: 'WEBSITE',
            metadata: {
              funnelSessionId,
              flags: scoring.flags,
              routeRecommendation: scoring.total >= 75 ? 'immediate' : scoring.total >= 50 ? 'standard' : 'requires_followup',
            },
          },
        })
        intakeId = dbRecord.id
      } catch (dbErr: any) {
        // Fallback to legacy string ID if DB fails (non-blocking)
        fastify.log.warn('ConceptServiceLead creation failed:', dbErr?.message)
        intakeId = `concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Here you would normally queue a job to generate AI concepts
      // For now, we'll store the intake and include placeholder concepts
      const generatedConcepts = [
        {
          conceptId: `concept_${intakeId}_1`,
          title: 'Modern Minimalist',
          description: 'Clean lines, contemporary aesthetic',
          styleCategory: 'modern',
          renderingUrl: '/concept-renders/placeholder-modern.jpg', // Would be AI-generated
          confidence: 0.92,
        },
        {
          conceptId: `concept_${intakeId}_2`,
          title: 'Classic Traditional',
          description: 'Timeless design with heritage elements',
          styleCategory: 'traditional',
          renderingUrl: '/concept-renders/placeholder-traditional.jpg',
          confidence: 0.85,
        },
        {
          conceptId: `concept_${intakeId}_3`,
          title: 'Transitional Blend',
          description: 'Mix of modern and traditional elements',
          styleCategory: 'transitional',
          renderingUrl: '/concept-renders/placeholder-transitional.jpg',
          confidence: 0.88,
        },
      ]

      // Store intake in Redis with 7-day TTL
      await redis.setex(
        `concept_intake:${intakeId}`,
        86400 * 7,
        JSON.stringify({
          ...validatedIntake,
          intakeId,
          funnelSessionId,
          scoring,
          generatedConcepts,
          createdAt: new Date().toISOString(),
        })
      )

      // Log intake
      fastify.log.info({
        event: 'concept.intake.submitted',
        intakeId,
        score: scoring.total,
        tier: scoring.tier,
        complexity: scoring.complexity,
        address: validatedIntake.address,
        email: validatedIntake.email,
      })

      const response: ConceptIntakeResponse = {
        intakeId,
        leadScore: scoring.total,
        tier: scoring.tier,
        route: scoring.total >= 75 ? 'immediate' : scoring.total >= 50 ? 'standard' : 'requires_followup',
        readinessState: scoring.readinessState as any,
        complexity: scoring.complexity,
        flags: {
          hasPhotos: scoring.flags.hasPhotos as boolean,
          hasRoughDimensions: scoring.flags.hasRoughDimensions as boolean,
          hasBudgetRange: scoring.flags.hasBudgetRange as boolean,
          hasStylePreference: scoring.flags.hasStylePreference as boolean,
          requiresArchitect: scoring.flags.requiresArchitect as boolean,
          requiresEngineer: scoring.flags.requiresEngineer as boolean,
        },
        scopeSummary: {
          projectType: validatedIntake.projectType,
          scope: validatedIntake.description,
          estimatedSquareFootage: validatedIntake.roughDimensions?.sqft,
          budgetRange: validatedIntake.budgetRange,
        },
        conceptOptions: generatedConcepts,
        styleDirection: validatedIntake.stylePreference || 'To be determined',
        feasibilitySignals: {
          complexity: scoring.complexity,
          estimatedTurnaround: CONCEPT_PACKAGE_PRICES[scoring.tier].turnaround,
          recommendedNextStep: scoring.complexity === 'complex' ?
            'Schedule consultation with architect' :
            'Review concepts and proceed to estimate',
        },
        estimatedPrice: CONCEPT_PACKAGE_PRICES[scoring.tier].amount,
        nextStep: 'Review your concept options. Select a tier and proceed to payment.',
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
   * POST /concept/checkout
   * Public endpoint: No auth required
   * Creates Stripe checkout session for concept package
   */
  fastify.post<{ Body: { intakeId: string; tier: string; email: string } }>(
    '/concept/checkout',
    async (request, reply) => {
      try {
        const { intakeId, tier, email } = request.body

        // Validate tier
        if (!(tier in CONCEPT_PACKAGE_PRICES)) {
          return reply.status(400).send({
            error: 'INVALID_TIER',
            message: `Tier must be one of: ${Object.keys(CONCEPT_PACKAGE_PRICES).join(', ')}`,
          })
        }

        // Retrieve intake to validate
        const intakeData = await redis.get(`concept_intake:${intakeId}`)
        if (!intakeData) {
          return reply.status(404).send({
            error: 'INTAKE_NOT_FOUND',
            message: 'Intake session expired or does not exist',
          })
        }

        const intake = JSON.parse(intakeData)
        const packageInfo = CONCEPT_PACKAGE_PRICES[tier as keyof typeof CONCEPT_PACKAGE_PRICES]

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
          success_url: `${process.env.APP_URL}/concept/success?sessionId={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/concept/checkout-cancelled`,
          metadata: {
            source: 'concept-package',
            packageTier: tier,
            packageName: packageInfo.name,
            intakeId,
            complexity: intake.scoring.complexity,
            userId: (request.user as any)?.id,
            funnelSessionId: intake.funnelSessionId,
            customerEmail: email || intake.email,
          },
        })

        // Store session mapping
        await redis.setex(
          `concept_session:${session.id}`,
          3600, // 1 hour TTL
          JSON.stringify({
            intakeId,
            tier,
            createdAt: new Date().toISOString(),
          })
        )

        fastify.log.info({
          event: 'concept.checkout.initiated',
          intakeId,
          sessionId: session.id,
          tier,
          complexity: intake.scoring.complexity,
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
   * GET /concept/{intakeId}/status
   * Public endpoint: Check intake status and retrieve generated concepts
   */
  fastify.get<{ Params: { intakeId: string } }>('/concept/:intakeId/status', async (request, reply) => {
    try {
      const { intakeId } = request.params
      const intakeData = await redis.get(`concept_intake:${intakeId}`)

      if (!intakeData) {
        return reply.status(404).send({
          error: 'INTAKE_NOT_FOUND',
          message: 'Intake not found or expired',
        })
      }

      const intake = JSON.parse(intakeData)
      return reply.send({
        intakeId,
        status: 'concepts_generated',
        readinessState: intake.scoring.readinessState,
        recommendedTier: intake.scoring.tier,
        complexity: intake.scoring.complexity,
        concepts: intake.generatedConcepts,
        scopeSummary: {
          projectType: intake.projectType,
          estimated_sqft: intake.roughDimensions?.sqft,
          style_preference: intake.stylePreference,
        },
        createdAt: intake.createdAt,
      })
    } catch (error) {
      fastify.log.error(error)
      throw error
    }
  })

  /**
   * GET /concept/{conceptId}/rendering
   * Public endpoint: Get full resolution rendering for a concept
   */
  fastify.get<{ Params: { conceptId: string } }>('/concept/:conceptId/rendering', async (request, reply) => {
    try {
      const { conceptId } = request.params

      // In production, this would fetch from AI rendering service or storage
      // For now, return a placeholder response
      return reply.send({
        conceptId,
        renderingUrl: '/concept-renders/placeholder.jpg',
        resolution: {
          width: 1920,
          height: 1080,
        },
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      fastify.log.error(error)
      throw error
    }
  })

  /**
   * POST /concept/upload
   * Public endpoint: Upload photos/documents for concept intake
   * Expects multipart/form-data with: file, conceptServiceLeadId
   */
  fastify.post<{ Body: any }>(
    '/concept/upload',
    { schema: { consumes: ['multipart/form-data'] } },
    async (request, reply) => {
      try {
        const data = await request.file()
        if (!data) {
          return reply.status(400).send({ error: 'No file provided' })
        }

        const { conceptServiceLeadId } = data.fields
        if (!conceptServiceLeadId) {
          return reply.status(400).send({ error: 'Missing conceptServiceLeadId' })
        }

        // Read file buffer
        const buffer = await data.toBuffer()

        // Upload with tracking
        const result = await uploadFileWithTracking({
          bucket: 'concept-intake-photos',
          path: `${conceptServiceLeadId}/${Date.now()}-${data.filename}`,
          file: buffer,
          fileName: data.filename,
          fileSize: buffer.length,
          contentType: data.mimetype,
          category: 'SITE_PHOTO',
          conceptServiceLeadId: conceptServiceLeadId as string,
        })

        fastify.log.info({
          event: 'concept.file.uploaded',
          conceptServiceLeadId,
          fileName: data.filename,
          fileSize: buffer.length,
        })

        return reply.send({
          fileUrl: result.fileUrl,
          fileUploadId: result.fileUploadId,
          fileName: data.filename,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          error: 'File upload failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  fastify.log.info('Public concept intake routes registered')
}
