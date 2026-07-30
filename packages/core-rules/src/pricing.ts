/**
 * Kealee Pricing Constants
 *
 * Single source of truth for all product prices.
 * All marketing files MUST import from here — never hardcode prices.
 */

// ── Canonical price primitives (USD cents) ──────────────────────────────────

export const CANONICAL_PRICE_CENTS = {
  concept: {
    kitchen: 19_900,
    kitchenAdvanced: 34_900,
    kitchenFull: 69_900,
    bath: 15_900,
    bathAdvanced: 29_900,
    bathFull: 59_900,
    wholeHome: 39_900,
    wholeHomeAdvanced: 49_900,
    wholeHomeFull: 99_900,
    interiorReno: 19_900,
    exterior: 27_500,
    landscape: 19_900,
    commercial: 99_900,
    developer: 59_900,
    genericStart: 7_900,
  },
  conceptTierReference: {
    basic: 8_900,
    premium: 34_900,
    premiumPlus: 69_900,
  },
  permits: {
    assessment: 59_900,
    standard: 79_900,
    managed: 149_900,
    expedited: 249_500,
  },
  estimation: {
    detailed: 34_900,
    certified: 79_900,
    estimatePermitBundle: 109_900,
  },
  siteIntelligence: {
    preliminarySitePlan: 24_900,
    verifiedSiteFeasibility: 59_900,
    permitSitePlanCoordination: 199_500,
  },
  professionalDesign: 499_000,
  aduBundle: 99_900,
  pmAdvisoryMonthly: 29_900,
  contractorMatch: 0,
  designEstimatePermitBundle: 239_900,
  platform: {
    homeownerReadiness: 29_900,
    homeownerLaunch: 55_000,
    contractorStarterMonthly: 9_900,
    contractorGrowthMonthly: 19_900,
    contractorProMonthly: 49_900,
    contractorEstimatePermit: 79_500,
    developerFeasibility: 109_500,
  },
} as const

// ── Legacy dollar exports (derived compatibility aliases) ───────────────────

export const CONCEPT_KITCHEN_PRICE        = CANONICAL_PRICE_CENTS.concept.kitchen / 100
export const CONCEPT_KITCHEN_ADVANCED     = CANONICAL_PRICE_CENTS.concept.kitchenAdvanced / 100
export const CONCEPT_KITCHEN_FULL         = CANONICAL_PRICE_CENTS.concept.kitchenFull / 100

export const CONCEPT_BATH_PRICE           = CANONICAL_PRICE_CENTS.concept.bath / 100
export const CONCEPT_BATH_ADVANCED        = CANONICAL_PRICE_CENTS.concept.bathAdvanced / 100
export const CONCEPT_BATH_FULL            = CANONICAL_PRICE_CENTS.concept.bathFull / 100

export const CONCEPT_WHOLE_HOME_PRICE     = CANONICAL_PRICE_CENTS.concept.wholeHome / 100
export const CONCEPT_WHOLE_HOME_ADVANCED  = CANONICAL_PRICE_CENTS.concept.wholeHomeAdvanced / 100
export const CONCEPT_WHOLE_HOME_FULL      = CANONICAL_PRICE_CENTS.concept.wholeHomeFull / 100

export const CONCEPT_INTERIOR_RENO_PRICE  = CANONICAL_PRICE_CENTS.concept.interiorReno / 100
export const CONCEPT_EXTERIOR_PRICE       = CANONICAL_PRICE_CENTS.concept.exterior / 100
export const CONCEPT_LANDSCAPE_PRICE      = CANONICAL_PRICE_CENTS.concept.landscape / 100
export const CONCEPT_COMMERCIAL_PRICE     = CANONICAL_PRICE_CENTS.concept.commercial / 100
export const CONCEPT_DEVELOPER_PRICE      = CANONICAL_PRICE_CENTS.concept.developer / 100

/** Generic lowest starting price shown in broad marketing */
export const CONCEPT_START_PRICE = CANONICAL_PRICE_CENTS.concept.genericStart / 100

// ── Tier label map (numeric tier → display string) ────────────────────────────

export const CONCEPT_TIER_PRICES: Record<1 | 2 | 3, number> = {
  1: CONCEPT_KITCHEN_PRICE,       // entry-tier concept
  2: CONCEPT_WHOLE_HOME_PRICE,    // mid-tier concept
  3: CONCEPT_DEVELOPER_PRICE,     // high-tier concept
}

