/**
 * Stripe Package - Main Export
 * Complete Stripe integration for Kealee Platform
 */

// Export product definitions
export { STRIPE_PRODUCTS, PRODUCT_CATEGORIES, INTERVALS, PRODUCT_TYPES } from './stripe-products';

// Export types
export type {
  ProductCategory,
  SubscriptionInterval,
  ProductType,
  PMStaffingTier,
  MarketplaceTier,
  ProfessionalSubscription,
  AddOnService,
  PermitComplexity,
  TransactionFeeType,
  BaseProduct,
  RecurringProduct,
  OneTimeProduct,
  PMStaffingPackage,
  MarketplaceSubscription,
  ArchitectProSubscription,
  PermitProSubscription,
  MarketingProPackage,
  PermitService,
  TransactionFee,
  SubscriptionStatus,
  CustomerSubscription,
  PaymentIntent,
  FeeCalculation,
  ProductEligibility,
  SubscriptionComparison,
  MetadataValidation,
  PricingTableEntry,
} from './types';

// Export constants
export {
  PM_STAFFING_COMPARISON,
  MARKETPLACE_COMPARISON,
  PRICING_TABLES,
  PERMIT_PROCESSING_TIMES,
  ADD_ON_CATALOG,
  FEE_SCHEDULE,
  PRODUCT_NAVIGATION,
  CURRENCY_CONFIG,
} from './constants';

// Export validators
export {
  validateProductMetadata,
  checkProductEligibility,
  calculateTransactionFee,
  calculateArchitectFee,
  validateSubscriptionChange,
  validatePriceId,
  validateAmount,
  isSubscriptionActive,
  subscriptionNeedsAttention,
  validatePermitComplexity,
  calculateProratedAmount,
  validateSubscriptionMetadata,
} from './validators';

// Export helpers
export {
  getPMStaffingPackages,
  getPMStaffingPackage,
  getMarketplaceTiers,
  getMarketplaceTier,
  getProfessionalSubscriptions,
  getProfessionalSubscription,
  getMarketingProPackage,
  getAddOnServices,
  getAddOnService,
  getPermitServices,
  getPermitService,
  getTransactionFee,
  getProductByPriceId,
  getProductById,
  formatPrice,
  formatAmount,
  getPopularProducts,
  getProductsByCategory,
  getRecurringProducts,
  getOneTimeProducts,
  calculateTotalWithFee,
  getPriceIdByProductId,
  isSubscriptionProduct,
  isOneTimeProduct,
  getProductFeatures,
  getProductMetadata,
  compareProducts,
  getRecommendedUpgrade,
} from './helpers';
