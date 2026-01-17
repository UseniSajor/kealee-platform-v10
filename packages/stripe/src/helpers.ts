/**
 * Stripe Helper Functions
 * Utility functions for working with Stripe products
 */

import { STRIPE_PRODUCTS } from './stripe-products';
import type {
  PMStaffingTier,
  MarketplaceTier,
  ProfessionalSubscription,
  PermitComplexity,
  TransactionFeeType,
} from './types';

/**
 * Get all PM Staffing packages
 */
export function getPMStaffingPackages() {
  return Object.entries(STRIPE_PRODUCTS.pmStaffing).map(([key, value]) => ({
    tier: key as PMStaffingTier,
    ...value,
  }));
}

/**
 * Get PM Staffing package by tier
 */
export function getPMStaffingPackage(tier: PMStaffingTier) {
  return STRIPE_PRODUCTS.pmStaffing[tier];
}

/**
 * Get all Marketplace tiers
 */
export function getMarketplaceTiers() {
  return Object.entries(STRIPE_PRODUCTS.marketplace).map(([key, value]) => ({
    tier: key as MarketplaceTier,
    ...value,
  }));
}

/**
 * Get Marketplace tier by name
 */
export function getMarketplaceTier(tier: MarketplaceTier) {
  return STRIPE_PRODUCTS.marketplace[tier];
}

/**
 * Get all Professional subscriptions
 */
export function getProfessionalSubscriptions() {
  return Object.entries(STRIPE_PRODUCTS.professional).map(([key, value]) => ({
    type: key as ProfessionalSubscription,
    ...value,
  }));
}

/**
 * Get Professional subscription by type
 */
export function getProfessionalSubscription(type: ProfessionalSubscription) {
  return STRIPE_PRODUCTS.professional[type];
}

/**
 * Get Marketing Pro package
 */
export function getMarketingProPackage() {
  return STRIPE_PRODUCTS.marketing.pro;
}

/**
 * Get all Add-On services
 */
