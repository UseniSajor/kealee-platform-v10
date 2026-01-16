/**
 * API Client for m-ops-services
 * Type-safe API methods for Ops Services features
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Service Plans
  getPackageTiers: () => apiRequest<{ packageTiers: any }>(`/ops-services/package-tiers`),

  createServicePlan: (data: {
    packageTier: 'A' | 'B' | 'C' | 'D'
    stripeSubscriptionId?: string
  }) => apiRequest<{ servicePlan: any }>(`/ops-services/service-plans`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getServicePlan: (planId: string) => apiRequest<{ servicePlan: any }>(`/ops-services/service-plans/${planId}`),

  getMyServicePlan: () => apiRequest<{ servicePlan: any }>(`/ops-services/service-plans/me`),

  listServicePlans: (filters?: {
    status?: string
    packageTier?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.packageTier) params.append('packageTier', filters.packageTier)
    const query = params.toString()
    return apiRequest<{ servicePlans: any[] }>(`/ops-services/service-plans${query ? `?${query}` : ''}`)
  },

  updateServicePlan: (planId: string, data: {
    packageTier?: 'A' | 'B' | 'C' | 'D'
    status?: string
    stripeSubscriptionId?: string
  }) => apiRequest<{ servicePlan: any }>(`/ops-services/service-plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  cancelServicePlan: (planId: string) => apiRequest<{ servicePlan: any }>(`/ops-services/service-plans/${planId}/cancel`, {
    method: 'POST',
  }),

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
