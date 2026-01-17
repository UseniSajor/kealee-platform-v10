/**
 * Stripe Webhook Handler
 * Handles all Stripe webhook events for subscriptions and payments
 */

import Stripe from 'stripe';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@kealee/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Main webhook handler
 */
export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const signature = request.headers['stripe-signature'] as string;

  if (!signature) {
    return reply.code(400).send({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      request.rawBody!,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return reply.code(400).send({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return reply.code(200).send({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook event:', err);
    return reply.code(500).send({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('✅ Subscription created:', subscription.id);

  const customerId = subscription.customer as string;
  const packageId = subscription.metadata.packageId;
  const priceId = subscription.items.data[0].price.id;

  // Create or update subscription in database
  await prisma.subscription.create({
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      status: subscription.status,
      packageId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // TODO: Send confirmation email
  // TODO: Provision access to services
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      stripePriceId: subscription.items.data[0].price.id,
      packageId: subscription.metadata.packageId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // TODO: Update user access if package changed
  // TODO: Send notification email
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  // TODO: Revoke access to services
  // TODO: Send cancellation confirmation email
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('💰 Invoice paid:', invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    // Update subscription payment status
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'active',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      },
    });

    // TODO: Send receipt email
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️  Invoice payment failed:', invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'past_due',
      },
    });

    // TODO: Send payment failed email
    // TODO: Notify admin
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  // Handle one-time payments (e.g., permit acceleration)
  if (paymentIntent.metadata.type === 'one_time') {
    await prisma.payment.create({
      data: {
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        paidAt: new Date(),
        metadata: paymentIntent.metadata,
      },
    });

    // TODO: Provision service based on metadata
    // TODO: Send confirmation email
  }
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);

  // TODO: Log failed payment
  // TODO: Notify user
  // TODO: Notify admin if needed
}
