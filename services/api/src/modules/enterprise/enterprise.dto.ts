/**
 * enterprise.dto.ts — Enterprise/B2B Platform Layer DTOs
 * Portfolio organizations, team roles, feature flags, partner integrations.
 */
import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const TeamRoleEnum = z.enum([
  'OWNER',
  'ADMIN',
  'PROJECT_MANAGER',
  'ESTIMATOR',
  'FINANCE',
  'VIEWER',
])

export const OrgEntitlementStatusEnum = z.enum(['ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED'])

export const PartnerTypeEnum = z.enum([
  'LENDER',
  'TITLE_COMPANY',
  'INSURANCE_PROVIDER',
  'MATERIAL_SUPPLIER',
  'EQUIPMENT_RENTAL',
  'SURETY',
])

export const FeatureFlagScopeEnum = z.enum(['GLOBAL', 'ORG', 'USER', 'MARKET'])

// ─── Portfolio Org DTOs ───────────────────────────────────────────────────────

export const CreatePortfolioOrgDto = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),          // e.g. "acme.com" for SSO matching
  logoUrl: z.string().url().optional(),
  planId: z.string().optional(),           // links to SubscriptionPlan
  notes: z.string().optional(),
})

export const UpdatePortfolioOrgDto = CreatePortfolioOrgDto.partial()

// ─── Team membership DTOs ─────────────────────────────────────────────────────

export const InviteTeamMemberDto = z.object({
  orgId: z.string(),
  email: z.string().email(),
  role: TeamRoleEnum,
  projectIds: z.array(z.string()).optional(),  // restrict to specific projects
})

export const UpdateTeamMemberRoleDto = z.object({
  role: TeamRoleEnum,
  projectIds: z.array(z.string()).optional(),
})

// ─── Feature flag DTOs ────────────────────────────────────────────────────────

export const SetFeatureFlagDto = z.object({
  flagKey: z.string().min(1),
  enabled: z.boolean(),
  scope: FeatureFlagScopeEnum,
  scopeId: z.string().optional(),  // orgId, userId, or marketId depending on scope
  rolloutPercent: z.number().min(0).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
})

export const CheckFeatureFlagDto = z.object({
  flagKey: z.string(),
  orgId: z.string().optional(),
  userId: z.string().optional(),
  marketCode: z.string().optional(),
})

// ─── Partner integration DTOs ─────────────────────────────────────────────────

export const RegisterPartnerDto = z.object({
  name: z.string().min(1),
  partnerType: PartnerTypeEnum,
  webhookUrl: z.string().url().optional(),
  apiKeyHash: z.string().optional(),
  contactEmail: z.string().email().optional(),
  markets: z.array(z.string()).optional(),    // jurisdiction codes
  metadata: z.record(z.unknown()).optional(),
})

// ─── Entitlement DTOs ─────────────────────────────────────────────────────────

export const GrantEntitlementDto = z.object({
  orgId: z.string(),
  featureKey: z.string().min(1),
  status: OrgEntitlementStatusEnum,
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface PortfolioOrgDto {
  id: string
  name: string
  domain: string | null
  logoUrl: string | null
  planId: string | null
  memberCount: number
  projectCount: number
  createdAt: string
}

export interface TeamMemberDto {
  id: string
  orgId: string
  userId: string
  email: string
  role: string
  projectIds: string[]
  invitedAt: string
  joinedAt: string | null
}

export interface FeatureFlagDto {
  flagKey: string
  enabled: boolean
  scope: string
  scopeId: string | null
  rolloutPercent: number | null
  expiresAt: string | null
}

export interface EntitlementDto {
  id: string
  orgId: string
  featureKey: string
  status: string
  expiresAt: string | null
}

export interface PartnerDto {
  id: string
  name: string
  partnerType: string
  active: boolean
  markets: string[]
  contactEmail: string | null
}

// Inferred types
export type CreatePortfolioOrgBody = z.infer<typeof CreatePortfolioOrgDto>
export type UpdatePortfolioOrgBody = z.infer<typeof UpdatePortfolioOrgDto>
export type InviteTeamMemberBody = z.infer<typeof InviteTeamMemberDto>
export type UpdateTeamMemberRoleBody = z.infer<typeof UpdateTeamMemberRoleDto>
export type SetFeatureFlagBody = z.infer<typeof SetFeatureFlagDto>
export type CheckFeatureFlagBody = z.infer<typeof CheckFeatureFlagDto>
export type RegisterPartnerBody = z.infer<typeof RegisterPartnerDto>
export type GrantEntitlementBody = z.infer<typeof GrantEntitlementDto>
