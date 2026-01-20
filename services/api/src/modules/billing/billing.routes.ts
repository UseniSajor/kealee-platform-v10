import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'

import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { authenticateUser } from '../auth/auth.middleware'
import { billingService } from './billing.service'
import { prismaAny } from '../../utils/prisma-helper'
import { getStripe } from './stripe.client'
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
  // This route uses the production-ready webhook handler
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
      const { handleStripeWebhook } = await import('../webhooks/stripe.webhook')
      await handleStripeWebhook(request, reply)
    }
  )

  // GET /billing/subscriptions/me - Get current user's subscription
  fastify.get(
    '/subscriptions/me',
    {
      schema: {
        description: 'Get current user\'s active subscription',
        tags: ['billing'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const subscription = await billingService.getMySubscription(user.id)
        return reply.send({ subscription })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(404).send({
          error: error.message || 'No subscription found',
        })
      }
    }
  )

  // GET /billing/subscriptions - List all subscriptions for current user
  fastify.get(
    '/subscriptions',
    {
      schema: {
        description: 'List all subscriptions for current user (across all organizations)',
        tags: ['billing'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const subscriptions = await billingService.listUserSubscriptions(user.id)
        return reply.send({ subscriptions })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to fetch subscriptions',
        })
      }
    }
  )

  // POST /billing/subscriptions - Create subscription directly
  fastify.post(
    '/subscriptions',
    {
      schema: {
        description: 'Create subscription directly (not via checkout)',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          orgId: z.string().uuid(),
          priceId: z.string().min(1),
          customerId: z.string().min(1),
          paymentMethodId: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          orgId: string
          priceId: string
          customerId: string
          paymentMethodId?: string
        }
        const result = await billingService.createSubscriptionDirect(body)
        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create subscription',
        })
      }
    }
  )

  // POST /billing/subscriptions/:orgId/cancel - Cancel subscription
  fastify.post(
    '/subscriptions/:orgId/cancel',
    {
      schema: {
        description: 'Cancel subscription for an organization',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          cancelImmediately: z.boolean().optional().default(false),
        }).optional()),
      ],
    },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }
        const body = (request.body as { cancelImmediately?: boolean }) || {}
        const subscription = await billingService.cancelSubscription(
          orgId,
          body.cancelImmediately || false
        )
        return reply.send({ subscription, canceled: true })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to cancel subscription',
        })
      }
    }
  )

  // POST /billing/subscriptions/:orgId/change-plan - Upgrade/downgrade subscription
  fastify.post(
    '/subscriptions/:orgId/change-plan',
    {
      schema: {
        description: 'Change subscription plan (upgrade or downgrade)',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          planSlug: z.enum(['package-a', 'package-b', 'package-c', 'package-d']),
          interval: z.enum(['month', 'year']).optional().default('month'),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }
        const body = request.body as {
          planSlug: 'package-a' | 'package-b' | 'package-c' | 'package-d'
          interval?: 'month' | 'year'
        }
        const subscription = await billingService.changeSubscriptionPlan(
          orgId,
          body.planSlug,
          body.interval || 'month'
        )
        return reply.send({ subscription, planChanged: true })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to change subscription plan',
        })
      }
    }
  )

  // PATCH /billing/subscriptions/:subscriptionId - Update subscription (cancel, reactivate, upgrade, downgrade)
  fastify.patch(
    '/subscriptions/:subscriptionId',
    {
      schema: {
        description: 'Update subscription (cancel, reactivate, upgrade, downgrade)',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateParams(z.object({ subscriptionId: z.string() })),
        validateBody(z.object({
          action: z.enum(['cancel', 'reactivate', 'upgrade', 'downgrade']),
          newPriceId: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { subscriptionId } = request.params as { subscriptionId: string }
        const body = request.body as {
          action: 'cancel' | 'reactivate' | 'upgrade' | 'downgrade'
          newPriceId?: string
        }

        // Get subscription from database to find orgId
        const subscription = await prismaAny.serviceSubscription.findUnique({
          where: { stripeId: subscriptionId },
          include: { servicePlan: true },
        })

        if (!subscription) {
          return reply.code(404).send({ error: 'Subscription not found' })
        }

        const stripe = getStripe()
        let updatedSubscription: Stripe.Subscription

        switch (body.action) {
          case 'cancel':
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: true,
            })
            break

          case 'reactivate':
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false,
            })
            break

          case 'upgrade':
          case 'downgrade':
            if (!body.newPriceId) {
              return reply.code(400).send({ error: 'newPriceId is required for upgrade/downgrade' })
            }
            const currentSub = await stripe.subscriptions.retrieve(subscriptionId)
            updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
              items: [{
                id: currentSub.items.data[0].id,
                price: body.newPriceId,
              }],
              proration_behavior: 'create_prorations',
            })
            break

          default:
            return reply.code(400).send({ error: 'Invalid action' })
        }

        // Subscription will be synced via webhook, but we can trigger a manual sync if needed
        // The webhook handler will handle the sync automatically

        return reply.send({
          success: true,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            current_period_end: new Date(updatedSubscription.current_period_end * 1000),
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update subscription',
        })
      }
    }
  )

  // GET /billing/reports/revenue - Get revenue report
  fastify.get(
    '/reports/revenue',
    {
      schema: {
        description: 'Get revenue reports',
        tags: ['billing'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          startDate?: string
          endDate?: string
          orgId?: string
        }
        const report = await billingService.getRevenueReport({
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          orgId: query.orgId,
        })
        return reply.send({ report })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get revenue report',
        })
      }
    }
  )

  // GET /billing/reports/subscription-metrics - Get subscription metrics
  fastify.get(
    '/reports/subscription-metrics',
    {
      schema: {
        description: 'Get subscription metrics for reporting',
        tags: ['billing'],
      },
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          startDate?: string
          endDate?: string
          orgId?: string
        }
        const metrics = await billingService.getSubscriptionMetrics({
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          orgId: query.orgId,
        })
        return reply.send({ metrics })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get subscription metrics',
        })
      }
    }
  )

  // POST /billing/reports/revenue/send-email - Send revenue report via email
  fastify.post(
    '/reports/revenue/send-email',
    {
      schema: {
        description: 'Send revenue report via email',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          recipient: z.string().email(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          orgId: z.string().uuid().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          recipient: string
          startDate?: string
          endDate?: string
          orgId?: string
        }
        await billingService.sendRevenueReportEmail(body.recipient, {
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          orgId: body.orgId,
        })
        return reply.send({ success: true, message: 'Revenue report email queued' })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to send revenue report email',
        })
      }
    }
  )

  // POST /billing/reports/subscription-metrics/send-email - Send subscription metrics via email
  fastify.post(
    '/reports/subscription-metrics/send-email',
    {
      schema: {
        description: 'Send subscription metrics report via email',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          recipient: z.string().email(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          orgId: z.string().uuid().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          recipient: string
          startDate?: string
          endDate?: string
          orgId?: string
        }
        await billingService.sendSubscriptionMetricsEmail(body.recipient, {
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          orgId: body.orgId,
        })
        return reply.send({ success: true, message: 'Subscription metrics email queued' })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to send subscription metrics email',
        })
      }
    }
  )

  // GET /billing/subscriptions/:orgId/details - Get detailed subscription information for billing dashboard
  fastify.get(
    '/subscriptions/:orgId/details',
    {
      schema: {
        description: 'Get detailed subscription information including Stripe customer and payment details',
        tags: ['billing'],
      },
      preHandler: [
        authenticateUser,
        validateParams(z.object({ orgId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }
        const details = await billingService.getSubscriptionDetails(orgId)
        return reply.send({ details })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Failed to get subscription details',
        })
      }
    }
  )
}

