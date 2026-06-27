/** Canonical v30 intelligence loop types */
export const INTELLIGENCE_LOOP_TYPES = [
  'property_intelligence',
  'marketing_intelligence',
  'opportunity_scoring',
  'campaign_routing',
  'lead_nurture',
  'lead_intelligence',
  'capital_intelligence',
  'project_intelligence',
  'finance_review',
] as const

export type IntelligenceLoopType = (typeof INTELLIGENCE_LOOP_TYPES)[number]

export const INTELLIGENCE_ENGINE_TYPES = [
  'property',
  'opportunity',
  'lead',
  'capital',
  'project',
] as const

export type IntelligenceEngineTypeName = (typeof INTELLIGENCE_ENGINE_TYPES)[number]

export const LOOP_STEP_NAMES = [
  'loop_router',
  'context_builder',
  'agent',
  'output_validator',
  'twin_update',
  'deliverable',
] as const

export type LoopStepName = (typeof LOOP_STEP_NAMES)[number]

export function engineToLoopType(engine: IntelligenceEngineTypeName): IntelligenceLoopType {
  const map: Record<IntelligenceEngineTypeName, IntelligenceLoopType> = {
    property: 'property_intelligence',
    opportunity: 'opportunity_scoring',
    lead: 'lead_intelligence',
    capital: 'capital_intelligence',
    project: 'project_intelligence',
  }
  return map[engine]
}
