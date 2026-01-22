/**
 * Workflow Engine Types
 */

export type ModuleName = 
  | 'm-project-owner'
  | 'm-permits-inspections'
  | 'm-finance-trust'
  | 'm-marketplace'
  | 'os-pm'
  | 'm-ops-services'

export type CheckType =
  | 'SOW_VALIDATED'
  | 'PERMIT_APPLIED'
  | 'PERMIT_APPROVED'
  | 'ESCROW_FUNDED'
  | 'ESCROW_RELEASED'
  | 'CONTRACTOR_ASSIGNED'
  | 'RESOURCE_ALLOCATED'
  | 'SCHEDULE_APPROVED'
  | 'BUDGET_VERIFIED'
  | 'CLIENT_SIGNED_CONTRACT'
  | 'INSPECTION_PASSED'
  | 'MILESTONE_COMPLETED'

export interface MandatoryCheck {
  check: CheckType
  module: ModuleName
  description?: string
}

export interface CheckResult {
  check: CheckType
  module: ModuleName
  passed: boolean
  message?: string
  data?: any
  timestamp: Date
}

export interface WorkflowGate {
  id: string
  condition: 'ALL_MANDATORY_COMPLETE' | 'ANY_MANDATORY_COMPLETE' | 'CUSTOM'
  customCondition?: (results: CheckResult[]) => boolean
  description?: string
}

export interface PhaseConfig {
  mandatory: MandatoryCheck[]
  gates: WorkflowGate[]
  description?: string
}

export type WorkflowPhase = 'INITIATION' | 'PLANNING' | 'EXECUTION' | 'MONITORING' | 'CLOSEOUT'

export interface WorkflowStatus {
  phase: WorkflowPhase
  projectId: string
  checks: CheckResult[]
  gates: Array<{
    gate: WorkflowGate
    passed: boolean
    message?: string
  }>
  canProceed: boolean
  blockers: string[]
  warnings: string[]
  lastUpdated: Date
}




