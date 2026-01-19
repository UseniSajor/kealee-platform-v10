/**
 * API Client for m-ops-services
 * Type-safe API methods for Ops Services features
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getAuthToken(): Promise<string | null> {
  // Get auth token from Supabase session or localStorage
  if (typeof window !== 'undefined') {
    // Try to get from localStorage (set by auth flow)
    const token = localStorage.getItem('supabase.auth.token')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        return parsed?.access_token || null
      } catch {
        return null
      }
    }
  }
  return null
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Billing & Plans
  getPlans: () => apiRequest<{ plans: any[] }>(`/billing/plans`),

  createCheckoutSession: (data: {
    orgId: string
    planSlug: 'package-a' | 'package-b' | 'package-c' | 'package-d'
    interval: 'month' | 'year'
    successUrl: string
    cancelUrl: string
    customerEmail?: string
  }) => apiRequest<{ url: string; id: string }>(`/billing/stripe/checkout-session`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  createBillingPortalSession: (data: {
    orgId: string
    returnUrl: string
  }) => apiRequest<{ url: string; id: string }>(`/billing/stripe/portal-session`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getMySubscription: () => {
    // Get subscription from service subscriptions table
    // This will be implemented when we have org context
    return apiRequest<{ subscription: any }>(`/billing/subscriptions/me`)
  },

  // Service Requests
  createServiceRequest: (data: {
    orgId: string
    title: string
    description?: string
    category: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    dueDate?: string
  }) => apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getServiceRequest: (requestId: string) => apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests/${requestId}`),

  listServiceRequests: (filters?: {
    planId?: string
    status?: string
    requestType?: string
    assignedTo?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.planId) params.append('planId', filters.planId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.requestType) params.append('requestType', filters.requestType)
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    const query = params.toString()
    return apiRequest<{ serviceRequests: any[] }>(`/ops-services/service-requests${query ? `?${query}` : ''}`)
  },

  updateServiceRequestStatus: (requestId: string, data: {
    status: 'open' | 'in_progress' | 'completed' | 'canceled'
    assignedTo?: string
  }) => apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  assignServiceRequest: (requestId: string, data: {
    assignedTo: string
  }) => apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests/${requestId}/assign`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Tasks
  createTask: (requestId: string, data: {
    title: string
    description?: string
    assignedTo?: string
    dueDate?: string
  }) => apiRequest<{ task: any }>(`/ops-services/service-requests/${requestId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  listTasks: (filters?: {
    requestId?: string
    assignedTo?: string
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.requestId) params.append('requestId', filters.requestId)
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiRequest<{ tasks: any[] }>(`/ops-services/tasks${query ? `?${query}` : ''}`)
  },

  updateTaskStatus: (taskId: string, data: {
    status: 'pending' | 'in_progress' | 'completed'
  }) => apiRequest<{ task: any }>(`/ops-services/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
}
