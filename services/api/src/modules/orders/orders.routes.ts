import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma-helper'

export async function ordersRoutes(fastify: FastifyInstance) {
  const prismaAny = prisma as any

  /**
   * GET /orders/verify — Public endpoint to check if an order exists for a Stripe session.
   * Used by the checkout success page to poll until the webhook has created the order.
   * No auth required — the Stripe session ID is unguessable.
   */
  fastify.get('/orders/verify', async (request, reply) => {
    try {
      const query = request.query as Record<string, string>
      const sessionId = query.session_id

      if (!sessionId || !sessionId.startsWith('cs_')) {
        return reply.status(400).send({ found: false, error: 'Valid session_id is required' })
      }

      const order = await prismaAny.conceptPackageOrder.findFirst({
        where: { stripeSessionId: sessionId },
        select: {
          id: true,
          packageName: true,
          packageTier: true,
          status: true,
          deliveryStatus: true,
          createdAt: true,
        },
      })

      if (!order) {
        return reply.send({ found: false })
      }

      return reply.send({
        found: true,
        order: {
          id: order.id,
          packageName: order.packageName,
          packageTier: order.packageTier,
          status: order.status,
          deliveryStatus: order.deliveryStatus,
        },
      })
    } catch (error: any) {
      console.error('Error verifying order:', error)
      return reply.send({ found: false })
    }
  })

  /**
   * GET /orders — List orders for the authenticated user
   * Query: ?limit=20&offset=0&status=completed&deliveryStatus=pending
   */
  fastify.get('/orders', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.id) {
        return reply.status(401).send({ error: 'Authentication required' })
      }

      const query = request.query as Record<string, string>
      const limit = Math.min(parseInt(query.limit || '50', 10), 100)
      const offset = parseInt(query.offset || '0', 10)

      const where: Record<string, unknown> = { userId: user.id }
      if (query.status) where.status = query.status
      if (query.deliveryStatus) where.deliveryStatus = query.deliveryStatus

      const [orders, total] = await Promise.all([
        prismaAny.conceptPackageOrder.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            packageName: true,
            packageTier: true,
            amount: true,
            currency: true,
            status: true,
            deliveryStatus: true,
            deliveryUrl: true,
            deliveredAt: true,
            createdAt: true,
          },
        }),
        prismaAny.conceptPackageOrder.count({ where }),
      ])

      return reply.send({ orders, total, limit, offset })
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      return reply.status(500).send({ error: 'Failed to fetch orders' })
    }
  })

  /**
   * GET /orders/:id — Get order detail for the authenticated user
   */
  fastify.get('/orders/:id', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.id) {
        return reply.status(401).send({ error: 'Authentication required' })
      }

      const { id } = request.params as { id: string }

      const order = await prismaAny.conceptPackageOrder.findFirst({
        where: { id, userId: user.id },
        select: {
          id: true,
          packageName: true,
          packageTier: true,
          amount: true,
          currency: true,
          status: true,
          deliveryStatus: true,
          deliveryUrl: true,
          deliveredAt: true,
          stripeSessionId: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' })
      }

      return reply.send({ order })
    } catch (error: any) {
      console.error('Error fetching order:', error)
      return reply.status(500).send({ error: 'Failed to fetch order' })
    }
  })
}
