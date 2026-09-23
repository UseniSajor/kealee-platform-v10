/**
 * Kealee quoting engine — the single authority for what a customer pays.
 *
 * ONE core package per product, priced after intake, plus optional add-ons.
 * There are no universal Basic/Premium/Premium+ tiers: tiers only belong where
 * the deliverable, its verification level or the professional responsibility
 * materially changes, and those are separate products (preliminary site plan vs
 * verified feasibility vs survey-based permit coordination), not price steps.
 *
 * Rules this module exists to enforce:
 *  1. One canonical source. Marketing ranges, the post-intake quote and the
 *     Stripe amount are all produced here, from the same data.
 *  2. Public ranges are COMPUTED (`priceRangeFor`), never typed into copy.
 *  3. A language model never sets a payable amount. It may classify scope; the
 *     classification is matched against this table and priced deterministically.
 *  4. Every product has its own floor and ceiling. Scope that prices above the
 *     ceiling becomes a scoping request, not a larger charge.
 *  5. A quote is reproducible: same facts in, same amount out, with the inputs
 *     snapshot and an expiry recorded alongside it.
 */

export const QUOTE_VERSION = '1.0'

/** How long a quoted price stands before it is recomputed. */
export const QUOTE_VALIDITY_DAYS = 14

// ── Credit policy ────────────────────────────────────────────────────────────

/**
 * Every package fee is credited when the customer goes on to build with a
 * Kealee marketplace contractor under Kealee protected payments.
 */
export const KEALEE_CREDIT_POLICY = {
  label: 'Credited when you build with a Kealee contractor',
  shortCopy:
    '100% of this fee is credited toward your Kealee fees when you build with a Kealee marketplace contractor using Kealee protected payments.',
  terms:
    'Credit applies once, to Kealee fees on a later construction engagement for the same property, when the work is contracted through a Kealee marketplace contractor with Kealee protected payments active. It cannot exceed those fees, has no cash value, is non-transferable, and does not reduce contractor, agency or other third-party charges.',
} as const

// ── Types ────────────────────────────────────────────────────────────────────

export type QuoteLineKind =
  | 'base'
  | 'size'
  | 'complexity'
  | 'required_scope'
  | 'addon'
  | 'rush'
  | 'included'
  | 'excluded'

export interface QuoteLine {
  id: string
  label: string
  /** null = shown to the customer without a price (included, excluded, scoped). */
  amountCents: number | null
  kind: QuoteLineKind
  /** Where the fact behind this line came from, when it was detected rather than stated. */
  source?: string
  note?: string
}

/** Site conditions that change professional effort. Detected, then staff-confirmed. */
export interface SiteConditionFacts {
  chesapeakeBayCriticalArea?: boolean
  femaFloodplain?: boolean
  steepSlope?: boolean
  streamOrWetlandBuffer?: boolean
  historicOrOverlayDistrict?: boolean
  peStampRequired?: boolean
}

export type DrawingClass = 'limited_renovation' | 'addition_adu' | 'whole_home_new_commercial'

export interface QuoteFacts {
  /** Conditioned/affected area of the work, square feet. */
  squareFeet?: number
  /** Site area in acres — used by site-plan and subdivision products. */
  lotAcres?: number
  /** Dwelling or tenant units. */
  units?: number
  /** Work removes or alters structure (wall removal, new openings, framing). */
  structuralChange?: boolean
  /** Drawing class for permit-ready drawings. */
  drawingClass?: DrawingClass
  siteConditions?: SiteConditionFacts
  /** Jurisdictions the deliverable must satisfy. More than one is scoped. */
  jurisdictionCount?: number
  /** False when the property sits outside the jurisdictions Kealee supports. */
  jurisdictionSupported?: boolean
  /** Optional add-on ids from ADD_ONS. */
  addOns?: string[]
  /** Extra rendering views beyond the package's included views. */
  extraRenderViews?: number
  /** Extra revision rounds beyond the package's included round. */
  extraRevisionRounds?: number
  /** Customer asked for rush delivery. */
  rush?: boolean
}

export interface Quote {
  version: string
  productKey: string
  label: string
  currency: 'usd'
  lines: QuoteLine[]
  /** The core package after size, complexity and required scope, within floor/ceiling. */
  packageCents: number
  addOnsCents: number
  rushCents: number
  totalCents: number
  floorCents: number
  ceilingCents: number
  /** True when this scope cannot be sold at a published price and needs staff scoping. */
  customQuoteRequired: boolean
  customQuoteReasons: string[]
  exclusions: string[]
  thirdPartyFees: string[]
  deliveryDays: string
  quotedAt: string
  expiresAt: string
  /** The facts this quote was computed from — replay these and the amount is identical. */
  inputs: QuoteFacts
  credit: typeof KEALEE_CREDIT_POLICY
}

// ── Add-on catalogue ─────────────────────────────────────────────────────────
//
// Optional, never bundled into the core package. A scoped add-on has no price
// here and routes to a scoping request.

