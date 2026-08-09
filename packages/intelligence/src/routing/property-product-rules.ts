import type { KealeeProduct } from '../constants/products.js'
import type { PropertyIntelligenceInput } from '../schemas/property-intelligence.js'

export interface PropertyProductRule {
  id: string
  characteristic: string
  recommendedProduct: KealeeProduct
  bot: string
  priority: number
  match: (ctx: PropertyRoutingContext) => boolean
}

export interface PropertyRoutingContext {
  propertyType?: string
  lotSize?: number
  yearBuilt?: number
  zoning?: Record<string, unknown>
  permitHistory?: Record<string, unknown>[]
  ownershipType?: string
  hasDocuments?: boolean
  hasPlans?: boolean
  permitStatus?: string
  permitApproved?: boolean
  budgetGap?: boolean
  constructionActive?: boolean
  serviceIntent?: string
}

const LARGE_LOT_SQFT = 6000
const OLD_HOME_YEAR = 1985
const STALE_PERMIT_YEARS = 5

function yearsSinceLastPermit(history?: Record<string, unknown>[]): number {
  if (!history?.length) return 99
  const dates = history
    .map((p) => {
      const d = p.date ?? p.issuedDate ?? p.permitDate
      return d ? new Date(String(d)).getFullYear() : NaN
    })
    .filter((y) => !Number.isNaN(y))
  if (!dates.length) return 99
  return new Date().getFullYear() - Math.max(...dates)
}

function isResidentialZoning(zoning?: Record<string, unknown>): boolean {
  const code = String(zoning?.code ?? zoning?.zone ?? '').toLowerCase()
  return (
    code.includes('r-') ||
    code.includes('res') ||
    code.includes('single') ||
    Boolean(zoning?.aduAllowed)
  )
}

/** Predefined property → product routing rules (highest priority wins on tie) */
export const PROPERTY_PRODUCT_RULES: PropertyProductRule[] = [
  {
    id: 'construction_underway',
    characteristic: 'Construction underway',
    recommendedProduct: 'pm_advisory',
    bot: 'PMBot',
    priority: 100,
    match: (ctx) => Boolean(ctx.constructionActive),
  },
  {
    id: 'budget_gap',
    characteristic: 'Budget gap identified',
    recommendedProduct: 'finance_draw_schedule',
    bot: 'FinanceBot',
    priority: 95,
    match: (ctx) => Boolean(ctx.budgetGap),
  },
  {
    id: 'permit_approved',
    characteristic: 'Permit approved',
    recommendedProduct: 'contractor_match',
    bot: 'ContractorBot',
    priority: 90,
    match: (ctx) =>
      ctx.permitApproved === true ||
      ctx.permitStatus === 'approved' ||
      ctx.permitStatus === 'issued',
  },
  {
    id: 'ready_to_build',
    characteristic: 'Ready to build',
    recommendedProduct: 'permit_package',
    bot: 'PermitBot',
    priority: 85,
    match: (ctx) =>
      ctx.permitStatus === 'ready_to_file' ||
      (Boolean(ctx.hasPlans) && ctx.serviceIntent?.toLowerCase().includes('permit') === true),
  },
  {
    id: 'plans_uploaded',
    characteristic: 'Existing plans uploaded',
    recommendedProduct: 'permit_package',
    bot: 'PermitBot',
    priority: 80,
    match: (ctx) => Boolean(ctx.hasDocuments || ctx.hasPlans),
  },
  {
    id: 'large_lot_adu',
    characteristic: 'Large lot, residential zoning',
    recommendedProduct: 'adu_feasibility',
    bot: 'DesignLandBot',
    priority: 75,
    match: (ctx) =>
      (ctx.lotSize ?? 0) >= LARGE_LOT_SQFT &&
      isResidentialZoning(ctx.zoning) &&
      (ctx.propertyType?.includes('single') ?? true),
  },
  {
    id: 'older_home_kitchen',
    characteristic: 'Older home, no permits in years',
    recommendedProduct: 'kitchen_bath_remodel',
    bot: 'DesignBot',
    priority: 70,
    match: (ctx) => {
      const old = (ctx.yearBuilt ?? 9999) < OLD_HOME_YEAR
      const stalePermits = yearsSinceLastPermit(ctx.permitHistory) >= STALE_PERMIT_YEARS
      return old && stalePermits
    },
  },
  {
    id: 'service_permit',
    characteristic: 'Permit help requested',
    recommendedProduct: 'permit_package',
    bot: 'PermitBot',
    priority: 88,
    match: (ctx) => ctx.serviceIntent?.toLowerCase().includes('permit') === true,
  },
  {
    id: 'service_estimate',
    characteristic: 'Estimate requested',
    recommendedProduct: 'design_concept_validation',
    bot: 'DesignBot',
    priority: 82,
    match: (ctx) => ctx.serviceIntent?.toLowerCase().includes('estimate') === true,
  },
  {
    id: 'developer_multi',
    characteristic: 'Multi-family or developer property',
    recommendedProduct: 'developer_feasibility',
    bot: 'DeveloperBot',
    priority: 78,
    match: (ctx) =>
      ctx.propertyType?.includes('multi') === true ||
      ctx.propertyType?.includes('commercial') === true,
  },
  {
    id: 'investor_owned',
    characteristic: 'Investor-owned property',
    recommendedProduct: 'investor_renovation_package',
    bot: 'EstimateBot',
    priority: 72,
    match: (ctx) => ctx.ownershipType?.toLowerCase().includes('investor') === true,
  },
]

export function buildRoutingContext(
  input: PropertyIntelligenceInput,
  extras?: Partial<PropertyRoutingContext>,
): PropertyRoutingContext {
  return {
    propertyType: input.propertyType,
    lotSize: input.lotSize,
    yearBuilt: input.yearBuilt,
    zoning: input.zoning,
    permitHistory: input.permitHistory,
    ownershipType: input.ownershipType,
    serviceIntent: input.serviceIntent,
    ...extras,
  }
}

export function routePropertyToProducts(ctx: PropertyRoutingContext): {
  primaryProduct: KealeeProduct
  matchedRules: PropertyProductRule[]
  allRecommended: KealeeProduct[]
} {
  const matched = PROPERTY_PRODUCT_RULES.filter((r) => r.match(ctx)).sort(
    (a, b) => b.priority - a.priority,
  )

  const allRecommended = matched.map((r) => r.recommendedProduct)
  const primaryProduct = matched[0]?.recommendedProduct ?? 'design_concept_validation'

  return {
    primaryProduct,
    matchedRules: matched,
    allRecommended: [...new Set(allRecommended)],
  }
}
