/**
 * The four core preconstruction products, as presented on the public site.
 *
 * Each entry is a thin, buyer-facing wrapper over the canonical catalog in
 * `@kealee/core-rules` — prices, includes, inputs, and limitations come from
 * there so marketing can never drift from what is actually sold. The extra
 * fields here are the presentation facts the product card must show:
 * who it is for, what it costs to start, how long it takes, and the
 * preliminary-versus-professional-review line.
 */

import {
  formatCatalogPrice,
  getPublicCatalogProduct,
  type PublicCatalogProduct,
} from '@kealee/core-rules'

export type SuiteProductId = 'design-concept' | 'estimation' | 'site-plan' | 'permitting'

export interface SuiteProduct {
  id: SuiteProductId
  /** Name used across the site. */
  name: string
  /** Canonical catalog key backing this product. */
  catalogKey: string
  tagline: string
  /** Plain-language "who is this for". */
  audience: string
  /** Starting price string, or 'Request pricing'. */
  priceLabel: string
  deliveryRange: string
  /** What the customer must supply. */
  requiredInputs: readonly string[]
  /** What Kealee hands back. */
  deliverables: readonly string[]
  /** The preliminary-vs-professional-review statement. Always shown. */
  disclaimer: string
  ctaLabel: string
  /** Direct purchase/intake destination. */
  startHref: string
  /** Public detail page. */
  detailHref: string
  accent: string
  /** Additional tiers within this product family, for the detail page. */
  relatedCatalogKeys: readonly string[]
}

interface SuiteSeed {
  id: SuiteProductId
  name: string
  catalogKey: string
  tagline: string
  audience: string
  disclaimer: string
  ctaLabel: string
  accent: string
  relatedCatalogKeys: readonly string[]
  /** Fallbacks used only when the catalog entry is missing a field. */
  fallbackDelivery: string
  fallbackPrice: string
}

const SEEDS: readonly SuiteSeed[] = [
  {
    id: 'design-concept',
    name: 'Design Concept',
    catalogKey: 'concept',
    tagline:
      'Turn a project idea into a property-specific concept, layout direction, and scope you can act on.',
    audience:
      'Homeowners and contractors who know roughly what they want but need it made concrete before spending on drawings.',
    disclaimer:
      'Concepts are preliminary design direction. They are not construction documents and do not replace licensed architectural or engineering services.',
    ctaLabel: 'Start a Design Concept',
    accent: '#2ABFBF',
    relatedCatalogKeys: ['project_launch', 'professional_design'],
    fallbackDelivery: '2–5 business days',
    fallbackPrice: 'Request pricing',
  },
  {
    id: 'estimation',
    name: 'Estimation',
    catalogKey: 'detailed_estimate',
    tagline:
      'A documented, trade-by-trade cost plan with the assumptions, exclusions, and confidence level written down.',
    audience:
      'Owners validating a budget, contractors pricing work, and anyone who needs a cost plan a lender or partner will read.',
    disclaimer:
      'An estimate is a priced opinion based on the stated scope and assumptions. It is not a bid, a contract price, or a guarantee of construction cost. Professional review is included only on the reviewed tier.',
    ctaLabel: 'Get an Estimate',
    accent: '#E8793A',
    relatedCatalogKeys: ['certified_estimate'],
    fallbackDelivery: '3–5 business days',
    fallbackPrice: 'Request pricing',
  },
  {
    id: 'site-plan',
    name: 'Site Plan',
    catalogKey: 'preliminary_site_plan',
    tagline:
      'Understand the parcel — constraints, buildable area, and what fits — before design or permits.',
    audience:
      'Anyone adding to, subdividing, or building on a property, and developers screening a site before deeper spend.',
    disclaimer:
      'Preliminary and not for construction unless professionally reviewed. Not a boundary survey. Source coverage and accuracy vary by jurisdiction, and every finding is labelled with its source and confidence.',
    ctaLabel: 'Start a Site Plan',
    accent: '#0F766E',
    relatedCatalogKeys: ['verified_site_feasibility', 'permit_site_plan', 'developer_feasibility'],
    fallbackDelivery: 'First-hour summary; full plan in 2–5 days',
    fallbackPrice: 'Request pricing',
  },
  {
    id: 'permitting',
    name: 'Permitting',
    catalogKey: 'permit_assessment',
    tagline:
      'Identify the jurisdiction, the permits your scope needs, and every document required to file.',
    audience:
      'Owners and contractors who need to know exactly what an agency will ask for — anywhere in the US.',
    disclaimer:
      'Kealee prepares permit packages, coordinates with agencies, and assists with filing. Kealee does not issue permits. Approval, fees, and timelines are set by the jurisdiction and cannot be guaranteed.',
    ctaLabel: 'Start Permitting',
    accent: '#805AD5',
    relatedCatalogKeys: ['permit_coordination', 'permit_site_plan', 'professional_design'],
    fallbackDelivery: '3–5 business days',
    fallbackPrice: 'Request pricing',
  },
]

function toSuiteProduct(seed: SuiteSeed): SuiteProduct {
  // This list drives the homepage. A catalog lookup that throws — a stale
  // package build, a renamed key — must degrade to the seed's own copy rather
  // than take the whole page down.
  let catalog: PublicCatalogProduct | null = null
  try {
    catalog = getPublicCatalogProduct(seed.catalogKey)
  } catch (error) {
    console.error(
      `[preconstruction-suite] catalog lookup failed for "${seed.catalogKey}":`,
      error instanceof Error ? error.message : error,
    )
  }

  return {
    id: seed.id,
    name: seed.name,
    catalogKey: seed.catalogKey,
    tagline: seed.tagline,
    audience: seed.audience,
    priceLabel: catalog ? formatCatalogPrice(catalog) : seed.fallbackPrice,
    deliveryRange: catalog?.deliveryDays ?? seed.fallbackDelivery,
    requiredInputs: catalog?.customerProvides ?? [],
    deliverables: catalog?.includes ?? [],
    disclaimer: seed.disclaimer,
    ctaLabel: seed.ctaLabel,
    startHref: catalog?.startHref ?? '/request-service',
    detailHref: catalog?.href ?? '/products',
    accent: seed.accent,
    relatedCatalogKeys: seed.relatedCatalogKeys,
  }
}

export const PRECONSTRUCTION_SUITE: readonly SuiteProduct[] = SEEDS.map(toSuiteProduct)

export function getSuiteProduct(id: SuiteProductId): SuiteProduct | undefined {
  return PRECONSTRUCTION_SUITE.find(product => product.id === id)
}

/** The nationwide availability statement, used verbatim across the site. */
export const NATIONWIDE_STATEMENT =
  'Kealee serves all 50 states and the District of Columbia. We identify your state, county, and city from the property address, then use automated jurisdiction data where it exists and manual research and professional review where it does not. Availability is nationwide; the level of automation varies by location, and every deliverable tells you which applies to yours.'
