/**
 * useEscrow Hook
 * React Query hooks for escrow management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { escrowApi } from '../api/escrow.api'
import type {
  EscrowAgreement,
  EscrowTransaction,
  EscrowHold,
  BalanceBreakdown,
  PlaceHoldDTO,
  ProcessRefundDTO,
} from '../types/finance.types'
import { toast } from 'sonner'

/**
 * Get escrow agreement by ID
 */
export function useEscrow(escrowId?: string) {
  const queryClient = useQueryClient()

  // Get escrow agreement
  const {
    data: escrow,
    isLoading: escrowLoading,
    error: escrowError,
    refetch: refetchEscrow,
  } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: () => escrowApi.getEscrow(escrowId!),
    enabled: !!escrowId,
    staleTime: 30000, // Consider fresh for 30 seconds
  })

  // Get transactions
  const {
    data: transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['escrow-transactions', escrowId],
    queryFn: () => escrowApi.getEscrowTransactions(escrowId!),
    enabled: !!escrowId,
    staleTime: 10000, // Consider fresh for 10 seconds
  })

  // Get balance breakdown
  const {
    data: balanceBreakdown,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['escrow-balance', escrowId],
    queryFn: () => escrowApi.getEscrowBalance(escrowId!),
    enabled: !!escrowId,
    staleTime: 5000, // Consider fresh for 5 seconds (balance changes frequently)
  })

  // Place hold mutation
  const placeHoldMutation = useMutation({
    mutationFn: (data: PlaceHoldDTO) =>
      escrowApi.placeEscrowHold(escrowId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-balance', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions', escrowId] })
      toast.success('Hold placed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place hold')
    },
  })

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: (data: ProcessRefundDTO) =>
      escrowApi.processRefund(escrowId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-balance', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions', escrowId] })
      toast.success('Refund processed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process refund')
    },
  })

  // Close escrow mutation
  const closeEscrowMutation = useMutation({
    mutationFn: () => escrowApi.closeEscrow(escrowId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrows'] })
      toast.success('Escrow closed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to close escrow')
    },
  })

  return {
    // Data
    escrow,
    transactions,
    balanceBreakdown,
    
    // Loading states
    isLoading: escrowLoading || transactionsLoading || balanceLoading,
    escrowLoading,
    transactionsLoading,
    balanceLoading,
    
    // Error states
    error: escrowError,
    
    // Refetch functions
    refetchEscrow,
    refetchTransactions,
    refetchBalance,
    
    // Mutations
    placeHold: placeHoldMutation.mutate,
    placeHoldAsync: placeHoldMutation.mutateAsync,
    isPlacingHold: placeHoldMutation.isPending,
    
    processRefund: processRefundMutation.mutate,
    processRefundAsync: processRefundMutation.mutateAsync,
    isProcessingRefund: processRefundMutation.isPending,
    
    closeEscrow: closeEscrowMutation.mutate,
    closeEscrowAsync: closeEscrowMutation.mutateAsync,
    isClosingEscrow: closeEscrowMutation.isPending,
  }
}

/**
 * Get escrow by contract ID
 */
export function useEscrowByContract(contractId?: string) {
  return useQuery({
    queryKey: ['escrow-by-contract', contractId],
    queryFn: () => escrowApi.getEscrowByContract(contractId!),
    enabled: !!contractId,
    staleTime: 30000,
  })
}

/**
 * List all escrows with filters
 */
export function useEscrows(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['escrows', filters],
    queryFn: () => escrowApi.listEscrows(filters),
    staleTime: 60000, // Consider fresh for 1 minute
  })
}

/**
 * Release hold mutation (can be used standalone)
 */
export function useReleaseHold() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ holdId, notes }: { holdId: string; notes?: string }) =>
      escrowApi.releaseHold(holdId, { notes }),
    onSuccess: (_, variables) => {
      // Invalidate all escrow-related queries
      queryClient.invalidateQueries({ queryKey: ['escrow'] })
      queryClient.invalidateQueries({ queryKey: ['escrow-balance'] })
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions'] })
      toast.success('Hold released successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to release hold')
    },
  })
}

/**
 * Record fee mutation
 */
export function useRecordFee(escrowId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      feeType: 'PLATFORM' | 'PROCESSING' | 'INSTANT_PAYOUT'
      amount: number
      description: string
    }) => escrowApi.recordFee(escrowId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-balance', escrowId] })
      queryClient.invalidateQueries({ queryKey: ['escrow-transactions', escrowId] })
      toast.success('Fee recorded successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record fee')
    },
  })
}

