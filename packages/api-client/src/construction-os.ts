/**
 * construction-os.ts
 *
 * Typed API client for the Kealee Construction OS.
 * Wraps all /pm/* endpoints with full TypeScript types.
 *
 * Usage:
 *   import { constructionOS } from '@kealee/api-client/construction-os'
 *   const logs = await constructionOS.dailyLogs.list({ projectId })
 */

import { apiRequest } from './index'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

export interface DailyLog {
  id:               string
  projectId:        string
  contractorId:     string
  date:             string
  workPerformed:    string
  crewCount?:       number
  hoursWorked?:     number
  weather?:         string
  temperature?:     string
  progressNotes?:   string
  issues?:          string
  materialsDelivered?: string
  equipmentUsed?:   string
  subsOnSite?:      string[]
  photoIds?:        string[]
  signedOffAt?:     string
  signedOffBy?:     string
  createdAt:        string
}

export interface RFI {
  id:             string
  projectId:      string
  rfiNumber:      number
  subject:        string
  question:       string
  status:         'OPEN' | 'ANSWERED' | 'CLOSED' | 'VOIDED'
  priority:       'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?:    string
  dueDate?:       string
  answer?:        string
  answeredAt?:    string
  attachments?:   string[]
  createdAt:      string
  updatedAt:      string
}

export interface PunchItem {
  id:          string
  projectId:   string
  title:       string
  description: string
  type:        string
  severity:    'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL'
  status:      'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'VOIDED'
  location?:   string
  assignedTo?: string
  dueDate?:    string
  resolution?: string
  resolvedBy?: string
  resolvedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  photos?:     string[]
  createdAt:   string
}

export interface ScheduleItem {
  id:          string
  projectId:   string
  taskName:    string
  description?: string
  startDate:   string
  endDate?:    string
  duration?:   number
  status:      string
  assignedTo?: string
  trade?:      string
  progress?:   number
  dependencies?: string[]
  isMilestone: boolean
  isCritical:  boolean
}

export interface GanttData {
  items:       ScheduleItem[]
  milestones:  Array<{ id: string; name: string; date: string; status: string }>
  criticalPath: string[]
  startDate:   string
  endDate:     string
}

export interface BudgetOverview {
  contractedAmount:  number
  spentToDate:       number
  committedCosts:    number
  forecastAtComplete: number
  contingencyRemaining: number
  percentComplete:   number
  cpi:               number   // Cost Performance Index
  spi?:              number   // Schedule Performance Index
  currency:          string
}

export interface BudgetLine {
  id:            string
  projectId:     string
  code?:         string
  name:          string
  category?:     string
  description?:  string
  budgetAmount?: number
  actualAmount?: number
  committedAmount?: number
  status?:       string
  sortOrder?:    number
}

export interface ChangeOrder {
  id:                string
  projectId:         string
  changeOrderNumber: string
  title:             string
  description?:      string
  status:            'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'VOID'
  amount:            number
  daysImpact?:       number
  submittedAt?:      string
  approvedAt?:       string
  rejectedAt?:       string
  approvedBy?:       string
  createdAt:         string
}

export interface Submittal {
  id:               string
  projectId:        string
  submittalNumber:  number
  title:            string
  description?:     string
  type:             string
  status:           'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT'
  submittedAt?:     string
  reviewedAt?:      string
  reviewedBy?:      string
  reviewComment?:   string
  attachments?:     string[]
  createdAt:        string
}

export interface SafetyIncident {
  id:             string
  projectId:      string
  incidentNumber: number
  title:          string
  description:    string
  severity:       'NEAR_MISS' | 'FIRST_AID' | 'RECORDABLE' | 'LOST_TIME' | 'FATALITY'
  status:         'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'
  occurredAt:     string
  location?:      string
  injuries?:      string
  rootCause?:     string
  correctiveActions?: string
  createdAt:      string
}

export interface OSFeature {
  id:          string
  slug:        string
  name:        string
  description?: string
  phase:       number
  tier:        'STANDARD' | 'PRO' | 'ENTERPRISE'
  isEnabled:   boolean
}

