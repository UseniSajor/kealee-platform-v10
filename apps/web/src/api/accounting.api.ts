/**
 * Accounting API Client
 * API calls for accounting, statements, and financial reporting
 */

import { get, post } from './client'
import type {
  EscrowAgreement,
  EscrowTransaction,
  BalanceBreakdown,
} from '../types/finance.types'

const BASE_PATH = '/api/accounting'

interface Statement {
  id: string
  statementType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
  periodStart: Date
  periodEnd: Date
  generatedAt: Date
  sentAt?: Date
  viewedAt?: Date
  documentUrl: string
  status: 'GENERATED' | 'SENT' | 'VIEWED'
  metadata?: any
}

export const accountingApi = {
  // Escrow operations (same as escrow.api for convenience)
  getEscrow: async (escrowId: string): Promise<EscrowAgreement> => {
    return get<EscrowAgreement>(`/api/escrow/agreements/${escrowId}`)
  },

  getEscrowByContract: async (contractId: string): Promise<EscrowAgreement> => {
    return get<EscrowAgreement>(`/api/escrow/contract/${contractId}`)
  },

  getEscrowTransactions: async (escrowId: string): Promise<EscrowTransaction[]> => {
    const response = await get<{ transactions: EscrowTransaction[] }>(
      `/api/escrow/agreements/${escrowId}/transactions`
    )
    return response.transactions
  },

  getEscrowBalance: async (escrowId: string): Promise<BalanceBreakdown> => {
    const response = await get<{ balance: BalanceBreakdown }>(
      `/api/escrow/agreements/${escrowId}/balance`
    )
    return response.balance
  },

  // Statement operations
  getStatements: async (escrowId: string): Promise<Statement[]> => {
    const response = await get<{ statements: Statement[] }>(
      `${BASE_PATH}/statements/escrow/${escrowId}`
    )
    return response.statements
  },

  getStatement: async (statementId: string): Promise<Statement> => {
    const response = await get<{ statement: Statement }>(
      `${BASE_PATH}/statements/${statementId}`
    )
    return response.statement
  },

  generateStatement: async (data: {
    escrowId: string
    periodStart: string
    periodEnd: string
    type?: 'CUSTOM'
  }): Promise<Statement> => {
    const response = await post<{ statement: Statement }>(
      `${BASE_PATH}/statements/generate`,
      data
    )
    return response.statement
  },

  sendStatement: async (statementId: string): Promise<void> => {
    await post(`${BASE_PATH}/statements/${statementId}/send`)
  },

  markStatementViewed: async (statementId: string): Promise<void> => {
    await post(`${BASE_PATH}/statements/${statementId}/viewed`)
  },

  downloadStatement: async (statementId: string): Promise<Blob> => {
    const response = await get<Blob>(
      `${BASE_PATH}/statements/${statementId}/download`,
      { responseType: 'blob' }
    )
    return response
  },

  // Reports
  getCashFlowReport: async (filters: {
    startDate: string
    endDate: string
    escrowId?: string
  }): Promise<any> => {
    return get(`${BASE_PATH}/reports/cash-flow`, { params: filters })
  },

  getProfitLossReport: async (filters: {
    startDate: string
    endDate: string
  }): Promise<any> => {
    return get(`${BASE_PATH}/reports/profit-loss`, { params: filters })
  },

  getEscrowSummary: async (): Promise<any> => {
    return get(`${BASE_PATH}/reports/escrow-summary`)
  },

  getTransactionMetrics: async (filters?: {
    startDate?: string
    endDate?: string
  }): Promise<any> => {
    return get(`${BASE_PATH}/reports/transaction-metrics`, { params: filters })
  },

  getFeeRevenue: async (filters?: {
    startDate?: string
    endDate?: string
  }): Promise<any> => {
    return get(`${BASE_PATH}/reports/fee-revenue`, { params: filters })
  },

  getContractorPayouts: async (filters?: {
    contractorId?: string
    startDate?: string
    endDate?: string
  }): Promise<any> => {
    return get(`${BASE_PATH}/reports/contractor-payouts`, { params: filters })
  },

  getDashboardMetrics: async (): Promise<any> => {
    return get(`${BASE_PATH}/reports/dashboard-metrics`)
  },

  // Custom report
  generateCustomReport: async (data: {
    reportType: string
    filters: Record<string, any>
    format: 'PDF' | 'CSV' | 'EXCEL'
  }): Promise<{ reportUrl: string }> => {
    return post(`${BASE_PATH}/reports/custom`, data)
  },

  exportReport: async (reportId: string): Promise<Blob> => {
    return get<Blob>(`${BASE_PATH}/reports/${reportId}/export`, {
      responseType: 'blob',
    })
  },
}

export default accountingApi

