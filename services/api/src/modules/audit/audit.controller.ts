/**
 * Audit Controller
 * Handles audit trail and activity logging endpoints.
 *
 * Routes:
 *   POST /log                          — Create audit log entry
 *   POST /activity                     — Log user activity
 *   POST /track-change                 — Track field-level changes
 *   GET  /search                       — Search audit logs (paginated)
 *   GET  /trail/:entityType/:entityId  — Get entity audit trail
 *   GET  /user/:userId                 — Get user audit trail
 *   GET  /project/:projectId           — Get project audit trail
 *   GET  /stats                        — Get audit statistics
 *   GET  /export/csv                   — Export audit logs as CSV
 *   GET  /report                       — Generate audit report
 *   GET  /verify/:logId                — Verify audit log integrity
 *   GET  /:id                          — Get single audit log by ID
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from './audit.service';
import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

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
  oldValue: z.any().default(null),
  newValue: z.any().default(null),
  changedBy: z.string(),
  reason: z.string().optional(),
});

const searchQuerySchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  projectId: z.string().optional(),
  organizationId: z.string().optional(),
  source: z.string().optional(),
  severity: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

const auditReportSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

// ============================================================================
// CONTROLLER
// ============================================================================

export class AuditController {
  /**
   * POST /api/audit/log
   */
  async logAudit(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = logAuditSchema.parse(request.body as any);
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
   */
  async logActivity(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = logActivitySchema.parse(request.body as any);
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
   */
  async trackChange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = trackChangeSchema.parse(request.body as any);
      const changeLog = await auditService.trackChange({
        entityType: data.entityType,
        entityId: data.entityId,
        field: data.field,
        oldValue: data.oldValue ?? null,
        newValue: data.newValue ?? null,
        changedBy: data.changedBy,
        reason: data.reason,
      });

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
   * GET /api/audit/search
   */
  async searchAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const filters = searchQuerySchema.parse(request.query as any);

      const result = await auditService.searchAuditLogs({
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      });

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
   * GET /api/audit/trail/:entityType/:entityId
   */
  async getAuditTrail(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { entityType, entityId } = request.params as { entityType: string; entityId: string };
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
   * GET /api/audit/user/:userId
   */
  async getUserAuditLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params as { userId: string };
      const query = request.query as any;
      const filters = {
        action: query.action,
        entityType: query.entityType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit) : 50,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await auditService.getUserAuditLogs(userId, filters);

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
        error: error.message || 'Failed to fetch user audit logs',
      });
    }
  }

  /**
   * GET /api/audit/project/:projectId
   */
  async getProjectAuditLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { projectId } = request.params as { projectId: string };
      const query = request.query as any;
      const filters = {
        action: query.action,
        entityType: query.entityType,
        userId: query.userId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit) : 50,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await auditService.getProjectAuditLogs(projectId, filters);

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
        error: error.message || 'Failed to fetch project audit logs',
      });
    }
  }

  /**
   * GET /api/audit/stats
   */
  async getStats(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const query = request.query as any;
      const filters = {
        projectId: query.projectId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const stats = await auditService.getStats(filters);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch audit stats',
      });
    }
  }

  /**
   * GET /api/audit/export/csv
   */
  async exportCsv(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const filters = searchQuerySchema.parse(request.query as any);

      const csv = await auditService.exportAuditLogsCsv({
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        limit: 10000, // Max export size
      });

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

      return reply.status(200).send(csv);
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to export audit logs',
      });
    }
  }

  /**
   * GET /api/audit/report
   */
  async generateAuditReport(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { startDate, endDate } = auditReportSchema.parse(request.query as any);
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
   */
  async verifyIntegrity(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { logId } = request.params as { logId: string };
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

  /**
   * GET /api/audit/:id
   */
  async getAuditById(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params as { id: string };
      const log = await auditService.getAuditById(id);

      if (!log) {
        return reply.status(404).send({
          success: false,
          error: 'Audit log entry not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: log,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch audit log',
      });
    }
  }
}

export const auditController = new AuditController();
