import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import Stripe from 'stripe'
import { prismaAny } from '../../utils/prisma-helper'

import { entitlementService } from '../entitlements/entitlement.service'
import { eventService } from '../events/event.service'
import { OPS_SERVICES_MODULE_KEY, type BillingInterval, type GCPlanSlug, getPlanSlugFromPriceId, getPriceIdForPlan, mapStripeSubscriptionStatus } from './billing.constants'
import { getStripe } from './stripe.client'
import { orgService } from '../orgs/org.service'

type EmailJobData = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  metadata?: Record<string, any>
}

let emailQueueSingleton: Queue<EmailJobData> | null = null
function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueueSingleton) return emailQueueSingleton
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL is not set (required for email queue)')
  }
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ blocking connections
  })
  emailQueueSingleton = new Queue<EmailJobData>('email', { 
    connection: connection as any 
  }) as Queue<EmailJobData, any, string, EmailJobData, any, string>
  return emailQueueSingleton
}

function toDateFromSeconds(sec: number | null | undefined): Date {
  if (!sec) return new Date()
  return new Date(sec * 1000)
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export class BillingService {
  private _stripe?: ReturnType<typeof getStripe>
  
  private get stripe() {
    if (!this._stripe) {
      this._stripe = getStripe()
    }
    return this._stripe
  }

  async listPlans() {
    return prismaAny.servicePlan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  }

  async getMySubscription(userId: string) {
    // Get user's orgs
    const orgMemberships = await prismaAny.orgMember.findMany({
      where: { userId },
      include: { org: true },
    })

    if (orgMemberships.length === 0) {
      throw new Error('User is not a member of any organization')
    }

    // Get active subscription for any of user's orgs
    const orgIds = orgMemberships.map((m: { orgId: string }) => m.orgId)
    const subscription = await prismaAny.serviceSubscription.findFirst({
      where: {
        orgId: { in: orgIds },
        status: { in: ['active', 'trial', 'past_due', 'paused'] },
      },
      include: {
        servicePlan: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      throw new Error('No active subscription found')
    }

    return subscription
  }

  /**
   * List all subscriptions for a user (across all organizations)
   * Returns formatted subscriptions with Stripe details
   */
  async listUserSubscriptions(userId: string) {
    // Get user's orgs
    const orgMemberships = await prismaAny.orgMember.findMany({
      where: { userId },
      select: { orgId: true },
    })

    if (orgMemberships.length === 0) {
      return []
    }

    const orgIds = orgMemberships.map((m: { orgId: string }) => m.orgId)

    // Get all subscriptions for user's orgs
    const subscriptions = await prismaAny.serviceSubscription.findMany({
      where: {
        orgId: { in: orgIds },
        stripeId: { not: null },
      },
      include: {
        servicePlan: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch Stripe subscription details
    const stripe = getStripe()
    const formattedSubscriptions = await Promise.all(
      subscriptions.map(async (dbSub: any) => {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(dbSub.stripeId!, {
            expand: ['default_payment_method', 'items.data.price.product'],
          })

          const item = stripeSubscription.items.data[0]
          const product = item?.price?.product as Stripe.Product | undefined
          const stripeSub = stripeSubscription as Stripe.Subscription // Type assertion for period fields

          return {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: (stripeSub as any).current_period_start ? new Date((stripeSub as any).current_period_start * 1000) : new Date(),
            current_period_end: (stripeSub as any).current_period_end ? new Date((stripeSub as any).current_period_end * 1000) : new Date(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            canceled_at: stripeSubscription.canceled_at
              ? new Date(stripeSubscription.canceled_at * 1000)
              : null,
            plan: {
              id: item?.price?.id || '',
              name: product?.name || dbSub.servicePlan?.name || 'Unknown',
              amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : 0,
              currency: item?.price?.currency || 'usd',
              interval: item?.price?.recurring?.interval || 'month',
            },
            payment_method: stripeSubscription.default_payment_method
              ? {
                  brand: (stripeSubscription.default_payment_method as Stripe.PaymentMethod).card?.brand,
                  last4: (stripeSubscription.default_payment_method as Stripe.PaymentMethod).card?.last4,
                  exp_month: (stripeSubscription.default_payment_method as Stripe.PaymentMethod).card?.exp_month,
                  exp_year: (stripeSubscription.default_payment_method as Stripe.PaymentMethod).card?.exp_year,
                }
              : null,
            org: {
              id: dbSub.org?.id || '',
              name: dbSub.org?.name || '',
            },
            dbId: dbSub.id,
          }
        } catch (error) {
          console.error(`Failed to retrieve Stripe subscription ${dbSub.stripeId}:`, error)
          // Return basic info even if Stripe fetch fails
          return {
            id: dbSub.stripeId || '',
            status: dbSub.status,
            current_period_start: dbSub.currentPeriodStart || new Date(),
            current_period_end: dbSub.currentPeriodEnd || new Date(),
            cancel_at_period_end: dbSub.cancelAtPeriodEnd || false,
            canceled_at: dbSub.canceledAt,
            plan: {
              id: '',
              name: dbSub.servicePlan?.name || 'Unknown',
              amount: 0,
              currency: 'usd',
              interval: 'month',
            },
            payment_method: null,
            org: {
              id: dbSub.org?.id || '',
              name: dbSub.org?.name || '',
            },
            dbId: dbSub.id,
          }
        }
      })
    )

    return formattedSubscriptions
  }

  /**
   * Create subscription directly (not via checkout)
   * Useful for programmatic subscription creation
   */
  async createSubscriptionDirect(input: {
    orgId: string
    priceId: string
    customerId: string
    paymentMethodId?: string
  }) {
    const stripe = getStripe()

    // Attach payment method to customer if provided
    if (input.paymentMethodId) {
      await stripe.paymentMethods.attach(input.paymentMethodId, {
        customer: input.customerId,
      })

      // Set as default payment method
      await stripe.customers.update(input.customerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId,
        },
      })
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: input.customerId,
      items: [{ price: input.priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        orgId: input.orgId,
        moduleKey: OPS_SERVICES_MODULE_KEY,
      },
    })

    // Sync to database (will be updated via webhook)
    const planSlug = getPlanSlugFromPriceId(input.priceId)
    if (planSlug) {
      const plan = await prismaAny.servicePlan.findUnique({ where: { slug: planSlug } })
      if (plan) {
        await prismaAny.serviceSubscription.upsert({
          where: { stripeId: subscription.id },
          create: {
            orgId: input.orgId,
            servicePlanId: plan.id,
            status: mapStripeSubscriptionStatus(subscription.status),
            stripeId: subscription.id,
            currentPeriodStart: toDateFromSeconds((subscription as Stripe.Subscription).current_period_start),
            currentPeriodEnd: toDateFromSeconds((subscription as Stripe.Subscription).current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
            metadata: {
              planSlug,
              priceId: input.priceId,
            },
          },
          update: {
            status: mapStripeSubscriptionStatus(subscription.status),
            currentPeriodStart: toDateFromSeconds((subscription as any).current_period_start),
            currentPeriodEnd: toDateFromSeconds((subscription as any).current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          },
        })
      }
    }

    await eventService.recordEvent({
      type: 'STRIPE_SUBSCRIPTION_CREATED',
      entityType: 'ServiceSubscription',
      entityId: subscription.id,
      orgId: input.orgId,
      payload: {
        stripeSubscriptionId: subscription.id,
        priceId: input.priceId,
        customerId: input.customerId,
      },
    })

    return {
      subscriptionId: subscription.id,
      clientSecret: ((subscription.latest_invoice as any)?.payment_intent)
        ? (typeof ((subscription.latest_invoice as any).payment_intent) === 'string'
          ? null
          : (((subscription.latest_invoice as any).payment_intent as Stripe.PaymentIntent)
              .client_secret))
        : null,
      status: subscription.status,
    }
  }

  /**
   * Get detailed subscription information for billing dashboard
   * Includes Stripe customer details and payment method information
   */
  async getSubscriptionDetails(orgId: string) {
    const subscription = await prismaAny.serviceSubscription.findFirst({
      where: {
        orgId,
        stripeId: { not: null },
      },
      include: {
        servicePlan: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription?.stripeId) {
      throw new Error('No Stripe subscription found for this org')
    }

    // Get subscription details from Stripe
    const stripe = getStripe()
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId, {
      expand: ['customer', 'default_payment_method', 'latest_invoice'],
    })

    // Get customer details
    const customerId = typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id

    let customer: any = null
    if (customerId) {
      try {
        customer = await stripe.customers.retrieve(customerId)
      } catch (error) {
        console.warn('Failed to retrieve customer details:', error)
      }
    }

    // Get payment method details
    let paymentMethod: any = null
    if (stripeSubscription.default_payment_method) {
      const paymentMethodId = typeof stripeSubscription.default_payment_method === 'string'
        ? stripeSubscription.default_payment_method
        : stripeSubscription.default_payment_method?.id

      if (paymentMethodId) {
        try {
          paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
        } catch (error) {
          console.warn('Failed to retrieve payment method details:', error)
        }
      }
    }

    // Get upcoming invoice
    let upcomingInvoice: Stripe.Invoice | null = null
    try {
      const invoices = await stripe.invoices.list({
        subscription: subscription.stripeId,
        limit: 1,
        status: 'upcoming' as any,
      })
      if (invoices.data.length > 0) {
        upcomingInvoice = invoices.data[0]
      }
    } catch (error) {
      console.warn('Failed to retrieve upcoming invoice:', error)
    }

    return {
      subscription: {
        id: subscription.id,
        orgId: subscription.orgId,
        orgName: subscription.org.name,
        status: subscription.status,
        plan: subscription.servicePlan,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        metadata: subscription.metadata,
      },
      stripe: {
        subscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        items: stripeSubscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          amount: item.price.unit_amount ? item.price.unit_amount / 100 : 0,
          currency: item.price.currency,
          interval: item.price.recurring?.interval,
        })),
      },
      customer: customer ? {
        id: (customer as any).id,
        email: (customer as any).email,
        name: (customer as any).name,
        phone: (customer as any).phone,
      } : null,
      paymentMethod: paymentMethod ? {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : null,
      } : null,
      upcomingInvoice: upcomingInvoice ? {
        id: upcomingInvoice.id,
        amountDue: upcomingInvoice.amount_due / 100,
        currency: upcomingInvoice.currency,
        dueDate: upcomingInvoice.due_date
          ? new Date(upcomingInvoice.due_date * 1000)
          : null,
      } : null,
    }
  }

  async createCheckoutSession(input: {
    orgId: string
    planSlug: GCPlanSlug
    interval: BillingInterval
    successUrl: string
    cancelUrl: string
    customerEmail?: string
  }) {
    const plan = await prismaAny.servicePlan.findUnique({ where: { slug: input.planSlug } })
    if (!plan) {
      throw new Error(`Unknown service plan slug: ${input.planSlug}`)
    }

    const priceId = getPriceIdForPlan(input.planSlug, input.interval)

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: input.orgId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      allow_promotion_codes: true,
      customer_email: input.customerEmail,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          orgId: input.orgId,
          planSlug: input.planSlug,
          interval: input.interval,
          moduleKey: OPS_SERVICES_MODULE_KEY,
        },
      },
      metadata: {
        orgId: input.orgId,
        planSlug: input.planSlug,
        interval: input.interval,
      },
    })

    await eventService.recordEvent({
      type: 'STRIPE_CHECKOUT_SESSION_CREATED',
      entityType: 'Org',
      entityId: input.orgId,
      orgId: input.orgId,
      payload: { sessionId: session.id, planSlug: input.planSlug, interval: input.interval },
    })

    return session
  }

  async createBillingPortalSession(input: { orgId: string; returnUrl: string }) {
    const sub = await prismaAny.serviceSubscription.findFirst({
      where: {
        orgId: input.orgId,
        stripeId: { not: null },
        status: { in: ['active', 'trial', 'past_due', 'paused'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!sub?.stripeId) {
      throw new Error('No active Stripe subscription found for this org')
    }

    const stripeSub = await this.stripe.subscriptions.retrieve(sub.stripeId)
    const customer = stripeSub.customer
    const customerId = typeof customer === 'string' ? customer : customer.id

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: input.returnUrl,
    })

    return session
  }

  async handleWebhook(rawBody: Buffer, signature: string | string[] | undefined) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }
    if (!signature || Array.isArray(signature)) {
      throw new Error('Missing Stripe-Signature header')
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        await this.syncSubscription(subscription, event.type)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as any
        await this.handleInvoicePaid(invoice)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        await this.handleInvoicePaymentFailed(invoice)
        break
      }
      default:
        // Ignore other events
        break
    }

    return { received: true, type: event.type, id: event.id }
  }

  private async syncSubscription(subscription: any, eventType: string) {
    const planSlugFromMeta = subscription.metadata?.planSlug as GCPlanSlug | undefined
    const item = subscription.items?.data?.[0]
    const priceId = item?.price?.id as string | undefined
    const planSlug =
      planSlugFromMeta ||
      (priceId ? getPlanSlugFromPriceId(priceId) : null)

    if (!planSlug) {
      throw new Error(`Unable to determine planSlug for subscription ${subscription.id}`)
    }

    const orgId: string =
      (subscription.metadata?.orgId as string | undefined) ||
      (await this.bootstrapOrgFromSubscriptionIfNeeded(subscription, planSlug))

    const plan = await prismaAny.servicePlan.findUnique({ where: { slug: planSlug } })
    if (!plan) {
      throw new Error(`ServicePlan not found for slug: ${planSlug}`)
    }

    const status = mapStripeSubscriptionStatus(subscription.status)
    const currentPeriodStart = toDateFromSeconds((subscription as any).current_period_start)
    const currentPeriodEnd = toDateFromSeconds((subscription as any).current_period_end)
    const canceledAt = subscription.canceled_at ? toDateFromSeconds(subscription.canceled_at) : null

    const upserted = await prismaAny.serviceSubscription.upsert({
      where: { stripeId: subscription.id },
      create: {
        orgId,
        servicePlanId: plan.id,
        status,
        stripeId: subscription.id,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt,
      },
      update: {
        orgId,
        servicePlanId: plan.id,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt,
      },
    })

    // Entitlements:
    // - If active/trial/past_due/paused, keep module enabled until current period end.
    // - If deleted/canceled, disable module.
    const shouldDisable =
      eventType === 'customer.subscription.deleted' || status === 'canceled'
    if (shouldDisable) {
      try {
        await entitlementService.disableModule(orgId, OPS_SERVICES_MODULE_KEY)
      } catch {
        // ignore if not present
      }
    } else {
      await entitlementService.enableModule(orgId, OPS_SERVICES_MODULE_KEY, currentPeriodEnd)
    }

    await eventService.recordEvent({
      type:
        eventType === 'customer.subscription.created'
          ? 'STRIPE_SUBSCRIPTION_CREATED'
          : eventType === 'customer.subscription.deleted'
            ? 'STRIPE_SUBSCRIPTION_DELETED'
            : 'STRIPE_SUBSCRIPTION_UPDATED',
      entityType: 'ServiceSubscription',
      entityId: upserted.id,
      orgId,
      payload: {
        stripeSubscriptionId: subscription.id,
        status,
        planSlug,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      },
    })
  }

  /**
   * If `metadata.orgId` is missing, optionally create the GC org + owner user.
   * This supports the flow: subscription.created → create org + assign package.
   *
   * We only do this if we can confidently infer ownership/org info from Stripe.
   */
  private async bootstrapOrgFromSubscriptionIfNeeded(
    subscription: any,
    planSlug: GCPlanSlug
  ): Promise<string> {
    // If orgId is already present, do nothing.
    if (subscription.metadata?.orgId) return subscription.metadata.orgId as string

    // Determine Stripe customer and email.
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (!customerId) {
      throw new Error('Missing subscription.customer; cannot bootstrap org')
    }

    const customer = await this.stripe.customers.retrieve(customerId)
    if ((customer as any).deleted) {
      throw new Error('Stripe customer is deleted; cannot bootstrap org')
    }

    const ownerEmail: string | undefined =
      subscription.metadata?.ownerEmail ||
      (customer as any).email ||
      undefined

    if (!ownerEmail) {
      throw new Error(
        'Cannot bootstrap org: no owner email found (set subscription metadata.ownerEmail or ensure customer has email)'
      )
    }

    const ownerName: string =
      subscription.metadata?.ownerName ||
      (customer as any).name ||
      ownerEmail.split('@')[0]

    const orgName: string =
      subscription.metadata?.orgName ||
      (customer as any).name ||
      `${ownerName} (GC)`

    let slug = slugify(subscription.metadata?.orgSlug || orgName)
    if (!slug) slug = `gc-${ownerEmail.split('@')[0]}`

    // Ensure slug uniqueness
    const existing = await prismaAny.org.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Math.random().toString(16).slice(2, 6)}`
    }

    const user = await prismaAny.user.upsert({
      where: { email: ownerEmail },
      update: { name: ownerName },
      create: {
        email: ownerEmail,
        name: ownerName,
        status: 'ACTIVE',
      },
    })

    const org = await orgService.createOrg({
      name: orgName,
      slug,
      description: 'GC org (created via Stripe subscription)',
      ownerId: user.id,
    })

    // Update Stripe subscription metadata so subsequent webhooks can map to this org.
    try {
      await this.stripe.subscriptions.update(subscription.id, {
        metadata: {
          ...(subscription.metadata || {}),
          orgId: org.id,
          planSlug,
          moduleKey: OPS_SERVICES_MODULE_KEY,
        },
      })
    } catch {
      // non-fatal
    }

    await eventService.recordEvent({
      type: 'STRIPE_ORG_BOOTSTRAPPED',
      entityType: 'Org',
      entityId: org.id,
      orgId: org.id,
      payload: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        ownerEmail,
        planSlug,
      },
    })

    return org.id
  }

  private async handleInvoicePaid(invoice: any) {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    const orgSub = subscriptionId
      ? await prismaAny.serviceSubscription.findUnique({ where: { stripeId: subscriptionId } })
      : null
    const orgId = orgSub?.orgId || invoice.metadata?.orgId || null

    await eventService.recordEvent({
      type: 'STRIPE_INVOICE_PAID',
      entityType: 'StripeInvoice',
      entityId: invoice.id,
      orgId: orgId || undefined,
      payload: {
        subscriptionId,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      },
    })

    const recipient: string | undefined =
      invoice.customer_email || invoice.customer_details?.email || undefined

    if (!recipient) return

    // Let Stripe handle retries; we just send a receipt/confirmation.
    const subject = 'Kealee receipt: invoice paid'
    const hostedUrl = invoice.hosted_invoice_url
    const pdfUrl = invoice.invoice_pdf
    const html = `
      <h1>Payment received</h1>
      <p>Your Kealee Ops Services invoice has been paid.</p>
      ${hostedUrl ? `<p>View invoice: <a href="${hostedUrl}">${hostedUrl}</a></p>` : ''}
      ${pdfUrl ? `<p>Invoice PDF: <a href="${pdfUrl}">${pdfUrl}</a></p>` : ''}
    `
    const text = `Payment received.\n\n${hostedUrl ? `View invoice: ${hostedUrl}\n` : ''}${pdfUrl ? `Invoice PDF: ${pdfUrl}\n` : ''}`

    await getEmailQueue().add('send-email', {
      to: recipient,
      subject,
      html,
      text,
      metadata: {
        eventType: 'stripe_invoice_paid',
        orgId: orgId || undefined,
        stripeInvoiceId: invoice.id,
        stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
      },
    })
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(orgId: string, cancelImmediately: boolean = false) {
    const subscription = await prismaAny.serviceSubscription.findFirst({
      where: {
        orgId,
        status: { in: ['active', 'trial', 'past_due', 'paused'] },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription?.stripeId) {
      throw new Error('No active Stripe subscription found for this org')
    }

    const stripe = getStripe()
    let updatedSubscription

    if (cancelImmediately) {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscription.stripeId)
    } else {
      // Cancel at period end (default)
      updatedSubscription = await stripe.subscriptions.update(subscription.stripeId, {
        cancel_at_period_end: true,
      })
    }

    // Sync subscription status in database
    await this.syncSubscription(updatedSubscription, 'customer.subscription.updated')

    return updatedSubscription
  }

  /**
   * Upgrade or downgrade subscription
   */
  async changeSubscriptionPlan(orgId: string, newPlanSlug: GCPlanSlug, interval: BillingInterval = 'month') {
    const subscription = await prismaAny.serviceSubscription.findFirst({
      where: {
        orgId,
        status: { in: ['active', 'trial', 'past_due', 'paused'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        servicePlan: true,
      },
    })

    if (!subscription?.stripeId) {
      throw new Error('No active Stripe subscription found for this org')
    }

    const newPriceId = getPriceIdForPlan(newPlanSlug, interval)
    const stripe = getStripe()

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId)
    const currentItemId = stripeSubscription.items.data[0]?.id

    if (!currentItemId) {
      throw new Error('Unable to find subscription item')
    }

    // Update subscription to new plan
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeId, {
      items: [{
        id: currentItemId,
        price: newPriceId,
      }],
      metadata: {
        ...stripeSubscription.metadata,
        planSlug: newPlanSlug,
        interval,
        moduleKey: OPS_SERVICES_MODULE_KEY,
        orgId,
      },
      proration_behavior: 'always_invoice', // Prorate the change
    })

    // Sync subscription in database
    await this.syncSubscription(updatedSubscription, 'customer.subscription.updated')

    await eventService.recordEvent({
      type: 'STRIPE_SUBSCRIPTION_PLAN_CHANGED',
      entityType: 'ServiceSubscription',
      entityId: subscription.id,
      orgId,
      payload: {
        stripeSubscriptionId: updatedSubscription.id,
        oldPlanSlug: subscription.servicePlan?.slug || 'unknown',
        newPlanSlug,
        interval,
      },
    })

    return updatedSubscription
  }

  /**
   * Get subscription metrics for reporting
   */
  async getSubscriptionMetrics(filters?: {
    startDate?: Date
    endDate?: Date
    orgId?: string
  }) {
    const where: any = {}

    if (filters?.orgId) {
      where.orgId = filters.orgId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters?.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters?.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // Get all subscriptions in date range
    const subscriptions = await prismaAny.serviceSubscription.findMany({
      where,
      include: {
        servicePlan: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate metrics
    const activeCount = subscriptions.filter(s => s.status === 'active').length
    const trialCount = subscriptions.filter(s => s.status === 'trial').length
    const pastDueCount = subscriptions.filter(s => s.status === 'past_due').length
    const canceledCount = subscriptions.filter(s => s.status === 'canceled').length

    // Group by plan
    const planBreakdown: Record<string, number> = {}
    subscriptions.forEach(sub => {
      const planName = sub.servicePlan?.name || 'Unknown'
      planBreakdown[planName] = (planBreakdown[planName] || 0) + 1
    })

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0
    subscriptions.forEach(sub => {
      if (sub.status === 'active' || sub.status === 'trial') {
        const plan = sub.servicePlan
        if (plan) {
          // Assume monthly price - adjust for annual plans if needed
          const monthlyPrice = (sub.metadata as any)?.interval === 'year'
            ? (plan.monthlyPrice || 0) / 12
            : (plan.monthlyPrice || 0)
          mrr += monthlyPrice
        }
      }
    })

    return {
      total: subscriptions.length,
      active: activeCount,
      trial: trialCount,
      pastDue: pastDueCount,
      canceled: canceledCount,
      mrr,
      planBreakdown,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        orgId: s.orgId,
        orgName: s.org.name,
        planName: s.servicePlan?.name,
        status: s.status,
        createdAt: s.createdAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
    }
  }

  /**
   * Send revenue report via email
   */
  async sendRevenueReportEmail(recipient: string, filters?: {
    startDate?: Date
    endDate?: Date
    orgId?: string
  }) {
    const report = await this.getRevenueReport(filters)
    
    const subject = `Kealee Revenue Report - ${filters?.startDate ? filters.startDate.toISOString().slice(0, 10) : 'All Time'}${filters?.endDate ? ` to ${filters.endDate.toISOString().slice(0, 10)}` : ''}`
    
    const html = `
      <h1>Kealee Revenue Report</h1>
      <h2>Summary</h2>
      <ul>
        <li><strong>Total Revenue:</strong> $${report.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
        <li><strong>Number of Payments:</strong> ${report.paymentCount}</li>
      </ul>
      
      ${Object.keys(report.revenueByMonth).length > 0 ? `
      <h2>Revenue by Month</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Month</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(report.revenueByMonth).map(([month, revenue]) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${month}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${Number(revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      ${Object.keys(report.revenueByPlan).length > 0 ? `
      <h2>Revenue by Plan</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Plan</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(report.revenueByPlan).map(([plan, revenue]) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${plan}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${Number(revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      <p><small>Generated on ${new Date().toLocaleString()}</small></p>
    `
    
    const text = `
Kealee Revenue Report
${filters?.startDate ? filters.startDate.toISOString().slice(0, 10) : 'All Time'}${filters?.endDate ? ` to ${filters.endDate.toISOString().slice(0, 10)}` : ''}

Summary:
- Total Revenue: $${report.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Number of Payments: ${report.paymentCount}

Generated on ${new Date().toLocaleString()}
    `.trim()

    await getEmailQueue().add('send-email', {
      to: recipient,
      subject,
      html,
      text,
      metadata: {
        eventType: 'revenue_report',
        orgId: filters?.orgId,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
      },
    })
  }

  /**
   * Send subscription metrics report via email
   */
  async sendSubscriptionMetricsEmail(recipient: string, filters?: {
    startDate?: Date
    endDate?: Date
    orgId?: string
  }) {
    const metrics = await this.getSubscriptionMetrics(filters)
    
    const subject = `Kealee Subscription Metrics - ${new Date().toLocaleDateString()}`
    
    const html = `
      <h1>Kealee Subscription Metrics</h1>
      <h2>Overview</h2>
      <ul>
        <li><strong>Total Subscriptions:</strong> ${metrics.total}</li>
        <li><strong>Active:</strong> ${metrics.active}</li>
        <li><strong>Trial:</strong> ${metrics.trial}</li>
        <li><strong>Past Due:</strong> ${metrics.pastDue}</li>
        <li><strong>Canceled:</strong> ${metrics.canceled}</li>
        <li><strong>Monthly Recurring Revenue (MRR):</strong> $${metrics.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
      </ul>
      
      ${Object.keys(metrics.planBreakdown).length > 0 ? `
      <h2>Subscription Breakdown by Plan</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Plan</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Count</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(metrics.planBreakdown).map(([plan, count]) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${plan}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
      
      <p><small>Generated on ${new Date().toLocaleString()}</small></p>
    `
    
    const text = `
Kealee Subscription Metrics

Overview:
- Total Subscriptions: ${metrics.total}
- Active: ${metrics.active}
- Trial: ${metrics.trial}
- Past Due: ${metrics.pastDue}
- Canceled: ${metrics.canceled}
- Monthly Recurring Revenue (MRR): $${metrics.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Generated on ${new Date().toLocaleString()}
    `.trim()

    await getEmailQueue().add('send-email', {
      to: recipient,
      subject,
      html,
      text,
      metadata: {
        eventType: 'subscription_metrics_report',
        orgId: filters?.orgId,
        startDate: filters?.startDate?.toISOString(),
        endDate: filters?.endDate?.toISOString(),
      },
    })
  }

  /**
   * Get revenue reports
   */
  async getRevenueReport(filters?: {
    startDate?: Date
    endDate?: Date
    orgId?: string
  }) {
    const where: any = {}

    if (filters?.orgId) {
      where.orgId = filters.orgId
    }

    // Get payments (if Payment model exists)
    try {
      const payments = await prismaAny.payment.findMany({
        where: {
          ...where,
          ...(filters?.startDate || filters?.endDate ? {
            paidAt: {
              ...(filters?.startDate ? { gte: filters.startDate } : {}),
              ...(filters?.endDate ? { lte: filters.endDate } : {}),
            },
          } : {}),
          status: 'completed',
        },
        include: {
          subscription: {
            include: {
              servicePlan: true,
            },
          },
        },
      })

      // Calculate revenue metrics
      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const revenueByMonth: Record<string, number> = {}
      const revenueByPlan: Record<string, number> = {}

      payments.forEach(payment => {
        // Group by month
        const month = payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0, 7) : 'unknown'
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (payment.amount || 0)

        // Group by plan
        const planName = payment.subscription?.servicePlan?.name || 'Unknown'
        revenueByPlan[planName] = (revenueByPlan[planName] || 0) + (payment.amount || 0)
      })

      return {
        totalRevenue,
        revenueByMonth,
        revenueByPlan,
        paymentCount: payments.length,
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          paidAt: p.paidAt,
          planName: p.subscription?.servicePlan?.name,
        })),
      }
    } catch (error: any) {
      // If Payment model doesn't exist, return subscription-based estimates
      if (error.message?.includes('model') || error.message?.includes('Payment')) {
        const metrics = await this.getSubscriptionMetrics(filters)
        return {
          totalRevenue: metrics.mrr,
          revenueByMonth: {},
          revenueByPlan: metrics.planBreakdown,
          paymentCount: metrics.active,
          payments: [],
        }
      }
      throw error
    }
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
    const orgSub = subscriptionId
      ? await prismaAny.serviceSubscription.findUnique({ where: { stripeId: subscriptionId } })
      : null
    const orgId = orgSub?.orgId || invoice.metadata?.orgId || null

    await eventService.recordEvent({
      type: 'STRIPE_INVOICE_PAYMENT_FAILED',
      entityType: 'StripeInvoice',
      entityId: invoice.id,
      orgId: orgId || undefined,
      payload: {
        subscriptionId,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      },
    })

    const recipient: string | undefined =
      invoice.customer_email || invoice.customer_details?.email || undefined

    if (!recipient) return

    const subject = 'Kealee billing: payment failed'
    const hostedUrl = invoice.hosted_invoice_url
    const html = `
      <h1>Payment failed</h1>
      <p>We were unable to process your payment for Kealee Ops Services.</p>
      <p>Please update your payment method to avoid service interruption.</p>
      ${hostedUrl ? `<p>View invoice: <a href="${hostedUrl}">${hostedUrl}</a></p>` : ''}
    `
    const text =
      `Payment failed.\n\nPlease update your payment method to avoid service interruption.\n` +
      (hostedUrl ? `\nView invoice: ${hostedUrl}\n` : '')

    await getEmailQueue().add('send-email', {
      to: recipient,
      subject,
      html,
      text,
      metadata: {
        eventType: 'stripe_invoice_payment_failed',
        orgId: orgId || undefined,
        stripeInvoiceId: invoice.id,
      },
    })
  }
}

export const billingService = new BillingService()

