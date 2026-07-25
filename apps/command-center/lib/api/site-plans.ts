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
  openRedlineCount: number
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

export interface SitePlanDocumentExtraction {
  documentId: string
  documentUrl: string
  filename: string
  crs: string
  units: 'FEET' | 'METERS'
  geometry: GenerateSitePlanInput['geometry']
  warnings: string[]
  reviewRequired: boolean
  extractedAt: string
}

export async function extractSitePlanDocument(workflowId: string, file: File, crs: string,
  units: 'FEET' | 'METERS' = 'FEET'): Promise<SitePlanDocumentExtraction> {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in is required to extract a plat or survey.')
  const form = new FormData()
  form.append('crs', crs)
  form.append('units', units)
  const idempotencyKey = `survey-ocr-${workflowId}-${file.name}-${file.size}-${file.lastModified}`
  form.append('idempotencyKey', idempotencyKey)
  form.append('file', file)
  const response = await fetch(`${API_URL}/api/site-plans/${workflowId}/extract-document`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(payload?.message ?? payload?.error ?? `Document extraction failed (HTTP ${response.status}).`)
  }
  const payload = await response.json() as { job: { jobId: string; documentId: string } }
  const deadline = Date.now() + 10 * 60 * 1000
  while (Date.now() < deadline) {
    const statusResponse = await fetch(`${API_URL}/api/site-plans/${workflowId}/jobs/${encodeURIComponent(payload.job.jobId)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    if (!statusResponse.ok) throw new Error(`Unable to read extraction progress (HTTP ${statusResponse.status}).`)
    const statusPayload = await statusResponse.json() as { job: {
      state: string; failedReason?: string | null; result?: { result?: {
        tokens?: unknown[]; warnings?: string[]; geometry?: GenerateSitePlanInput['geometry']; toolVersion?: string
      } } | null
    } }
    if (statusPayload.job.state === 'failed') throw new Error(statusPayload.job.failedReason ?? 'Survey extraction failed.')
    if (statusPayload.job.state === 'completed') {
      const result = statusPayload.job.result?.result ?? {}
      return { documentId: payload.job.documentId, documentUrl: '', filename: file.name, crs, units,
        geometry: result.geometry ?? [], warnings: [
          ...(result.warnings ?? []),
          `${result.tokens?.length ?? 0} OCR values are ready for side-by-side verification.`,
        ], reviewRequired: true, extractedAt: new Date().toISOString() }
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  throw new Error('Survey extraction is still processing. It remains available in the project queue.')
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

export async function runEngineeringTask(workflowId: string, input: {
  type: 'GENERATE_SURFACE' | 'GENERATE_CONTOURS' | 'CALCULATE_CUT_FILL' | 'ANALYZE_DRAINAGE'
    | 'GENERATE_DXF' | 'GENERATE_VECTOR_PDF' | 'GENERATE_REPORT' | 'RUN_COMPLIANCE_AUDIT'
  stageCode: string
  options: Record<string, unknown>
}) {
  const token = await getAuthToken()
  if (!token) throw new Error('Sign in is required to run engineering analysis.')
  const idempotencyKey = `${input.type.toLowerCase()}-${workflowId}-${crypto.randomUUID()}`
  const queued = await fetch(`${API_URL}/api/site-plans/${workflowId}/jobs`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, idempotencyKey }),
  })
  if (!queued.ok) {
    const payload = await queued.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(payload?.message ?? payload?.error ?? `Unable to queue engineering task (HTTP ${queued.status}).`)
  }
  const { job } = await queued.json() as { job: { jobId: string } }
  const deadline = Date.now() + 10 * 60 * 1000
  while (Date.now() < deadline) {
    const response = await fetch(`${API_URL}/api/site-plans/${workflowId}/jobs/${encodeURIComponent(job.jobId)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    const payload = await response.json() as { job: { state: string; result?: unknown; failedReason?: string } }
    if (payload.job.state === 'completed') return payload.job.result
    if (payload.job.state === 'failed') throw new Error(payload.job.failedReason ?? 'Engineering task failed.')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  throw new Error('Engineering task is still processing and remains visible in the queue.')
}
