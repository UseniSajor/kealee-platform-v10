/**
 * Software Billing Routes
 *
 * Mounted under /billing/software/*
 * Handles checkout, usage, plan changes, and cancellation for S1–S4 tiers.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody } from '../../middleware/validation.middleware'
import { authenticateUser } from '../auth/auth.middleware'
import { softwareBillingService } from './software-billing.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const tierEnum = z.enum(['S1', 'S2', 'S3', 'S4'])
const pricingTierEnum = z.enum(['basic', 'standard', 'plus'])
const intervalEnum = z.enum(['month', 'year'])

export async function softwareBillingRoutes(fastify: FastifyInstance) {
  // ── POST /billing/software/checkout-session ─────────────────────
  fastify.post(
    '/checkout-session',
    {
      schema: {
        description: 'Create a Stripe Checkout session for a software package subscription',
        tags: ['billing', 'software'],
      },
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            tier: tierEnum,
            pricingTier: pricingTierEnum,
            interval: intervalEnum,
            successUrl: z.string().url(),
            cancelUrl: z.string().url(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as {
          tier: string
          pricingTier: string
          interval: 'month' | 'year'
          successUrl: string
          cancelUrl: string
        }

        const result = await softwareBillingService.createCheckoutSession({
          userId: user.id,
          tier: body.tier,
          pricingTier: body.pricingTier,
          interval: body.interval,
          successUrl: body.successUrl,
          cancelUrl: body.cancelUrl,
        })

        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create checkout session') })
      }
    }
  )

  // ── GET /billing/software/usage ─────────────────────────────────
  fastify.get(
    '/usage',
    {
      schema: {
        description: 'Get current usage stats (projects, users, tier info)',
        tags: ['billing', 'software'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const usage = await softwareBillingService.getUsage(user.id)
        return reply.send({ usage })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to get usage') })
      }
    }
  )

  // ── GET /billing/software/subscription ──────────────────────────
  fastify.get(
    '/subscription',
    {
      schema: {
        description: 'Get the current user\'s software subscription details',
        tags: ['billing', 'software'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const subscription = await softwareBillingService.getSubscription(user.id)
        return reply.send({ subscription })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to get subscription') })
      }
    }
  )

  // ── POST /billing/software/change-plan ──────────────────────────
  fastify.post(
    '/change-plan',
    {
      schema: {
        description: 'Upgrade or downgrade software subscription plan',
        tags: ['billing', 'software'],
      },
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            newTier: tierEnum,
            newPricingTier: pricingTierEnum,
            interval: intervalEnum.optional().default('month'),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as {
          newTier: string
          newPricingTier: string
          interval: 'month' | 'year'
        }

        const result = await softwareBillingService.changePlan({
          userId: user.id,
          newTier: body.newTier,
          newPricingTier: body.newPricingTier,
          interval: body.interval,
        })

        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to change plan') })
      }
    }
  )

  // ── POST /billing/software/cancel ───────────────────────────────
  fastify.post(
    '/cancel',
    {
      schema: {
        description: 'Cancel software subscription',
        tags: ['billing', 'software'],
      },
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            immediately: z.boolean().optional().default(false),
          }).optional()
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = (request.body as { immediately?: boolean }) || {}

        const result = await softwareBillingService.cancelSubscription(
          user.id,
          body.immediately || false
        )

        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to cancel subscription') })
      }
    }
  )

  // ── POST /billing/software/portal-session ───────────────────────
  fastify.post(
    '/portal-session',
    {
      schema: {
        description: 'Open Stripe Billing Portal for managing payment methods and invoices',
        tags: ['billing', 'software'],
      },
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            returnUrl: z.string().url(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as { returnUrl: string }

        const result = await softwareBillingService.createPortalSession(user.id, body.returnUrl)
        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create portal session') })
      }
    }
  )
}
