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

export async function getMilestones(
  projectId: string,
): Promise<{ milestones: any[] }> {
  return fetchApi(`/projects/${projectId}`)
}
