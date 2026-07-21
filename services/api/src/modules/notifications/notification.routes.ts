/**
 * Notification Routes
 * Handles Notification and NotificationPreference models
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const idParamSchema = z.object({
  id: z.string().uuid(),
});

const notificationListSchema = z.object({
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  type: z.string().optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

const preferencesUpdateSchema = z.object({
  preferences: z.array(z.object({
    category: z.string().min(1),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    frequency: z.enum(['IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST']).optional(),
    quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function notificationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  // --------------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------------

  // GET / - List notifications for current user
  fastify.get(
    '/',
    { preHandler: [validateQuery(notificationListSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const query = notificationListSchema.parse(request.query);
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(100, Math.max(1, query.limit || 20));
        const skip = (page - 1) * limit;

        const where: any = { userId: user.id };
        if (query.status) where.status = query.status;
        if (query.type) where.type = query.type;

        const [notifications, total, unreadCount] = await Promise.all([
          p.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.notification.count({ where }),
          p.notification.count({
            where: { userId: user.id, status: 'PENDING' },
          }),
        ]);

        return reply.send({
          success: true,
          data: notifications,
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list notifications'),
        });
      }
    }
  );

  // GET /:id - Single notification
  fastify.get(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const notification = await p.notification.findUnique({
          where: { id },
        });

        if (!notification) {
          return reply.code(404).send({
            success: false,
            error: 'Notification not found',
          });
        }

        if (notification.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        return reply.send({
          success: true,
          data: notification,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get notification'),
        });
      }
    }
  );

  // PATCH /:id/read - Mark notification as read (SENT)
  fastify.patch(
    '/:id/read',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const notification = await p.notification.findUnique({
          where: { id },
          select: { id: true, userId: true },
        });

        if (!notification) {
          return reply.code(404).send({
            success: false,
            error: 'Notification not found',
          });
        }

        if (notification.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        const updated = await p.notification.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          data: updated,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to mark notification as read'),
        });
      }
    }
  );

  // POST /mark-all-read - Mark all notifications as read
  fastify.post(
    '/mark-all-read',
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;

        const result = await p.notification.updateMany({
          where: {
            userId: user.id,
            status: 'PENDING',
          },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        return reply.send({
          success: true,
          message: `${result.count} notifications marked as read`,
          count: result.count,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to mark all notifications as read'),
        });
      }
    }
  );

  // DELETE /:id - Delete notification
  fastify.delete(
    '/:id',
    { preHandler: [validateParams(idParamSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { id } = idParamSchema.parse(request.params);

        const notification = await p.notification.findUnique({
          where: { id },
          select: { id: true, userId: true },
        });

        if (!notification) {
          return reply.code(404).send({
            success: false,
            error: 'Notification not found',
          });
        }

        if (notification.userId !== user.id) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        await p.notification.delete({ where: { id } });

        return reply.send({
          success: true,
          message: 'Notification deleted',
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete notification'),
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // NOTIFICATION PREFERENCES
  // --------------------------------------------------------------------------

  // GET /preferences - Get notification preferences for current user
  fastify.get(
    '/preferences',
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;

        const preferences = await p.notificationPreference.findMany({
          where: { userId: user.id },
          orderBy: { category: 'asc' },
        });

        return reply.send({
          success: true,
          data: preferences,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get notification preferences'),
        });
      }
    }
  );

  // PUT /preferences - Update notification preferences (upsert per category)
  fastify.put(
    '/preferences',
    { preHandler: [validateBody(preferencesUpdateSchema)] },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!;
        const { preferences } = preferencesUpdateSchema.parse(request.body);

        const results = await Promise.all(
          preferences.map((pref) =>
            p.notificationPreference.upsert({
              where: {
                userId_category: {
                  userId: user.id,
                  category: pref.category,
                },
              },
              update: {
                emailEnabled: pref.emailEnabled,
                smsEnabled: pref.smsEnabled,
                pushEnabled: pref.pushEnabled,
                inAppEnabled: pref.inAppEnabled,
                frequency: pref.frequency,
                quietHoursStart: pref.quietHoursStart,
                quietHoursEnd: pref.quietHoursEnd,
              },
              create: {
                userId: user.id,
                category: pref.category,
                emailEnabled: pref.emailEnabled ?? true,
                smsEnabled: pref.smsEnabled ?? false,
                pushEnabled: pref.pushEnabled ?? true,
                inAppEnabled: pref.inAppEnabled ?? true,
                frequency: pref.frequency || 'IMMEDIATE',
                quietHoursStart: pref.quietHoursStart,
                quietHoursEnd: pref.quietHoursEnd,
              },
            })
          )
        );

        return reply.send({
          success: true,
          data: results,
          message: `${results.length} preference(s) updated`,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update notification preferences'),
        });
      }
    }
  );
}
