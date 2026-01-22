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
          error: error.message || 'Failed to create checkout session',
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
          error: error.message || 'Failed to create portal session',
        });
      }
    }
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const packageId = session.metadata?.packageId;
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

