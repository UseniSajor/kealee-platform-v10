import { runZoningBot, type ZoningRequest, type ZoningResponse } from '@kealee/core-rules'
import type { PropertyIntelligenceDepth } from './revenue-product-catalog'

export const DEPTH_REQUIREMENTS: Record<PropertyIntelligenceDepth, string[]> = {
  basic: ['jurisdiction', 'zoning district', 'permit categories', 'headline risks'],
  project: ['basic fields', 'setbacks', 'FAR', 'project-specific constraints', 'permit roadmap'],
  contractor: ['project fields', 'trade permits', 'inspection sequence', 'proposal assumptions', 'customer-facing scope exclusions'],
  development: ['contractor fields', 'allowed uses', 'density and bulk', 'entitlement path', 'approval dependencies', 'development risk register'],
}

export async function runRevenueZoningBot(
  request: ZoningRequest,
  depth: PropertyIntelligenceDepth,
): Promise<ZoningResponse & { propertyIntelligenceDepth: PropertyIntelligenceDepth; depthRequirements: string[] }> {
  const response = await runZoningBot({
    ...request,
    projectType: request.projectType,
  })
  return { ...response, propertyIntelligenceDepth: depth, depthRequirements: DEPTH_REQUIREMENTS[depth] }
}

