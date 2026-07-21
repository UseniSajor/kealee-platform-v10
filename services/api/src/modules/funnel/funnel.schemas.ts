import { z } from 'zod'

export const createSessionSchema = z.object({
  utmParams: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
    })
    .optional(),
})

export const updateSessionSchema = z.object({
  userType: z
    .enum(['HOMEOWNER', 'CONTRACTOR', 'ARCHITECT', 'INVESTOR', 'PROPERTY_MANAGER'])
    .optional(),
  projectType: z
    .enum([
      'KITCHEN_REMODEL', 'BATHROOM_REMODEL', 'WHOLE_HOME', 'ADDITION',
      'NEW_CONSTRUCTION', 'EXTERIOR', 'LANDSCAPING', 'COMMERCIAL',
    ])
    .optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  budget: z
    .enum(['UNDER_25K', 'RANGE_25K_50K', 'RANGE_50K_100K', 'RANGE_100K_250K', 'OVER_250K'])
    .optional(),
  timeline: z
    .enum(['ASAP', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'SIX_TO_TWELVE_MONTHS', 'JUST_EXPLORING'])
    .optional(),
  currentStep: z.number().int().min(0).max(4).optional(),
})

export const sessionIdParam = z.object({
  sessionId: z.string().uuid(),
})

export const captureLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  projectType: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  campaignSlug: z.string().max(100).optional(),
})
