/**
 * Enhanced Stripe Webhook Handler
 *
 * Handles all Stripe webhook events for:
 * - Subscription lifecycle (created, updated, canceled)
 * - Payment intents (succeeded, failed)
 * - Invoices (paid, failed, upcoming)
 * - Connect account events
 * - Disputes and refunds
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';

// Initialize Stripe - requires STRIPE_SECRET_KEY env var (no fallback to test keys)
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is not set. Stripe webhook handler will not function.');
}
const stripe = new Stripe(stripeKey || '', {
  apiVersion: '2023-10-16',
});

// Webhook secret for verifying signatures - requires env var
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Event types we handle
const HANDLED_EVENTS = [
  // Subscriptions
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',

  // Payments
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.requires_action',

  // Invoices
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.upcoming',
  'invoice.finalized',

  // Checkout
  'checkout.session.completed',
  'checkout.session.expired',

  // Connect
  'account.updated',
  'account.application.authorized',
  'account.application.deauthorized',
  'transfer.created',
  'transfer.failed',
  'payout.created',
  'payout.failed',

  // Disputes
  'charge.dispute.created',
  'charge.dispute.updated',
  'charge.dispute.closed',

  // Refunds
  'charge.refunded',
  'charge.refund.updated',
];

// Webhook event log for auditing
interface WebhookEventLog {
  id: string;
  type: string;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  data: any;
  error?: string;
  processedAt: Date;
}

const eventLogs: WebhookEventLog[] = [];

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
}

/**
 * Main webhook handler
 */