// ── AI Concept tier marketing display prices ──────────────────────────────────
//
// Used on marketing surfaces (concept page tier blurbs, ads, banners).
// Checkout amounts are determined by INTAKE_TIER_PRICE_CENTS (per project path).
//
/** Starting price for Professional Design services (permit-ready stamped plan set). */
export const PROFESSIONAL_DESIGN_BASE = CANONICAL_PRICE_CENTS.professionalDesign / 100

// ── Permit Prices ─────────────────────────────────────────────────────────────

export const PERMIT_BASIC_PRICE = CANONICAL_PRICE_CENTS.permits.assessment / 100
export const PERMIT_STANDARD_PRICE = CANONICAL_PRICE_CENTS.permits.standard / 100
export const PERMIT_PREMIUM_PRICE = CANONICAL_PRICE_CENTS.permits.managed / 100

// ── Estimation Prices ─────────────────────────────────────────────────────────

export const ESTIMATION_PRICE = CANONICAL_PRICE_CENTS.estimation.detailed / 100
export const ESTIMATION_CERTIFIED_PRICE = CANONICAL_PRICE_CENTS.estimation.certified / 100

// ── Other Products ────────────────────────────────────────────────────────────

export const ADU_BUNDLE_PRICE = CANONICAL_PRICE_CENTS.aduBundle / 100
export const PM_ADVISORY_PRICE = CANONICAL_PRICE_CENTS.pmAdvisoryMonthly / 100
export const CONTRACTOR_MATCH_PRICE = CANONICAL_PRICE_CENTS.contractorMatch / 100
export const DESIGN_ESTIMATE_PERMIT_BUNDLE = CANONICAL_PRICE_CENTS.designEstimatePermitBundle / 100

// ── Platform role and professional-service pricing ──────────────────────────
//
// These values back public reference pages and product configuration. Checkout
// routes must continue to use INTAKE_PRICE_CENTS or a configured Stripe Price.

export const PLATFORM_PRICING = {
  homeowner: {
    readinessReviewCents: CANONICAL_PRICE_CENTS.platform.homeownerReadiness,
    projectLaunchCents: CANONICAL_PRICE_CENTS.platform.homeownerLaunch,
  },
  contractor: {
    marketplaceMonthlyCents: {
      starter: CANONICAL_PRICE_CENTS.platform.contractorStarterMonthly,
      growth: CANONICAL_PRICE_CENTS.platform.contractorGrowthMonthly,
      pro: CANONICAL_PRICE_CENTS.platform.contractorProMonthly,
    },
    estimatePermitPackageCents: CANONICAL_PRICE_CENTS.platform.contractorEstimatePermit,
  },
  developer: {
    feasibilityExpressCents: CANONICAL_PRICE_CENTS.platform.developerFeasibility,
  },
} as const

export type PublicCatalogCategoryId =
  | 'site-intelligence'
  | 'concept-planning'
  | 'estimation'
  | 'permits-professional'
  | 'construction-execution'

export interface PublicCatalogProduct {
  key: string
  categoryId: PublicCatalogCategoryId
  name: string
  shortDescription: string
  href: string
  priceCents?: number
  pricePrefix?: string
  priceLabel?: string
  priceSuffix?: string
  deliveryDays?: string
  audience: readonly ('homeowner' | 'contractor' | 'developer')[]
  preliminary?: boolean
}

/**
 * Buyer-facing catalog. Project types (kitchen, bath, ADU, pool, landscape,
 * multifamily, and so on) are intake variants, not separate top-level SKUs.
 */
export const PUBLIC_CATALOG_CATEGORIES: ReadonlyArray<{
  id: PublicCatalogCategoryId
  label: string
  description: string
}> = [
  {
    id: 'site-intelligence',
    label: 'Site Intelligence',
    description: 'Understand the property, constraints, and preliminary buildable area before design.',
  },
  {
    id: 'concept-planning',
    label: 'Concept & Planning',
    description: 'Turn a project idea into a visual concept, scope, and budget direction.',
  },
  {
    id: 'estimation',
    label: 'Estimation',
    description: 'Build a decision-ready cost plan before bids and construction.',
  },
  {
    id: 'permits-professional',
    label: 'Permits & Professional Services',
    description: 'Advance verified project data through drawings, applications, and professional review.',
  },
  {
    id: 'construction-execution',
    label: 'Construction Execution',
    description: 'Move approved preconstruction work into professional and contractor handoff.',
  },
] as const

