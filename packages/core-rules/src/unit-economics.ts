/**
 * What an order COSTS to fulfil.
 *
 * "Self-sustaining" has a financial meaning that the dependency work does not
 * address. A platform that owns its toolchain and loses money per order is not
 * self-sustaining; it is subsidised.
 *
 * Every figure here is either (a) a published third-party rate, cited, or
 * (b) a Kealee operating assumption, labelled as an assumption with the
 * variable that drives it. Nothing is a guess presented as a measurement. Where
 * a number is not known, it is `null` and the model reports the gap rather than
 * substituting a plausible figure — a cost model with invented inputs produces
 * a margin that looks exactly like a real one.
 */

export type CostBasis = 'published_rate' | 'operating_assumption' | 'unknown'

export interface CostLine {
  id: string
  label: string
  /** Cents. `null` when the figure is not established. */
  cents: number | null
  basis: CostBasis
  /** Where the number comes from, or what must be measured to establish it. */
  source: string
  /** True when the cost is incurred per order; false for amortised/fixed. */
  perOrder: boolean
}

/**
 * Machine costs. These are the ones the platform controls and they are small.
 *
 * The site-plan engine makes NO paid AI calls: PGAtlas, SSURGO and FEMA are
 * free public services and pdfkit, proj4, turf and the DXF writer are vendored
 * libraries. The marginal compute cost of a preliminary plan is therefore
 * close to zero, and the real cost is human.
 */
export const SITE_PLAN_MACHINE_COSTS: CostLine[] = [
  {
    id: 'gis_queries', label: 'County GIS queries (locator, parcel, zoning, contours, soils)',
    cents: 0, basis: 'published_rate', perOrder: true,
    source: 'PGAtlas, USDA SSURGO and FEMA NFHL are free public services with no key and no quota.',
  },
  {
    id: 'compute', label: 'Render and export compute',
    cents: 1, basis: 'operating_assumption', perOrder: true,
    source:
      'A full run is seconds of CPU on an existing Railway worker. Assumed at 1 cent to avoid ' +
      'implying it is exactly zero; the true figure is below the rounding of the hosting bill.',
  },
  {
    id: 'storage', label: 'Document storage (PDF + DXF + LandXML + GeoJSON)',
    cents: 1, basis: 'operating_assumption', perOrder: true,
    source: 'About 2 MB per order at commodity object-storage rates, retained indefinitely.',
  },
  {
    id: 'email', label: 'Transactional email',
    cents: 1, basis: 'published_rate', perOrder: true,
    source: 'Resend, roughly $0.0004 per message, a handful of messages per order.',
  },
]

/** Concept products DO make paid AI calls. These are the published rates. */
export const CONCEPT_MACHINE_COSTS: CostLine[] = [
  {
    id: 'concept_text', label: 'Concept reasoning (Claude)',
    cents: 15, basis: 'operating_assumption', perOrder: true,
    source:
      'Assumption: a concept generation is tens of thousands of tokens at current Anthropic ' +
      'rates. MEASURE THIS — token counts per concept are recorded and nobody has totalled them.',
  },
  {
    id: 'renders', label: 'Photoreal renders (Flux 1.1 Pro Ultra on Replicate)',
    cents: 24, basis: 'published_rate', perOrder: true,
    source: 'Replicate lists roughly $0.06 per image; a concept package ships about four.',
  },
  {
    id: 'video', label: 'Cinematic video, when the add-on is bought',
    cents: 600, basis: 'published_rate', perOrder: false,
    source: 'Kling ~$0.10/sec; a 60-second presentation is about $6. Only on the priced add-on.',
  },
]

/**
 * Human costs — the ones that actually decide the margin.
 *
 * `null` is deliberate and is the finding: nobody has timed these. Until they
 * are measured, the margin on the reviewed products is unknown, not thin.
 */
export const HUMAN_COSTS: CostLine[] = [
  {
    id: 'pe_review', label: 'Professional engineer review',
    cents: null, basis: 'unknown', perOrder: true,
    source:
      'MEASURE: minutes per review from SitePlanReviewAssignment timestamps, times the ' +
      'engineer’s rate. This is the dominant cost of verified_site_feasibility and ' +
      'permit_site_plan and it is unmeasured.',
  },
  {
    id: 'architect_review', label: 'Architect review (permit product only)',
    cents: null, basis: 'unknown', perOrder: true,
    source: 'MEASURE: as above, from the architect discipline assignment.',
  },
  {
    id: 'drafter_revision', label: 'Drafter time per revision round',
    cents: null, basis: 'unknown', perOrder: false,
    source:
      'MEASURE: time between a redline and the revision submission on the staff desk. ' +
      'Drives whether "unlimited revisions" is affordable.',
  },
  {
    id: 'support', label: 'Customer support and exception handling',
    cents: null, basis: 'unknown', perOrder: true,
    source: 'MEASURE: support minutes per delivered order.',
  },
]