export interface AddOn {
  id: string
  label: string
  /** null = scoped by staff (no published price). */
  cents: number | null
  /** Product families this add-on is offered on. Empty = all. */
  families?: ProductFamily[]
  note?: string
}

export const ADD_ONS: readonly AddOn[] = [
  { id: 'render_view',        label: 'Additional rendering view',                    cents: 14_500, note: 'Per additional view of the proposed design.' },
  { id: 'video_presentation', label: 'Cinematic video presentation',                 cents: 44_900, note: '60-second narrated walkthrough of the concept.' },
  { id: 'interactive_walk',   label: 'Interactive walkthrough',                      cents: 54_900 },
  { id: 'revision_round',     label: 'Additional revision round',                    cents: 19_500 },
  { id: 'editable_cad',       label: 'Editable CAD / DXF concept files',             cents: null,   note: 'Scoped to the plan type and available source measurements.' },
  { id: 'design_consult',     label: 'Design professional consultation',             cents: null,   note: 'Scoped by discipline and meeting length.' },
  { id: 'site_visit',         label: 'Site visit and capture',                       cents: 39_500, note: 'Measured photo/video capture at the property.' },
  { id: 'as_built_plan',      label: 'As-built measured floor plan',                 cents: 69_500 },
  { id: 'extra_jurisdiction', label: 'Additional jurisdiction',                      cents: null,   note: 'Scoped — review standards differ by agency.' },
  { id: 'alternate_concept',  label: 'Alternate concept direction',                  cents: null,   note: 'Scoped — a second independent design direction.' },
  { id: 'licensed_review',    label: 'Licensed professional review or stamp',        cents: null,   note: 'Scoped by discipline and jurisdiction.' },
] as const

/** Rush premium applied to the core package (not to add-ons or third-party fees). */
export const RUSH_MULTIPLIER = 0.35

export function getAddOn(id: string): AddOn | null {
  return ADD_ONS.find(a => a.id === id) ?? null
}

// ── Products ─────────────────────────────────────────────────────────────────

export type ProductFamily =
  | 'room_bath'
  | 'kitchen_interior'
  | 'exterior_landscape'
  | 'addition_adu'
  | 'whole_home'
  | 'commercial_developer'
  | 'site_intelligence'
  | 'estimation'
  | 'permits'
  | 'drawings'
  | 'services'

/** A size step. The first bracket whose limit the facts fall within applies. */
export interface SizeBracket {
  /** Upper bound, inclusive. Square feet unless the product measures acres. */
  upTo: number
  label: string
  addCents: number
}

/** A scope fact that adds professional effort, priced deterministically. */
export interface ComplexityRule {
  id: string
  label: string
  addCents: number
  /** Evaluated against the intake facts. */
  when: (facts: QuoteFacts) => boolean
  /** Named so the customer can see what detected it. */
  source?: string
}

export interface ProductPricing {
  key: string
  label: string
  family: ProductFamily
  /** Measure the size brackets read. */
  measure: 'sqft' | 'acres' | 'units' | 'none'
  /** Smallest bracket, before any adjustment. */
  baseCents: number
  sizeBrackets: readonly SizeBracket[]
  complexity: readonly ComplexityRule[]
  floorCents: number
  ceilingCents: number
  deliveryDays: string
  /** What the package includes at no extra charge, shown on the quote. */
  included: readonly string[]
  exclusions: readonly string[]
  /** Fees the customer pays someone else — never charged by Kealee. */
  thirdPartyFees?: readonly string[]
  /** Hard size limit; beyond it the scope is quoted by staff. */
  maxMeasure?: number
  /** Drawing classes replace the base for permit-ready drawings. */
  classBases?: Readonly<Record<DrawingClass, { label: string; baseCents: number; ceilingCents: number }>>
}

const STRUCTURAL: ComplexityRule = {
  id: 'structural_change',
  label: 'Structural change — wall removal or new openings',
  addCents: 15_000,
  when: f => Boolean(f.structuralChange),
}

const SITE_CONDITION_RULES: readonly ComplexityRule[] = [
  { id: 'cbca',       label: 'Chesapeake Bay Critical Area — Conservation Plan and impervious accounting', addCents: 150_000, when: f => Boolean(f.siteConditions?.chesapeakeBayCriticalArea), source: 'PGAtlas overlay zone (Critical Area)' },
  { id: 'floodplain', label: 'FEMA floodplain or floodway — BFE and elevation certificate coordination',   addCents: 200_000, when: f => Boolean(f.siteConditions?.femaFloodplain),            source: 'PGAtlas floodplain overlay / FEMA FIRM' },
  { id: 'slope',      label: 'Steep slope over 15% across a meaningful area',                              addCents: 100_000, when: f => Boolean(f.siteConditions?.steepSlope),                 source: 'PGAtlas Elevation/MapServer/1 (2-ft contours, NAVD88)' },
  { id: 'buffer',     label: 'Stream or wetland buffer encroachment',                                      addCents: 120_000, when: f => Boolean(f.siteConditions?.streamOrWetlandBuffer),      source: 'PGAtlas Environmental (streams, wetlands, buffers)' },
  { id: 'pe_stamp',   label: 'Structural / PE stamp required by the jurisdiction',                         addCents: 150_000, when: f => Boolean(f.siteConditions?.peStampRequired),            source: 'Kealee permit rules + jurisdiction requirement' },
  { id: 'historic',   label: 'Historic or overlay district review',                                        addCents: 100_000, when: f => Boolean(f.siteConditions?.historicOrOverlayDistrict), source: 'PGAtlas overlay zone' },
]

