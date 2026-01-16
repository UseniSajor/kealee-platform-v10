// ============================================================================
// LEAD PIPELINE TYPES
// ============================================================================

export type LeadStage = "INTAKE" | "QUALIFIED" | "SCOPED" | "QUOTED" | "WON" | "LOST"

export interface Lead {
  id: string
  stage: LeadStage
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  description?: string | null
  estimatedValue?: string | null // Decimal as string
  projectType?: string | null
  assignedSalesRepId?: string | null
  awardedProfileId?: string | null
  projectId?: string | null
  createdAt: string
  updatedAt: string
  stageChangedAt?: string | null
  qualifiedAt?: string | null
  scopedAt?: string | null
  quotedAt?: string | null
  wonAt?: string | null
  lostAt?: string | null
  lostReason?: string | null
  assignedSalesRep?: {
    id: string
    name: string
    email: string
  } | null
  awardedProfile?: {
    id: string
    businessName: string
    user: {
      id: string
      name: string
      email: string
    }
  } | null
  distributedTo?: Array<{
    id: string
    businessName: string
  }>
  quotes?: Array<{
    id: string
    amount: string
    status: string
    submittedAt: string
    profile: {
      id: string
      businessName: string
    }
  }>
}

// ============================================================================
// SALES TASK TYPES
// ============================================================================

export type SalesTaskType = "FOLLOW_UP" | "SCOPE_CALL" | "SITE_VISIT" | "QUOTE_PREP" | "CLOSE"

export type SalesTaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED"

export type SalesOutcome = "CONTACTED" | "NO_RESPONSE" | "QUOTED" | "WON" | "LOST" | "DISQUALIFIED"

export interface SalesTask {
  id: string
  leadId: string
  assignedToUserId: string
  type: SalesTaskType
  status: SalesTaskStatus
  slaDueAt?: string | null
  outcome?: SalesOutcome | null
  notes?: string | null
  startedAt?: string | null
  completedAt?: string | null
  timeSpent?: number | null // Minutes spent on task
  createdAt: string
  updatedAt: string
  lead?: Lead
  assignedTo?: {
    id: string
    name: string
    email: string
  }
}

// ============================================================================
// EXECUTION TIER TYPES
// ============================================================================

export type ExecutionTier = "LOW" | "STANDARD" | "HIGH"

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListLeadsQuery {
  stage?: LeadStage
  estimatedValueMin?: number
  estimatedValueMax?: number
  city?: string
  state?: string
  projectType?: string
  assignedSalesRepId?: string
  limit?: number
  offset?: number
}

export interface ListLeadsResponse {
  leads: Lead[]
  total: number
  limit: number
  offset: number
}

export interface GetLeadResponse {
  lead: Lead
}

export interface UpdateLeadStageRequest {
  stage: LeadStage
}

export interface UpdateLeadStageResponse {
  lead: Lead
}

export interface AssignSalesRepRequest {
  salesRepId: string
}

export interface AssignSalesRepResponse {
  lead: Lead
}

export interface AwardContractorRequest {
  profileId: string
}

export interface AwardContractorResponse {
  lead: Lead
}

export interface CloseLostRequest {
  reason: string
}

export interface CloseLostResponse {
  lead: Lead
}

export interface DistributeLeadRequest {
  distributionCount?: number
}

export interface DistributeLeadResponse {
  success: boolean
  message?: string
  reason?: string
  distributedTo?: Array<{
    id: string
    businessName: string
  }>
}
