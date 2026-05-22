/**
 * Kealee Platform v30 — shared types (from KEALEE-v30-COMPLETE-MASTER-SPEC.md)
 */

export type V30BotType =
  | 'intake'
  | 'design'
  | 'estimate'
  | 'zoning'
  | 'floorplan'
  | 'permit'
  | 'video'
  | 'contractor'
  | 'sales'
  | 'support'
  | 'project'

export type V30Complexity = 'simple' | 'moderate' | 'complex'
export type V30RiskLevel = 'low' | 'medium' | 'high'
export type V30WorkspaceStage =
  | 'INTAKE'
  | 'DESIGN'
  | 'ESTIMATE'
  | 'PERMITS'
  | 'VIDEO'
  | 'APPROVAL'
  | 'CONSTRUCTION'
  | 'COMPLETION'

export type V30BotExecutionStatus = 'PENDING' | 'EXECUTING' | 'COMPLETE' | 'FAILED'

/** Nine-question intake form (v30 pre-payment flow). */
export interface V30IntakeFormAnswers {
  propertyType: string
  primaryScope: string
  budgetRange: string
  timeline: string
  location: string
  squareFeet: number
  yearBuilt: string
  utilities: { naturalGas?: boolean; waterSewer?: boolean }
  codeConsiderations: string[]
}

export interface V30IntakeAnalysis {
  scopeComplexity: V30Complexity
  riskLevel: V30RiskLevel
  estimatedCost: number
  estimatedDays: number
  suggestedFeatures: string[]
  analysisJson: Record<string, unknown>
}

export interface V30IntakeSubmitInput {
  projectId: string
  userId: string
  answers: V30IntakeFormAnswers
}

export interface V30CustomPackageDraft {
  features: string[]
  basePrice: number
  featureAddons: number
  totalPrice: number
}

export interface V30BotExecutionInput {
  projectId: string
  packageId: string
  botType: V30BotType
  inputData: Record<string, unknown>
}

export interface V30BotExecutionResult {
  botType: V30BotType
  status: V30BotExecutionStatus
  progress: number
  outputData?: Record<string, unknown>
  modelUsed: string
  tokensUsed: number
  costUSD: number
  durationMs: number
  errorMessage?: string
}

export interface V30ParallelGenerationResult {
  projectId: string
  packageId: string
  startedAt: string
  completedAt: string
  executions: V30BotExecutionResult[]
  failedCount: number
  successCount: number
}
