/**
 * portal-contractor/lib/api/construction-os.ts
 *
 * Typed API client for Construction OS pm/* endpoints.
 * Uses the portal's authenticated apiFetch wrapper.
 */

import { apiFetch } from './client'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

export interface DailyLog {
  id:                string
  projectId:         string
  contractorId:      string
  date:              string
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
  signedOffAt?:      string
  signedOffBy?:      string
  createdAt:         string
}

export interface RFI {
  id:            string
  projectId:     string
  rfiNumber:     number
  subject:       string
  question:      string
  status:        'OPEN' | 'ANSWERED' | 'CLOSED' | 'VOIDED'
  priority:      'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo?:   string
  dueDate?:      string
  answer?:       string
  answeredAt?:   string
  attachments?:  string[]
  createdAt:     string
  updatedAt:     string
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
  id:            string
  projectId:     string
  taskName:      string
  description?:  string
  startDate:     string
  endDate?:      string
  duration?:     number
  status:        string
  assignedTo?:   string
  trade?:        string
  progress?:     number
  dependencies?: string[]
  isMilestone:   boolean
  isCritical:    boolean
}

export interface BudgetOverview {
  contractedAmount:     number
  spentToDate:          number
  committedCosts:       number
  forecastAtComplete:   number
  contingencyRemaining: number
  percentComplete:      number
  cpi:                  number
  spi?:                 number
  currency:             string
}

export interface BudgetLine {
  id:               string
  projectId:        string
  code?:            string
  name:             string
  category?:        string
  description?:     string
  budgetAmount?:    number
  actualAmount?:    number
  committedAmount?: number
  status?:          string
  sortOrder?:       number
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

const dailyLogs = {
  list: (params: { projectId?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<DailyLog>>(`/pm/daily-logs${qs(params)}`),

  get: (id: string) =>
    apiFetch<{ dailyLog: DailyLog }>(`/pm/daily-logs/${id}`),

  create: (data: {
    projectId:          string
    date?:              string
    workPerformed:      string
    crewCount?:         number
    hoursWorked?:       number
    weather?:           string
    temperature?:       string
    progressNotes?:     string
    issues?:            string
    materialsDelivered?: string
    equipmentUsed?:     string
  }) => apiFetch<{ dailyLog: DailyLog }>('/pm/daily-logs', { method: 'POST', body: JSON.stringify(data) }),

  signOff: (id: string) =>
    apiFetch<{ dailyLog: DailyLog }>(`/pm/daily-logs/${id}/sign-off`, { method: 'POST' }),
}

// ── RFIs ──────────────────────────────────────────────────────────────────────

const rfis = {
  list: (params: { projectId: string; status?: string; priority?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<RFI>>(`/pm/rfis${qs(params)}`),

  stats: (projectId: string) =>
    apiFetch<{ stats: Record<string, number> }>(`/pm/rfis/stats${qs({ projectId })}`),

  get: (id: string) =>
    apiFetch<{ rfi: RFI }>(`/pm/rfis/${id}`),

  create: (data: {
    projectId:   string
    subject:     string
    question:    string
    priority?:   string
    assignedTo?: string
    dueDate?:    string
  }) => apiFetch<{ rfi: RFI }>('/pm/rfis', { method: 'POST', body: JSON.stringify(data) }),

  respond: (id: string, answer: string) =>
    apiFetch<{ rfi: RFI }>(`/pm/rfis/${id}/respond`, { method: 'POST', body: JSON.stringify({ answer }) }),
}

// ── Punch List ────────────────────────────────────────────────────────────────

const punchList = {
  list: (params: { projectId?: string; status?: string; severity?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<PunchItem>>(`/pm/punch-list${qs(params)}`),

  stats: (projectId?: string) =>
    apiFetch<{ stats: Record<string, number> }>(`/pm/punch-list/stats${qs({ projectId })}`),

  get: (id: string) =>
    apiFetch<{ punchItem: PunchItem }>(`/pm/punch-list/${id}`),

  create: (data: {
    projectId:   string
    title:       string
    description: string
    type?:       string
    severity?:   string
    location?:   string
    assignedTo?: string
    dueDate?:    string
  }) => apiFetch<{ punchItem: PunchItem }>('/pm/punch-list', { method: 'POST', body: JSON.stringify(data) }),

  resolve: (id: string, resolution: string) =>
    apiFetch<{ punchItem: PunchItem }>(`/pm/punch-list/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),

  verify: (id: string) =>
    apiFetch<{ punchItem: PunchItem }>(`/pm/punch-list/${id}/verify`, { method: 'POST' }),
}

// ── Schedule ──────────────────────────────────────────────────────────────────

const schedule = {
  list: (params: { projectId?: string; status?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<ScheduleItem>>(`/pm/schedule${qs(params)}`),

  milestones: (projectId: string) =>
    apiFetch<{ milestones: Array<{ id: string; name: string; date: string; status: string }> }>(
      `/pm/schedule/milestones${qs({ projectId })}`,
    ),

  gantt: (projectId: string) =>
    apiFetch<{ items: ScheduleItem[]; milestones: Array<{ id: string; name: string; date: string; status: string }>; startDate: string; endDate: string }>(
      `/pm/schedule/gantt${qs({ projectId })}`,
    ),

  criticalPath: (projectId: string) =>
    apiFetch<{ criticalPath: string[]; items: ScheduleItem[] }>(
      `/pm/schedule/critical-path${qs({ projectId })}`,
    ),

  create: (data: Partial<ScheduleItem> & { projectId: string; taskName: string }) =>
    apiFetch<{ item: ScheduleItem }>('/pm/schedule', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<ScheduleItem>) =>
    apiFetch<{ item: ScheduleItem }>(`/pm/schedule/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Budget ────────────────────────────────────────────────────────────────────

const budget = {
  overview: (projectId: string) =>
    apiFetch<BudgetOverview>(`/pm/budget${qs({ projectId })}`),

  lines: (params: { projectId?: string; category?: string; page?: number; limit?: number }) =>
    apiFetch<PaginatedResult<BudgetLine>>(`/pm/budget/lines${qs(params)}`),
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const constructionOS = {
  dailyLogs,
  rfis,
  punchList,
  schedule,
  budget,
}
