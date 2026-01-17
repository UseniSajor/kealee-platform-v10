/**
 * Stripe Product Validators
 * Validation functions for products, subscriptions, and fees
 */

import { STRIPE_PRODUCTS } from './stripe-products';
import type {
  MetadataValidation,
  ProductEligibility,
  FeeCalculation,
  TransactionFeeType,
  SubscriptionComparison,
} from './types';

/**
 * Validate product metadata
 */
export function validateProductMetadata(
  metadata: Record<string, string>
): MetadataValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.category) {
    errors.push('Missing required field: category');
  }

  // Validate category
  const validCategories = [
    'pm_staffing',
    'marketplace',
    'professional',
    'marketing',
    'add_on',
    'permit',
  ];
  if (metadata.category && !validCategories.includes(metadata.category)) {
    errors.push(`Invalid category: ${metadata.category}`);
  }

  // Validate tier if present
  if (metadata.tier && !['basic', 'professional', 'premium', 'pro', 'essential', 'white_glove'].includes(metadata.tier)) {
    warnings.push(`Unusual tier value: ${metadata.tier}`);
  }

  // Validate numeric fields
  if (metadata.lead_limit && metadata.lead_limit !== 'unlimited') {
    const leadLimit = parseInt(metadata.lead_limit, 10);
    if (isNaN(leadLimit) || leadLimit < 0) {
      errors.push(`Invalid lead_limit: ${metadata.lead_limit}`);
    }
  }

  if (metadata.photo_limit && metadata.photo_limit !== 'unlimited') {
    const photoLimit = parseInt(metadata.photo_limit, 10);
    if (isNaN(photoLimit) || photoLimit < 0) {
      errors.push(`Invalid photo_limit: ${metadata.photo_limit}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if user is eligible for a product
 */
export function checkProductEligibility(
  productId: string,
  userSubscriptions: string[],
  userVerifications: string[]
): ProductEligibility {
  // Premium marketplace requires verification
  if (productId === 'marketplace_premium') {
    const requiredVerifications = ['background_check', 'license_verification'];
    const missingVerifications = requiredVerifications.filter(
      (v) => !userVerifications.includes(v)
    );

    if (missingVerifications.length > 0) {
      return {
        eligible: false,
        reason: 'Missing required verifications',
        requiredVerification: missingVerifications,
      };
    }
  }

  // API access requires an active subscription
  if (productId === 'api_access') {
    const hasActiveSubscription = userSubscriptions.some((sub) =>
      ['marketplace_professional', 'marketplace_premium', 'architect_pro'].includes(sub)
    );

    if (!hasActiveSubscription) {
      return {
        eligible: false,
        reason: 'Requires an active Professional or Premium subscription',
        requiredSubscription: 'marketplace_professional or marketplace_premium',
      };
    }
  }

  // Architect Pro fee discount requires Architect Pro subscription
  if (productId === 'architect_pro_fee') {
    if (!userSubscriptions.includes('architect_pro')) {
      return {
        eligible: false,
        reason: 'Requires Architect Pro subscription',
        requiredSubscription: 'architect_pro',
      };
    }
  }

  return {
    eligible: true,
  };
}

/**
 * Calculate transaction fee
 */
export function calculateTransactionFee(
  amount: number,
  feeType: TransactionFeeType,
  currency: string = 'USD'
): FeeCalculation {
  const fee = STRIPE_PRODUCTS.transactionFees[feeType];

  // Calculate percentage fee
  const percentageFee = (amount * fee.percentage) / 100;

  // Add fixed fee if present (convert to cents)
  const fixedFee = fee.fixed ? fee.fixed * 100 : 0;

  // Calculate total fee
  let feeAmount = percentageFee + fixedFee;

  // Apply minimum if present
  if (fee.minimum) {
    feeAmount = Math.max(feeAmount, fee.minimum * 100);
  }

  // Apply maximum if present
  if (fee.maximum) {
    feeAmount = Math.min(feeAmount, fee.maximum * 100);
  }

  return {
    subtotal: amount,
    feePercentage: fee.percentage,
    feeFixed: fee.fixed || 0,
    feeAmount: Math.round(feeAmount),
    total: amount + Math.round(feeAmount),
    currency,
  };
}

/**
 * Calculate platform fee for architect services
 */
export function calculateArchitectFee(
  amount: number,
  hasArchitectPro: boolean = false
): FeeCalculation {
  const feeType = hasArchitectPro ? 'architectPro' : 'architect';
  return calculateTransactionFee(amount, feeType);
}

/**
 * Validate subscription upgrade/downgrade
 */
export function validateSubscriptionChange(
  currentTier: string,
  proposedTier: string,
  category: 'pmStaffing' | 'marketplace' | 'professional'
): SubscriptionComparison {
  let currentProduct: any;
  let proposedProduct: any;

  // Get products based on category
  if (category === 'pmStaffing') {
    currentProduct = Object.values(STRIPE_PRODUCTS.pmStaffing).find(
      (p) => p.id === currentTier
    );
    proposedProduct = Object.values(STRIPE_PRODUCTS.pmStaffing).find(
      (p) => p.id === proposedTier
    );
  } else if (category === 'marketplace') {
    currentProduct = Object.values(STRIPE_PRODUCTS.marketplace).find(
      (p) => p.id === currentTier
    );
    proposedProduct = Object.values(STRIPE_PRODUCTS.marketplace).find(
      (p) => p.id === proposedTier
    );
  } else if (category === 'professional') {
    currentProduct = Object.values(STRIPE_PRODUCTS.professional).find(
      (p) => p.id === currentTier
    );
    proposedProduct = Object.values(STRIPE_PRODUCTS.professional).find(
      (p) => p.id === proposedTier
    );
  }

  if (!currentProduct || !proposedProduct) {
    throw new Error('Invalid tier or category');
  }

  // Calculate price difference
  const priceDifference = proposedProduct.price - currentProduct.price;

  // Calculate feature differences
  const currentFeatures = new Set(currentProduct.features);
  const proposedFeatures = new Set(proposedProduct.features);

  const added = Array.from(proposedFeatures).filter(
    (f) => !currentFeatures.has(f)
  );
  const removed = Array.from(currentFeatures).filter(
    (f) => !proposedFeatures.has(f)
  );

  // Calculate limits differences (for marketplace)
  let limitsDifference: any[] | undefined;
  if (category === 'marketplace' && currentProduct.limits && proposedProduct.limits) {
    limitsDifference = [
      {
        field: 'leadLimit',
        current: currentProduct.limits.leadLimit === -1 ? 'unlimited' : currentProduct.limits.leadLimit,
        proposed: proposedProduct.limits.leadLimit === -1 ? 'unlimited' : proposedProduct.limits.leadLimit,
      },
      {
        field: 'photoLimit',
        current: currentProduct.limits.photoLimit === -1 ? 'unlimited' : currentProduct.limits.photoLimit,
        proposed: proposedProduct.limits.photoLimit === -1 ? 'unlimited' : proposedProduct.limits.photoLimit,
      },
    ];
  }

  return {
    currentTier,
    proposedTier,
    priceDifference,
    featuresDifference: {
      added,
      removed,
    },
    limitsDifference,
  };
}

/**
 * Validate price ID format
 */
export function validatePriceId(priceId: string): boolean {
  // Stripe price IDs follow format: price_[alphanumeric]
  const priceIdRegex = /^price_[a-zA-Z0-9]{24,}$/;
  return priceIdRegex.test(priceId);
}

/**
 * Validate amount in cents
 */
export function validateAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

/**
 * Check if subscription needs attention
 */
export function subscriptionNeedsAttention(status: string): boolean {
  return ['past_due', 'unpaid', 'incomplete'].includes(status);
}

/**
 * Validate permit complexity
 */
export function validatePermitComplexity(
  complexity: string
): complexity is 'simple' | 'standard' | 'complex' {
  return ['simple', 'standard', 'complex'].includes(complexity);
}

/**
 * Calculate prorated amount for subscription change
 */
export function calculateProratedAmount(
  currentAmount: number,
  newAmount: number,
  daysRemaining: number,
  daysInPeriod: number
): number {
  const unusedAmount = (currentAmount * daysRemaining) / daysInPeriod;
  const newPeriodAmount = (newAmount * daysRemaining) / daysInPeriod;
  return Math.round(newPeriodAmount - unusedAmount);
}

/**
 * Validate subscription metadata
 */
export function validateSubscriptionMetadata(
  metadata: Record<string, string>
): MetadataValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  if (!metadata.product_id && !metadata.package_id) {
    errors.push('Missing product_id or package_id');
  }

  if (!metadata.category) {
    errors.push('Missing category');
  }

  // Validate dates if present
  if (metadata.trial_end) {
    const trialEnd = new Date(metadata.trial_end);
    if (isNaN(trialEnd.getTime())) {
      errors.push('Invalid trial_end date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
