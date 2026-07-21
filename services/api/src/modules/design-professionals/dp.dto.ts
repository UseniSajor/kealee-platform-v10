/**
 * dp.dto.ts — Design Professionals DTOs
 * Additive module — does not touch canonical Project/Engagement models.
 */
import { z } from 'zod'

export const DPRoleEnum = z.enum([
  'ARCHITECT',
  'STRUCTURAL_ENGINEER',
  'MEP_ENGINEER',
  'CIVIL_ENGINEER',
  'LANDSCAPE_ARCHITECT',
  'INTERIOR_DESIGNER',
])

export const DPStatusEnum = z.enum([
  'PENDING_REVIEW',
  'VERIFIED',
  'SUSPENDED',
  'REJECTED',
])

export const RegisterDPBodyDto = z.object({
  role: DPRoleEnum,
  licenseNumber: z.string().min(3).max(50).optional(),
  licenseState: z.string().length(2).optional(),
  licenseExpiry: z.string().datetime().optional(),
  firmName: z.string().max(100).optional(),
  portfolioUrl: z.string().url().optional(),
  specialties: z.array(z.string()).max(10).optional(),
  bio: z.string().max(1000).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  jurisdictions: z.array(z.string()).max(20).optional(),
})

export const UpdateDPProfileDto = RegisterDPBodyDto.partial()

export const DPParamsDto = z.object({ id: z.string().uuid() })
export const DPUserParamsDto = z.object({ userId: z.string().uuid() })

export const AssignDPBodyDto = z.object({
  projectId: z.string().uuid(),
  professionalId: z.string().uuid(),
  role: z.string().min(2).max(50),
  notes: z.string().optional(),
})

export const UpdateAssignmentBodyDto = z.object({
  status: z.enum(['INVITED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DECLINED']),
  notes: z.string().optional(),
})

// Response shapes
export interface DPProfileDto {
  id: string
  userId: string
  role: string
  status: string
  firmName: string | null
  licenseNumber: string | null
  licenseState: string | null
  licenseExpiry: string | null
  portfolioUrl: string | null
  specialties: string[]
  bio: string | null
  yearsExperience: number | null
  jurisdictions: string[]
  verifiedAt: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

export interface DPAssignmentDto {
  id: string
  projectId: string
  professionalId: string
  role: string
  status: string
  invitedAt: string
  acceptedAt: string | null
  completedAt: string | null
}

export type RegisterDPBody = z.infer<typeof RegisterDPBodyDto>
export type UpdateDPProfile = z.infer<typeof UpdateDPProfileDto>
export type DPParams = z.infer<typeof DPParamsDto>
export type AssignDPBody = z.infer<typeof AssignDPBodyDto>
export type UpdateAssignmentBody = z.infer<typeof UpdateAssignmentBodyDto>
