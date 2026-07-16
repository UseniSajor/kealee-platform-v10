/**
 * Kealee 5-Day Property-Based Launch Sequence
 *
 * Each day targets a property characteristic (not a person segment).
 * Aligns with PROPERTY_PRODUCT_RULES in @kealee/intelligence — when a
 * PropertyTwin matches criteria, route to the day's campaign + landing page.
 *
 * Wire into GHL/cron by property_twin_id or parcel enrichment tags.
 */

import type { KealeeProduct } from '@kealee/intelligence'
import {
  type PropertyRoutingContext,
  routePropertyToProducts,
} from '@kealee/intelligence'

export interface PropertyLaunchCriteria {
  /** Human-readable property signal */
  characteristic: string
  /** Maps to property-product-rules.ts rule id */
  ruleId: string
  /** Minimum signals for targeting (ads, parcel lists, GIS filters) */
  signals: string[]
  /** Optional numeric thresholds */
  lotSizeMinSqft?: number
  yearBuiltBefore?: number
  permitStaleYears?: number
  propertyTypes?: string[]
  zoningIncludes?: string[]
  ownershipTypes?: string[]
  permitStatuses?: string[]
  requiresDocuments?: boolean
  requiresConstructionActive?: boolean
}

export interface PropertyLaunchSequenceStep {
  day: number
  title: string
  channel: 'email' | 'linkedin' | 'facebook' | 'sms' | 'direct_mail'
  propertyProfile: PropertyLaunchCriteria
  recommendedProduct: KealeeProduct
  bot: string
  objective: string
  subject?: string
  /** Copy references {{address}}, {{lot_size}}, {{year_built}}, {{zoning}} — not persona */
  body: string
  ctaPath: string
  ctaLabel: string
  nurtureSequence: string
  ghlTags: string[]
}

/**
 * Five-day outbound plan — one property archetype per day.
 * Intelligence engine auto-assigns when parcel + intake data matches.
 */
