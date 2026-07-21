/**
 * engagement-exec.dto.ts
 * Engagement execution layer — wraps canonical ContractAgreement.
 * Change orders, milestone approvals, escrow state transitions, disputes.
 */
import { z } from 'zod'

// ─── Change Orders ────────────────────────────────────────────────────────────

export const CreateChangeOrderDto = z.object({
  contractId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  amountDelta: z.number(),        // positive = add, negative = deduct
  scheduleDeltaDays: z.number().int().optional(),
  reason: z.enum(['OWNER_REQUEST', 'UNFORESEEN_CONDITIONS', 'DESIGN_CHANGE', 'ERROR_OMISSION', 'CODE_REQUIREMENT']),
  supportingDocUrls: z.array(z.string().url()).optional(),
})

export const RespondChangeOrderDto = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'COUNTER']),
  counterAmountDelta: z.number().optional(),
  notes: z.string().optional(),
})

// ─── Milestone Approval ───────────────────────────────────────────────────────

export const SubmitMilestoneDto = z.object({
  milestoneId: z.string().uuid(),
  evidenceUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
})

export const ApproveMilestoneDto = z.object({
  milestoneId: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional(),
  holdbackRelease: z.number().min(0).max(100).optional(),  // % to release from holdback
})

// ─── Dispute / Hold ───────────────────────────────────────────────────────────

export const OpenDisputeDto = z.object({
  contractId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  requestedResolution: z.enum(['REFUND', 'REDO_WORK', 'PARTIAL_REFUND', 'MEDIATION']),
  evidenceUrls: z.array(z.string().url()).optional(),
})

export const ResolveDisputeDto = z.object({
  resolution: z.string().min(10).max(2000),
  resolutionType: z.enum(['REFUND', 'REDO_WORK', 'PARTIAL_REFUND', 'DISMISSED']),
  amountAdjustment: z.number().optional(),
})

// ─── Escrow ───────────────────────────────────────────────────────────────────

export const EscrowHoldDto = z.object({
  contractId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().max(500),
  expiresAt: z.string().datetime().optional(),
})

export const ReleaseEscrowDto = z.object({
  milestoneId: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().optional(),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface ChangeOrderDto {
  id: string
  contractId: string
  title: string
  description: string | null
  amountDelta: number
  scheduleDeltaDays: number | null
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COUNTERED' | 'WITHDRAWN'
  requestedById: string
  respondedById: string | null
  respondedAt: string | null
  counterAmountDelta: number | null
  notes: string | null
  createdAt: string
}

export interface MilestoneApprovalDto {
  milestoneId: string
  status: string
  approvedById: string | null
  approvedAt: string | null
  amount: number
  notes: string | null
}

export interface DisputeDto {
  id: string
  contractId: string
  reason: string
  status: string
  requestedResolution: string
  openedById: string
  createdAt: string
  resolvedAt: string | null
}

export interface EscrowStateDto {
  id: string
  contractId: string
  status: string
  currentBalance: number
  availableBalance: number
  heldBalance: number
  holdbackPercentage: number
  holds: EscrowHoldDetailDto[]
  recentTransactions: EscrowTransactionDto[]
}

export interface EscrowHoldDetailDto {
  id: string
  amount: number
  reason: string
  status: string
  expiresAt: string | null
}

export interface EscrowTransactionDto {
  id: string
  type: string
  amount: number
  description: string | null
  createdAt: string
}

// Inferred types
export type CreateChangeOrderBody = z.infer<typeof CreateChangeOrderDto>
export type RespondChangeOrderBody = z.infer<typeof RespondChangeOrderDto>
export type SubmitMilestoneBody = z.infer<typeof SubmitMilestoneDto>
export type ApproveMilestoneBody = z.infer<typeof ApproveMilestoneDto>
export type OpenDisputeBody = z.infer<typeof OpenDisputeDto>
export type ResolveDisputeBody = z.infer<typeof ResolveDisputeDto>
export type ReleaseEscrowBody = z.infer<typeof ReleaseEscrowDto>