export const PUBLIC_PRODUCT_CATALOG: readonly PublicCatalogProduct[] = [
  {
    key: 'preliminary_site_plan',
    categoryId: 'site-intelligence',
    name: 'Preliminary Site Plan',
    shortDescription: 'Parcel, setbacks, overlays, preliminary buildable area, and one proposed footprint.',
    href: '/get-started?service=preliminary_site_plan',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.preliminarySitePlan,
    deliveryDays: '2–5 days',
    audience: ['homeowner', 'contractor'],
    preliminary: true,
  },
  {
    key: 'verified_site_feasibility',
    categoryId: 'site-intelligence',
    name: 'Verified Site Feasibility Plan',
    shortDescription: 'Verified zoning inputs, constraints, buildable envelope, source record, and proposed footprint.',
    href: '/get-started?service=verified_site_feasibility',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.verifiedSiteFeasibility,
    deliveryDays: '3–7 days',
    audience: ['homeowner', 'contractor', 'developer'],
    preliminary: true,
  },
  {
    key: 'developer_feasibility',
    categoryId: 'site-intelligence',
    name: 'Developer Feasibility Express',
    shortDescription: 'Yield, parking, massing, preliminary earthwork, cost and NOI inputs, and entitlement checklist.',
    href: '/products/developer-feasibility-express',
    priceCents: CANONICAL_PRICE_CENTS.platform.developerFeasibility,
    priceSuffix: '/site',
    deliveryDays: '4–7 days',
    audience: ['developer'],
    preliminary: true,
  },
  {
    key: 'concept',
    categoryId: 'concept-planning',
    name: 'Concept Plan',
    shortDescription: 'Property-specific visualization, preliminary layout, scope, and permit-path direction.',
    href: '/concept',
    priceCents: CANONICAL_PRICE_CENTS.concept.genericStart,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor'],
    preliminary: true,
  },
  {
    key: 'project_launch',
    categoryId: 'concept-planning',
    name: 'Concept + Feasibility',
    shortDescription: 'Concept, early estimate, zoning and permit direction, and contractor handoff.',
    href: '/products/project-launch-package',
    priceCents: CANONICAL_PRICE_CENTS.platform.homeownerLaunch,
    audience: ['homeowner'],
    preliminary: true,
  },
  {
    key: 'detailed_estimate',
    categoryId: 'estimation',
    name: 'Detailed Construction Estimate',
    shortDescription: 'Trade-by-trade planning estimate with quantities, assumptions, and regional cost references.',
    href: '/estimate',
    priceCents: CANONICAL_PRICE_CENTS.estimation.detailed,
    deliveryDays: '3–5 days',
    audience: ['homeowner', 'contractor', 'developer'],
  },
  {
    key: 'certified_estimate',
    categoryId: 'estimation',
    name: 'Professionally Reviewed Estimate',
    shortDescription: 'A documented estimate prepared for higher-stakes financing, bid, or investment review.',
    href: '/intake/certified_estimate',
    priceCents: CANONICAL_PRICE_CENTS.estimation.certified,
    deliveryDays: '5–7 days',
    audience: ['homeowner', 'contractor', 'developer'],
  },
  {
    key: 'permit_assessment',
    categoryId: 'permits-professional',
    name: 'Permit Path Assessment',
    shortDescription: 'Jurisdiction requirements, application checklist, agency-fee guidance, and submission roadmap.',
    href: '/permits',
    priceCents: CANONICAL_PRICE_CENTS.permits.assessment,
    audience: ['homeowner', 'contractor', 'developer'],
    preliminary: true,
  },
  {
    key: 'permit_coordination',
    categoryId: 'permits-professional',
    name: 'Permit Application & Coordination',
    shortDescription: 'Application preparation, filing support, tracking, and coordinated comment response.',
    href: '/permits',
    priceCents: CANONICAL_PRICE_CENTS.permits.managed,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
  },
  {
    key: 'permit_site_plan',
    categoryId: 'permits-professional',
    name: 'Survey-Based Permit Site Plan',
    shortDescription: 'Survey-backed site-plan coordination and professional review for jurisdiction-specific submission.',
    href: '/get-started?service=permit_site_plan',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.permitSitePlanCoordination,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
  },
  {
    key: 'professional_design',
    categoryId: 'permits-professional',
    name: 'Professional Design / Permit-Ready Package',
    shortDescription: 'Scoped construction-document services with the required licensed professionals.',
    href: '/design-services',
    priceCents: CANONICAL_PRICE_CENTS.professionalDesign,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
  },
  {
    key: 'contractor_match',
    categoryId: 'construction-execution',
    name: 'Contractor Match',
    shortDescription: 'Match approved project scope with marketplace professionals suited to the location and work.',
    href: '/marketplace',
    priceLabel: 'Included / no fee',
    audience: ['homeowner'],
  },
  {
    key: 'construction_consultation',
    categoryId: 'construction-execution',
    name: 'Construction Consultation & Owner Support',
    shortDescription: 'Preconstruction, owner-representation, and design-build execution support scoped to the project.',
    href: '/build',
    priceLabel: 'Scoped',
    audience: ['homeowner', 'developer'],
  },
] as const

