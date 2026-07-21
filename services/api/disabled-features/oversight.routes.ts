/**
 * Oversight Routes
 * Admin oversight and monitoring endpoints
 */

import { FastifyInstance } from 'fastify';
import { oversightController } from '../modules/admin/oversight.controller';
import { authenticateRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export async function oversightRoutes(fastify: FastifyInstance) {
  // All oversight routes require admin authentication
  fastify.addHook('onRequest', authenticateRequest);
  fastify.addHook('onRequest', requireRole(['ADMIN']));

  /**
   * GET /api/admin/oversight/dashboard
   * Get real-time dashboard metrics
   */
  fastify.get(
    '/dashboard',
    {
      schema: {
        description: 'Get real-time admin dashboard metrics',
        tags: ['Admin Oversight'],
      },
    },
    oversightController.getDashboard.bind(oversightController)
  );

  /**
   * POST /api/admin/oversight/risk-score
   * Calculate risk score for user
   */
  fastify.post(
    '/risk-score',
    {
      schema: {
        description: 'Calculate risk score for a user',
        tags: ['Admin Oversight'],
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
      },
    },
    oversightController.calculateRiskScore.bind(oversightController)
  );

  /**
   * GET /api/admin/oversight/anomalies
   * Detect system anomalies
   */
  fastify.get(
    '/anomalies',
    {
      schema: {
        description: 'Detect anomalies in system behavior',
        tags: ['Admin Oversight'],
      },
    },
    oversightController.detectAnomalies.bind(oversightController)
  );

  /**
   * POST /api/admin/oversight/freeze-escrow
   * Freeze an escrow account
   */
  fastify.post(
    '/freeze-escrow',
    {
      schema: {
        description: 'Manually freeze an escrow account',
        tags: ['Admin Oversight'],
        body: {
          type: 'object',
          required: ['escrowId', 'reason'],
          properties: {
            escrowId: { type: 'string' },
            reason: { type: 'string', minLength: 10 },
          },
        },
      },
    },
    oversightController.freezeEscrow.bind(oversightController)
  );

  /**
   * POST /api/admin/oversight/unfreeze-escrow
   * Unfreeze an escrow account
   */
  fastify.post(
    '/unfreeze-escrow',
    {
      schema: {
        description: 'Manually unfreeze an escrow account',
        tags: ['Admin Oversight'],
        body: {
          type: 'object',
          required: ['escrowId', 'reason'],
          properties: {
            escrowId: { type: 'string' },
            reason: { type: 'string', minLength: 10 },
          },
        },
      },
    },
    oversightController.unfreezeEscrow.bind(oversightController)
  );

  /**
   * POST /api/admin/oversight/block-user
   * Block a user
   */
  fastify.post(
    '/block-user',
    {
      schema: {
        description: 'Block a user from the platform',
        tags: ['Admin Oversight'],
        body: {
          type: 'object',
          required: ['userId', 'reason'],
          properties: {
            userId: { type: 'string' },
            reason: { type: 'string', minLength: 10 },
          },
        },
      },
    },
    oversightController.blockUser.bind(oversightController)
  );

  /**
   * POST /api/admin/oversight/bulk-approve
   * Bulk approve transactions
   */
  fastify.post(
    '/bulk-approve',
    {
      schema: {
        description: 'Bulk approve multiple transactions',
        tags: ['Admin Oversight'],
        body: {
          type: 'object',
          required: ['transactionIds'],
          properties: {
            transactionIds: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 100,
            },
          },
        },
      },
    },
    oversightController.bulkApprove.bind(oversightController)
  );

  fastify.log.info('✅ Oversight routes registered');
}

