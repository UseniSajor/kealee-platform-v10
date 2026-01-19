/**
 * File Upload Routes
 * Handles S3/R2 presigned URLs and file metadata
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { fileService } from './file.service'

export async function fileRoutes(fastify: FastifyInstance) {
  // POST /files/presigned-url - Get presigned URL for upload
  fastify.post(
    '/presigned-url',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            fileName: z.string().min(1),
            mimeType: z.string().min(1),
            metadata: z.record(z.string()).optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { fileName, mimeType, metadata } = request.body as {
          fileName: string
          mimeType: string
          metadata?: Record<string, string>
        }

        const result = await fileService.getPresignedUrl(fileName, mimeType, user.id, metadata)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get presigned URL',
        })
      }
    }
  )

  // POST /files/complete - Mark file upload as complete
  fastify.post(
    '/complete',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            key: z.string().min(1),
            fileName: z.string().min(1),
            mimeType: z.string().min(1),
            size: z.number().int().positive(),
            metadata: z.record(z.string()).optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as {
          key: string
          fileName: string
          mimeType: string
          size: number
          metadata?: Record<string, string>
        }

        const file = await fileService.completeUpload(body.key, body.fileName, body.mimeType, body.size, user.id, body.metadata)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to complete upload',
        })
      }
    }
  )

  // GET /files/:id - Get file metadata
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateBody(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const file = await fileService.getFile(id, user.id)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get file',
        })
      }
    }
  )
}
