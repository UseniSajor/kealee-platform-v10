/**
 * engagement.ts
 * Owner-portal API client for engagements (ContractAgreements).
 */
import { apiFetch } from './client'

export interface MilestoneDto {
  id: string
  name: string
  description: string | null
  amount: number
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'DISPUTED'
  order: number
  completedAt: string | null
  approvedAt: string | null
  paidAt: string | null
}

export interface EscrowDto {
  id: string
  status: string
  totalContractAmount: number
  currentBalance: number
  availableBalance: number
  heldBalance: number
  holdbackPercentage: number
}

export interface DisputeDto {
  id: string
  reason: string
  status: string
  createdAt: string
}

export interface EngagementSummary {
  id: string
  projectId: string
  contractorId: string
  contractorName: string | null
  amount: number
  status: string
  signedAt: string | null
  expiresAt: string | null
  milestoneCount: number
  paidAmount: number
  pendingAmount: number
  escrowBalance: number | null
}

export interface EngagementDetail extends EngagementSummary {
  milestones: MilestoneDto[]
  escrow: EscrowDto | null
  disputes: DisputeDto[]
}

export interface TimelineEvent {
  id: string
  type: string
  title: string
  description: string | null
  occurredAt: string
  actorId: string | null
  actorName: string | null
  metadata: Record<string, unknown>
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function listProjectEngagements(projectId: string): Promise<EngagementSummary[]> {
  const res = await apiFetch<{ engagements: EngagementSummary[] }>(
    `/owner/projects/${projectId}/engagements`
  )
  return res.engagements
}

export async function getEngagement(contractId: string): Promise<EngagementDetail> {
  const res = await apiFetch<{ engagement: EngagementDetail }>(
    `/owner/engagements/${contractId}`
  )
  return res.engagement
}

export async function getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
  const res = await apiFetch<{ events: TimelineEvent[] }>(
    `/owner/projects/${projectId}/timeline`
  )
  return res.events
}

export async function advanceReadiness(
  projectId: string,
  targetGate: string,
  notes?: string
): Promise<{ projectId: string; gate: string }> {
  return apiFetch(`/owner/projects/${projectId}/readiness/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetGate, notes }),
  })
}
