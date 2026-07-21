/**
 * Site Check-In Routes
 * GPS-verified on-site presence tracking
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import { checkInService } from './check-in.service';
import { broadcastToProject } from '@kealee/realtime';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const checkInSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  projectId: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  verified: z.boolean(),
  distanceMeters: z.number().optional(),
  manualOverride: z.boolean().optional(),
  overrideNote: z.string().optional(),
  role: z.string().optional(),
  orgId: z.string().optional(),
  deviceInfo: z.string().optional(),
});

const checkOutSchema = z.object({
  userId: z.string(),
});

const activeQuerySchema = z.object({
  userId: z.string(),
  projectId: z.string(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function checkInRoutes(fastify: FastifyInstance) {
  // POST /check-in — Create a check-in
  fastify.post(
    '/',
    { preHandler: [validateBody(checkInSchema)] },
    async (request, reply) => {
      try {
        const data = checkInSchema.parse(request.body);
        const checkIn = await checkInService.checkIn(data);

        // Broadcast to project channel for live updates
        broadcastToProject(data.projectId, {
          event: 'crew.arrived',
          payload: {
            projectId: data.projectId,
            userId: data.userId,
            userName: data.userName,
            type: 'ARRIVE',
            verified: data.verified,
            checkInId: checkIn.id,
            arrivedAt: checkIn.checkInAt,
          },
          timestamp: new Date().toISOString(),
          source: 'check-in',
          userId: data.userId,
        }).catch(err => fastify.log.warn({ err }, 'Failed to broadcast check-in'));

        return reply.send({ success: true, data: checkIn });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Check-in failed') });
      }
    }
  );

  // POST /check-in/:id/check-out — Check out
  fastify.post(
    '/:id/check-out',
    { preHandler: [validateBody(checkOutSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as any;
        const { userId } = checkOutSchema.parse(request.body);
        const checkIn = await checkInService.checkOut(id, userId);

        // Broadcast departure
        broadcastToProject(checkIn.projectId, {
          event: 'crew.departed',
          payload: {
            projectId: checkIn.projectId,
            userId: checkIn.userId,
            userName: '',
            type: 'DEPART',
            verified: checkIn.verified,
            checkInId: checkIn.id,
            minutesOnSite: checkIn.minutesOnSite,
          },
          timestamp: new Date().toISOString(),
          source: 'check-in',
          userId,
        }).catch(err => fastify.log.warn({ err }, 'Failed to broadcast check-out'));

        return reply.send({ success: true, data: checkIn });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Check-out failed') });
      }
    }
  );

  // GET /check-in/active — Get active check-in for user/project
  fastify.get(
    '/active',
    { preHandler: [validateQuery(activeQuerySchema)] },
    async (request, reply) => {
      try {
        const { userId, projectId } = activeQuerySchema.parse(request.query);
        const checkIn = await checkInService.getActiveCheckIn(userId, projectId);
        return reply.send({ success: true, data: checkIn });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({ error: sanitizeErrorMessage(error)});
      }
    }
  );

  // GET /check-in/on-site/:projectId — Get everyone currently on site
  fastify.get('/on-site/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params as any;
      const onSite = await checkInService.getOnSite(projectId);
      return reply.send({ success: true, data: { onSite, count: onSite.length } });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: sanitizeErrorMessage(error)});
    }
  });

  // GET /check-in/today/:projectId — Get today's activity
  fastify.get('/today/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params as any;
      const activity = await checkInService.getTodayActivity(projectId);
      return reply.send({ success: true, data: activity });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: sanitizeErrorMessage(error)});
    }
  });

  // GET /check-in/weekly/:projectId — Get weekly attendance
  fastify.get('/weekly/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params as any;
      const attendance = await checkInService.getWeeklyAttendance(projectId);
      return reply.send({ success: true, data: attendance });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(400).send({ error: sanitizeErrorMessage(error)});
    }
  });

  // GET /check-in/fleet — Get fleet view (all projects status)
  fastify.get('/fleet', async (request, reply) => {
    try {
      const fleet = await checkInService.getFleetView();
      return reply.send({ success: true, data: fleet });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to get fleet view') });
    }
  });
}