/** Light site-condition load for concept-stage products — a fraction of drawing effort. */
const CONCEPT_SITE_RULES: readonly ComplexityRule[] = SITE_CONDITION_RULES
  .filter(r => r.id !== 'pe_stamp')
  .map(r => ({ ...r, addCents: Math.round(r.addCents * 0.1 / 500) * 500 }))

const CONCEPT_INCLUDED = [
  'Three concept directions with a recommended direction',
  'Preliminary concept plan, labelled and dimensioned where source measurements are available',
  'Six project-specific proposed design views',
  'Materials and finish direction with planning-level bill of materials',
  'Scope and construction planning cost range',
  'One revision round',
  'Zoning district/code, preliminary allowances, and buildability snapshot with sources',
  'Permit scope brief — disciplines and likely permit types',
  'Six-page PDF package and owner portal workspace',
] as const

const CONCEPT_EXCLUSIONS = [
  'Not for permit or construction — concept package, not stamped drawings',
  'No agency submission or permit filing',
  'No structural, MEP or civil engineering design',
  'Video, extra still views, editable CAD/DXF, consultation, and additional revisions unless purchased as add-ons',
] as const

function conceptProduct(
  key: string,
  label: string,
  family: ProductFamily,
  baseCents: number,
  ceilingCents: number,
  brackets: readonly SizeBracket[],
  deliveryDays: string,
  maxMeasure: number,
): ProductPricing {
  return {
    key, label, family, measure: 'sqft',
    baseCents,
    sizeBrackets: brackets,
    complexity: [STRUCTURAL, ...CONCEPT_SITE_RULES],
    floorCents: baseCents,
    ceilingCents,
    deliveryDays,
    included: CONCEPT_INCLUDED,
    exclusions: CONCEPT_EXCLUSIONS,
    maxMeasure,
  }
}

/**
 * Public ranges are the researched positioning bands; the brackets below are
 * built so the computed low equals the floor and the computed high equals the
 * ceiling. `priceRangeFor` runs the formula rather than reading these numbers.
 */
