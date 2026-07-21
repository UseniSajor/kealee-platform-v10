/**
 * Subscription Service
 * Subscription tier management and Stripe billing integration
 */

import {createClient} from '@/lib/supabase/client';

export type SubscriptionTier = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface SubscriptionFeatures {
  maxPermitsPerMonth?: number;
  maxStaffUsers?: number;
  advancedReporting: boolean;
  customFeeSchedules: boolean;
  gisIntegration: boolean;
  whiteLabel: boolean;
  dedicatedSupport: boolean;
  customIntegrations: boolean;
}

export interface Subscription {
  jurisdictionId: string;
  tier: SubscriptionTier;
  monthlyFee: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TRIAL';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  billingEmail?: string;
  features: SubscriptionFeatures;
}

export interface BillingUsage {
  permitsProcessed: number;
  permitsThisMonth: number;
  revenueCollected: number;
  revenueThisMonth: number;
  staffUsers: number;
  storageUsed: number; // MB
}

export class SubscriptionService {
  private readonly TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
    BASIC: {
      maxPermitsPerMonth: 100,
      maxStaffUsers: 3,
      advancedReporting: false,
      customFeeSchedules: false,
      gisIntegration: false,
      whiteLabel: false,
      dedicatedSupport: false,
      customIntegrations: false,
    },
    PRO: {
      maxPermitsPerMonth: 500,
      maxStaffUsers: 10,
      advancedReporting: true,
      customFeeSchedules: true,
      gisIntegration: false,
      whiteLabel: false,
      dedicatedSupport: false,
      customIntegrations: false,
    },
    ENTERPRISE: {
      advancedReporting: true,
      customFeeSchedules: true,
      gisIntegration: true,
      whiteLabel: true,
      dedicatedSupport: true,
      customIntegrations: true,
    },
  };

  private readonly TIER_PRICES: Record<SubscriptionTier, number> = {
    BASIC: 500,
    PRO: 1000,
    ENTERPRISE: 2000,
  };

  /**
   * Get subscription for jurisdiction
   */
  async getSubscription(jurisdictionId: string): Promise<Subscription | null> {
    const supabase = createClient();

    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('subscriptionTier, monthlyFee, settings')
      .eq('id', jurisdictionId)
      .single();

    if (!jurisdiction) {
      return null;
    }

    const tier = (jurisdiction.subscriptionTier || 'BASIC') as SubscriptionTier;
    const settings = (jurisdiction.settings || {}) as any;

    return {
      jurisdictionId,
      tier,
      monthlyFee: Number(jurisdiction.monthlyFee || this.TIER_PRICES[tier]),
      status: 'ACTIVE',
      stripeCustomerId: settings.stripeCustomerId,
      stripeSubscriptionId: settings.stripeSubscriptionId,
      currentPeriodStart: settings.currentPeriodStart
        ? new Date(settings.currentPeriodStart)
        : undefined,
      currentPeriodEnd: settings.currentPeriodEnd
        ? new Date(settings.currentPeriodEnd)
        : undefined,
      billingEmail: settings.billingEmail,
      features: this.TIER_FEATURES[tier],
    };
  }

  /**
   * Update subscription tier
   */
  async updateSubscriptionTier(
    jurisdictionId: string,
    newTier: SubscriptionTier,
    options?: {
      prorate?: boolean;
      stripeCustomerId?: string;
    }
  ): Promise<Subscription> {
    const supabase = createClient();

    const monthlyFee = this.TIER_PRICES[newTier];

    // Update jurisdiction
    const settings: any = {};
    if (options?.stripeCustomerId) {
      settings.stripeCustomerId = options.stripeCustomerId;
    }

    await supabase
      .from('Jurisdiction')
      .update({
        subscriptionTier: newTier,
        monthlyFee: monthlyFee.toString(),
        settings,
      })
      .eq('id', jurisdictionId);

    // Create Stripe subscription if customer ID provided
    if (options?.stripeCustomerId) {
      await this.createStripeSubscription(
        options.stripeCustomerId,
        newTier,
        monthlyFee
      );
    }

    // Get updated subscription
    const subscription = await this.getSubscription(jurisdictionId);
    if (!subscription) {
      throw new Error('Failed to get updated subscription');
    }

    return subscription;
  }

  /**
   * Create Stripe subscription
   */
  private async createStripeSubscription(
    customerId: string,
    tier: SubscriptionTier,
    amount: number
  ): Promise<void> {
    // In production, would call Stripe API
    // POST /v1/subscriptions
    // {
    //   customer: customerId,
    //   items: [{price: priceId}],
    //   billing: 'charge_automatically',
    // }

    console.log(`[STRIPE] Creating subscription for customer ${customerId}, tier ${tier}, $${amount}/month`);
  }

  /**
   * Get billing usage metrics
   */
  async getBillingUsage(jurisdictionId: string): Promise<BillingUsage> {
    const supabase = createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get permits
    const {data: allPermits} = await supabase
      .from('Permit')
      .select('id, createdAt, feeAmount, feePaid, feePaidAt')
      .eq('jurisdictionId', jurisdictionId);

    const permitsProcessed = allPermits?.length || 0;
    const permitsThisMonth =
      allPermits?.filter(p => new Date(p.createdAt) >= startOfMonth).length || 0;

    // Calculate revenue
    const paidPermits =
      allPermits?.filter(p => p.feePaid && p.feeAmount).map(p => Number(p.feeAmount)) || [];
    const revenueCollected = paidPermits.reduce((sum, fee) => sum + fee, 0);

    const revenueThisMonth = allPermits
      ?.filter(
        p =>
          p.feePaid &&
          p.feeAmount &&
          p.feePaidAt &&
          new Date(p.feePaidAt) >= startOfMonth
      )
      .map(p => Number(p.feeAmount))
      .reduce((sum, fee) => sum + fee, 0) || 0;

    // Get staff count
    const {data: staff} = await supabase
      .from('JurisdictionStaff')
      .select('id', {count: 'exact', head: true})
      .eq('jurisdictionId', jurisdictionId)
      .eq('active', true);

    const staffUsers = staff || 0;

    // Estimate storage (would query actual storage)
    const storageUsed = 0;

    return {
      permitsProcessed,
      permitsThisMonth,
      revenueCollected,
      revenueThisMonth,
      staffUsers,
      storageUsed,
    };
  }

  /**
   * Check subscription limits
   */
  async checkSubscriptionLimits(jurisdictionId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    const subscription = await this.getSubscription(jurisdictionId);
    if (!subscription) {
      return {withinLimits: false, violations: ['No subscription found']};
    }

    const usage = await this.getBillingUsage(jurisdictionId);
    const violations: string[] = [];

    // Check permit limit
    if (
      subscription.features.maxPermitsPerMonth &&
      usage.permitsThisMonth >= subscription.features.maxPermitsPerMonth
    ) {
      violations.push(
        `Permit limit reached: ${usage.permitsThisMonth}/${subscription.features.maxPermitsPerMonth} permits this month`
      );
    }

    // Check staff limit
    if (
      subscription.features.maxStaffUsers &&
      usage.staffUsers >= subscription.features.maxStaffUsers
    ) {
      violations.push(
        `Staff limit reached: ${usage.staffUsers}/${subscription.features.maxStaffUsers} staff users`
      );
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }

  /**
   * Process monthly billing
   */
  async processMonthlyBilling(jurisdictionId: string): Promise<{
    success: boolean;
    invoiceId?: string;
    amount: number;
  }> {
    const subscription = await this.getSubscription(jurisdictionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check limits
    const limits = await this.checkSubscriptionLimits(jurisdictionId);
    if (!limits.withinLimits) {
      // Suspend subscription or charge overage
      console.warn('Subscription limits exceeded:', limits.violations);
    }

    // Create Stripe invoice
    if (subscription.stripeCustomerId) {
      // In production, would create invoice via Stripe API
      const invoiceId = `inv-${Date.now()}`;
      console.log(
        `[STRIPE] Creating invoice ${invoiceId} for customer ${subscription.stripeCustomerId}, amount: $${subscription.monthlyFee}`
      );

      return {
        success: true,
        invoiceId,
        amount: subscription.monthlyFee,
      };
    }

    return {
      success: false,
      amount: subscription.monthlyFee,
    };
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();
