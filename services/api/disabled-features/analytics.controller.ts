/**
 * Analytics Controller
 * Handles analytics and predictive intelligence endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from './analytics.service';
import { z } from 'zod';

// Request schemas
const revenueForecastSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const churnPredictionSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
});

const fraudDetectionSchema = z.object({
  transactionId: z.string(),
});

const cashFlowProjectionSchema = z.object({
  days: z.number().min(1).max(365).default(90),
});

export class AnalyticsController {
  /**
   * GET /api/analytics/revenue-forecast
   * Revenue forecasting with AI predictions
   */
  async getRevenueForecast(
    request: FastifyRequest<{
      Querystring: { startDate: string; endDate: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { startDate, endDate } = revenueForecastSchema.parse(request.query);

      const forecast = await analyticsService.getRevenueForecast(startDate, endDate);

      return reply.status(200).send({
        success: true,
        data: forecast,
        meta: {
          generated: new Date(),
          period: { startDate, endDate },
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to generate revenue forecast',
      });
    }
  }

  /**
   * GET /api/analytics/churn-prediction
   * Predict contractor churn and identify at-risk users
   */
  async getChurnPrediction(
    request: FastifyRequest<{
      Querystring: { period: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { period } = churnPredictionSchema.parse(request.query);

      const analysis = await analyticsService.predictChurn(period);

      return reply.status(200).send({
        success: true,
        data: analysis,
        insights: {
          churnRate: `${(analysis.churnRate * 100).toFixed(2)}%`,
          atRiskCount: analysis.atRiskContractors.length,
          recommendation:
            analysis.churnRate > 0.1
              ? 'High churn rate detected. Implement retention campaigns.'
              : 'Churn rate is healthy.',
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to predict churn',
      });
    }
  }

  /**
   * POST /api/analytics/fraud-detection
   * Real-time fraud detection for transactions
   */
  async detectFraud(
    request: FastifyRequest<{
      Body: { transactionId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { transactionId } = fraudDetectionSchema.parse(request.body);

      const detection = await analyticsService.detectFraud(transactionId);

      return reply.status(200).send({
        success: true,
        data: detection,
        action: {
          required: detection.recommendation !== 'APPROVE',
          message:
            detection.recommendation === 'BLOCK'
              ? 'Transaction should be blocked immediately'
              : detection.recommendation === 'REVIEW'
              ? 'Transaction requires manual review'
              : 'Transaction approved',
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to detect fraud',
      });
    }
  }

  /**
   * GET /api/analytics/cash-flow-projection
   * Project future cash flow
   */
  async getCashFlowProjection(
    request: FastifyRequest<{
      Querystring: { days?: number };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { days } = cashFlowProjectionSchema.parse(request.query);

      const projection = await analyticsService.projectCashFlow(days);

      // Calculate insights
      const negativeDays = projection.filter(p => p.runningBalance < 0);
      const lowestBalance = Math.min(...projection.map(p => p.runningBalance));

      return reply.status(200).send({
        success: true,
        data: projection,
        insights: {
          negativeDaysCount: negativeDays.length,
          lowestProjectedBalance: lowestBalance,
          alert:
            negativeDays.length > 0
              ? 'Warning: Negative cash flow projected'
              : 'Cash flow is healthy',
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to project cash flow',
      });
    }
  }

  /**
   * GET /api/analytics/roi-by-channel
   * Marketing ROI by acquisition channel
   */
  async getROIByChannel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const roi = await analyticsService.getROIByChannel();

      // Calculate overall ROI
      const totalAcquisitionCost = roi.reduce((sum, c) => sum + c.acquisitionCost * c.customerCount, 0);
      const totalLTV = roi.reduce((sum, c) => sum + c.lifetimeValue * c.customerCount, 0);
      const overallROI = totalAcquisitionCost > 0 ? ((totalLTV - totalAcquisitionCost) / totalAcquisitionCost) * 100 : 0;

      return reply.status(200).send({
        success: true,
        data: roi,
        summary: {
          totalCustomers: roi.reduce((sum, c) => sum + c.customerCount, 0),
          totalAcquisitionCost,
          totalLTV,
          overallROI: `${overallROI.toFixed(2)}%`,
          bestChannel: roi[0]?.channel || 'N/A',
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to calculate ROI',
      });
    }
  }

  /**
   * GET /api/analytics/dashboard-summary
   * Quick summary for admin dashboard
   */
  async getDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get multiple metrics in parallel
      const [forecast, cashFlow] = await Promise.all([
        analyticsService.getRevenueForecast(thirtyDaysAgo, today),
        analyticsService.projectCashFlow(30),
      ]);

      const latestRevenue = forecast[forecast.length - 1];
      const projectedRevenue = latestRevenue?.forecast.next30Days || 0;

      return reply.status(200).send({
        success: true,
        data: {
          currentMonthRevenue: latestRevenue?.totalRevenue || 0,
          projectedNextMonthRevenue: projectedRevenue,
          revenueGrowthRate: latestRevenue?.growthRate || 0,
          cashFlowHealth: cashFlow.every(p => p.runningBalance > 0) ? 'HEALTHY' : 'AT_RISK',
          projectedCashBalance: cashFlow[cashFlow.length - 1]?.runningBalance || 0,
        },
        generated: new Date(),
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to generate dashboard summary',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();

