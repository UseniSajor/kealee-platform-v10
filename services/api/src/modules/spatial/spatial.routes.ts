import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody, validateQuery } from '../../middleware/validation.middleware'
import { spatialService } from './spatial.service'

const uploadScanSchema = z.object({
  projectId: z.string().uuid(),
  scanType: z.enum(['LIDAR', 'PHOTOGRAMMETRY', 'DRONE', 'MOBILE_SCAN', 'BEFORE', 'DURING', 'AFTER']),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
  format: z.string().optional(),
  deviceInfo: z.any().optional(),
  pointCount: z.number().int().positive().optional(),
  coverage: z.number().min(0).max(100).optional(),
  accuracy: z.number().min(0).optional(),
})

const compareScansSchema = z.object({
  scan1Id: z.string().uuid(),
  scan2Id: z.string().uuid(),
})

const manualReviewSchema = z.object({
  status: z.enum(['PASSED', 'FAILED', 'NEEDS_REVIEW']),
  notes: z.string().min(1),
})

export async function spatialRoutes(fastify: FastifyInstance) {
  // Upload spatial scan
  fastify.post(
    '/upload',
    {
      preHandler: [authenticateUser, validateBody(uploadScanSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const body = request.body as z.infer<typeof uploadScanSchema>
      const scan = await spatialService.uploadScan(body, user.userId)
      return reply.code(201).send({ scan })
    }
  )

  // Get scans for a project
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId } = request.params as { projectId: string }
      const { scanType } = request.query as { scanType?: string }
      const scans = await spatialService.getProjectScans(projectId, user.userId, scanType)
      return reply.send({ scans })
    }
  )

  // Get single scan
  fastify.get(
    '/:scanId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ scanId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { scanId } = request.params as { scanId: string }
      const scan = await spatialService.getScan(scanId)
      return reply.send({ scan })
    }
  )

  // Process scan (trigger AI analysis)
  fastify.post(
    '/:scanId/process',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ scanId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { scanId } = request.params as { scanId: string }
      const scan = await spatialService.processScan(scanId, user.userId)
      return reply.send({ scan })
    }
  )

  // Verify milestone with scan
  fastify.post(
    '/:scanId/verify',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ scanId: z.string().uuid() })),
        validateBody(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { scanId } = request.params as { scanId: string }
      const { milestoneId } = request.body as { milestoneId: string }
      const verification = await spatialService.verifyMilestone(milestoneId, scanId, user.userId)
      return reply.code(201).send({ verification })
    }
  )

  // Manual review override
  fastify.post(
    '/verifications/:verificationId/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ verificationId: z.string().uuid() })),
        validateBody(manualReviewSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { verificationId } = request.params as { verificationId: string }
      const body = request.body as z.infer<typeof manualReviewSchema>
      const verification = await spatialService.manualReview(verificationId, user.userId, body)
      return reply.send({ verification })
    }
  )

  // Compare scans (before/after)
  fastify.post(
    '/compare',
    {
      preHandler: [authenticateUser, validateBody(compareScansSchema)],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof compareScansSchema>
      const comparison = await spatialService.compareScans(body.scan1Id, body.scan2Id)
      return reply.send({ comparison })
    }
  )

  // Get scan statistics for project
  fastify.get(
    '/project/:projectId/statistics',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId } = request.params as { projectId: string }
      const statistics = await spatialService.getScanStatistics(projectId, user.userId)
      return reply.send({ statistics })
    }
  )
}
