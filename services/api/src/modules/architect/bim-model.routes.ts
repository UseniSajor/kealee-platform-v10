import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { bimModelService } from './bim-model.service'

const createModelSchema = z.object({
  deliverableId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  modelFormat: z.enum(['RVT', 'IFC', 'SKP', 'DWG_3D', 'OBJ', 'GLTF', 'OTHER']),
  modelFileId: z.string().uuid(),
  thumbnailUrl: z.string().url().optional(),
})

const createViewSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  viewType: z.enum(['PERSPECTIVE', 'PLAN', 'SECTION', 'ELEVATION', 'ISOMETRIC']),
  cameraPosition: z.any(),
  viewSettings: z.any().optional(),
  slicePlane: z.any().optional(),
  sliceType: z.string().optional(),
  screenshotUrl: z.string().url().optional(),
})

const createAnnotationSchema = z.object({
  annotationType: z.enum(['COMMENT', 'ISSUE', 'CLASH', 'DIMENSION', 'MARKUP']),
  title: z.string().min(1),
  description: z.string().optional(),
  position: z.any(),
  elementId: z.string().optional(),
  elementType: z.string().optional(),
  markupData: z.any().optional(),
})

const updateComponentPropertiesSchema = z.object({
  properties: z.record(z.any()).optional(),
  customProperties: z.record(z.any()).optional(),
})

const updateClashStatusSchema = z.object({
  status: z.enum(['DETECTED', 'REVIEWED', 'RESOLVED', 'FALSE_POSITIVE']),
  resolutionNotes: z.string().optional(),
})

export async function bimModelRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/bim-models - Create/upload model
  fastify.post(
    '/design-projects/:projectId/bim-models',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createModelSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createModelSchema>
        const model = await bimModelService.createModel({
          designProjectId: projectId,
          ...body,
          uploadedById: user.id,
        })
        return reply.code(201).send({ model })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create model',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/bim-models - List models
  fastify.get(
    '/design-projects/:projectId/bim-models',
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
          modelFormat?: string
          deliverableId?: string
          isLatestVersion?: string
        }
        const models = await bimModelService.listModels(projectId, {
          modelFormat: query.modelFormat,
          deliverableId: query.deliverableId,
          isLatestVersion: query.isLatestVersion === 'true',
        })
        return reply.send({ models })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list models',
        })
      }
    }
  )

  // GET /architect/bim-models/:id - Get model
  fastify.get(
    '/bim-models/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const model = await bimModelService.getModel(id)
        return reply.send({ model })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Model not found',
        })
      }
    }
  )

  // POST /architect/bim-models/:id/views - Create view
  fastify.post(
    '/bim-models/:id/views',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createViewSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createViewSchema>
        const view = await bimModelService.createView({
          modelId: id,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ view })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create view',
        })
      }
    }
  )

  // POST /architect/bim-models/:id/annotations - Create annotation
  fastify.post(
    '/bim-models/:id/annotations',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createAnnotationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createAnnotationSchema>
        const annotation = await bimModelService.createAnnotation({
          modelId: id,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ annotation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create annotation',
        })
      }
    }
  )

  // GET /architect/bim-models/:id/annotations - List annotations
  fastify.get(
    '/bim-models/:id/annotations',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as {
          annotationType?: string
          status?: string
          elementId?: string
        }
        const annotations = await bimModelService.listAnnotations(id, query)
        return reply.send({ annotations })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list annotations',
        })
      }
    }
  )

  // POST /architect/annotations/:id/resolve - Resolve annotation
  fastify.post(
    '/annotations/:id/resolve',
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
        const annotation = await bimModelService.resolveAnnotation(id, user.id)
        return reply.send({ annotation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to resolve annotation',
        })
      }
    }
  )

  // POST /architect/bim-models/:id/clash-detection - Run clash detection
  fastify.post(
    '/bim-models/:id/clash-detection',
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
        const clashes = await bimModelService.runClashDetection(id, user.id)
        return reply.send({ clashes })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to run clash detection',
        })
      }
    }
  )

  // GET /architect/bim-models/:id/clashes - Get clash detections
  fastify.get(
    '/bim-models/:id/clashes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as {
          status?: string
          severity?: string
        }
        const clashes = await bimModelService.getClashDetections(id, query)
        return reply.send({ clashes })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get clash detections',
        })
      }
    }
  )

  // PATCH /architect/clashes/:id - Update clash status
  fastify.patch(
    '/clashes/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateClashStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateClashStatusSchema>
        const clash = await bimModelService.updateClashStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ clash })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update clash status',
        })
      }
    }
  )

  // GET /architect/bim-models/:id/components - Get component properties
  fastify.get(
    '/bim-models/:id/components',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as { elementId?: string }
        const properties = await bimModelService.getComponentProperties(id, query.elementId)
        return reply.send({ properties })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get component properties',
        })
      }
    }
  )

  // PATCH /architect/bim-models/:id/components/:elementId - Update component properties
  fastify.patch(
    '/bim-models/:id/components/:elementId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid(), elementId: z.string() })),
        validateBody(updateComponentPropertiesSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id, elementId } = request.params as { id: string; elementId: string }
        const body = request.body as z.infer<typeof updateComponentPropertiesSchema>
        const property = await bimModelService.updateComponentProperties(id, elementId, {
          ...body,
          userId: user.id,
        })
        return reply.send({ property })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update component properties',
        })
      }
    }
  )

  // GET /architect/bim-models/:id1/compare/:id2 - Compare models
  fastify.get(
    '/bim-models/:id1/compare/:id2',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id1: z.string().uuid(), id2: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id1, id2 } = request.params as { id1: string; id2: string }
        const comparison = await bimModelService.compareModels(id1, id2)
        return reply.send({ comparison })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to compare models',
        })
      }
    }
  )

  // POST /architect/bim-models/:id/viewing-sessions - Start viewing session
  fastify.post(
    '/bim-models/:id/viewing-sessions',
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
        const body = request.body as { isClientReview?: boolean }
        const session = await bimModelService.startViewingSession(id, user.id, body.isClientReview || false)
        return reply.code(201).send({ session })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to start viewing session',
        })
      }
    }
  )

  // PATCH /architect/viewing-sessions/:id - End viewing session
  fastify.patch(
    '/viewing-sessions/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as {
          viewsAccessed?: string[]
          annotationsCreated?: number
          annotationsViewed?: string[]
          reviewCompleted?: boolean
        }
        const session = await bimModelService.endViewingSession(id, body)
        return reply.send({ session })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to end viewing session',
        })
      }
    }
  )
}