export const PRODUCT_PRICING: Readonly<Record<string, ProductPricing>> = {
  // ── Concept packages — $395 to $3,995 depending on family ────────────────
  bathroom_remodel: conceptProduct('bathroom_remodel', 'Bathroom Design Concept', 'room_bath', 39_500, 59_500, [
    { upTo: 60,    label: 'Powder room or small bath (up to 60 sq ft)', addCents: 0 },
    { upTo: 120,   label: 'Full bath (60–120 sq ft)',                   addCents: 8_000 },
    { upTo: 10_000, label: 'Primary or multi-fixture suite (120+ sq ft)', addCents: 16_000 },
  ], '2–4 days', 600),

  kitchen_remodel: conceptProduct('kitchen_remodel', 'Kitchen Design Concept', 'kitchen_interior', 49_500, 79_500, [
    { upTo: 180,   label: 'Galley or small kitchen (up to 180 sq ft)', addCents: 0 },
    { upTo: 350,   label: 'Standard kitchen (180–350 sq ft)',          addCents: 10_000 },
    { upTo: 10_000, label: 'Large or open-plan kitchen (350+ sq ft)',   addCents: 15_000 },
  ], '3–5 days', 1_500),

  interior_renovation: conceptProduct('interior_renovation', 'Interior Renovation Concept', 'kitchen_interior', 49_500, 79_500, [
    { upTo: 600,    label: 'Single room or small area (up to 600 sq ft)', addCents: 0 },
    { upTo: 1_500,  label: 'Multi-room (600–1,500 sq ft)',                addCents: 10_000 },
    { upTo: 10_000, label: 'Full floor or larger (1,500+ sq ft)',         addCents: 15_000 },
  ], '3–5 days', 4_000),

  exterior_concept: conceptProduct('exterior_concept', 'Exterior Concept', 'exterior_landscape', 59_500, 99_500, [
    { upTo: 1_500,  label: 'Facade or single elevation (up to 1,500 sq ft)', addCents: 0 },
    { upTo: 3_000,  label: 'Multiple elevations (1,500–3,000 sq ft)',        addCents: 20_000 },
    { upTo: 20_000, label: 'Full exterior (3,000+ sq ft)',                   addCents: 30_000 },
  ], '3–5 days', 8_000),

  garden_concept: conceptProduct('garden_concept', 'Garden and Landscape Concept', 'exterior_landscape', 59_500, 99_500, [
    { upTo: 2_000,  label: 'Yard or courtyard (up to 2,000 sq ft)',  addCents: 0 },
    { upTo: 8_000,  label: 'Full lot (2,000–8,000 sq ft)',           addCents: 20_000 },
    { upTo: 43_560, label: 'Large property (8,000 sq ft and above)', addCents: 30_000 },
  ], '2–4 days', 43_560),

  addition_expansion: conceptProduct('addition_expansion', 'Addition / ADU Concept', 'addition_adu', 89_500, 149_500, [
    { upTo: 400,    label: 'Small addition or ADU (up to 400 sq ft)', addCents: 0 },
    { upTo: 900,    label: 'Addition (400–900 sq ft)',                addCents: 30_000 },
    { upTo: 10_000, label: 'Large addition (900+ sq ft)',             addCents: 45_000 },
  ], '3–5 days', 3_000),

  whole_home_concept: conceptProduct('whole_home_concept', 'Whole-Home Concept', 'whole_home', 99_500, 199_500, [
    { upTo: 2_000,  label: 'Up to 2,000 sq ft',   addCents: 0 },
    { upTo: 4_000,  label: '2,000–4,000 sq ft',   addCents: 50_000 },
    { upTo: 20_000, label: '4,000+ sq ft',        addCents: 85_000 },
  ], '4–6 days', 12_000),

  developer_concept: conceptProduct('developer_concept', 'Commercial / Developer Concept', 'commercial_developer', 149_500, 399_500, [
    { upTo: 5_000,   label: 'Up to 5,000 sq ft',   addCents: 0 },
    { upTo: 20_000,  label: '5,000–20,000 sq ft',  addCents: 130_000 },
    { upTo: 200_000, label: '20,000+ sq ft',       addCents: 220_000 },
  ], '5–7 days', 100_000),

  // ── Site intelligence — three products, not three tiers ─────────────────
  preliminary_site_plan: {
    key: 'preliminary_site_plan', label: 'Preliminary Site Plan', family: 'site_intelligence', measure: 'acres',
    baseCents: 39_500,
    sizeBrackets: [
      { upTo: 0.5, label: 'Up to 1/2 acre',  addCents: 0 },
      { upTo: 2,   label: '1/2 to 2 acres',  addCents: 10_000 },
      { upTo: 5,   label: '2 to 5 acres',    addCents: 20_000 },
    ],
    complexity: CONCEPT_SITE_RULES,
    floorCents: 39_500, ceilingCents: 59_500,
    deliveryDays: 'First-hour summary; full site plan in 2–5 days',
    included: [
      'Parcel boundary and setbacks from county GIS, with sources named',
      'Zoning analysis and buildable-area reasoning',
      'Proposed improvements located within the buildable area',
      'Assumptions and confidence stated for every fact',
    ],
    exclusions: [
      'Drawn from county GIS, not a field survey — not a boundary determination',
      'Not sealed and not accepted where a survey-based plan is required',
    ],
    maxMeasure: 5,
  },

  verified_site_feasibility: {
    key: 'verified_site_feasibility', label: 'Verified Site Feasibility Plan', family: 'site_intelligence', measure: 'acres',
    baseCents: 89_500,
    sizeBrackets: [
      { upTo: 0.5, label: 'Up to 1/2 acre', addCents: 0 },
      { upTo: 2,   label: '1/2 to 2 acres', addCents: 25_000 },
      { upTo: 5,   label: '2 to 5 acres',   addCents: 40_000 },
    ],
    complexity: SITE_CONDITION_RULES.filter(r => r.id !== 'pe_stamp'),
    floorCents: 89_500, ceilingCents: 149_500,
    deliveryDays: 'First-hour source summary; verified feasibility plan in 3–7 days',
    included: [
      'Everything in the preliminary site plan',
      'Licensed professional review of the feasibility conclusion',
      'Constraint verification against county and environmental layers',
      'Written feasibility opinion you can rely on for decisions',
    ],
    exclusions: [
      'Not a boundary survey and not a permit submission',
      'Professional review covers feasibility, not construction documents',
    ],
    maxMeasure: 5,
  },

  permit_site_plan: {
    key: 'permit_site_plan', label: 'Survey-Based Permit Site Plan Coordination', family: 'site_intelligence', measure: 'acres',
    baseCents: 199_500,
    sizeBrackets: [
      { upTo: 0.5, label: 'Up to 1/2 acre', addCents: 0 },
      { upTo: 2,   label: '1/2 to 2 acres', addCents: 100_000 },
      { upTo: 5,   label: '2 to 5 acres',   addCents: 175_000 },
    ],
    complexity: SITE_CONDITION_RULES,
    floorCents: 199_500, ceilingCents: 499_500,
    deliveryDays: 'First-hour permit-requirements summary; drawing coordination scoped after survey review',
    included: [
      'Permit-requirements summary for the jurisdiction',
      'Coordination of the survey-based site plan through to submission readiness',
      'Licensed professional involvement appropriate to the jurisdiction',
    ],
    exclusions: [
      'Kealee does not perform the boundary survey',
      'Agency review and permit fees are paid by the applicant',
    ],
    thirdPartyFees: ['Boundary survey by a licensed surveyor', 'Agency permit and review fees'],
    maxMeasure: 5,
  },

  // ── Estimation ───────────────────────────────────────────────────────────
  cost_estimate: {
    key: 'cost_estimate', label: 'Detailed Planning Estimate', family: 'estimation', measure: 'sqft',
    baseCents: 49_500,
    sizeBrackets: [
      { upTo: 1_000,  label: 'Up to 1,000 sq ft',  addCents: 0 },
      { upTo: 3_000,  label: '1,000–3,000 sq ft',  addCents: 15_000 },
      { upTo: 20_000, label: '3,000+ sq ft',       addCents: 30_000 },
    ],
    complexity: [STRUCTURAL],
    floorCents: 49_500, ceilingCents: 79_500,
    deliveryDays: '3–5 days',
    included: [
      'Line-item estimate against verified regional pricing',
      'Assumptions, exclusions and allowances stated',
      'Cost range rather than a single false-precision number',
    ],
    exclusions: ['Not a bid and not a guaranteed price', 'Not certified for lender submission'],
    maxMeasure: 15_000,
  },

  certified_estimate: {
    key: 'certified_estimate', label: 'Professionally Reviewed Estimate', family: 'estimation', measure: 'sqft',
    baseCents: 99_500,
    sizeBrackets: [
      { upTo: 1_000,  label: 'Up to 1,000 sq ft',  addCents: 0 },
      { upTo: 3_000,  label: '1,000–3,000 sq ft',  addCents: 40_000 },
      { upTo: 20_000, label: '3,000+ sq ft',       addCents: 85_500 },
    ],
    complexity: [STRUCTURAL],
    floorCents: 99_500, ceilingCents: 185_000,
    deliveryDays: '5–7 days',
    included: [
      'Everything in the detailed planning estimate',
      'Review and sign-off by a construction professional',
      'Notarized format accepted by lenders',
    ],
    exclusions: ['Not a bid', 'Lender acceptance is the lender’s decision'],
    maxMeasure: 15_000,
  },

  // ── Permits ──────────────────────────────────────────────────────────────
  permit_path_only: {
    key: 'permit_path_only', label: 'Permit Assessment', family: 'permits', measure: 'none',
    baseCents: 29_500,
    sizeBrackets: [],
    complexity: [
      { id: 'multi_discipline', label: 'Multiple trade disciplines in scope', addCents: 15_000, when: f => Boolean(f.structuralChange) },
      ...SITE_CONDITION_RULES.filter(r => r.id === 'historic' || r.id === 'cbca').map(r => ({ ...r, addCents: 15_000 })),
    ],
    floorCents: 29_500, ceilingCents: 59_500,
    deliveryDays: '3–5 days',
    included: [
      'Which permits this scope requires, by discipline',
      'Fee and review-timeline estimate for the jurisdiction',
      'AHJ submittal checklist',
    ],
    exclusions: ['No drawings', 'No agency filing'],
  },

  permit_filing: {
    key: 'permit_filing', label: 'Permit Preparation and Filing', family: 'permits', measure: 'none',
    baseCents: 79_500,
    sizeBrackets: [],
    complexity: [
      { id: 'multi_discipline', label: 'Multiple trade permits to prepare', addCents: 35_000, when: f => Boolean(f.structuralChange) },
      ...SITE_CONDITION_RULES.filter(r => ['historic', 'cbca', 'floodplain'].includes(r.id)).map(r => ({ ...r, addCents: 35_000 })),
    ],
    floorCents: 79_500, ceilingCents: 149_500,
    deliveryDays: '5–10 days',
    included: [
      'Application prepared and assembled for the jurisdiction',
      'Submission on your behalf',
      'Response to reviewer completeness comments',
    ],
    exclusions: ['Agency fees are paid by the applicant', 'Drawings are not included'],
    thirdPartyFees: ['Agency permit and review fees'],
  },

  permit_managed: {
    key: 'permit_managed', label: 'Managed Permit Coordination', family: 'permits', measure: 'none',
    baseCents: 149_500,
    sizeBrackets: [],
    complexity: [
      { id: 'multi_discipline', label: 'Multiple disciplines and agencies to coordinate', addCents: 100_000, when: f => Boolean(f.structuralChange) },
      ...SITE_CONDITION_RULES.filter(r => ['historic', 'cbca', 'floodplain'].includes(r.id)).map(r => ({ ...r, addCents: 100_000 })),
    ],
    floorCents: 149_500, ceilingCents: 350_000,
    deliveryDays: 'Through to permit issuance',
    included: [
      'End-to-end coordination through review cycles',
      'Reviewer correspondence handled by Kealee',
      'Status reporting until the permit issues',
    ],
    exclusions: ['Agency fees are paid by the applicant', 'Issuance is the agency’s decision'],
    thirdPartyFees: ['Agency permit and review fees'],
  },

  // ── Permit-ready drawings — class base plus site-condition surcharges ────
  professional_drawings: {
    key: 'professional_drawings', label: 'Permit-Ready Drawings', family: 'drawings', measure: 'sqft',
    baseCents: 149_500,
    classBases: {
      limited_renovation:        { label: 'Limited renovation drawings',              baseCents: 149_500, ceilingCents: 399_500 },
      addition_adu:              { label: 'Addition / ADU drawings',                  baseCents: 399_500, ceilingCents: 799_500 },
      whole_home_new_commercial: { label: 'Whole-home, new construction or commercial drawings', baseCents: 799_500, ceilingCents: 1_499_500 },
    },
    sizeBrackets: [
      { upTo: 750,     label: 'Up to 750 sq ft',    addCents: 0 },
      { upTo: 2_000,   label: '750–2,000 sq ft',    addCents: 100_000 },
      { upTo: 200_000, label: '2,000+ sq ft',       addCents: 200_000 },
    ],
    complexity: SITE_CONDITION_RULES,
    floorCents: 149_500, ceilingCents: 1_499_500,
    deliveryDays: 'Scoped after the property review — typically 2–6 weeks',
    included: [
      'Drawing set prepared for permit submission',
      'Licensed professional of record for the discipline required',
      'Coordination with the jurisdiction’s submittal checklist',
    ],
    exclusions: ['Agency fees are paid by the applicant', 'Construction administration is a separate engagement'],
    thirdPartyFees: ['Agency permit and review fees', 'Boundary survey where the jurisdiction requires one'],
    maxMeasure: 100_000,
  },

  // ── Services ─────────────────────────────────────────────────────────────
  managed_bid: {
    key: 'managed_bid', label: 'Managed Bid Process', family: 'services', measure: 'none',
    baseCents: 49_500,
    sizeBrackets: [],
    complexity: [{ id: 'multi_trade', label: 'Multiple trades to tender', addCents: 50_000, when: f => Boolean(f.structuralChange) }],
    floorCents: 49_500, ceilingCents: 99_500,
    deliveryDays: '2–3 weeks',
    included: [
      'Scope package issued to matched contractors',
      'Bid levelling on a like-for-like basis',
      'Recommendation with the reasoning stated',
    ],
    exclusions: ['Contractor pricing is the contractor’s', 'Kealee does not guarantee a bid outcome'],
  },

  pm_advisory: {
    key: 'pm_advisory', label: 'Project Management Advisory', family: 'services', measure: 'none',
    baseCents: 29_900,
    sizeBrackets: [],
    complexity: [{ id: 'active_build', label: 'Active construction underway', addCents: 20_000, when: f => Boolean(f.structuralChange) }],
    floorCents: 29_900, ceilingCents: 49_900,
    deliveryDays: 'Monthly, cancel any time',
    included: ['Scheduled advisory sessions', 'Document and submittal review', 'Escalation guidance when the build goes sideways'],
    exclusions: ['Advisory only — Kealee does not direct the contractor', 'Not construction management of record'],
  },

  pm_oversight: {
    key: 'pm_oversight', label: 'Active Project Oversight', family: 'services', measure: 'none',
    baseCents: 95_000,
    sizeBrackets: [],
    complexity: [{ id: 'active_build', label: 'Multi-trade active construction', addCents: 200_000, when: f => Boolean(f.structuralChange) }],
    floorCents: 95_000, ceilingCents: 295_000,
    deliveryDays: 'Monthly, scope-based',
    included: ['Site oversight against the schedule', 'Draw and change-order review', 'Progress reporting to the owner'],
    exclusions: ['Not a general contractor and not a licensed inspection', 'Agency inspections remain the contractor’s responsibility'],
  },

  contractor_match: {
    key: 'contractor_match', label: 'Contractor Match', family: 'services', measure: 'none',
    baseCents: 0,
    sizeBrackets: [],
    complexity: [],
    floorCents: 0, ceilingCents: 0,
    deliveryDays: '1 day',
    included: ['Matched to vetted contractors for your scope and area', 'No fee — Kealee is paid by the build engagement'],
    exclusions: ['Contractor selection and contracting remain yours'],
  },
} as const

