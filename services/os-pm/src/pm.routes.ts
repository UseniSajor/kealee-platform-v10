/**
 * PM Routes — /api/v1/pm
 *
 * Comprehensive Fastify route definitions for all PM domains:
 * schedules, milestones, RFIs, submittals, change orders,
 * inspections, daily logs, documents, drawings, meetings, budget
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  scheduleService,
  milestoneService,
  rfiService,
  submittalService,
  changeOrderService,
  inspectionService,
  dailyLogService,
  documentService,
  drawingService,
  meetingService,
  budgetService,
} from './pm.service';

// ── Shared helpers ──────────────────────────────────────────────────

const projectParam = z.object({ projectId: z.string().uuid() });
const idParam = z.object({ id: z.string().uuid() });
const projectAndIdParam = z.object({
  projectId: z.string().uuid(),
  id: z.string().uuid(),
});

function errorCode(error: any): number {
  if (error instanceof Error && error.message?.includes('not found')) return 404;
  return 400;
}

function safeError(error: any): string {
  if (error instanceof Error) return error.message;
  return 'Internal server error';
}

/**
 * Extracts a userId from the request.
 * In production this comes from JWT auth middleware;
 * falls back to header or body for service-to-service calls.
 */
function getUserId(request: any): string {
  return (
    request.user?.id ||
    request.headers['x-user-id'] ||
    (request.body as any)?.userId ||
    'system'
  );
}

// ── Route registration ──────────────────────────────────────────────

