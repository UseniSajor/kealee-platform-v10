/**
 * portal-owner/lib/api/construction-os.ts
 *
 * Read-only typed client for Construction OS pm/* endpoints.
 * Owners have view access — budget, schedule milestones, RFIs, punch list.
 */

import { apiFetch } from './client'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
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
  createdAt:   string
}

export interface ScheduleItem {
  id:          string
  projectId:   string
  taskName:    string
  startDate:   string
  endDate?:    string
  status:      string
  progress?:   number
  isMilestone: boolean
  isCritical:  boolean
  trade?:      string
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
  budgetAmount?:    number
  actualAmount?:    number
  committedAmount?: number
  status?:          string
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

// ── API client ────────────────────────────────────────────────────────────────

export const constructionOS = {
  rfis: {
    list:  (params: { projectId: string; status?: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResult<RFI>>(`/pm/rfis${qs(params)}`),
    stats: (projectId: string) =>
      apiFetch<{ stats: Record<string, number> }>(`/pm/rfis/stats${qs({ projectId })}`),
  },

  punchList: {
    stats: (projectId: string) =>
      apiFetch<{ stats: Record<string, number> }>(`/pm/punch-list/stats${qs({ projectId })}`),
    list:  (params: { projectId: string; status?: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResult<PunchItem>>(`/pm/punch-list${qs(params)}`),
  },

  schedule: {
    milestones: (projectId: string) =>
      apiFetch<{ milestones: Array<{ id: string; name: string; date: string; status: string }> }>(
        `/pm/schedule/milestones${qs({ projectId })}`,
      ),
    list: (params: { projectId: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResult<ScheduleItem>>(`/pm/schedule${qs(params)}`),
  },

  budget: {
    overview: (projectId: string) =>
      apiFetch<BudgetOverview>(`/pm/budget${qs({ projectId })}`),
    lines:    (params: { projectId: string; page?: number; limit?: number }) =>
      apiFetch<PaginatedResult<BudgetLine>>(`/pm/budget/lines${qs(params)}`),
  },
}
