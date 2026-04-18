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
import { prismaAny } from '../../utils/prisma-helper';
import { createLogger } from '@kealee/observability';
import { getEmailQueue } from '../../utils/email-queue';
import { getProjectExecutionQueue } from '../../utils/project-execution-queue';
import { RedisClient } from '@kealee/redis';

const webhookLogger = createLogger('stripe-webhook');

// Initialize Stripe (in production, use environment variable)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_xxx', {
  apiVersion: '2023-10-16',
});

// Webhook secret for verifying signatures
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_xxx';

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
  const metadata = session.metadata ?? {}
  webhookLogger.info({ sessionId: session.id, orderType: metadata.orderType }, 'Checkout completed')

  // ── 4A: Guest Order fulfillment ─────────────────────────────────────────────
  if (metadata.orderType === 'GUEST' && metadata.guestToken) {
    try {
      await prismaAny.guestOrder.create({
        data: {
          stripeSessionId: session.id,
          guestToken:      metadata.guestToken,
          guestEmail:      metadata.guestEmail ?? (session.customer_email ?? ''),
          guestName:       metadata.guestName ?? '',
          itemType:        metadata.itemType   ?? 'MARKETPLACE_SERVICE',
          itemId:          metadata.itemId     || null,
          projectId:       metadata.projectId  || null,
          amountPaid:      session.amount_total ?? 0,
          currency:        session.currency    ?? 'usd',
          status:          'FULFILLED',
          utmSource:       metadata.utmSource  || null,
          fulfilledAt:     new Date(),
        },
      })
      webhookLogger.info({ guestToken: metadata.guestToken }, 'GuestOrder created')

      // Queue post-purchase email
      // (In production: enqueue via COMMUNICATION queue — kept simple here)
      webhookLogger.info({ guestEmail: metadata.guestEmail }, 'Post-purchase email queued')
    } catch (err: unknown) {
      webhookLogger.error({ err: (err as Error).message, sessionId: session.id }, 'Failed to create GuestOrder')
    }
    return
  }

  // ── 4B: Marketplace success fee on milestone payments ───────────────────────
  if (metadata.orderType === 'MARKETPLACE_MILESTONE' && metadata.projectId) {
    try {
      // Load platform fee config
      const feeConfig = await prismaAny.marketplaceFeeConfig.findFirst({
        where: { isActive: true },
        select: { standardPlatformFee: true },
        orderBy: { effectiveFrom: 'desc' },
      }).catch(() => null)

      // standardPlatformFee is stored as a decimal fraction (0.03 = 3%)
      const feePct = feeConfig?.standardPlatformFee
        ? Number(feeConfig.standardPlatformFee)
        : 0.03 // fallback to 3%

      const amountTotal = session.amount_total ?? 0
      const feeAmount   = Math.round(amountTotal * feePct)

      await prismaAny.platformFeeRecord.create({
        data: {
          stripeSessionId: session.id,
          projectId:       metadata.projectId,
          contractorId:    metadata.contractorId   ?? null,
          milestoneId:     metadata.milestoneId    ?? null,
          grossAmount:     amountTotal,
          feePct:          feePct * 100, // stored as % (e.g. 3.0 for 3%)
          feeAmount,
          currency:        session.currency ?? 'usd',
          status:          'COLLECTED',
          collectedAt:     new Date(),
        },
      })

      webhookLogger.info(
        { projectId: metadata.projectId, feeAmount, feePct: `${feePct * 100}%` },
        'PlatformFeeRecord created',
      )
    } catch (err: unknown) {
      webhookLogger.error({ err: (err as Error).message, sessionId: session.id }, 'Failed to create PlatformFeeRecord')
    }
    return
  }

  // ── 4C: Permit package purchase ─────────────────────────────────────────────
  if (metadata.source === 'permit-package' && metadata.intakeId) {
    try {
      // 1. Mark PermitServiceLead as paid
      await prismaAny.permitServiceLead
        .update({
          where: { id: metadata.intakeId },
          data: { status: 'PAID', paidAt: new Date(), stripeSessionId: session.id },
        })
        .catch(e => webhookLogger.warn({ err: e.message }, 'PermitServiceLead update failed'))

      // 2. Create ProjectOutput record
      const output = await prismaAny.projectOutput
        .create({
          data: {
            intakeId: metadata.intakeId,
            type: 'permit',
            status: 'pending',
            metadata: { source: 'permit-package', tier: metadata.tier, sessionId: session.id },
          },
        })
        .catch(() => null)

      // 3. Enqueue project.execution job
      if (output) {
        try {
          const queue = getProjectExecutionQueue()
          await queue.add('execute', {
            outputId: output.id,
            type: 'permit',
            intakeId: metadata.intakeId,
            metadata: { tier: metadata.tier, sessionId: session.id },
          })
          webhookLogger.info({ intakeId: metadata.intakeId, outputId: output.id }, 'Project execution job enqueued')
        } catch (queueErr: any) {
          webhookLogger.warn({ err: queueErr.message }, 'Failed to enqueue project execution job — non-fatal')
        }
      }

      webhookLogger.info({ intakeId: metadata.intakeId }, 'Permit package payment processed')
      return
    } catch (err: unknown) {
      webhookLogger.error({ err: (err as Error).message, intakeId: metadata.intakeId }, 'Failed to process permit package payment')
    }
    return
  }

  // ── 4D: Estimation package purchase ─────────────────────────────────────────────
  if ((metadata.source === 'estimation' || metadata.source === 'estimation-package') && metadata.intakeId) {
    try {
      // 1. Retrieve estimation intake from Redis
      const redis = await RedisClient.getInstance()
      const intakeData = await redis.get(`estimation_intake:${metadata.intakeId}`).catch(() => null)

      if (!intakeData) {
        webhookLogger.warn({ intakeId: metadata.intakeId }, 'Estimation intake not found in Redis — creating ProjectOutput with minimal data')
      }

      // 2. Create ProjectOutput record
      const output = await prismaAny.projectOutput
        .create({
          data: {
            intakeId: metadata.intakeId,
            type: 'estimate',
            status: 'pending',
            metadata: {
              source: metadata.source,
              tier: metadata.packageTier,
              packageName: metadata.packageName,
              sessionId: session.id,
              customerEmail: metadata.customerEmail,
            },
          },
        })
        .catch((err) => {
          webhookLogger.warn({ err: err.message }, 'Failed to create ProjectOutput')
          return null
        })

      // 3. Enqueue project.execution job
      if (output) {
        try {
          const queue = getProjectExecutionQueue()
          await queue.add('execute', {
            outputId: output.id,
            type: 'estimate',
            intakeId: metadata.intakeId,
            metadata: { tier: metadata.packageTier, sessionId: session.id, customerEmail: metadata.customerEmail },
          })
          webhookLogger.info({ intakeId: metadata.intakeId, outputId: output.id }, 'Estimation execution job enqueued')
        } catch (queueErr: any) {
          webhookLogger.warn({ err: queueErr.message }, 'Failed to enqueue estimation execution job — non-fatal')
        }
      }

      // 4. Send confirmation email
      try {
        const intake = intakeData ? JSON.parse(intakeData) : null
        const customerEmail = metadata.customerEmail || intake?.contact?.contactEmail
        if (customerEmail) {
          const amountDollars = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00'
          const packageName = metadata.packageName || 'Cost Estimation Package'

          await getEmailQueue().add('estimation_confirmation', {
            to: customerEmail,
            subject: `Your ${packageName} is confirmed!`,
            template: 'estimation_confirmation',
            data: {
              customerName: intake?.contact?.clientName || customerEmail.split('@')[0],
              packageName,
              packageTier: metadata.packageTier || 'standard',
              amount: amountDollars,
              intakeId: metadata.intakeId,
            },
            metadata: {
              intakeId: metadata.intakeId,
              eventType: 'estimation_confirmation',
            },
          })
          webhookLogger.info({ intakeId: metadata.intakeId, email: customerEmail }, 'Confirmation email queued')
        }
      } catch (emailErr: any) {
        webhookLogger.warn({ err: emailErr.message }, 'Failed to queue confirmation email — non-fatal')
      }

      webhookLogger.info({ intakeId: metadata.intakeId }, 'Estimation package payment processed')
      return
    } catch (err: unknown) {
      webhookLogger.error({ err: (err as Error).message, intakeId: metadata.intakeId }, 'Failed to process estimation package payment')
    }
    return
  }

  // ── 4E: Public intake payment (AI Concept Package) ────────────────────────────
  if (metadata.source === 'public_intake' && metadata.intakeId) {
    try {
      // Update intake status to 'paid'
      await prismaAny.publicIntakeLead.update({
        where: { id: metadata.intakeId },
        data: { status: 'paid', paymentStatus: 'paid' },
      }).catch(() => null)

      webhookLogger.info({ intakeId: metadata.intakeId }, 'Public intake marked as paid')

      // Send payment confirmation email to customer
      try {
        const intake = await prismaAny.publicIntakeLead.findUnique({
          where: { id: metadata.intakeId },
          select: { clientName: true, contactEmail: true },
        }).catch(() => null)

        if (intake?.contactEmail) {
          const amountDollars = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00'
          const packageName = metadata.projectPath
            ? metadata.projectPath.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
            : 'Exterior Concept Package'

          await getEmailQueue().add('concept_package_confirmation', {
            to: intake.contactEmail,
            subject: `Your ${packageName} is confirmed!`,
            template: 'concept_package_confirmation',
            data: {
              customerName: intake.clientName || intake.contactEmail.split('@')[0],
              packageName,
              packageTier: metadata.packageTier || 'standard',
              amount: amountDollars,
            },
            metadata: {
              intakeId: metadata.intakeId,
              eventType: 'concept_package_confirmation',
            },
          })
          webhookLogger.info({ intakeId: metadata.intakeId, email: intake.contactEmail }, 'Confirmation email queued')
        }
      } catch (emailErr: any) {
        webhookLogger.warn({ err: emailErr.message }, 'Failed to queue confirmation email — non-fatal')
      }

      // Enqueue concept engine generation job with full intake data
      try {
        const fullIntake = await prismaAny.publicIntakeLead.findUnique({
          where: { id: metadata.intakeId },
        }).catch(() => null)

        if (fullIntake) {
          const { Queue } = await import('bullmq')
          const IORedis = (await import('ioredis')).default
          const redisUrl = process.env.REDIS_URL
          if (redisUrl) {
            const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })
            const queue = new Queue('concept-engine', { connection: connection as any })
            await queue.add('generate_floorplan', {
              jobType: 'generate_floorplan',
              intakeId: fullIntake.id,
              projectPath: fullIntake.projectType ?? fullIntake.project_type ?? 'interior_renovation',
              intake: {
                intakeId:         fullIntake.id,
                projectPath:      fullIntake.projectType ?? fullIntake.project_type ?? 'interior_renovation',
                clientName:       fullIntake.clientName ?? fullIntake.contact_name ?? '',
                contactEmail:     fullIntake.contactEmail ?? fullIntake.contact_email ?? '',
                projectAddress:   fullIntake.projectAddress ?? fullIntake.project_address ?? '',
                budgetRange:      fullIntake.budgetRange ?? fullIntake.budget_range ?? 'under_10k',
                stylePreferences: fullIntake.stylePreference ? [fullIntake.stylePreference] : [],
                knownConstraints: fullIntake.constraints ?? [],
                jurisdiction:     fullIntake.jurisdiction ?? null,
                uploadedPhotos:   fullIntake.uploadedPhotos ?? fullIntake.uploaded_photos ?? [],
                captureZones:     [],
                captureAssets:    [],
                spatialNodes:     [],
              },
            }, {
              priority: 1,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
            })
            await queue.close()
            webhookLogger.info({ intakeId: metadata.intakeId }, 'Concept engine generate_floorplan job enqueued')
          }
        }
      } catch (jobErr: any) {
        webhookLogger.warn({ err: jobErr.message, intakeId: metadata.intakeId }, 'Failed to enqueue concept engine job — non-fatal')
      }

      // If site visit was requested: create scheduling task
      if (metadata.siteVisitRequested === 'true') {
        // Fetch intake details for the task
        const intake = await prismaAny.publicIntakeLead.findUnique({
          where: { id: metadata.intakeId },
          select: { clientName: true, projectAddress: true, contactEmail: true, contactPhone: true },
        }).catch(() => null)

        const notes = [
          'Client has paid for Kealee Site Visit Scan. Contact to schedule.',
          intake?.clientName ? `Client: ${intake.clientName}` : null,
          intake?.projectAddress ? `Address: ${intake.projectAddress}` : null,
          intake?.contactEmail ? `Email: ${intake.contactEmail}` : null,
          intake?.contactPhone ? `Phone: ${intake.contactPhone}` : null,
        ].filter(Boolean).join(' | ')

        await prismaAny.commandCenterTask?.create?.({
          data: {
            title: `Schedule Site Visit: ${intake?.clientName ?? 'New Client'} — ${metadata.projectPath ?? 'Project'}`,
            referenceId: metadata.intakeId,
            referenceType: 'public_intake_lead',
            tags: ['site_visit', 'needs_scheduling', 'operations', 'paid'],
            status: 'open',
            source: 'site_visit_paid',
            taskType: 'schedule_site_visit',
            queue: 'operations',
            priority: 'HIGH',
            notes,
          },
        }).catch(() => null)

        webhookLogger.info({ intakeId: metadata.intakeId }, 'Site visit scheduling task created')
      }
    } catch (err: unknown) {
      webhookLogger.error({ err: (err as Error).message, intakeId: metadata.intakeId }, 'Failed to process public intake payment')
    }
    return
  }

  // ── Subscription / one-time purchase (existing flow) ────────────────────────
  webhookLogger.info({ sessionId: session.id, orderType: metadata.orderType }, 'Checkout completed — no special handling')
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
