import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { designFileService } from './design-file.service'

const uploadFileSchema = z.object({
  folderId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().optional(),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const bulkUploadSchema = z.object({
  folderId: z.string().uuid().optional(),
  files: z.array(
    z.object({
      fileName: z.string().min(1),
      fileSize: z.number().int().positive(),
      mimeType: z.string().optional(),
      fileUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
    })
  ),
})

const createFolderSchema = z.object({
  name: z.string().min(1),
  parentFolderId: z.string().uuid().optional(),
  folderType: z.string().optional(),
})

const checkOutFileSchema = z.object({
  comment: z.string().optional(),
})

const checkInFileSchema = z.object({
  newFileUrl: z.string().url().optional(),
})

const lockFileSchema = z.object({
  reason: z.string().optional(),
})

export async function designFileRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/files/initialize-folders - Initialize AIA folders
  fastify.post(
    '/design-projects/:projectId/files/initialize-folders',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const folders = await designFileService.initializeAIAFolders(projectId)
        return reply.send({ folders })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to initialize folders',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/folders - Create folder
  fastify.post(
    '/design-projects/:projectId/folders',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createFolderSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createFolderSchema>
        const folder = await designFileService.createFolder({
          designProjectId: projectId,
          ...body,
          userId: user.id,
        })
        return reply.code(201).send({ folder })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create folder',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/folders - List folders
  fastify.get(
    '/design-projects/:projectId/folders',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { parentFolderId?: string }
        const folders = await designFileService.listFolders(projectId, query.parentFolderId)
        return reply.send({ folders })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list folders',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/files - Upload file
  fastify.post(
    '/design-projects/:projectId/files',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(uploadFileSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof uploadFileSchema>
        const file = await designFileService.uploadFile({
          designProjectId: projectId,
          ...body,
          userId: user.id,
        })
        return reply.code(201).send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to upload file',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/files/bulk - Bulk upload files
  fastify.post(
    '/design-projects/:projectId/files/bulk',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(bulkUploadSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof bulkUploadSchema>
        const files = await designFileService.bulkUploadFiles({
          designProjectId: projectId,
          ...body,
          userId: user.id,
        })
        return reply.code(201).send({ files })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to bulk upload files',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/files - List files
  fastify.get(
    '/design-projects/:projectId/files',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { folderId?: string }
        const files = await designFileService.listFiles(projectId, query.folderId)
        return reply.send({ files })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list files',
        })
      }
    }
  )

  // GET /architect/files/:id - Get file with versions
  fastify.get(
    '/files/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const file = await designFileService.getFile(id)
        
        // Record access
        await designFileService.recordFileAccess(id, user.id, 'VIEWED', request.ip, request.headers['user-agent'])
        
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'File not found',
        })
      }
    }
  )

  // POST /architect/files/:id/check-out - Check out file
  fastify.post(
    '/files/:id/check-out',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(checkOutFileSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof checkOutFileSchema>
        const file = await designFileService.checkOutFile(id, user.id, body.comment)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to check out file',
        })
      }
    }
  )

  // POST /architect/files/:id/check-in - Check in file
  fastify.post(
    '/files/:id/check-in',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(checkInFileSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof checkInFileSchema>
        const file = await designFileService.checkInFile(id, user.id, body.newFileUrl)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to check in file',
        })
      }
    }
  )

  // POST /architect/files/:id/lock - Lock file
  fastify.post(
    '/files/:id/lock',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(lockFileSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof lockFileSchema>
        const file = await designFileService.lockFile(id, user.id, body.reason)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to lock file',
        })
      }
    }
  )

  // POST /architect/files/:id/unlock - Unlock file
  fastify.post(
    '/files/:id/unlock',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const file = await designFileService.unlockFile(id, user.id)
        return reply.send({ file })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to unlock file',
        })
      }
    }
  )
}