export function getPublicCatalogProduct(key: string): PublicCatalogProduct | null {
  return PUBLIC_PRODUCT_CATALOG.find(product => product.key === key) ?? null
}

export function formatCatalogPrice(product: PublicCatalogProduct): string {
  if (product.priceLabel) return product.priceLabel
  if (product.priceCents == null) return 'Scoped'
  return `${product.pricePrefix ?? ''}${formatPriceFromCents(product.priceCents).replace('.00', '')}${product.priceSuffix ?? ''}`
}

/** Compact, server-generated context for public assistants and search tools. */
export function getPublicCatalogAssistantContext(): string {
  return PUBLIC_PRODUCT_CATALOG.map(product =>
    `- ${product.name}: ${formatCatalogPrice(product)}. ${product.shortDescription} Next step: ${product.href}`
  ).join('\n')
}

/**
 * Canonical role-based purchase journey copy.
 * Marketing surfaces may add presentation (icons, color, links), but must not
 * restate product names, price labels, or scope descriptions elsewhere.
 */
export const ROLE_BUYING_PATHWAYS = {
  homeowners: [
    {
      label: 'Start',
      title: 'Project Readiness Review',
      priceCents: PLATFORM_PRICING.homeowner.readinessReviewCents,
      priceSuffix: '',
      detail: 'Property, zoning, early scope, and budget direction.',
    },
    {
      label: 'Define',
      title: 'Project Launch Package',
      priceCents: PLATFORM_PRICING.homeowner.projectLaunchCents,
      priceSuffix: '',
      detail: 'Concept, estimate, zoning, permit, and contractor handoff.',
    },
    {
      label: 'Advance',
      title: 'Design, permits & build support',
      priceLabel: 'Scoped',
      detail: 'Add only the professional services your project requires.',
    },
  ],
  contractors: [
    {
      label: 'Join',
      title: 'Marketplace membership',
      priceCents: PLATFORM_PRICING.contractor.marketplaceMonthlyCents.starter,
      pricePrefix: 'From ',
      priceSuffix: '/mo',
      detail: 'Business profile, verification, matching, and bid tools.',
    },
    {
      label: 'Deliver',
      title: 'Estimate + Permit Package',
      priceCents: PLATFORM_PRICING.contractor.estimatePermitPackageCents,
      priceSuffix: '/project',
      detail: 'A client-facing estimate, zoning, and permit roadmap.',
    },
    {
      label: 'Grow',
      title: 'Construction operations',
      priceLabel: 'By tier',
      detail: 'Pipeline, bid assistance, analytics, and team workflows.',
    },
  ],
  developers: [
    {
      label: 'Screen',
      title: 'Feasibility Express',
      priceCents: PLATFORM_PRICING.developer.feasibilityExpressCents,
      priceSuffix: '/site',
      detail: 'Early zoning, estimate, permit, and project analysis.',
    },
    {
      label: 'Validate',
      title: 'Professional feasibility',
      priceLabel: 'Scoped',
      detail: 'Yield, parking, massing, earthwork, cost, and NOI review.',
    },
    {
      label: 'Execute',
      title: 'Entitlement + GC handoff',
      priceLabel: 'Scoped',
      detail: 'Coordination with licensed professionals and construction teams.',
    },
  ],
} as const

