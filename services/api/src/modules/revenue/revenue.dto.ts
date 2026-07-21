/**
 * revenue.dto.ts — Revenue Optimization Layer DTOs
 * Subscription plans, lead pricing, sponsored placements, upsell offers.
 */
import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const PlanTierEnum = z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
export const BillingIntervalEnum = z.enum(['MONTHLY', 'ANNUAL'])
export const LeadPricingStrategyEnum = z.enum(['FLAT', 'AUCTION', 'SUBSCRIPTION_INCLUDED'])
export const PlacementTypeEnum = z.enum(['FEATURED_CONTRACTOR', 'FEATURED_PROJECT', 'BANNER_AD', 'CATEGORY_SPONSOR'])
export const UpsellTriggerEnum = z.enum([
  'LEAD_LIMIT_REACHED',
  'READINESS_ADVANCE_BLOCKED',
  'REPORT_EXPORT_BLOCKED',
  'AI_CHAT_LIMIT_REACHED',
  'ADVANCED_ANALYTICS_BLOCKED',
])

// ─── Admin create/update DTOs ─────────────────────────────────────────────────

export const CreateSubscriptionPlanDto = z.object({
  name: z.string().min(1),
  tier: PlanTierEnum,
  monthlyPriceCents: z.number().int().nonnegative(),
  annualPriceCents: z.number().int().nonnegative(),
  features: z.record(z.unknown()),          // flexible feature flags
  leadCreditsPerMonth: z.number().int().nonnegative().optional(),
  maxProjects: z.number().int().positive().optional(),
  maxTeamMembers: z.number().int().positive().optional(),
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdAnnual: z.string().optional(),
})

export const UpdateSubscriptionPlanDto = CreateSubscriptionPlanDto.partial().extend({
  active: z.boolean().optional(),
})

export const CreateLeadPricingDto = z.object({
  tradeCategory: z.string().min(1),
  jurisdictionCode: z.string().min(1),
  strategy: LeadPricingStrategyEnum,
  flatPriceCents: z.number().int().nonnegative().optional(),
  minBidCents: z.number().int().nonnegative().optional(),
  maxBidCents: z.number().int().nonnegative().optional(),
})

export const CreateSponsoredPlacementDto = z.object({
  placementType: PlacementTypeEnum,
  entityId: z.string(),
  entityType: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budgetCents: z.number().int().positive(),
  targetJurisdictions: z.array(z.string()).optional(),
  targetTradeCategories: z.array(z.string()).optional(),
})

// ─── User-facing ──────────────────────────────────────────────────────────────

export const GetUpsellOfferDto = z.object({
  trigger: UpsellTriggerEnum,
  context: z.record(z.unknown()).optional(),
})

export const StartCheckoutDto = z.object({
  planId: z.string(),
  interval: BillingIntervalEnum,
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface SubscriptionPlanDto {
  id: string
  name: string
  tier: string
  monthlyPriceCents: number
  annualPriceCents: number
  features: Record<string, unknown>
  leadCreditsPerMonth: number | null
  maxProjects: number | null
  maxTeamMembers: number | null
  active: boolean
  stripePriceIdMonthly: string | null
  stripePriceIdAnnual: string | null
}

export interface LeadPricingDto {
  id: string
  tradeCategory: string
  jurisdictionCode: string
  strategy: string
  flatPriceCents: number | null
  minBidCents: number | null
  maxBidCents: number | null
  active: boolean
}

export interface UpsellOfferDto {
  trigger: string
  headline: string
  body: string
  ctaLabel: string
  ctaUrl: string
  recommendedPlanId: string | null
}

export interface CheckoutSessionDto {
  checkoutUrl: string
  sessionId: string
}

// Inferred types
export type CreateSubscriptionPlanBody = z.infer<typeof CreateSubscriptionPlanDto>
export type UpdateSubscriptionPlanBody = z.infer<typeof UpdateSubscriptionPlanDto>
export type CreateLeadPricingBody = z.infer<typeof CreateLeadPricingDto>
export type CreateSponsoredPlacementBody = z.infer<typeof CreateSponsoredPlacementDto>
export type GetUpsellOfferBody = z.infer<typeof GetUpsellOfferDto>
export type StartCheckoutBody = z.infer<typeof StartCheckoutDto>
