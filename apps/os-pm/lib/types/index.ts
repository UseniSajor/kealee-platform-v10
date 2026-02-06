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

// ----------------------------
// RFIs
// ----------------------------

export type RFIStatus = "DRAFT" | "OPEN" | "PENDING_REVIEW" | "ANSWERED" | "CLOSED" | "VOID"
export type RFIPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export type RFIItem = {
  id: string
  projectId: string
  number: number
  subject: string
  question: string
  answer?: string | null
  status: RFIStatus
  priority: RFIPriority
  createdById: string
  assignedToId?: string | null
  answeredById?: string | null
  dueDate?: string | null
  answeredAt?: string | null
  closedAt?: string | null
  costImpact?: number | null
  scheduleImpact?: number | null
  drawingRef?: string | null
  specSection?: string | null
  location?: string | null
  createdAt: string
  updatedAt: string
}

export const CreateRFISchema = z.object({
  projectId: IdSchema,
  subject: z.string().min(1),
  question: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedToId: z.string().optional(),
  dueDate: IsoDateSchema.optional(),
  drawingRef: z.string().optional(),
  specSection: z.string().optional(),
  location: z.string().optional(),
})
export type CreateRFIInput = z.input<typeof CreateRFISchema>

// ----------------------------
// Submittals
// ----------------------------

export type SubmittalStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "APPROVED_AS_NOTED" | "REJECTED" | "RESUBMIT" | "CLOSED"
export type SubmittalType = "SHOP_DRAWING" | "PRODUCT_DATA" | "SAMPLE" | "MOCK_UP" | "DESIGN_MIX" | "TEST_REPORT" | "CERTIFICATE" | "OPERATION_MANUAL" | "WARRANTY" | "OTHER"

export type SubmittalItem = {
  id: string
  projectId: string
  number: number
  title: string
  description?: string | null
  status: SubmittalStatus
  type: SubmittalType
  specSection?: string | null
  submittedById?: string | null
  reviewerId?: string | null
  subcontractorId?: string | null
  submitDate?: string | null
  dueDate?: string | null
  reviewedDate?: string | null
  requiredDate?: string | null
  reviewComments?: string | null
  revisionNumber: number
  createdAt: string
  updatedAt: string
}

export const CreateSubmittalSchema = z.object({
  projectId: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["SHOP_DRAWING", "PRODUCT_DATA", "SAMPLE", "MOCK_UP", "DESIGN_MIX", "TEST_REPORT", "CERTIFICATE", "OPERATION_MANUAL", "WARRANTY", "OTHER"]).default("OTHER"),
  specSection: z.string().optional(),
  reviewerId: z.string().optional(),
  subcontractorId: z.string().optional(),
  dueDate: IsoDateSchema.optional(),
  requiredDate: IsoDateSchema.optional(),
})
export type CreateSubmittalInput = z.input<typeof CreateSubmittalSchema>

// ----------------------------
// Daily Logs
// ----------------------------

export type WeatherCondition = "CLEAR" | "PARTLY_CLOUDY" | "CLOUDY" | "RAIN" | "HEAVY_RAIN" | "SNOW" | "WIND" | "FOG" | "STORM"

