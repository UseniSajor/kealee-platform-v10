import type { V30BotType } from '@kealee/kealee-agent-stack'
import { getRevenueProduct, type PropertyIntelligenceDepth } from './revenue-product-catalog'

export interface ProductAutomationRoute {
  fulfillmentBotTypes: V30BotType[]
  workflowTemplateId: string
  propertyIntelligenceDepth: PropertyIntelligenceDepth
}

export function mergeFulfillmentFormData(
  existing: Record<string, unknown>,
  fulfillment: Record<string, unknown>,
): Record<string, unknown> {
  return { ...existing, ...fulfillment }
}

const CANONICAL_ROUTES: Record<string, ProductAutomationRoute> = {
  cost_estimate: {
    fulfillmentBotTypes: ['estimate', 'project'],
    workflowTemplateId: 'wf_estimate_v1',
    propertyIntelligenceDepth: 'project',
  },
  certified_estimate: {
    fulfillmentBotTypes: ['estimate', 'project'],
    workflowTemplateId: 'wf_estimate_review_v1',
    propertyIntelligenceDepth: 'contractor',
  },
  permit_path_only: {
    fulfillmentBotTypes: ['zoning', 'permit', 'project'],
    workflowTemplateId: 'wf_permit_roadmap_v1',
    propertyIntelligenceDepth: 'project',
  },
  estimate_permit_bundle: {
    fulfillmentBotTypes: ['estimate', 'zoning', 'permit', 'project'],
    workflowTemplateId: 'wf_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  design_estimate_permit_bundle: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
}

export function resolveProductAutomationRoute(input: {
  source?: string
  productKey?: string
  projectPath?: string
}): ProductAutomationRoute | undefined {
  if (input.source === 'revenue_product') {
    const product = getRevenueProduct(input.productKey ?? '')
    if (!product) return undefined
    return {
      fulfillmentBotTypes: product.botTypes,
      workflowTemplateId: product.workflowTemplateId,
      propertyIntelligenceDepth: product.propertyIntelDepth,
    }
  }
  return input.projectPath ? CANONICAL_ROUTES[input.projectPath] : undefined
}
