import { z } from 'zod'

export const projectCategorySchema = z.enum([
  'KITCHEN',
  'BATHROOM',
  'ADDITION',
  'NEW_CONSTRUCTION',
  'RENOVATION',
  'OTHER',
])

export const createProjectSchema = z.object({
  orgId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: projectCategorySchema,
  categoryMetadata: z.unknown().optional(),
  adminOverride: z.boolean().optional(),
  adminReason: z.string().optional(),
})

export const updateProjectSchema = z.object({
  orgId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: projectCategorySchema.optional(),
  categoryMetadata: z.unknown().nullable().optional(),

  propertyId: z.string().uuid().nullable().optional(),
  budgetTotal: z.number().nonnegative().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  status: z.enum(['DRAFT', 'READINESS', 'CONTRACTING', 'ACTIVE', 'CLOSEOUT', 'COMPLETED', 'CANCELLED']).optional(),
})

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'CONTRACTOR', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER']),
})