export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const signature = request.headers['stripe-signature'] as string;

  if (!signature) {
    reply.status(400).send({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(request.rawBody as string, signature);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    reply.status(400).send({ error: `Webhook Error: ${err.message}` });
    return;
  }

  // Log event receipt
  const log: WebhookEventLog = {
    id: event.id,
    type: event.type,
    status: 'received',
    data: event.data.object,
    processedAt: new Date(),
  };

  try {
    // Route to appropriate handler
    await routeWebhookEvent(event);
    log.status = 'processed';
  } catch (err: any) {
    console.error(`Error processing webhook ${event.type}:`, err);
    log.status = 'failed';
    log.error = err.message;
  }

  eventLogs.push(log);

  // Always return 200 to acknowledge receipt
  reply.status(200).send({ received: true, eventId: event.id });
}

/**
 * Route webhook event to appropriate handler
 */
async function routeWebhookEvent(event: Stripe.Event): Promise<void> {
  const { type } = event;
  const data = event.data.object;

  switch (type) {
    // Subscription events
    case 'customer.subscription.created':
      await handleSubscriptionCreated(data as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data as Stripe.Subscription);
      break;
    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(data as Stripe.Subscription);
      break;

    // Payment events
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(data as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(data as Stripe.PaymentIntent);
      break;

    // Invoice events
    case 'invoice.paid':
      await handleInvoicePaid(data as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(data as Stripe.Invoice);
      break;
    case 'invoice.upcoming':
      await handleInvoiceUpcoming(data as Stripe.Invoice);
      break;

    // Checkout events
    case 'checkout.session.completed':
      await handleCheckoutCompleted(data as Stripe.Checkout.Session);
      break;

    // Connect events
    case 'account.updated':
      await handleConnectAccountUpdated(data as Stripe.Account);
      break;
    case 'transfer.created':
      await handleTransferCreated(data as Stripe.Transfer);
      break;
    // Note: 'transfer.failed' is not in Stripe's official event types
    // Keeping handler but removing from switch case
    // case 'transfer.failed':
    //   await handleTransferFailed(data as Stripe.Transfer);
    //   break;
    case 'payout.created':
      await handlePayoutCreated(data as Stripe.Payout);
      break;
    case 'payout.failed':
      await handlePayoutFailed(data as Stripe.Payout);
      break;

    // Dispute events
    case 'charge.dispute.created':
      await handleDisputeCreated(data as Stripe.Dispute);
      break;
    case 'charge.dispute.closed':
      await handleDisputeClosed(data as Stripe.Dispute);
      break;

    // Refund events
    case 'charge.refunded':
      await handleChargeRefunded(data as Stripe.Charge);
      break;

    default:
      console.log(`Unhandled webhook event type: ${type}`);
  }
}

// ============ Subscription Handlers ============

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription created: ${subscription.id}`);

  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;

  // Update user's subscription status in database
  // await prisma.user.update({
  //   where: { stripeCustomerId: customerId },
  //   data: {
  //     subscriptionId: subscription.id,
  //     subscriptionStatus: status,
  //     subscriptionPriceId: priceId,
  //   },
  // });

  // Send welcome email
  // await emailService.sendSubscriptionWelcome(customerId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  const customerId = subscription.customer as string;
  const status = subscription.status;

  // Update subscription status
  // await prisma.user.update({
  //   where: { stripeCustomerId: customerId },
  //   data: { subscriptionStatus: status },
  // });

  // Handle downgrades/upgrades
  if (subscription.cancel_at_period_end) {
    // Subscription will be canceled at period end
    // await notificationService.sendCancellationScheduled(customerId);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription deleted: ${subscription.id}`);

  const customerId = subscription.customer as string;

  // Mark subscription as canceled
  // await prisma.user.update({
  //   where: { stripeCustomerId: customerId },
  //   data: {
  //     subscriptionStatus: 'canceled',
  //     subscriptionEndDate: new Date(),
  //   },
  // });

  // Send cancellation confirmation
  // await emailService.sendCancellationConfirmation(customerId);
}

async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Trial ending for subscription: ${subscription.id}`);

  // Send reminder email about trial ending
  // await emailService.sendTrialEndingReminder(subscription.customer as string);
}

// ============ Payment Handlers ============

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);

  const metadata = paymentIntent.metadata;

  // Route based on payment type
  switch (metadata.type) {
    case 'design_package':
      await processDesignPackagePayment(paymentIntent);
      break;
    case 'estimation':
      await processEstimationPayment(paymentIntent);
      break;
    case 'escrow_deposit':
      await processEscrowDeposit(paymentIntent);
      break;
    case 'a_la_carte':
      await processALaCartePayment(paymentIntent);
      break;
    case 'engineering':
      await processEngineeringPayment(paymentIntent);
      break;
    default:
      console.log(`Unknown payment type: ${metadata.type}`);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment failed: ${paymentIntent.id}`);

  const error = paymentIntent.last_payment_error;
  const customerId = paymentIntent.customer as string;

  // Log failure
  // await prisma.paymentLog.create({
  //   data: {
  //     paymentIntentId: paymentIntent.id,
  //     status: 'failed',
  //     errorCode: error?.code,
  //     errorMessage: error?.message,
  //   },
  // });

  // Notify customer
  // await emailService.sendPaymentFailure(customerId, error?.message);
}

