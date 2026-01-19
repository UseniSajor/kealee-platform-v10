/**
 * Architect Version Control Routes
 * Handles file versioning
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { architectVersionControlService } from './architect-version-control.service'

const createVersionSchema = z.object({
  fileKey: z.string().min(1),
  fileUrl: z.string().url(),
  changeDescription: z.string().optional(),
})

const rollbackSchema = z.object({
  targetVersion: z.number().int().positive(),
  reason: z.string().optional(),
})

export async function architectVersionControlRoutes(fastify: FastifyInstance) {
  // POST /architect/files/:id/versions - Create new version
  fastify.post(
    '/files/:id/versions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createVersionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { fileKey, fileUrl, changeDescription } = request.body as {
          fileKey: string
          fileUrl: string
          changeDescription?: string
        }

        const result = await architectVersionControlService.createFileVersion(
          id,
          fileKey,
          fileUrl,
          user.id,
          changeDescription
        )

        return reply.send({ version: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create version',
        })
      }
    }
  )

  // GET /architect/files/:id/versions - Get version history
  fastify.get(
    '/files/:id/versions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await architectVersionControlService.getFileVersionHistory(id, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get version history',
        })
      }
    }
  )

  // POST /architect/files/:id/rollback - Rollback to previous version
  fastify.post(
    '/files/:id/rollback',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(rollbackSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { targetVersion, reason } = request.body as {
          targetVersion: number
          reason?: string
        }

        const result = await architectVersionControlService.rollbackToVersion(
          id,
          targetVersion,
          user.id,
          reason
        )

        return reply.send({ version: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to rollback version',
        })
      }
    }
  )

  // GET /architect/files/:id/compare - Compare two versions
  fastify.get(
    '/files/:id/compare',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { version1, version2 } = request.query as {
          version1?: string
          version2?: string
        }

        if (!version1 || !version2) {
          return reply.code(400).send({
            error: 'Both version1 and version2 query parameters are required',
          })
        }

        const result = await architectVersionControlService.compareVersions(
          id,
          parseInt(version1),
          parseInt(version2),
          user.id
        )

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to compare versions',
        })
      }
    }
  )
}
