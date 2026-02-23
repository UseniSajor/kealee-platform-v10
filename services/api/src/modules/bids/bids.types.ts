import { z } from 'zod'

export const createOpportunityBidSchema = z.object({
  source: z.enum(['BUILDINGCONNECTED', 'EMARYLAND_MARKETPLACE', 'OPENGOV', 'SHA_MDOT', 'DIRECT_EMAIL', 'NETWORKING', 'OTHER']),
  externalId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  projectName: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().default('MD'),
  ownerName: z.string().optional(),
  gcName: z.string().optional(),
  estimatedValue: z.number().optional(),
  bidDeadline: z.string().datetime(),
  prebidDate: z.string().datetime().optional(),
  projectStart: z.string().datetime().optional(),
  projectEnd: z.string().datetime().optional(),
})

export const updateOpportunityBidSchema = z.object({
  status: z.enum(['DISCOVERED', 'REVIEWING', 'PREPARING', 'READY', 'SUBMITTED', 'AWARDED', 'LOST', 'NO_BID', 'EXPIRED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  bidAmount: z.number().optional(),
  assignedTo: z.string().optional(),
  internalNotes: z.string().optional(),
  decisionNotes: z.string().optional(),
})

export const listBidsQuerySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  state: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(25),
  sortBy: z.string().default('bidDeadline'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type CreateOpportunityBid = z.infer<typeof createOpportunityBidSchema>
export type UpdateOpportunityBid = z.infer<typeof updateOpportunityBidSchema>
export type ListBidsQuery = z.infer<typeof listBidsQuerySchema>
