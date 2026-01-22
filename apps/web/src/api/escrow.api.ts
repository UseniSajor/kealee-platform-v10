/**
 * Escrow API Client
 * API calls for escrow management
 */

import { get, post } from './client'
import type {
  EscrowAgreement,
  EscrowTransaction,
  EscrowHold,
  BalanceBreakdown,
  EscrowResponse,
  TransactionsResponse,
  BalanceResponse,
  PlaceHoldDTO,
  ReleaseHoldDTO,
  ProcessRefundDTO,
} from '../types/finance.types'

const BASE_PATH = '/api/escrow'

export const escrowApi = {
  // Get escrow agreement by ID
  getEscrow: async (escrowId: string): Promise<EscrowAgreement> => {
    const response = await get<EscrowResponse>(`${BASE_PATH}/agreements/${escrowId}`)
    return response.escrow
  },

  // Get escrow by contract ID
  getEscrowByContract: async (contractId: string): Promise<EscrowAgreement> => {
    const response = await get<EscrowResponse>(`${BASE_PATH}/contract/${contractId}`)
    return response.escrow
  },

  // List all escrow agreements
  listEscrows: async (filters?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{ escrows: EscrowAgreement[]; total: number }> => {
    return get(`${BASE_PATH}/agreements`, { params: filters })
  },

  // Get escrow transactions
  getEscrowTransactions: async (escrowId: string): Promise<EscrowTransaction[]> => {
    const response = await get<TransactionsResponse>(
      `${BASE_PATH}/agreements/${escrowId}/transactions`
    )
    return response.transactions
  },

  // Get escrow balance breakdown
  getEscrowBalance: async (escrowId: string): Promise<BalanceBreakdown> => {
    const response = await get<BalanceResponse>(
      `${BASE_PATH}/agreements/${escrowId}/balance`
    )
    return response.balance
  },

  // Place hold on escrow
  placeEscrowHold: async (
    escrowId: string,
    data: PlaceHoldDTO
  ): Promise<EscrowHold> => {
    const response = await post<{ success: boolean; hold: EscrowHold }>(
      `${BASE_PATH}/agreements/${escrowId}/hold`,
      data
    )
    return response.hold
  },

  // Release hold
  releaseHold: async (
    holdId: string,
    data?: ReleaseHoldDTO
  ): Promise<EscrowHold> => {
    const response = await post<{ success: boolean; hold: EscrowHold }>(
      `${BASE_PATH}/holds/${holdId}/release`,
      data
    )
    return response.hold
  },

  // Process refund
  processRefund: async (
    escrowId: string,
    data: ProcessRefundDTO
  ): Promise<EscrowTransaction> => {
    const response = await post<{ success: boolean; transaction: EscrowTransaction }>(
      `${BASE_PATH}/agreements/${escrowId}/refund`,
      data
    )
    return response.transaction
  },

  // Close escrow
  closeEscrow: async (escrowId: string): Promise<EscrowAgreement> => {
    const response = await post<EscrowResponse>(
      `${BASE_PATH}/agreements/${escrowId}/close`
    )
    return response.escrow
  },

  // Record fee
  recordFee: async (
    escrowId: string,
    data: {
      feeType: 'PLATFORM' | 'PROCESSING' | 'INSTANT_PAYOUT'
      amount: number
      description: string
    }
  ): Promise<EscrowTransaction> => {
    const response = await post<{ success: boolean; transaction: EscrowTransaction }>(
      `${BASE_PATH}/agreements/${escrowId}/fee`,
      data
    )
    return response.transaction
  },
}

export default escrowApi