export type DailyLogItem = {
  id: string
  projectId: string
  logDate: string
  createdById: string
  weatherCondition?: WeatherCondition | null
  temperatureHigh?: number | null
  temperatureLow?: number | null
  precipitation: boolean
  windSpeed?: number | null
  weatherNotes?: string | null
  workPerformed?: string | null
  materialsReceived?: string | null
  equipmentOnSite?: string | null
  visitors?: string | null
  safetyIncidents: number
  safetyNotes?: string | null
  delayHours?: number | null
  delayReason?: string | null
  isSubmitted: boolean
  submittedAt?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const CreateDailyLogSchema = z.object({
  projectId: IdSchema,
  logDate: IsoDateSchema,
  weatherCondition: z.enum(["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN", "HEAVY_RAIN", "SNOW", "WIND", "FOG", "STORM"]).optional(),
  temperatureHigh: z.number().optional(),
  temperatureLow: z.number().optional(),
  workPerformed: z.string().optional(),
  materialsReceived: z.string().optional(),
  safetyIncidents: z.number().default(0),
  safetyNotes: z.string().optional(),
})
export type CreateDailyLogInput = z.input<typeof CreateDailyLogSchema>

// ----------------------------
// Change Orders
// ----------------------------

export type ChangeOrderStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "VOID"

export type ChangeOrderItem = {
  id: string
  projectId: string
  number: number
  title: string
  description?: string | null
  status: ChangeOrderStatus
  reason?: string | null
  costImpact: number
  scheduleImpact?: number | null
  requestedById?: string | null
  approvedById?: string | null
  requestedAt?: string | null
  approvedAt?: string | null
  createdAt: string
  updatedAt: string
}

// ----------------------------
// Dispatch
// ----------------------------

export type DispatchStatus = "UNASSIGNED" | "ASSIGNED" | "EN_ROUTE" | "ON_SITE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type DispatchPriority = "LOW" | "NORMAL" | "HIGH" | "EMERGENCY"

export type DispatchItem = {
  id: string
  projectId: string
  title: string
  description?: string | null
  status: DispatchStatus
  priority: DispatchPriority
  assignedToId?: string | null
  crewIds: string[]
  scheduledDate?: string | null
  scheduledStart?: string | null
  scheduledEnd?: string | null
  estimatedDuration?: number | null
  isMultiDay: boolean
  address?: string | null
  notes?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const CreateDispatchSchema = z.object({
  projectId: IdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).default("NORMAL"),
  assignedToId: z.string().optional(),
  scheduledDate: IsoDateSchema.optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  estimatedDuration: z.number().optional(),
  address: z.string().optional(),
})
export type CreateDispatchInput = z.input<typeof CreateDispatchSchema>

// ----------------------------
// Price Book
// ----------------------------

export type PriceBookCategory = "LABOR" | "MATERIAL" | "EQUIPMENT" | "SUBCONTRACT" | "SERVICE" | "ASSEMBLY" | "FLAT_RATE"

export type PriceBookItemType = {
  id: string
  name: string
  description?: string | null
  category: PriceBookCategory
  sku?: string | null
  unitPrice: number
  unit: string
  costPrice?: number | null
  markup?: number | null
  trade?: string | null
  csiCode?: string | null
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const CreatePriceBookItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["LABOR", "MATERIAL", "EQUIPMENT", "SUBCONTRACT", "SERVICE", "ASSEMBLY", "FLAT_RATE"]),
  sku: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  unit: z.string().min(1),
  costPrice: z.number().optional(),
  markup: z.number().optional(),
  trade: z.string().optional(),
  csiCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
})
export type CreatePriceBookItemInput = z.input<typeof CreatePriceBookItemSchema>

// ----------------------------
// Scheduling
// ----------------------------

export type ScheduleItemType = {
  id: string
  projectId: string
  name: string
  type: string
  startDate: string
  endDate: string
  resource?: string | null
  status: string
  isCriticalPath: boolean
  dependencies: string[]
  percentComplete: number
}

// ----------------------------
// Subcontractor
// ----------------------------

export type SubcontractorItem = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  trades: string[]
  licenseNumber?: string | null
  insuranceExpiry?: string | null
  rating?: number | null
  status: string
  projectCount: number
}

// ----------------------------
// CRM / Lead
// ----------------------------

export type CRMLeadItem = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  source?: string | null
  status: string
  value?: number | null
  assignedTo?: string | null
  lastContactDate?: string | null
  nextFollowUp?: string | null
  notes?: string | null
  createdAt: string
}

// ----------------------------
// Client Portal
// ----------------------------

export type ClientPortalProject = {
  id: string
  name: string
  status: string
  progress: number
  currentPhase: string
  budget: number
  spent: number
  pendingChangeOrders: number
  pendingSelections: number
  upcomingInspections: number
  recentPhotos: number
}

// ----------------------------
// Dashboard KPIs
// ----------------------------

export type DashboardKPI = {
  label: string
  value: number | string
  change?: number | null
  changeLabel?: string | null
  trend?: "up" | "down" | "flat"
}

export type DashboardReport = {
  kpis: DashboardKPI[]
  revenueByMonth: { month: string; revenue: number; cost: number }[]
  projectsByStatus: { status: string; count: number }[]
  laborUtilization: { name: string; hours: number; capacity: number }[]
}
