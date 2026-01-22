/**
 * Audit Controller
 * Handles audit trail and activity logging endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from './audit.service';
import { z } from 'zod';

// Request schemas
const logAuditSchema = z.object({
  userId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

const logActivitySchema = z.object({
  userId: z.string(),
  activityType: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});

const trackChangeSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  field: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  changedBy: z.string(),
  reason: z.string().optional(),
});

const auditTrailSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
});

const userActivitySchema = z.object({
  userId: z.string(),
  activityType: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
});

const searchAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional(),
});

const auditReportSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

export class AuditController {
  /**
   * POST /api/audit/log
   * Create audit log entry
   */
  async logAudit(
    request: FastifyRequest<{
      Body: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = logAuditSchema.parse(request.body);

      const auditLog = await auditService.logAudit(data);

      return reply.status(201).send({
        success: true,
        data: auditLog,
        message: 'Audit log created',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create audit log',
      });
    }
  }

  /**
   * POST /api/audit/activity
   * Log user activity
   */
  async logActivity(
    request: FastifyRequest<{
      Body: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = logActivitySchema.parse(request.body);

      const activityLog = await auditService.logActivity(data);

      return reply.status(201).send({
        success: true,
        data: activityLog,
        message: 'Activity logged',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to log activity',
      });
    }
  }

  /**
   * POST /api/audit/track-change
   * Track field-level changes
   */
  async trackChange(
    request: FastifyRequest<{
      Body: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const data = trackChangeSchema.parse(request.body);

      const changeLog = await auditService.trackChange(data);

      return reply.status(201).send({
        success: true,
        data: changeLog,
        message: 'Change tracked',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to track change',
      });
    }
  }

  /**
   * GET /api/audit/trail/:entityType/:entityId
   * Get audit trail for entity
   */
  async getAuditTrail(
    request: FastifyRequest<{
      Params: { entityType: string; entityId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { entityType, entityId } = auditTrailSchema.parse(request.params);

      const trail = await auditService.getAuditTrail(entityType, entityId);

      return reply.status(200).send({
        success: true,
        data: trail,
        count: trail.length,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch audit trail',
      });
    }
  }

  /**
   * GET /api/audit/activity/:userId
   * Get user activity history
   */
  async getUserActivity(
    request: FastifyRequest<{
      Params: { userId: string };
      Querystring: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const filters = userActivitySchema.parse({ userId, ...request.query });

      const activity = await auditService.getUserActivity(userId, filters);

      return reply.status(200).send({
        success: true,
        data: activity,
        count: activity.length,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch user activity',
      });
    }
  }

  /**
   * GET /api/audit/changes/:entityType/:entityId
   * Get change history for entity
   */
  async getChangeHistory(
    request: FastifyRequest<{
      Params: { entityType: string; entityId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { entityType, entityId } = request.params;

      const changes = await auditService.getChangeHistory(entityType, entityId);

      return reply.status(200).send({
        success: true,
        data: changes,
        count: changes.length,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch change history',
      });
    }
  }

  /**
   * GET /api/audit/search
   * Search audit logs
   */
  async searchAuditLogs(
    request: FastifyRequest<{
      Querystring: any;
    }>,
    reply: FastifyReply
  ) {
    try {
      const filters = searchAuditLogsSchema.parse(request.query);

      const result = await auditService.searchAuditLogs(filters);

      return reply.status(200).send({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: filters.limit,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to search audit logs',
      });
    }
  }

  /**
   * GET /api/audit/report
   * Generate audit report
   */
  async generateAuditReport(
    request: FastifyRequest<{
      Querystring: { startDate: string; endDate: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { startDate, endDate } = auditReportSchema.parse(request.query);

      const report = await auditService.generateAuditReport(startDate, endDate);

      return reply.status(200).send({
        success: true,
        data: report,
        generated: new Date(),
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to generate audit report',
      });
    }
  }

  /**
   * GET /api/audit/verify/:logId
   * Verify audit log integrity
   */
  async verifyIntegrity(
    request: FastifyRequest<{
      Params: { logId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { logId } = request.params;

      const verification = await auditService.verifyIntegrity(logId);

      return reply.status(200).send({
        success: true,
        data: verification,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to verify integrity',
      });
    }
  }
}

export const auditController = new AuditController();

