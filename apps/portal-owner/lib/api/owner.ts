/**
 * portal-owner/lib/api/owner.ts
 *
 * Typed wrappers for project-owner API endpoints:
 *   GET /projects
 *   GET /projects/:id
 *   GET /marketplace/projects/:id/readiness
 */

import { apiFetch } from './client'

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string | null
  category: string | null
  status: string
  lifecyclePhase: string | null
  twinTier: string | null
  totalBudget: number | null
  spentToDate: number | null
  progressPct: number | null
  twinHealthScore: number | null
  address: string | null
  city: string | null
  state: string | null
  estimatedCompletionDate: string | null
  startDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectsResponse {
  projects: Project[]
}

export async function listProjects(): Promise<ProjectsResponse> {
  return apiFetch<ProjectsResponse>('/projects')
}

export async function getProject(id: string): Promise<{ project: Project }> {
  return apiFetch<{ project: Project }>(`/projects/${id}`)
}

// ─── Readiness ────────────────────────────────────────────────────────────────

export type ReadinessStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'NEEDS_ATTENTION'
  | 'READY'
  | 'OVERRIDDEN'

export interface ReadinessItem {
  id: string
  label: string
  category: string
  status: ReadinessStatus
  notes: string | null
  evidenceUrl: string | null
  required: boolean
  completedAt: string | null
}

export interface ProjectReadiness {
  projectId: string
  overallStatus: ReadinessStatus
  readyCount: number
  totalCount: number
  items: ReadinessItem[]
}

export async function getProjectReadiness(
  projectId: string,
): Promise<{ readiness: ProjectReadiness }> {
  return apiFetch<{ readiness: ProjectReadiness }>(
    `/marketplace/projects/${projectId}/readiness`,
  )
}
