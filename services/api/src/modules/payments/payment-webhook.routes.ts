/**
 * Payment Webhook Routes — DEPRECATED
 *
 * This endpoint previously handled Stripe payment webhooks at /payments/webhooks/stripe.
 * It is now superseded by the canonical endpoint at POST /webhooks/stripe
 * (registered via canonical-stripe-webhook.routes.ts).
 *
 * This shim forwards requests to the canonical handler so in-flight Stripe
 * retries are not lost.  Remove this file once the Stripe Dashboard webhook
 * URL has been updated and no traffic is observed on this path.
 */

import { FastifyInstance } from 'fastify'

export async function paymentWebhookRoutes(fastify: FastifyInstance) {
  // POST /payments/webhooks/stripe — DEPRECATED, forwards to canonical handler
  fastify.post(
    '/webhooks/stripe',
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      const { handleStripeWebhook } = await import('../webhooks/stripe.webhook')
      request.log.warn('DEPRECATED: /payments/webhooks/stripe called — migrate to /webhooks/stripe')
      await handleStripeWebhook(request, reply)
    }
  )
}