/**
 * Intake paths that are the same product under another name. The catalogue
 * grew several aliases for one piece of work (an "interior reno concept" and an
 * "interior renovation" are the same package), and every one of them must price
 * identically or the funnel a customer happens to enter changes the bill.
 */
export const PRODUCT_ALIASES: Readonly<Record<string, string>> = {
  interior_reno_concept: 'interior_renovation',
  whole_home_remodel: 'whole_home_concept',
  // Commercial, multi-unit and land products are scoped as developer work; the
  // size brackets and the custom-quote rules separate them.
  multi_unit_residential: 'developer_concept',
  mixed_use: 'developer_concept',
  commercial_office: 'developer_concept',
  development_feasibility: 'developer_concept',
  townhome_subdivision: 'developer_concept',
  single_family_subdivision: 'developer_concept',
  single_lot_development: 'developer_concept',
}

export function getProductPricing(key: string): ProductPricing | null {
  const direct = PRODUCT_PRICING[key]
  if (direct) return direct
  const alias = PRODUCT_ALIASES[key]
  if (!alias) return null
  const target = PRODUCT_PRICING[alias]
  // The alias keeps its own key so quotes and orders record what was bought.
  return target ? { ...target, key } : null
}

// ── Custom-quote rules ───────────────────────────────────────────────────────

