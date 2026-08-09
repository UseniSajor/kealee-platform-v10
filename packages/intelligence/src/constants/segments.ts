/** Marketing audience segments for MarketingIntelligenceAgent */
export const MARKETING_SEGMENTS = [
  'homeowner_remodel_candidate',
  'adu_candidate',
  'basement_finish_candidate',
  'addition_candidate',
  'permit_help_candidate',
  'investor_renovation_candidate',
  'distressed_property_investor_candidate',
  'commercial_ti_candidate',
  'developer_feasibility_candidate',
  'property_manager_maintenance_candidate',
] as const

export type MarketingSegmentKey = (typeof MARKETING_SEGMENTS)[number]
