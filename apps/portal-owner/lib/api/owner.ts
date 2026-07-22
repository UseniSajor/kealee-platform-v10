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

export interface AuthoritativeProjectStatus {
  project: { id: string; name: string | null; status: string; currentPhase: string | null;
    projectedEndDate: string | null; verifiedAt: string }
  phases: Array<{ id: string; name: string; status: string; percentComplete: number; plannedEndDate: string | null }>
  documents: Array<{ id: string; name: string; type: string; status: string; signatureStatus: string | null }>
  permits: Array<{ id: string; permitType: string; status: string; jurisdictionStatus: string | null;
    submittedAt: string | null; approvedAt: string | null; corrections: Array<{ id: string; status: string; rawText: string }> }>
  sitePlan: null | { id: string; currentStage: string; status: string; releasedAt: string | null;
    stages: Array<{ id: string; stage: string; status: string; blockers: unknown; updatedAt: string }>
    professionalReviews: Array<{ id: string; discipline: string; decision: string; licenseVerifiedAt: string | null }> }
  supportCases: Array<{ id: string; status: string; topic: string; urgency: string; slaDueAt: string | null }>
  generatedAt: string
}

export async function getAuthoritativeProjectStatus(projectId: string): Promise<AuthoritativeProjectStatus> {
  return apiFetch<AuthoritativeProjectStatus>(`/api/support/projects/${projectId}/status`)
}
