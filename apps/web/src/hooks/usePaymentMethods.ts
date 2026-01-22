/**
 * usePaymentMethods Hook
 * React Query hooks for payment method management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../api/payment.api'
import type { PaymentMethod, AddPaymentMethodDTO } from '../types/finance.types'
import { toast } from 'sonner'

/**
 * Main payment methods hook
 */
export function usePaymentMethods() {
  const queryClient = useQueryClient()

  // Get payment methods
  const {
    data: paymentMethods,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentApi.getPaymentMethods(),
    staleTime: 60000, // Consider fresh for 1 minute
  })

  // Add payment method
  const addPaymentMethodMutation = useMutation({
    mutationFn: (data: AddPaymentMethodDTO) =>
      paymentApi.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Payment method added successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add payment method')
    },
  })

  // Remove payment method
  const removePaymentMethodMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApi.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Payment method removed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove payment method')
    },
  })

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentApi.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Default payment method updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set default')
    },
  })

  // Verify payment method (for ACH)
  const verifyPaymentMethodMutation = useMutation({
    mutationFn: ({
      paymentMethodId,
      amount1,
      amount2,
    }: {
      paymentMethodId: string
      amount1: number
      amount2: number
    }) =>
      paymentApi.verifyPaymentMethod(paymentMethodId, { amount1, amount2 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Payment method verified successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify payment method')
    },
  })

  // Get Stripe setup intent
  const getSetupIntentMutation = useMutation({
    mutationFn: (type: 'CARD' | 'ACH') => paymentApi.getSetupIntent(type),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initialize payment setup')
    },
  })

  return {
    // Data
    paymentMethods,
    defaultPaymentMethod: paymentMethods?.find((pm) => pm.isDefault),
    hasPaymentMethods: (paymentMethods?.length ?? 0) > 0,
    
    // Loading states
    isLoading,
    error,
    
    // Refetch
    refetch,
    
    // Mutations
    addPaymentMethod: addPaymentMethodMutation.mutateAsync,
    isAdding: addPaymentMethodMutation.isPending,
    
    removePaymentMethod: removePaymentMethodMutation.mutate,
    isRemoving: removePaymentMethodMutation.isPending,
    
    setDefault: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
    
    verifyPaymentMethod: verifyPaymentMethodMutation.mutate,
    isVerifying: verifyPaymentMethodMutation.isPending,
    
    getSetupIntent: getSetupIntentMutation.mutateAsync,
    isGettingSetupIntent: getSetupIntentMutation.isPending,
  }
}

/**
 * Get specific payment method
 */
export function usePaymentMethod(paymentMethodId?: string) {
  return useQuery({
    queryKey: ['payment-method', paymentMethodId],
    queryFn: () => paymentApi.getPaymentMethod(paymentMethodId!),
    enabled: !!paymentMethodId,
    staleTime: 60000,
  })
}

/**
 * Filter payment methods by type
 */
export function usePaymentMethodsByType(
  type: 'CARD' | 'ACH' | 'WIRE'
): PaymentMethod[] | undefined {
  const { paymentMethods } = usePaymentMethods()
  return paymentMethods?.filter((pm) => pm.type === type)
}

/**
 * Get only verified payment methods
 */
export function useVerifiedPaymentMethods(): PaymentMethod[] | undefined {
  const { paymentMethods } = usePaymentMethods()
  return paymentMethods?.filter((pm) => pm.isVerified)
}

/**
 * Helper hook to check if payment method requires verification
 */
export function useRequiresVerification(paymentMethod?: PaymentMethod): boolean {
  if (!paymentMethod) return false
  
  return (
    paymentMethod.type === 'ACH' &&
    !paymentMethod.isVerified &&
    paymentMethod.status === 'VERIFICATION_PENDING'
  )
}

/**
 * Helper hook to get payment method display name
 */
export function usePaymentMethodDisplay(paymentMethod?: PaymentMethod): string {
  if (!paymentMethod) return ''
  
  switch (paymentMethod.type) {
    case 'CARD':
      return `${paymentMethod.brand || 'Card'} •••• ${paymentMethod.last4}`
    case 'ACH':
      return `${paymentMethod.bankName || 'Bank'} •••• ${paymentMethod.last4}`
    case 'WIRE':
      return `Wire Transfer •••• ${paymentMethod.last4}`
    default:
      return `•••• ${paymentMethod.last4}`
  }
}

/**
 * Helper hook to check if payment method is expired (for cards)
 */
export function useIsPaymentMethodExpired(paymentMethod?: PaymentMethod): boolean {
  if (!paymentMethod || paymentMethod.type !== 'CARD') return false
  if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) return false
  
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  return (
    paymentMethod.expiryYear < currentYear ||
    (paymentMethod.expiryYear === currentYear &&
      paymentMethod.expiryMonth < currentMonth)
  )
}

