/**
 * Checkout Pricing Routes
 * Calculates final pricing at checkout before Stripe session creation
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { pricingEngine } from '../services/pricing-engine.service'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CalculatePricingSchema = z.object({
  serviceType: z.enum(['concept', 'estimation', 'permits', 'zoning']),
  tier: z.string(),
  jurisdiction: z.string().optional(),
  projectType: z.string().optional(),
  complexityScore: z.number().min(0).max(100).optional(),
  zoningRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  submissionMethod: z.enum(['SELF', 'ASSISTED', 'KEALEE_MANAGED']).optional(),
  estimatedValuation: z.number().optional(),
})

type CalculatePricingRequest = z.infer<typeof CalculatePricingSchema>

// ============================================================================
// ROUTES
// ============================================================================

export async function checkoutPricingRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/checkout/calculate
   * Calculate final pricing based on project details
   */
  fastify.post<{ Body: CalculatePricingRequest }>(
    '/api/v1/checkout/calculate',
    {
      schema: {
        description: 'Calculate final pricing at checkout',
        body: {
          type: 'object',
          required: ['serviceType', 'tier'],
          properties: {
            serviceType: { type: 'string', enum: ['concept', 'estimation', 'permits', 'zoning'] },
            tier: { type: 'string' },
            jurisdiction: { type: 'string' },
            projectType: { type: 'string' },
            complexityScore: { type: 'number' },
            zoningRisk: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            submissionMethod: { type: 'string', enum: ['SELF', 'ASSISTED', 'KEALEE_MANAGED'] },
            estimatedValuation: { type: 'number' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CalculatePricingRequest }>, reply: FastifyReply) => {
      try {
        // Validate input
        const input = CalculatePricingSchema.parse(request.body)

        // Calculate pricing
        const pricing = pricingEngine.calculateFinalPrice(input)

        // Log pricing calculation
        console.log(`✅ Pricing calculated: ${input.serviceType} - ${input.tier} = $${pricing.finalPrice}`)

        return reply.send({
          status: 'success',
          data: pricing,
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            status: 'error',
            message: 'Invalid pricing input',
            errors: error.errors,
          })
        }

        console.error('Pricing calculation error:', error)
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to calculate pricing',
        })
      }
    }
  )

  /**
   * GET /api/v1/pricing/landing/:serviceType
   * Get starting prices for landing pages (no auth required)
   */
  fastify.get<{ Params: { serviceType: string } }>(
    '/api/v1/pricing/landing/:serviceType',
    async (request: FastifyRequest<{ Params: { serviceType: string } }>, reply: FastifyReply) => {
      try {
        const { serviceType } = request.params

        if (!['concept', 'estimation', 'permits', 'zoning'].includes(serviceType)) {
          return reply.status(400).send({
            status: 'error',
            message: 'Invalid service type',
          })
        }

        const pricing = pricingEngine.getServiceStartingPrices(
          serviceType as 'concept' | 'estimation' | 'permits' | 'zoning'
        )

        return reply.send({
          status: 'success',
          data: pricing,
        })
      } catch (error) {
        console.error('Landing pricing error:', error)
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to get pricing information',
        })
      }
    }
  )

  /**
   * POST /api/v1/checkout/create-session
   * Create Stripe checkout session with calculated pricing
   * Integrates with existing Stripe flow
   */
  fastify.post<{ Body: any }>(
    '/api/v1/checkout/create-session',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const { serviceType, tier, jurisdiction, projectType, complexityScore, zoningRisk, submissionMethod, estimatedValuation, email } = request.body

        // Validate required fields
        if (!serviceType || !tier || !email) {
          return reply.status(400).send({
            status: 'error',
            message: 'Missing required fields: serviceType, tier, email',
          })
        }

        // Calculate final pricing
        const pricing = pricingEngine.calculateFinalPrice({
          serviceType,
          tier,
          jurisdiction,
          projectType,
          complexityScore,
          zoningRisk,
          submissionMethod,
          estimatedValuation,
        })

        // Return pricing info for Stripe session creation
        // The client will use this to create a Stripe checkout session
        return reply.send({
          status: 'success',
          data: {
            pricing,
            stripeLineItem: {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: pricing.checkoutDisplayLabel,
                  description: pricing.pricingExplanation,
                },
                unit_amount: Math.round(pricing.finalPrice * 100), // Stripe expects cents
              },
              quantity: 1,
            },
            metadata: {
              serviceType,
              tier,
              jurisdiction,
              projectType,
              complexityScore,
              zoningRisk,
              submissionMethod,
              email,
            },
          },
        })
      } catch (error) {
        console.error('Stripe session creation error:', error)
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to create checkout session',
        })
      }
    }
  )

  console.log('✅ Checkout pricing routes registered')
}

export default checkoutPricingRoutes
