/**
 * API Client for m-ops-services
 * Type-safe API methods for Ops Services features
 */

import { createBrowserClient } from '@supabase/ssr'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let _supabase: ReturnType<typeof createBrowserClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { data: { session } } = await getSupabase().auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
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

  getMySubscription: () => apiRequest<{ subscription: any }>(`/billing/subscriptions/me`),

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

  // Service Request Messages & Satisfaction
  addServiceRequestMessage: (requestId: string, message: string) => 
    apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests/${requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  setServiceRequestSatisfaction: (requestId: string, rating: number) =>
    apiRequest<{ serviceRequest: any }>(`/ops-services/service-requests/${requestId}/satisfaction`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),

  // Org & User
  getMyOrgs: () => apiRequest<{ orgs: any[] }>(`/orgs/my`),

  getOrg: (orgId: string) => apiRequest<{ org: any }>(`/orgs/${orgId}`),

  getOrgMembers: (orgId: string) => apiRequest<{ members: any[]; count: number }>(`/orgs/${orgId}/members`),

  addOrgMember: (orgId: string, data: { userId: string; roleKey: string }) =>
    apiRequest<{ member: any }>(`/orgs/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrgMemberRole: (orgId: string, userId: string, roleKey: string) =>
    apiRequest<{ member: any }>(`/orgs/${orgId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ roleKey }),
    }),

  removeOrgMember: (orgId: string, userId: string) =>
    apiRequest<{ message: string }>(`/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Projects
  getProjects: (filters?: { orgId?: string; status?: string }) => {
    const params = new URLSearchParams()
    if (filters?.orgId) params.append('orgId', filters.orgId)
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiRequest<{ projects: any[] }>(`/projects${query ? `?${query}` : ''}`)
  },

  getProjectStats: (orgId: string) => apiRequest<{ stats: any }>(`/projects/stats?orgId=${orgId}`),

  // Reports
  getReports: (filters?: { type?: string; page?: string; limit?: string }) => {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.page) params.append('page', filters.page)
    if (filters?.limit) params.append('limit', filters.limit)
    const query = params.toString()
    return apiRequest<{ reports: any[]; pagination: any }>(`/api/reports${query ? `?${query}` : ''}`)
  },

  getReport: (reportId: string) => apiRequest<{ report: any }>(`/api/reports/${reportId}`),

  generateReport: (data: {
    type: 'weekly' | 'monthly' | 'custom'
    startDate: string
    endDate: string
  }) => apiRequest<{ report: any }>(`/api/reports/generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getReportDownloadUrl: (reportId: string) => apiRequest<{ downloadUrl: string | null; reportId: string }>(`/api/reports/${reportId}/download`),

  // Subscription details + invoices
  getSubscriptionDetails: (orgId: string) => apiRequest<{ details: any }>(`/billing/subscriptions/${orgId}/details`),

  getSubscriptionMetrics: (filters?: { orgId?: string }) => {
    const params = new URLSearchParams()
    if (filters?.orgId) params.append('orgId', filters.orgId)
    const query = params.toString()
    return apiRequest<{ metrics: any }>(`/billing/reports/subscription-metrics${query ? `?${query}` : ''}`)
  },

  // Stripe checkout via backend
  createStripeCheckout: (data: {
    packageId: string
    successUrl: string
    cancelUrl: string
    customerEmail?: string
  }) => apiRequest<{ sessionId: string; url: string }>(`/api/stripe/create-checkout`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // ── Site Tools: Daily Logs ──────────────────────────────────────────

  listDailyLogs: (filters?: { projectId?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))
    const query = params.toString()
    return apiRequest<{ dailyLogs: any[]; pagination?: any }>(`/site-tools/daily-logs${query ? `?${query}` : ''}`)
  },

  getDailyLog: (logId: string) =>
    apiRequest<{ dailyLog: any }>(`/site-tools/daily-logs/${logId}`),

  createDailyLog: (data: {
    projectId: string
    workPerformed: string
    crewCount?: number
    hoursWorked?: number
    weather?: string
    temperature?: number
    progressNotes?: string
    issues?: string
    safetyIncidents?: string
    materialsDelivered?: string
    equipmentUsed?: string
    subsOnSite?: string
    photoIds?: string[]
  }) => apiRequest<{ dailyLog: any }>(`/site-tools/daily-logs`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateDailyLog: (logId: string, data: Record<string, any>) =>
    apiRequest<{ dailyLog: any }>(`/site-tools/daily-logs/${logId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDailyLog: (logId: string) =>
    apiRequest<{ message: string }>(`/site-tools/daily-logs/${logId}`, {
      method: 'DELETE',
    }),

  getDailyLogProjectSummary: (projectId: string) =>
    apiRequest<{ summary: any }>(`/site-tools/daily-logs/project/${projectId}/summary`),

  // ── Site Tools: Photos ──────────────────────────────────────────────

  listPhotos: (filters?: { projectId?: string; category?: string }) => {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.category) params.append('category', filters.category)
    const query = params.toString()
    return apiRequest<{ photos: any[] }>(`/site-tools/photos${query ? `?${query}` : ''}`)
  },

  createPhoto: (data: {
    projectId: string
    url: string
    caption?: string
    category?: string
  }) => apiRequest<{ photo: any }>(`/site-tools/photos`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  deletePhoto: (photoId: string) =>
    apiRequest<{ message: string }>(`/site-tools/photos/${photoId}`, {
      method: 'DELETE',
    }),

  // ── Estimation ────────────────────────────────────────────────────────

  listEstimates: (filters?: { projectId?: string; status?: string; search?: string }) => {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    const query = params.toString()
    return apiRequest<{ estimates: any[] }>(`/estimation/project${query ? `?${query}` : ''}`)
  },

  createEstimate: (data: {
    name: string
    projectId?: string
    description?: string
    type?: string
    status?: string
  }) => apiRequest<{ estimate: any }>(`/estimation/estimates`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getEstimate: (estimateId: string) =>
    apiRequest<{ estimate: any }>(`/estimation/estimate/${estimateId}`),

  updateEstimate: (estimateId: string, data: Record<string, any>) =>
    apiRequest<{ estimate: any }>(`/estimation/estimate/${estimateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEstimate: (estimateId: string) =>
    apiRequest<{ message: string }>(`/estimation/estimate/${estimateId}`, {
      method: 'DELETE',
    }),

  listAssemblies: () =>
    apiRequest<{ assemblies: any[] }>(`/estimation/assemblies`),

  listCostDatabases: () =>
    apiRequest<{ databases: any[] }>(`/estimation/databases`),

  getMaterials: () =>
    apiRequest<{ materials: any[] }>(`/estimation/data/materials`),

  getLaborRates: () =>
    apiRequest<{ laborRates: any[] }>(`/estimation/data/labor-rates`),

  listTakeoffs: () =>
    apiRequest<{ takeoffs: any[] }>(`/estimation/takeoffs`),

  uploadTakeoffPlan: (formData: FormData) => {
    // Special handling for file upload — no JSON Content-Type
    return (async () => {
      const token = await getAuthToken()
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${API_BASE_URL}/estimation/takeoff/upload`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return response.json() as Promise<{ takeoff: any }>
    })()
  },

  runAiTakeoff: (data: {
    takeoffId?: string
    fileUrl?: string
    discipline?: string
    options?: Record<string, any>
  }) => apiRequest<{ result: any }>(`/estimation/ai/takeoff`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  runScopeAnalysis: (data: {
    estimateId?: string
    projectDescription?: string
    projectType?: string
  }) => apiRequest<{ analysis: any }>(`/estimation/ai/scope-analysis`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  runCostPrediction: (data: {
    estimateId?: string
    projectType?: string
    squareFootage?: number
    location?: string
  }) => apiRequest<{ prediction: any }>(`/estimation/ai/cost-prediction`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  runValueEngineering: (data: {
    estimateId?: string
    targetReduction?: number
  }) => apiRequest<{ suggestions: any }>(`/estimation/ai/value-engineering`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  compareEstimates: (data: {
    estimateIds: string[]
  }) => apiRequest<{ comparison: any }>(`/estimation/ai/compare-estimates`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  benchmarkEstimate: (data: {
    estimateId: string
  }) => apiRequest<{ benchmark: any }>(`/estimation/ai/benchmark`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getEstimationMetrics: () =>
    apiRequest<{ metrics: any }>(`/estimation/metrics`),

  addLineItem: (estimateId: string, data: {
    description: string
    quantity: number
    unit: string
    unitCost: number
    type?: string
    division?: string
    csiCode?: string
  }) => apiRequest<{ lineItem: any }>(`/estimation/estimate/${estimateId}/line-items`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  deleteLineItem: (estimateId: string, lineItemId: string) =>
    apiRequest<{ message: string }>(`/estimation/estimate/${estimateId}/line-items/${lineItemId}`, {
      method: 'DELETE',
    }),
}
