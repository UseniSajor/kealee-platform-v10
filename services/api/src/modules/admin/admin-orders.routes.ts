import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma-helper'

export async function adminOrdersRoutes(fastify: FastifyInstance) {
  const prismaAny = prisma as any

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

      // Send notification if delivery status changed
      if (data.deliveryStatus && data.deliveryStatus !== existing.deliveryStatus) {
        const statusLabels: Record<string, string> = {
          generating: 'Your concept package is being generated',
          ready: 'Your concept package is ready for download!',
          delivered: 'Your concept package has been delivered',
        }

        const notifTitle = statusLabels[data.deliveryStatus as string] || 'Order update'

        // Create in-app notification (fire-and-forget)
        try {
          await prismaAny.notification.create({
            data: {
              userId: updated.userId,
              type: 'ORDER_STATUS_UPDATE',
              title: notifTitle,
              message: `${updated.packageName} — ${data.deliveryStatus}`,
              channels: ['email', 'push'],
              status: 'PENDING',
              data: {
                orderId: id,
                deliveryStatus: data.deliveryStatus,
                actionUrl: `/dashboard/orders/${id}`,
                source: 'Orders',
              },
            },
          })
        } catch (notifErr: any) {
          console.warn(`  ⚠️  In-app notification failed: ${notifErr.message}`)
        }

        // Broadcast realtime update (fire-and-forget)
        try {
          const { broadcastToUser } = await import('@kealee/realtime')
          await broadcastToUser(updated.userId, {
            event: 'order.completed',
            payload: {
              orderId: id,
              deliveryStatus: data.deliveryStatus,
              deliveryUrl: updated.deliveryUrl,
              packageName: updated.packageName,
            },
            source: 'admin-orders',
            timestamp: new Date().toISOString(),
          })
        } catch (rtErr: any) {
          console.warn(`  Realtime broadcast failed: ${rtErr.message}`)
        }

        // Queue email notification (fire-and-forget)
        if (updated.user?.email) {
          try {
            const { getEmailQueue } = await import('../../utils/email-queue')
            const emailQueue = getEmailQueue()
            await emailQueue.add('send-email', {
              to: updated.user.email,
              subject: notifTitle,
              template: 'order_status_update',
              metadata: {
                customerName: updated.user.name || updated.user.email.split('@')[0],
                packageName: updated.packageName,
                orderId: id,
                newStatus: data.deliveryStatus,
                deliveryUrl: updated.deliveryUrl || undefined,
              },
            })
          } catch {
            console.log(`📧 Email queued: ${notifTitle} to ${updated.user.email}`)
          }
        }
      }

      return reply.send({ order: updated })
    } catch (error: any) {
      console.error('Error updating admin order:', error)
      return reply.status(500).send({ error: 'Failed to update order' })
    }
  })

  /**
   * POST /admin/orders/:id/regenerate — Re-queue concept generation (admin only)
   * Resets deliveryStatus to 'generating' and queues a new generation job
   */
  fastify.post('/admin/orders/:id/regenerate', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.role || !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role)) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const { id } = request.params as { id: string }

      const order = await prismaAny.conceptPackageOrder.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      })

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' })
      }

      // Reset delivery status
      await prismaAny.conceptPackageOrder.update({
        where: { id },
        data: {
          deliveryStatus: 'generating',
          deliveryUrl: null,
          deliveredAt: null,
        },
      })

      // Queue regeneration job
      try {
        const { getConceptDeliveryQueue } = await import('../../utils/concept-delivery-queue')
        const conceptQueue = getConceptDeliveryQueue()
        await conceptQueue.add('regenerate-concept', {
          orderId: id,
          userId: order.userId,
          packageTier: order.packageTier,
          packageName: order.packageName,
          funnelSessionId: order.funnelSessionId || null,
          customerEmail: order.user?.email || '',
          customerName: order.user?.name || '',
        })
      } catch (queueErr: any) {
        console.warn(`  Concept regeneration queue failed: ${queueErr.message}`)
        return reply.status(500).send({ error: 'Failed to queue regeneration' })
      }

      console.log(`  Admin triggered concept regeneration for order ${id}`)
      return reply.send({ message: 'Concept regeneration queued', orderId: id })
    } catch (error: any) {
      console.error('Error regenerating concept:', error)
      return reply.status(500).send({ error: 'Failed to regenerate concept' })
    }
  })

  /**
   * POST /admin/orders/:id/resend-email — Resend delivery email (admin only)
   */
  fastify.post('/admin/orders/:id/resend-email', async (request, reply) => {
    try {
      const user = (request as any).user
      if (!user?.role || !['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role)) {
        return reply.status(403).send({ error: 'Admin access required' })
      }

      const { id } = request.params as { id: string }

      const order = await prismaAny.conceptPackageOrder.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      })

      if (!order) {
        return reply.status(404).send({ error: 'Order not found' })
      }

      if (!order.user?.email) {
        return reply.status(400).send({ error: 'No email address on file for this order' })
      }

      const statusLabels: Record<string, string> = {
        pending: 'Your concept package is being prepared',
        generating: 'Your concept package is being generated',
        ready: 'Your concept package is ready for download!',
        delivered: 'Your concept package has been delivered',
      }

      try {
        const { getEmailQueue } = await import('../../utils/email-queue')
        const emailQueue = getEmailQueue()
        await emailQueue.add('send-email', {
          to: order.user.email,
          subject: statusLabels[order.deliveryStatus] || 'Order update',
          template: 'order_status_update',
          metadata: {
            customerName: order.user.name || order.user.email.split('@')[0],
            packageName: order.packageName,
            orderId: id,
            newStatus: order.deliveryStatus,
            deliveryUrl: order.deliveryUrl || undefined,
          },
        })
      } catch (emailErr: any) {
        console.warn(`  Email resend failed: ${emailErr.message}`)
        return reply.status(500).send({ error: 'Failed to queue email' })
      }

      console.log(`  Admin resent delivery email for order ${id} to ${order.user.email}`)
      return reply.send({ message: 'Delivery email re-queued', orderId: id, to: order.user.email })
    } catch (error: any) {
      console.error('Error resending email:', error)
      return reply.status(500).send({ error: 'Failed to resend email' })
    }
  })
}
