/**
 * Deposit Controller
 * Handles deposit-related HTTP requests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { depositService } from './deposit.service';
import { z } from 'zod';

// Request schemas
const createDepositSchema = z.object({
  escrowId: z.string(),
  amount: z.number().positive().min(100), // Minimum $1.00
  paymentMethodId: z.string(),
  currency: z.string().length(3).default('USD').optional(),
});

const processDepositSchema = z.object({
  depositId: z.string(),
});

const retryDepositSchema = z.object({
  depositId: z.string(),
});

const cancelDepositSchema = z.object({
  depositId: z.string(),
});

export class DepositController {
  /**
   * POST /api/deposits
   * Create a new deposit request
   */
  async createDeposit(
    request: FastifyRequest<{
      Body: { escrowId: string; amount: number; paymentMethodId: string; currency?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const data = createDepositSchema.parse(request.body);

      const deposit = await depositService.createDeposit({
        userId: user.id,
        escrowId: data.escrowId,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        currency: data.currency || 'USD',
      });

      return reply.status(201).send({
        success: true,
        data: deposit,
        message: 'Deposit request created successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create deposit',
      });
    }
  }

  /**
   * POST /api/deposits/:depositId/process
   * Process a pending deposit
   */
  async processDeposit(
    request: FastifyRequest<{
      Params: { depositId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { depositId } = request.params;

      const deposit = await depositService.processDeposit(depositId);

      return reply.status(200).send({
        success: true,
        data: deposit,
        message: 'Deposit is being processed',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to process deposit',
      });
    }
  }

  /**
   * GET /api/deposits/:depositId
   * Get deposit details
   */
  async getDeposit(
    request: FastifyRequest<{
      Params: { depositId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { depositId } = request.params;

      const deposit = await depositService.getDeposit(depositId);

      if (!deposit) {
        return reply.status(404).send({
          success: false,
          error: 'Deposit not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: deposit,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get deposit',
      });
    }
  }

  /**
   * GET /api/deposits/escrow/:escrowId
   * Get deposit history for escrow
   */
  async getDepositHistory(
    request: FastifyRequest<{
      Params: { escrowId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { escrowId } = request.params;

      const deposits = await depositService.getDepositHistory(escrowId);

      return reply.status(200).send({
        success: true,
        data: deposits,
        count: deposits.length,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get deposit history',
      });
    }
  }

  /**
   * POST /api/deposits/:depositId/retry
   * Retry a failed deposit
   */
  async retryDeposit(
    request: FastifyRequest<{
      Params: { depositId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { depositId } = request.params;

      const deposit = await depositService.retryDeposit(depositId);

      return reply.status(200).send({
        success: true,
        data: deposit,
        message: 'Deposit retry initiated',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to retry deposit',
      });
    }
  }

  /**
   * POST /api/deposits/:depositId/cancel
   * Cancel a pending deposit
   */
  async cancelDeposit(
    request: FastifyRequest<{
      Params: { depositId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { depositId } = request.params;

      await depositService.cancelDeposit(depositId, user.id);

      return reply.status(200).send({
        success: true,
        message: 'Deposit cancelled successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to cancel deposit',
      });
    }
  }
}

export const depositController = new DepositController();

