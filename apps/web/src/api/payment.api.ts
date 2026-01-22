/**
 * Payment Methods API Client
 * API calls for payment method management
 */

import { get, post, del } from './client'
import type {
  PaymentMethod,
  AddPaymentMethodDTO,
  PaymentMethodsResponse,
} from '../types/finance.types'

const BASE_PATH = '/api/payment-methods'

export const paymentApi = {
  // Get all payment methods for current user
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await get<PaymentMethodsResponse>(BASE_PATH)
    return response.paymentMethods
  },

  // Get specific payment method
  getPaymentMethod: async (paymentMethodId: string): Promise<PaymentMethod> => {
    const response = await get<{ success: boolean; paymentMethod: PaymentMethod }>(
      `${BASE_PATH}/${paymentMethodId}`
    )
    return response.paymentMethod
  },

  // Add new payment method
  addPaymentMethod: async (
    data: AddPaymentMethodDTO
  ): Promise<PaymentMethod> => {
    const response = await post<{ success: boolean; paymentMethod: PaymentMethod }>(
      BASE_PATH,
      data
    )
    return response.paymentMethod
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await del(`${BASE_PATH}/${paymentMethodId}`)
  },

  // Set default payment method
  setDefaultPaymentMethod: async (
    paymentMethodId: string
  ): Promise<PaymentMethod> => {
    const response = await post<{ success: boolean; paymentMethod: PaymentMethod }>(
      `${BASE_PATH}/${paymentMethodId}/set-default`
    )
    return response.paymentMethod
  },

  // Verify payment method (for ACH/bank accounts)
  verifyPaymentMethod: async (
    paymentMethodId: string,
    verificationData: {
      amount1: number
      amount2: number
    }
  ): Promise<PaymentMethod> => {
    const response = await post<{ success: boolean; paymentMethod: PaymentMethod }>(
      `${BASE_PATH}/${paymentMethodId}/verify`,
      verificationData
    )
    return response.paymentMethod
  },

  // Get Stripe setup intent for adding payment method
  getSetupIntent: async (type: 'CARD' | 'ACH'): Promise<{
    clientSecret: string
    setupIntentId: string
  }> => {
    return post(`${BASE_PATH}/setup-intent`, { type })
  },
}

export default paymentApi

