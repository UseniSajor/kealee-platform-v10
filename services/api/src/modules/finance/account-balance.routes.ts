/**
 * Account Balance Routes - Reconciliation and trial balance reports
 * Manages period-based account balances and reconciliation workflow
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AccountIdParamSchema = z.object({
  accountId: z.string().uuid(),
})

const ReconciliationQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  fiscalPeriod: z.coerce.number().int().min(1).max(12),
})

const ReconciliationBodySchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalPeriod: z.number().int().min(1).max(12),
  reconciliationNotes: z.string().max(2000).optional(),
})

const TrialBalanceQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  fiscalPeriod: z.coerce.number().int().min(1).max(12),
  includeInactive: z.coerce.boolean().default(false),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function accountBalanceRoutes(fastify: FastifyInstance) {
  /**
   * GET /reconciliation/:accountId
   * Get reconciliation data for an account
   */
  fastify.get(
    '/reconciliation/:accountId',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateParams(AccountIdParamSchema),
        validateQuery(ReconciliationQuerySchema),
      ],
      schema: {
        tags: ['Finance - Account Balances'],
        summary: 'Get reconciliation data',
        description: 'Get reconciliation data for a specific account and fiscal period',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { accountId } = AccountIdParamSchema.parse(request.params)
        const { fiscalYear, fiscalPeriod } = ReconciliationQuerySchema.parse(request.query)

        // Validate account exists
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { id: true, code: true, name: true, type: true, balance: true, currency: true },
        })

        if (!account) {
          return reply.code(404).send({
            success: false,
            error: 'Account not found',
          })
        }

        // Get existing balance record
        const accountBalance = await prisma.accountBalance.findUnique({
          where: {
            accountId_fiscalYear_fiscalPeriod: {
              accountId,
              fiscalYear,
              fiscalPeriod,
            },
          },
        })

        // Calculate period dates
        const periodStart = new Date(fiscalYear, fiscalPeriod - 1, 1)
        const periodEnd = new Date(fiscalYear, fiscalPeriod, 0, 23, 59, 59, 999)

        // Get posted journal entry lines for this account in this period
        const journalLines = await prisma.journalEntryLine.findMany({
          where: {
            accountId,
            journalEntry: {
              status: 'POSTED',
              postedAt: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          },
          include: {
            journalEntry: {
              select: {
                id: true,
                entryNumber: true,
                description: true,
                entryDate: true,
                postedAt: true,
                reference: true,
              },
            },
          },
          orderBy: {
            journalEntry: { entryDate: 'asc' },
          },
        })

        // Calculate totals from journal lines
        let calculatedDebitTotal = new Decimal(0)
        let calculatedCreditTotal = new Decimal(0)
        for (const line of journalLines) {
          calculatedDebitTotal = calculatedDebitTotal.add(line.debit)
          calculatedCreditTotal = calculatedCreditTotal.add(line.credit)
        }

        // Get previous period closing balance
        let previousClosingBalance = new Decimal(0)
        if (fiscalPeriod > 1) {
          const previousBalance = await prisma.accountBalance.findUnique({
            where: {
              accountId_fiscalYear_fiscalPeriod: {
                accountId,
                fiscalYear,
                fiscalPeriod: fiscalPeriod - 1,
              },
            },
          })
          if (previousBalance) {
            previousClosingBalance = previousBalance.closingBalance
          }
        } else {
          // First period of the year - check last period of previous year
          const previousYearBalance = await prisma.accountBalance.findUnique({
            where: {
              accountId_fiscalYear_fiscalPeriod: {
                accountId,
                fiscalYear: fiscalYear - 1,
                fiscalPeriod: 12,
              },
            },
          })
          if (previousYearBalance) {
            previousClosingBalance = previousYearBalance.closingBalance
          }
        }

        // Calculate expected closing balance
        let expectedClosingBalance: Decimal
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          expectedClosingBalance = previousClosingBalance.add(calculatedDebitTotal).sub(calculatedCreditTotal)
        } else {
          expectedClosingBalance = previousClosingBalance.add(calculatedCreditTotal).sub(calculatedDebitTotal)
        }

        // Determine discrepancies if balance record exists
        let discrepancies: Record<string, any> | null = null
        if (accountBalance) {
          discrepancies = {
            openingBalance: previousClosingBalance.sub(accountBalance.openingBalance).abs(),
            debitTotal: calculatedDebitTotal.sub(accountBalance.debitTotal).abs(),
            creditTotal: calculatedCreditTotal.sub(accountBalance.creditTotal).abs(),
            closingBalance: expectedClosingBalance.sub(accountBalance.closingBalance).abs(),
          }
        }

        return reply.send({
          success: true,
          data: {
            account,
            period: { fiscalYear, fiscalPeriod, periodStart, periodEnd },
            recorded: accountBalance || null,
            calculated: {
              openingBalance: previousClosingBalance,
              debitTotal: calculatedDebitTotal,
              creditTotal: calculatedCreditTotal,
              closingBalance: expectedClosingBalance,
              transactionCount: journalLines.length,
            },
            discrepancies,
            transactions: journalLines,
            isReconciled: accountBalance?.isReconciled || false,
            reconciledAt: accountBalance?.reconciledAt || null,
            reconciledBy: accountBalance?.reconciledBy || null,
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get reconciliation data',
        })
      }
    }
  )

  /**
   * POST /reconciliation/:accountId
   * Perform reconciliation for an account in a fiscal period
   */
  fastify.post(
    '/reconciliation/:accountId',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(AccountIdParamSchema),
        validateBody(ReconciliationBodySchema),
      ],
      schema: {
        tags: ['Finance - Account Balances'],
        summary: 'Perform reconciliation',
        description: 'Reconcile an account for a specific fiscal period, creating or updating the balance record',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const { accountId } = AccountIdParamSchema.parse(request.params)
        const data = ReconciliationBodySchema.parse(request.body)
        const { fiscalYear, fiscalPeriod, reconciliationNotes } = data

        // Validate account exists
        const account = await prisma.account.findUnique({
          where: { id: accountId },
        })

        if (!account) {
          return reply.code(404).send({
            success: false,
            error: 'Account not found',
          })
        }

        // Calculate period dates
        const periodStart = new Date(fiscalYear, fiscalPeriod - 1, 1)
        const periodEnd = new Date(fiscalYear, fiscalPeriod, 0, 23, 59, 59, 999)

        // Get posted journal entry lines for this period
        const journalLines = await prisma.journalEntryLine.findMany({
          where: {
            accountId,
            journalEntry: {
              status: 'POSTED',
              postedAt: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          },
        })

        // Calculate totals
        let debitTotal = new Decimal(0)
        let creditTotal = new Decimal(0)
        for (const line of journalLines) {
          debitTotal = debitTotal.add(line.debit)
          creditTotal = creditTotal.add(line.credit)
        }

        // Get previous period closing balance
        let openingBalance = new Decimal(0)
        if (fiscalPeriod > 1) {
          const previousBalance = await prisma.accountBalance.findUnique({
            where: {
              accountId_fiscalYear_fiscalPeriod: {
                accountId,
                fiscalYear,
                fiscalPeriod: fiscalPeriod - 1,
              },
            },
          })
          if (previousBalance) {
            openingBalance = previousBalance.closingBalance
          }
        } else {
          const previousYearBalance = await prisma.accountBalance.findUnique({
            where: {
              accountId_fiscalYear_fiscalPeriod: {
                accountId,
                fiscalYear: fiscalYear - 1,
                fiscalPeriod: 12,
              },
            },
          })
          if (previousYearBalance) {
            openingBalance = previousYearBalance.closingBalance
          }
        }

        // Calculate closing balance
        let closingBalance: Decimal
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          closingBalance = openingBalance.add(debitTotal).sub(creditTotal)
        } else {
          closingBalance = openingBalance.add(creditTotal).sub(debitTotal)
        }

        // Upsert account balance record
        const accountBalance = await prisma.accountBalance.upsert({
          where: {
            accountId_fiscalYear_fiscalPeriod: {
              accountId,
              fiscalYear,
              fiscalPeriod,
            },
          },
          create: {
            accountId,
            fiscalYear,
            fiscalPeriod,
            openingBalance,
            closingBalance,
            debitTotal,
            creditTotal,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciledBy: userId,
            reconciliationNotes,
          },
          update: {
            openingBalance,
            closingBalance,
            debitTotal,
            creditTotal,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciledBy: userId,
            reconciliationNotes,
          },
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
        })

        return reply.send({
          success: true,
          data: accountBalance,
          message: 'Account reconciled successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to reconcile account',
        })
      }
    }
  )

  /**
   * GET /trial-balance
   * Generate a trial balance report for a fiscal period
   */
  fastify.get(
    '/trial-balance',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(TrialBalanceQuerySchema),
      ],
      schema: {
        tags: ['Finance - Account Balances'],
        summary: 'Get trial balance',
        description: 'Generate a trial balance report for a specific fiscal period',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { fiscalYear, fiscalPeriod, includeInactive } = TrialBalanceQuerySchema.parse(request.query)

        // Get all accounts
        const accountWhere: any = {}
        if (!includeInactive) {
          accountWhere.isActive = true
        }

        const accounts = await prisma.account.findMany({
          where: accountWhere,
          orderBy: { code: 'asc' },
        })

        // Calculate period dates
        const periodEnd = new Date(fiscalYear, fiscalPeriod, 0, 23, 59, 59, 999)

        // Get balances for all accounts up to the period
        const trialBalanceRows: Array<{
          accountId: string
          accountCode: string
          accountName: string
          accountType: string
          debitBalance: Decimal
          creditBalance: Decimal
        }> = []

        let totalDebits = new Decimal(0)
        let totalCredits = new Decimal(0)

        for (const account of accounts) {
          // Get all posted journal lines up to period end
          const lines = await prisma.journalEntryLine.findMany({
            where: {
              accountId: account.id,
              journalEntry: {
                status: 'POSTED',
                postedAt: { lte: periodEnd },
              },
            },
          })

          let accountDebits = new Decimal(0)
          let accountCredits = new Decimal(0)
          for (const line of lines) {
            accountDebits = accountDebits.add(line.debit)
            accountCredits = accountCredits.add(line.credit)
          }

          // Determine normal balance side
          let debitBalance = new Decimal(0)
          let creditBalance = new Decimal(0)

          if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            // Normal debit balance
            const net = accountDebits.sub(accountCredits)
            if (net.greaterThanOrEqualTo(0)) {
              debitBalance = net
            } else {
              creditBalance = net.abs()
            }
          } else {
            // Normal credit balance (LIABILITY, EQUITY, REVENUE)
            const net = accountCredits.sub(accountDebits)
            if (net.greaterThanOrEqualTo(0)) {
              creditBalance = net
            } else {
              debitBalance = net.abs()
            }
          }

          // Only include accounts with non-zero balances
          if (!debitBalance.equals(0) || !creditBalance.equals(0)) {
            totalDebits = totalDebits.add(debitBalance)
            totalCredits = totalCredits.add(creditBalance)

            trialBalanceRows.push({
              accountId: account.id,
              accountCode: account.code,
              accountName: account.name,
              accountType: account.type,
              debitBalance,
              creditBalance,
            })
          }
        }

        const isBalanced = totalDebits.equals(totalCredits)

        return reply.send({
          success: true,
          data: {
            period: { fiscalYear, fiscalPeriod },
            generatedAt: new Date(),
            rows: trialBalanceRows,
            totals: {
              totalDebits,
              totalCredits,
              isBalanced,
              difference: totalDebits.sub(totalCredits).abs(),
            },
            accountCount: trialBalanceRows.length,
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to generate trial balance',
        })
      }
    }
  )
}
