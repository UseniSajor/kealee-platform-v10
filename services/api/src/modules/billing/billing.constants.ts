export const OPS_SERVICES_MODULE_KEY = 'm-ops-services'

export type BillingInterval = 'month' | 'year'

export type GCPlanSlug = 'package-a' | 'package-b' | 'package-c' | 'package-d'

export function getPriceIdForPlan(planSlug: GCPlanSlug, interval: BillingInterval): string {
  const key = `STRIPE_GC_${planSlug.toUpperCase().replace('-', '_')}_${interval.toUpperCase()}_PRICE_ID`
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing Stripe price env var: ${key}`)
  }
  return value
}

export function getPlanSlugFromPriceId(priceId: string): GCPlanSlug | null {
  const plans: GCPlanSlug[] = ['package-a', 'package-b', 'package-c', 'package-d']
  const intervals: BillingInterval[] = ['month', 'year']

  for (const p of plans) {
    for (const i of intervals) {
      const envKey = `STRIPE_GC_${p.toUpperCase().replace('-', '_')}_${i.toUpperCase()}_PRICE_ID`
      if (process.env[envKey] === priceId) return p
    }
  }

  return null
}

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

