/**
 * Stripe Webhook Handler
 * Handles all Stripe webhook events for subscriptions and payments
 */

import Stripe from 'stripe';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@kealee/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
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

  // TODO: Create subscription in database once Prisma models are added
  console.log('Subscription details:', {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    status: subscription.status,
    packageId,
    billingCycleAnchor: new Date(subscription.billing_cycle_anchor * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // TODO: Send confirmation email
  // TODO: Provision access to services
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  // TODO: Update subscription in database once Prisma models are added
  console.log('Subscription update:', {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    stripePriceId: subscription.items.data[0].price.id,
    packageId: subscription.metadata.packageId,
    billingCycleAnchor: new Date(subscription.billing_cycle_anchor * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // TODO: Update user access if package changed
  // TODO: Send notification email
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  // TODO: Update subscription in database once Prisma models are added
  console.log('Subscription canceled:', {
    stripeSubscriptionId: subscription.id,
    status: 'canceled',
    canceledAt: new Date(),
  });

  // TODO: Revoke access to services
  // TODO: Send cancellation confirmation email
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('💰 Invoice paid:', invoice.id);

  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;

  if (subscriptionId) {
    // TODO: Update subscription payment status once Prisma models are added
    console.log('Invoice paid, subscription now active:', {
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    });

    // TODO: Create payment record in database
    // TODO: Send receipt email
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️  Invoice payment failed:', invoice.id);

  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id;

  if (subscriptionId) {
    // TODO: Update subscription status once Prisma models are added
    console.log('Invoice payment failed, subscription past due:', {
      stripeSubscriptionId: subscriptionId,
      status: 'past_due',
      invoiceId: invoice.id,
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
    // TODO: Create payment record once Prisma models are added
    console.log('One-time payment succeeded:', {
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      metadata: paymentIntent.metadata,
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
