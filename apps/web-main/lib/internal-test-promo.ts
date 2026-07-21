/**
 * Internal-testing $5 checkout override — Design Concept, Estimation, and
 * Permits all share this. Lets the team run a real end-to-end Stripe
 * checkout (session → webhook → fulfillment) without paying full price.
 *
 * Deliberately NOT a Stripe Coupon: Design Concept/Estimation prices vary
 * per service/tier ($99–$1,699), so a relative amount_off/percent_off
 * coupon can't land on an exact $5 across all of them. This overrides
 * unit_amount server-side instead, before the Stripe line item is built.
 *
 * Gated three ways so the public promo-code field can't be discovered/
 * abused by real customers:
 *   1. Code must match PREMIUM_PLUS_PROMO_CODE (env, comma-separated)
 *   2. Checkout email must be in PREMIUM_PLUS_PROMO_EMAILS (env, comma-separated)
 *   3. Fewer than PREMIUM_PLUS_PROMO_MAX_USES completed Stripe sessions have
 *      already used it — checked directly against Stripe (source of truth
 *      across all three checkout routes) rather than any one product's DB.
 */
import type Stripe from 'stripe'

export const INTERNAL_TEST_PROMO_CENTS = 500
export const INTERNAL_TEST_PROMO_METADATA_VALUE = 'internal_test_5'

const DEFAULT_CODE = 'PREMIUMPLUS5'
const DEFAULT_EMAILS = 'tim.chamberlain24@gmail.com'
const DEFAULT_MAX_USES = 5

function codes(): string[] {
  const env = process.env.PREMIUM_PLUS_PROMO_CODE ?? DEFAULT_CODE
  return env.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
}

function emails(): string[] {
  const env = process.env.PREMIUM_PLUS_PROMO_EMAILS ?? DEFAULT_EMAILS
  return env.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

function maxUses(): number {
  const env = process.env.PREMIUM_PLUS_PROMO_MAX_USES
  const n = env ? Number.parseInt(env, 10) : DEFAULT_MAX_USES
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_USES
}

/** Code + email both check out. Does NOT check the usage cap — see usesRemaining(). */
export function matchesInternalTestPromo(promoCode: string | undefined | null, email: string | undefined | null): boolean {
  if (!promoCode || !email) return false
  if (!codes().includes(promoCode.trim().toUpperCase())) return false
  if (!emails().includes(email.trim().toLowerCase())) return false
  return true
}

/**
 * True if another redemption is still allowed under the cap. Fails closed
 * (denies) on any Stripe error. Lists recent completed sessions and filters
 * client-side rather than using Stripe's Search API — this SDK version's
 * types don't expose checkout.sessions.search, and for a cap this small a
 * single list() page is more than enough.
 */
export async function internalTestPromoUsesRemaining(stripe: Stripe): Promise<boolean> {
  try {
    const cap = maxUses()
    const result = await stripe.checkout.sessions.list({ status: 'complete', limit: 100 })
    const uses = result.data.filter((s) => s.metadata?.promoApplied === INTERNAL_TEST_PROMO_METADATA_VALUE).length
    return uses < cap
  } catch (err: unknown) {
    console.warn('[internal-test-promo] usage check failed, denying promo to be safe:', err instanceof Error ? err.message : err)
    return false
  }
}

/**
 * Full eligibility check: code + email match AND under the cap.
 * One Stripe call — only made after the cheap code/email check passes.
 */
export async function internalTestPromoApplies(
  stripe: Stripe,
  promoCode: string | undefined | null,
  email: string | undefined | null,
): Promise<boolean> {
  if (!matchesInternalTestPromo(promoCode, email)) return false
  return internalTestPromoUsesRemaining(stripe)
}