/**
 * When a scope cannot be sold at a published price. These are the only reasons;
 * anything else prices instantly, so the customer is never sent to a sales
 * queue for ordinary work.
 */
export function customQuoteReasons(product: ProductPricing, facts: QuoteFacts): string[] {
  const reasons: string[] = []
  const measured = measureOf(product, facts)

  if (product.maxMeasure != null && measured != null && measured > product.maxMeasure) {
    reasons.push(
      `Project size (${formatMeasure(product, measured)}) is beyond the published ${product.label.toLowerCase()} range.`,
    )
  }
  if ((facts.jurisdictionCount ?? 1) > 1) {
    reasons.push('More than one jurisdiction must be satisfied.')
  }
  if (facts.jurisdictionSupported === false) {
    reasons.push('The property is outside the jurisdictions Kealee prices instantly.')
  }
  if ((facts.units ?? 1) > 4) {
    reasons.push(`${facts.units} units — multi-unit work is scoped individually.`)
  }
  for (const id of facts.addOns ?? []) {
    const addOn = getAddOn(id)
    if (addOn && addOn.cents == null) reasons.push(`${addOn.label} is scoped by staff.`)
  }
  return reasons
}

// ── Computation ──────────────────────────────────────────────────────────────

function measureOf(product: ProductPricing, facts: QuoteFacts): number | null {
  if (product.measure === 'sqft') return facts.squareFeet ?? null
  if (product.measure === 'acres') return facts.lotAcres ?? null
  if (product.measure === 'units') return facts.units ?? null
  return null
}

