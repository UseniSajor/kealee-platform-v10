import { FastifyInstance } from 'fastify'
import { getPrisma } from '../../utils/prisma-helper'

export async function adminOrdersRoutes(fastify: FastifyInstance) {
  const prismaAny = getPrisma() as any

  /**
   * GET /admin/orders — List all orders (admin only)
   * Query: ?limit=20&offset=0&deliveryStatus=pending&search=email
   */
  fastify.get('/admin/orders', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.role || !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role)) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const query = request.query as Record<string, string>
      const limit = Math.min(parseInt(query.limit || '20', 10), 100)
      const offset = parseInt(query.offset || '0', 10)

      const where: Record<string, unknown> = {}
      if (query.deliveryStatus) where.deliveryStatus = query.deliveryStatus
      if (query.status) where.status = query.status

      // Search by customer email or name
      if (query.search?.trim()) {
        where.user = {
          OR: [
            { email: { contains: query.search.trim(), mode: 'insensitive' } },
            { name: { contains: query.search.trim(), mode: 'insensitive' } },
          ],
        }
      }

      const [orders, total] = await Promise.all([
        prismaAny.conceptPackageOrder.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        }),
        prismaAny.conceptPackageOrder.count({ where }),
      ])

      return reply.send({ orders, total, limit, offset })
    } catch (error: any) {
      console.error('Error fetching admin orders:', error)
      return reply.status(500).send({ error: 'Failed to fetch orders' })
    }
  })

  /**
   * GET /admin/orders/:id — Get order detail with user info (admin only)
   */
  fastify.get('/admin/orders/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.role || !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role)) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const { id } = request.params as { id: string }

      const order = await prismaAny.conceptPackageOrder.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      })

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' })
      }

      return reply.send({ order })
    } catch (error: any) {
      console.error('Error fetching admin order:', error)
      return reply.status(500).send({ error: 'Failed to fetch order' })
    }
  })

  /**
   * PATCH /admin/orders/:id — Update order fulfillment (admin only)
   * Body: { deliveryStatus, deliveryUrl, status }
   */
  fastify.patch('/admin/orders/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.role || !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role)) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const { id } = request.params as { id: string }
      const body = request.body as Record<string, unknown>

      // Validate order exists
      const existing = await prismaAny.conceptPackageOrder.findUnique({ where: { id } })
      if (!existing) {
        return reply.status(404).send({ error: 'Order not found' })
      }

      // Build update data
      const data: Record<string, unknown> = {}

      if (body.deliveryStatus && typeof body.deliveryStatus === 'string') {
        const valid = ['pending', 'generating', 'ready', 'delivered']
        if (!valid.includes(body.deliveryStatus)) {
          return reply.status(400).send({ error: `Invalid deliveryStatus. Must be one of: ${valid.join(', ')}` })
        }
        data.deliveryStatus = body.deliveryStatus

        // Auto-set deliveredAt when marking as delivered
        if (body.deliveryStatus === 'delivered' && !existing.deliveredAt) {
          data.deliveredAt = new Date()
        }
      }

      if (body.deliveryUrl !== undefined) {
        data.deliveryUrl = body.deliveryUrl || null
      }

      if (body.status && typeof body.status === 'string') {
        const valid = ['completed', 'refunded', 'disputed']
        if (!valid.includes(body.status)) {
          return reply.status(400).send({ error: `Invalid status. Must be one of: ${valid.join(', ')}` })
        }
        data.status = body.status
      }

      if (Object.keys(data).length === 0) {
        return reply.status(400).send({ error: 'No valid fields to update' })
      }

      const updated = await prismaAny.conceptPackageOrder.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      })

      console.log(`  Admin updated order ${id}: ${JSON.stringify(data)}`)

      return reply.send({ order: updated })
    } catch (error: any) {
      console.error('Error updating admin order:', error)
      return reply.status(500).send({ error: 'Failed to update order' })
    }
  })
}
