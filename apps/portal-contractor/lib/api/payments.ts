/**
 * portal-contractor/lib/api/payments.ts
 * Typed wrappers for contractor milestone draw/payment endpoints.
 */

import { apiFetch } from './client'

export type MilestoneStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED'

export interface ApiMilestone {
  id: string
  name: string
  contractId: string
  status: MilestoneStatus
  amount: number
  dueDate?: string | null
  canSubmit?: boolean
  retainage?: number
}

export interface ProjectMilestonesResponse {
  milestones: ApiMilestone[]
  statistics: {
    total: number
    completed: number
    totalAmount: number
    paidAmount: number
    progressPercentage: number
    paymentProgress: number
  }
}

export async function getProjectMilestones(
  projectId: string,
): Promise<ProjectMilestonesResponse> {
  return apiFetch<ProjectMilestonesResponse>(
    `/api/v1/payments/projects/${projectId}/milestones`,
  )
}

/** Contractor submits a draw request for a milestone */
export async function submitDrawRequest(
  milestoneId: string,
  body: { notes?: string; evidenceUrls?: string[] } = {},
): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/milestones/${milestoneId}/submit`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ─── Lien Waivers ────────────────────────────────────────────────────────────
//
// GET /api/v1/payments/projects/:projectId/lien-waivers is a real, registered
// endpoint (services/api/src/modules/payments-v1/payments-v1.routes.ts) that
// lists LienWaiver rows for a project.
//
// There is NO live signing endpoint reachable from this app: the only e-sign
// route, POST /lien-waivers/:id/sign (services/api/src/routes/lien-waiver.routes.ts),
// is never registered in services/api/src/index.ts, so it 404s. The "Sign Now"
// action is therefore disabled in the UI rather than wired to a dead route.

export type LienWaiverStatus = 'GENERATED' | 'SENT' | 'SIGNED' | 'RECORDED' | 'EXPIRED'

export interface ApiLienWaiver {
  id: string
  projectId: string
  contractId: string
  milestoneId: string | null
  waiverType: 'CONDITIONAL' | 'UNCONDITIONAL'
  waiverScope: 'PARTIAL' | 'FINAL'
  status: LienWaiverStatus
  projectName: string
  throughDate: string
  waiverAmount: number | string
  documentUrl: string | null
  signedDocumentUrl: string | null
  generatedAt: string
  sentAt: string | null
  signedAt: string | null
}

export async function getProjectLienWaivers(
  projectId: string,
): Promise<{ waivers: ApiLienWaiver[] }> {
  return apiFetch<{ waivers: ApiLienWaiver[] }>(
    `/api/v1/payments/projects/${projectId}/lien-waivers`,
  )
}
