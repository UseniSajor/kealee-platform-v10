/**
 * Task Template Types
 */

export type ProjectType = 'KITCHEN' | 'BATHROOM' | 'ADDITION' | 'NEW_CONSTRUCTION' | 'RENOVATION' | 'CUSTOM'
export type WorkflowPhase = 'INITIATION' | 'PLANNING' | 'EXECUTION' | 'MONITORING' | 'CLOSEOUT'

export interface IntegrationPoint {
  module: string // Which Kealee app this interacts with
  action: string // API endpoint to call
  required?: boolean // Whether this integration is required
}

export interface MandatoryTask {
  id: string
  title: string
  description?: string
  estimatedMinutes: number
  dependencies: string[] // Other task IDs that must complete first
  integrationPoints: IntegrationPoint[]
  phase: WorkflowPhase
  complianceRequired?: boolean // Whether compliance checks are required
}

export interface Deliverable {
  type: 'DOCUMENT' | 'REPORT' | 'APPROVAL' | 'INSPECTION'
  template?: string // Document template ID
  trigger: 'TASK_COMPLETION' | 'PHASE_COMPLETION' | 'MILESTONE_COMPLETION'
  taskId?: string // Task that triggers this deliverable
  phase?: WorkflowPhase // Phase that triggers this deliverable
}

export interface TaskTemplate {
  id: string
  name: string
  projectType: ProjectType
  phase: WorkflowPhase
  mandatoryTasks: MandatoryTask[]
  deliverables: Deliverable[]
  description?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskGenerationRequest {
  sowText: string
  projectType: ProjectType
  projectId: string
  phase?: WorkflowPhase
  includeDeliverables?: boolean
}

export interface TaskGenerationResult {
  template: TaskTemplate
  generatedAt: Date
  confidence?: number // AI confidence score (0-1)
  reasoning?: string // AI reasoning for task breakdown
}