function formatMeasure(product: ProductPricing, value: number): string {
  if (product.measure === 'acres') return `${value} acres`
  if (product.measure === 'units') return `${value} units`
  return `${Math.round(value).toLocaleString()} sq ft`
}

function bracketFor(product: ProductPricing, facts: QuoteFacts): SizeBracket | null {
  const measured = measureOf(product, facts)
  if (measured == null || product.sizeBrackets.length === 0) return null
  return product.sizeBrackets.find(b => measured <= b.upTo) ?? product.sizeBrackets[product.sizeBrackets.length - 1]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * The quote. Deterministic: the same facts always produce the same amount, and
 * nothing outside this function may change what a customer is charged.
 */
export function computeQuote(productKey: string, facts: QuoteFacts, now = new Date()): Quote | null {
  const product = getProductPricing(productKey)
  if (!product) return null

  const lines: QuoteLine[] = []

  // Base — drawings price from their class, everything else from the product.
  const drawingClass = product.classBases ? (facts.drawingClass ?? 'limited_renovation') : null
  const classBase = drawingClass && product.classBases ? product.classBases[drawingClass] : null
  const baseCents = classBase?.baseCents ?? product.baseCents
  const ceilingCents = classBase?.ceilingCents ?? product.ceilingCents
  lines.push({ id: 'base', label: classBase ? classBase.label : product.label, amountCents: baseCents, kind: 'base' })

  // Size
  const bracket = bracketFor(product, facts)
  if (bracket && bracket.addCents > 0) {
    lines.push({ id: 'size', label: bracket.label, amountCents: bracket.addCents, kind: 'size' })
  } else if (bracket) {
    lines.push({ id: 'size', label: bracket.label, amountCents: null, kind: 'included' })
  }

  // Complexity and required scope
  for (const rule of product.complexity) {
    if (!rule.when(facts)) continue
    lines.push({
      id: rule.id,
      label: rule.label,
      amountCents: rule.addCents,
      kind: rule.source ? 'required_scope' : 'complexity',
      source: rule.source,
    })
  }

  const rawPackage = lines
    .filter(l => l.kind === 'base' || l.kind === 'size' || l.kind === 'complexity' || l.kind === 'required_scope')
    .reduce((sum, l) => sum + (l.amountCents ?? 0), 0)
  const packageCents = clamp(rawPackage, product.floorCents, ceilingCents)

  // What the package includes without extra charge
  for (const item of product.included) {
    lines.push({ id: `included:${item.slice(0, 24)}`, label: item, amountCents: null, kind: 'included' })
  }

  // Add-ons
  let addOnsCents = 0
  for (const id of facts.addOns ?? []) {
    const addOn = getAddOn(id)
    if (!addOn) continue
    if (addOn.cents == null) {
      lines.push({ id: `addon:${addOn.id}`, label: addOn.label, amountCents: null, kind: 'addon', note: addOn.note })
      continue
    }
    addOnsCents += addOn.cents
    lines.push({ id: `addon:${addOn.id}`, label: addOn.label, amountCents: addOn.cents, kind: 'addon', note: addOn.note })
  }
  const extraViews = Math.max(0, facts.extraRenderViews ?? 0)
  if (extraViews > 0) {
    const unit = getAddOn('render_view')!.cents!
    addOnsCents += unit * extraViews
    lines.push({ id: 'addon:render_view_qty', label: `${extraViews} additional rendering view${extraViews === 1 ? '' : 's'}`, amountCents: unit * extraViews, kind: 'addon' })
  }
  const extraRevisions = Math.max(0, facts.extraRevisionRounds ?? 0)
  if (extraRevisions > 0) {
    const unit = getAddOn('revision_round')!.cents!
    addOnsCents += unit * extraRevisions
    lines.push({ id: 'addon:revision_qty', label: `${extraRevisions} additional revision round${extraRevisions === 1 ? '' : 's'}`, amountCents: unit * extraRevisions, kind: 'addon' })
  }

  // Rush applies to the package only
  const rushCents = facts.rush ? Math.round(packageCents * RUSH_MULTIPLIER) : 0
  if (rushCents > 0) {
    lines.push({ id: 'rush', label: `Rush delivery (+${Math.round(RUSH_MULTIPLIER * 100)}%)`, amountCents: rushCents, kind: 'rush' })
  }

  for (const item of product.exclusions) {
    lines.push({ id: `excluded:${item.slice(0, 24)}`, label: item, amountCents: null, kind: 'excluded' })
  }

  const reasons = customQuoteReasons(product, facts)
  // Scope that prices above its ceiling is scoped rather than charged more.
  if (rawPackage > ceilingCents) {
    reasons.push('The scope described prices above this package — a scoped quote follows.')
  }

  const quotedAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + QUOTE_VALIDITY_DAYS * 86_400_000).toISOString()

  return {
    version: QUOTE_VERSION,
    productKey: product.key,
    label: product.label,
    currency: 'usd',
    lines,
    packageCents,
    addOnsCents,
    rushCents,
    totalCents: packageCents + addOnsCents + rushCents,
    floorCents: product.floorCents,
    ceilingCents,
    customQuoteRequired: reasons.length > 0,
    customQuoteReasons: reasons,
    exclusions: [...product.exclusions],
    thirdPartyFees: [...(product.thirdPartyFees ?? [])],
    deliveryDays: product.deliveryDays,
    quotedAt,
    expiresAt,
    inputs: facts,
    credit: KEALEE_CREDIT_POLICY,
  }
}

