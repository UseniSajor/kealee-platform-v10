/**
 * File Upload Routes
 * Handles S3/R2 presigned URLs and file metadata
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware'
import { fileService } from './file.service'
import { fileValidationService } from './file-validation.service'

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
            allowedCategories: z.array(z.enum(['image', 'document', 'drawing', 'video', 'archive'])).optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { fileName, mimeType, metadata, allowedCategories } = request.body as {
          fileName: string
          mimeType: string
          metadata?: Record<string, string>
          allowedCategories?: Array<'image' | 'document' | 'drawing' | 'video' | 'archive'>
        }

        // Validate file type before generating presigned URL
        const validation = fileValidationService.validateFileType(
          mimeType,
          fileName,
          allowedCategories || ['image', 'document']
        )
        if (!validation.valid) {
          return reply.code(400).send({ error: validation.error })
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

  // POST /files - Direct file upload (multipart/form-data)
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const data = await request.file()

        if (!data) {
          return reply.code(400).send({ error: 'No file provided' })
        }

        // Parse metadata if provided
        let metadata: Record<string, string> = {}
        const metadataField = (request.body as any)?.metadata
        if (metadataField) {
          try {
            metadata = typeof metadataField === 'string' ? JSON.parse(metadataField) : metadataField
          } catch {
            // Ignore invalid JSON
          }
        }

        const folder = (request.body as any)?.folder || 'uploads'

        // Read file buffer
        const buffer = await data.toBuffer()

        // Upload file
        const result = await fileService.uploadFile(
          buffer,
          data.filename,
          data.mimetype || 'application/octet-stream',
          buffer.length,
          user.id,
          folder,
          metadata
        )

        return reply.code(201).send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'File upload failed',
        })
      }
    }
  )

  // GET /files - List user's files
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(
          z.object({
            folder: z.string().optional(),
            limit: z.string().optional().transform((val) => parseInt(val || '50')),
            offset: z.string().optional().transform((val) => parseInt(val || '0')),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const query = request.query as {
          folder?: string
          limit?: number
          offset?: number
        }

        const result = await fileService.listFiles(user.id, {
          folder: query.folder,
          limit: query.limit,
          offset: query.offset,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to list files',
        })
      }
    }
  )

  // GET /files/:id - Get file metadata
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
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

  // GET /files/:id/download - Get download URL
  fastify.get(
    '/:id/download',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await fileService.getDownloadUrlById(id, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get download URL',
        })
      }
    }
  )

  // DELETE /files/:id - Delete file
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await fileService.deleteFile(id, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to delete file',
        })
      }
    }
  )
}
