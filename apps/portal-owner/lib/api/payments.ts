/**
 * portal-owner/lib/api/payments.ts
 * Typed wrappers for milestone payment endpoints.
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
  evidence?: Array<{ id: string; type: string; fileUrl: string; caption?: string }>
}

export interface MilestonesStats {
  total: number
  completed: number
  totalAmount: number
  paidAmount: number
  progressPercentage: number
  paymentProgress: number
}

export interface ProjectMilestonesResponse {
  milestones: ApiMilestone[]
  statistics: MilestonesStats
}

export interface PaymentSummary {
  totalBudget?: number
  totalPaid?: number
  totalRetainage?: number
  escrowBalance?: number
}

export async function getProjectMilestones(
  projectId: string,
): Promise<ProjectMilestonesResponse> {
  return apiFetch<ProjectMilestonesResponse>(
    `/api/v1/payments/projects/${projectId}/milestones`,
  )
}

export async function getProjectPaymentSummary(
  projectId: string,
): Promise<PaymentSummary> {
  return apiFetch<PaymentSummary>(
    `/api/v1/payments/projects/${projectId}/summary`,
  )
}

/** Owner approves a submitted milestone */
export async function approveMilestone(
  milestoneId: string,
): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/milestones/${milestoneId}/approve`, { method: 'POST' })
}

/** Owner releases payment for an approved milestone */
export async function releaseMilestonePayment(
  projectId: string,
  milestoneId: string,
): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/api/v1/payments/projects/${projectId}/milestones/${milestoneId}/pay`, {
    method: 'POST',
  })
}