/**
 * The public range — computed by running the formula at the product's smallest
 * and largest saleable scope, never typed into marketing copy.
 */
export function priceRangeFor(productKey: string): { lowCents: number; highCents: number } | null {
  const product = getProductPricing(productKey)
  if (!product) return null

  const smallest: QuoteFacts = {}
  const low = computeQuote(product.key, smallest)
  if (!low) return null

  const largestBracket = product.sizeBrackets[product.sizeBrackets.length - 1]
  const biggest: QuoteFacts = {
    structuralChange: true,
    ...(product.measure === 'sqft' && largestBracket ? { squareFeet: Math.min(largestBracket.upTo, product.maxMeasure ?? largestBracket.upTo) } : {}),
    ...(product.measure === 'acres' && largestBracket ? { lotAcres: Math.min(largestBracket.upTo, product.maxMeasure ?? largestBracket.upTo) } : {}),
    ...(product.classBases ? { drawingClass: 'whole_home_new_commercial' as DrawingClass } : {}),
  }
  const high = computeQuote(product.key, biggest)
  if (!high) return null

  return { lowCents: low.packageCents, highCents: high.ceilingCents }
}

/** "Typical price: $495–$795" — the only price shown before intake. */
export function formatPriceRange(productKey: string): string | null {
  const range = priceRangeFor(productKey)
  if (!range) return null
  const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`
  if (range.lowCents === range.highCents) return dollars(range.lowCents)
  return `${dollars(range.lowCents)}–${dollars(range.highCents)}`
}

/** The line shown on product and service pages before a customer starts intake. */
export function preIntakePriceCopy(productKey: string): { range: string; qualifier: string } | null {
  const range = formatPriceRange(productKey)
  if (!range) return null
  return {
    range: `Typical price: ${range}`,
    qualifier: 'Final fixed price provided after your project intake.',
  }
}

// ── Bundles ──────────────────────────────────────────────────────────────────

/**
 * A bundle is its component packages at their published "from" price, less a
 * stated bundle credit. There is no separate bundle price list — the discount
 * is the only bundle-specific number, so a bundle can never drift from its parts.
 */
export const BUNDLE_CREDIT = 0.15

export function bundleFromCents(productKeys: readonly string[]): number | null {
  let sum = 0
  for (const key of productKeys) {
    const range = priceRangeFor(key)
    if (!range) return null
    sum += range.lowCents
  }
  return Math.round((sum * (1 - BUNDLE_CREDIT)) / 500) * 500
}
