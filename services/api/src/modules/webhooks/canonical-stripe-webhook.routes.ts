/**
 * Canonical Stripe Webhook Route
 *
 * This is the SINGLE production webhook endpoint for all Stripe events.
 * It consolidates three previously-competing endpoints:
 *   1. /billing/stripe/webhook    (billing.routes.ts)
 *   2. /payments/webhooks/stripe  (payment-webhook.routes.ts)
 *   3. /webhooks/stripe           (routes/stripe-webhook.routes.ts — was disabled)
 *
 * Register once at POST /webhooks/stripe.
 * Configure your Stripe Dashboard webhook to point here.
 *
 * Migration notes:
 * - /billing/stripe/webhook now 301-redirects to /webhooks/stripe
 * - /payments/webhooks/stripe now 301-redirects to /webhooks/stripe
 * - The old /webhooks/stripe (routes/stripe-webhook.routes.ts) remains disabled
 *   in index.ts and can be deleted after confirming no traffic.
 */

import { FastifyInstance } from 'fastify'
import { handleStripeWebhook } from './stripe.webhook'

export async function canonicalStripeWebhookRoutes(fastify: FastifyInstance) {
  // ── Canonical endpoint ──
  fastify.post(
    '/stripe',
    {
      config: { rawBody: true },
      schema: {
        description: 'Canonical Stripe webhook receiver — handles all Stripe event types',
        tags: ['Webhooks'],
        hide: true,
      },
    },
    async (request, reply) => {
      await handleStripeWebhook(request, reply)
    }
  )

  fastify.log.info('Canonical Stripe webhook route registered at POST /webhooks/stripe')
}
