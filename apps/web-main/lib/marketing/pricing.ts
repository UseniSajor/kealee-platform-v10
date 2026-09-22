/**
 * Marketing price symbols — DERIVED, never authored here.
 *
 * This file used to carry its own price list and drifted from the checkout by
 * as much as 5×. Every value below is now computed from the quoting engine in
 * `@kealee/core-rules` (`PRODUCT_PRICING` → `priceRangeFor`), so marketing copy
 * and the amount a customer is charged cannot disagree.
 *
 * Marketing shows the "from" price or a range. The exact price is quoted after
 * intake — never stated in copy.
 */

import { priceRangeFor, formatPriceRange, bundleFromCents } from '@kealee/core-rules'

function fromDollars(productKey: string): number {
  const range = priceRangeFor(productKey)
  if (!range) throw new Error(`No pricing for product "${productKey}" — add it to PRODUCT_PRICING`)
  return Math.round(range.lowCents / 100)
}

function toDollars(productKey: string): number {
  const range = priceRangeFor(productKey)
  if (!range) throw new Error(`No pricing for product "${productKey}" — add it to PRODUCT_PRICING`)
  return Math.round(range.highCents / 100)
}

// ── Concept packages — "from" prices ─────────────────────────────────────────

export const CONCEPT_KITCHEN_PRICE       = fromDollars('kitchen_remodel')
export const CONCEPT_BATH_PRICE          = fromDollars('bathroom_remodel')
export const CONCEPT_WHOLE_HOME_PRICE    = fromDollars('whole_home_concept')
export const CONCEPT_INTERIOR_RENO_PRICE = fromDollars('interior_renovation')
export const CONCEPT_EXTERIOR_PRICE      = fromDollars('exterior_concept')
export const CONCEPT_LANDSCAPE_PRICE     = fromDollars('garden_concept')
export const CONCEPT_ADDITION_PRICE      = fromDollars('addition_expansion')
export const CONCEPT_COMMERCIAL_PRICE    = fromDollars('developer_concept')
export const CONCEPT_DEVELOPER_PRICE     = fromDollars('developer_concept')

/** Generic lowest starting price shown in broad marketing. */
export const CONCEPT_START_PRICE = Math.min(
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  CONCEPT_INTERIOR_RENO_PRICE,
  CONCEPT_LANDSCAPE_PRICE,
)

// ── Permits ──────────────────────────────────────────────────────────────────

export const PERMIT_BASIC_PRICE    = fromDollars('permit_path_only')
export const PERMIT_STANDARD_PRICE = fromDollars('permit_filing')
export const PERMIT_PREMIUM_PRICE  = fromDollars('permit_managed')

// ── Estimation ───────────────────────────────────────────────────────────────

export const ESTIMATION_PRICE           = fromDollars('cost_estimate')
export const ESTIMATION_CERTIFIED_PRICE = fromDollars('certified_estimate')

// ── Site intelligence ────────────────────────────────────────────────────────

export const PRELIMINARY_SITE_PLAN_PRICE = fromDollars('preliminary_site_plan')
export const VERIFIED_FEASIBILITY_PRICE  = fromDollars('verified_site_feasibility')
export const PERMIT_SITE_PLAN_PRICE      = fromDollars('permit_site_plan')

// ── Drawings and services ────────────────────────────────────────────────────

export const PROFESSIONAL_DRAWINGS_PRICE = fromDollars('professional_drawings')
export const PROFESSIONAL_DRAWINGS_MAX   = toDollars('professional_drawings')
export const MANAGED_BID_PRICE           = fromDollars('managed_bid')
export const PM_ADVISORY_PRICE           = fromDollars('pm_advisory')
export const PM_OVERSIGHT_PRICE          = fromDollars('pm_oversight')

/** ADU work is quoted as an addition concept — the same package and the same formula. */
export const ADU_BUNDLE_PRICE            = fromDollars('addition_expansion')

/** Bundles are their parts less the bundle credit; no separate price list exists. */
export const DESIGN_ESTIMATE_PERMIT_BUNDLE = Math.round(
  (bundleFromCents(['addition_expansion', 'cost_estimate', 'permit_filing']) ?? 0) / 100,
)
export const CONTRACTOR_MATCH_PRICE      = fromDollars('contractor_match')

// ── String formatters ────────────────────────────────────────────────────────

/** Format a dollar amount as "$X,XXX" */
export function formatPrice(dollars: number): string {
  return `$${dollars.toLocaleString('en-US')}`
}

/** Format a "starting at" string. Marketing never states an exact package price. */
export function startingAt(dollars: number): string {
  return `Starting at ${formatPrice(dollars)}`
}

/** "Typical price: $495–$795" — the range a product page should show. */
export function typicalRange(productKey: string): string {
  return formatPriceRange(productKey) ?? 'Priced after intake'
}
