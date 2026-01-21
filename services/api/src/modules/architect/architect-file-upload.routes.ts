/**
 * Architect File Upload Routes
 * Handles file uploads with presigned URLs
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { architectFileUploadService } from './architect-file-upload.service'

const getPresignedUrlSchema = z.object({
  designProjectId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  folderId: z.string().uuid().optional(),
})

const completeUploadSchema = z.object({
  fileId: z.string().uuid(),
  fileKey: z.string().min(1),
})

export async function architectFileUploadRoutes(fastify: FastifyInstance) {
  // POST /architect/files/presigned-url - Get presigned URL for upload
  fastify.post(
    '/files/presigned-url',
    {
      preHandler: [
        authenticateUser,
        validateBody(getPresignedUrlSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as z.infer<typeof getPresignedUrlSchema>

        const result = await architectFileUploadService.getPresignedUrl(
          body.designProjectId,
          body.fileName,
          body.mimeType,
          body.fileSize,
          body.folderId || 'default', // Provide default value
          user.id
        )

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get presigned URL',
        })
      }
    }
  )

  // POST /architect/files/complete - Mark file upload as complete
  fastify.post(
    '/files/complete',
    {
      preHandler: [
        authenticateUser,
        validateBody(completeUploadSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as z.infer<typeof completeUploadSchema>

        const result = await architectFileUploadService.completeUpload(
          body.fileId,
          body.fileKey,
          user.id
        )

        return reply.send({ file: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to complete upload',
        })
      }
    }
  )

  // GET /architect/files/:fileId/download - Get download URL
  fastify.get(
    '/files/:fileId/download',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ fileId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { fileId } = request.params as { fileId: string }

        const result = await architectFileUploadService.getDownloadUrl(fileId, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get download URL',
        })
      }
    }
  )
}
