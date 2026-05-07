/**
 * Kealee Pricing Constants
 *
 * Single source of truth for all product prices.
 * All marketing files MUST import from here — never hardcode prices.
 */

// ── Concept Package Prices ────────────────────────────────────────────────────

export const CONCEPT_KITCHEN_PRICE        = 395   // dollars
export const CONCEPT_KITCHEN_ADVANCED     = 695
export const CONCEPT_KITCHEN_FULL         = 2500  // "from"

export const CONCEPT_BATH_PRICE           = 395
export const CONCEPT_BATH_ADVANCED        = 695
export const CONCEPT_BATH_FULL            = 2000  // "from"

export const CONCEPT_WHOLE_HOME_PRICE     = 585
export const CONCEPT_WHOLE_HOME_ADVANCED  = 1200
export const CONCEPT_WHOLE_HOME_FULL      = 6500  // "from"

export const CONCEPT_INTERIOR_RENO_PRICE  = 395   // interior reno/addition base
export const CONCEPT_EXTERIOR_PRICE       = 295
export const CONCEPT_LANDSCAPE_PRICE      = 195
export const CONCEPT_COMMERCIAL_PRICE     = 1200  // "from"
export const CONCEPT_DEVELOPER_PRICE      = 1500  // "from"

/** Generic lowest starting price shown in broad marketing */
export const CONCEPT_START_PRICE         = 195

// ── Tier label map (numeric tier → display string) ────────────────────────────

export const CONCEPT_TIER_PRICES: Record<1 | 2 | 3, number> = {
  1: CONCEPT_KITCHEN_PRICE,       // entry-tier concept
  2: CONCEPT_WHOLE_HOME_PRICE,    // mid-tier concept
  3: CONCEPT_DEVELOPER_PRICE,     // high-tier concept
}

// ── Permit Prices ─────────────────────────────────────────────────────────────

export const PERMIT_BASIC_PRICE    = 299   // permit path assessment
export const PERMIT_STANDARD_PRICE = 799   // permit package filing
export const PERMIT_PREMIUM_PRICE  = 1499  // full permit management

// ── Estimation Prices ─────────────────────────────────────────────────────────

export const ESTIMATION_PRICE           = 249  // standalone cost estimate
export const ESTIMATION_CERTIFIED_PRICE = 499  // RSMeans-certified estimate

// ── Other Products ────────────────────────────────────────────────────────────

export const ADU_BUNDLE_PRICE           = 999
export const PM_ADVISORY_PRICE          = 299   // per month
export const CONTRACTOR_MATCH_PRICE     = 0     // free (monetized via contractor)
export const DESIGN_ESTIMATE_PERMIT_BUNDLE = 1499

// ── String formatters ─────────────────────────────────────────────────────────

/** Format a dollar amount as "$X,XXX" */
export function formatPrice(cents: number): string {
  return `$${cents.toLocaleString('en-US')}`
}

/** Format a "starting at" string */
export function startingAt(price: number): string {
  return `Starting at ${formatPrice(price)}`
}
