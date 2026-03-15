/**
 * comms.routes.ts — Unified Communications Layer
 * Prefix: /comms
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../middleware/auth'
import {
  UpdateNotificationPrefsDto,
  MarkNotificationsReadDto,
  SendNotificationDto,
} from './comms.dto'
import {
  getNotificationCenter,
  markNotificationsRead,
  markAllRead,
  deleteNotification,
  sendNotification,
  getPreferences,
  updatePreferences,
} from './comms.service'

export async function commsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Notification Center ──────────────────────────────────────────────────

  /** GET /comms/notifications?page=1&limit=30 */
  fastify.get('/notifications', async (request, reply) => {
    const user = (request as any).user
    const { page = '1', limit = '30' } = request.query as Record<string, string>
    const result = await getNotificationCenter(user.id, Number(page), Number(limit))
    return reply.send(result)
  })

  /** PATCH /comms/notifications/read — mark specific IDs as read */
  fastify.patch('/notifications/read', async (request, reply) => {
    const user = (request as any).user
    const body = MarkNotificationsReadDto.parse(request.body)
    const result = await markNotificationsRead(user.id, body)
    return reply.send(result)
  })

  /** POST /comms/notifications/read-all — mark all as read */
  fastify.post('/notifications/read-all', async (request, reply) => {
    const user = (request as any).user
    const result = await markAllRead(user.id)
    return reply.send(result)
  })

  /** DELETE /comms/notifications/:id */
  fastify.delete('/notifications/:id', async (request, reply) => {
    const user = (request as any).user
    const { id } = request.params as { id: string }
    await deleteNotification(id, user.id)
    return reply.status(204).send()
  })

  // ─── Send (internal / service-to-service) ────────────────────────────────
  // Typically called by other services, not directly by frontend.
  // Could add service-key middleware here for production hardening.

  /** POST /comms/send */
  fastify.post('/send', async (request, reply) => {
    const body = SendNotificationDto.parse(request.body)
    const notification = await sendNotification(body)
    return reply.status(201).send({ notification })
  })

  // ─── Preferences ──────────────────────────────────────────────────────────

  /** GET /comms/preferences */
  fastify.get('/preferences', async (request, reply) => {
    const user = (request as any).user
    const prefs = await getPreferences(user.id)
    return reply.send({ preferences: prefs })
  })

  /** PUT /comms/preferences */
  fastify.put('/preferences', async (request, reply) => {
    const user = (request as any).user
    const body = UpdateNotificationPrefsDto.parse(request.body)
    const prefs = await updatePreferences(user.id, body)
    return reply.send({ preferences: prefs })
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
