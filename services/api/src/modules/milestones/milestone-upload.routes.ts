import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'
import { milestoneUploadService } from './milestone-upload.service'
import { milestoneService } from './milestone.service'
import { prismaAny } from '../../utils/prisma-helper'

export async function milestoneUploadRoutes(fastify: FastifyInstance) {
  // Upload evidence file (Prompt 3.2)
  fastify.post(
    '/:milestoneId/upload',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }

      // Get milestone to verify contractor access and get project ID
      const milestone = await prismaAny.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          contract: {
            include: {
              project: { select: { id: true, ownerId: true } },
            },
            select: { id: true, contractorId: true },
          },
        },
      })

      if (!milestone) {
        return reply.code(404).send({ error: 'Milestone not found' })
      }

      if (!milestone.contract?.contractorId || milestone.contract.contractorId !== user.id) {
        return reply.code(403).send({ error: 'Only the contractor can upload evidence' })
      }

      const data = await request.file()
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      const fileBuffer = await data.toBuffer()
      const fileName = data.filename || 'uploaded_file'
      const mimeType = data.mimetype || 'application/octet-stream'

      // Upload file
      const uploadResult = await milestoneUploadService.uploadFile(
        fileBuffer,
        fileName,
        mimeType,
        milestone.projectId,
        milestoneId
      )

      // Get evidence type from MIME type
      const evidenceType = milestoneUploadService.getEvidenceTypeFromMime(mimeType)

      // Create evidence record in database
      const evidence = await prismaAny.evidence.create({
        data: {
          projectId: milestone.projectId,
          milestoneId,
          type: evidenceType,
          url: uploadResult.fileUrl,
          fileName: uploadResult.fileName,
          mimeType: uploadResult.mimeType,
          sizeBytes: uploadResult.sizeBytes,
          metadata: { optimized: uploadResult.optimized },
          createdById: user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      })

      return reply.send({
        evidence,
        upload: uploadResult,
        evidenceType,
      })
    }
  )

  // Validate file before upload (Prompt 3.2)
  fastify.post(
    '/validate-file',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const data = await request.file()
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      const fileBuffer = await data.toBuffer()
      const fileInfo = {
        name: data.filename || 'uploaded_file',
        size: fileBuffer.length,
        type: data.mimetype || 'application/octet-stream',
      }

      const validation = milestoneUploadService.validateFile(fileInfo)

      return reply.send({
        valid: validation.valid,
        errors: validation.errors,
        evidenceType: validation.evidenceType,
      })
    }
  )
}