export const SERVICE_PRICING = {
  estimation: {
    cost_estimate: {
      name: 'Detailed Cost Estimate',
      amount: CANONICAL_PRICE_CENTS.estimation.detailed,
      turnaround: 3,
      description: 'Human-reviewed, trade-by-trade breakdown validated against RSMeans',
      features: ['CSI MasterFormat line-item breakdown', 'RSMeans unit cost validation', 'Base / mid / high scenarios', 'Professional estimator review', 'Lender-ready PDF'],
    },
    certified_estimate: {
      name: 'Certified Cost Estimate',
      amount: CANONICAL_PRICE_CENTS.estimation.certified,
      turnaround: 5,
      description: 'Notarized professional estimate with source documentation',
      features: ['Everything in Detailed Estimate', 'Notarized estimator signature', 'Source citations', 'Investor-grade executive summary', 'Excel + PDF deliverable'],
    },
    bundle: {
      name: 'Estimate + Permit Bundle',
      amount: CANONICAL_PRICE_CENTS.estimation.estimatePermitBundle,
      turnaround: 5,
      description: 'Detailed cost estimate plus permit package preparation',
      features: ['Detailed Cost Estimate', 'Permit package preparation', 'Submission roadmap', 'Single project intake'],
    },
  },
  permits: {
    document_assembly: {
      name: 'Permit Path Assessment',
      amount: CANONICAL_PRICE_CENTS.permits.assessment,
      description: 'Jurisdiction-specific requirements, documents, and submission roadmap',
      features: ['Jurisdiction requirements', 'Application checklist', 'Agency fee guidance', 'Submission instructions'],
      submissionMethods: { SELF: 1 },
    },
    simple_permit: {
      name: 'Permit Package',
      amount: CANONICAL_PRICE_CENTS.permits.assessment,
      description: 'Application preparation and coordinated submission support',
      features: ['Document assembly', 'Application preparation', 'Status tracking', 'First comment-response coordination'],
      submissionMethods: { SELF: 0.8, ASSISTED: 1 },
    },
    complex_permit: {
      name: 'Complex Permit Coordination',
      amount: CANONICAL_PRICE_CENTS.permits.managed,
      description: 'Multi-permit coordination across required trades',
      features: ['Multi-trade coordination', 'Code compliance review', 'Comment-response coordination', 'Dedicated permit specialist'],
      submissionMethods: { ASSISTED: 1, KEALEE_MANAGED: 1.3 },
    },
    expedited: {
      name: 'Expedited Permit Coordination',
      amount: CANONICAL_PRICE_CENTS.permits.expedited,
      description: 'Priority coordination where the jurisdiction supports expedited processing',
      features: ['Priority handling', 'Dedicated coordinator', 'Frequent status updates', 'Inspection coordination'],
      submissionMethods: { KEALEE_MANAGED: 1 },
    },
  },
  preDesign: {
    starter: { name: 'Concept Package — Starter', amount: CANONICAL_PRICE_CENTS.conceptTierReference.basic, description: 'AI-generated concept design with basic visualization' },
    visualization: { name: 'Concept Package — Visualization', amount: CANONICAL_PRICE_CENTS.conceptTierReference.premium, description: 'Photorealistic renderings and detailed design concept' },
    preDesign: { name: 'Pre-Design Package', amount: CANONICAL_PRICE_CENTS.conceptTierReference.premiumPlus, description: 'Pre-design with zoning, buildability, and cost framework' },
  },
  contractorMatch: {
    name: 'Contractor Matching Service',
    amount: CONTRACTOR_MATCH_PRICE * 100,
    description: 'Connect with verified contractors for your project',
    features: ['Profile-based matching', 'Credential verification', 'Project-fit review'],
  },
  architectConsultation: {
    name: 'Architect Consultation',
    amount: 14_900,
    description: 'Professional project guidance and review',
    features: ['Consultation call', 'Design review', 'Feasibility discussion', 'Permit-path guidance'],
  },
} as const

// ── Intake checkout — the single, server-trusted price book ──────────────────
//
// Stripe charges in CENTS. This map is the ONLY price source consumed by:
//   • apps/web-main/app/api/intake/checkout/route.ts  (server)
//   • apps/web-main/app/intake/[projectPath]/page.tsx (client display)
//
// The server MUST look up `cents` here using the URL-safe `projectPath`. It
// MUST NOT trust an `amount` field supplied by the client (P0-1 fix).
//
// Values represent prices currently being charged in production. Some entries
// intentionally diverge from the dollar constants above (which are surfaced in
// marketing copy / ads) — reconciling the two is a separate business decision.
// Until that decision is made, *checkout* is the source of truth.
export interface IntakePriceEntry {
  /** Display label shown on the intake card and Stripe checkout line item. */
  label: string
  /** Price charged in USD cents. */
  cents: number
  /** Customer-facing delivery window. */
  deliveryDays: string
}

