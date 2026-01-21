/**
 * SOP (Standard Operating Procedure) Types
 */

export type ProjectType = 'KITCHEN' | 'BATHROOM' | 'ADDITION' | 'NEW_CONSTRUCTION' | 'RENOVATION' | 'CUSTOM'

export type IntegrationModule = 
  | 'm-permits-inspections' 
  | 'm-finance-trust' 
  | 'm-project-owner' 
  | 'm-marketplace'
  | 'm-architect'
  | 'm-engineer'

export interface ValidationRule {
  id: string
  type: 'REQUIRED' | 'MIN_VALUE' | 'MAX_VALUE' | 'PATTERN' | 'CUSTOM'
  field: string
  value?: any
  message: string
  blocking: boolean
}

export interface SOPStep {
  id: string
  name: string
  description?: string
  phaseId: string
  order: number
  requiredIntegration?: IntegrationModule
  validations: ValidationRule[]
  mandatory: boolean
  estimatedMinutes?: number
  dependencies: string[] // Step IDs that must complete first
  metadata?: Record<string, any>
}

export interface SOPPhase {
  id: string
  name: string
  description?: string
  order: number
  steps: SOPStep[]
  entryCondition?: string
  exitCondition?: string
}

export interface PhaseConnection {
  id: string
  from: string // Phase ID
  to: string // Phase ID
  condition?: string
  type: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL'
}

export interface SOPTemplate {
  id: string
  name: string
  description?: string
  projectType: ProjectType
  phases: SOPPhase[]
  connections: PhaseConnection[]
  version: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export const PROJECT_TYPES: Array<{ value: ProjectType; label: string }> = [
  { value: 'KITCHEN', label: 'Kitchen Renovation' },
  { value: 'BATHROOM', label: 'Bathroom Renovation' },
  { value: 'ADDITION', label: 'Home Addition' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction' },
  { value: 'RENOVATION', label: 'General Renovation' },
  { value: 'CUSTOM', label: 'Custom Project' },
]

export const INTEGRATION_MODULES: Array<{ value: IntegrationModule; label: string }> = [
  { value: 'm-permits-inspections', label: 'Permits Module' },
  { value: 'm-finance-trust', label: 'Escrow Module' },
  { value: 'm-project-owner', label: 'Homeowner Approval' },
  { value: 'm-marketplace', label: 'Contractor Assignment' },
  { value: 'm-architect', label: 'Architect Services' },
  { value: 'm-engineer', label: 'Engineering Services' },
]


