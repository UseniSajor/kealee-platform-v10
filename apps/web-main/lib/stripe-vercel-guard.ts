import { NextResponse } from 'next/server'

/**
 * Stripe + Vercel deployment policy (web-main production = live keys only).
 *
 * - On Vercel **production** (`VERCEL_ENV=production`): reject **test** secret keys so
 *   prod never silently runs in test mode.
 * - On Vercel **preview** / **development**: reject **live** secret keys so preview URLs
 *   cannot charge real cards if env vars are copied from Production by mistake.
 *
 * Local `next dev` (`VERCEL` unset): no-op — use Stripe CLI / test keys as you choose.
 */
export function guardStripeSecretForHttp(stripeSecretKey: string | undefined): NextResponse | null {
  if (!stripeSecretKey) return null

  if (process.env.VERCEL !== '1') return null

  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') {
    if (stripeSecretKey.startsWith('sk_test_')) {
      return NextResponse.json(
        {
          error: 'Stripe misconfiguration',
          message:
            'Production must use live Stripe keys (sk_live_…). Update Vercel Production environment variables.',
        },
        { status: 503 }
      )
    }
    return null
  }

  if (stripeSecretKey.startsWith('sk_live_')) {
    return NextResponse.json(
      {
        error: 'Live Stripe blocked on this deployment',
        message:
          'Use test keys (sk_test_…) on Preview, or test checkout on the production domain. Live Stripe cannot be used from non-production Vercel deployments.',
      },
      { status: 403 }
    )
  }

  return null
}

/** Webhook: never apply side effects from a non-production Vercel deployment (mis-pointed URL). */
export function isStripeWebhookSideEffectsDisabledOnThisDeployment(): boolean {
  return process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'production'
}
