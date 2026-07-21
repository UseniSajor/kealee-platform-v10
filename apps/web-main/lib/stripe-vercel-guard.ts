import { NextResponse } from 'next/server'

/**
 * Stripe deployment policy (enforce live keys on production, test keys on preview/staging).
 *
 * Supports both Vercel and Railway:
 * - Vercel: checks VERCEL_ENV (production/preview/development)
 * - Railway: checks RAILWAY_ENVIRONMENT_NAME (production/staging) or NODE_ENV
 * - Local: VERCEL and RAILWAY_ENVIRONMENT_NAME both unset — no-op
 *
 * Rules:
 * - Production: require live keys (sk_live_*), warn if test keys detected
 * - Non-production (staging/preview): block live keys to prevent accidental charges
 * - Local development: no restrictions
 */

function isProduction(): boolean {
  // Vercel production
  if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') {
    return true
  }

  // Railway production
  if (process.env.RAILWAY_ENVIRONMENT_NAME === 'production') {
    return true
  }

  // Fallback: NODE_ENV=production in deployed context
  if (
    process.env.NODE_ENV === 'production' &&
    (process.env.VERCEL === '1' || process.env.RAILWAY_ENVIRONMENT_NAME)
  ) {
    return true
  }

  return false
}

function isDeployedEnvironment(): boolean {
  // Either Vercel or Railway
  return process.env.VERCEL === '1' || !!process.env.RAILWAY_ENVIRONMENT_NAME
}

export function guardStripeSecretForHttp(stripeSecretKey: string | undefined): NextResponse | null {
  if (!stripeSecretKey) return null

  // Local development: no restrictions
  if (!isDeployedEnvironment()) return null

  const isProd = isProduction()

  if (isProd) {
    if (stripeSecretKey.startsWith('sk_test_')) {
      // Test key on production — allow through but warn
      console.warn(
        '[stripe-guard] Using Stripe test key on production. Add sk_live_… to your production env vars for live payments.'
      )
    }
    return null
  }

  // Non-production: reject live keys
  if (stripeSecretKey.startsWith('sk_live_')) {
    return NextResponse.json(
      {
        error: 'Live Stripe blocked on this deployment',
        message: 'Use test keys (sk_test_…) on preview/staging, or verify you are on the production domain.',
      },
      { status: 403 }
    )
  }

  return null
}

/** Webhook: never apply side effects from a non-production deployment (mis-pointed URL). */
export function isStripeWebhookSideEffectsDisabledOnThisDeployment(): boolean {
  return isDeployedEnvironment() && !isProduction()
}
