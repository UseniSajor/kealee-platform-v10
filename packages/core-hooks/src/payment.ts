/**
 * packages/core-hooks/src/payment.ts
 *
 * Stripe checkout session creation for revenue hooks.
 * Calls the Kealee API to create a Stripe Checkout Session
 * and returns the redirect URL.
 */

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kealee.com')
  : (process.env.INTERNAL_API_URL ?? 'http://api:3000');

export interface CheckoutParams {
  priceId:    string;
  tierId:     string;
  stage:      string;
  projectId?: string;
  userId?:    string;
  successUrl?: string;
  cancelUrl?:  string;
}

export interface CheckoutResult {
  url:       string;
  sessionId: string;
}

/**
 * Create a Stripe Checkout Session for a revenue hook tier.
 * Redirects the browser to the Stripe-hosted checkout page.
 */
export async function createCheckoutSession(
  params: CheckoutParams,
): Promise<CheckoutResult> {
  const res = await fetch(`${API_BASE}/revenue-hooks/checkout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send session/cookie for auth
    body: JSON.stringify({
      priceId:    params.priceId,
      tierId:     params.tierId,
      stage:      params.stage,
      projectId:  params.projectId,
      successUrl: params.successUrl ?? `${window.location.origin}/checkout/success?tier=${params.tierId}&stage=${params.stage}`,
      cancelUrl:  params.cancelUrl  ?? window.location.href,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Checkout session error (${res.status}): ${err}`);
  }

  return res.json() as Promise<CheckoutResult>;
}

/**
 * Verify a completed checkout session (called on the success page).
 */
export async function verifyCheckoutSession(
  sessionId: string,
): Promise<{ verified: boolean; tierId: string; stage: string }> {
  const res = await fetch(`${API_BASE}/revenue-hooks/checkout/verify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) throw new Error('Checkout verification failed');
  return res.json();
}
