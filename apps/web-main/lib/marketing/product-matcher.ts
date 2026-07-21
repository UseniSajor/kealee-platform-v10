export const REVENUE_PRODUCT_KEYS = {
  HOME_PROJECT_READINESS: 'home-project-readiness-review',
  PROJECT_LAUNCH: 'project-launch-package',
  CONTRACTOR_ESTIMATE_PERMIT: 'contractor-estimate-permit-package',
  DEVELOPER_FEASIBILITY: 'developer-feasibility-express',
} as const

export type RevenueProductKey = typeof REVENUE_PRODUCT_KEYS[keyof typeof REVENUE_PRODUCT_KEYS]

export interface ProductMatchInput {
  customerType?: string
  projectType?: string
  projectComplexity?: 'low' | 'standard' | 'high' | 'unknown'
  requiredDeliverables?: string[]
  budget?: number
  timeline?: string
  geography?: string
  propertyCount?: number
  requiresStampedDocuments?: boolean
  requiresFinalProfessionalApproval?: boolean
  customScope?: boolean
}

export interface ProductMatchResult {
  recommendedProductIds: RevenueProductKey[]
  reasons: string[]
  eligibleForExpress: boolean
  requiresHumanReview: boolean
  exclusionReasons: string[]
}

export function matchRevenueProducts(input: ProductMatchInput): ProductMatchResult {
  const customerType = input.customerType?.trim().toLowerCase() ?? ''
  const deliverables = new Set((input.requiredDeliverables ?? []).map((item) => item.toLowerCase()))
  const exclusionReasons: string[] = []

  if ((input.propertyCount ?? 1) > 1) exclusionReasons.push('Multiple properties require custom scope review')
  if (input.requiresStampedDocuments) exclusionReasons.push('Stamped professional documents are outside express scope')
  if (input.requiresFinalProfessionalApproval) exclusionReasons.push('Final professional approval is outside express scope')
  if (input.customScope) exclusionReasons.push('Custom scope requires human review')
  if (input.projectComplexity === 'high') exclusionReasons.push('High-complexity projects require human review')

  const eligibleForExpress = exclusionReasons.length === 0
  const recommended: RevenueProductKey[] = []
  const reasons: string[] = []

  if (/developer|investor|builder|landowner/.test(customerType)) {
    recommended.push(REVENUE_PRODUCT_KEYS.DEVELOPER_FEASIBILITY)
    reasons.push('Customer type indicates development or acquisition feasibility needs')
  } else if (/contractor|remodeler|home builder|trade/.test(customerType)) {
    recommended.push(REVENUE_PRODUCT_KEYS.CONTRACTOR_ESTIMATE_PERMIT)
    reasons.push('Customer type indicates contractor preconstruction support')
  } else if (
    deliverables.has('project workspace') ||
    deliverables.has('procurement checklist') ||
    /ready|launch|start/.test(input.timeline?.toLowerCase() ?? '')
  ) {
    recommended.push(REVENUE_PRODUCT_KEYS.PROJECT_LAUNCH)
    reasons.push('Requested readiness and launch deliverables align with the launch package')
  } else {
    recommended.push(REVENUE_PRODUCT_KEYS.HOME_PROJECT_READINESS)
    reasons.push('Project is best served by an initial readiness and risk review')
  }

  return {
    recommendedProductIds: recommended,
    reasons,
    eligibleForExpress,
    requiresHumanReview: !eligibleForExpress || !customerType,
    exclusionReasons,
  }
}

