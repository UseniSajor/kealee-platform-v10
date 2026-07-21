/**
 * Financial Reporting API Routes
 * Provides access to financial reports, cash flow, P&L, escrow summaries, and dashboard metrics
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { FinancialReportingService } from '../modules/reporting/financial-reporting.service'
import { sanitizeErrorMessage } from '../utils/sanitize-error'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ReportFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectType: z.string().optional(),
  contractorId: z.string().uuid().optional(),
  status: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
})

const ExportFormatSchema = z.enum(['PDF', 'CSV', 'EXCEL', 'JSON'])

const DashboardMetricsSchema = z.object({
  includeCharts: z.coerce.boolean().default(true),
  includeAlerts: z.coerce.boolean().default(true),
})

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const requireFinanceAccess = requireRole(['admin', 'finance', 'pm'])
const requireAdminAccess = requireRole(['admin'])

// ============================================================================
// ROUTES
// ============================================================================

export async function financialReportingRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/reports/cash-flow
   * Get cash flow statement
   */
  fastify.get(
    '/reports/cash-flow',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get cash flow statement',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        const report = await FinancialReportingService.generateCashFlowStatement(filters)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate cash flow statement'),
        })
      }
    }
  )

  /**
   * GET /api/reports/profit-loss
   * Get profit & loss report
   */
  fastify.get(
    '/reports/profit-loss',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get profit & loss report',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        const report = await FinancialReportingService.generateProfitLossReport(filters)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate profit & loss report'),
        })
      }
    }
  )

  /**
   * GET /api/reports/escrow-summary
   * Get escrow balance summary
   */
  fastify.get(
    '/reports/escrow-summary',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get escrow balance summary',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        // generateEscrowBalanceSummary(asOfDate?: Date) — pass endDate as the asOfDate
        const report = await FinancialReportingService.generateEscrowBalanceSummary(filters.endDate)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate escrow summary'),
        })
      }
    }
  )

  /**
   * GET /api/reports/transaction-volume
   * Get transaction volume metrics
   */
  fastify.get(
    '/reports/transaction-volume',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get transaction volume metrics',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        const report = await FinancialReportingService.generateTransactionMetrics(filters)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate transaction volume report'),
        })
      }
    }
  )

  /**
   * GET /api/reports/fee-revenue
   * Get fee revenue tracking report
   */
  fastify.get(
    '/reports/fee-revenue',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get fee revenue tracking report',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        const report = await FinancialReportingService.generateFeeRevenueReport(filters)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate fee revenue report'),
        })
      }
    }
  )

  /**
   * GET /api/reports/contractor-payouts
   * Get contractor payout report
   */
  fastify.get(
    '/reports/contractor-payouts',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get contractor payout report',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = request.query as any

        const report = await FinancialReportingService.generateContractorPayoutReport(filters)

        return reply.send({
          success: true,
          report,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate contractor payout report'),
        })
      }
    }
  )

  /**
   * GET /api/reports/dashboard
   * Get real-time dashboard metrics
   */
  fastify.get(
    '/reports/dashboard',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get real-time dashboard metrics',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const options = DashboardMetricsSchema.parse(request.query)

        // getDashboardMetrics() takes no arguments
        const dashboard = await FinancialReportingService.getDashboardMetrics()

        return reply.send({
          success: true,
          dashboard,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get dashboard metrics'),
        })
      }
    }
  )

  /**
   * POST /api/reports/export
   * Export a report in specified format
   */
  fastify.post(
    '/reports/export',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Export a report in specified format',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { reportType, format, filters, includeCharts } = request.body as any

        // Generate the appropriate report
        let reportData: any
        switch (reportType) {
          case 'CASH_FLOW':
            reportData = await FinancialReportingService.generateCashFlowStatement(filters || {})
            break
          case 'PROFIT_LOSS':
            reportData = await FinancialReportingService.generateProfitLossReport(filters || {})
            break
          case 'ESCROW_SUMMARY':
            reportData = await FinancialReportingService.generateEscrowBalanceSummary(filters?.endDate)
            break
          case 'TRANSACTION_VOLUME':
            reportData = await FinancialReportingService.generateTransactionMetrics(filters || {})
            break
          case 'FEE_REVENUE':
            reportData = await FinancialReportingService.generateFeeRevenueReport(filters || {})
            break
          case 'CONTRACTOR_PAYOUTS':
            reportData = await FinancialReportingService.generateContractorPayoutReport(filters || {})
            break
          default:
            throw new Error('Invalid report type')
        }

        // For JSON format, return the data directly
        if (format === 'JSON') {
          return reply.send({
            success: true,
            reportType,
            data: reportData,
          })
        }

        // For other formats, return a placeholder message
        // TODO: Implement actual PDF/CSV/Excel generation
        return reply.send({
          success: true,
          message: `${format} export functionality coming soon`,
          reportType,
          format,
          // In production, this would return a download URL
          downloadUrl: null,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to export report'),
        })
      }
    }
  )

  /**
   * GET /api/reports/summary
   * Get a summary of all key financial metrics
   */
  fastify.get(
    '/reports/summary',
    {
      preHandler: [authenticateUser, requireAdminAccess],
      schema: {
        tags: ['Financial Reports'],
        summary: 'Get a summary of all key financial metrics',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ReportFiltersSchema.parse(request.query)

        // Generate all reports in parallel
        const [
          cashFlow,
          profitLoss,
          escrowSummary,
          transactionVolume,
          feeRevenue,
          contractorPayouts,
        ] = await Promise.all([
          FinancialReportingService.generateCashFlowStatement(filters),
          FinancialReportingService.generateProfitLossReport(filters),
          FinancialReportingService.generateEscrowBalanceSummary(filters.endDate),
          FinancialReportingService.generateTransactionMetrics(filters),
          FinancialReportingService.generateFeeRevenueReport(filters),
          FinancialReportingService.generateContractorPayoutReport(filters),
        ])

        return reply.send({
          success: true,
          summary: {
            cashFlow,
            profitLoss,
            escrowSummary,
            transactionVolume,
            feeRevenue,
            contractorPayouts,
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate financial summary'),
        })
      }
    }
  )
}