export interface UnitEconomics {
  productKey: string
  revenueCents: number
  /** Costs with an established figure. */
  knownCostCents: number
  /** Cost lines that are not established. The margin is unknown while this is non-empty. */
  unknownCosts: CostLine[]
  /** Gross margin on KNOWN costs only. Not the real margin while `unknownCosts` is non-empty. */
  marginOnKnownCents: number
  marginOnKnownPercent: number
  /**
   * Honest verdict. `unknown` whenever a dominant cost is unmeasured — which
   * is the point: reporting 96% margin while the engineer's time is unmeasured
   * would be worse than reporting nothing.
   */
  verdict: 'healthy' | 'thin' | 'negative' | 'unknown'
  note: string
}

export function computeUnitEconomics(input: {
  productKey: string
  revenueCents: number
  /** Stripe takes 2.9% + 30c on a card payment. */
  paymentProcessing?: boolean
  machineCosts: CostLine[]
  humanCosts: CostLine[]
}): UnitEconomics {
  const all = [...input.machineCosts, ...input.humanCosts]
  const known = all.filter(c => c.cents !== null && c.perOrder)
  const unknown = all.filter(c => c.cents === null && c.perOrder)

  let cost = known.reduce((s, c) => s + (c.cents ?? 0), 0)
  if (input.paymentProcessing !== false) {
    cost += Math.round(input.revenueCents * 0.029) + 30
  }

  const margin = input.revenueCents - cost
  const pct = input.revenueCents > 0 ? (margin / input.revenueCents) * 100 : 0

  const verdict: UnitEconomics['verdict'] =
    unknown.length > 0 ? 'unknown'
    : margin < 0 ? 'negative'
    : pct < 30 ? 'thin'
    : 'healthy'

  return {
    productKey: input.productKey,
    revenueCents: input.revenueCents,
    knownCostCents: cost,
    unknownCosts: unknown,
    marginOnKnownCents: margin,
    marginOnKnownPercent: Math.round(pct * 10) / 10,
    verdict,
    note: unknown.length > 0
      ? `Margin is UNKNOWN: ${unknown.length} per-order cost${unknown.length === 1 ? ' is' : 's are'} ` +
        `unmeasured (${unknown.map(u => u.label).join(', ')}). The figure above counts only what is ` +
        'established and must not be quoted as the margin.'
      : 'All per-order costs are established.',
  }
}

/** The three site-plan SKUs at their floor price, which is the worst case. */
export function sitePlanUnitEconomics(): UnitEconomics[] {
  return [
    computeUnitEconomics({
      productKey: 'preliminary_site_plan', revenueCents: 39_500,
      machineCosts: SITE_PLAN_MACHINE_COSTS,
      // No professional review on the preliminary, so no PE cost.
      humanCosts: HUMAN_COSTS.filter(c => c.id === 'support'),
    }),
    computeUnitEconomics({
      productKey: 'verified_site_feasibility', revenueCents: 89_500,
      machineCosts: SITE_PLAN_MACHINE_COSTS,
      humanCosts: HUMAN_COSTS.filter(c => ['pe_review', 'support'].includes(c.id)),
    }),
    computeUnitEconomics({
      productKey: 'permit_site_plan', revenueCents: 199_500,
      machineCosts: SITE_PLAN_MACHINE_COSTS,
      humanCosts: HUMAN_COSTS.filter(c => ['pe_review', 'architect_review', 'support'].includes(c.id)),
    }),
  ]
}

/**
 * The entry-tier plot plan the market prices at $99.
 *
 * Modelled, not sold. It answers whether Kealee could meet that price at all:
 * with no professional review and no paid AI, the only per-order costs are
 * payment processing and support.
 */
export function plotPlanFeasibilityAt(priceCents: number): UnitEconomics {
  return computeUnitEconomics({
    productKey: 'plot_plan_entry_tier', revenueCents: priceCents,
    machineCosts: SITE_PLAN_MACHINE_COSTS,
    humanCosts: HUMAN_COSTS.filter(c => c.id === 'support'),
  })
}
