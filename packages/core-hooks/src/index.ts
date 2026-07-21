/**
 * @kealee/core-hooks
 *
 * Revenue hook system for the Kealee platform.
 * Provides UI components, pricing config, analytics, and Stripe checkout.
 */

export { RevenueHookModal, RevenueHookInline } from './RevenueHookModal.js';
export {
  REVENUE_HOOKS,
  getHook,
  getFreeTier,
  getPaidTiers,
  type HookStage,
  type HookTier,
  type RevenueHook,
} from './hooks.config.js';
export {
  setAnalyticsTracker,
  trackHookShown,
  trackTierSelected,
  trackHookDismissed,
  trackCheckoutStarted,
  trackCheckoutCompleted,
  type AnalyticsTracker,
} from './analytics.js';
export {
  createCheckoutSession,
  verifyCheckoutSession,
  type CheckoutParams,
  type CheckoutResult,
} from './payment.js';
