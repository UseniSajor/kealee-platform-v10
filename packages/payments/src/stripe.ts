import Stripe from 'stripe';
import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  stripeInstance = new Stripe(key);
  return stripeInstance;
}

export class StripeService {
  private get stripe() {
    return getStripeClient();
  }

  // ============ CUSTOMER MANAGEMENT ============

  /** Create a new Stripe customer */
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId, platform: 'kealee' },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  /** Get or create a Stripe customer for a user */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (user?.stripeCustomerId) {
      try {
        const existing = await this.stripe.customers.retrieve(user.stripeCustomerId);
        if (!(existing as any).deleted) {
          return existing as Stripe.Customer;
        }
      } catch {
        // Customer deleted or not found, create new
      }
    }

    return this.createCustomer(userId, email || user?.email || '', name || user?.name || undefined);
  }

  // ============ SUBSCRIPTION MANAGEMENT ============

  /** Create a checkout session for subscription */
  async createCheckoutSession(opts: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: opts.customerId,
      line_items: [{ price: opts.priceId, quantity: 1 }],
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: opts.trialDays,
        metadata: opts.metadata || {},
      },
      metadata: opts.metadata || {},
    });
  }

  /** Create a billing portal session for managing subscriptions */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /** Get subscription details */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'items.data.price.product'],
    });
  }

  /** Cancel subscription (at period end by default) */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return this.stripe.subscriptions.cancel(subscriptionId);
    }
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /** Update subscription to a new price */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) throw new Error('No subscription item found');

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'always_invoice',
    });
  }

  // ============ STRIPE CONNECT (CONTRACTORS) ============

  /** Create a Stripe Connect Express account for a contractor */
  async createConnectAccount(userId: string, email: string, country = 'US'): Promise<{
    accountId: string;
    onboardingUrl: string | null;
  }> {
    // Check for existing account
    const existing = await prisma.connectedAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        accountId: existing.stripeAccountId,
        onboardingUrl: null,
      };
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      metadata: { userId, platform: 'kealee' },
    });

    // Save to database
    await prisma.connectedAccount.create({
      data: {
        userId,
        stripeAccountId: account.id,
        accountType: 'EXPRESS',
        status: 'PENDING',
        country,
        email,
        currency: 'USD',
      },
    });

    // Create onboarding link
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contractor/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contractor/onboarding/complete`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  /** Generate an onboarding link for an existing Connect account */
  async createOnboardingLink(userId: string): Promise<{ url: string; expiresAt: string }> {
    const account = await prisma.connectedAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new Error('No Connect account found for this user');
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: account.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contractor/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contractor/onboarding/complete`,
      type: 'account_onboarding',
    });

    await prisma.connectedAccount.update({
      where: { userId },
      data: {
        onboardingLink: accountLink.url,
        onboardingLinkExpires: new Date(accountLink.expires_at * 1000),
      },
    });

    return {
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
    };
  }

  /** Check Connect account status */
  async getConnectAccountStatus(userId: string): Promise<{
    hasAccount: boolean;
    isOnboarded: boolean;
    canReceivePayments: boolean;
    accountId?: string;
    requirements?: Stripe.Account.Requirements;
  }> {
    const account = await prisma.connectedAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return { hasAccount: false, isOnboarded: false, canReceivePayments: false };
    }

    const stripeAccount = await this.stripe.accounts.retrieve(account.stripeAccountId);

    // Sync status to database
    await prisma.connectedAccount.update({
      where: { userId },
      data: {
        status: stripeAccount.details_submitted
          ? stripeAccount.charges_enabled && stripeAccount.payouts_enabled
            ? 'ACTIVE'
            : 'RESTRICTED'
          : 'PENDING',
        hasCompletedOnboarding: stripeAccount.details_submitted || false,
        payoutsEnabled: stripeAccount.payouts_enabled || false,
        chargesEnabled: stripeAccount.charges_enabled || false,
        requirements: stripeAccount.requirements as any,
      },
    });

    return {
      hasAccount: true,
      accountId: stripeAccount.id,
      isOnboarded: stripeAccount.details_submitted || false,
      canReceivePayments: (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) || false,
      requirements: stripeAccount.requirements || undefined,
    };
  }

  // ============ ESCROW OPERATIONS ============

  /** Fund escrow via PaymentIntent */
  async fundEscrow(opts: {
    escrowId: string;
    amount: number; // in cents
    customerId: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: opts.escrowId },
      select: { id: true, projectId: true, escrowAccountNumber: true, currency: true },
    });

    if (!escrow) throw new Error('Escrow agreement not found');

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: opts.amount,
      currency: escrow.currency.toLowerCase(),
      customer: opts.customerId,
      payment_method: opts.paymentMethodId,
      confirm: !!opts.paymentMethodId,
      metadata: {
        type: 'escrow_deposit',
        escrowId: opts.escrowId,
        projectId: escrow.projectId,
        escrowAccountNumber: escrow.escrowAccountNumber,
        ...opts.metadata,
      },
    });

    return paymentIntent;
  }

  /** Release milestone payment from escrow to contractor via Connect Transfer */
  async releaseMilestone(opts: {
    escrowId: string;
    milestoneId: string;
    amount: number; // in cents
    contractorAccountId: string; // Stripe Connect account ID
    platformFeePercent?: number;
    initiatedBy: string;
  }): Promise<Stripe.Transfer> {
    const feePercent = opts.platformFeePercent ?? 3;
    const platformFee = Math.round(opts.amount * (feePercent / 100));
    const transferAmount = opts.amount - platformFee;

    const transfer = await this.stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: opts.contractorAccountId,
      metadata: {
        type: 'milestone_release',
        escrowId: opts.escrowId,
        milestoneId: opts.milestoneId,
        platformFee: platformFee.toString(),
        grossAmount: opts.amount.toString(),
        initiatedBy: opts.initiatedBy,
      },
    });

    return transfer;
  }

  /** Partial release from escrow (e.g., progress payment) */
  async partialRelease(opts: {
    escrowId: string;
    amount: number; // in cents
    contractorAccountId: string;
    description: string;
    initiatedBy: string;
  }): Promise<Stripe.Transfer> {
    const platformFee = Math.round(opts.amount * 0.03);
    const transferAmount = opts.amount - platformFee;

    return this.stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: opts.contractorAccountId,
      metadata: {
        type: 'partial_release',
        escrowId: opts.escrowId,
        description: opts.description,
        platformFee: platformFee.toString(),
        initiatedBy: opts.initiatedBy,
      },
    });
  }

  /** Refund escrow funds back to customer */
  async refundEscrow(opts: {
    paymentIntentId: string;
    amount?: number; // partial refund amount in cents, omit for full
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: opts.paymentIntentId,
      amount: opts.amount,
      reason: opts.reason || 'requested_by_customer',
    });
  }

  // ============ ONE-TIME PAYMENTS ============

  /** Create a payment intent for one-time charges */
  async createPaymentIntent(opts: {
    amount: number; // in cents
    currency?: string;
    customerId: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: opts.amount,
      currency: opts.currency || 'usd',
      customer: opts.customerId,
      payment_method: opts.paymentMethodId,
      confirm: false,
      metadata: opts.metadata || {},
      description: opts.description,
    });
  }

  // ============ PRODUCT SYNC ============

  /** Sync a product to Stripe */
  async syncProduct(product: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
    prices: Array<{
      unitAmount: number; // in cents
      currency?: string;
      interval?: 'month' | 'year';
      nickname?: string;
    }>;
  }): Promise<{ productId: string; priceIds: string[] }> {
    const stripeProduct = await this.stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: { ...product.metadata, platform: 'kealee' },
    });

    const priceIds: string[] = [];
    for (const price of product.prices) {
      const stripePrice = await this.stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: price.unitAmount,
        currency: price.currency || 'usd',
        nickname: price.nickname,
        ...(price.interval
          ? { recurring: { interval: price.interval } }
          : {}),
      });
      priceIds.push(stripePrice.id);
    }

    return { productId: stripeProduct.id, priceIds };
  }

  /** List all platform customers */
  async listCustomers(limit = 100): Promise<Stripe.Customer[]> {
    const result = await this.stripe.customers.list({ limit });
    return result.data;
  }

  /** Get Stripe balance */
  async getBalance(): Promise<Stripe.Balance> {
    return this.stripe.balance.retrieve();
  }

  // ============ WEBHOOK VERIFICATION ============

  /** Verify and construct webhook event */
  verifyWebhookEvent(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

export const stripeService = new StripeService();
