/**
 * Deposit Routes
 * API endpoints for deposit processing
 */

import { FastifyInstance } from 'fastify';
import { depositController } from '../modules/payments/deposit.controller';
import { authenticateRequest } from '../middleware/auth';

export async function depositRoutes(fastify: FastifyInstance) {
  // All deposit routes require authentication
  fastify.addHook('onRequest', authenticateRequest);

  /**
   * POST /api/deposits
   * Create a new deposit request
   */
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new deposit request',
        tags: ['Deposits'],
        body: {
          type: 'object',
          required: ['escrowId', 'amount', 'paymentMethodId'],
          properties: {
            escrowId: { type: 'string' },
            amount: { type: 'number', minimum: 100 },
            paymentMethodId: { type: 'string' },
            currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    depositController.createDeposit.bind(depositController)
  );

  /**
   * POST /api/deposits/:depositId/process
   * Process a pending deposit
   */
  fastify.post(
    '/:depositId/process',
    {
      schema: {
        description: 'Process a pending deposit (charge payment method)',
        tags: ['Deposits'],
        params: {
          type: 'object',
          required: ['depositId'],
          properties: {
            depositId: { type: 'string' },
          },
        },
      },
    },
    depositController.processDeposit.bind(depositController)
  );

  /**
   * GET /api/deposits/:depositId
   * Get deposit details
   */
  fastify.get(
    '/:depositId',
    {
      schema: {
        description: 'Get deposit details and status',
        tags: ['Deposits'],
        params: {
          type: 'object',
          required: ['depositId'],
          properties: {
            depositId: { type: 'string' },
          },
        },
      },
    },
    depositController.getDeposit.bind(depositController)
  );

  /**
   * GET /api/deposits/escrow/:escrowId
   * Get deposit history for escrow
   */
  fastify.get(
    '/escrow/:escrowId',
    {
      schema: {
        description: 'Get all deposits for an escrow account',
        tags: ['Deposits'],
        params: {
          type: 'object',
          required: ['escrowId'],
          properties: {
            escrowId: { type: 'string' },
          },
        },
      },
    },
    depositController.getDepositHistory.bind(depositController)
  );

  /**
   * POST /api/deposits/:depositId/retry
   * Retry a failed deposit
   */
  fastify.post(
    '/:depositId/retry',
    {
      schema: {
        description: 'Retry a failed deposit (max 3 attempts)',
        tags: ['Deposits'],
        params: {
          type: 'object',
          required: ['depositId'],
          properties: {
            depositId: { type: 'string' },
          },
        },
      },
    },
    depositController.retryDeposit.bind(depositController)
  );

  /**
   * POST /api/deposits/:depositId/cancel
   * Cancel a pending deposit
   */
  fastify.post(
    '/:depositId/cancel',
    {
      schema: {
        description: 'Cancel a pending or processing deposit',
        tags: ['Deposits'],
        params: {
          type: 'object',
          required: ['depositId'],
          properties: {
            depositId: { type: 'string' },
          },
        },
      },
    },
    depositController.cancelDeposit.bind(depositController)
  );

  fastify.log.info('✅ Deposit routes registered');
}

