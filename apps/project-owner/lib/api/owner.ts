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

export async function startInfillSitePlan(projectId: string, jurisdictionCode: string) {
  return apiFetch<{ workflow: AuthoritativeProjectStatus['sitePlan'] }>(`/api/site-plans/projects/${projectId}`, {
    method: 'POST', body: JSON.stringify({ jurisdictionCode }),
  })
}

export async function uploadSitePlanSurvey(workflowId: string, file: File, crs: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('crs', crs)
  form.append('units', 'FEET')
  form.append('idempotencyKey', `owner-survey-${workflowId}-${file.name}-${file.size}-${file.lastModified}`)
  return apiFetch<{ job: { jobId: string; status: string; documentId: string } }>(
    `/api/site-plans/${workflowId}/extract-document`, { method: 'POST', body: form },
  )
}

export interface SiteFitScenarioResult {
  id: string
  name: string
  siteFitStatus: string
  reviewStatus: string
  disclaimer: string
  options: Array<{
    id: string
    ordinal: number
    name: string
    geometryGeoJson: unknown
    siteCoverage: number
    far: number
    grossFloorArea: number | string
    unitCount: number
    parkingSpaces: number
    score: number
    validationReport: { professionalReviewRequired?: boolean; ruleResults?: unknown[] }
  }>
}

export async function solveSiteFitScenario(workflowId: string, input: {
  name: string
  boundary: { type: 'Polygon'; coordinates: number[][][] }
  crs: string
  sourceReference: string
  setback: number
  setbacks?: { front: number; rear: number; leftSide: number; rightSide: number }
  frontageDirection?: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST'
  targetUnits: number
  averageUnitSqFt: number
  stories: number
  typology: 'SINGLE_FAMILY' | 'TOWNHOME' | 'GARDEN_MULTIFAMILY' |
    'WRAP_PODIUM_MULTIFAMILY' | 'SURFACE_PARKING' | 'SMALL_MIXED_USE'
    | 'ADU' | 'ADDITION' | 'POOL' | 'NEW_HOME'
}) {
  const boundaryKey = JSON.stringify(input)
  let checksum = 0
  for (let index = 0; index < boundaryKey.length; index += 1) {
    checksum = ((checksum << 5) - checksum + boundaryKey.charCodeAt(index)) | 0
  }
  return apiFetch<{ scenario: { scenarioId: string; jobId: string; status: string; disclaimer: string } }>(
    `/api/site-plans/${workflowId}/feasibility/scenarios`, {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        idempotencyKey: `owner-site-fit-${workflowId}-${Math.abs(checksum)}`,
        boundary: input.boundary,
        crs: input.crs,
        source: { provider: 'project-owner GeoJSON upload', confidence: 0.8 },
        ruleSet: {
          version: `owner-confirmed-${new Date().toISOString().slice(0, 10)}`,
          uniformSetback: input.setback,
          setbacks: input.setbacks,
          frontageDirection: input.frontageDirection,
          sourceReferences: [input.sourceReference],
          humanVerified: false,
        },
        program: {
          typology: input.typology,
          targetUnits: input.targetUnits,
          averageUnitSqFt: input.averageUnitSqFt,
          stories: input.stories,
        },
        randomSeed: Math.abs(checksum),
      }),
    },
  )
}

export async function getSiteFitScenario(workflowId: string, scenarioId: string) {
  return apiFetch<{ scenario: SiteFitScenarioResult }>(
    `/api/site-plans/${workflowId}/feasibility/scenarios/${scenarioId}`,
  )
}
