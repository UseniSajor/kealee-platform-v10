export type FunnelUserType = 'HOMEOWNER' | 'CONTRACTOR' | 'ARCHITECT' | 'INVESTOR' | 'PROPERTY_MANAGER'
export type FunnelProjectType = 'KITCHEN_REMODEL' | 'BATHROOM_REMODEL' | 'WHOLE_HOME' | 'ADDITION' | 'NEW_CONSTRUCTION' | 'EXTERIOR' | 'LANDSCAPING' | 'COMMERCIAL'
export type BudgetRange = 'UNDER_25K' | 'RANGE_25K_50K' | 'RANGE_50K_100K' | 'RANGE_100K_250K' | 'OVER_250K'
export type FunnelTimeline = 'ASAP' | 'ONE_TO_THREE_MONTHS' | 'THREE_TO_SIX_MONTHS' | 'SIX_TO_TWELVE_MONTHS' | 'JUST_EXPLORING'

export interface FunnelSessionData {
  sessionId: string | null
  userType: FunnelUserType | null
  projectType: FunnelProjectType | null
  city: string
  state: string
  budget: BudgetRange | null
  timeline: FunnelTimeline | null
}

export interface FunnelStep {
  id: number
  title: string
  field: keyof Omit<FunnelSessionData, 'sessionId'>
}

export const TOTAL_STEPS = 5
