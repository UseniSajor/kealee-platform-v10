/**
 * Kealee legacy pricing surface.
 *
 * THE SOURCE OF TRUTH IS `./quote` — `PRODUCT_PRICING` and `computeQuote`.
 * Everything in this file is derived from it. Do not add a number here: add
 * the product to the quoting engine and derive it, or the platform grows
 * another price list that disagrees with what the customer is charged.
 */

import { priceRangeFor, bundleFromCents, getProductPricing, PRODUCT_PRICING } from './quote'

// ── Canonical price primitives (USD cents) ──────────────────────────────────

/**
 * Legacy price primitives — DERIVED from the quoting engine.
 *
 * These constants used to be the source of truth and drifted from checkout,
 * from the marketing copy and from the portal. Every value is now the floor
 * ("from") price the engine computes for that product, so a legacy consumer
 * and a live quote can never disagree. New code should call `computeQuote`
 * or `priceRangeFor` directly — this table exists for the pages that have not
 * been migrated yet.
 */
const floorCents = (productKey: string, fallback = 0): number =>
  priceRangeFor(productKey)?.lowCents ?? fallback

export const CANONICAL_PRICE_CENTS = {
  concept: {
    kitchen: floorCents('kitchen_remodel'),
    bath: floorCents('bathroom_remodel'),
    wholeHome: floorCents('whole_home_concept'),
    interiorReno: floorCents('interior_renovation'),
    exterior: floorCents('exterior_concept'),
    landscape: floorCents('garden_concept'),
    addition: floorCents('addition_expansion'),
    commercial: floorCents('developer_concept'),
    developer: floorCents('developer_concept'),
    genericStart: Math.min(
      floorCents('bathroom_remodel'),
      floorCents('kitchen_remodel'),
      floorCents('interior_renovation'),
    ),
  },
  permits: {
    assessment: floorCents('permit_path_only'),
    standard: floorCents('permit_filing'),
    managed: floorCents('permit_managed'),
  },
  estimation: {
    detailed: floorCents('cost_estimate'),
    certified: floorCents('certified_estimate'),
    estimatePermitBundle: bundleFromCents(['cost_estimate', 'permit_filing']) ?? 0,
  },
  siteIntelligence: {
    preliminarySitePlan: floorCents('preliminary_site_plan'),
    verifiedSiteFeasibility: floorCents('verified_site_feasibility'),
    permitSitePlanCoordination: floorCents('permit_site_plan'),
  },
  professionalDesign: floorCents('professional_drawings'),
  aduBundle: floorCents('addition_expansion'),
  pmAdvisoryMonthly: floorCents('pm_advisory'),
  contractorMatch: 0,
  designEstimatePermitBundle:
    bundleFromCents(['addition_expansion', 'cost_estimate', 'permit_filing']) ?? 0,
  platform: {
    homeownerReadiness: 0,
    homeownerLaunch: floorCents('managed_bid'),
    contractorStarterMonthly: 9_900,
    contractorGrowthMonthly: 19_900,
    contractorProMonthly: 49_900,
    contractorEstimatePermit: bundleFromCents(['cost_estimate', 'permit_filing']) ?? 0,
    developerFeasibility: floorCents('verified_site_feasibility'),
  },
} as const

/**
 * Customer-facing upgrade credit applied consistently across paid packages.
 * The credit is commercial consideration on a later Kealee agreement—not a
 * cash refund, transferable balance, or promise that construction is included.
 */
export const PURCHASE_CREDIT_POLICY = {
  label: 'Your package purchase is credited toward the next phase',
  shortCopy: '100% of this package fee can be applied once toward eligible Kealee professional design or managed-build services for the same project.',
  terms: 'Credit requires a later written Kealee scope for the same project, cannot exceed that later service fee, has no cash value, is non-transferable, and cannot be combined with another purchase credit unless the written scope says otherwise.',
} as const

// ── Legacy dollar exports (derived compatibility aliases) ───────────────────

export const CONCEPT_KITCHEN_PRICE        = CANONICAL_PRICE_CENTS.concept.kitchen / 100

export const CONCEPT_BATH_PRICE           = CANONICAL_PRICE_CENTS.concept.bath / 100

export const CONCEPT_WHOLE_HOME_PRICE     = CANONICAL_PRICE_CENTS.concept.wholeHome / 100

