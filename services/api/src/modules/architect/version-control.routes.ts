import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { versionControlService } from './version-control.service'

const createBranchSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseBranchId: z.string().uuid().optional(),
  baseVersionId: z.string().uuid().optional(),
})

const createVersionSchema = z.object({
  branchId: z.string().uuid(),
  versionNumber: z.string().min(1),
  versionName: z.string().optional(),
  description: z.string().optional(),
  versionTag: z.enum(['SCHEMATIC_DESIGN', 'DESIGN_DEVELOPMENT', 'CONSTRUCTION_DOCUMENTS', 'BID', 'CONSTRUCTION', 'CUSTOM']).optional(),
  customTagName: z.string().optional(),
  fileSnapshots: z.any().optional(),
  sheetSnapshots: z.any().optional(),
  modelSnapshots: z.any().optional(),
})

const compareVersionsSchema = z.object({
  fromVersionId: z.string().uuid(),
  toVersionId: z.string().uuid(),
})

const mergeBranchSchema = z.object({
  sourceBranchId: z.string().uuid(),
  targetBranchId: z.string().uuid(),
  mergeDescription: z.string().optional(),
  conflictResolution: z.enum(['ACCEPT_THEIRS', 'ACCEPT_OURS', 'MANUAL_MERGE', 'CUSTOM']).optional(),
  resolvedConflicts: z.any().optional(),
})

const resolveMergeConflictsSchema = z.object({
  conflictResolution: z.enum(['ACCEPT_THEIRS', 'ACCEPT_OURS', 'MANUAL_MERGE', 'CUSTOM']),
  resolvedConflicts: z.any(),
})

const rollbackToVersionSchema = z.object({
  fromVersionId: z.string().uuid(),
  toVersionId: z.string().uuid(),
  rollbackReason: z.string().optional(),
  rollbackNotes: z.string().optional(),
  createBackup: z.boolean().optional(),
})

export async function versionControlRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/branches - Create branch
  fastify.post(
    '/design-projects/:projectId/branches',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createBranchSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createBranchSchema>
        const branch = await versionControlService.createBranch({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ branch })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create branch',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/branches - List branches
  fastify.get(
    '/design-projects/:projectId/branches',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          status?: string
          includeMerged?: string
        }
        const branches = await versionControlService.listBranches(projectId, {
          status: query.status,
          includeMerged: query.includeMerged === 'true',
        })
        return reply.send({ branches })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list branches',
        })
      }
    }
  )

  // GET /architect/branches/:id - Get branch
  fastify.get(
    '/branches/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const branch = await versionControlService.getBranch(id)
        return reply.send({ branch })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Branch not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/branches/default - Get or create default branch
  fastify.get(
    '/design-projects/:projectId/branches/default',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const branch = await versionControlService.getOrCreateDefaultBranch(projectId, user.id)
        return reply.send({ branch })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get default branch',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/versions - Create version
  fastify.post(
    '/design-projects/:projectId/versions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createVersionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createVersionSchema>
        const version = await versionControlService.createVersion({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ version })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create version',
        })
      }
    }
  )

  // GET /architect/versions/:id - Get version
  fastify.get(
    '/versions/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const version = await versionControlService.getVersion(id)
        return reply.send({ version })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Version not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/versions - List versions
  fastify.get(
    '/design-projects/:projectId/versions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          branchId?: string
          versionTag?: string
          isTagged?: string
        }
        const versions = await versionControlService.listVersions(projectId, {
          branchId: query.branchId,
          versionTag: query.versionTag,
          isTagged: query.isTagged === 'true' ? true : query.isTagged === 'false' ? false : undefined,
        })
        return reply.send({ versions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list versions',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/versions/compare - Compare versions
  fastify.post(
    '/design-projects/:projectId/versions/compare',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(compareVersionsSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof compareVersionsSchema>
        const comparison = await versionControlService.compareVersions({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.send({ comparison })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to compare versions',
        })
      }
    }
  )

  // GET /architect/comparisons/:id - Get comparison
  fastify.get(
    '/comparisons/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const comparison = await versionControlService.getComparison(id)
        return reply.send({ comparison })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Comparison not found',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/branches/merge - Merge branch
  fastify.post(
    '/design-projects/:projectId/branches/merge',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(mergeBranchSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof mergeBranchSchema>
        const merge = await versionControlService.mergeBranch({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.send({ merge })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to merge branch',
        })
      }
    }
  )

  // POST /architect/merges/:id/resolve - Resolve merge conflicts
  fastify.post(
    '/merges/:id/resolve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(resolveMergeConflictsSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof resolveMergeConflictsSchema>
        const merge = await versionControlService.resolveMergeConflicts(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ merge })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to resolve merge conflicts',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/versions/rollback - Rollback to version
  fastify.post(
    '/design-projects/:projectId/versions/rollback',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(rollbackToVersionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof rollbackToVersionSchema>
        const rollback = await versionControlService.rollbackToVersion({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.send({ rollback })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to rollback version',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/rollbacks - Get rollback history
  fastify.get(
    '/design-projects/:projectId/rollbacks',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const rollbacks = await versionControlService.getRollbackHistory(projectId)
        return reply.send({ rollbacks })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get rollback history',
        })
      }
    }
  )
}
