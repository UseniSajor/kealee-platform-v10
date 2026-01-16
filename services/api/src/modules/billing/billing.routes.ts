import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { validateBody } from '../../middleware/validation.middleware'
import { billingService } from './billing.service'
import type { BillingInterval, GCPlanSlug } from './billing.constants'

const listPlansQuerySchema = z.object({}).optional()

const createCheckoutSessionSchema = z.object({
  orgId: z.string().uuid(),
  planSlug: z.enum(['package-a', 'package-b', 'package-c', 'package-d']),
  interval: z.enum(['month', 'year']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
})

const createPortalSessionSchema = z.object({
  orgId: z.string().uuid(),
  returnUrl: z.string().url(),
})

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /billing/plans - list active plans (from DB seed)
  fastify.get(
    '/plans',
    {
      schema: {
        description: 'List active service plans (GC packages)',
        tags: ['billing'],
        response: {
          200: {
            type: 'object',
            properties: {
              plans: { type: 'array' },
            },
          },
        },
      },
      // keep as placeholder for now
      // preHandler: validateQuery(listPlansQuerySchema),
    },
    async (_request, reply) => {
      const plans = await billingService.listPlans()
      return reply.send({ plans })
    }
  )

  // POST /billing/stripe/checkout-session - start subscription checkout
  fastify.post(
    '/stripe/checkout-session',
    {
      schema: {
        description: 'Create a Stripe Checkout session for a GC subscription',
        tags: ['billing'],
      },
      preHandler: validateBody(createCheckoutSessionSchema),
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createCheckoutSessionSchema>
      const session = await billingService.createCheckoutSession({
        orgId: body.orgId,
        planSlug: body.planSlug as GCPlanSlug,
        interval: body.interval as BillingInterval,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        customerEmail: body.customerEmail,
      })
      return reply.send({ url: session.url, id: session.id })
    }
  )

  // POST /billing/stripe/portal-session - open Stripe Billing Portal
  fastify.post(
    '/stripe/portal-session',
    {
      schema: {
        description: 'Create a Stripe Billing Portal session for a GC org',
        tags: ['billing'],
      },
      preHandler: validateBody(createPortalSessionSchema),
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createPortalSessionSchema>
      const session = await billingService.createBillingPortalSession({
        orgId: body.orgId,
        returnUrl: body.returnUrl,
      })
      return reply.send({ url: session.url, id: session.id })
    }
  )

  // POST /billing/stripe/webhook - Stripe webhooks (raw body required)
  fastify.post(
    '/stripe/webhook',
    {
      config: { rawBody: true },
      schema: {
        description: 'Stripe webhook receiver for GC subscriptions',
        tags: ['billing'],
      },
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature']
      const raw = (request as any).rawBody as string | Buffer | undefined
      if (!raw) {
        return reply.code(400).send({ error: 'Missing raw body' })
      }

      const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8')

      try {
        const result = await billingService.handleWebhook(buf, sig)
        return reply.send(result)
      } catch (err: any) {
        request.log.error(err)
        return reply.code(400).send({ error: err.message || 'Webhook error' })
      }
    }
  )
}