export const CONCEPT_INTERIOR_RENO_PRICE  = CANONICAL_PRICE_CENTS.concept.interiorReno / 100
export const CONCEPT_EXTERIOR_PRICE       = CANONICAL_PRICE_CENTS.concept.exterior / 100
export const CONCEPT_LANDSCAPE_PRICE      = CANONICAL_PRICE_CENTS.concept.landscape / 100
export const CONCEPT_COMMERCIAL_PRICE     = CANONICAL_PRICE_CENTS.concept.commercial / 100
export const CONCEPT_DEVELOPER_PRICE      = CANONICAL_PRICE_CENTS.concept.developer / 100

/** Generic lowest starting price shown in broad marketing */
export const CONCEPT_START_PRICE = CANONICAL_PRICE_CENTS.concept.genericStart / 100

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
    readinessReviewCents: 0,
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
  | 'permits-professional'
  | 'construction-execution'

export type IncludedEstimateLevel = 'basic_planning' | 'detailed_construction'

export interface PublicCatalogProduct {
  key: string
  categoryId: PublicCatalogCategoryId
  name: string
  shortDescription: string
  href: string
  /** Direct purchase/intake destination. `href` is always the public detail page. */
  startHref: string
  priceCents?: number
  pricePrefix?: string
  priceLabel?: string
  priceSuffix?: string
  deliveryDays?: string
  audience: readonly ('homeowner' | 'contractor' | 'developer')[]
  preliminary?: boolean
  /** Estimating is bundled into the plan package and is never a separate public SKU. */
  includedEstimate?: {
    level: IncludedEstimateLevel
    label: string
    description: string
  }
  outcome: string
  includes: readonly string[]
  customerProvides: readonly string[]
  sampleAsset: string
  sampleAlt: string
  limitations: readonly string[]
  nextStep: string
  /** Outputs that can be published automatically as soon as intake is accepted. */
  immediateDeliverables?: readonly string[]
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
    name: 'Preliminary Design Concept + Site Plan',
    shortDescription: 'An easy-to-read site-layout concept plus a separate preliminary technical plan and verification checklist.',
    href: '/products/preliminary_site_plan',
    startHref: '/intake/preliminary_site_plan',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.preliminarySitePlan,
    deliveryDays: 'First-hour summary; full site plan in 2–5 days',
    audience: ['homeowner', 'contractor'],
    preliminary: true,
    includedEstimate: {
      level: 'basic_planning',
      label: 'Basic planning estimate included',
      description: 'Planning-level construction cost range with major scope assumptions, allowances, and exclusions.',
    },
    outcome: 'A clearly organized preliminary package that shows what may fit, why it may fit, and what must be verified before detailed design.',
    includes: ['Project brief, design basis, source register, and assumptions', 'Available existing conditions with parcel, access, terrain, easement, utility, flood, soil, tree, and environmental context', 'Preliminary zoning, setbacks or BRLs, overlays, coverage, and buildable-area analysis', 'Concept layout with proposed buildings or lots, access, parking, circulation, open space, dimensions, and area schedule as applicable', 'Preliminary grading, drainage, utility, stormwater, erosion-control, and roadway strategy', 'Basic planning estimate with major scope assumptions, allowances, and exclusions', 'Separate scaled technical drawing with north arrow, graphic scale, legend, source notes, and preliminary status', 'Purchaser guide with confidence, conflicts, alternatives, verification owners, and next steps'],
    customerProvides: ['Property address', 'Project goal and approximate footprint', 'Survey or site documents when available'],
    sampleAsset: '/media/product-samples/site-intelligence.svg',
    sampleAlt: 'Representative preliminary package with an easy-to-read design concept plan followed by a sourced preliminary site plan',
    limitations: ['Not a boundary survey', 'Source coverage and accuracy vary by jurisdiction', 'No permit or construction use without required professional review'],
    nextStep: 'Upgrade to verified feasibility or survey-based permit-site-plan coordination when the project advances.',
    immediateDeliverables: [
      'Project summary and stated site goal',
      'Parcel/jurisdiction lookup and source-status record',
      'Preliminary zoning, overlay, setback, and permit-path requirements',
      'Existing-conditions and proposed-layout source coverage',
      'Civil strategy for access, grading, drainage, utilities, stormwater, and environmental constraints',
      'Known conflicts, assumptions, confidence, limitations, and verification owners',
      'Portal checklist showing completed, pending, and source-needed items',
    ],
  },
  {
    key: 'verified_site_feasibility',
    categoryId: 'site-intelligence',
    name: 'Verified Site Feasibility Plan',
    shortDescription: 'Verified zoning inputs, constraints, buildable envelope, source record, and proposed footprint.',
    href: '/products/verified_site_feasibility',
    startHref: '/intake/verified_site_feasibility',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.verifiedSiteFeasibility,
    deliveryDays: 'First-hour source summary; verified feasibility plan in 3–7 days',
    audience: ['homeowner', 'contractor', 'developer'],
    preliminary: true,
    includedEstimate: {
      level: 'basic_planning',
      label: 'Basic planning estimate included',
      description: 'Planning-level construction cost range with major scope assumptions, allowances, and exclusions.',
    },
    outcome: 'A reviewed feasibility record connecting verified zoning inputs, constraints, and a proposed footprint.',
    includes: ['Verified zoning and overlay source record', 'Constraint and buildable-envelope review', 'Proposed footprint validation', 'Assumptions, exceptions, and confidence register', 'Professional-review checklist'],
    customerProvides: ['Property address and intended use', 'Known survey, title, or site documents', 'Target program or footprint requirements'],
    sampleAsset: '/media/product-samples/site-intelligence.svg',
    sampleAlt: 'Representative verified-feasibility deliverable with parcel geometry, constraints, metrics, and provenance',
    limitations: ['Verification is limited to sources listed in the report', 'No professional seal is implied', 'Final jurisdiction acceptance depends on its current rules and review'],
    nextStep: 'Advance the selected footprint into concept, professional drawings, or permit coordination.',
    immediateDeliverables: [
      'Project summary and intended-use record',
      'Available zoning, overlay, setback, and permit-path source summary',
      'Constraint and source-coverage checklist',
      'Assumptions, exceptions, confidence, and verification-needed register',
      'Portal status showing what is ready for review and what requires validation',
    ],
  },
  {
    key: 'developer_feasibility',
    categoryId: 'site-intelligence',
    name: 'Developer Feasibility Express',
    shortDescription: 'Yield, parking, massing, preliminary earthwork, cost and NOI inputs, and entitlement checklist.',
    href: '/products/developer_feasibility',
    startHref: '/request-service?service=developer_feasibility&name=Developer%20Feasibility%20Express',
    priceCents: CANONICAL_PRICE_CENTS.platform.developerFeasibility,
    priceSuffix: '/site',
    deliveryDays: '4–7 days',
    audience: ['developer'],
    preliminary: true,
    includedEstimate: {
      level: 'basic_planning',
      label: 'Basic planning estimate included',
      description: 'Planning-level construction cost range with major scope assumptions, allowances, and exclusions.',
    },
    outcome: 'A comparable set of early development options with yield, parking, massing, cost, NOI, and entitlement assumptions.',
    includes: ['Parcel and constraint basis', 'Multifamily yield and unit-mix options', 'Parking and massing metrics', 'Preliminary earthwork and cost/NOI inputs', 'Entitlement checklist and option comparison'],
    customerProvides: ['Site address or parcel identifiers', 'Target use, unit mix, and parking assumptions', 'Available survey, topo, and financial assumptions'],
    sampleAsset: '/media/product-samples/developer-feasibility.svg',
    sampleAlt: 'Representative developer feasibility comparison with yield, parking, massing, cost, and NOI metrics',
    limitations: ['Preliminary underwriting inputs are not an appraisal or investment advice', 'Earthwork requires survey/topographic validation', 'Entitlements and engineering require licensed review'],
    nextStep: 'Select an option for verified feasibility, entitlement planning, and professional design.',
  },
  {
    key: 'concept',
    categoryId: 'concept-planning',
    name: 'Concept Plan',
    shortDescription: 'Property-specific visualization, preliminary layout, scope, and permit-path direction.',
    href: '/products/concept',
    startHref: '/concept',
    priceCents: CANONICAL_PRICE_CENTS.concept.genericStart,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor'],
    preliminary: true,
    includedEstimate: {
      level: 'basic_planning',
      label: 'Basic planning estimate included',
      description: 'Planning-level construction cost range with major scope assumptions, allowances, and exclusions.',
    },
    outcome: 'A visual, property-specific direction that makes scope, layout, budget, and permit questions easier to decide.',
    includes: ['Project-specific concept visualization', 'Preliminary layout or plan direction', 'Scope and material direction', 'Basic planning estimate with major assumptions, allowances, and exclusions', 'Permit-path and professional-review flags'],
    customerProvides: ['Project type and goals', 'Service-specific photos or video', 'Measurements, plans, or address when available'],
    sampleAsset: '/media/product-samples/concept-plan.svg',
    sampleAlt: 'Representative Kealee concept-plan deliverable with existing conditions, proposed direction, scope, and cost band',
    limitations: ['Concept geometry and visuals are preliminary', 'Not permit-ready or for construction', 'Existing conditions must be field verified'],
    nextStep: 'Advance the approved concept into verified feasibility or professional design as the project requires.',
  },
  {
    key: 'project_launch',
    categoryId: 'concept-planning',
    name: 'Concept + Feasibility',
    shortDescription: 'Concept, early estimate, zoning and permit direction, and contractor handoff.',
    href: '/products/project_launch',
    startHref: '/request-service?service=project_launch&name=Concept%20%2B%20Feasibility',
    priceCents: CANONICAL_PRICE_CENTS.platform.homeownerLaunch,
    audience: ['homeowner'],
    preliminary: true,
    includedEstimate: {
      level: 'basic_planning',
      label: 'Basic planning estimate included',
      description: 'Planning-level construction cost range with major scope assumptions, allowances, and exclusions.',
    },
    outcome: 'A combined decision package for owners who need concept direction and early feasibility before engaging execution professionals.',
    includes: ['Concept visualization and preliminary layout', 'Early estimate and assumptions', 'Zoning and permit-path direction', 'Scope brief for professional handoff', 'Contractor-ready project summary'],
    customerProvides: ['Address and project objective', 'Photos, video, or existing plans', 'Budget range and desired schedule'],
    sampleAsset: '/media/product-samples/concept-plan.svg',
    sampleAlt: 'Representative concept and feasibility package with visualization, plan direction, scope, and budget',
    limitations: ['Not a construction-document package', 'Professional services and filing are separate unless expressly included', 'Budget remains a planning range'],
    nextStep: 'Move the approved direction into professional drawings, permits, and Marketplace handoff.',
  },
  {
    key: 'permit_assessment',
    categoryId: 'permits-professional',
    name: 'Permit Path Assessment',
    shortDescription: 'Jurisdiction requirements, application checklist, agency-fee guidance, and submission roadmap.',
    href: '/products/permit_assessment',
    startHref: '/intake/permit_path_only?product=permit_assessment',
    priceCents: CANONICAL_PRICE_CENTS.permits.assessment,
    audience: ['homeowner', 'contractor', 'developer'],
    preliminary: true,
    outcome: 'A jurisdiction-specific roadmap identifying likely approvals, application materials, fees, and next actions.',
    includes: ['Confirm the correct permitting authority and permit type', 'Identify every application form, plan, and supporting document required to file', 'Verify agency fees, submission portal, and applicant authorization steps', 'Sequence zoning, building, trade, and prerequisite approvals', 'Deliver a filing-ready action plan that closes missing-document gaps'],
    customerProvides: ['Project address and complete scope', 'Existing plans or sketches', 'Known violations, approvals, or agency correspondence'],
    sampleAsset: '/media/product-samples/permit-roadmap.svg',
    sampleAlt: 'Representative permit-path roadmap with required documents, agencies, dependencies, and verification status',
    limitations: ['Requirements and agency timelines can change', 'Assessment does not include filing or drawings', 'Jurisdiction confirmation controls'],
    nextStep: 'Purchase coordination once the required plans and supporting documents are ready.',
  },
  {
    key: 'permit_coordination',
    categoryId: 'permits-professional',
    name: 'Permit Application & Coordination',
    shortDescription: 'Application preparation, filing support, tracking, and coordinated comment response.',
    href: '/products/permit_coordination',
    startHref: '/request-service?service=permit_coordination&name=Permit%20Application%20%26%20Coordination',
    priceCents: CANONICAL_PRICE_CENTS.permits.managed,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
    outcome: 'An organized application, submission, tracking, and comment-response workflow for a defined permit scope.',
    includes: ['Complete the jurisdiction application forms for the approved project scope', 'Assemble plans and supporting documents into the agency-required submission order', 'File the permit package through the correct agency portal', 'Track reviewer assignments, fees, status changes, and agency correspondence', 'Coordinate correction responses and resubmit until the application reaches an agency decision'],
    customerProvides: ['Permit-ready plans when required', 'Property and applicant information', 'Authorizations and jurisdiction fees'],
    sampleAsset: '/media/product-samples/permit-roadmap.svg',
    sampleAlt: 'Representative permit coordination tracker with application documents, status, and agency responses',
    limitations: ['Agency fees and third-party professional services are separate', 'Kealee cannot guarantee jurisdiction approval or timing', 'Scope changes may require repricing'],
    nextStep: 'Track approval, complete required responses, and hand the approved scope to execution professionals.',
  },
  {
    key: 'permit_site_plan',
    categoryId: 'permits-professional',
    name: 'Full / Detailed Survey-Based Site Plan',
    shortDescription: 'Survey-backed technical plans organized to an approved subdivision-plan standard, with professional review and sealing when scoped.',
    href: '/products/permit_site_plan',
    startHref: '/intake/permit_site_plan',
    priceCents: CANONICAL_PRICE_CENTS.siteIntelligence.permitSitePlanCoordination,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
    includedEstimate: {
      level: 'detailed_construction',
      label: 'Detailed construction estimate included',
      description: 'Trade-by-trade estimate aligned to the detailed site-plan set, with quantities, labor, materials, allowances, and exclusions.',
    },
    outcome: 'A full, detailed, survey-backed plan set coordinated for the target jurisdiction and required professional review.',
    includes: ['Validate the boundary survey and proposed-work dimensions needed for filing', 'Draft the jurisdiction-specific detailed plan set', 'Use the Yocum approved-plan organization as the technical completeness benchmark, adapted to the actual project and agency', 'Add applicable existing-conditions, layout, grading, drainage, stormwater, utility, roadway, detail, landscape, calculation, profile, and schedule sheets', 'Detailed construction estimate aligned to the coordinated plan set', 'Route each professional subject through required licensed review and sealing', 'Revise the plans for agency comments and place them into the permit submission set'],
    customerProvides: ['Current boundary survey or approved equivalent', 'Proposed improvement dimensions', 'Jurisdiction and application requirements'],
    sampleAsset: '/media/product-samples/site-intelligence.svg',
    sampleAlt: 'Representative full detailed survey-based site plan set with technical sheets, professional responsibility, and review status',
    limitations: ['Starting price assumes usable survey information', 'Seal and survey services are provided only when expressly scoped', 'Jurisdiction comments can expand scope'],
    nextStep: 'Submit through permit coordination and retain the approved plan for construction handoff.',
    immediateDeliverables: [
      'Project summary and proposed-work record',
      'Jurisdiction and likely permit-type checklist',
      'Required survey, drawing, professional-review, and agency-document checklist',
      'Known fees, dependencies, assumptions, and open questions',
      'Portal readiness status for the survey-based drawing workflow',
    ],
  },
  {
    key: 'professional_design',
    categoryId: 'permits-professional',
    name: 'Professional Design / Permit-Ready Package',
    shortDescription: 'Scoped construction-document services with the required licensed professionals.',
    href: '/products/professional_design',
    startHref: '/intake/professional_drawings',
    priceCents: CANONICAL_PRICE_CENTS.professionalDesign,
    pricePrefix: 'From ',
    audience: ['homeowner', 'contractor', 'developer'],
    includedEstimate: {
      level: 'detailed_construction',
      label: 'Detailed construction estimate included',
      description: 'Trade-by-trade estimate aligned to the permit-set building plans, with quantities, labor, materials, allowances, and exclusions.',
    },
    outcome: 'A scoped construction-document package produced with the licensed professionals required for the project and jurisdiction.',
    includes: ['Confirm the code path and drawing list required by the permitting authority', 'Produce the architectural and engineering sheets required for the application', 'Coordinate structural, architectural, and applicable trade-plan information', 'Detailed construction estimate aligned to the permit-set building plans', 'Complete required licensed review, signatures, and seals', 'Assemble the final drawing set in the agency-required format for permit filing'],
    customerProvides: ['Verified existing conditions and survey when applicable', 'Approved concept and scope', 'Jurisdiction requirements and professional-service agreement'],
    sampleAsset: '/media/product-samples/professional-design.svg',
    sampleAlt: 'Representative professional drawing index and review matrix without implying a project-specific seal',
    limitations: ['Final price follows scope review', 'Only an engaged licensed professional may seal applicable documents', 'Revisions outside the agreed scope are separate'],
    nextStep: 'Coordinate permit submission and construction bidding after the professional package is complete.',
  },
  {
    key: 'contractor_match',
    categoryId: 'construction-execution',
    name: 'Contractor Match',
    shortDescription: 'Match approved project scope with marketplace professionals suited to the location and work.',
    href: '/products/contractor_match',
    startHref: '/intake/contractor_match',
    priceLabel: 'Included / no fee',
    audience: ['homeowner'],
    outcome: 'A structured handoff of an approved project scope to available Marketplace professionals suited to the work and location.',
    includes: ['Project and trade-fit intake', 'Available professional profiles', 'Credential and insurance status display', 'Comparable scope handoff', 'Marketplace communication path'],
    customerProvides: ['Approved scope and project location', 'Target schedule and budget', 'Any required plans or approvals'],
    sampleAsset: '/media/product-samples/professional-handoff.svg',
    sampleAlt: 'Representative contractor handoff showing project fit, credential status, scope, and next actions',
    limitations: ['Availability varies by trade and location', 'Displayed verification status must be reviewed at engagement', 'The hired professional becomes the licensed and insured contractor of record'],
    nextStep: 'Review proposals, confirm credentials and contract terms, then begin the controlled execution workflow.',
  },
  {
    key: 'construction_consultation',
    categoryId: 'construction-execution',
    name: 'Construction Consultation & Owner Support',
    shortDescription: 'Preconstruction, owner-representation, and design-build execution support scoped to the project.',
    href: '/products/construction_consultation',
    startHref: '/intake/design_build?product=construction_consultation',
    priceLabel: 'Scoped',
    audience: ['homeowner', 'developer'],
    outcome: 'A scoped professional consultation for preconstruction, owner representation, or design-build execution planning.',
    includes: ['Project-readiness review', 'Scope, schedule, and procurement guidance', 'Risk and decision register', 'Professional handoff plan', 'Written consultation summary'],
    customerProvides: ['Current project documents and decisions', 'Budget and schedule constraints', 'Specific questions or execution risks'],
    sampleAsset: '/media/product-samples/professional-handoff.svg',
    sampleAlt: 'Representative construction consultation summary with decisions, risks, responsibilities, and next actions',
    limitations: ['Exact services and fees require scope confirmation', 'Consultation is not a construction contract', 'Licensed responsibilities remain with the engaged professionals of record'],
    nextStep: 'Engage the appropriate professional or Marketplace contractor under a project-specific agreement.',
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
    `- ${product.name}: ${formatCatalogPrice(product)}. ${product.shortDescription} Included: ${product.includes.join('; ')}. Learn more: ${product.href}. Start: ${product.startHref}`
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
      description: 'Human-reviewed, trade-by-trade breakdown validated against documented regional cost data',
      features: ['CSI MasterFormat line-item breakdown', 'Verified regional unit cost data', 'Base / mid / high scenarios', 'Professional estimator review', 'Lender-ready PDF'],
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
      amount: Math.round(CANONICAL_PRICE_CENTS.permits.managed * 1.6),
      description: 'Priority coordination where the jurisdiction supports expedited processing',
      features: ['Priority handling', 'Dedicated coordinator', 'Frequent status updates', 'Inspection coordination'],
      submissionMethods: { KEALEE_MANAGED: 1 },
    },
  },
  // One concept package per product — no Starter/Visualization/Pre-Design steps.
  preDesign: {
    conceptPackage: {
      name: 'Design Concept Package',
      amount: CANONICAL_PRICE_CENTS.concept.kitchen,
      description: 'Concept directions, floor plan, views, materials, zoning and permit scope — priced from the project at intake',
    },
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
// Values are derived from the canonical primitives above. Checkout remains the
// enforcement point, while public pages consume the same values for display.
export interface IntakePriceEntry {
  /** Display label shown on the intake card and Stripe checkout line item. */
  label: string
  /** Price charged in USD cents. */
  cents: number
  /** Customer-facing delivery window. */
  deliveryDays: string
}

/**
 * The sellable catalogue — DERIVED. Each entry's price is the product's "from"
 * price and its label and delivery window come from the quoting engine, so a
 * page that still reads this table shows the same number checkout will charge
 * as a floor. The exact amount for a given project comes from `computeQuote`.
 *
 * Keys that are not products in their own right (bundles, custom build flows)
 * are listed explicitly and derived from their parts.
 */
function entryFor(productKey: string, label?: string): IntakePriceEntry | null {
  const product = getProductPricing(productKey)
  if (!product) return null
  return {
    label: label ?? product.label,
    cents: priceRangeFor(productKey)?.lowCents ?? product.floorCents,
    deliveryDays: product.deliveryDays,
  }
}

export const INTAKE_PRICE_CENTS: Record<string, IntakePriceEntry> = (() => {
  const table: Record<string, IntakePriceEntry> = {}

  // Every priced product, plus the aliases the funnels still use as paths.
  // An alias keeps its own customer-facing name — that name reaches the Stripe
  // line item, and "Townhome Subdivision" must not bill as "Developer Concept".
  const aliasLabels: Record<string, string> = {
    interior_reno_concept: 'Interior Renovation Concept',
    whole_home_remodel: 'Whole-Home Remodel Concept',
    multi_unit_residential: 'Multi-Unit Residential Concept',
    mixed_use: 'Mixed-Use Concept',
    commercial_office: 'Commercial Office Concept',
    development_feasibility: 'Development Feasibility Study',
    townhome_subdivision: 'Townhome Subdivision Concept',
    single_family_subdivision: 'Single-Family Subdivision Concept',
    single_lot_development: 'Single-Lot Development Concept',
  }
  const keys = [...Object.keys(PRODUCT_PRICING), ...Object.keys(aliasLabels)]
  for (const key of keys) {
    const entry = entryFor(key, aliasLabels[key])
    if (entry) table[key] = entry
  }

  // Bundles: their parts less the bundle credit — no separate price list.
  const designEstimatePermit = bundleFromCents(['addition_expansion', 'cost_estimate', 'permit_filing'])
  if (designEstimatePermit) {
    table.design_estimate_permit_bundle = {
      label: 'Design + Estimate + Permit Bundle',
      cents: designEstimatePermit,
      deliveryDays: '7–14 days',
    }
  }
  const estimatePermit = bundleFromCents(['cost_estimate', 'permit_filing'])
  if (estimatePermit) {
    table.estimate_permit_bundle = {
      label: 'Estimate + Permit Package',
      cents: estimatePermit,
      deliveryDays: '5–8 days',
    }
  }

  // Scoped after intake — no published price, quoted by staff.
  table.design_build = {
    label: 'Design + Execution Planning Package',
    cents: 0,
    deliveryDays: 'Quoted after intake',
  }
  table.capture_site_concept = {
    label: 'Site Capture + Concept',
    cents: 39_500,
    deliveryDays: '1–2 days',
  }

  return table
})()

/** Site-visit add-on (additive line item on Stripe checkout). */
export const SITE_VISIT_FEE_CENTS = 12_500

/** Server-trusted lookup. Returns null if `projectPath` is unknown. */
export function getIntakePrice(projectPath: string): IntakePriceEntry | null {
  return INTAKE_PRICE_CENTS[projectPath] ?? null
}

// ── Tiers are gone ───────────────────────────────────────────────────────────
//
// There was an INTAKE_TIER_PRICE_CENTS table here mapping every product to
// three prices, and a getIntakePriceByTier() that checkout called. One core
// package per product replaced it: the amount comes from `computeQuote`, which
// prices size, scope and add-ons from the intake facts. Video, extra views,
// extra revisions and rush are add-ons, not price steps.
//
// Orders sold under the old tiers keep `form_data.tier` so their delivered
// package still renders as purchased; nothing new writes it.

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
  conceptText:        'claude-sonnet-5',
  /** Heavier reasoning for developer / commercial / multi-unit tiers. */
  conceptTextPremium: 'claude-opus-5',
  /** Vision: photo / floor-plan → editable geometry. */
  vision:             'claude-sonnet-5',

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

/** Historical paid-order adapter. New orders choose video as an add-on. */
export const TIER_VIDEO_DEFAULTS: Record<1 | 2 | 3, VideoProvider | null> = {
  1: null,
  2: 'kling-2.5',
  3: 'sora-2-pro',
}

/** Historical tier adapter; the current package always includes six views. */
export const TIER_IMAGE_COUNT: Record<1 | 2 | 3, number> = {
  1: 6,
  2: 6,
  3: 6,
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
