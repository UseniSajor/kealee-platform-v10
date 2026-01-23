/**
 * Stripe Configuration
 * Initializes Stripe.js for client-side payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                              process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!stripePublishableKey) {
  console.warn('⚠️  Stripe publishable key not found. Payment methods will not work.');
  console.warn('Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or VITE_STRIPE_PUBLISHABLE_KEY in your environment.');
}

// Singleton instance of Stripe
let stripePromise: Promise<Stripe | null>;

/**
 * Get or create Stripe instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!stripePublishableKey;
};

export default getStripe;
