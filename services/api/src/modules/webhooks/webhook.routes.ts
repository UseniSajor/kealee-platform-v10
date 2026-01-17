/**
 * Webhook Routes
 * Handles incoming webhooks from external services
 */

import { FastifyInstance } from 'fastify';
import { handleStripeWebhook } from './stripe.webhook';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe webhook endpoint
  fastify.post(
    '/webhooks/stripe',
    {
      config: {
        // Enable raw body for Stripe signature verification
        rawBody: true,
      },
    },
    handleStripeWebhook
  );

  // Health check for webhooks
  fastify.get('/webhooks/health', async () => {
    return { status: 'ok', service: 'webhooks' };
  });
}