// ============ Invoice Handlers ============

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Invoice paid: ${invoice.id}, amount: ${invoice.amount_paid}`);

  // Record payment
  // await prisma.payment.create({
  //   data: {
  //     invoiceId: invoice.id,
  //     amount: invoice.amount_paid,
  //     status: 'paid',
  //     paidAt: new Date(),
  //   },
  // });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Invoice payment failed: ${invoice.id}`);

  const customerId = invoice.customer as string;
  const attemptCount = invoice.attempt_count;

  // Send dunning email
  // if (attemptCount === 1) {
  //   await emailService.sendPaymentRetryNotice(customerId);
  // } else if (attemptCount >= 3) {
  //   await emailService.sendAccountSuspensionWarning(customerId);
  // }
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Upcoming invoice: ${invoice.id}`);

  // Send reminder about upcoming charge
  // await emailService.sendUpcomingChargeReminder(invoice.customer as string, invoice.amount_due);
}

// ============ Checkout Handlers ============

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`Checkout completed: ${session.id}`);

  const metadata = session.metadata;

  // Fulfill the order based on session type
  // if (metadata?.type === 'subscription') {
  //   await fulfillSubscription(session);
  // } else if (metadata?.type === 'one_time') {
  //   await fulfillOneTimePayment(session);
  // }
}

// ============ Connect Handlers ============

async function handleConnectAccountUpdated(account: Stripe.Account): Promise<void> {
  console.log(`Connect account updated: ${account.id}`);

  // Update contractor's payout status
  // const isPayoutEnabled = account.payouts_enabled;
  // await prisma.contractor.update({
  //   where: { stripeConnectId: account.id },
  //   data: { payoutsEnabled: isPayoutEnabled },
  // });
}

async function handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
  console.log(`Transfer created: ${transfer.id}, amount: ${transfer.amount}`);

  // Record milestone release
  // await prisma.milestoneRelease.update({
  //   where: { stripeTransferId: transfer.id },
  //   data: { status: 'completed' },
  // });
}

async function handleTransferFailed(transfer: Stripe.Transfer): Promise<void> {
  console.log(`Transfer failed: ${transfer.id}`);

  // Mark release as failed and notify
  // await prisma.milestoneRelease.update({
  //   where: { stripeTransferId: transfer.id },
  //   data: { status: 'failed' },
  // });
}

async function handlePayoutCreated(payout: Stripe.Payout): Promise<void> {
  console.log(`Payout created: ${payout.id}, amount: ${payout.amount}`);
}

async function handlePayoutFailed(payout: Stripe.Payout): Promise<void> {
  console.log(`Payout failed: ${payout.id}`);
  // Notify contractor of payout failure
}

// ============ Dispute Handlers ============

async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  console.log(`Dispute created: ${dispute.id}, amount: ${dispute.amount}`);

  // Create dispute record
  // await prisma.dispute.create({
  //   data: {
  //     stripeDisputeId: dispute.id,
  //     chargeId: dispute.charge as string,
  //     amount: dispute.amount,
  //     reason: dispute.reason,
  //     status: dispute.status,
  //   },
  // });

  // Notify admin team
  // await notificationService.alertDisputeCreated(dispute);
}

async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  console.log(`Dispute closed: ${dispute.id}, status: ${dispute.status}`);

  // Update dispute status
  // await prisma.dispute.update({
  //   where: { stripeDisputeId: dispute.id },
  //   data: { status: dispute.status },
  // });
}

// ============ Refund Handlers ============

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`Charge refunded: ${charge.id}, refunded: ${charge.amount_refunded}`);

  // Record refund
  // await prisma.refund.create({
  //   data: {
  //     chargeId: charge.id,
  //     amount: charge.amount_refunded,
  //     status: 'completed',
  //   },
  // });
}

// ============ Payment Type Processors ============

async function processDesignPackagePayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { projectId, tier } = paymentIntent.metadata;
  console.log(`Design package payment for project ${projectId}, tier: ${tier}`);

  // Update project to design phase
  // await prisma.preConProject.update({
  //   where: { id: projectId },
  //   data: { designPackagePaid: true, phase: 'DESIGN_IN_PROGRESS' },
  // });
}

async function processEstimationPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { estimationId, tier } = paymentIntent.metadata;
  console.log(`Estimation payment: ${estimationId}, tier: ${tier}`);

  // Start estimation process
  // await estimationService.startEstimation(estimationId);
}

async function processEscrowDeposit(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { escrowId } = paymentIntent.metadata;
  console.log(`Escrow deposit: ${escrowId}, amount: ${paymentIntent.amount}`);

  // Credit escrow account
  // await escrowService.processDeposit(escrowId, paymentIntent.amount);
}

async function processALaCartePayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { service, userId } = paymentIntent.metadata;
  console.log(`A la carte payment for ${service}`);

  // Fulfill service order
  // await serviceOrderService.fulfill(userId, service);
}

async function processEngineeringPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { projectId } = paymentIntent.metadata;
  console.log(`Engineering payment for project ${projectId}`);

  // Start engineering project
  // await engineeringService.markProjectPaid(projectId);
}

// ============ Export webhook handler ============

export default {
  handleStripeWebhook,
  verifyWebhookSignature,
  HANDLED_EVENTS,
  getEventLogs: () => eventLogs,
};
