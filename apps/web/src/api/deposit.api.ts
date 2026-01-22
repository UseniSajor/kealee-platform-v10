/**
 * Deposit API Client
 * API calls for deposit management
 */

import { get, post } from './client'
import type {
  DepositRequest,
  CreateDepositDTO,
  DepositResponse,
} from '../types/finance.types'

const BASE_PATH = '/api/deposits'

export const depositApi = {
  // Create deposit
  createDeposit: async (data: CreateDepositDTO): Promise<DepositRequest> => {
    const response = await post<DepositResponse>(BASE_PATH, data)
    return response.deposit
  },

  // Get deposit by ID
  getDeposit: async (depositId: string): Promise<DepositRequest> => {
    const response = await get<DepositResponse>(`${BASE_PATH}/${depositId}`)
    return response.deposit
  },

  // Get deposit history for escrow
  getDepositHistory: async (
    escrowId: string,
    filters?: {
      status?: string
      page?: number
      limit?: number
    }
  ): Promise<{ deposits: DepositRequest[]; total: number }> => {
    return get(`${BASE_PATH}/escrow/${escrowId}`, { params: filters })
  },

  // Get user's deposits
  getUserDeposits: async (filters?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{ deposits: DepositRequest[]; total: number }> => {
    return get(`${BASE_PATH}/user`, { params: filters })
  },

  // Process deposit (move from PENDING to PROCESSING)
  processDeposit: async (depositId: string): Promise<DepositRequest> => {
    const response = await post<DepositResponse>(
      `${BASE_PATH}/${depositId}/process`
    )
    return response.deposit
  },

  // Retry failed deposit
  retryDeposit: async (depositId: string): Promise<DepositRequest> => {
    const response = await post<DepositResponse>(
      `${BASE_PATH}/${depositId}/retry`
    )
    return response.deposit
  },

  // Cancel pending deposit
  cancelDeposit: async (
    depositId: string,
    reason?: string
  ): Promise<DepositRequest> => {
    const response = await post<DepositResponse>(
      `${BASE_PATH}/${depositId}/cancel`,
      { reason }
    )
    return response.deposit
  },

  // Verify deposit (check clearance status)
  verifyDeposit: async (depositId: string): Promise<DepositRequest> => {
    const response = await post<DepositResponse>(
      `${BASE_PATH}/${depositId}/verify`
    )
    return response.deposit
  },

  // Get deposit statistics
  getDepositStats: async (filters?: {
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    totalDeposits: number
    totalAmount: number
    successRate: number
    averageAmount: number
    byStatus: Record<string, number>
  }> => {
    return get(`${BASE_PATH}/stats`, { params: filters })
  },
}

export default depositApi

