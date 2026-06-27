import type { PropertyIntelligenceService } from '../services/interfaces.js'
import type { PropertyIntelligenceInput, PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import type { KealeeProduct } from '../constants/products.js'
import { routePropertyToProducts, buildRoutingContext } from '../routing/property-product-rules.js'

function inferProducts(input: PropertyIntelligenceInput, leadService?: string): KealeeProduct[] {
  const products: KealeeProduct[] = []
  const type = (input.propertyType ?? '').toLowerCase()
  const zoning = input.zoning as { aduAllowed?: boolean; code?: string } | undefined
  const service = leadService?.toLowerCase() ?? ''
  const permits = input.permitHistory?.length ?? 0

  if (service.includes('permit') || permits > 0) {
    products.push('permit_package')
  }
  if (zoning?.aduAllowed || (service.includes('adu') && type.includes('single'))) {
    products.push('adu_feasibility')
  }
  if (type.includes('multi') || type.includes('commercial')) {
    products.push('developer_feasibility')
    products.push('commercial_tenant_improvement')
  }
  if (input.ownershipType?.toLowerCase().includes('investor')) {
    products.push('investor_renovation_package')
    products.push('contractor_match')
  }
  if (type.includes('single') || type.includes('town')) {
    products.push('kitchen_bath_remodel')
    products.push('design_concept_validation')
  } else if (type.includes('condo')) {
    products.push('design_concept_validation')
  }
  if (products.length === 0) {
    products.push('design_concept_validation', 'estimate_detailed')
  }
  return [...new Set(products)]
}

function dataQuality(input: PropertyIntelligenceInput, context: ContextBuilderPayload): number {
  let score = 0.4
  if (input.address) score += 0.15
  if (input.parcelId) score += 0.1
  if (input.propertyType) score += 0.1
  if (input.zoning) score += 0.1
  if (input.buildingSquareFootage) score += 0.05
  if (context.parcelData) score += 0.05
  if (context.permitData?.length) score += 0.05
  return Math.min(1, score)
}

export class RuleBasedPropertyIntelligenceService implements PropertyIntelligenceService {
  async analyze(input: PropertyIntelligenceInput, context: ContextBuilderPayload): Promise<PropertyIntelligenceOutput> {
    const propertyType = input.propertyType ?? 'unknown'
    const ownershipType = input.ownershipType ?? (input.ownerOccupancy ? 'owner_occupied' : 'unknown')
    const ruleRoute = routePropertyToProducts(
      buildRoutingContext(input, {
        hasDocuments: Boolean(input.priorKealeeInteractions?.length),
      }),
    )
    const ruleProducts = ruleRoute.allRecommended
    const inferred = inferProducts(input, input.serviceIntent)
    const products = [...new Set([...ruleProducts, ...inferred])] as KealeeProduct[]
    const permitRisk = (input.permitHistory?.length ?? 0) > 2 ? 'medium' : 'low'
    const zoningRisk = input.zoning ? 'low' : 'medium'
    const dq = dataQuality(input, context)

    return {
      propertySummary: `${propertyType.replace(/_/g, ' ')} at ${input.address}. Ownership: ${ownershipType}.`,
      propertyType,
      ownershipType,
      likelyUseCases: products.slice(0, 3).map((p) => p.replace(/_/g, ' ')),
      developmentPotential: propertyType.includes('multi') ? 'high' : 'medium',
      renovationPotential: propertyType.includes('single') || propertyType.includes('town') ? 'high' : 'medium',
      permitRisk,
      zoningRisk,
      physicalRisk: (input.yearBuilt ?? 9999) < 1950 ? 'medium' : 'low',
      dataQualityScore: dq,
      recommendedKealeeProducts: products,
      digitalTwinUpdates: [
        { field: 'propertyType', value: propertyType },
        { field: 'recommendedProducts', value: products },
      ],
      nextActions: [{ action: 'run_opportunity_scoring', priority: 'high' }],
      confidenceScore: Math.min(0.95, 0.65 + dq * 0.3),
      requiresHumanReview: dq < 0.7 || propertyType.includes('multi'),
    }
  }
}

export const ruleBasedPropertyIntelligence = new RuleBasedPropertyIntelligenceService()
