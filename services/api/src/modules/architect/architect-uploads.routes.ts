/**
 * Architect Upload Routes
 * Handles architect-specific file uploads and design management
 * Based on Kealee_User_Responsibilities_Guide.md Section 6
 */

import { FastifyPluginAsync } from 'fastify'
import { userResponsibilityUploadService } from '../files/user-responsibility-upload.service'
import { prismaAny } from '../../utils/prisma-helper'
import {
  UploadDesignFileInput,
  ReviewDesignInput,
} from '../../types/user-responsibilities.types'
import { FileCategory, UploadedByRole } from '@prisma/client'
const architectUploadsRoutes: FastifyPluginAsync = async (fastify) => {
  // multipart plugin is registered globally in index.ts

  // ============================================================================
  // DESIGN FILE UPLOADS
  // ============================================================================

  /**
   * Upload design files (drawings, renderings, specifications)
   * POST /api/architect/projects/:projectId/design-files
   */
  fastify.post<{
    Params: { projectId: string }
    Body: {
      designPhase: string
      fileType: string
      versionNumber?: string
      notes?: string
    }
  }>('/projects/:projectId/design-files', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const { designPhase, fileType, versionNumber, notes } = request.body
      const userRole: UploadedByRole = 'ARCHITECT'

      // Determine file category based on file type
      const categoryMap: Record<string, FileCategory> = {
        DRAWING: 'DESIGN_FILE',
        RENDERING: 'RENDERING',
        SPECIFICATION: 'SPECIFICATION',
        STAMPED_DRAWING: 'STAMPED_DRAWING',
      }

      const category = categoryMap[fileType] || ('DESIGN_FILE' as FileCategory)

      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category,
            projectId,
            description: notes,
            tags: [designPhase, fileType, ...(versionNumber ? [versionNumber] : [])],
          })

          uploads.push(result)
        }
      }

      // Create design version record
      if (uploads.length > 0) {
        const designVersion = await prismaAny.designVersion.create({
          data: {
            projectId,
            architectId: userId,
            phase: designPhase,
            versionNumber: versionNumber || '1.0',
            fileIds: uploads.map((u) => u.id),
            notes,
            status: 'PENDING_REVIEW',
          },
        })

        // Log user action
        await prismaAny.userAction.create({
          data: {
            userId,
            userRole: 'ARCHITECT',
            action: 'UPLOAD_DESIGN_FILE',
            entity: 'DesignVersion',
            entityId: designVersion.id,
            projectId,
            details: {
              designPhase,
              fileType,
              fileCount: uploads.length,
            },
          },
        })
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} design file(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload design files')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // STAMPED DRAWINGS
  // ============================================================================

  /**
   * Upload stamped/sealed drawings for permit submission
   * POST /api/architect/projects/:projectId/stamped-drawings
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string; permitType?: string }
  }>('/projects/:projectId/stamped-drawings', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          // Stamped drawings must be PDF
          if (part.mimetype !== 'application/pdf') {
            return reply.code(400).send({
              error: 'Stamped drawings must be in PDF format',
            })
          }

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'STAMPED_DRAWING' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['stamped', 'sealed', ...(request.body?.permitType ? [request.body.permitType] : [])],
          })

          uploads.push(result)
        }
      }

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'ARCHITECT',
          action: 'UPLOAD_STAMPED_DRAWING',
          entity: 'FileUpload',
          entityId: uploads[0]?.id,
          projectId,
          details: {
            fileCount: uploads.length,
            permitType: request.body?.permitType,
          },
        },
      })

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} stamped drawing(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload stamped drawings')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // RENDERINGS
  // ============================================================================

  /**
   * Upload 3D renderings
   * POST /api/architect/projects/:projectId/renderings
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string; viewType?: string }
  }>('/projects/:projectId/renderings', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'RENDERING' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['rendering', ...(request.body?.viewType ? [request.body.viewType] : [])],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} rendering(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload renderings')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // SPECIFICATIONS
  // ============================================================================

  /**
   * Upload specifications documents
   * POST /api/architect/projects/:projectId/specifications
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string; section?: string }
  }>('/projects/:projectId/specifications', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'SPECIFICATION' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['specification', ...(request.body?.section ? [request.body.section] : [])],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} specification(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload specifications')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // PORTFOLIO
  // ============================================================================

  /**
   * Upload portfolio photos
   * POST /api/architect/portfolio
   */
  fastify.post<{
    Body: {
      projectName?: string
      projectType?: string
      description?: string
      location?: string
      completedDate?: string
    }
  }>('/portfolio', async (request, reply) => {
    try {
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'PORTFOLIO_PHOTO' as FileCategory,
            description: request.body?.description,
            tags: ['portfolio', ...(request.body?.projectType ? [request.body.projectType] : [])],
          })

          uploads.push(result)
        }
      }

      // Create portfolio item
      if (uploads.length > 0) {
        const portfolioItem = await prismaAny.portfolioItem.create({
          data: {
            contractorId: userId, // In the schema, this is for any organization
            projectName: request.body?.projectName,
            projectType: request.body?.projectType,
            description: request.body?.description,
            location: request.body?.location,
            completedDate: request.body?.completedDate
              ? new Date(request.body.completedDate)
              : undefined,
            imageUrls: uploads.map((u) => u.fileUrl),
            thumbnailUrl: uploads[0]?.fileUrl,
          },
        })

        return reply.code(201).send({
          success: true,
          data: {
            portfolioItem,
            uploads,
          },
          message: 'Portfolio photos uploaded successfully',
        })
      }

      return reply.code(400).send({
        error: 'No files uploaded',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload portfolio photos')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // DESIGN VERSION MANAGEMENT
  // ============================================================================

  /**
   * Get design versions for project
   * GET /api/architect/projects/:projectId/design-versions
   */
  fastify.get<{
    Params: { projectId: string }
  }>('/projects/:projectId/design-versions', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const versions = await prismaAny.designVersion.findMany({
        where: { projectId },
        include: {
          architect: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return reply.send({
        success: true,
        data: versions,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch design versions')
      return reply.code(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * Get design version details with files
   * GET /api/architect/design-versions/:versionId
   */
  fastify.get<{
    Params: { versionId: string }
  }>('/design-versions/:versionId', async (request, reply) => {
    try {
      const { versionId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const version = await prismaAny.designVersion.findUnique({
        where: { id: versionId },
        include: {
          architect: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!version) {
        return reply.code(404).send({ error: 'Design version not found' })
      }

      // Get associated files
      const files = await prismaAny.fileUpload.findMany({
        where: {
          id: {
            in: version.fileIds,
          },
        },
      })

      return reply.send({
        success: true,
        data: {
          ...version,
          files,
        },
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch design version')
      return reply.code(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // LICENSE & CREDENTIALS
  // ============================================================================

  /**
   * Upload architect license
   * POST /api/architect/license
   */
  fastify.post<{
    Body: {
      licenseNumber: string
      licenseState: string
      expirationDate?: string
    }
  }>('/license', async (request, reply) => {
    try {
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'LICENSE' as FileCategory,
            description: `Architect License: ${request.body.licenseNumber} (${request.body.licenseState})`,
            tags: ['license', 'architect', request.body.licenseState],
          })

          uploads.push(result)
        }
      }

      // Create or update LicenseTracking record
      await prismaAny.licenseTracking.upsert({
        where: {
          userId_licenseNumber: {
            userId,
            licenseNumber: request.body.licenseNumber,
          },
        },
        create: {
          userId,
          licenseNumber: request.body.licenseNumber,
          licenseState: request.body.licenseState,
          licenseType: 'ARCHITECT',
          expirationDate: request.body.expirationDate
            ? new Date(request.body.expirationDate)
            : undefined,
          status: 'PENDING_VERIFICATION',
          documentFileIds: uploads.map((u: any) => u.id),
        },
        update: {
          licenseState: request.body.licenseState,
          expirationDate: request.body.expirationDate
            ? new Date(request.body.expirationDate)
            : undefined,
          status: 'PENDING_VERIFICATION',
          documentFileIds: uploads.map((u: any) => u.id),
        },
      })

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: 'License uploaded successfully. Pending verification.',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload license')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // AS-BUILT DOCUMENTS
  // ============================================================================

  /**
   * Upload as-built documentation
   * POST /api/architect/projects/:projectId/as-builts
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string }
  }>('/projects/:projectId/as-builts', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'ARCHITECT'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'AS_BUILT' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['as-built', 'closeout'],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} as-built document(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload as-built documents')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })
}

export default architectUploadsRoutes
