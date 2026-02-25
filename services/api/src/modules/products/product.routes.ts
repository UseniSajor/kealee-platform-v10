import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody, validateQuery } from '../../middleware/validation.middleware'
import { productService } from './product.service'

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().min(1),
  category: z.enum([
    'KITCHEN', 'BATH', 'WHOLE_HOME', 'ADDITION', 'FACADE',
    'ELECTRICAL', 'PLUMBING', 'HVAC', 'FLOORING', 'ROOFING', 'WINDOWS_DOORS',
  ]),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  unitPrice: z.number().positive(),
  unitOfMeasure: z.string().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  supplier: z.string().optional(),
  imageUrl: z.string().url().optional(),
  arModelUrl: z.string().url().optional(),
  dimensions: z.any().optional(),
  specifications: z.any().optional(),
})

const addProjectItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
})

const updateProjectItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  installed: z.boolean().optional(),
})

export async function productRoutes(fastify: FastifyInstance) {
  // ============================================
  // PRODUCT CATALOG ENDPOINTS
  // ============================================

  // Create a product
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(createProductSchema)],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createProductSchema>
      const product = await productService.createProduct(body)
      return reply.code(201).send({ product })
    }
  )

  // Get products (with filters)
  fastify.get(
    '/',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const query = request.query as {
        category?: string
        search?: string
        page?: string
        limit?: string
      }
      const products = await productService.getProducts({
        category: query.category,
        search: query.search,
        page: query.page ? parseInt(query.page) : undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
      })
      return reply.send(products)
    }
  )

  // Get single product
  fastify.get(
    '/:productId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ productId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { productId } = request.params as { productId: string }
      const product = await productService.getProduct(productId)
      return reply.send({ product })
    }
  )
}

export async function projectItemRoutes(fastify: FastifyInstance) {
  // ============================================
  // PROJECT ITEM ENDPOINTS
  // ============================================

  // Add items to a project
  fastify.post(
    '/:projectId/items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(addProjectItemsSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId } = request.params as { projectId: string }
      const { items } = request.body as z.infer<typeof addProjectItemsSchema>
      const projectItems = await productService.addProjectItems(projectId, items, user.userId)
      return reply.code(201).send({ items: projectItems })
    }
  )

  // Get project items
  fastify.get(
    '/:projectId/items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId } = request.params as { projectId: string }
      const items = await productService.getProjectItems(projectId, user.userId)
      return reply.send({ items })
    }
  )

  // Update a project item
  fastify.patch(
    '/:projectId/items/:itemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({ projectId: z.string().uuid(), itemId: z.string().uuid() })
        ),
        validateBody(updateProjectItemSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId, itemId } = request.params as { projectId: string; itemId: string }
      const body = request.body as z.infer<typeof updateProjectItemSchema>
      const item = await productService.updateProjectItem(projectId, itemId, body, user.userId)
      return reply.send({ item })
    }
  )
}
