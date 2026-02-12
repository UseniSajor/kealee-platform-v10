/**
 * Stripe Webhook Route
 *
 * Consolidated webhook endpoint for all Stripe events.
 * Handles: checkout sessions, subscriptions, invoices,
 * payment intents, Connect accounts, and transfers.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@kealee/database';
import { getStripe } from '../../modules/billing/stripe.client';

const prisma = new PrismaClient();
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export default async function stripeWebhookRoutes(fastify: FastifyInstance) {
  // Disable body parsing for webhook route — Stripe needs raw body
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body);
    }
  );

  fastify.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    if (!WEBHOOK_SECRET) {
      fastify.log.error('STRIPE_WEBHOOK_SECRET is not configured');
      return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        signature,
        WEBHOOK_SECRET
      );
    } catch (err: any) {
      fastify.log.error(`Webhook signature verification failed: ${err.message}`);
      return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
    }

    fastify.log.info(`Stripe webhook received: ${event.type} (${event.id})`);

    try {
      await handleEvent(event, fastify);
    } catch (err: any) {
      fastify.log.error(`Error processing webhook ${event.type}: ${err.message}`);
      // Still return 200 to prevent Stripe retries for app-level errors
    }

    return reply.status(200).send({ received: true, type: event.type });
  });
}

// ============================================================================
// EVENT ROUTER
// ============================================================================

async function handleEvent(event: Stripe.Event, fastify: FastifyInstance): Promise<void> {
  const data = event.data.object;

  switch (event.type) {
    // Checkout
    case 'checkout.session.completed':
      await onCheckoutCompleted(data as Stripe.Checkout.Session, fastify);
      break;

    // Subscriptions
    case 'customer.subscription.updated':
      await onSubscriptionUpdated(data as Stripe.Subscription, fastify);
      break;
    case 'customer.subscription.deleted':
      await onSubscriptionDeleted(data as Stripe.Subscription, fastify);
      break;

    // Invoices
    case 'invoice.payment_succeeded':
      await onInvoicePaid(data as Stripe.Invoice, fastify);
      break;
    case 'invoice.payment_failed':
      await onInvoicePaymentFailed(data as Stripe.Invoice, fastify);
      break;

    // Payments
    case 'payment_intent.succeeded':
      await onPaymentSucceeded(data as Stripe.PaymentIntent, fastify);
      break;
    case 'payment_intent.payment_failed':
      await onPaymentFailed(data as Stripe.PaymentIntent, fastify);
      break;

    // Connect
    case 'account.updated':
      await onConnectAccountUpdated(data as Stripe.Account, fastify);
      break;
    case 'transfer.created':
      await onTransferCreated(data as Stripe.Transfer, fastify);
      break;

    default:
      fastify.log.info(`Unhandled webhook event: ${event.type}`);
  }
}

// ============================================================================
// CHECKOUT
// ============================================================================

async function onCheckoutCompleted(session: Stripe.Checkout.Session, fastify: FastifyInstance) {
  fastify.log.info(`Checkout completed: ${session.id}`);

  const orgId = session.metadata?.orgId;
  const planSlug = session.metadata?.planSlug;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  // Link Stripe customer to user if not already linked
  if (customerId && session.customer_email) {
    await prisma.user.updateMany({
      where: { email: session.customer_email, stripeCustomerId: null },
      data: { stripeCustomerId: customerId },
    });
  }

  // Log the event (no Event model in schema; use structured logging)
  if (orgId) {
    fastify.log.info({
      event: 'CHECKOUT_COMPLETED',
      entityType: 'Org',
      entityId: orgId,
      payload: {
        sessionId: session.id,
        planSlug,
        customerId,
        amountTotal: session.amount_total,
        mode: session.mode,
      },
    }, `Checkout completed for org ${orgId}`);
  }
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

async function onSubscriptionUpdated(subscription: Stripe.Subscription, fastify: FastifyInstance) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  fastify.log.info(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  // Find user by stripeCustomerId
  const user = customerId
    ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    : null;

  // Log the event (no Event model in schema; use structured logging)
  fastify.log.info({
    event: 'SUBSCRIPTION_UPDATED',
    entityType: 'User',
    entityId: user?.id || 'unknown',
    payload: {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
    },
  }, `Subscription updated: ${subscription.id}`);
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription, fastify: FastifyInstance) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  fastify.log.info(`Subscription deleted: ${subscription.id}`);

  const user = customerId
    ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    : null;

  // Log the event (no Event model in schema; use structured logging)
  fastify.log.info({
    event: 'SUBSCRIPTION_CANCELED',
    entityType: 'User',
    entityId: user?.id || 'unknown',
    payload: {
      subscriptionId: subscription.id,
      canceledAt: new Date().toISOString(),
    },
  }, `Subscription canceled: ${subscription.id}`);
}

// ============================================================================
// INVOICES
// ============================================================================

async function onInvoicePaid(invoice: Stripe.Invoice, fastify: FastifyInstance) {
  fastify.log.info(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);

  // Upsert Invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number || undefined,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency,
      status: 'paid',
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
      paidAt: new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    },
    update: {
      status: 'paid',
      paidAt: new Date(),
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    },
  });
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice, fastify: FastifyInstance) {
  fastify.log.info(`Invoice payment failed: ${invoice.id}, attempts: ${invoice.attempt_count}`);

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number || undefined,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency,
      status: 'uncollectible',
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    },
    update: {
      status: 'uncollectible',
    },
  });
}

// ============================================================================
// PAYMENT INTENTS
// ============================================================================

async function onPaymentSucceeded(pi: Stripe.PaymentIntent, fastify: FastifyInstance) {
  fastify.log.info(`Payment succeeded: ${pi.id}, amount: ${pi.amount}`);

  // Record Payment
  await prisma.payment.upsert({
    where: { stripePaymentIntentId: pi.id },
    create: {
      stripePaymentIntentId: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: 'completed',
      paidAt: new Date(),
      projectId: pi.metadata?.projectId || undefined,
      metadata: {
        type: pi.metadata?.type,
        escrowId: pi.metadata?.escrowId,
      },
    },
    update: {
      status: 'completed',
      paidAt: new Date(),
    },
  });

  // Handle escrow deposit
  if (pi.metadata?.type === 'escrow_deposit' && pi.metadata?.escrowId) {
    await handleEscrowDeposit(pi, fastify);
  }
}

async function onPaymentFailed(pi: Stripe.PaymentIntent, fastify: FastifyInstance) {
  fastify.log.info(`Payment failed: ${pi.id}`);

  await prisma.payment.upsert({
    where: { stripePaymentIntentId: pi.id },
    create: {
      stripePaymentIntentId: pi.id,
      amount: pi.amount / 100,
      currency: pi.currency,
      status: 'failed',
      failedAt: new Date(),
      metadata: {
        errorCode: pi.last_payment_error?.code,
        errorMessage: pi.last_payment_error?.message,
      },
    },
    update: {
      status: 'failed',
      failedAt: new Date(),
    },
  });
}

async function handleEscrowDeposit(pi: Stripe.PaymentIntent, fastify: FastifyInstance) {
  const escrowId = pi.metadata.escrowId;

  try {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      fastify.log.error(`Escrow not found for deposit: ${escrowId}`);
      return;
    }

    const depositAmount = pi.amount / 100;
    const currentBalance = Number(escrow.currentBalance);
    const availableBalance = Number(escrow.availableBalance);
    const isFirstDeposit = currentBalance === 0;

    // Create escrow transaction
    await prisma.escrowTransaction.create({
      data: {
        escrowId,
        type: 'DEPOSIT',
        amount: depositAmount,
        currency: pi.currency.toUpperCase(),
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + depositAmount,
        status: 'COMPLETED',
        stripePaymentId: pi.id,
        reference: pi.id,
        processedDate: new Date(),
        initiatedBy: pi.metadata.userId || 'system',
      },
    });

    // Update escrow balances
    await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        currentBalance: { increment: depositAmount },
        availableBalance: { increment: depositAmount },
        status: isFirstDeposit ? 'ACTIVE' : undefined,
        activatedAt: isFirstDeposit ? new Date() : undefined,
      },
    });

    fastify.log.info(`Escrow deposit processed: ${escrowId}, amount: ${depositAmount}`);
  } catch (err: any) {
    fastify.log.error(`Failed to process escrow deposit: ${err.message}`);
  }
}

// ============================================================================
// CONNECT
// ============================================================================

async function onConnectAccountUpdated(account: Stripe.Account, fastify: FastifyInstance) {
  fastify.log.info(`Connect account updated: ${account.id}`);

  try {
    const connectedAccount = await prisma.connectedAccount.findUnique({
      where: { stripeAccountId: account.id },
    });

    if (!connectedAccount) {
      fastify.log.warn(`No ConnectedAccount found for Stripe account: ${account.id}`);
      return;
    }

    await prisma.connectedAccount.update({
      where: { stripeAccountId: account.id },
      data: {
        status: account.details_submitted
          ? account.charges_enabled && account.payouts_enabled
            ? 'ACTIVE'
            : 'RESTRICTED'
          : 'PENDING',
        hasCompletedOnboarding: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        requirements: account.requirements as any,
      },
    });
  } catch (err: any) {
    fastify.log.error(`Failed to update Connect account: ${err.message}`);
  }
}

async function onTransferCreated(transfer: Stripe.Transfer, fastify: FastifyInstance) {
  fastify.log.info(`Transfer created: ${transfer.id}, amount: ${transfer.amount}, to: ${transfer.destination}`);

  const escrowId = transfer.metadata?.escrowId;
  const milestoneId = transfer.metadata?.milestoneId;

  if (escrowId) {
    // Log the event (no Event model in schema; use structured logging)
    fastify.log.info({
      event: 'ESCROW_TRANSFER_COMPLETED',
      entityType: 'EscrowAgreement',
      entityId: escrowId,
      payload: {
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
        milestoneId,
      },
    }, `Escrow transfer completed: ${transfer.id} for escrow ${escrowId}`);
  }
}
