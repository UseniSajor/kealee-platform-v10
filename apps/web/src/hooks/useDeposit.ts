/**
 * useDeposit Hook
 * React Query hooks for deposit management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { depositApi } from '../api/deposit.api'
import type { DepositRequest, CreateDepositDTO } from '../types/finance.types'
import { toast } from 'sonner'

/**
 * Main deposit hook with mutations
 */
export function useDeposit() {
  const queryClient = useQueryClient()

  // Create deposit mutation
  const createDepositMutation = useMutation({
    mutationFn: (data: CreateDepositDTO) => depositApi.createDeposit(data),
    onSuccess: (deposit) => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['escrow-balance', deposit.escrowAgreementId] })
      toast.success('Deposit initiated successfully')
      return deposit
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create deposit')
    },
  })

  // Process deposit mutation
  const processDepositMutation = useMutation({
    mutationFn: (depositId: string) => depositApi.processDeposit(depositId),
    onSuccess: (deposit) => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['deposit', deposit.id] })
      toast.success('Deposit processing...')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process deposit')
    },
  })

  // Retry deposit mutation
  const retryDepositMutation = useMutation({
    mutationFn: (depositId: string) => depositApi.retryDeposit(depositId),
    onSuccess: (deposit) => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['deposit', deposit.id] })
      toast.success('Retrying deposit...')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to retry deposit')
    },
  })

  // Cancel deposit mutation
  const cancelDepositMutation = useMutation({
    mutationFn: ({ depositId, reason }: { depositId: string; reason?: string }) =>
      depositApi.cancelDeposit(depositId, reason),
    onSuccess: (deposit) => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['deposit', deposit.id] })
      toast.success('Deposit cancelled')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel deposit')
    },
  })

  // Verify deposit mutation
  const verifyDepositMutation = useMutation({
    mutationFn: (depositId: string) => depositApi.verifyDeposit(depositId),
    onSuccess: (deposit) => {
      queryClient.invalidateQueries({ queryKey: ['deposit', deposit.id] })
      if (deposit.status === 'COMPLETED') {
        toast.success('Deposit verified and completed')
      } else {
        toast.info('Deposit verification in progress')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify deposit')
    },
  })

  return {
    // Mutations
    createDeposit: createDepositMutation.mutateAsync,
    createDepositSync: createDepositMutation.mutate,
    isCreating: createDepositMutation.isPending,
    
    processDeposit: processDepositMutation.mutate,
    isProcessing: processDepositMutation.isPending,
    
    retryDeposit: retryDepositMutation.mutate,
    isRetrying: retryDepositMutation.isPending,
    
    cancelDeposit: cancelDepositMutation.mutate,
    isCancelling: cancelDepositMutation.isPending,
    
    verifyDeposit: verifyDepositMutation.mutate,
    isVerifying: verifyDepositMutation.isPending,
  }
}

/**
 * Get deposit history for an escrow
 */
export function useDepositHistory(
  escrowId?: string,
  filters?: {
    status?: string
    page?: number
    limit?: number
  }
) {
  return useQuery({
    queryKey: ['deposits', escrowId, filters],
    queryFn: () => depositApi.getDepositHistory(escrowId!, filters),
    enabled: !!escrowId,
    staleTime: 10000, // Consider fresh for 10 seconds
  })
}

/**
 * Get user's deposits
 */
export function useUserDeposits(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['user-deposits', filters],
    queryFn: () => depositApi.getUserDeposits(filters),
    staleTime: 10000,
  })
}

/**
 * Get single deposit with status polling
 * Automatically polls every 3 seconds if deposit is processing
 */
export function useDepositStatus(depositId?: string) {
  return useQuery({
    queryKey: ['deposit', depositId],
    queryFn: () => depositApi.getDeposit(depositId!),
    enabled: !!depositId,
    refetchInterval: (data) => {
      // Poll every 3 seconds if processing or clearing
      return data?.status === 'PROCESSING' || data?.status === 'CLEARING' 
        ? 3000 
        : false
    },
    staleTime: 0, // Always fetch fresh data
  })
}

/**
 * Get deposit statistics
 */
export function useDepositStats(filters?: {
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: ['deposit-stats', filters],
    queryFn: () => depositApi.getDepositStats(filters),
    staleTime: 60000, // Consider fresh for 1 minute
  })
}

/**
 * Helper hook to check if deposit can be retried
 */
export function useCanRetryDeposit(deposit?: DepositRequest): boolean {
  if (!deposit) return false
  
  return (
    deposit.status === 'FAILED' &&
    deposit.retryCount < deposit.maxRetries
  )
}

/**
 * Helper hook to check if deposit can be cancelled
 */
export function useCanCancelDeposit(deposit?: DepositRequest): boolean {
  if (!deposit) return false
  
  return (
    deposit.status === 'PENDING' ||
    deposit.status === 'PROCESSING'
  )
}