export function getAddOnServices() {
  return Object.entries(STRIPE_PRODUCTS.addOns).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

/**
 * Get Add-On service by ID
 */
export function getAddOnService(id: string) {
  return STRIPE_PRODUCTS.addOns[id as keyof typeof STRIPE_PRODUCTS.addOns];
}

/**
 * Get all Permit services
 */
export function getPermitServices() {
  return Object.entries(STRIPE_PRODUCTS.permits).map(([key, value]) => ({
    complexity: key as PermitComplexity,
    ...value,
  }));
}

/**
 * Get Permit service by complexity
 */
export function getPermitService(complexity: PermitComplexity) {
  return STRIPE_PRODUCTS.permits[complexity];
}

/**
 * Get transaction fee by type
 */
export function getTransactionFee(type: TransactionFeeType) {
  return STRIPE_PRODUCTS.transactionFees[type];
}

/**
 * Get product by price ID
 */
export function getProductByPriceId(priceId: string) {
  // Search through all products
  const allProducts = [
    ...Object.values(STRIPE_PRODUCTS.pmStaffing),
    ...Object.values(STRIPE_PRODUCTS.marketplace),
    ...Object.values(STRIPE_PRODUCTS.professional),
    Object.values(STRIPE_PRODUCTS.marketing)[0],
    ...Object.values(STRIPE_PRODUCTS.addOns),
    ...Object.values(STRIPE_PRODUCTS.permits),
  ];

  return allProducts.find((product) => product.priceId === priceId);
}

/**
 * Get product by ID
 */
export function getProductById(productId: string) {
  const allProducts = [
    ...Object.values(STRIPE_PRODUCTS.pmStaffing),
    ...Object.values(STRIPE_PRODUCTS.marketplace),
    ...Object.values(STRIPE_PRODUCTS.professional),
    Object.values(STRIPE_PRODUCTS.marketing)[0],
    ...Object.values(STRIPE_PRODUCTS.addOns),
    ...Object.values(STRIPE_PRODUCTS.permits),
  ];

  return allProducts.find((product) => product.id === productId);
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number,
  currency: string = 'USD',
  interval?: string
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  return interval ? `${formatted}/${interval}` : formatted;
}

/**
 * Format amount in cents for display
 */
export function formatAmount(
  amount: number,
  currency: string = 'USD',
  interval?: string
): string {
  return formatPrice(amount / 100, currency, interval);
}

/**
 * Get popular products
 */
export function getPopularProducts() {
  return [
    STRIPE_PRODUCTS.pmStaffing.packageC, // Premium PM Staffing
    STRIPE_PRODUCTS.marketplace.professional, // Professional Marketplace
    STRIPE_PRODUCTS.marketing.pro, // Marketing Pro
  ];
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string) {
  switch (category) {
    case 'pm_staffing':
      return Object.values(STRIPE_PRODUCTS.pmStaffing);
    case 'marketplace':
      return Object.values(STRIPE_PRODUCTS.marketplace);
    case 'professional':
      return Object.values(STRIPE_PRODUCTS.professional);
    case 'marketing':
      return [STRIPE_PRODUCTS.marketing.pro];
    case 'add_ons':
      return Object.values(STRIPE_PRODUCTS.addOns);
    case 'permits':
      return Object.values(STRIPE_PRODUCTS.permits);
    default:
      return [];
  }
}

/**
 * Get recurring products only
 */
export function getRecurringProducts() {
  return [
    ...Object.values(STRIPE_PRODUCTS.pmStaffing),
    ...Object.values(STRIPE_PRODUCTS.marketplace),
    ...Object.values(STRIPE_PRODUCTS.professional),
    STRIPE_PRODUCTS.marketing.pro,
    STRIPE_PRODUCTS.addOns.whiteLabel,
    STRIPE_PRODUCTS.addOns.apiAccess,
  ];
}

/**
 * Get one-time products only
 */
export function getOneTimeProducts() {
  return [
    STRIPE_PRODUCTS.addOns.expedited,
    ...Object.values(STRIPE_PRODUCTS.permits),
  ];
}

/**
 * Calculate total with fee
 */
export function calculateTotalWithFee(
  amount: number,
  feePercentage: number,
  feeFixed: number = 0
): number {
  const percentageFee = (amount * feePercentage) / 100;
  const fixedFee = feeFixed * 100; // Convert to cents
  return Math.round(amount + percentageFee + fixedFee);
}

/**
 * Get price ID by product ID
 */
export function getPriceIdByProductId(productId: string): string | undefined {
  const product = getProductById(productId);
  return product?.priceId;
}

/**
 * Check if product is subscription
 */
export function isSubscriptionProduct(productId: string): boolean {
  const product = getProductById(productId);
  return product ? 'interval' in product : false;
}

/**
 * Check if product is one-time
 */
export function isOneTimeProduct(productId: string): boolean {
  const product = getProductById(productId);
  return product ? 'type' in product && product.type === 'one_time' : false;
}

/**
 * Get product features
 */
export function getProductFeatures(productId: string): string[] {
  const product = getProductById(productId);
  return product?.features || [];
}

/**
 * Get product metadata
 */
export function getProductMetadata(productId: string): Record<string, string> {
  const product = getProductById(productId);
  return product?.metadata || {};
}

/**
 * Compare two products
 */
export function compareProducts(productId1: string, productId2: string) {
  const product1 = getProductById(productId1);
  const product2 = getProductById(productId2);

  if (!product1 || !product2) {
    return null;
  }

  return {
    product1: {
      id: product1.id,
      name: product1.name,
      price: product1.price,
      features: product1.features,
    },
    product2: {
      id: product2.id,
      name: product2.name,
      price: product2.price,
      features: product2.features,
    },
    priceDifference: product2.price - product1.price,
  };
}

/**
 * Get recommended upgrade for a product
 */
export function getRecommendedUpgrade(currentProductId: string) {
  const product = getProductById(currentProductId);
  if (!product) return null;

  // PM Staffing upgrades
  if (currentProductId === 'package_a') return STRIPE_PRODUCTS.pmStaffing.packageB;
  if (currentProductId === 'package_b') return STRIPE_PRODUCTS.pmStaffing.packageC;
  if (currentProductId === 'package_c') return STRIPE_PRODUCTS.pmStaffing.packageD;

  // Marketplace upgrades
  if (currentProductId === 'marketplace_basic') return STRIPE_PRODUCTS.marketplace.professional;
  if (currentProductId === 'marketplace_professional') return STRIPE_PRODUCTS.marketplace.premium;

  return null;
}
