/**
 * Enhanced API Client with Error Handling
 * Wraps existing API client with error handling and retry logic
 */

import { apiRequest, logError, handleApiError as handleError, type ApiError } from '@kealee/ui'
import { toastError, toastSuccess } from '@kealee/ui'
import { supabase } from './supabase'
import type { PMClient, PMTask } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Enhanced API request with error handling
 */
async function enhancedApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  showToast = true
): Promise<T> {
  try {
    const token = await getAuthToken()

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const result = await apiRequest<T>(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      onRetry: (attempt, error) => {
        console.log(`Retrying request (attempt ${attempt})...`, error)
      },
    })

    return result
  } catch (error: any) {
    // Log error
    logError(error, { endpoint, method: options.method || 'GET' })

    // Show toast if enabled
    if (showToast) {
      handleError(error)
    }

    throw error
  }
}

// Re-export existing API methods with enhanced error handling
export const api = {
  // PM stats + lists
  getMyStats: () => enhancedApiRequest<{ stats: any }>('/pm/stats'),
  getProductivityDashboard: () => enhancedApiRequest<{ dashboard: any }>('/pm/productivity'),
  getTaskCompliance: (taskId: string) =>
    enhancedApiRequest<{ compliance: any }>(`/pm/tasks/${taskId}/compliance`),

  getMyClients: (query?: { active?: boolean; limit?: number; unassigned?: boolean }) => {
    const params = new URLSearchParams()
    if (query?.active !== undefined) params.set('active', String(query.active))
    if (query?.limit !== undefined) params.set('limit', String(query.limit))
    if (query?.unassigned !== undefined) params.set('unassigned', String(query.unassigned))
    const qs = params.toString()
    return enhancedApiRequest<{ clients: PMClient[] }>(`/pm/clients${qs ? `?${qs}` : ''}`)
  },

  getClient: (id: string) => enhancedApiRequest<{ client: PMClient }>(`/pm/clients/${id}`),
  assignClient: (clientId: string, data: { pmId: string; effectiveDate?: string }) =>
    enhancedApiRequest<{ client: PMClient }>(`/pm/clients/${clientId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyTasks: (query?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all'
    status?: 'pending' | 'in_progress' | 'completed' | 'all'
    assignedTo?: string | 'all'
    search?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const params = new URLSearchParams()
    if (query?.priority && query.priority !== 'all') params.set('priority', query.priority)
    if (query?.status && query.status !== 'all') params.set('status', query.status)
    if (query?.assignedTo && query.assignedTo !== 'all') params.set('assignedTo', query.assignedTo)
    if (query?.search) params.set('search', query.search)
    if (query?.page) params.set('page', String(query.page))
    if (query?.pageSize) params.set('limit', String(query.pageSize))
    if (query?.sortBy) params.set('sortBy', query.sortBy)
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder)
    const qs = params.toString()
    return enhancedApiRequest<{
      tasks: PMTask[]
      pagination: { total: number; page: number; totalPages: number }
    }>(`/pm/tasks${qs ? `?${qs}` : ''}`)
  },

  getTask: (id: string) => enhancedApiRequest<{ task: PMTask }>(`/pm/tasks/${id}`),
  completeTask: (id: string, data?: { completedAt?: string; force?: boolean }) =>
    enhancedApiRequest<{ task: PMTask; compliance?: any; warning?: string }>(
      `/pm/tasks/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }
    ),
  updateTask: (id: string, data: Partial<PMTask>) =>
    enhancedApiRequest<{ task: PMTask }>(`/pm/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  addTaskComment: (taskId: string, comment: string) =>
    enhancedApiRequest<{ comment: any }>(`/pm/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  getTaskComments: (taskId: string) =>
    enhancedApiRequest<{ comments: any[] }>(`/pm/tasks/${taskId}/comments`),

  bulkAssignTasks: (taskIds: string[], newAssigneeId: string) =>
    enhancedApiRequest<{ tasks: PMTask[] }>(`/pm/tasks/bulk-assign`, {
      method: 'POST',
      body: JSON.stringify({ taskIds, newAssigneeId }),
    }),
  bulkCompleteTasks: (taskIds: string[]) =>
    enhancedApiRequest<{ tasks: PMTask[] }>(`/pm/tasks/bulk-complete`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    }),
  bulkDeleteTasks: (taskIds: string[]) =>
    enhancedApiRequest<{ success: boolean }>(`/pm/tasks/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    }),

  getPMsForAssignment: () => enhancedApiRequest<{ pms: any[] }>(`/pm/pms-for-assignment`),

  generateWeeklyReport: (weekStart?: string) => {
    const params = new URLSearchParams()
    if (weekStart) params.set('weekStart', weekStart)
    const qs = params.toString()
    return enhancedApiRequest<{ report: any }>(`/pm/reports/weekly${qs ? `?${qs}` : ''}`)
  },
}
