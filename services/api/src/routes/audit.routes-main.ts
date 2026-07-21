/**
 * Audit Routes
 * API endpoints for audit trail and activity logging
 */

import { FastifyInstance } from 'fastify';
import { auditController } from '../modules/audit/audit.controller';
import { authenticateRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export async function auditRoutes(fastify: FastifyInstance) {
  // All audit routes require authentication
  fastify.addHook('onRequest', authenticateRequest);

  /**
   * POST /api/audit/log
   * Create audit log entry
   */
  fastify.post(
    '/log',
    {
      preHandler: requireRole(['ADMIN', 'SYSTEM']),
      schema: {
        description: 'Create immutable audit log entry',
        tags: ['Audit'],
        body: {
          type: 'object',
          required: ['userId', 'action', 'entityType', 'entityId'],
          properties: {
            userId: { type: 'string' },
            action: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            changes: { type: 'object' },
            metadata: { type: 'object' },
            ipAddress: { type: 'string' },
            userAgent: { type: 'string' },
          },
        },
      },
    },
    auditController.logAudit.bind(auditController)
  );

  /**
   * POST /api/audit/activity
   * Log user activity
   */
  fastify.post(
    '/activity',
    {
      schema: {
        description: 'Log user activity',
        tags: ['Audit'],
        body: {
          type: 'object',
          required: ['userId', 'activityType', 'description'],
          properties: {
            userId: { type: 'string' },
            activityType: { type: 'string' },
            description: { type: 'string' },
            metadata: { type: 'object' },
          },
        },
      },
    },
    auditController.logActivity.bind(auditController)
  );

  /**
   * POST /api/audit/track-change
   * Track field-level changes
   */
  fastify.post(
    '/track-change',
    {
      preHandler: requireRole(['ADMIN', 'SYSTEM']),
      schema: {
        description: 'Track field-level changes for entity',
        tags: ['Audit'],
        body: {
          type: 'object',
          required: ['entityType', 'entityId', 'field', 'oldValue', 'newValue', 'changedBy'],
          properties: {
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            field: { type: 'string' },
            oldValue: {},
            newValue: {},
            changedBy: { type: 'string' },
            reason: { type: 'string' },
          },
        },
      },
    },
    auditController.trackChange.bind(auditController)
  );

  /**
   * GET /api/audit/trail/:entityType/:entityId
   * Get audit trail for entity
   */
  fastify.get(
    '/trail/:entityType/:entityId',
    {
      schema: {
        description: 'Get complete audit trail for entity',
        tags: ['Audit'],
        params: {
          type: 'object',
          required: ['entityType', 'entityId'],
          properties: {
            entityType: { type: 'string' },
            entityId: { type: 'string' },
          },
        },
      },
    },
    auditController.getAuditTrail.bind(auditController)
  );

  /**
   * GET /api/audit/activity/:userId
   * Get user activity history
   */
  fastify.get(
    '/activity/:userId',
    {
      schema: {
        description: 'Get user activity history',
        tags: ['Audit'],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            activityType: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
    },
    auditController.getUserAuditLogs.bind(auditController)
  );

  // TODO: Re-enable when AuditController.getChangeHistory is implemented
  // /**
  //  * GET /api/audit/changes/:entityType/:entityId
  //  * Get change history for entity
  //  */
  // fastify.get(
  //   '/changes/:entityType/:entityId',
  //   {
  //     schema: {
  //       description: 'Get field-level change history for entity',
  //       tags: ['Audit'],
  //       params: {
  //         type: 'object',
  //         required: ['entityType', 'entityId'],
  //         properties: {
  //           entityType: { type: 'string' },
  //           entityId: { type: 'string' },
  //         },
  //       },
  //     },
  //   },
  //   auditController.getChangeHistory.bind(auditController)
  // );

  /**
   * GET /api/audit/search
   * Search audit logs
   */
  fastify.get(
    '/search',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Search audit logs with filters',
        tags: ['Audit'],
        querystring: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            action: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
      },
    },
    auditController.searchAuditLogs.bind(auditController)
  );

  /**
   * GET /api/audit/report
   * Generate audit report
   */
  fastify.get(
    '/report',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Generate comprehensive audit report',
        tags: ['Audit'],
        querystring: {
          type: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
      },
    },
    auditController.generateAuditReport.bind(auditController)
  );

  /**
   * GET /api/audit/verify/:logId
   * Verify audit log integrity
   */
  fastify.get(
    '/verify/:logId',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Verify audit log integrity (tamper detection)',
        tags: ['Audit'],
        params: {
          type: 'object',
          required: ['logId'],
          properties: {
            logId: { type: 'string' },
          },
        },
      },
    },
    auditController.verifyIntegrity.bind(auditController)
  );

  fastify.log.info('✅ Audit routes registered');
}