export async function pmRoutes(fastify: FastifyInstance) {
  // =================================================================
  // SCHEDULE
  // =================================================================

  // GET /projects/:projectId/schedule
  fastify.get('/projects/:projectId/schedule', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await scheduleService.list({
        projectId,
        status: q.status,
        assignedTo: q.assignedTo,
        trade: q.trade,
        startDate: q.startDate,
        endDate: q.endDate,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/schedule/gantt
  fastify.get('/projects/:projectId/schedule/gantt', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const result = await scheduleService.getGanttData(projectId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/schedule/critical-path
  fastify.get('/projects/:projectId/schedule/critical-path', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const result = await scheduleService.getCriticalPath(projectId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/schedule
  fastify.post('/projects/:projectId/schedule', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          startDate: z.string(),
          endDate: z.string().optional(),
          duration: z.number().optional(),
          trade: z.string().optional(),
          assignedTo: z.string().uuid().optional(),
          dependencies: z.array(z.string().uuid()).optional(),
          milestone: z.boolean().optional(),
          criticalPath: z.boolean().optional(),
          progress: z.number().min(0).max(100).optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          color: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const item = await scheduleService.create({ ...body, projectId }, userId);
      return reply.code(201).send({ item });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /schedule/:id
  fastify.get('/schedule/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const item = await scheduleService.getById(id);
      return reply.send({ item });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /schedule/:id
  fastify.patch('/schedule/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          duration: z.number().optional(),
          trade: z.string().optional(),
          assignedTo: z.string().uuid().optional(),
          dependencies: z.array(z.string().uuid()).optional(),
          milestone: z.boolean().optional(),
          criticalPath: z.boolean().optional(),
          progress: z.number().min(0).max(100).optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          color: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const item = await scheduleService.update(id, body);
      return reply.send({ item });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /schedule/:id
  fastify.delete('/schedule/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await scheduleService.delete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /schedule/:id/progress
  fastify.patch('/schedule/:id/progress', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const { progress } = z
        .object({ progress: z.number().min(0).max(100) })
        .parse(request.body);
      const item = await scheduleService.updateProgress(id, progress);
      return reply.send({ item });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /schedule/bulk-update
  fastify.post('/schedule/bulk-update', async (request, reply) => {
    try {
      const { items } = z
        .object({
          items: z.array(
            z.object({ id: z.string().uuid(), updates: z.record(z.any()) })
          ),
        })
        .parse(request.body);
      const result = await scheduleService.bulkUpdate(items);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // MILESTONES
  // =================================================================

  // GET /projects/:projectId/milestones
  fastify.get('/projects/:projectId/milestones', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const result = await milestoneService.list(projectId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/milestones
  fastify.post('/projects/:projectId/milestones', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          startDate: z.string(),
          endDate: z.string().optional(),
          priority: z.string().optional(),
          color: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const milestone = await milestoneService.create({ ...body, projectId }, userId);
      return reply.code(201).send({ milestone });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /milestones/:id
  fastify.patch('/milestones/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          priority: z.string().optional(),
          color: z.string().optional(),
          progress: z.number().min(0).max(100).optional(),
          status: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const milestone = await milestoneService.update(id, body);
      return reply.send({ milestone });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /milestones/:id
  fastify.delete('/milestones/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await milestoneService.delete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // RFIs
  // =================================================================

  // GET /projects/:projectId/rfis
  fastify.get('/projects/:projectId/rfis', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await rfiService.list({
        projectId,
        status: q.status,
        priority: q.priority,
        assignedTo: q.assignedTo,
        dateFrom: q.dateFrom,
        dateTo: q.dateTo,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/rfis/stats
  fastify.get('/projects/:projectId/rfis/stats', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const stats = await rfiService.getStats(projectId);
      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/rfis
  fastify.post('/projects/:projectId/rfis', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          subject: z.string().min(1),
          question: z.string().min(1),
          priority: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          costImpact: z.boolean().optional(),
          scheduleImpact: z.boolean().optional(),
          drawingRef: z.string().optional(),
          specSection: z.string().optional(),
          distributionList: z.array(z.string()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const rfi = await rfiService.create({
        ...body,
        projectId,
        createdById: userId,
      });
      return reply.code(201).send({ rfi });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /rfis/:id
  fastify.get('/rfis/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const rfi = await rfiService.getById(id);
      return reply.send({ rfi });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /rfis/:id
  fastify.patch('/rfis/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          subject: z.string().optional(),
          question: z.string().optional(),
          priority: z.string().optional(),
          status: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          costImpact: z.boolean().optional(),
          scheduleImpact: z.boolean().optional(),
          drawingRef: z.string().optional(),
          specSection: z.string().optional(),
          distributionList: z.array(z.string()).optional(),
        })
        .parse(request.body);
      const rfi = await rfiService.update(id, body);
      return reply.send({ rfi });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /rfis/:id
  fastify.delete('/rfis/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await rfiService.softDelete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /rfis/:id/responses
  fastify.post('/rfis/:id/responses', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          response: z.string().min(1),
          isOfficial: z.boolean().optional(),
          attachmentIds: z.array(z.string()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const response = await rfiService.addResponse({
        rfiId: id,
        responderId: userId,
        ...body,
      });
      return reply.code(201).send({ response });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /rfis/:id/close
  fastify.post('/rfis/:id/close', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const userId = getUserId(request);
      const rfi = await rfiService.close(id, userId);
      return reply.send({ rfi });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /rfis/:id/reopen
  fastify.post('/rfis/:id/reopen', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const rfi = await rfiService.reopen(id);
      return reply.send({ rfi });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // SUBMITTALS
  // =================================================================

  // GET /projects/:projectId/submittals
  fastify.get('/projects/:projectId/submittals', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await submittalService.list({
        projectId,
        status: q.status,
        type: q.type,
        assignedTo: q.assignedTo,
        specSection: q.specSection,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/submittals/stats
  fastify.get('/projects/:projectId/submittals/stats', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const stats = await submittalService.getStats(projectId);
      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/submittals/log
  fastify.get('/projects/:projectId/submittals/log', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const log = await submittalService.getLog(projectId);
      return reply.send({ log });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/submittals
  fastify.post('/projects/:projectId/submittals', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          type: z.string().optional(),
          specSection: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          contractorId: z.string().uuid().optional(),
          subcontractorName: z.string().optional(),
          copies: z.number().int().optional(),
          remarks: z.string().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const submittal = await submittalService.create({
        ...body,
        projectId,
        createdById: userId,
      });
      return reply.code(201).send({ submittal });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /submittals/:id
  fastify.get('/submittals/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const submittal = await submittalService.getById(id);
      return reply.send({ submittal });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /submittals/:id
  fastify.patch('/submittals/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          type: z.string().optional(),
          specSection: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          contractorId: z.string().uuid().optional(),
          subcontractorName: z.string().optional(),
          copies: z.number().int().optional(),
          remarks: z.string().optional(),
        })
        .parse(request.body);
      const submittal = await submittalService.update(id, body);
      return reply.send({ submittal });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /submittals/:id
  fastify.delete('/submittals/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await submittalService.softDelete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /submittals/:id/submit
  fastify.post('/submittals/:id/submit', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const submittal = await submittalService.submit(id);
      return reply.send({ submittal });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /submittals/:id/reviews
  fastify.post('/submittals/:id/reviews', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          status: z.string().min(1),
          comments: z.string().optional(),
          stampUrl: z.string().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const review = await submittalService.addReview({
        submittalId: id,
        reviewerId: userId,
        ...body,
      });
      return reply.code(201).send({ review });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /submittals/:id/resubmit
  fastify.post('/submittals/:id/resubmit', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const submittal = await submittalService.resubmit(id);
      return reply.send({ submittal });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // CHANGE ORDERS
  // =================================================================

  // GET /projects/:projectId/change-orders
  fastify.get('/projects/:projectId/change-orders', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await changeOrderService.list({
        projectId,
        status: q.status,
        requestedBy: q.requestedBy,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/change-orders/stats
  fastify.get('/projects/:projectId/change-orders/stats', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const stats = await changeOrderService.getStats(projectId);
      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/change-orders
  fastify.post('/projects/:projectId/change-orders', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          reason: z.string().optional(),
          requestedBy: z.string().optional(),
          totalCost: z.number().optional(),
          scheduleDaysImpact: z.number().int().optional(),
          lineItems: z
            .array(
              z.object({
                description: z.string(),
                quantity: z.number().optional(),
                unitCost: z.number().optional(),
                totalCost: z.number().optional(),
                category: z.string().optional(),
              })
            )
            .optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const co = await changeOrderService.create({ ...body, projectId });
      return reply.code(201).send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /change-orders/:id
  fastify.get('/change-orders/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const co = await changeOrderService.getById(id);
      return reply.send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /change-orders/:id
  fastify.patch('/change-orders/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          reason: z.string().optional(),
          totalCost: z.number().optional(),
          scheduleDaysImpact: z.number().int().optional(),
          lineItems: z
            .array(
              z.object({
                description: z.string(),
                quantity: z.number().optional(),
                unitCost: z.number().optional(),
                totalCost: z.number().optional(),
                category: z.string().optional(),
              })
            )
            .optional(),
        })
        .parse(request.body);
      const co = await changeOrderService.update(id, body);
      return reply.send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /change-orders/:id
  fastify.delete('/change-orders/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await changeOrderService.softDelete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /change-orders/:id/submit
  fastify.post('/change-orders/:id/submit', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const co = await changeOrderService.submit(id);
      return reply.send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /change-orders/:id/approve
  fastify.post('/change-orders/:id/approve', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          role: z.string().min(1),
          comments: z.string().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const co = await changeOrderService.approve(id, {
        approverId: userId,
        ...body,
      });
      return reply.send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /change-orders/:id/reject
  fastify.post('/change-orders/:id/reject', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          role: z.string().min(1),
          reason: z.string().min(1),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const co = await changeOrderService.reject(id, {
        approverId: userId,
        ...body,
      });
      return reply.send({ changeOrder: co });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // INSPECTIONS
  // =================================================================

  // GET /projects/:projectId/inspections
  fastify.get('/projects/:projectId/inspections', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await inspectionService.list({
        projectId,
        type: q.type,
        status: q.status,
        result: q.result,
        startDate: q.startDate,
        endDate: q.endDate,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/inspections/stats
  fastify.get('/projects/:projectId/inspections/stats', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const stats = await inspectionService.getStats(projectId);
      return reply.send(stats);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/inspections
  fastify.post('/projects/:projectId/inspections', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          type: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          scheduledDate: z.string(),
          scheduledTime: z.string().optional(),
          inspectorId: z.string().uuid().optional(),
          inspectorName: z.string().optional(),
          location: z.string().optional(),
          checklistItems: z.array(z.any()).optional(),
          preparationItems: z.array(z.any()).optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const inspection = await inspectionService.schedule(
        { ...body, projectId },
        userId
      );
      return reply.code(201).send({ inspection });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /inspections/:id
  fastify.get('/inspections/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const inspection = await inspectionService.getById(id);
      return reply.send({ inspection });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /inspections/:id
  fastify.patch('/inspections/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          type: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          scheduledDate: z.string().optional(),
          scheduledTime: z.string().optional(),
          inspectorId: z.string().uuid().optional(),
          inspectorName: z.string().optional(),
          location: z.string().optional(),
          checklistItems: z.array(z.any()).optional(),
          preparationItems: z.array(z.any()).optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const inspection = await inspectionService.update(id, body);
      return reply.send({ inspection });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /inspections/:id/conduct
  fastify.post('/inspections/:id/conduct', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          result: z.string().min(1),
          notes: z.string().optional(),
          conductedAt: z.string().optional(),
          conductedBy: z.string().optional(),
          checklistResults: z.array(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const inspection = await inspectionService.conduct(id, body, userId);
      return reply.send({ inspection });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /inspections/:id/findings
  fastify.post('/inspections/:id/findings', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          type: z.string().min(1),
          severity: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          location: z.string().optional(),
          photoUrls: z.array(z.string()).optional(),
          correctionRequired: z.boolean().optional(),
          correctionDeadline: z.string().optional(),
          assignedTo: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const finding = await inspectionService.addFinding(id, body, userId);
      return reply.code(201).send({ finding });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /inspections/:id/findings/:findingId
  fastify.patch('/inspections/:id/findings/:findingId', async (request, reply) => {
    try {
      const params = z
        .object({ id: z.string().uuid(), findingId: z.string().uuid() })
        .parse(request.params);
      const body = z
        .object({
          type: z.string().optional(),
          severity: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          photoUrls: z.array(z.string()).optional(),
          correctionRequired: z.boolean().optional(),
          assignedTo: z.string().optional(),
        })
        .parse(request.body);
      const finding = await inspectionService.updateFinding(
        params.id,
        params.findingId,
        body
      );
      return reply.send({ finding });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /inspections/:id/findings/:findingId/resolve
  fastify.post(
    '/inspections/:id/findings/:findingId/resolve',
    async (request, reply) => {
      try {
        const params = z
          .object({ id: z.string().uuid(), findingId: z.string().uuid() })
          .parse(request.params);
        const body = z
          .object({
            notes: z.string().optional(),
            resolvedBy: z.string().optional(),
          })
          .parse(request.body);
        const userId = getUserId(request);
        const finding = await inspectionService.resolveFinding(
          params.id,
          params.findingId,
          body,
          userId
        );
        return reply.send({ finding });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(errorCode(error)).send({ error: safeError(error) });
      }
    }
  );

  // =================================================================
  // DAILY LOGS
  // =================================================================

  // GET /projects/:projectId/daily-logs
  fastify.get('/projects/:projectId/daily-logs', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await dailyLogService.list({
        projectId,
        contractorId: q.contractorId,
        startDate: q.startDate,
        endDate: q.endDate,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/daily-logs/summary
  fastify.get('/projects/:projectId/daily-logs/summary', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      if (!q.startDate || !q.endDate) {
        return reply.code(400).send({ error: 'startDate and endDate are required' });
      }
      const result = await dailyLogService.getSummary({
        projectId,
        startDate: q.startDate,
        endDate: q.endDate,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/daily-logs
  fastify.post('/projects/:projectId/daily-logs', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          date: z.string(),
          weather: z.string().optional(),
          temperatureHigh: z.number().optional(),
          temperatureLow: z.number().optional(),
          crewCount: z.number().int().optional(),
          hoursWorked: z.number().optional(),
          activities: z.string().optional(),
          materials: z.string().optional(),
          equipment: z.string().optional(),
          visitors: z.string().optional(),
          safetyIncidents: z.string().optional(),
          delays: z.string().optional(),
          notes: z.string().optional(),
          contractorId: z.string().uuid().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const log = await dailyLogService.create({
        ...body,
        projectId,
        createdById: userId,
      });
      return reply.code(201).send({ dailyLog: log });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /daily-logs/:id
  fastify.get('/daily-logs/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const log = await dailyLogService.getById(id);
      return reply.send({ dailyLog: log });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /daily-logs/:id
  fastify.patch('/daily-logs/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          date: z.string().optional(),
          weather: z.string().optional(),
          temperatureHigh: z.number().optional(),
          temperatureLow: z.number().optional(),
          crewCount: z.number().int().optional(),
          hoursWorked: z.number().optional(),
          activities: z.string().optional(),
          materials: z.string().optional(),
          equipment: z.string().optional(),
          visitors: z.string().optional(),
          safetyIncidents: z.string().optional(),
          delays: z.string().optional(),
          notes: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const log = await dailyLogService.update(id, body);
      return reply.send({ dailyLog: log });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /daily-logs/:id
  fastify.delete('/daily-logs/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await dailyLogService.delete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /daily-logs/:id/sign-off
  fastify.post('/daily-logs/:id/sign-off', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const userId = getUserId(request);
      const log = await dailyLogService.signOff(id, userId);
      return reply.send({ dailyLog: log });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // DOCUMENTS
  // =================================================================

  // GET /projects/:projectId/documents
  fastify.get('/projects/:projectId/documents', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await documentService.list({
        projectId,
        type: q.type,
        category: q.category,
        status: q.status,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/documents
  fastify.post('/projects/:projectId/documents', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          type: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          fileUrl: z.string().optional(),
          fileName: z.string().optional(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const document = await documentService.create({ ...body, projectId }, userId);
      return reply.code(201).send({ document });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /documents/:id
  fastify.get('/documents/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const document = await documentService.getById(id);
      return reply.send({ document });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /documents/:id
  fastify.patch('/documents/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          type: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          status: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const document = await documentService.update(id, body);
      return reply.send({ document });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /documents/:id
  fastify.delete('/documents/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await documentService.softDelete(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /documents/:id/versions
  fastify.post('/documents/:id/versions', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          fileUrl: z.string(),
          fileName: z.string().optional(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const version = await documentService.addVersion(id, body, userId);
      return reply.code(201).send({ version });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /documents/:id/versions
  fastify.get('/documents/:id/versions', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const versions = await documentService.getVersions(id);
      return reply.send(versions);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /documents/:id/distribute
  fastify.post('/documents/:id/distribute', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          recipients: z.array(z.string().uuid()),
          method: z.string().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const result = await documentService.distribute(id, body, userId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // DRAWINGS
  // =================================================================

  // GET /projects/:projectId/drawings
  fastify.get('/projects/:projectId/drawings', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await drawingService.list({
        projectId,
        discipline: q.discipline,
        status: q.status,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/drawings/sets
  fastify.get('/projects/:projectId/drawings/sets', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const sets = await drawingService.getSets(projectId);
      return reply.send({ sets });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/drawings/current
  fastify.get('/projects/:projectId/drawings/current', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const drawings = await drawingService.getCurrent(projectId);
      return reply.send({ drawings });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/drawings
  fastify.post('/projects/:projectId/drawings', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          fileUrl: z.string().optional(),
          format: z.string().optional(),
          size: z.number().optional(),
          discipline: z.string().optional(),
          drawingNumber: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .parse(request.body);
      const drawing = await drawingService.upload({ ...body, projectId });
      return reply.code(201).send({ drawing });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /drawings/:id
  fastify.get('/drawings/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const drawing = await drawingService.getById(id);
      return reply.send({ drawing });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /drawings/:id
  fastify.patch('/drawings/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          name: z.string().optional(),
          description: z.string().optional(),
          discipline: z.string().optional(),
          drawingNumber: z.string().optional(),
          tags: z.array(z.string()).optional(),
          status: z.string().optional(),
        })
        .parse(request.body);
      const drawing = await drawingService.update(id, body);
      return reply.send({ drawing });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /drawings/:id
  fastify.delete('/drawings/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await drawingService.archive(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /drawings/:id/revisions
  fastify.post('/drawings/:id/revisions', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          fileUrl: z.string().optional(),
          format: z.string().optional(),
          size: z.number().optional(),
          description: z.string().optional(),
        })
        .parse(request.body);
      const revision = await drawingService.addRevision(id, body);
      return reply.code(201).send({ drawing: revision });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /drawings/:id/revisions
  fastify.get('/drawings/:id/revisions', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const revisions = await drawingService.getRevisions(id);
      return reply.send({ revisions });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // MEETINGS
  // =================================================================

  // GET /projects/:projectId/meetings
  fastify.get('/projects/:projectId/meetings', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await meetingService.list({
        projectId,
        type: q.type,
        status: q.status,
        dateFrom: q.dateFrom,
        dateTo: q.dateTo,
        search: q.search,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/meetings/action-items
  fastify.get(
    '/projects/:projectId/meetings/action-items',
    async (request, reply) => {
      try {
        const { projectId } = projectParam.parse(request.params);
        const items = await meetingService.getOpenActionItems(projectId);
        return reply.send({ actionItems: items });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(errorCode(error)).send({ error: safeError(error) });
      }
    }
  );

  // POST /projects/:projectId/meetings
  fastify.post('/projects/:projectId/meetings', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          title: z.string().min(1),
          type: z.string().optional(),
          date: z.string(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          agenda: z.string().optional(),
          recurringSchedule: z.any().optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const meeting = await meetingService.create({
        ...body,
        projectId,
        createdById: userId,
      });
      return reply.code(201).send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /meetings/:id
  fastify.get('/meetings/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const meeting = await meetingService.getById(id);
      return reply.send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /meetings/:id
  fastify.patch('/meetings/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          title: z.string().optional(),
          type: z.string().optional(),
          date: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          agenda: z.string().optional(),
          recurringSchedule: z.any().optional(),
        })
        .parse(request.body);
      const meeting = await meetingService.update(id, body);
      return reply.send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /meetings/:id/cancel
  fastify.post('/meetings/:id/cancel', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const meeting = await meetingService.cancel(id);
      return reply.send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /meetings/:id/complete
  fastify.post('/meetings/:id/complete', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const meeting = await meetingService.complete(id);
      return reply.send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PUT /meetings/:id/minutes
  fastify.put('/meetings/:id/minutes', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const { minutes } = z.object({ minutes: z.string() }).parse(request.body);
      const meeting = await meetingService.saveMinutes(id, minutes);
      return reply.send({ meeting });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /meetings/:id/attendees
  fastify.post('/meetings/:id/attendees', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          attendees: z.array(
            z.object({
              userId: z.string().uuid().optional(),
              name: z.string().min(1),
              email: z.string().email().optional(),
              company: z.string().optional(),
              role: z.string().optional(),
            })
          ),
        })
        .parse(request.body);
      const attendees = await meetingService.addAttendees(id, body.attendees);
      return reply.code(201).send({ attendees });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /meetings/attendees/:id
  fastify.patch('/meetings/attendees/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          attended: z.boolean().optional(),
          signatureUrl: z.string().optional(),
          role: z.string().optional(),
        })
        .parse(request.body);
      const attendee = await meetingService.updateAttendee(id, body);
      return reply.send({ attendee });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /meetings/:id/action-items
  fastify.post('/meetings/:id/action-items', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          description: z.string().min(1),
          assignedToId: z.string().uuid().optional(),
          assignedToName: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.string().optional(),
        })
        .parse(request.body);
      const actionItem = await meetingService.addActionItem(id, body);
      return reply.code(201).send({ actionItem });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /meetings/action-items/:id
  fastify.patch('/meetings/action-items/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          description: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          assignedToName: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.string().optional(),
          status: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(request.body);
      const actionItem = await meetingService.updateActionItem(id, body);
      return reply.send({ actionItem });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // =================================================================
  // BUDGET
  // =================================================================

  // GET /projects/:projectId/budget
  fastify.get('/projects/:projectId/budget', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const overview = await budgetService.getOverview(projectId);
      return reply.send(overview);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/lines
  fastify.get('/projects/:projectId/budget/lines', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await budgetService.listLines({
        projectId,
        category: q.category,
        status: q.status,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/budget/lines
  fastify.post('/projects/:projectId/budget/lines', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({
          code: z.string().optional(),
          name: z.string().min(1),
          category: z.string().optional(),
          description: z.string().optional(),
          budgetAmount: z.number().optional(),
          sortOrder: z.number().int().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const line = await budgetService.createLine({ ...body, projectId }, userId);
      return reply.code(201).send({ line });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /budget/lines/:id
  fastify.patch('/budget/lines/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          code: z.string().optional(),
          name: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          budgetAmount: z.number().optional(),
          sortOrder: z.number().int().optional(),
          status: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const line = await budgetService.updateLine(id, body);
      return reply.send({ line });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // DELETE /budget/lines/:id
  fastify.delete('/budget/lines/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      await budgetService.deleteLine(id);
      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/entries
  fastify.get('/projects/:projectId/budget/entries', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const q = request.query as any;
      const result = await budgetService.listEntries({
        projectId,
        budgetLineId: q.budgetLineId,
        type: q.type,
        page: q.page ? parseInt(q.page) : undefined,
        limit: q.limit ? parseInt(q.limit) : undefined,
      });
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /budget/entries
  fastify.post('/budget/entries', async (request, reply) => {
    try {
      const body = z
        .object({
          budgetLineId: z.string().uuid(),
          type: z.string().min(1),
          amount: z.number(),
          description: z.string().optional(),
          vendor: z.string().optional(),
          invoiceNumber: z.string().optional(),
          date: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const userId = getUserId(request);
      const entry = await budgetService.createEntry(body, userId);
      return reply.code(201).send({ entry });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // PATCH /budget/entries/:id
  fastify.patch('/budget/entries/:id', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const body = z
        .object({
          amount: z.number().optional(),
          description: z.string().optional(),
          vendor: z.string().optional(),
          invoiceNumber: z.string().optional(),
          date: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })
        .parse(request.body);
      const entry = await budgetService.updateEntry(id, body);
      return reply.send({ entry });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/variance
  fastify.get('/projects/:projectId/budget/variance', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const report = await budgetService.getVarianceReport(projectId);
      return reply.send(report);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/forecast
  fastify.get('/projects/:projectId/budget/forecast', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const forecast = await budgetService.getForecast(projectId);
      return reply.send(forecast);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/snapshots
  fastify.get('/projects/:projectId/budget/snapshots', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const result = await budgetService.getSnapshots(projectId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /projects/:projectId/budget/snapshots
  fastify.post('/projects/:projectId/budget/snapshots', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const body = z
        .object({ label: z.string().optional() })
        .parse(request.body ?? {});
      const userId = getUserId(request);
      const snapshot = await budgetService.takeSnapshot(projectId, userId, body.label);
      return reply.code(201).send({ snapshot });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // GET /projects/:projectId/budget/alerts
  fastify.get('/projects/:projectId/budget/alerts', async (request, reply) => {
    try {
      const { projectId } = projectParam.parse(request.params);
      const result = await budgetService.getAlerts(projectId);
      return reply.send(result);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });

  // POST /budget/alerts/:id/acknowledge
  fastify.post('/budget/alerts/:id/acknowledge', async (request, reply) => {
    try {
      const { id } = idParam.parse(request.params);
      const userId = getUserId(request);
      const alert = await budgetService.acknowledgeAlert(id, userId);
      return reply.send({ alert });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(errorCode(error)).send({ error: safeError(error) });
    }
  });
}
