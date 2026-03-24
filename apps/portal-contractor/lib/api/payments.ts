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
