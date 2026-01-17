/**
 * TypeScript Type Definitions for Stripe Products
 */

import { STRIPE_PRODUCTS, PRODUCT_CATEGORIES, INTERVALS, PRODUCT_TYPES } from './stripe-products';

/**
 * Product Category Types
 */
export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES];

/**
 * Subscription Intervals
 */
export type SubscriptionInterval = typeof INTERVALS[keyof typeof INTERVALS];

/**
 * Product Types
 */
export type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES];

/**
 * PM Staffing Package Tiers
 */
export type PMStaffingTier = keyof typeof STRIPE_PRODUCTS.pmStaffing;

/**
 * Marketplace Tiers
 */
export type MarketplaceTier = keyof typeof STRIPE_PRODUCTS.marketplace;

/**
 * Professional Subscription Types
 */
export type ProfessionalSubscription = keyof typeof STRIPE_PRODUCTS.professional;

/**
 * Add-On Services
 */
export type AddOnService = keyof typeof STRIPE_PRODUCTS.addOns;

/**
 * Permit Complexity Levels
 */
export type PermitComplexity = keyof typeof STRIPE_PRODUCTS.permits;

/**
 * Transaction Fee Types
 */
export type TransactionFeeType = keyof typeof STRIPE_PRODUCTS.transactionFees;

/**
 * Base Product Interface
 */
export interface BaseProduct {
  id: string;
  name: string;
  priceId: string;
  price: number;
  amount: number;
  description: string;
  features: string[];
  metadata: Record<string, string>;
}

/**
 * Recurring Product Interface
 */
export interface RecurringProduct extends BaseProduct {
  interval: SubscriptionInterval;
  popular?: boolean;
}

/**
 * One-Time Product Interface
 */
export interface OneTimeProduct extends BaseProduct {
  type: 'one_time';
}

/**
 * PM Staffing Package Interface
 */
export interface PMStaffingPackage extends RecurringProduct {
  metadata: {
    package_id: string;
    tier: string;
    category: 'pm_staffing';
    popular?: string;
  };
}

/**
 * Marketplace Subscription Interface
 */
export interface MarketplaceSubscription extends RecurringProduct {
  limits: {
    leadLimit: number; // -1 for unlimited
    photoLimit: number; // -1 for unlimited
    portfolioProjects: number; // -1 for unlimited
  };
  metadata: {
    tier: string;
    lead_limit: string;
    photo_limit: string;
    category: 'marketplace';
    featured?: string;
    verified?: string;
  };
}

/**
 * Architect Pro Subscription Interface
 */
export interface ArchitectProSubscription extends RecurringProduct {
  benefits: {
    platformFeeDiscount: number;
    reducedFee: number;
    standardFee: number;
  };
  metadata: {
    tier: string;
    category: 'professional';
    profession: string;
    fee_discount: string;
  };
}

/**
 * Permit Pro Subscription Interface
 */
export interface PermitProSubscription extends RecurringProduct {
  limits: {
    permitApplications: number; // -1 for unlimited
    priorityProcessing: boolean;
  };
  metadata: {
    tier: string;
    category: 'professional';
    service: string;
    applications: string;
  };
}

/**
 * Marketing Pro Package Interface
 */
export interface MarketingProPackage extends RecurringProduct {
  included: {
    websiteBuilder: boolean;
    googleAdsBudget: number;
    socialPostsPerMonth: number;
    emailCampaigns: boolean;
    seoOptimization: boolean;
    reviewManagement: boolean;
  };
  metadata: {
    tier: string;
    category: 'marketing';
    google_ads_budget: string;
    social_posts_monthly: string;
    website_included: string;
  };
}

/**
 * Permit Service Interface
 */
export interface PermitService extends OneTimeProduct {
  processingTime: {
    min: number;
    max: number;
    unit: 'business_days';
  };
  metadata: {
    type: 'one_time';
    category: 'permit';
    complexity: string;
    processing_days: string;
    dedicated_specialist?: string;
  };
}

/**
 * Transaction Fee Interface
 */
export interface TransactionFee {
  id: string;
  name: string;
  percentage: number;
  fixed?: number;
  minimum?: number;
  maximum?: number;
  description: string;
  metadata: {
    type: 'transaction_fee';
    category: string;
    minimum?: string;
    maximum?: string;
    reduced?: string;
  };
}

/**
 * Subscription Status
 */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing';

/**
 * Customer Subscription Interface
 */
export interface CustomerSubscription {
  id: string;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata: Record<string, string>;
}

/**
 * Payment Intent Interface
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'canceled';
  customerId?: string;
  metadata: Record<string, string>;
  created: Date;
}

/**
 * Fee Calculation Result
 */
export interface FeeCalculation {
  subtotal: number;
  feePercentage: number;
  feeFixed: number;
  feeAmount: number;
  total: number;
  currency: string;
}

/**
 * Product Eligibility Check
 */
export interface ProductEligibility {
  eligible: boolean;
  reason?: string;
  requiredSubscription?: string;
  requiredVerification?: string[];
}

/**
 * Subscription Comparison
 */
export interface SubscriptionComparison {
  currentTier: string;
  proposedTier: string;
  priceDifference: number;
  featuresDifference: {
    added: string[];
    removed: string[];
  };
  limitsDifference?: {
    field: string;
    current: number | string;
    proposed: number | string;
  }[];
}

/**
 * Product Metadata Validator Result
 */
export interface MetadataValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Pricing Table Entry
 */
export interface PricingTableEntry {
  category: string;
  products: {
    id: string;
    name: string;
    price: number;
    interval?: string;
    features: string[];
    popular?: boolean;
    cta: string;
  }[];
}
