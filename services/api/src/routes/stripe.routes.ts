/**
 * Stripe Routes
 * Handles Stripe checkout, webhooks, and billing portal
 */

import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { config } from '../config';
import { prismaAny } from '../utils/prisma-helper';
import { emailService } from '../modules/email/email.service';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware';
import { sanitizeErrorMessage } from '../utils/sanitize-error'

const stripe = new Stripe(config.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const createCheckoutSchema = z.object({
  packageId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
});

const createPortalSchema = z.object({
  customerId: z.string(),
  returnUrl: z.string().url(),
});

export async function stripeRoutes(fastify: FastifyInstance) {
  
  // POST /api/stripe/create-checkout - Create checkout session
  fastify.post(
    '/create-checkout',
    {
      preHandler: [validateBody(createCheckoutSchema)],
    },
    async (request, reply) => {
      try {
        const { packageId, successUrl, cancelUrl, customerEmail } = createCheckoutSchema.parse(request.body);

        // Get package details from service plan
        const servicePlan = await prismaAny.servicePlan.findUnique({
          where: { id: packageId },
        });

        if (!servicePlan) {
          return reply.code(404).send({ 
            error: 'Not Found',
            message: 'Package not found' 
          });
        }

        // Use monthly price ID by default
        const stripePriceId = servicePlan.stripePriceIdMonthly || (servicePlan as any).stripePriceId;
        
        if (!stripePriceId) {
          return reply.code(400).send({ 
            error: 'Bad Request',
            message: 'Package not configured for Stripe' 
          });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: stripePriceId,
              quantity: 1,
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: customerEmail,
          subscription_data: {
            trial_period_days: 14,
            metadata: {
              packageId: servicePlan.id,
              planName: servicePlan.name,
            },
          },
          metadata: {
            packageId: servicePlan.id,
            planName: servicePlan.name,
          },
        });

        return { sessionId: session.id, url: session.url };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to create checkout session'),
        });
      }
    }
  );

  // POST /api/stripe/webhooks - Webhook handler
  fastify.post(
    '/webhooks',
    {
      config: {
        rawBody: true, // Required for webhook signature verification
      },
    },
    async (request, reply) => {
      try {
        const sig = request.headers['stripe-signature'] as string;

        if (!sig) {
          return reply.code(400).send({ error: 'Missing stripe-signature header' });
        }

        const rawBody = (request as any).rawBody || request.body;
        const webhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
          fastify.log.error('Stripe webhook secret not configured');
          return reply.code(500).send({ error: 'Webhook not configured' });
        }

        let event: Stripe.Event;

        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            webhookSecret
          );
        } catch (err: any) {
          fastify.log.error('Webhook signature verification failed:', err.message);
          return reply.code(400).send({ error: 'Invalid signature' });
        }

        // Handle event
        try {
          switch (event.type) {
            case 'checkout.session.completed':
              await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
              break;

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

            default:
              fastify.log.info(`Unhandled event type: ${event.type}`);
          }
        } catch (error: any) {
          fastify.log.error('Error handling webhook:', error);
          return reply.code(500).send({ error: 'Webhook handler failed' });
        }

        return { received: true };
      } catch (error: any) {
        fastify.log.error('Webhook error:', error);
        return reply.code(500).send({ error: 'Webhook processing failed' });
      }
    }
  );

  // POST /api/stripe/create-portal-session - Create billing portal session
  fastify.post(
    '/create-portal-session',
    {
      preHandler: [validateBody(createPortalSchema)],
    },
    async (request, reply) => {
      try {
        const { customerId, returnUrl } = createPortalSchema.parse(request.body);

        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: returnUrl,
        });

        return { url: session.url };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to create portal session'),
        });
      }
    }
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};

  // ── Sprint 4A: Guest Order fulfillment ────────────────────────────────────
  if (metadata.orderType === 'GUEST' && metadata.guestToken) {
    try {
      await prismaAny.guestOrder.create({
        data: {
          stripeSessionId: session.id,
          guestToken:      metadata.guestToken,
          guestEmail:      metadata.guestEmail ?? (session.customer_email ?? ''),
          guestName:       metadata.guestName  ?? '',
          itemType:        metadata.itemType   ?? 'MARKETPLACE_SERVICE',
          itemId:          metadata.itemId     || null,
          projectId:       metadata.projectId  || null,
          amountPaid:      session.amount_total ?? 0,
          currency:        session.currency    ?? 'usd',
          status:          'FULFILLED',
          utmSource:       metadata.utmSource  || null,
          fulfilledAt:     new Date(),
        },
      });
      console.log('GuestOrder created:', metadata.guestToken);
    } catch (err: any) {
      console.error('Failed to create GuestOrder:', err?.message);
    }
    return; // guest orders don't create subscriptions
  }

  // ── Sprint 4B: Marketplace success fee on milestone payments ──────────────
  if (metadata.orderType === 'MARKETPLACE_MILESTONE' && metadata.projectId) {
    try {
      const feeConfig = await prismaAny.marketplaceFeeConfig.findFirst({
        where: { isActive: true },
        select: { standardPlatformFee: true },
        orderBy: { effectiveFrom: 'desc' },
      }).catch(() => null);

      // standardPlatformFee stored as decimal fraction (0.03 = 3%)
      const feePct = feeConfig?.standardPlatformFee
        ? Number(feeConfig.standardPlatformFee)
        : 0.03;

      const amountTotal = session.amount_total ?? 0;
      const feeAmount   = Math.round(amountTotal * feePct);

      await prismaAny.platformFeeRecord.create({
        data: {
          stripeSessionId: session.id,
          projectId:       metadata.projectId,
          contractorId:    metadata.contractorId  ?? null,
          milestoneId:     metadata.milestoneId   ?? null,
          grossAmount:     amountTotal,
          feePct:          feePct * 100, // stored as % (e.g. 3.0)
          feeAmount,
          currency:        session.currency ?? 'usd',
          status:          'COLLECTED',
          collectedAt:     new Date(),
        },
      });
      console.log('PlatformFeeRecord created:', session.id, `fee=${feeAmount}`);
    } catch (err: any) {
      console.error('Failed to create PlatformFeeRecord:', err?.message);
    }
    return; // marketplace milestone payments don't create subscriptions
  }

  // ── Permit Package fulfillment ────────────────────────────────────────────
  if (metadata.source === 'permit-package' && metadata.intakeId) {
    try {
      // Mark lead as CONTACTED (= payment received, working on it)
      // Append payment info to message field (no metadata column in schema)
      const existingLead = await prismaAny.permitServiceLead.findUnique({
        where: { id: metadata.intakeId },
        select: { message: true },
      }).catch(() => null);
      const updatedMessage = [
        existingLead?.message ?? '',
        `[PAID tier=${metadata.tier} session=${session.id}]`,
      ].filter(Boolean).join(' | ');

      await prismaAny.permitServiceLead.update({
        where: { id: metadata.intakeId },
        data: {
          status: 'CONTACTED',
          message: updatedMessage,
        },
      }).catch((e: any) => console.warn('permit-package: lead update failed', e?.message));

      // Enqueue permit processing job
      try {
        const { Queue } = await import('bullmq');
        const queue = new Queue('intake-processing', {
          connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
        });
        await queue.add('process-permit-intake', {
          intakeId: metadata.intakeId,
          tier: metadata.tier,
          tierName: metadata.tierName,
          customerEmail: metadata.customerEmail ?? session.customer_email ?? '',
          customerName: metadata.customerName ?? '',
          stripeSessionId: session.id,
        }, { priority: 2, attempts: 3 });
        await queue.close();
      } catch (qErr: any) {
        console.warn('permit-package: queue enqueue failed (non-fatal):', qErr.message);
      }

      console.log('permit-package paid:', metadata.intakeId, 'tier:', metadata.tier);
    } catch (err: any) {
      console.error('Failed to process permit-package payment:', err?.message);
    }
    return;
  }

  // ── Product Order fulfillment (product page direct checkout) ──────────────
  if (metadata.source === 'product-order' && metadata.productSlug) {
    try {
      // Idempotency: skip if already processed
      const alreadyFulfilled = await prismaAny.guestOrder.findFirst({
        where: { stripeSessionId: session.id },
        select: { id: true },
      }).catch(() => null);
      if (alreadyFulfilled) {
        console.log('product-order: already processed (idempotent):', session.id);
        return;
      }

      await prismaAny.guestOrder.create({
        data: {
          stripeSessionId: session.id,
          guestToken:      `product-${session.id}`,
          guestEmail:      metadata.customerEmail ?? session.customer_email ?? '',
          guestName:       metadata.customerName  ?? '',
          itemType:        'MARKETPLACE_SERVICE',
          itemId:          metadata.productSlug,
          amountPaid:      session.amount_total ?? 0,
          currency:        session.currency ?? 'usd',
          status:          'FULFILLED',
          fulfilledAt:     new Date(),
        },
      }).catch((e: any) => console.warn('product-order: GuestOrder create failed:', e?.message));

      // Enqueue delivery job
      try {
        const { Queue } = await import('bullmq');
        const queue = new Queue('intake-processing', {
          connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
        });
        await queue.add('process-product-order', {
          productSlug:     metadata.productSlug,
          productName:     metadata.productName ?? metadata.productSlug,
          customerEmail:   metadata.customerEmail ?? session.customer_email ?? '',
          customerName:    metadata.customerName  ?? '',
          stripeSessionId: session.id,
          amountPaid:      session.amount_total ?? 0,
        }, { priority: 2, attempts: 3 });
        await queue.close();
      } catch (qErr: any) {
        console.warn('product-order: queue enqueue failed (non-fatal):', qErr.message);
      }

      // Send confirmation email
      const toEmail = metadata.customerEmail ?? session.customer_email ?? '';
      if (toEmail) {
        const amountDollars = ((session.amount_total ?? 0) / 100).toFixed(2);
        const productName = metadata.productName ?? metadata.productSlug ?? 'Your product';
        await emailService.sendEmail({
          to: toEmail,
          subject: `Order confirmed: ${productName}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Order Confirmed!</h2><p>Hi ${metadata.customerName ?? 'there'},</p><p>Your order for <strong>${productName}</strong> ($${amountDollars}) has been received. Our team will process your deliverable and be in touch within 1–2 business days.</p><p>— The Kealee Team</p></div>`,
        }).catch((e: any) => console.warn('product-order: email failed (non-fatal):', e?.message));
      }

      console.log('product-order fulfilled:', metadata.productSlug, session.id);
    } catch (err: any) {
      console.error('Failed to fulfill product-order:', err?.message);
    }
    return;
  }

  // ── Concept Package fulfillment (intake-to-payment flow) ──────────────────
  if (metadata.source === 'concept-package' && metadata.intakeId) {
    try {
      // Resolve userId from metadata or customer email
      let cpUserId = metadata.userId || null;
      if (!cpUserId && session.customer_email) {
        const cpUser = await prismaAny.user.findUnique({
          where: { email: session.customer_email },
          select: { id: true },
        });
        cpUserId = cpUser?.id ?? null;
      }
      if (!cpUserId) {
        // Anonymous checkout: findOrCreate a user from the customer email
        const anonEmail = session.customer_email ?? metadata.customerEmail ?? null;
        if (!anonEmail) {
          console.error('concept-package: no email to resolve userId', session.id);
          return;
        }
        try {
          const upserted = await prismaAny.user.upsert({
            where:  { email: anonEmail },
            update: {},
            create: {
              id:     crypto.randomUUID(),
              email:  anonEmail,
              name:   metadata.customerName ?? (session as any).customer_details?.name ?? 'Customer',
              status: 'ACTIVE',
            },
            select: { id: true },
          });
          cpUserId = upserted.id;
        } catch (upsertErr: any) {
          console.error('concept-package: findOrCreate user failed:', upsertErr.message);
          return;
        }
      }

      // Idempotency: skip if this session was already processed
      const existingCpOrder = await prismaAny.conceptPackageOrder.findFirst({
        where: { stripeSessionId: session.id },
        select: { id: true },
      }).catch(() => null);
      if (existingCpOrder) {
        console.log('concept-package: already processed (idempotent):', session.id);
        return;
      }

      const order = await prismaAny.conceptPackageOrder.create({
        data: {
          userId: cpUserId,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string | null,
          packageTier: metadata.packageTier ?? 'essential',
          packageName: metadata.packageName ?? 'Concept Package',
          amount: session.amount_total ?? 0,
          currency: session.currency ?? 'usd',
          status: 'completed',
          deliveryStatus: 'pending',
          funnelSessionId: metadata.funnelSessionId || null,
          metadata: {
            intakeId: metadata.intakeId,
            customerEmail: metadata.customerEmail ?? session.customer_email,
            customerName: metadata.customerName ?? '',
          },
        },
      });

      // Enqueue concept generation job
      try {
        const { Queue } = await import('bullmq');
        const queue = new Queue('concept-delivery', {
          connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
        });
        await queue.add('generate-concept', {
          orderId: order.id,
          userId: cpUserId,
          packageTier: order.packageTier,
          packageName: order.packageName,
          funnelSessionId: order.funnelSessionId,
          customerEmail: metadata.customerEmail ?? session.customer_email ?? '',
          customerName: metadata.customerName ?? '',
        }, { priority: 1, attempts: 3 });
        await queue.close();
      } catch (qErr: any) {
        console.warn('concept-package: queue enqueue failed (non-fatal):', qErr.message);
      }

      console.log('ConceptPackageOrder created:', order.id);
    } catch (err: any) {
      console.error('Failed to create ConceptPackageOrder:', err?.message);
    }
    return;
  }

  // ── Public intake payment fulfillment ─────────────────────────────────────
  if (metadata.source === 'public_intake' && metadata.intakeId) {
    try {
      // Mark the PublicIntakeLead as paid
      await prismaAny.publicIntakeLead.update({
        where: { id: metadata.intakeId },
        data: {
          status: 'paid',
          stripeSessionId: session.id,
          stripePaymentIntentId: (session.payment_intent as string) ?? null,
          paidAt: new Date(),
        },
      });

      // Enqueue intake processing job
      try {
        const { Queue } = await import('bullmq');
        const queue = new Queue('intake-processing', {
          connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
        });
        await queue.add('process-paid-intake', {
          intakeId: metadata.intakeId,
          projectPath: metadata.projectPath ?? 'exterior_concept',
          amount: session.amount_total ?? 0,
          customerEmail: session.customer_email ?? '',
          stripeSessionId: session.id,
        }, { priority: 1, attempts: 3 });
        await queue.close();
      } catch (qErr: any) {
        console.warn('public_intake: queue enqueue failed (non-fatal):', qErr.message);
      }

      // Publish event to Redis for command-center
      try {
        const { Redis } = await import('ioredis');
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        await redis.publish('kealee:events', JSON.stringify({
          type: 'intake.payment.completed',
          intakeId: metadata.intakeId,
          projectPath: metadata.projectPath,
          amount: session.amount_total,
          customerEmail: session.customer_email,
          timestamp: new Date().toISOString(),
        }));
        redis.disconnect();
      } catch (redisErr: any) {
        console.warn('public_intake: Redis publish failed (non-fatal):', redisErr.message);
      }

      // Send immediate emails via Resend (belt-and-suspenders alongside worker queue)
      try {
        const lead = await prismaAny.publicIntakeLead.findUnique({ where: { id: metadata.intakeId } });
        if (lead) {
          const pathLabels: Record<string, string> = {
            exterior_concept: 'Exterior Concept Package',
            interior_renovation: 'Interior Renovation Package',
            whole_home_remodel: 'Whole Home Remodel',
            addition_expansion: 'Addition & Expansion',
            design_build: 'Design-Build Package',
            permit_path_only: 'Permit Path Package',
          };
          const packageLabel = pathLabels[metadata.projectPath ?? ''] ?? metadata.projectPath ?? 'Package';
          const amountDollars = ((session.amount_total ?? 0) / 100).toFixed(2);
          const ccUrl = process.env.COMMAND_CENTER_URL || 'https://command-center.kealee.com';
          const teamEmail = process.env.TEAM_INTAKE_EMAIL || 'team@kealee.com';

          // Client confirmation
          await emailService.sendEmail({
            to: lead.contactEmail,
            subject: `We received your ${packageLabel} request`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Your request is confirmed!</h2><p>Hi ${lead.clientName},</p><p>Thank you — your <strong>${packageLabel}</strong> request is confirmed and payment of <strong>$${amountDollars}</strong> received. Our team will review your details and deliver your concept package within 1-2 business days.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Address</td><td style="padding:8px 12px">${lead.projectAddress}</td></tr><tr><td style="padding:8px 12px;font-weight:600">Package</td><td style="padding:8px 12px">${packageLabel}</td></tr><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Budget</td><td style="padding:8px 12px">${lead.budgetRange}</td></tr></table><p>Questions? Reply to this email anytime.</p><p>— The Kealee Team</p></div>`,
          });

          // Team alert
          const tier = (lead.leadTier ?? 'cold').toUpperCase();
          const tierEmoji = lead.leadTier === 'hot' ? '🔴' : lead.leadTier === 'warm' ? '🟡' : '🔵';
          await emailService.sendEmail({
            to: teamEmail,
            subject: `${tierEmoji} New Intake: ${lead.clientName} — ${packageLabel} ($${amountDollars})`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>${tierEmoji} New Paid Intake — ${tier}</h2><p><strong>Score: ${lead.leadScore}/100 | Route: ${lead.leadRoute}</strong></p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Client</td><td style="padding:8px 12px">${lead.clientName}</td></tr><tr><td style="padding:8px 12px;font-weight:600">Email</td><td style="padding:8px 12px"><a href="mailto:${lead.contactEmail}">${lead.contactEmail}</a></td></tr><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Phone</td><td style="padding:8px 12px">${lead.contactPhone ?? 'N/A'}</td></tr><tr><td style="padding:8px 12px;font-weight:600">Address</td><td style="padding:8px 12px">${lead.projectAddress}</td></tr><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Package</td><td style="padding:8px 12px">${packageLabel}</td></tr><tr><td style="padding:8px 12px;font-weight:600">Budget</td><td style="padding:8px 12px">${lead.budgetRange}</td></tr><tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:600">Paid</td><td style="padding:8px 12px">$${amountDollars}</td></tr></table><p><a href="${ccUrl}/intake/${metadata.intakeId}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block">View in Command Center</a></p></div>`,
          });
        }
      } catch (emailErr: any) {
        console.warn('public_intake: direct email failed (non-fatal):', emailErr.message);
      }

      // Create command center task directly
      try {
        const lead = await prismaAny.publicIntakeLead.findUnique({ where: { id: metadata.intakeId } });
        if (lead) {
          await prismaAny.task.create({
            data: {
              title: `Intake: ${lead.clientName} — ${metadata.projectPath ?? 'package'}`,
              status: lead.leadTier === 'hot' ? 'URGENT' : 'PENDING',
              priority: lead.leadTier === 'hot' ? 'HIGH' : lead.leadTier === 'warm' ? 'MEDIUM' : 'LOW',
              source: 'intake',
              metadata: {
                intakeId: metadata.intakeId,
                projectPath: metadata.projectPath,
                leadTier: lead.leadTier,
                leadRoute: lead.leadRoute,
                amount: session.amount_total,
                stripeSessionId: session.id,
                contactEmail: lead.contactEmail,
              },
            },
          });
        }
      } catch (taskErr: any) {
        console.warn('public_intake: task creation failed (non-fatal):', taskErr.message);
      }

      console.log('Public intake payment fulfilled:', metadata.intakeId);
    } catch (err: any) {
      console.error('Failed to fulfill public intake:', err?.message);
    }
    return;
  }

  // ── Sprint 7: Concept + Validation fulfillment ─────────────────────────────
  if (metadata.productType === 'CONCEPT_VALIDATION' && metadata.projectId && metadata.conceptValidationId) {
    try {
      // Call the webhook-activate endpoint internally
      // We update the record directly since we're in the same service
      await prismaAny.projectConceptValidation.update({
        where: { id: metadata.conceptValidationId },
        data: {
          status:         'PAID',
          stripePaymentId: session.payment_intent as string ?? session.id,
        },
      });

      // Emit design.concept.initiated event
      try {
        const { Redis } = await import('ioredis');
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        await redis.publish('kealee:events', JSON.stringify({
          type:                'design.concept.initiated',
          projectId:           metadata.projectId,
          conceptValidationId: metadata.conceptValidationId,
          timestamp:           new Date().toISOString(),
        }));
        redis.disconnect();
      } catch (redisErr: any) {
        console.warn('Redis publish failed (non-fatal):', redisErr.message);
      }

      console.log('ConceptValidation activated:', metadata.conceptValidationId);
    } catch (err: any) {
      console.error('Failed to activate ConceptValidation:', err?.message);
    }
    return; // Concept validation fulfillment complete
  }

  // ── Existing subscription flow ─────────────────────────────────────────────
  const packageId = metadata.packageId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log('Checkout completed:', { packageId, customerId, subscriptionId });

  if (!packageId || !customerId || !subscriptionId) {
    console.error('Missing required data in checkout session');
    return;
  }

  // Get user from client_reference_id or customer email
  let userId: string | null = null;
  
  if (session.client_reference_id) {
    userId = session.client_reference_id;
  } else if (session.customer_email) {
    const user = await prismaAny.user.findUnique({
      where: { email: session.customer_email },
    });
    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    console.error('Could not find user for checkout session');
    return;
  }

  // Get user's org (or use metadata orgId)
  let orgId: string | null = session.metadata?.orgId || null;
  
  if (!orgId) {
    const orgMembership = await prismaAny.orgMember.findFirst({
      where: { userId },
      include: { org: true },
    });

    if (orgMembership) {
      orgId = orgMembership.orgId;
    } else {
      // Create org for user if none exists
      const user = await prismaAny.user.findUnique({ where: { id: userId } });
      const org = await prismaAny.org.create({
        data: {
          name: `${user?.name || 'User'}'s Organization`,
          slug: `org-${userId.slice(0, 8)}`,
        },
      });
      await prismaAny.orgMember.create({
        data: {
          userId,
          orgId: org.id,
          roleKey: 'admin',
        },
      });
      orgId = org.id;
    }
  }

  if (!orgId) {
    console.error('Could not determine orgId for subscription');
    return;
  }

  // Create subscription record
  await prismaAny.serviceSubscription.create({
    data: {
      orgId,
      servicePlanId: packageId,
      stripeCustomerId: customerId,
      stripeId: subscriptionId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: {
        packageId,
        planName: session.metadata?.planName,
      },
    },
  });

  // Send welcome email
  if (session.customer_email) {
    await emailService.sendEmail({
      to: session.customer_email,
      subject: 'Welcome to Kealee!',
      template: 'welcome',
      data: {
        packageId,
        name: session.customer_details?.name,
      },
    });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  await prismaAny.serviceSubscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      status: subscription.status as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  await prismaAny.serviceSubscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      status: subscription.status as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  await prismaAny.serviceSubscription.updateMany({
    where: { stripeId: subscription.id },
    data: {
      status: 'canceled' as any,
      canceledAt: new Date(),
    },
  });

  // Send cancellation email
  const sub = await prismaAny.serviceSubscription.findFirst({
    where: { stripeId: subscription.id },
    include: { org: { include: { members: { include: { user: true }, take: 1 } } } },
  });

  if (sub?.org?.members?.[0]?.user) {
    await emailService.sendEmail({
      to: sub.org.members[0].user.email,
      subject: 'Subscription Canceled',
      template: 'subscription-canceled',
      data: {
        subscriptionId: subscription.id,
        accessUntil: sub.currentPeriodEnd?.toLocaleDateString(),
      },
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);
  
  const subscription = await prismaAny.serviceSubscription.findFirst({
    where: { stripeId: (invoice as any).subscription as string },
    include: { org: { include: { members: { include: { user: true }, take: 1 } } } },
  });

  if (subscription?.org?.members?.[0]?.user) {
    await emailService.sendEmail({
      to: subscription.org.members[0].user.email,
      subject: 'Payment Received',
      template: 'invoice-paid',
      data: {
        amount: (invoice.amount_paid || 0) / 100,
        invoiceNumber: invoice.number,
        invoiceUrl: invoice.hosted_invoice_url || '',
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const subscription = await prismaAny.serviceSubscription.findFirst({
    where: { stripeId: (invoice as any).subscription as string },
    include: { org: { include: { members: { include: { user: true }, take: 1 } } } },
  });

  if (subscription?.org?.members?.[0]?.user) {
    await emailService.sendEmail({
      to: subscription.org.members[0].user.email,
      subject: 'Payment Failed',
      template: 'payment-failed',
      data: {
        amount: (invoice.amount_due || 0) / 100,
        invoiceUrl: invoice.hosted_invoice_url || '',
      },
    });
  }
}

