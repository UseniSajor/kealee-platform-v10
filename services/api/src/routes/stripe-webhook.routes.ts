/**
 * Stripe Webhook Routes
 * Handles Stripe webhook events with signature verification
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stripeWebhookSecurityService } from '../modules/webhooks/stripe-webhook-security.service';
import { depositService } from '../modules/deposits/deposit.service';
import { escrowService } from '../modules/escrow/escrow.service';

export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /webhooks/stripe
   * Stripe webhook endpoint
   */
  fastify.post(
    '/stripe',
    {
      config: {
        rawBody: true, // Required for signature verification
      },
      schema: {
        description: 'Stripe webhook handler',
        tags: ['Webhooks'],
        hide: true, // Hide from Swagger (public endpoint)
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Verify webhook signature
        const verification = await stripeWebhookSecurityService.verifyWebhookSignature(request);

        if (!verification.isValid) {
          fastify.log.error({ error: verification.error }, 'Webhook signature verification failed');
          return reply.status(400).send({
            error: 'Webhook signature verification failed',
          });
        }

        const event = verification.event!;
        fastify.log.info(`Processing Stripe event: ${event.type} (${event.id})`);

        // Handle different event types
        switch (event.type) {
          // ===== PAYMENT INTENT EVENTS =====
          case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event);
            break;

          case 'payment_intent.payment_failed':
            await handlePaymentIntentFailed(event);
            break;

          case 'payment_intent.canceled':
            await handlePaymentIntentCanceled(event);
            break;

          case 'payment_intent.processing':
            await handlePaymentIntentProcessing(event);
            break;

          // ===== CHARGE EVENTS =====
          case 'charge.succeeded':
            await handleChargeSucceeded(event);
            break;

          case 'charge.failed':
            await handleChargeFailed(event);
            break;

          case 'charge.refunded':
            await handleChargeRefunded(event);
            break;

          // ===== PAYOUT EVENTS (for Stripe Connect) =====
          case 'payout.paid':
            await handlePayoutPaid(event);
            break;

          case 'payout.failed':
            await handlePayoutFailed(event);
            break;

          // ===== PAYMENT METHOD EVENTS =====
          case 'payment_method.attached':
            await handlePaymentMethodAttached(event);
            break;

          case 'payment_method.detached':
            await handlePaymentMethodDetached(event);
            break;

          // ===== CUSTOMER EVENTS =====
          case 'customer.updated':
            await handleCustomerUpdated(event);
            break;

          case 'customer.deleted':
            await handleCustomerDeleted(event);
            break;

          default:
            fastify.log.info(`Unhandled event type: ${event.type}`);
        }

        // Log successful processing
        await stripeWebhookSecurityService.logWebhookEvent(event, 'SUCCESS');

        return reply.status(200).send({ received: true });
      } catch (error: any) {
        fastify.log.error('Webhook processing error:', error);

        // Log failed processing
        if ((request as any).stripeEvent) {
          await stripeWebhookSecurityService.logWebhookEvent(
            (request as any).stripeEvent,
            'FAILED',
            error.message
          );
        }

        return reply.status(500).send({
          error: 'Webhook processing failed',
        });
      }
    }
  );

  fastify.log.info('✅ Stripe webhook routes registered');
}

// ===== EVENT HANDLERS =====

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  const chargeId = paymentIntent.latest_charge;

  // Update deposit status to CLEARING or COMPLETED
  await depositService.handleSuccessfulPayment(paymentIntent.id, chargeId);
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object;
  const error = paymentIntent.last_payment_error;

  await depositService.handleFailedPayment(paymentIntent.id, {
    message: error?.message || 'Payment failed',
    code: error?.code || 'UNKNOWN',
  });
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(event: any) {
  const paymentIntent = event.data.object;

  await depositService.handleFailedPayment(paymentIntent.id, {
    message: 'Payment canceled',
    code: 'CANCELED',
  });
}

/**
 * Handle processing payment intent
 */
async function handlePaymentIntentProcessing(event: any) {
  const paymentIntent = event.data.object;

  // Payment is being processed (ACH transfers)
  // Status is already PROCESSING in database
  console.log(`Payment intent ${paymentIntent.id} is processing`);
}

/**
 * Handle successful charge
 */
async function handleChargeSucceeded(event: any) {
  const charge = event.data.object;
  const paymentIntentId = charge.payment_intent;

  // This event fires after payment_intent.succeeded
  // Can be used for additional processing if needed
  console.log(`Charge ${charge.id} succeeded for payment intent ${paymentIntentId}`);
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(event: any) {
  const charge = event.data.object;
  const paymentIntentId = charge.payment_intent;

  console.log(`Charge ${charge.id} failed for payment intent ${paymentIntentId}`);
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(event: any) {
  const charge = event.data.object;
  const refunds = charge.refunds.data;

  console.log(`Charge ${charge.id} refunded. Refunds:`, refunds);
  // TODO: Handle refund logic (update escrow, journal entries)
}

/**
 * Handle successful payout (Stripe Connect)
 */
async function handlePayoutPaid(event: any) {
  const payout = event.data.object;
  const metadata = payout.metadata;

  // Complete escrow transaction
  if (metadata.escrowTransactionId) {
    await escrowService.completeEscrowTransaction(
      metadata.escrowTransactionId,
      payout.id
    );
  }
}

/**
 * Handle failed payout (Stripe Connect)
 */
async function handlePayoutFailed(event: any) {
  const payout = event.data.object;
  const metadata = payout.metadata;
  const failureMessage = payout.failure_message || 'Payout failed';

  // Fail escrow transaction and rollback
  if (metadata.escrowTransactionId) {
    await escrowService.failEscrowTransaction(
      metadata.escrowTransactionId,
      failureMessage
    );
  }
}

/**
 * Handle payment method attached
 */
async function handlePaymentMethodAttached(event: any) {
  const paymentMethod = event.data.object;
  console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
}

/**
 * Handle payment method detached
 */
async function handlePaymentMethodDetached(event: any) {
  const paymentMethod = event.data.object;
  console.log(`Payment method ${paymentMethod.id} detached`);
}

/**
 * Handle customer updated
 */
async function handleCustomerUpdated(event: any) {
  const customer = event.data.object;
  console.log(`Customer ${customer.id} updated`);
}

/**
 * Handle customer deleted
 */
async function handleCustomerDeleted(event: any) {
  const customer = event.data.object;
  console.log(`Customer ${customer.id} deleted`);
}