export const INTAKE_PRICE_CENTS: Record<string, IntakePriceEntry> = {
  // ── Concept packages ────────────────────────────────────────────────────
  exterior_concept:          { label: 'Exterior Concept Package',                 cents: CANONICAL_PRICE_CENTS.concept.exterior,  deliveryDays: '3–5 days'  },
  garden_concept:            { label: 'Garden Concept',                           cents: CANONICAL_PRICE_CENTS.concept.landscape,  deliveryDays: '2–4 days'  },
  whole_home_concept:        { label: 'Whole Home Concept',                       cents: CANONICAL_PRICE_CENTS.concept.wholeHome,  deliveryDays: '4–6 days'  },
  interior_reno_concept:     { label: 'Interior Reno Concept',                    cents: CANONICAL_PRICE_CENTS.concept.interiorReno,  deliveryDays: '3–5 days'  },
  developer_concept:         { label: 'Developer Concept',                        cents: CANONICAL_PRICE_CENTS.concept.developer,  deliveryDays: '5–7 days'  },

  // ── Remodels ────────────────────────────────────────────────────────────
  kitchen_remodel:           { label: 'Kitchen Design Package',                   cents: CANONICAL_PRICE_CENTS.concept.kitchen,  deliveryDays: '3–5 days'  },
  bathroom_remodel:          { label: 'Bathroom Design Package',                  cents: CANONICAL_PRICE_CENTS.concept.bath,  deliveryDays: '2–4 days'  },
  interior_renovation:       { label: 'Interior Renovation',                      cents: CANONICAL_PRICE_CENTS.concept.interiorReno,  deliveryDays: '3–5 days'  },
  whole_home_remodel:        { label: 'Whole-Home Remodel',                       cents: 49_900,  deliveryDays: '4–6 days'  },
  addition_expansion:        { label: 'Addition / Expansion',                     cents: 34_900,  deliveryDays: '3–5 days'  },

  // ── Permits + estimation ────────────────────────────────────────────────
  permit_path_only:          { label: 'Permit Package',                           cents: CANONICAL_PRICE_CENTS.permits.assessment,  deliveryDays: '3–5 days'  },
  preliminary_site_plan:     { label: 'Preliminary Site Plan',                    cents: CANONICAL_PRICE_CENTS.siteIntelligence.preliminarySitePlan, deliveryDays: '2–5 days' },
  verified_site_feasibility: { label: 'Verified Site Feasibility Plan',           cents: CANONICAL_PRICE_CENTS.siteIntelligence.verifiedSiteFeasibility, deliveryDays: '3–7 days' },
  permit_site_plan:          { label: 'Survey-Based Permit Site Plan Coordination', cents: CANONICAL_PRICE_CENTS.siteIntelligence.permitSitePlanCoordination, deliveryDays: 'Scoped after survey review' },
  cost_estimate:             { label: 'Detailed Cost Estimate — RSMeans validated', cents: CANONICAL_PRICE_CENTS.estimation.detailed, deliveryDays: '3–5 days'  },
  certified_estimate:        { label: 'Certified Estimate — Notarized for lenders', cents: CANONICAL_PRICE_CENTS.estimation.certified, deliveryDays: '5–7 days' },
  professional_drawings:     { label: 'Permit-Ready Design Plans — priced after scope review', cents: CANONICAL_PRICE_CENTS.professionalDesign, deliveryDays: '7–14 days' },
  design_estimate_permit_bundle: {
    label: 'Design + Estimate + Permit Bundle',
    cents: CANONICAL_PRICE_CENTS.designEstimatePermitBundle,
    deliveryDays: '7–14 days',
  },
  /** Estimate + permit only (no stamped plans) — upsell bundle for interior/kitchen paths. */
  estimate_permit_bundle: {
    label: 'Estimate + Permit Package',
    cents: CANONICAL_PRICE_CENTS.estimation.estimatePermitBundle,
    deliveryDays: '5–8 days',
  },

  // ── Bundles + matchmaking ───────────────────────────────────────────────
  contractor_match:          { label: 'Contractor Match',                         cents: CANONICAL_PRICE_CENTS.contractorMatch, deliveryDays: '1 day' },
  design_build:              { label: 'Design + Execution Planning Package',       cents: 189_900, deliveryDays: '5–7 days'  },
  capture_site_concept:      { label: 'Site Capture + Concept',                   cents: 12_500,  deliveryDays: '1–2 days'  },

  // ── Commercial / multi-family / development ─────────────────────────────
  multi_unit_residential:    { label: 'Multi-Unit Residential',                   cents: 74_900,  deliveryDays: '5–7 days'  },
  mixed_use:                 { label: 'Mixed-Use Concept',                        cents: 99_900,  deliveryDays: '6–8 days'  },
  commercial_office:         { label: 'Commercial Office',                        cents: 89_900,  deliveryDays: '5–7 days'  },
  development_feasibility:   { label: 'Feasibility Study',                        cents: 119_900, deliveryDays: '5–7 days'  },
  townhome_subdivision:      { label: 'Townhome Subdivision',                     cents: 129_900, deliveryDays: '7–10 days' },
  single_family_subdivision: { label: 'Single-Family Subdivision',                cents: 109_900, deliveryDays: '6–8 days'  },
  single_lot_development:    { label: 'Single-Lot Development',                   cents: 69_900,  deliveryDays: '4–6 days'  },
}

