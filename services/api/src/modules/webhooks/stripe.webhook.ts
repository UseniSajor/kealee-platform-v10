/**
 * stripe.webhook.ts — compatibility shim
 * billing.routes.ts dynamically imports handleStripeWebhook from this file.
 * The actual webhook logic lives in stripe-webhook.handler.ts.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'

export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Stripe webhook handling is performed by the dedicated handler registered
  // via registerStripeWebhookHandler in stripe-webhook.handler.ts.
  // This stub satisfies the dynamic import in billing.routes.ts.
  return reply.status(200).send({ received: true })
}
