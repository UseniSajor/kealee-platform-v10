/**
 * Compliance Monitoring Routes
 * API endpoints for compliance checks and monitoring
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ComplianceMonitoringService } from './compliance-monitoring.service';
import { authenticateUser, requireRole } from '../auth/auth.middleware';
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function complianceRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticateUser);

  /**
   * GET /compliance/status/:userId
   * Get comprehensive compliance status for a user
   */
  fastify.get('/status/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };

    try {
      const status = await ComplianceMonitoringService.getComplianceStatus(userId);
      return reply.send({
        success: true,
        data: status,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to get compliance status'),
      });
    }
  });

  /**
   * POST /compliance/pre-contract
   * Run pre-contract compliance checks
   */
  fastify.post('/pre-contract', async (request: FastifyRequest, reply: FastifyReply) => {
    const { contractorId, contractAmount, state } = request.body as {
      contractorId: string;
      contractAmount: number;
      state: string;
    };

    try {
      const result = await ComplianceMonitoringService.runPreContractChecks(
        contractorId,
        contractAmount,
        state
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Pre-contract check failed'),
      });
    }
  });

  /**
   * POST /compliance/pre-payment
   * Run pre-payment compliance checks
   */
  fastify.post('/pre-payment', async (request: FastifyRequest, reply: FastifyReply) => {
    const { escrowId, amount } = request.body as {
      escrowId: string;
      amount: number;
    };

    try {
      const result = await ComplianceMonitoringService.runPrePaymentChecks(
        escrowId,
        amount
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Pre-payment check failed'),
      });
    }
  });

  /**
   * GET /compliance/alerts
   * Get active compliance alerts
   */
  fastify.get('/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, severity, limit } = request.query as {
      userId?: string;
      severity?: string;
      limit?: number;
    };

    try {
      const alerts = await ComplianceMonitoringService.getActiveAlerts({
        userId,
        severity: severity as any,
        limit: limit ? Number(limit) : undefined,
      });

      return reply.send({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to get alerts'),
      });
    }
  });

  /**
   * POST /compliance/daily-monitoring
   * Trigger daily compliance monitoring (admin only)
   */
  fastify.post(
    '/daily-monitoring',
    { preHandler: requireRole(['admin']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await ComplianceMonitoringService.runDailyMonitoring();

        return reply.send({
          success: true,
          message: 'Daily monitoring completed',
          data: result,
        });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Daily monitoring failed'),
        });
      }
    }
  );

  /**
   * GET /compliance/state-requirements/:state
   * Get state-specific compliance requirements
   */
  fastify.get('/state-requirements/:state', async (request: FastifyRequest, reply: FastifyReply) => {
    const { state } = request.params as { state: string };

    try {
      const requirements = ComplianceMonitoringService.getStateRequirements(state);

      return reply.send({
        success: true,
        data: requirements,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to get state requirements'),
      });
    }
  });

  fastify.log.info('✅ Compliance monitoring routes registered');
}
