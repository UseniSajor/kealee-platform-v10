import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { revisionService } from './revision.service'

const createRevisionSchema = z.object({
  revisionLetter: z.string().min(1),
  revisionDate: z.string().datetime().transform((val) => new Date(val)),
  description: z.string().min(1),
  revisionType: z.enum(['ADDED', 'DELETED', 'REVISED', 'SKETCH', 'OTHER']),
  issuanceType: z.enum(['PRELIMINARY', 'ADDENDUM', 'CHANGE_ORDER', 'FINAL', 'AS_BUILT']).optional(),
  affectedDisciplines: z.array(z.string()).optional(),
  impactLevel: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  requiresCoordination: z.boolean().optional(),
  relatedChangeOrderId: z.string().uuid().optional(),
  relatedAddendumId: z.string().uuid().optional(),
})

const addSheetToRevisionSchema = z.object({
  sheetId: z.string().uuid(),
  cloudAreas: z.array(z.any()).optional(),
  revisionDescription: z.string().optional(),
  affectedAreas: z.array(z.string()).optional(),
  changeType: z.enum(['ADDED', 'DELETED', 'REVISED', 'SKETCH', 'OTHER']),
})

const approveRevisionSchema = z.object({
  approvalNotes: z.string().optional(),
})

const issueRevisionSchema = z.object({
  issuedTo: z.string().optional(),
})

const generateScheduleSchema = z.object({
  revisionId: z.string().uuid().optional(),
  scheduleType: z.string().min(1),
  format: z.string().optional(),
  templateId: z.string().optional(),
})

const markImpactCoordinatedSchema = z.object({
  coordinationNotes: z.string().optional(),
})

const archiveRevisionSchema = z.object({
  archiveReason: z.string().optional(),
  searchKeywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relatedDocuments: z.array(z.string()).optional(),
})

export async function revisionRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/revisions - Create revision
  fastify.post(
    '/design-projects/:projectId/revisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createRevisionSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createRevisionSchema>
        const revision = await revisionService.createRevision({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ revision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create revision',
        })
      }
    }
  )

  // GET /architect/revisions/:id - Get revision
  fastify.get(
    '/revisions/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const revision = await revisionService.getRevision(id)
        return reply.send({ revision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Revision not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/revisions - List revisions
  fastify.get(
    '/design-projects/:projectId/revisions',
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
          issuanceType?: string
          fromDate?: string
          toDate?: string
        }
        const revisions = await revisionService.listRevisions(projectId, {
          status: query.status,
          issuanceType: query.issuanceType,
          fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
          toDate: query.toDate ? new Date(query.toDate) : undefined,
        })
        return reply.send({ revisions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list revisions',
        })
      }
    }
  )

  // POST /architect/revisions/:id/sheets - Add sheet to revision
  fastify.post(
    '/revisions/:id/sheets',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addSheetToRevisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addSheetToRevisionSchema>
        const sheetRevision = await revisionService.addSheetToRevision({
          revisionId: id,
          ...body,
        })
        return reply.code(201).send({ sheetRevision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add sheet to revision',
        })
      }
    }
  )

  // POST /architect/revisions/:id/approve - Approve revision
  fastify.post(
    '/revisions/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approveRevisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approveRevisionSchema>
        const revision = await revisionService.approveRevision(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ revision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to approve revision',
        })
      }
    }
  )

  // POST /architect/revisions/:id/issue - Issue revision
  fastify.post(
    '/revisions/:id/issue',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(issueRevisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof issueRevisionSchema>
        const revision = await revisionService.issueRevision(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ revision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to issue revision',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/revision-schedules - Generate revision schedule
  fastify.post(
    '/design-projects/:projectId/revision-schedules',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(generateScheduleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof generateScheduleSchema>
        const schedule = await revisionService.generateRevisionSchedule({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ schedule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to generate revision schedule',
        })
      }
    }
  )

  // GET /architect/revision-schedules/:id - Get revision schedule
  fastify.get(
    '/revision-schedules/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const schedule = await revisionService.getRevisionSchedule(id)
        return reply.send({ schedule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Revision schedule not found',
        })
      }
    }
  )

  // POST /architect/revisions/:id/analyze-impact - Analyze revision impact
  fastify.post(
    '/revisions/:id/analyze-impact',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await revisionService.analyzeRevisionImpact(id)
        return reply.send({ result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to analyze revision impact',
        })
      }
    }
  )

  // POST /architect/revision-impacts/:id/coordinate - Mark impact as coordinated
  fastify.post(
    '/revision-impacts/:id/coordinate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(markImpactCoordinatedSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof markImpactCoordinatedSchema>
        const impact = await revisionService.markImpactCoordinated(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ impact })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to mark impact as coordinated',
        })
      }
    }
  )

  // POST /architect/revisions/:id/archive - Archive revision
  fastify.post(
    '/revisions/:id/archive',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(archiveRevisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof archiveRevisionSchema>
        const archive = await revisionService.archiveRevision(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ archive })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to archive revision',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/revision-archive/search - Search revision archive
  fastify.get(
    '/design-projects/:projectId/revision-archive/search',
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
          keywords?: string
          tags?: string
          fromDate?: string
          toDate?: string
        }
        const archives = await revisionService.searchRevisionArchive(projectId, {
          keywords: query.keywords ? query.keywords.split(',') : undefined,
          tags: query.tags ? query.tags.split(',') : undefined,
          fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
          toDate: query.toDate ? new Date(query.toDate) : undefined,
        })
        return reply.send({ archives })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to search revision archive',
        })
      }
    }
  )
}