export const FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE: PropertyLaunchSequenceStep[] = [
  {
    day: 1,
    title: 'Large lot · residential zoning → ADU feasibility',
    channel: 'facebook',
    propertyProfile: {
      characteristic: 'Large lot, residential zoning',
      ruleId: 'large_lot_adu',
      signals: ['lot_size >= 6000 sqft', 'residential zoning (jurisdiction-specific)', 'single-family'],
      lotSizeMinSqft: 6000,
      propertyTypes: ['single_family', 'single-family', 'detached'],
      zoningIncludes: ['r-', 'res', 'single', 'r-6', 'r-60', 'r-s'],
    },
    recommendedProduct: 'adu_feasibility',
    bot: 'DesignLandBot',
    objective: 'Reach parcels with ADU potential before owners search for contractors',
    body: `Your property at {{address}} sits on {{lot_size}} sqft in a {{zoning}} zone.

Before you price an ADU, the lot has to qualify. Kealee runs a property-specific feasibility check: setback review, ADU allowance for your parcel, and 3 layout options tied to what your jurisdiction actually approves.

$299 feasibility · credited toward permit drawings.`,
    ctaPath: '/intake/adu',
    ctaLabel: 'Check ADU on this lot',
    nurtureSequence: 'adu_education_21d',
    ghlTags: ['prop-large-lot', 'prop-adu-feasibility', 'launch-d1'],
  },
  {
    day: 2,
    title: 'Older home · stale permit history → kitchen/bath remodel',
    channel: 'email',
    propertyProfile: {
      characteristic: 'Older home, no permits in years',
      ruleId: 'older_home_kitchen',
      signals: ['year_built < 1985', 'no permit filed in 5+ years'],
      yearBuiltBefore: 1985,
      permitStaleYears: 5,
      propertyTypes: ['single_family', 'townhouse', 'duplex'],
    },
    recommendedProduct: 'kitchen_bath_remodel',
    bot: 'DesignBot',
    objective: 'Target aging housing stock with renovation upside and permit friction',
    subject: '{{address}} — what a kitchen remodel actually requires in your jurisdiction',
    body: `Built in {{year_built}}, {{address}} has not had a major permit on record in {{permit_stale_years}}+ years.

That usually means layout, electrical, and scope questions were never resolved with the county. Kealee produces 3 kitchen/bath layout options with permit scope and a cost range — specific to this property, not a generic template.

$299 design concept · credited toward permit package.`,
    ctaPath: '/intake/kitchen_remodel',
    ctaLabel: 'Get layouts for this home',
    nurtureSequence: 'kitchen_remodel_14d',
    ghlTags: ['prop-older-home', 'prop-stale-permits', 'launch-d2'],
  },
  {
    day: 3,
    title: 'Plans on file → permit-ready package',
    channel: 'linkedin',
    propertyProfile: {
      characteristic: 'Existing plans uploaded',
      ruleId: 'plans_uploaded',
      signals: ['has_plans or has_documents'],
      requiresDocuments: true,
      propertyTypes: ['single_family', 'townhouse', 'multifamily', 'commercial'],
    },
    recommendedProduct: 'permit_package',
    bot: 'PermitBot',
    objective: 'Move properties with scope artifacts to permit-ready drawings + filing',
    body: `Properties with existing plans at {{address}} are ready for the permit path.

Kealee converts your scope into permit-ready professional drawings and files with your jurisdiction — RSMeans estimate included with your design package, not sold separately.

Start with professional drawings or full permit filing for this address.`,
    ctaPath: '/intake/professional_drawings',
    ctaLabel: 'Get permit-ready drawings',
    nurtureSequence: 'permit_status_7d',
    ghlTags: ['prop-has-plans', 'prop-permit-ready', 'launch-d3'],
  },
  {
    day: 4,
    title: 'Permit approved or ready to file → permit + contractor path',
    channel: 'sms',
    propertyProfile: {
      characteristic: 'Permit approved or ready to build',
      ruleId: 'permit_approved',
      signals: ['permit_status approved/issued', 'or ready_to_file with plans'],
      permitStatuses: ['approved', 'issued', 'ready_to_file'],
    },
    recommendedProduct: 'contractor_match',
    bot: 'ContractorBot',
    objective: 'Move permitted properties into vetted contractor bidding',
    body: `Kealee: permit activity detected for {{address}} (status: {{permit_status}}). This property is ready for contractor bids on an approved scope. Match vetted DMV contractors: {{cta_short_link}} Reply STOP to opt out.`,
    ctaPath: '/marketplace',
    ctaLabel: 'Get contractor bids',
    nurtureSequence: 'contractor_bid_14d',
    ghlTags: ['prop-permit-approved', 'prop-ready-to-build', 'launch-d4'],
  },
  {
    day: 5,
    title: 'Investor / multi-family / developer parcel → feasibility package',
    channel: 'email',
    propertyProfile: {
      characteristic: 'Investor-owned or multi-family/commercial',
      ruleId: 'investor_owned',
      signals: ['ownership investor/LLC', 'or property_type multi/commercial'],
      propertyTypes: ['multifamily', 'multi_family', 'commercial', 'duplex'],
      ownershipTypes: ['investor', 'llc', 'trust'],
    },
    recommendedProduct: 'developer_feasibility',
    bot: 'DeveloperBot',
    objective: 'Capture non-owner-occupied and development parcels at higher ACV',
    subject: 'Feasibility study for {{address}} — zoning + unit count + permit path',
    body: `{{address}} is flagged as {{property_type}} / {{ownership_type}}.

Developer and investor properties need a different workflow than single-family remodels: zoning capacity, unit count, entitlement risk, and permit sequencing.

Kealee's feasibility study covers parcel constraints, approval timeline, and scope options for this specific site.

$995 feasibility study · includes permit path summary.`,
    ctaPath: '/concept-engine/developer',
    ctaLabel: 'Request site feasibility',
    nurtureSequence: 'developer_outreach_10d',
    ghlTags: ['prop-investor', 'prop-multifamily', 'launch-d5'],
  },
]

/** @deprecated Use FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE — person-audience fields removed */
export const FIVE_DAY_LAUNCH_SEQUENCE = FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE

export function getPropertyLaunchStep(day: number): PropertyLaunchSequenceStep | undefined {
  return FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.find((s) => s.day === day)
}

export function getLaunchStep(day: number): PropertyLaunchSequenceStep | undefined {
  return getPropertyLaunchStep(day)
}

/** Pick the best launch day for a property context (highest-priority matched rule). */
export function launchDayForProperty(ctx: PropertyRoutingContext): PropertyLaunchSequenceStep | null {
  const { matchedRules } = routePropertyToProducts(ctx)
  if (!matchedRules.length) {
    return FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.find((s) => s.day === 1) ?? null
  }
  const topRuleId = matchedRules[0].id
  return (
    FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.find((s) => s.propertyProfile.ruleId === topRuleId) ??
    FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.find(
      (s) => s.recommendedProduct === matchedRules[0].recommendedProduct,
    ) ??
    null
  )
}

export function sequenceStepsForRule(ruleId: string): PropertyLaunchSequenceStep[] {
  return FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.filter((s) => s.propertyProfile.ruleId === ruleId)
}

export function sequenceStepsForProduct(product: KealeeProduct): PropertyLaunchSequenceStep[] {
  return FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE.filter((s) => s.recommendedProduct === product)
}

/** @deprecated Person-audience filter removed — use sequenceStepsForRule or launchDayForProperty */
export function sequenceStepsForAudience(): PropertyLaunchSequenceStep[] {
  return FIVE_DAY_PROPERTY_LAUNCH_SEQUENCE
}
