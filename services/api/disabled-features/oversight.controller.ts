/**
 * Oversight Controller
 * Handles admin oversight and monitoring endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { oversightService } from './oversight.service';
import { z } from 'zod';

const riskScoreSchema = z.object({
  userId: z.string(),
});

const freezeEscrowSchema = z.object({
  escrowId: z.string(),
  reason: z.string().min(10),
});

const blockUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(10),
});

const bulkApproveSchema = z.object({
  transactionIds: z.array(z.string()).min(1).max(100),
});

export class OversightController {
  /**
   * GET /api/admin/oversight/dashboard
   * Get real-time dashboard metrics
   */
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const metrics = await oversightService.getDashboardMetrics();

      return reply.status(200).send({
        success: true,
        data: metrics,
        timestamp: new Date(),
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get dashboard metrics',
      });
    }
  }

  /**
   * POST /api/admin/oversight/risk-score
   * Calculate risk score for user
   */
  async calculateRiskScore(
    request: FastifyRequest<{
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = riskScoreSchema.parse(request.body);

      const riskScore = await oversightService.calculateRiskScore(userId);

      return reply.status(200).send({
        success: true,
        data: riskScore,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to calculate risk score',
      });
    }
  }

  /**
   * GET /api/admin/oversight/anomalies
   * Detect system anomalies
   */
  async detectAnomalies(request: FastifyRequest, reply: FastifyReply) {
    try {
      const anomalies = await oversightService.detectAnomalies();

      return reply.status(200).send({
        success: true,
        data: anomalies,
        count: anomalies.length,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to detect anomalies',
      });
    }
  }

  /**
   * POST /api/admin/oversight/freeze-escrow
   * Freeze an escrow account
   */
  async freezeEscrow(
    request: FastifyRequest<{
      Body: { escrowId: string; reason: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { escrowId, reason } = freezeEscrowSchema.parse(request.body);

      await oversightService.freezeEscrow(escrowId, reason, user.id);

      return reply.status(200).send({
        success: true,
        message: 'Escrow frozen successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to freeze escrow',
      });
    }
  }

  /**
   * POST /api/admin/oversight/unfreeze-escrow
   * Unfreeze an escrow account
   */
  async unfreezeEscrow(
    request: FastifyRequest<{
      Body: { escrowId: string; reason: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { escrowId, reason } = freezeEscrowSchema.parse(request.body);

      await oversightService.unfreezeEscrow(escrowId, reason, user.id);

      return reply.status(200).send({
        success: true,
        message: 'Escrow unfrozen successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to unfreeze escrow',
      });
    }
  }

  /**
   * POST /api/admin/oversight/block-user
   * Block a user
   */
  async blockUser(
    request: FastifyRequest<{
      Body: { userId: string; reason: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const admin = (request as any).user;
      const { userId, reason } = blockUserSchema.parse(request.body);

      await oversightService.blockUser(userId, reason, admin.id);

      return reply.status(200).send({
        success: true,
        message: 'User blocked successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to block user',
      });
    }
  }

  /**
   * POST /api/admin/oversight/bulk-approve
   * Bulk approve transactions
   */
  async bulkApprove(
    request: FastifyRequest<{
      Body: { transactionIds: string[] };
    }>,
    reply: FastifyReply
  ) {
    try {
      const admin = (request as any).user;
      const { transactionIds } = bulkApproveSchema.parse(request.body);

      const result = await oversightService.bulkApproveTransactions(
        transactionIds,
        admin.id
      );

      return reply.status(200).send({
        success: true,
        data: result,
        message: `${result.approved} transactions approved, ${result.failed} failed`,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to bulk approve',
      });
    }
  }
}

export const oversightController = new OversightController();

