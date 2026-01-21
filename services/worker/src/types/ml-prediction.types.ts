/**
 * ML Prediction Types for Timeline Risk and Resource Allocation
 */

export interface RiskPrediction {
  riskId: string
  riskType: 'TIMELINE_DELAY' | 'BUDGET_OVERRUN' | 'PERMIT_DELAY' | 'WEATHER' | 'RESOURCE_SHORTAGE' | 'COMPLIANCE_ISSUE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  probability: number // 0-1
  estimatedImpact: {
    daysDelay?: number
    costImpact?: number
    description: string
  }
  factors: string[] // Contributing factors
  mitigationSuggestions: Array<{
    action: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedEffort: string // e.g., "2 hours", "1 day"
  }>
  confidence: number // 0-1, AI confidence in prediction
  predictedDate?: Date // When the risk might materialize
}

export interface ResourceSuggestion {
  resourceId: string
  resourceType: 'CONTRACTOR' | 'MATERIAL' | 'EQUIPMENT' | 'PERMIT' | 'INSPECTION'
  name: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendedAction: 'HIRE' | 'RESERVE' | 'ORDER' | 'SCHEDULE' | 'PREPARE'
  timing: {
    earliestStart: Date
    latestStart: Date
    estimatedDuration: number // days
  }
  cost?: {
    estimated: number
    currency: string
  }
  availability?: {
    available: boolean
    availableFrom?: Date
    capacity?: number // percentage
  }
  performance?: {
    rating?: number
    projectsCompleted?: number
    onTimeCompletion?: number // percentage
  }
  confidence: number // 0-1
}

export interface TimelineRiskAnalysis {
  projectId: string
  analyzedAt: Date
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number // 0-100
  predictions: RiskPrediction[]
  timelineProjection: {
    originalEndDate?: Date
    predictedEndDate: Date
    confidence: number
    factors: string[]
  }
  recommendations: string[]
}

export interface ResourceAllocationPlan {
  projectId: string
  phase: string
  analyzedAt: Date
  suggestions: ResourceSuggestion[]
  optimizationScore: number // 0-100
  estimatedCost: number
  estimatedTimeline: number // days
  gaps: Array<{
    resourceType: string
    description: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
  }>
}

export interface MLPredictionJobData {
  type: 'TIMELINE_RISK' | 'RESOURCE_ALLOCATION'
  projectId: string
  phase?: string
  options?: {
    includeHistoricalData?: boolean
    includeContractorData?: boolean
    includePermitHistory?: boolean
  }
  metadata?: {
    userId?: string
    orgId?: string
    priority?: number
  }
}

export interface MLPredictionJobResult {
  success: boolean
  type: 'TIMELINE_RISK' | 'RESOURCE_ALLOCATION'
  projectId: string
  data?: TimelineRiskAnalysis | ResourceAllocationPlan
  error?: string
  processedAt: Date
}