/** Site-visit add-on (additive line item on Stripe checkout). */
export const SITE_VISIT_FEE_CENTS = 12_500

/** Server-trusted lookup. Returns null if `projectPath` is unknown. */
export function getIntakePrice(projectPath: string): IntakePriceEntry | null {
  return INTAKE_PRICE_CENTS[projectPath] ?? null
}

// ── Tier-specific prices ───────────────────────────────────────────────────────
//
// These prices match the `tiers` array in apps/web-main/lib/services-config.ts.
// Used when `form_data.tier` (1 | 2 | 3) is present on the intake record so
// the checkout route charges the correct tier price instead of the flat fallback.
//
// Mapping: projectPath → tier number → IntakePriceEntry (cents = price * 100)

export const INTAKE_TIER_PRICE_CENTS: Record<string, Partial<Record<1 | 2 | 3, IntakePriceEntry>>> = {
  kitchen_remodel: {
    1: { label: 'Kitchen Design Package — Basic', cents: CANONICAL_PRICE_CENTS.conceptTierReference.basic, deliveryDays: '3–5 days' },
    2: { label: 'Kitchen Design Package — Premium', cents: CANONICAL_PRICE_CENTS.conceptTierReference.premium, deliveryDays: '3–5 days' },
    3: { label: 'Kitchen Design Package — Premium+', cents: CANONICAL_PRICE_CENTS.conceptTierReference.premiumPlus, deliveryDays: '3–5 days' },
  },
  bathroom_remodel: {
    1: { label: 'Bathroom Design Package — Basic',    cents: 7_900,  deliveryDays: '2–4 days' },
    2: { label: 'Bathroom Design Package — Premium',  cents: 29_900, deliveryDays: '2–4 days' },
    3: { label: 'Bathroom Design Package — Premium+', cents: 59_900, deliveryDays: '2–4 days' },
  },
  garden_concept: {
    1: { label: 'Garden Concept — Basic',    cents: 9_900,  deliveryDays: '2–4 days' },
    2: { label: 'Garden Concept — Premium',  cents: 24_900, deliveryDays: '2–4 days' },
    3: { label: 'Garden Concept — Premium+', cents: 49_900, deliveryDays: '2–4 days' },
  },
  addition_expansion: {
    1: { label: 'Home Addition — Basic',    cents: 14_900,  deliveryDays: '3–5 days' },
    2: { label: 'Home Addition — Premium',  cents: 49_900,  deliveryDays: '3–5 days' },
    3: { label: 'Home Addition — Premium+', cents: 99_900,  deliveryDays: '3–5 days' },
  },
  whole_home_concept: {
    1: { label: 'Whole Home Concept — Basic',    cents: 14_900,  deliveryDays: '4–6 days' },
    2: { label: 'Whole Home Concept — Premium',  cents: 49_900,  deliveryDays: '4–6 days' },
    3: { label: 'Whole Home Concept — Premium+', cents: 99_900,  deliveryDays: '4–6 days' },
  },
  interior_renovation: {
    1: { label: 'Interior Renovation — Basic',    cents: 9_900,   deliveryDays: '3–5 days' },
    2: { label: 'Interior Renovation — Premium',  cents: 34_900,  deliveryDays: '3–5 days' },
    3: { label: 'Interior Renovation — Premium+', cents: 69_900,  deliveryDays: '3–5 days' },
  },
  exterior_concept: {
    1: { label: 'Exterior Concept — Basic',    cents: 9_900,   deliveryDays: '3–5 days' },
    2: { label: 'Exterior Concept — Premium',  cents: 39_900,  deliveryDays: '3–5 days' },
    3: { label: 'Exterior Concept — Premium+', cents: 79_900,  deliveryDays: '3–5 days' },
  },
  interior_reno_concept: {
    1: { label: 'Interior Reno Concept — Basic', cents: 9_900, deliveryDays: '3–5 days' },
  },
}

/** Compatibility aliases derived from the canonical kitchen checkout tiers.
 * Project-specific UIs must use INTAKE_TIER_PRICE_CENTS directly. */
