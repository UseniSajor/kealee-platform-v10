/**
 * markets.dto.ts — Multi-Market Expansion Operating System DTOs
 * Market jurisdictions, launch checklists, city/market management.
 */
import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const MarketStatusEnum = z.enum([
  'PLANNED',
  'SOFT_LAUNCH',
  'ACTIVE',
  'PAUSED',
  'DEPRECATED',
])

export const LaunchChecklistItemStatusEnum = z.enum([
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'SKIPPED',
])

export const LaunchChecklistCategoryEnum = z.enum([
  'LEGAL',
  'CONTRACTOR_SUPPLY',
  'DEMAND_GEN',
  'PRICING',
  'COMPLIANCE',
  'OPERATIONS',
])

// ─── Market management DTOs ───────────────────────────────────────────────────

export const CreateMarketDto = z.object({
  name: z.string().min(1),
  jurisdictionCode: z.string().min(2).max(20),   // e.g. "CA-LA", "TX-HOU"
  countryCode: z.string().length(2).default('US'),
  stateCode: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().default('America/Los_Angeles'),
  launchDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const UpdateMarketDto = CreateMarketDto.partial().extend({
  status: MarketStatusEnum.optional(),
})

export const CreateLaunchChecklistItemDto = z.object({
  marketId: z.string(),
  category: LaunchChecklistCategoryEnum,
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
})

export const UpdateLaunchChecklistItemDto = z.object({
  status: LaunchChecklistItemStatusEnum.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  completedAt: z.string().datetime().optional(),
})

export const SetMarketConfigDto = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface MarketDto {
  id: string
  name: string
  jurisdictionCode: string
  countryCode: string
  stateCode: string | null
  city: string | null
  timezone: string
  status: string
  launchDate: string | null
  notes: string | null
  createdAt: string
  checklistProgress: { total: number; done: number }
}

export interface LaunchChecklistItemDto {
  id: string
  marketId: string
  category: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
  assigneeId: string | null
  completedAt: string | null
}

export interface MarketStatsDto {
  marketId: string
  jurisdictionCode: string
  activeProjects: number
  registeredContractors: number
  openLeads: number
  completedContracts: number
}

// Inferred types
export type CreateMarketBody = z.infer<typeof CreateMarketDto>
export type UpdateMarketBody = z.infer<typeof UpdateMarketDto>
export type CreateLaunchChecklistItemBody = z.infer<typeof CreateLaunchChecklistItemDto>
export type UpdateLaunchChecklistItemBody = z.infer<typeof UpdateLaunchChecklistItemDto>
export type SetMarketConfigBody = z.infer<typeof SetMarketConfigDto>
