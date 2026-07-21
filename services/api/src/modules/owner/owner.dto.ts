/**
 * owner.dto.ts
 * DTOs / Zod validation schemas for the Owner module.
 * All shapes represent owner-visible data — never expose contractor-internal fields.
 */
import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ProjectCategoryEnum = z.enum([
  'KITCHEN',
  'BATHROOM',
  'ADDITION',
  'NEW_CONSTRUCTION',
  'RENOVATION',
  'MULTIFAMILY',
  'COMMERCIAL',
  'OTHER',
])

export const ConstructionReadinessEnum = z.enum([
  'NOT_READY',
  'DESIGN_READY',
  'PERMITS_SUBMITTED',
  'CONSTRUCTION_READY',
])

// ─── Project DTOs ─────────────────────────────────────────────────────────────

export const CreateProjectBodyDto = z.object({
  name: z.string().min(3).max(100),
  category: ProjectCategoryEnum,
  description: z.string().max(2000).optional(),
  budgetTotal: z.number().positive().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().max(10).optional(),
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
  adminOverride: z.boolean().optional(),
  adminReason: z.string().optional(),
})

export const UpdateProjectBodyDto = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  budgetTotal: z.number().positive().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
})

export const ProjectParamsDto = z.object({
  id: z.string().uuid(),
})

export const EngagementParamsDto = z.object({
  contractId: z.string().uuid(),
})

export const AdvanceReadinessBodyDto = z.object({
  targetGate: ConstructionReadinessEnum,
  notes: z.string().optional(),
})

// ─── Response shapes (not enforced server-side but document the contract) ─────

export interface ProjectSummaryDto {
  id: string
  name: string
  category: string
  status: string
  currentPhase: string | null
  constructionReadiness: string
  budgetTotal: number | null
  address: string | null
  city: string | null
  state: string | null
  scheduledStartDate: string | null
  scheduledEndDate: string | null
  createdAt: string
  memberCount: number
  openEngagements: number
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  description: string | null
  orgId: string | null
  ownerId: string
  memberships: MembershipDto[]
  phases: PhaseDto[]
  readiness: ReadinessDto
}

export interface MembershipDto {
  id: string
  userId: string
  role: string
  name: string | null
  email: string
}

export interface PhaseDto {
  id: string
  name: string
  status: string
  order: number
  startedAt: string | null
  completedAt: string | null
}

export interface ReadinessDto {
  gate: string
  items: ReadinessItemDto[]
  completedCount: number
  totalCount: number
  canAdvance: boolean
}

export interface ReadinessItemDto {
  id: string
  label: string
  category: string
  status: string
  required: boolean
  completedAt: string | null
  notes: string | null
}

export interface EngagementSummaryDto {
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

export interface EngagementDetailDto extends EngagementSummaryDto {
  milestones: MilestoneDto[]
  escrow: EscrowDto | null
  disputes: DisputeDto[]
}

export interface MilestoneDto {
  id: string
  name: string
  description: string | null
  amount: number
  status: string
  completedAt: string | null
  approvedAt: string | null
  paidAt: string | null
  order: number
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

export interface TimelineEventDto {
  id: string
  type: 'PHASE_CHANGE' | 'READINESS_ADVANCE' | 'ENGAGEMENT_CREATED' | 'MILESTONE_PAID' | 'DISPUTE_OPENED' | 'PROJECT_CREATED'
  title: string
  description: string | null
  occurredAt: string
  actorId: string | null
  actorName: string | null
  metadata: Record<string, unknown>
}

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateProjectBody = z.infer<typeof CreateProjectBodyDto>
export type UpdateProjectBody = z.infer<typeof UpdateProjectBodyDto>
export type ProjectParams = z.infer<typeof ProjectParamsDto>
export type EngagementParams = z.infer<typeof EngagementParamsDto>
export type AdvanceReadinessBody = z.infer<typeof AdvanceReadinessBodyDto>
