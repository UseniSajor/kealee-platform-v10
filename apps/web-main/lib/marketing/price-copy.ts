/**
 * Ready-made price strings for marketing copy.
 *
 * Every value is computed from the quoting engine. Import these instead of
 * typing a dollar amount into a page: that is how the platform ended up with
 * seven disagreeing price lists, a $585 concept that checkout billed at $199,
 * and a "$199" contractor match that is free.
 *
 * The exact price of any project is quoted after intake — marketing states a
 * "from" price or a range, never a final figure.
 */

import { formatPriceRange, priceRangeFor } from '@kealee/core-rules'

const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`

function low(productKey: string): string {
  const range = priceRangeFor(productKey)
  return range ? dollars(range.lowCents) : 'Quoted after intake'
}

function high(productKey: string): string {
  const range = priceRangeFor(productKey)
  return range ? dollars(range.highCents) : 'Quoted after intake'
}

function span(...keys: string[]): string {
  const ranges = keys.map(priceRangeFor).filter(Boolean) as { lowCents: number; highCents: number }[]
  if (!ranges.length) return 'Quoted after intake'
  return `${dollars(Math.min(...ranges.map(r => r.lowCents)))}–${dollars(Math.max(...ranges.map(r => r.highCents)))}`
}

// ── Concept packages ─────────────────────────────────────────────────────────

/** Lowest concept price across all project types — the broad "starting at". */
export const CONCEPT_FROM = low('bathroom_remodel')
export const CONCEPT_RANGE = span('bathroom_remodel', 'developer_concept')
export const CONCEPT_KITCHEN_RANGE = formatPriceRange('kitchen_remodel') ?? ''
export const CONCEPT_WHOLE_HOME_FROM = low('whole_home_concept')
export const CONCEPT_EXTERIOR_FROM = low('exterior_concept')
export const CONCEPT_ADDITION_FROM = low('addition_expansion')
export const CONCEPT_DEVELOPER_FROM = low('developer_concept')

// ── Site intelligence ────────────────────────────────────────────────────────

export const SITE_PLAN_FROM = low('preliminary_site_plan')
export const SITE_PLAN_RANGE = span('preliminary_site_plan', 'permit_site_plan')

// ── Estimates ────────────────────────────────────────────────────────────────

export const ESTIMATE_FROM = low('cost_estimate')
export const ESTIMATE_RANGE = span('cost_estimate', 'certified_estimate')

// ── Permits ──────────────────────────────────────────────────────────────────

export const PERMIT_ASSESSMENT_FROM = low('permit_path_only')
export const PERMIT_FILING_FROM = low('permit_filing')
export const PERMIT_MANAGED_FROM = low('permit_managed')
export const PERMIT_RANGE = span('permit_path_only', 'permit_managed')

// ── Drawings ─────────────────────────────────────────────────────────────────

export const DRAWINGS_FROM = low('professional_drawings')
export const DRAWINGS_TO = high('professional_drawings')
export const DRAWINGS_RANGE = formatPriceRange('professional_drawings') ?? ''

// ── Services ─────────────────────────────────────────────────────────────────

/** Contractor matching is free — Kealee is paid by the build engagement. */
export const CONTRACTOR_MATCH_COPY = 'Free'
export const MANAGED_BID_FROM = low('managed_bid')
export const PM_ADVISORY_FROM = low('pm_advisory')
export const PM_OVERSIGHT_FROM = low('pm_oversight')
export const PM_RANGE = `${low('pm_advisory')}–${high('pm_oversight')}/mo`
