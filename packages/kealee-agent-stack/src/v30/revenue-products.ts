import type { V30BotType } from './types'

export type PropertyIntelligenceDepth = 'basic' | 'project' | 'contractor' | 'development'
export type RevenueProductKey = 'home-project-readiness-review' | 'project-launch-package' | 'contractor-estimate-permit-package' | 'developer-feasibility-express'

export interface RevenueProductDefinition {
  productKey: RevenueProductKey
  name: string
  customerType: 'homeowner' | 'contractor' | 'developer'
  priceCents: number
  stripePriceEnvVar: string
  intakeSchemaId: string
  workflowTemplateId: string
  responsibleAgent: string
  propertyIntelDepth: PropertyIntelligenceDepth
  botTypes: V30BotType[]
  requiredApprovals: string[]
  notificationRuleSetId: string
  fulfillmentSlaHours: number
  slaAnchor: 'payment' | 'intake_complete'
  revisionLimit: number
  exclusions: string[]
  upsellProductIds: RevenueProductKey[]
  dailyCapacity?: number
  aiCostLimitCents: number
}

export const REVENUE_PRODUCTS: Record<RevenueProductKey, RevenueProductDefinition> = {
  'home-project-readiness-review': { productKey: 'home-project-readiness-review', name: 'Home Project Readiness Review', customerType: 'homeowner', priceCents: 29900, stripePriceEnvVar: 'STRIPE_PRICE_HOME_PROJECT_READINESS', intakeSchemaId: 'revenue-home-readiness-v1', workflowTemplateId: 'wf_home_readiness_v1', responsibleAgent: 'owner', propertyIntelDepth: 'basic', botTypes: ['intake', 'estimate', 'zoning', 'project'], requiredApprovals: [], notificationRuleSetId: 'revenue-standard', fulfillmentSlaHours: 48, slaAnchor: 'intake_complete', revisionLimit: 1, exclusions: ['stamped drawings', 'final permit approval', 'construction documents'], upsellProductIds: ['project-launch-package'], aiCostLimitCents: 2500 },
  'project-launch-package': { productKey: 'project-launch-package', name: 'Project Launch Package', customerType: 'homeowner', priceCents: 55000, stripePriceEnvVar: 'STRIPE_PRICE_PROJECT_LAUNCH', intakeSchemaId: 'revenue-project-launch-v1', workflowTemplateId: 'wf_project_launch_v1', responsibleAgent: 'owner', propertyIntelDepth: 'project', botTypes: ['intake', 'design', 'estimate', 'zoning', 'permit', 'contractor', 'project'], requiredApprovals: ['out_of_scope'], notificationRuleSetId: 'revenue-launch', fulfillmentSlaHours: 72, slaAnchor: 'intake_complete', revisionLimit: 1, exclusions: ['stamped drawings', 'permit submission', 'contractor guarantee'], upsellProductIds: [], dailyCapacity: 20, aiCostLimitCents: 5000 },
  'contractor-estimate-permit-package': { productKey: 'contractor-estimate-permit-package', name: 'Contractor Estimate and Permit Package', customerType: 'contractor', priceCents: 79500, stripePriceEnvVar: 'STRIPE_PRICE_CONTRACTOR_ESTIMATE_PERMIT', intakeSchemaId: 'revenue-contractor-estimate-permit-v1', workflowTemplateId: 'wf_contractor_estimate_permit_v1', responsibleAgent: 'contractor', propertyIntelDepth: 'contractor', botTypes: ['intake', 'estimate', 'zoning', 'permit', 'sales', 'project'], requiredApprovals: ['custom_scope', 'professional_services'], notificationRuleSetId: 'revenue-contractor', fulfillmentSlaHours: 72, slaAnchor: 'intake_complete', revisionLimit: 1, exclusions: ['sealed estimate', 'stamped drawings', 'permit approval guarantee', 'final trade pricing'], upsellProductIds: [], dailyCapacity: 12, aiCostLimitCents: 7000 },
  'developer-feasibility-express': { productKey: 'developer-feasibility-express', name: 'Developer Feasibility Express', customerType: 'developer', priceCents: 109500, stripePriceEnvVar: 'STRIPE_PRICE_DEVELOPER_FEASIBILITY_EXPRESS', intakeSchemaId: 'revenue-developer-feasibility-v1', workflowTemplateId: 'wf_developer_feasibility_v1', responsibleAgent: 'developer', propertyIntelDepth: 'development', botTypes: ['intake', 'estimate', 'zoning', 'permit', 'sales', 'project'], requiredApprovals: ['multiple_properties', 'zoning_relief', 'professional_services'], notificationRuleSetId: 'revenue-developer', fulfillmentSlaHours: 96, slaAnchor: 'intake_complete', revisionLimit: 1, exclusions: ['survey', 'environmental report', 'legal opinion', 'entitlement approval', 'stamped drawings'], upsellProductIds: [], dailyCapacity: 8, aiCostLimitCents: 10000 },
}

export function getRevenueProduct(productKey: string): RevenueProductDefinition | undefined {
  return REVENUE_PRODUCTS[productKey as RevenueProductKey]
}

export function isRevenueProductKey(productKey: string): productKey is RevenueProductKey {
  return productKey in REVENUE_PRODUCTS
}
