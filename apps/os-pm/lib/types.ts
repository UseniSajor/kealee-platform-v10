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