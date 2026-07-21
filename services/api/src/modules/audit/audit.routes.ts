/**
 * Audit Routes
 * Register all audit trail API endpoints.
 */

import { FastifyInstance } from 'fastify';
import { auditController } from './audit.controller';

export async function auditRoutes(fastify: FastifyInstance) {
  // ── Write ──
  fastify.post('/log', auditController.logAudit.bind(auditController));
  fastify.post('/activity', auditController.logActivity.bind(auditController));
  fastify.post('/track-change', auditController.trackChange.bind(auditController));

  // ── Read ──
  fastify.get('/search', auditController.searchAuditLogs.bind(auditController));
  fastify.get('/stats', auditController.getStats.bind(auditController));
  fastify.get('/report', auditController.generateAuditReport.bind(auditController));
  fastify.get('/export/csv', auditController.exportCsv.bind(auditController));

  // ── Entity trails ──
  fastify.get('/trail/:entityType/:entityId', auditController.getAuditTrail.bind(auditController));
  fastify.get('/user/:userId', auditController.getUserAuditLogs.bind(auditController));
  fastify.get('/project/:projectId', auditController.getProjectAuditLogs.bind(auditController));

  // ── Individual entry ──
  fastify.get('/verify/:logId', auditController.verifyIntegrity.bind(auditController));
  fastify.get('/:id', auditController.getAuditById.bind(auditController));
}
