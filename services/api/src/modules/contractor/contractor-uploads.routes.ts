/**
 * Contractor Upload Routes
 * Handles contractor-specific file uploads and daily logs
 * Based on Kealee_User_Responsibilities_Guide.md Section 5
 */

import { FastifyPluginAsync } from 'fastify'
import { userResponsibilityUploadService } from '../files/user-responsibility-upload.service'
import { prismaAny } from '../../utils/prisma-helper'
import {
  CreateDailyLogInput,
  UploadReceiptInput,
  FileUploadRequest,
  BatchFileUploadRequest,
} from '../../types/user-responsibilities.types'
import { FileCategory, UploadedByRole } from '@prisma/client'
const contractorUploadsRoutes: FastifyPluginAsync = async (fastify) => {
  // multipart plugin is registered globally in index.ts

  // ============================================================================
  // SITE PHOTO UPLOADS
  // ============================================================================

  /**
   * Upload site photos
   * POST /api/contractor/projects/:projectId/site-photos
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string; location?: string; tags?: string[] }
  }>('/projects/:projectId/site-photos', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      // Verify user has contractor role
      // Verify user has contractor role via Prisma user query
      const dbUser = await prismaAny.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (!dbUser || dbUser.role !== 'CONTRACTOR') {
        return reply.code(403).send({ error: 'User does not have CONTRACTOR role' })
      }
      const userRole: UploadedByRole = 'CONTRACTOR'

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
            category: 'SITE_PHOTO' as FileCategory,
            projectId,
            description: request.body?.description,
            location: request.body?.location,
            tags: request.body?.tags,
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} site photo(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload site photos')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // RECEIPT UPLOADS
  // ============================================================================

  /**
   * Upload receipt
   * POST /api/contractor/projects/:projectId/receipts
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { purchaseDate?: string; notes?: string }
  }>('/projects/:projectId/receipts', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'CONTRACTOR'
      const parts = request.parts()
      const receipts: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          // Upload file
          const fileUpload = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'RECEIPT' as FileCategory,
            projectId,
            tags: ['receipt'],
          })

          // Create receipt record
          const receipt = await prismaAny.receipt.create({
            data: {
              projectId,
              uploadedById: userId,
              imageUrl: fileUpload.fileUrl,
              fileUploadId: fileUpload.id,
              purchaseDate: request.body?.purchaseDate
                ? new Date(request.body.purchaseDate)
                : undefined,
              notes: request.body?.notes,
              status: 'PENDING',
            },
          })

          receipts.push({
            ...fileUpload,
            receiptId: receipt.id,
          })
        }
      }

      return reply.code(201).send({
        success: true,
        data: receipts,
        message: `${receipts.length} receipt(s) uploaded successfully. OCR processing will begin shortly.`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload receipts')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // DAILY LOG ENTRIES
  // ============================================================================

  /**
   * Create daily log entry
   * POST /api/contractor/projects/:projectId/daily-logs
   */
  fastify.post<{
    Params: { projectId: string }
    Body: CreateDailyLogInput
  }>('/projects/:projectId/daily-logs', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const dailyLog = await prismaAny.dailyLog.create({
        data: {
          projectId,
          contractorId: userId,
          date: request.body.date || new Date(),
          workPerformed: request.body.workPerformed,
          crewCount: request.body.crewCount,
          hoursWorked: request.body.hoursWorked,
          weather: request.body.weather,
          temperature: request.body.temperature,
          progressNotes: request.body.progressNotes,
          issues: request.body.issues,
          safetyIncidents: request.body.safetyIncidents,
          materialsDelivered: request.body.materialsDelivered,
          equipmentUsed: request.body.equipmentUsed,
          subsOnSite: request.body.subsOnSite || [],
          photoIds: request.body.photoIds || [],
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'CONTRACTOR',
          action: 'CREATE_DAILY_LOG',
          entity: 'DailyLog',
          entityId: dailyLog.id,
          projectId,
          details: {
            date: dailyLog.date,
            crewCount: dailyLog.crewCount,
          },
        },
      })

      return reply.code(201).send({
        success: true,
        data: dailyLog,
        message: 'Daily log created successfully',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to create daily log')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * Get daily logs for project
   * GET /api/contractor/projects/:projectId/daily-logs
   */
  fastify.get<{
    Params: { projectId: string }
    Querystring: { limit?: number; offset?: number }
  }>('/projects/:projectId/daily-logs', async (request, reply) => {
    try {
      const { projectId } = request.params
      const { limit = 30, offset = 0 } = request.query
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const [logs, total] = await Promise.all([
        prismaAny.dailyLog.findMany({
          where: { projectId },
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: limit,
          skip: offset,
        }),
        prismaAny.dailyLog.count({ where: { projectId } }),
      ])

      return reply.send({
        success: true,
        data: logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + logs.length < total,
        },
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch daily logs')
      return reply.code(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  /**
   * Update daily log
   * PATCH /api/contractor/projects/:projectId/daily-logs/:logId
   */
  fastify.patch<{
    Params: { projectId: string; logId: string }
    Body: Partial<CreateDailyLogInput>
  }>('/projects/:projectId/daily-logs/:logId', async (request, reply) => {
    try {
      const { projectId, logId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      // Verify ownership
      const existing = await prismaAny.dailyLog.findUnique({
        where: { id: logId },
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Daily log not found' })
      }

      if (existing.contractorId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      const updated = await prismaAny.dailyLog.update({
        where: { id: logId },
        data: {
          ...request.body,
          subsOnSite: request.body.subsOnSite || undefined,
          photoIds: request.body.photoIds || undefined,
        },
      })

      return reply.send({
        success: true,
        data: updated,
        message: 'Daily log updated successfully',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to update daily log')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // PERMIT DOCUMENT UPLOADS
  // ============================================================================

  /**
   * Upload permit documents
   * POST /api/contractor/projects/:projectId/permit-documents
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string; permitType?: string }
  }>('/projects/:projectId/permit-documents', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'CONTRACTOR'
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
            category: 'PERMIT_DOCUMENT' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: request.body?.permitType ? [request.body.permitType] : ['permit'],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} permit document(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload permit documents')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // WARRANTY DOCUMENTS
  // ============================================================================

  /**
   * Upload warranty documents
   * POST /api/contractor/projects/:projectId/warranties
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string }
  }>('/projects/:projectId/warranties', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'CONTRACTOR'
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
            category: 'WARRANTY' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['warranty', 'closeout'],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} warranty document(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload warranties')
      return reply.code(400).send({
        success: false,
        error: error.message,
      })
    }
  })

  // ============================================================================
  // LIST PROJECT FILES
  // ============================================================================

  /**
   * List all files for a project
   * GET /api/contractor/projects/:projectId/files
   */
  fastify.get<{
    Params: { projectId: string }
    Querystring: {
      category?: FileCategory
      limit?: number
      offset?: number
    }
  }>('/projects/:projectId/files', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const result = await userResponsibilityUploadService.listProjectFiles(
        projectId,
        userId,
        'CONTRACTOR',
        {
          category: request.query.category,
          limit: request.query.limit,
          offset: request.query.offset,
        }
      )

      return reply.send({
        success: true,
        ...result,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to list project files')
      return reply.code(500).send({
        success: false,
        error: error.message,
      })
    }
  })
}

export default contractorUploadsRoutes
