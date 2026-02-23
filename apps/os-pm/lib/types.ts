export interface PMClient {
  id: string
  name: string
  email: string
  phone?: string | null
  packageTier: "A" | "B" | "C" | "D"
  packagePrice: number
  status: "active" | "inactive"
  activeProjects: number
  openTasks: number
  lastContact: string
}

export interface PMTask {
  id: string
  clientId: string
  projectId?: string | null
  title: string
  description?: string | null
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  dueDate?: string | null
  createdAt?: string | null
  estimatedTime?: number | null
  actualTime?: number | null
  assignedTo: string
}

export interface PMProject {
  id: string
  name: string
  clientId: string
  category: string
  status: string
  progress: number
  budget: number
  spent: number
  startDate: string
  endDate?: string | null
  currentPhase: string
  nextMilestone: string
}

export interface PMDocument {
  id: string
  name: string
  category: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  uploadedBy: string
  tags: string[]
}

export interface PMPhoto {
  id: string
  fileUrl: string
  thumbnailUrl: string
  caption?: string | null
  category: string
  takenAt: string
  location?: string | null
  gpsLatitude?: number | null
  gpsLongitude?: number | null
}

export interface PMBudgetSummary {
  totalBudget: number
  totalSpent: number
  totalCommitted: number
  remaining: number
  percentSpent: number
  categories: {
    labor: { budget: number; spent: number; committed: number }
    materials: { budget: number; spent: number; committed: number }
    permits: { budget: number; spent: number; committed: number }
    contingency: { budget: number; spent: number; committed: number }
  }
}

export interface PMPermit {
  id: string
  permitNumber: string
  type: string
  status: string
  issuedDate?: string | null
  expiresDate?: string | null
  requiredInspections: {
    type: string
    status: "pending" | "scheduled" | "passed" | "failed"
    scheduledDate?: string | null
    result?: string | null
  }[]
}

// PM Productivity Dashboard Types
export interface PMDashboard {
  // Productivity Pulse (real-time metrics)
  productivityScore: number // 0-100 based on SOP adherence
  activeHoursToday: number
  focusTimeRemaining: number
  
  // Compliance Integration
  complianceScore: {
    sopAdherence: number // From completed SOP steps
    gateCompliance: number // From mandatory gates
    auditScore: number // From audit logs
  }
  
  // Workload from all profit centers
  workload: {
    gcProjects: number // From m-ops-services
    homeownerProjects: number // From m-project-owner
    permitsPending: number // From m-permits-inspections
    escrowReleases: number // From m-finance-trust
  }
  
  // Priority Queue (auto-assigned based on rules)
  priorityTasks: Array<{
    id: string
    title: string
    source: 'GC' | 'Homeowner' | 'Permit' | 'Escrow'
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    dueTime: string
    estimatedEffort: number // in minutes
  }>
}

// SOP Types
export interface SOPStepExecution {
  id: string
  stepId: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
  completedBy: string | null
  completedAt: string | null
  skipReason: string | null
  notes: string | null
  evidence: unknown | null
  step: {
    id: string
    name: string
    description: string | null
    order: number
    mandatory: boolean
    estimatedMinutes: number | null
    requiredIntegration: string | null
    dependencies: string[]
    metadata: unknown | null
  }
}

export interface SOPPhaseExecution {
  id: string
  name: string
  description: string | null
  order: number
  entryCondition: string | null
  exitCondition: string | null
  steps: SOPStepExecution[]
}

export interface SOPExecution {
  id: string
  templateId: string
  projectId: string
  status: "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "CANCELLED"
  progress: number
  startedAt: string
  completedAt: string | null
  template: {
    id: string
    name: string
    description: string | null
    projectType: string
    phases: SOPPhaseExecution[]
  }
  stepExecutions: SOPStepExecution[]
}

export interface SOPTemplate {
  id: string
  name: string
  description: string | null
  projectType: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  active: boolean
  version: number
  createdAt: string
}

// Re-export shared types
export type {
  LeadStage,
  Lead,
  SalesTaskType,
  SalesTaskStatus,
  SalesOutcome,
  SalesTask,
  ExecutionTier,
} from "@kealee/types"
