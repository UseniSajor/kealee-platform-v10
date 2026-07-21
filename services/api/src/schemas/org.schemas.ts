import { z } from 'zod'

/**
 * Organization request schemas
 */
export const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
})

export const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
})

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleKey: z.string().min(1, 'Role key is required'),
})

export const updateMemberRoleSchema = z.object({
  roleKey: z.string().min(1, 'Role key is required'),
})

export const listOrgsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  search: z.string().optional(),
})
