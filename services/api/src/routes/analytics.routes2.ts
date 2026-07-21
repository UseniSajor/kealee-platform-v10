/**
 * Analytics Routes
 * API endpoints for business intelligence and predictive analytics
 */

import { FastifyInstance } from 'fastify';
import { analyticsController } from '../modules/analytics/analytics.controller';
import { authenticateRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // All analytics routes require authentication and admin/finance role
  fastify.addHook('onRequest', authenticateRequest);
  fastify.addHook('onRequest', requireRole(['ADMIN', 'FINANCE']));

  /**
   * GET /api/analytics/revenue-forecast
   * Revenue forecasting with predictions
   */
  fastify.get(
    '/revenue-forecast',
    {
      schema: {
        description: 'Get revenue forecast with AI predictions',
        tags: ['Analytics'],
        querystring: {
          type: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              meta: { type: 'object' },
            },
          },
        },
      },
    },
    analyticsController.getRevenueForecast.bind(analyticsController)
  );

  /**
   * GET /api/analytics/churn-prediction
   * Contractor churn prediction
   */
  fastify.get(
    '/churn-prediction',
    {
      schema: {
        description: 'Predict contractor churn and identify at-risk users',
        tags: ['Analytics'],
        querystring: {
          type: 'object',
          required: ['period'],
          properties: {
            period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          },
        },
      },
    },
    analyticsController.getChurnPrediction.bind(analyticsController)
  );

  /**
   * POST /api/analytics/fraud-detection
   * Real-time fraud detection
   */
  fastify.post(
    '/fraud-detection',
    {
      schema: {
        description: 'Detect fraud in real-time for transactions',
        tags: ['Analytics'],
        body: {
          type: 'object',
          required: ['transactionId'],
          properties: {
            transactionId: { type: 'string' },
          },
        },
      },
    },
    analyticsController.detectFraud.bind(analyticsController)
  );

  /**
   * GET /api/analytics/cash-flow-projection
   * Cash flow projection
   */
  fastify.get(
    '/cash-flow-projection',
    {
      schema: {
        description: 'Project future cash flow',
        tags: ['Analytics'],
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'number', minimum: 1, maximum: 365, default: 90 },
          },
        },
      },
    },
    analyticsController.getCashFlowProjection.bind(analyticsController)
  );

  /**
   * GET /api/analytics/roi-by-channel
   * Marketing ROI analysis
   */
  fastify.get(
    '/roi-by-channel',
    {
      schema: {
        description: 'Calculate ROI by marketing channel',
        tags: ['Analytics'],
      },
    },
    analyticsController.getROIByChannel.bind(analyticsController)
  );

  /**
   * GET /api/analytics/dashboard-summary
   * Quick dashboard metrics
   */
  fastify.get(
    '/dashboard-summary',
    {
      schema: {
        description: 'Get quick summary for admin dashboard',
        tags: ['Analytics'],
      },
    },
    analyticsController.getDashboardSummary.bind(analyticsController)
  );

  fastify.log.info('✅ Analytics routes registered');
}