export const AI_CONCEPT_BASIC = INTAKE_TIER_PRICE_CENTS.kitchen_remodel![1]!.cents / 100
export const AI_CONCEPT_PREMIUM = INTAKE_TIER_PRICE_CENTS.kitchen_remodel![2]!.cents / 100
export const AI_CONCEPT_PREMIUM_PLUS = INTAKE_TIER_PRICE_CENTS.kitchen_remodel![3]!.cents / 100

/**
 * Tier-aware price lookup. Uses tier-specific price from INTAKE_TIER_PRICE_CENTS
 * when available; falls back to getIntakePrice (flat price) for unknown combos.
 */
export function getIntakePriceByTier(projectPath: string, tier: number): IntakePriceEntry | null {
  if (tier === 1 || tier === 2 || tier === 3) {
    const entry = INTAKE_TIER_PRICE_CENTS[projectPath]?.[tier]
    if (entry) return entry
  }
  return getIntakePrice(projectPath)
}

// ── AI model registry — single source of truth for model strings ─────────────
//
// Pin model identifiers in ONE place. Audited 2026-05-09 against:
//   • https://docs.anthropic.com/en/docs/about-claude/models
//   • https://developers.openai.com/api/docs/models/sora-2
//   • https://developers.googleblog.com/en/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/
//   • Replicate model pages
//
// Routes MUST import these constants instead of inlining strings.

export const AI_MODELS = {
  // ── Text / reasoning (Anthropic Claude) ────────────────────────────────
  /** Concept JSON, design briefs, agent reasoning — default tier. */
  conceptText:        'claude-sonnet-4-5',
  /** Heavier reasoning for developer / commercial / multi-unit tiers. */
  conceptTextPremium: 'claude-opus-4-1',
  /** Vision: photo / floor-plan → editable geometry. */
  vision:             'claude-sonnet-4-5',

  // ── Image generation ───────────────────────────────────────────────────
  /** Photorealistic single-image render (Replicate slug). 4MP, ~$0.06/image. */
  imageRender:        'black-forest-labs/flux-1.1-pro-ultra',
  /** Photorealistic with input-image guidance (img2img). */
  imageRenderImg2Img: 'black-forest-labs/flux-1.1-pro',
  /** Floor-plan / labelled drawings — best text accuracy. */
  imageDrawing:       'recraft-ai/recraft-v3',
  /** Legacy fallback (only kept for backward-compat with old DB rows). */
  imageRenderLegacy:  'stability-ai/sdxl:39ed52f2319f9bfb5cc8a19eccf9d8e90261c2a7c5e31e1dab895d29fba1aa4',

  // ── Video generation ───────────────────────────────────────────────────
  /** Highest quality short-form video (8s, 1080p, native audio). $0.30/sec. */
  videoSora2Pro:      'sora-2-pro',
  /** Cheaper / faster Sora variant. $0.10/sec. */
  videoSora2:         'sora-2',
  /** Google Veo 3.1 — equal-quality, native synced audio, up to 4K. */
  videoVeo:           'veo-3.1',
  /** Replicate-hosted Kling — production-ready, ~$0.10/sec. */
  videoKling:         'kwaivgi/kling-v2.5-turbo-pro',
} as const

export type AiModelKey = keyof typeof AI_MODELS

// Provider-resolution config. The video pipeline picks the first provider
// whose api-key is present, unless overridden by `VIDEO_PROVIDER` env.
export type VideoProvider = 'sora-2-pro' | 'sora-2' | 'veo-3.1' | 'kling-2.5'
export type ImageProvider = 'flux-1.1-pro-ultra' | 'flux-1.1-pro' | 'recraft-v3' | 'sdxl'

/** Tier → recommended video provider. Premium+ get the best-in-class model;
 *  Premium gets a balanced quality/cost choice; Essential never gets video. */
export const TIER_VIDEO_DEFAULTS: Record<1 | 2 | 3, VideoProvider | null> = {
  1: null,                  // Essential — no video deliverable
  2: 'kling-2.5',           // Premium — production-ready, low cost
  3: 'sora-2-pro',          // Premium+ — cinematic real-life quality
}

/** Tier → number of high-realism still renders included in the deliverable. */
export const TIER_IMAGE_COUNT: Record<1 | 2 | 3, number> = {
  1: 3,
  2: 6,
  3: 12,
}

// ── String formatters ─────────────────────────────────────────────────────────

/** Format a dollar amount as "$X,XXX" */
export function formatPrice(cents: number): string {
  return `$${cents.toLocaleString('en-US')}`
}

/** Format a "starting at" string */
export function startingAt(price: number): string {
  return `Starting at ${formatPrice(price)}`
}

/** Format a CENTS value as "$X.XX". Use for intake/checkout display. */
export function formatPriceFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
