/**
 * Client Dashboard API — fetch wrapper for Command Center v1 endpoints.
 *
 * Uses the same Supabase session token as the rest of the app.
 */

import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function fetchApi<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientDecision {
  id: string
  projectId: string
  type: string
  title: string
  context: any
  options: any
  decision: string | null
  decidedAt: string | null
  reasoning: string | null
  createdAt: string
}

export interface BudgetSnapshot {
  id: string
  projectId: string
  snapshotDate: string
  totalBudget: number
  totalCommitted: number
  totalActual: number
  totalVariance: number
  percentComplete: number
  forecast: number | null
  categories: any
  notes: string | null
  createdAt: string
}

export interface BudgetAlert {
  type: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export interface BudgetData {
  snapshot: BudgetSnapshot | null
  transactions: Array<{ id: string; eventType: string; payload: any; createdAt: string }>
  alerts: BudgetAlert[]
}

export interface WeeklyReportSummary {
  id: string
  projectId: string
  weekStart: string
  weekEnd: string
  summary: string
  metrics: any
  risks: any
  photos: string[]
  fileUrl: string | null
  sentToClient: boolean
  createdAt: string
}

export interface ProjectInfo {
  id: string
  name: string
  description: string | null
  category: string
  status?: string
  percentComplete?: number
  budgetTotal?: number | null
  budgetSpent?: number | null
  startDate?: string | null
  endDate?: string | null
  property?: {
    id: string
    address: string
    city: string
    state: string
    zip: string
  } | null
  memberships?: Array<{
    role: string
    user: { id: string; name: string; email: string }
  }>
}

export interface PreConProject {
  id: string
  name: string
  phase: string
  category: string
  description: string
  suggestedRetailPrice?: number | null
  designPackageTier: string
  designPackagePaid: boolean
  city?: string | null
  state?: string | null
  squareFootage?: number | null
  createdAt: string
  updatedAt: string
  designConcepts?: any[]
  bids?: any[]
  platformFees?: any[]
  selectedConceptId?: string | null
}

export interface PreConDashboard {
  totalProjects: number
  activeProjects: number
  phaseCounts: Record<string, number>
  pipeline: {
    intake: number
    design: number
    approved: number
    marketplace: number
    awarded: number
    completed: number
  }
  pendingFees: {
    count: number
    total: number
    items: any[]
  }
  recentProjects: PreConProject[]
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getClientDecisions(
  userId: string,
): Promise<{ decisions: ClientDecision[] }> {
  return fetchApi(`/api/v1/decisions/client/${userId}`)
}

export async function resolveDecision(
  id: string,
  body: { decision: 'approved' | 'rejected' | 'deferred'; reasoning?: string },
): Promise<{ resolved: boolean; followUpActions: string[] }> {
  return fetchApi(`/api/v1/decisions/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getBudget(projectId: string): Promise<BudgetData> {
  return fetchApi(`/api/v1/budget/project/${projectId}`)
}

export async function getBudgetHistory(
  projectId: string,
): Promise<{ snapshots: BudgetSnapshot[] }> {
  return fetchApi(`/api/v1/budget/project/${projectId}/history`)
}

export async function getReports(
  projectId: string,
): Promise<{ reports: WeeklyReportSummary[]; cursor: string | null }> {
  return fetchApi(`/api/v1/reports/project/${projectId}?limit=50`)
}

export async function getProjects(): Promise<{ projects: ProjectInfo[] }> {
  return fetchApi('/projects')
}

export async function getProjectDetail(
  projectId: string,
): Promise<{ project: ProjectInfo }> {
  return fetchApi(`/projects/${projectId}`)
}

export async function getMilestones(
  projectId: string,
): Promise<{ milestones: any[] }> {
  return fetchApi(`/projects/${projectId}`)
}

// ---------------------------------------------------------------------------
// Pre-Construction API functions
// ---------------------------------------------------------------------------

export async function getPreConDashboard(): Promise<{ dashboard: PreConDashboard }> {
  return fetchApi('/precon/dashboard')
}

export async function getPreConProjects(filters?: {
  phase?: string
  category?: string
}): Promise<{ projects: PreConProject[] }> {
  const params = new URLSearchParams()
  if (filters?.phase) params.set('phase', filters.phase)
  if (filters?.category) params.set('category', filters.category)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return fetchApi(`/precon/projects${suffix}`)
}

export async function getPreConProject(
  id: string,
): Promise<{ precon: PreConProject }> {
  return fetchApi(`/precon/projects/${id}`)
}

// ---------------------------------------------------------------------------
// Multifamily API functions
// ---------------------------------------------------------------------------

export interface MultifamilyUnit {
  id: string
  projectId: string
  number: string
  building: string
  floor: number
  unitType: string
  sqft: number
  status: string
  punchItems: number
  phaseId: string | null
  notes: string | null
  createdAt: string
}

export interface DrawRequest {
  id: string
  projectId: string
  drawNumber: number
  periodEnd: string | null
  description: string
  scheduledAmount: number
  previouslyBilled: number
  currentBilling: number
  retainage: number
  status: string
  submittedAt: string | null
  approvedAt: string | null
  fundedAt: string | null
  createdAt: string
}

export interface AreaPhase {
  id: string
  projectId: string
  name: string
  description: string
  status: string
  startDate: string | null
  endDate: string | null
  unitCount: number
  completedUnits: number
  areas: string[]
  createdAt: string
}

export interface UnitStats {
  total: number
  complete: number
  inProgress: number
  punch: number
  pctComplete: number
}

export interface DrawStats {
  totalDraws: number
  totalScheduled: number
  totalBilled: number
  totalFunded: number
  pending: number
  pctDrawn: number
}

// Units
export async function getUnits(projectId: string): Promise<{ units: MultifamilyUnit[] }> {
  return fetchApi(`/pm/multifamily/units?projectId=${projectId}`)
}

export async function getUnitStats(projectId: string): Promise<UnitStats> {
  return fetchApi(`/pm/multifamily/units/stats?projectId=${projectId}`)
}

export async function updateUnit(id: string, data: Partial<MultifamilyUnit>): Promise<{ unit: MultifamilyUnit }> {
  return fetchApi(`/pm/multifamily/units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// Draws
export async function getDraws(projectId: string): Promise<{ draws: DrawRequest[] }> {
  return fetchApi(`/pm/multifamily/draws?projectId=${projectId}`)
}

export async function getDrawStats(projectId: string): Promise<DrawStats> {
  return fetchApi(`/pm/multifamily/draws/stats?projectId=${projectId}`)
}

// Phases
export async function getPhases(projectId: string): Promise<{ phases: AreaPhase[] }> {
  return fetchApi(`/pm/multifamily/phases?projectId=${projectId}`)
}
