import { Queue } from 'bullmq'
import IORedis from 'ioredis'
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
  emailQueueSingleton = new Queue<EmailJobData>('email', { connection })
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
    const orgIds = orgMemberships.map(m => m.orgId)
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
    const currentPeriodStart = toDateFromSeconds(subscription.current_period_start)
    const currentPeriodEnd = toDateFromSeconds(subscription.current_period_end)
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

