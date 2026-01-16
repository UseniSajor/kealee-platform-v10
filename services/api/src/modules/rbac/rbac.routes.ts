import { FastifyInstance } from 'fastify'
import { rbacService } from './rbac.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { createRoleSchema, createPermissionSchema, checkPermissionSchema } from '../../schemas'
import { NotFoundError } from '../../errors/app.error'
import { z } from 'zod'

export async function rbacRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // ROLES
  // ============================================================================

  // POST /rbac/roles - Create role
  fastify.post(
    '/roles',
    {
      preHandler: [authenticateUser, validateBody(createRoleSchema)],
    },
    async (request, reply) => {
      try {
        const { key, name, description } = request.body as {
          key: string
          name: string
          description?: string
        }

        const role = await rbacService.createRole({ key, name, description })
        return reply.code(201).send({ role })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create role',
        })
      }
    }
  )

  // GET /rbac/roles - List all roles
  fastify.get('/roles', async (request, reply) => {
    try {
      const roles = await rbacService.listRoles()
      return reply.send({ roles })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to list roles',
      })
    }
  })

  // GET /rbac/roles/:key - Get role by key
  fastify.get(
    '/roles/:key',
    { preHandler: validateParams(z.object({ key: z.string().min(1) })) },
    async (request, reply) => {
      try {
        const { key } = request.params as { key: string }
      const role = await rbacService.getRoleByKey(key)
      return reply.send({ role })
    } catch (error: any) {
      fastify.log.error(error)
      const statusCode = error.message === 'Role not found' ? 404 : 500
      return reply.code(statusCode).send({
        error: error.message || 'Failed to get role',
      })
    }
  })

  // GET /rbac/roles/:key/permissions - Get permissions for a role
  fastify.get('/roles/:key/permissions', async (request, reply) => {
    try {
      const { key } = request.params as { key: string }
      const permissions = await rbacService.getRolePermissions(key)
      return reply.send({ permissions })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to get role permissions',
      })
    }
  })

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  // POST /rbac/permissions - Create permission
  fastify.post(
    '/permissions',
    {
      preHandler: [authenticateUser, validateBody(createPermissionSchema)],
    },
    async (request, reply) => {
      try {
        const { key, name, description } = request.body as {
          key: string
          name: string
          description?: string
        }

        const permission = await rbacService.createPermission({
          key,
          name,
          description,
        })
        return reply.code(201).send({ permission })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create permission',
        })
      }
    }
  )

  // GET /rbac/permissions - List all permissions
  fastify.get('/permissions', async (request, reply) => {
    try {
      const permissions = await rbacService.listPermissions()
      return reply.send({ permissions })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to list permissions',
      })
    }
  })

  // GET /rbac/permissions/:key - Get permission by key
  fastify.get('/permissions/:key', async (request, reply) => {
    try {
      const { key } = request.params as { key: string }
      const permission = await rbacService.getPermissionByKey(key)
      return reply.send({ permission })
    } catch (error: any) {
      fastify.log.error(error)
      const statusCode = error.message === 'Permission not found' ? 404 : 500
      return reply.code(statusCode).send({
        error: error.message || 'Failed to get permission',
      })
    }
  })

  // ============================================================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ============================================================================

  // POST /rbac/roles/:roleKey/permissions/:permissionKey - Assign permission to role
  fastify.post(
    '/roles/:roleKey/permissions/:permissionKey',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { roleKey, permissionKey } = request.params as {
          roleKey: string
          permissionKey: string
        }

        const rolePermission = await rbacService.assignPermissionToRole(
          roleKey,
          permissionKey
        )
        return reply.code(201).send({ rolePermission })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to assign permission to role',
        })
      }
    }
  )

  // DELETE /rbac/roles/:roleKey/permissions/:permissionKey - Remove permission from role
  fastify.delete(
    '/roles/:roleKey/permissions/:permissionKey',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { roleKey, permissionKey } = request.params as {
          roleKey: string
          permissionKey: string
        }

        await rbacService.removePermissionFromRole(roleKey, permissionKey)
        return reply.send({ message: 'Permission removed from role' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to remove permission from role',
        })
      }
    }
  )

  // ============================================================================
  // USER PERMISSIONS
  // ============================================================================

  // GET /rbac/users/:userId/orgs/:orgId/permissions - Get user's permissions in org
  fastify.get(
    '/users/:userId/orgs/:orgId/permissions',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { userId, orgId } = request.params as {
          userId: string
          orgId: string
        }

        const permissions = await rbacService.getUserPermissions(userId, orgId)
        return reply.send({ permissions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get user permissions',
        })
      }
    }
  )

  // GET /rbac/users/:userId/orgs/:orgId/role - Get user's role in org
  fastify.get(
    '/users/:userId/orgs/:orgId/role',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { userId, orgId } = request.params as {
          userId: string
          orgId: string
        }

        const role = await rbacService.getUserRole(userId, orgId)
        if (!role) {
          return reply.code(404).send({
            error: 'User is not a member of this organization',
          })
        }

        return reply.send({ role })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get user role',
        })
      }
    }
  )

  // POST /rbac/check - Check if user has permission
  fastify.post(
    '/check',
    {
      preHandler: [authenticateUser, validateBody(checkPermissionSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { orgId, permissionKey } = request.body as {
          orgId: string
          permissionKey: string
        }

        const hasPermission = await rbacService.userHasPermission(
          user.id,
          orgId,
          permissionKey
        )

        return reply.send({
          hasPermission,
          userId: user.id,
          orgId,
          permissionKey,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to check permission',
        })
      }
    }
  )
}
