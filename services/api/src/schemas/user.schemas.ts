import { z } from 'zod'

/**
 * User request schemas
 */
export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
})

export const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  search: z.string().optional(),
})
