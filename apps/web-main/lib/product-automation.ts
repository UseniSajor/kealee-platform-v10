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

/**
 * Single source of truth for legacy/public project-path products. Consumers
 * should resolve through `resolveProductAutomationRoute`; this export exists
 * for audits and tooling and must remain read-only at runtime.
 */
export const CANONICAL_PRODUCT_WORKFLOWS: Readonly<Record<string, ProductAutomationRoute>> = {
  bathroom_remodel: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  kitchen_remodel: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  interior_renovation: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  interior_reno_concept: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  exterior_concept: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  garden_concept: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
  addition_expansion: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
    workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
    propertyIntelligenceDepth: 'project',
  },
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
  // Site-plan products intentionally do not appear here. They are owned by
  // the deterministic spatial-engine workflow (siteplan.* jobs), which draws
  // dimensionally true vector sheets from authoritative GIS and survey data.
  // Sending the base package through the V30 bot fleet can reach concept
  // rendering and Replicate, which is neither needed nor purchased here.
  // A separately purchased video_presentation / interactive_walk add-on is
  // produced later through /api/concept/video after entitlement is checked.
  whole_home_concept: {
    fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
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
  return input.projectPath ? CANONICAL_PRODUCT_WORKFLOWS[input.projectPath] : undefined
}
