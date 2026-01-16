import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { drawingSetService } from './drawing-set.service'

const createSheetSchema = z.object({
  deliverableId: z.string().uuid().optional(),
  sheetTitle: z.string().min(1),
  discipline: z.enum(['A_ARCHITECTURAL', 'S_STRUCTURAL', 'M_MECHANICAL', 'E_ELECTRICAL', 'P_PLUMBING', 'C_CIVIL', 'L_LANDSCAPE', 'I_INTERIORS', 'FP_FIRE_PROTECTION', 'T_TELECOMMUNICATIONS', 'OTHER']),
  sequenceNumber: z.number().int().positive().optional(),
  drawingFileId: z.string().uuid().optional(),
})

const updateSheetSchema = z.object({
  sheetTitle: z.string().min(1).optional(),
  status: z.enum(['NOT_STARTED', 'STARTED', 'IN_PROGRESS', 'CHECKED', 'APPROVED', 'ISSUED']).optional(),
  drawingFileId: z.string().uuid().optional().nullable(),
  pdfFileId: z.string().uuid().optional().nullable(),
})

const addRevisionSchema = z.object({
  revision: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['ADDED', 'DELETED', 'REVISED', 'SKETCH', 'OTHER']),
  cloudAreas: z.array(z.any()).optional(),
})

const updateTitleBlockSchema = z.object({
  drawnById: z.string().uuid().optional(),
  checkedById: z.string().uuid().optional(),
  approvedById: z.string().uuid().optional(),
  customFields: z.record(z.any()).optional(),
})

const createSetSchema = z.object({
  deliverableId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  setType: z.string().optional(),
  sheetIds: z.array(z.string().uuid()).min(1),
})

export async function drawingSetRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/sheets - Create sheet
  fastify.post(
    '/design-projects/:projectId/sheets',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createSheetSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createSheetSchema>
        const sheet = await drawingSetService.createSheet({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ sheet })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create sheet',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/sheets - List sheets
  fastify.get(
    '/design-projects/:projectId/sheets',
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
          discipline?: string
          status?: string
          deliverableId?: string
        }
        const sheets = await drawingSetService.listSheets(projectId, query)
        return reply.send({ sheets })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list sheets',
        })
      }
    }
  )

  // GET /architect/sheets/:id - Get sheet
  fastify.get(
    '/sheets/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const sheet = await drawingSetService.getSheet(id)
        return reply.send({ sheet })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Sheet not found',
        })
      }
    }
  )

  // PATCH /architect/sheets/:id - Update sheet
  fastify.patch(
    '/sheets/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateSheetSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateSheetSchema>
        const sheet = await drawingSetService.updateSheet(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ sheet })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update sheet',
        })
      }
    }
  )

  // POST /architect/sheets/:id/revisions - Add revision
  fastify.post(
    '/sheets/:id/revisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addRevisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof addRevisionSchema>
        const sheet = await drawingSetService.addRevision(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ sheet })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add revision',
        })
      }
    }
  )

  // PATCH /architect/sheets/:id/title-block - Update title block
  fastify.patch(
    '/sheets/:id/title-block',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateTitleBlockSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateTitleBlockSchema>
        const sheet = await drawingSetService.updateTitleBlock(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ sheet })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update title block',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/drawing-sets - Create drawing set
  fastify.post(
    '/design-projects/:projectId/drawing-sets',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createSetSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createSetSchema>
        const set = await drawingSetService.createSet({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ set })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create drawing set',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/drawing-sets - List drawing sets
  fastify.get(
    '/design-projects/:projectId/drawing-sets',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const sets = await drawingSetService.listSets(projectId)
        return reply.send({ sets })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list drawing sets',
        })
      }
    }
  )

  // GET /architect/drawing-sets/:id - Get drawing set
  fastify.get(
    '/drawing-sets/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const set = await drawingSetService.getSet(id)
        return reply.send({ set })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Drawing set not found',
        })
      }
    }
  )

  // POST /architect/drawing-sets/:id/generate-pdf - Generate PDF
  fastify.post(
    '/drawing-sets/:id/generate-pdf',
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
        const set = await drawingSetService.generateSetPdf(id, user.id)
        return reply.send({ set })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to generate PDF',
        })
      }
    }
  )
}
