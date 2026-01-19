export const OPS_SERVICES_MODULE_KEY = 'm-ops-services'

export type BillingInterval = 'month' | 'year'

export type GCPlanSlug = 'package-a' | 'package-b' | 'package-c' | 'package-d'

/**
 * Get Stripe price ID for a plan and billing interval
 * Uses environment variables: STRIPE_PRICE_PACKAGE_{A|B|C|D}_MONTHLY or _ANNUAL
 */
export function getPriceIdForPlan(planSlug: GCPlanSlug, interval: BillingInterval): string {
  const packageUpper = planSlug.toUpperCase().replace('-', '_')
  const intervalUpper = interval.toUpperCase()
  const key = `STRIPE_PRICE_PACKAGE_${packageUpper}_${intervalUpper}`
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing Stripe price env var: ${key}. Set STRIPE_PRICE_PACKAGE_${packageUpper}_${intervalUpper} in environment variables.`)
  }
  return value
}

/**
 * Get plan slug from Stripe price ID
 * Searches environment variables to find matching price ID
 */
export function getPlanSlugFromPriceId(priceId: string): GCPlanSlug | null {
  const plans: GCPlanSlug[] = ['package-a', 'package-b', 'package-c', 'package-d']
  const intervals: BillingInterval[] = ['month', 'year']

  for (const p of plans) {
    for (const i of intervals) {
      const packageUpper = p.toUpperCase().replace('-', '_')
      const intervalUpper = i.toUpperCase()
      const envKey = `STRIPE_PRICE_PACKAGE_${packageUpper}_${intervalUpper}`
      if (process.env[envKey] === priceId) return p
    }
  }

  return null
}

/**
 * Map Stripe subscription status to our internal status
 */
export function mapStripeSubscriptionStatus(status: string): string {
  // Normalize Stripe subscription.status -> ServiceSubscription.status
  // Stripe: trialing, active, past_due, unpaid, canceled, incomplete, incomplete_expired, paused
  if (status === 'trialing') return 'trial'
  if (status === 'active') return 'active'
  if (status === 'past_due' || status === 'unpaid') return 'past_due'
  if (status === 'canceled') return 'canceled'
  if (status === 'paused') return 'paused'
  return status
}


