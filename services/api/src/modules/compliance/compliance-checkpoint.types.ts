/**
 * Compliance Checkpoint Types
 */

export type CheckpointType = 'PRE_TASK' | 'POST_TASK' | 'GATE' | 'AUDIT'
export type ValidationSource = 'SOW' | 'SOP' | 'PERMIT' | 'CONTRACT' | 'ESCROW' | 'WORKFLOW'

export interface ValidationCondition {
  source: ValidationSource
  condition: string // e.g., "PERMIT_STATUS == 'APPROVED'"
  message: string // Error message if failed
  blocking: boolean // If true, cannot proceed
  severity?: 'ERROR' | 'WARNING'
}

export interface ModuleChecks {
  permits?: {
    required: boolean
    status: string[] // Required permit statuses
    message?: string
  }
  escrow?: {
    funded: boolean
    minAmount?: number
    message?: string
  }
  contracts?: {
    signed: boolean
    parties: string[] // Required parties that must sign
    message?: string
  }
  workflow?: {
    phase: string
    gatesPassed: boolean
    message?: string
  }
  sop?: {
    stepsCompleted: boolean
    requiredSteps?: string[]
    message?: string
  }
}

export interface ComplianceCheckpoint {
  id: string
  name: string
  type: CheckpointType
  validations: ValidationCondition[]
  moduleChecks: ModuleChecks
  description?: string
  phase?: string
  taskId?: string
}

export interface ComplianceCheckResult {
  checkpointId: string
  passed: boolean
  validations: Array<{
    condition: ValidationCondition
    passed: boolean
    message?: string
    data?: any
  }>
  moduleChecks: {
    permits?: { passed: boolean; message?: string }
    escrow?: { passed: boolean; message?: string }
    contracts?: { passed: boolean; message?: string }
    workflow?: { passed: boolean; message?: string }
    sop?: { passed: boolean; message?: string }
  }
  allPassed: boolean
  blockers: string[]
  warnings: string[]
  timestamp: Date
}
