import { scoreToPriority, type OpportunityPriority } from '../constants/scoring-bands.js'
import type { KealeeProduct } from '../constants/products.js'
import type { ProductScores } from '../schemas/shared.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'

export interface OpportunityModelInput {
  property: PropertyIntelligenceOutput
  marketing?: MarketingIntelligenceOutput
  lead: {
    source?: string
    budget?: number
    timeline?: string
    service?: string
    hasPhoto?: boolean
    hasDocuments?: boolean
  }
}

export interface OpportunityModelResult {
  totalOpportunityScore: number
  productScores: ProductScores
  urgencyScore: number
  revenuePotential: number
  conversionLikelihood: number
  estimatedProjectValue: number
  recommendedPriority: OpportunityPriority
  topProduct: KealeeProduct
  scoreExplanation: string
}

const PRODUCT_WEIGHTS: Record<keyof ProductScores, number> = {
  designConceptScore: 1.0,
  estimateDetailedScore: 1.05,
  permitPackageScore: 1.15,
  contractorMatchScore: 0.85,
  pmAdvisoryScore: 0.8,
  aduFeasibilityScore: 1.05,
  additionFeasibilityScore: 1.0,
  basementFinishScore: 0.9,
  kitchenBathScore: 1.1,
  developerFeasibilityScore: 1.2,
  financeScore: 0.75,
  commercialRenovationScore: 1.1,
  investorServicesScore: 1.05,
}

export const PRODUCT_TO_KEY: Partial<Record<KealeeProduct, keyof ProductScores>> = {
  kitchen_bath_remodel: 'kitchenBathScore',
  design_concept_validation: 'designConceptScore',
  estimate_detailed: 'estimateDetailedScore',
  basement_finish: 'basementFinishScore',
  addition_feasibility: 'additionFeasibilityScore',
  adu_feasibility: 'aduFeasibilityScore',
  permit_package: 'permitPackageScore',
  contractor_match: 'contractorMatchScore',
  pm_advisory: 'pmAdvisoryScore',
  developer_feasibility: 'developerFeasibilityScore',
  finance_draw_schedule: 'financeScore',
  commercial_tenant_improvement: 'commercialRenovationScore',
  investor_renovation_package: 'investorServicesScore',
}

const PRODUCT_KEYS: (keyof ProductScores)[] = Object.keys(PRODUCT_WEIGHTS) as (keyof ProductScores)[]

function leadSignalScore(lead: OpportunityModelInput['lead']): number {
  let s = 0
  switch (lead.source?.toLowerCase()) {
    case 'referral':
      s += 12
      break
    case 'meta':
    case 'facebook':
      s += 10
      break
    case 'google':
      s += 8
      break
    case 'organic':
    case 'web':
      s += 5
      break
    default:
      s += 2
  }
  const budget = lead.budget ?? 0
  if (budget >= 50000) s += 20
  else if (budget >= 30000) s += 15
  else if (budget >= 15000) s += 10
  else if (budget < 2000) s -= 15

  if (lead.timeline === 'asap' || lead.timeline === 'immediately') s += 15
  else if (lead.timeline === '1-2-weeks') s += 12
  else if (lead.timeline === '3plus-months') s -= 8

  if (lead.service?.includes('permit')) s += 12
  else if (lead.service?.includes('estimate')) s += 10
  else if (lead.service?.includes('full')) s += 15
  if (lead.hasDocuments) s += 8
  if (lead.hasPhoto) s += 4
  return s
}

function urgencyFromLead(lead: OpportunityModelInput['lead']): number {
  if (lead.timeline === 'asap' || lead.timeline === 'immediately') return 90
  if (lead.timeline === '1-2-weeks') return 75
  if (lead.timeline === '1-month') return 60
  if (lead.timeline === '2-3-months') return 45
  return 35
}

function buildProductScores(
  products: KealeeProduct[],
  base: number,
): ProductScores {
  const scores = {} as ProductScores
  for (const key of PRODUCT_KEYS) {
    scores[key] = 25
  }
  for (const product of products) {
    const key = PRODUCT_TO_KEY[product]
    if (key) scores[key] = Math.min(100, Math.round(base * (PRODUCT_WEIGHTS[key] ?? 1)))
  }
  return scores
}

function topProductFromScores(scores: ProductScores, fallback: KealeeProduct[]): KealeeProduct {
  let bestKey: keyof ProductScores = 'designConceptScore'
  let best = 0
  for (const key of PRODUCT_KEYS) {
    if (scores[key] > best) {
      best = scores[key]
      bestKey = key
    }
  }
  const reverse = Object.entries(PRODUCT_TO_KEY).find(([, v]) => v === bestKey)
  return (reverse?.[0] as KealeeProduct) ?? fallback[0] ?? 'design_concept_validation'
}

export function computeOpportunityScore(input: OpportunityModelInput): OpportunityModelResult {
  const { property, marketing, lead } = input
  const products = (marketing?.productRouting ?? property.recommendedKealeeProducts) as KealeeProduct[]
  const propertyBase = Math.round(property.confidenceScore * 50 + property.dataQualityScore * 20)
  const leadBoost = leadSignalScore(lead)
  const marketingBoost =
    marketing?.salesPriority === 'immediate' ? 10 : marketing?.salesPriority === 'high' ? 6 : 0
  const total = Math.max(0, Math.min(100, propertyBase + leadBoost + marketingBoost))
  const productScores = buildProductScores(products, total * 0.65)
  const topProduct = topProductFromScores(productScores, products)
  const estimatedProjectValue = lead.budget ?? Math.round(total * 1500)
  const revenuePotential = Math.round(estimatedProjectValue * 0.12)
  const conversionLikelihood = Math.min(
    0.95,
    property.confidenceScore * 0.55 + (leadBoost > 0 ? 0.25 : 0.1) + (marketing ? 0.1 : 0),
  )

  return {
    totalOpportunityScore: total,
    productScores,
    urgencyScore: urgencyFromLead(lead),
    revenuePotential,
    conversionLikelihood,
    estimatedProjectValue,
    recommendedPriority: scoreToPriority(total),
    topProduct,
    scoreExplanation: [
      `Total ${total}/100.`,
      `Property confidence ${property.confidenceScore.toFixed(2)}, data quality ${property.dataQualityScore.toFixed(2)}.`,
      `Lead signals (+${leadBoost}): source=${lead.source ?? 'unknown'}, budget=$${lead.budget ?? 0}.`,
      `Top product: ${topProduct.replace(/_/g, ' ')}.`,
    ].join(' '),
  }
}
