import { z } from "zod"

// ----------------------------
// Base API response shapes
// ----------------------------

export type ApiResponse<T> = T & { requestId?: string }

export type ApiListResponse<T> = {
  items: T[]
  requestId?: string
  nextCursor?: string | null
}

export const IdSchema = z.string().min(1)
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Expected ISO date string")

// ----------------------------
// Auth / User
// ----------------------------

export type AuthUser = {
  id: string
  email?: string
  name?: string
  role?: string
}

// ----------------------------
// Clients
// ----------------------------

export type ClientStatus = "active" | "inactive"

export type Client = {
  id: string
  name: string
  email: string
  phone?: string | null
  status: ClientStatus
  activeProjects?: number
  openTasks?: number
  lastContact?: string
}

// ----------------------------
// Projects
// ----------------------------

export type ProjectStatus = "active" | "at_risk" | "on_hold" | "complete"

export type Project = {
  id: string
  clientId: string
  name: string
  status: ProjectStatus
  category?: string
  progress?: number
  startDate?: string | null
  endDate?: string | null
}

export const CreateProjectSchema = z.object({
  clientId: IdSchema,
  name: z.string().min(1),
  status: z.enum(["active", "at_risk", "on_hold", "complete"]).default("active"),
  category: z.string().optional(),
  startDate: IsoDateSchema.optional(),
  endDate: IsoDateSchema.optional(),
})
export type CreateProjectInput = z.input<typeof CreateProjectSchema>

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  clientId: z.string().min(1).optional(),
})
export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>

// ----------------------------
// Timeline
// ----------------------------

export type TimelineTask = {
  id: string
  name: string
  start: string
  end: string
  baselineStart?: string
  baselineEnd?: string
  dependencies?: string[]
  isMilestone?: boolean
}

export type ProjectTimeline = {
  projectId: string
  tasks: TimelineTask[]
  updatedAt?: string
}

export const TimelineTaskSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  start: IsoDateSchema,
  end: IsoDateSchema,
  baselineStart: IsoDateSchema.optional(),
  baselineEnd: IsoDateSchema.optional(),
  dependencies: z.array(IdSchema).optional(),
  isMilestone: z.boolean().optional(),
})

export const ProjectTimelineSchema = z.object({
  projectId: IdSchema,
  tasks: z.array(TimelineTaskSchema),
})

// ----------------------------
// Budget
// ----------------------------

export type BudgetItemStatus = "planned" | "committed" | "invoiced" | "paid"

export type BudgetItem = {
  id: string
  projectId: string
  category: string
  description: string
  planned: number
  actual: number
  vendor?: string | null
  status?: BudgetItemStatus
  date?: string | null
}

export type ProjectBudget = {
  projectId: string
  items: BudgetItem[]
  updatedAt?: string
}

export const BudgetItemSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  category: z.string().min(1),
  description: z.string().min(1),
  planned: z.number().nonnegative(),
  actual: z.number().nonnegative(),
  vendor: z.string().optional(),
  status: z.enum(["planned", "committed", "invoiced", "paid"]).optional(),
  date: IsoDateSchema.optional(),
})

export const ProjectBudgetSchema = z.object({
  projectId: IdSchema,
  items: z.array(BudgetItemSchema),
})

// ----------------------------
// Tasks
// ----------------------------

export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "pending" | "in_progress" | "completed"

export type Task = {
  id: string
  clientId: string
  projectId?: string | null
  title: string
  description?: string | null
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string | null
  createdAt?: string | null
  assignedTo?: string | null
}

export const CreateTaskSchema = z.object({
  clientId: IdSchema,
  projectId: IdSchema.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  dueDate: IsoDateSchema.optional(),
  assignedTo: z.string().optional(),
})
export type CreateTaskInput = z.input<typeof CreateTaskSchema>

export const UpdateTaskSchema = CreateTaskSchema.partial()
export type UpdateTaskInput = z.input<typeof UpdateTaskSchema>

// ----------------------------
// Permits / Inspections
// ----------------------------

export type PermitStatus = "not_started" | "draft" | "submitted" | "in_review" | "approved" | "rejected" | "expired"

export type Permit = {
  id: string
  projectId: string
  type: string
  jurisdiction: string
  status: PermitStatus
  submittedDate?: string | null
  approvedDate?: string | null
  expiresDate?: string | null
}

export type InspectionResult = "pending" | "pass" | "fail"

export type ScheduledInspection = {
  id: string
  projectId: string
  type: string
  date: string
  time?: string | null
  jurisdiction: string
  inspectorName?: string | null
  inspectorPhone?: string | null
  inspectorEmail?: string | null
  result: InspectionResult
}

export const PermitScheduleInspectionSchema = z.object({
  type: z.string().min(1),
  date: IsoDateSchema,
  time: z.string().optional(),
  jurisdiction: z.string().min(1),
  inspectorName: z.string().optional(),
  inspectorPhone: z.string().optional(),
  inspectorEmail: z.string().email().optional(),
})
export type PermitScheduleInspectionInput = z.input<typeof PermitScheduleInspectionSchema>

export type PermitCheckStatusResponse = ApiResponse<{ permit: Permit }>

// ----------------------------
// Documents
// ----------------------------

export type DocumentItem = {
  id: string
  projectId: string
  name: string
  folder?: string | null
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  uploadedBy: string
  url?: string
  version?: number
}

export type DocumentUploadResponse = ApiResponse<{ documents: DocumentItem[] }>

// ----------------------------
// Photos
// ----------------------------

export type PhotoItem = {
  id: string
  projectId: string
  url: string
  thumbnailUrl?: string | null
  caption?: string | null
  category?: string | null
  takenAt: string
  locationText?: string | null
  gpsLatitude?: number | null
  gpsLongitude?: number | null
}