export interface ProjectOSAccess {
  projectId:    string
  orgId?:       string
  phase:        number
  tier:         'STANDARD' | 'PRO' | 'ENTERPRISE'
  enabledSlugs: string[]
  disabledSlugs: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ── Daily Logs ────────────────────────────────────────────────────────────────

export const dailyLogs = {
  list: (params: {
    projectId?:   string
    contractorId?: string
    startDate?:   string
    endDate?:     string
    page?:        number
    limit?:       number
  }) => apiRequest<PaginatedResult<DailyLog>>(`/pm/daily-logs${qs(params)}`),

  summary: (params: { projectId: string; startDate: string; endDate: string }) =>
    apiRequest<{ summary: Record<string, unknown> }>(`/pm/daily-logs/summary${qs(params)}`),

  get: (id: string) =>
    apiRequest<{ dailyLog: DailyLog }>(`/pm/daily-logs/${id}`),

  create: (data: {
    projectId:         string
    date?:             string
    workPerformed:     string
    crewCount?:        number
    hoursWorked?:      number
    weather?:          string
    temperature?:      string
    progressNotes?:    string
    issues?:           string
    materialsDelivered?: string
    equipmentUsed?:    string
    subsOnSite?:       string[]
    photoIds?:         string[]
  }) => apiRequest<{ dailyLog: DailyLog }>('/pm/daily-logs', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<DailyLog>) =>
    apiRequest<{ dailyLog: DailyLog }>(`/pm/daily-logs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  signOff: (id: string) =>
    apiRequest<{ dailyLog: DailyLog }>(`/pm/daily-logs/${id}/sign-off`, { method: 'POST' }),
}

// ── RFIs ──────────────────────────────────────────────────────────────────────

export const rfis = {
  list: (params: {
    projectId:  string
    status?:    string
    priority?:  string
    assignedTo?: string
    page?:      number
    limit?:     number
    search?:    string
  }) => apiRequest<PaginatedResult<RFI>>(`/pm/rfis${qs(params)}`),

  stats: (projectId: string) =>
    apiRequest<{ stats: Record<string, number> }>(`/pm/rfis/stats${qs({ projectId })}`),

  get: (id: string) =>
    apiRequest<{ rfi: RFI }>(`/pm/rfis/${id}`),

  create: (data: {
    projectId:  string
    subject:    string
    question:   string
    priority?:  string
    assignedTo?: string
    dueDate?:   string
    attachments?: string[]
  }) => apiRequest<{ rfi: RFI }>('/pm/rfis', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<RFI>) =>
    apiRequest<{ rfi: RFI }>(`/pm/rfis/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  respond: (id: string, answer: string) =>
    apiRequest<{ rfi: RFI }>(`/pm/rfis/${id}/respond`, { method: 'POST', body: JSON.stringify({ answer }) }),
}

// ── Punch List ────────────────────────────────────────────────────────────────

export const punchList = {
  list: (params: {
    projectId?: string
    status?:    string
    severity?:  string
    assignedTo?: string
    page?:      number
    limit?:     number
  }) => apiRequest<PaginatedResult<PunchItem>>(`/pm/punch-list${qs(params)}`),

  stats: (projectId?: string) =>
    apiRequest<{ stats: Record<string, number> }>(`/pm/punch-list/stats${qs({ projectId })}`),

  get: (id: string) =>
    apiRequest<{ punchItem: PunchItem }>(`/pm/punch-list/${id}`),

  create: (data: {
    projectId:   string
    title:       string
    description: string
    type?:       string
    severity?:   string
    location?:   string
    assignedTo?: string
    dueDate?:    string
    photos?:     string[]
  }) => apiRequest<{ punchItem: PunchItem }>('/pm/punch-list', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<PunchItem>) =>
    apiRequest<{ punchItem: PunchItem }>(`/pm/punch-list/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  resolve: (id: string, resolution: string) =>
    apiRequest<{ punchItem: PunchItem }>(`/pm/punch-list/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),

  verify: (id: string) =>
    apiRequest<{ punchItem: PunchItem }>(`/pm/punch-list/${id}/verify`, { method: 'POST' }),
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export const schedule = {
  list: (params: {
    projectId?:  string
    status?:     string
    assignedTo?: string
    trade?:      string
    page?:       number
    limit?:      number
  }) => apiRequest<PaginatedResult<ScheduleItem>>(`/pm/schedule${qs(params)}`),

  gantt: (projectId: string) =>
    apiRequest<GanttData>(`/pm/schedule/gantt${qs({ projectId })}`),

  criticalPath: (projectId: string) =>
    apiRequest<{ criticalPath: string[]; items: ScheduleItem[] }>(`/pm/schedule/critical-path${qs({ projectId })}`),

  milestones: (projectId: string) =>
    apiRequest<{ milestones: Array<{ id: string; name: string; date: string; status: string }> }>(
      `/pm/schedule/milestones${qs({ projectId })}`,
    ),

  create: (data: Partial<ScheduleItem> & { projectId: string; taskName: string }) =>
    apiRequest<{ item: ScheduleItem }>('/pm/schedule', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<ScheduleItem>) =>
    apiRequest<{ item: ScheduleItem }>(`/pm/schedule/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Budget ────────────────────────────────────────────────────────────────────

export const budget = {
  overview: (projectId: string) =>
    apiRequest<BudgetOverview>(`/pm/budget${qs({ projectId })}`),

  lines: (params: { projectId?: string; category?: string; status?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<BudgetLine>>(`/pm/budget/lines${qs(params)}`),

  createLine: (data: Partial<BudgetLine> & { projectId: string; name: string }) =>
    apiRequest<{ line: BudgetLine }>('/pm/budget/lines', { method: 'POST', body: JSON.stringify(data) }),

  updateLine: (id: string, data: Partial<BudgetLine>) =>
    apiRequest<{ line: BudgetLine }>(`/pm/budget/lines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  forecast: (projectId: string) =>
    apiRequest<{ forecast: Record<string, number> }>(`/pm/budget/forecast${qs({ projectId })}`),
}

// ── Change Orders ─────────────────────────────────────────────────────────────

export const changeOrders = {
  list: (params: { projectId: string; status?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<ChangeOrder>>(`/pm/change-orders${qs(params)}`),

  get: (id: string) =>
    apiRequest<{ changeOrder: ChangeOrder }>(`/pm/change-orders/${id}`),

  create: (data: { projectId: string; title: string; description?: string; amount: number; daysImpact?: number }) =>
    apiRequest<{ changeOrder: ChangeOrder }>('/pm/change-orders', { method: 'POST', body: JSON.stringify(data) }),

  approve: (id: string) =>
    apiRequest<{ changeOrder: ChangeOrder }>(`/pm/change-orders/${id}/approve`, { method: 'POST' }),

  reject: (id: string, reason?: string) =>
    apiRequest<{ changeOrder: ChangeOrder }>(`/pm/change-orders/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

// ── Submittals ────────────────────────────────────────────────────────────────

export const submittals = {
  list: (params: { projectId: string; status?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<Submittal>>(`/pm/submittals${qs(params)}`),

  get: (id: string) =>
    apiRequest<{ submittal: Submittal }>(`/pm/submittals/${id}`),

  create: (data: { projectId: string; title: string; type: string; description?: string }) =>
    apiRequest<{ submittal: Submittal }>('/pm/submittals', { method: 'POST', body: JSON.stringify(data) }),

  submit: (id: string) =>
    apiRequest<{ submittal: Submittal }>(`/pm/submittals/${id}/submit`, { method: 'POST' }),

  review: (id: string, data: { status: string; reviewComment?: string }) =>
    apiRequest<{ submittal: Submittal }>(`/pm/submittals/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── Safety ────────────────────────────────────────────────────────────────────

export const safety = {
  incidents: (params: { projectId: string; status?: string; severity?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<SafetyIncident>>(`/pm/safety/incidents${qs(params)}`),

  createIncident: (data: { projectId: string; title: string; description: string; severity: string; occurredAt?: string; location?: string }) =>
    apiRequest<{ incident: SafetyIncident }>('/pm/safety/incidents', { method: 'POST', body: JSON.stringify(data) }),

  updateIncident: (id: string, data: Partial<SafetyIncident>) =>
    apiRequest<{ incident: SafetyIncident }>(`/pm/safety/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Feature Gates ─────────────────────────────────────────────────────────────

export const featureGates = {
  listFeatures: () =>
    apiRequest<{ features: OSFeature[] }>('/pm/features'),

  getProjectAccess: (projectId: string) =>
    apiRequest<{ access: ProjectOSAccess }>(`/pm/features/project/${projectId}`),

  hasFeature: async (projectId: string, slug: string): Promise<boolean> => {
    try {
      const { access } = await featureGates.getProjectAccess(projectId)
      if (access.disabledSlugs.includes(slug)) return false
      if (access.enabledSlugs.includes(slug)) return true
      // Default: phase 1 features enabled for all projects
      return access.phase >= 1 && ['daily-log','schedule-view','schedule-gantt','rfi-list','rfi-create','punch-list','budget-overview','photo-log','project-reports'].includes(slug)
    } catch {
      return false
    }
  },
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const constructionOS = {
  dailyLogs,
  rfis,
  punchList,
  schedule,
  budget,
  changeOrders,
  submittals,
  safety,
  featureGates,
}
