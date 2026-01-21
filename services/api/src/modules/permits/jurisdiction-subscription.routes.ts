/**
 * Jurisdiction Subscription Routes
 * Handles jurisdiction SaaS subscription management
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { getStripe } from '../billing/stripe.client'

const createSubscriptionSchema = z.object({
  jurisdictionId: z.string(),
  tier: z.enum(['basic', 'pro', 'enterprise']),
  stripeCustomerId: z.string().optional(),
})

const SUBSCRIPTION_PRICES: Record<string, number> = {
  basic: 500,
  pro: 1000,
  enterprise: 2000,
}

export async function jurisdictionSubscriptionRoutes(fastify: FastifyInstance) {
  // POST /jurisdictions/:id/subscription - Create or update jurisdiction subscription
  fastify.post(
    '/:id/subscription',
    {
      preHandler: [authenticateUser, validateBody(createSubscriptionSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const data = createSubscriptionSchema.parse(request.body)

        // Verify jurisdiction exists
        const jurisdiction = await prismaAny.jurisdiction.findUnique({
          where: { id: data.jurisdictionId },
        })

        if (!jurisdiction) {
          return reply.code(404).send({
            error: 'Jurisdiction not found',
          })
        }

        const monthlyFee = SUBSCRIPTION_PRICES[data.tier]
        const stripe = getStripe()
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000'

        // Create Stripe checkout session for subscription
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Jurisdiction Subscription - ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Tier`,
                  description: getTierDescription(data.tier),
                },
                unit_amount: Math.round(monthlyFee * 100),
                recurring: {
                  interval: 'month',
                },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${appUrl}/jurisdictions/${data.jurisdictionId}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/jurisdictions/${data.jurisdictionId}?canceled=true`,
          metadata: {
            jurisdictionId: data.jurisdictionId,
            tier: data.tier,
            userId: user.id,
          },
        })

        return reply.send({
          sessionId: session.id,
          url: session.url,
          monthlyFee,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to create subscription',
        })
      }
    }
  )

  // GET /jurisdictions/:id/subscription - Get current subscription
  fastify.get(
    '/:id/subscription',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const jurisdiction = await prismaAny.jurisdiction.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            monthlyFee: true,
            licenseKey: true,
          },
        })

        if (!jurisdiction) {
          return reply.code(404).send({
            error: 'Jurisdiction not found',
          })
        }

        return reply.send({
          subscription: {
            tier: jurisdiction.subscriptionTier,
            monthlyFee: jurisdiction.monthlyFee ? Number(jurisdiction.monthlyFee) : null,
            licenseKey: jurisdiction.licenseKey,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get subscription',
        })
      }
    }
  )

  // POST /jurisdictions/:id/subscription/upgrade - Upgrade subscription tier
  fastify.post(
    '/:id/subscription/upgrade',
    {
      preHandler: [authenticateUser, validateBody(z.object({ tier: z.enum(['basic', 'pro', 'enterprise']) }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const { tier } = request.body as { tier: string }

        const jurisdiction = await prismaAny.jurisdiction.findUnique({
          where: { id },
        })

        if (!jurisdiction) {
          return reply.code(404).send({
            error: 'Jurisdiction not found',
          })
        }

        const monthlyFee = SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES]

        // Update jurisdiction subscription
        await prismaAny.jurisdiction.update({
          where: { id },
          data: {
            subscriptionTier: tier,
            monthlyFee: monthlyFee,
          },
        })

        return reply.send({
          success: true,
          subscription: {
            tier,
            monthlyFee,
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to upgrade subscription',
        })
      }
    }
  )
}

function getTierDescription(tier: string): string {
  switch (tier) {
    case 'basic':
      return 'Up to 100 permits/month, up to 3 staff users, basic reporting, email support'
    case 'pro':
      return 'Up to 500 permits/month, up to 10 staff users, advanced reporting, custom fee schedules, phone support'
    case 'enterprise':
      return 'Unlimited permits, unlimited staff users, custom integrations, GIS integration, white-label options, dedicated account manager'
    default:
      return 'Jurisdiction subscription'
  }
}

