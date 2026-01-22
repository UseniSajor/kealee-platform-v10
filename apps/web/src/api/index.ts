/**
 * API Client Exports
 * Central export for all API clients
 */

export { apiClient, get, post, put, del, patch } from './client'
export { escrowApi } from './escrow.api'
export { depositApi } from './deposit.api'
export { paymentApi } from './payment.api'
export { accountingApi } from './accounting.api'

export default apiClient

