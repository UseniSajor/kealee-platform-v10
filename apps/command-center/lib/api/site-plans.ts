import { getAuthToken } from '../supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface SitePlanQueueItem {
  id: string
  projectId: string
  organizationId: string
  currentStage: string
  status: string
  version: number
  updatedAt: string
  blockingComplianceCount: number
  pendingReviewCount: number
  openCorrectionCount: number
  stages: Array<{
    id: string
    stage: string
    status: string
    attempt: number
    blockers?: string[]
    updatedAt: string
  }>
}

export async function getSitePlanOperationsQueue(): Promise<SitePlanQueueItem[]> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in is required to view the operations queue.')
  const response = await fetch(`${API_URL}/api/site-plans/operations/queue`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(payload?.message ?? payload?.error ?? `Unable to load site plans (HTTP ${response.status}).`)
  }
  const payload = await response.json() as { workflows: SitePlanQueueItem[] }
  return payload.workflows
}

export interface GenerateSitePlanInput {
  idempotencyKey: string
  name: string
  units: 'FEET' | 'METERS'
  crs: string
  revision: number
  surveyVerified: boolean
  requestedClassification: 'CONCEPT' | 'PERMIT_READY'
  professionalApprovalId?: string
  geometry: Array<{
    id: string; layer: string; vertices: Array<{ x: number; y: number }>; closed: boolean
    authority: string; sourceId: string; sourceRetrievedAt: string; confidence: number
  }>
}

export interface GeneratedSitePlan {
  artifact: { dxf: string; pdfBase64: string; geoJson: Record<string, unknown>; quantities: Record<string, number>; warnings: string[] }
  summary: { revision: number; classification: string; generatedAt: string }
}

export async function generateSitePlan(workflowId: string, input: GenerateSitePlanInput): Promise<GeneratedSitePlan> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in is required to generate a site plan.')
  const response = await fetch(`${API_URL}/api/site-plans/${workflowId}/generate`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(payload?.message ?? payload?.error ?? `Site-plan generation failed (HTTP ${response.status}).`)
  }
  return response.json() as Promise<GeneratedSitePlan>
}
