import { z } from 'zod'

/**
 * RBAC request schemas
 */
export const createRoleSchema = z.object({
  key: z.string().min(1, 'Role key is required'),
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
})

export const createPermissionSchema = z.object({
  key: z.string().min(1, 'Permission key is required'),
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional(),
})

export const checkPermissionSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
  permissionKey: z.string().min(1, 'Permission key is required'),
})
