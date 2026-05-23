import Stripe from 'stripe'

/**
 * Creates a Stripe instance using globalThis.fetch as the HTTP client.
 *
 * The Stripe SDK's built-in HTTP client (node-fetch) fails in the
 * Next.js/Vercel environment (StripeConnectionError). Using
 * Stripe.createFetchHttpClient(globalThis.fetch) routes all Stripe
 * API calls through Next.js's native fetch, which works correctly.
 */
export function createStripe(secretKey: string, apiVersion: string = '2024-06-20'): Stripe {
  return new Stripe(secretKey, {
    apiVersion: apiVersion as any,
    httpClient: Stripe.createFetchHttpClient(globalThis.fetch),
  })
}
