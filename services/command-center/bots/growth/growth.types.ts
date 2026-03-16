/**
 * services/command-center/bots/growth/growth.types.ts
 *
 * All types, interfaces, and DTOs for GrowthBot.
 */

// ─── Raw data inputs from DB queries ──────────────────────────────────────────

export interface TradeDemandRow {
  trade: string           // CSI division or trade label
  openProjectCount: number
  totalProjectValue: number
  medianProjectValue: number
  unfilledAssignmentCount: number
  expiredAssignmentCount: number
  avgDaysUnfilled: number
}

export interface TradeSupplyRow {
  trade: string
  totalContractors: number
  verifiedContractors: number  // ELIGIBLE in RotationQueueEntry
  activeContractors: number    // responded to lead in last 30 days
  avgResponseRateDays: number
  inactiveContractors: number  // 0 activity in last 60 days
}

export interface GeoRow {
  state: string
  city?: string
  county?: string
  openProjectCount: number
  unfilledProjectCount: number
  verifiedContractorCount: number
  expiredAssignmentCount: number
  medianProjectValue: number
}

export interface AssignmentBacklogRow {
  trade: string
  state: string
  city?: string
  queueDepth: number             // PENDING assignments in queue
  oldestUnfilledDays: number     // days since oldest open assignment
  avgExpiryHoursRemaining: number
}

// ─── Scoring outputs ───────────────────────────────────────────────────────────

export interface TradeScore {
  trade: string
  shortageScore: number         // 0-100 (100 = critical shortage)
  surplusScore: number          // 0-100 (100 = severe oversupply)
  demand: TradeDemandRow
  supply: TradeSupplyRow
  backlogRisk: number           // 0-100
  matchingUrgency: number       // 0-100
  recruitmentPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  demandGenPriority:   'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  computedAt: string
}

export interface GeoScore {
  key: string                   // e.g. 'TX:Austin' or 'CA'
  state: string
  city?: string
  shortageScore: number         // 0-100
  surplusScore: number          // 0-100
  unfilledCount: number
  verifiedSupplyCount: number
  recruitmentPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  computedAt: string
}

export interface ContractorInactivityScore {
  profileId: string
  userId: string
  businessName?: string
  email?: string
  inactivityRiskScore: number   // 0-100
  daysSinceLastActivity: number
  expiredAssignmentRate: number // 0-1
  responseRate: number          // 0-1
  atRiskOfChurn: boolean
}

export interface BacklogRiskScore {
  trade: string
  state: string
  backlogScore: number          // 0-100
  queueDepth: number
  oldestUnfilledDays: number
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

// ─── GrowthBot analysis output ────────────────────────────────────────────────

export interface GrowthAnalysis {
  runId: string
  computedAt: string
  tradeScores: TradeScore[]
  geoScores: GeoScore[]
  backlogRisks: BacklogRiskScore[]
  inactiveContractors: ContractorInactivityScore[]
  recommendations: GrowthRecommendation[]
  dashboardMetrics: GrowthDashboardMetrics
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export type RecommendationType =
  | 'RECRUIT_TRADE'
  | 'RECRUIT_REGION'
  | 'DEMAND_GEN_TRADE'
  | 'DEMAND_GEN_REGION'
  | 'REACTIVATE_CONTRACTOR'
  | 'FILL_BACKLOG'
  | 'INTERNAL_ALERT'

export interface GrowthRecommendation {
  id: string
  type: RecommendationType
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string
  targetTrade?: string
  targetGeo?: string
  targetProfileIds?: string[]
  score: number                 // driving score (0-100)
  suggestedActions: SuggestedAction[]
  autoExecute: boolean          // false = human reviews before launch
  createdAt: string
}

export type SuggestedActionType =
  | 'CRM_TAG'
  | 'CRM_WORKFLOW_ENROLL'
  | 'SENDGRID_SEQUENCE'
  | 'TWILIO_SMS'
  | 'INTERNAL_SLACK_ALERT'
  | 'DASHBOARD_FLAG'

export interface SuggestedAction {
  type: SuggestedActionType
  target?: string               // email, phone, contact ID, workflow ID
  params: Record<string, unknown>
  requiresApproval: boolean
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

export interface GrowthDashboardMetrics {
  // Supply
  totalVerifiedContractors: number
  activeContractorsByTrade: Record<string, number>
  activeContractorsByRegion: Record<string, number>
  churnRiskContractorCount: number

  // Demand
  totalOpenProjects: number
  openProjectsByTrade: Record<string, number>
  unfilledProjectsByRegion: Record<string, number>

  // Marketplace health
  assignmentExpirationRate: number    // 0-1 (last 30 days)
  avgDaysToFill: number
  overallLiquidityScore: number       // 0-100

  // Priority lists
  recruitmentPriorityList: RecruitmentPriorityItem[]
  demandGenPriorityList: DemandGenPriorityItem[]

  computedAt: string
}

export interface RecruitmentPriorityItem {
  rank: number
  trade: string
  geo?: string
  shortageScore: number
  unfilledCount: number
  reason: string
}

export interface DemandGenPriorityItem {
  rank: number
  trade?: string
  geo?: string
  surplusScore: number
  idleContractorCount: number
  reason: string
}

// ─── GrowthBot event payloads ─────────────────────────────────────────────────

export interface GrowthBotEventPayload {
  runId: string
  analysis?: GrowthAnalysis
  recommendation?: GrowthRecommendation
  trade?: string
  geo?: string
  score?: number
  message?: string
}
