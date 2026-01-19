/**
 * Complete PM API Client with CSRF Protection
 * Type-safe API methods for all PM operations
 */

import { supabase } from "./supabase"
import type { PMClient, PMTask } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// CSRF token cache (in-memory)
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * Get CSRF token from API
 */
async function getCSRFToken(): Promise<string | null> {
  // Return cached token if still valid
  if (csrfToken && Date.now() < csrfTokenExpiry) {
    return csrfToken
  }

  try {
    const response = await fetch(`${API_URL}/csrf-token`, {
      method: "GET",
      credentials: "include",
    })

    if (response.ok) {
      const data = await response.json()
      csrfToken = data.csrfToken
      csrfTokenExpiry = Date.now() + 23 * 60 * 60 * 1000 // 23 hours
      return csrfToken
    }
  } catch (error) {
    console.warn("Failed to fetch CSRF token:", error)
  }

  return null
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(options.method || "GET")

  // Get CSRF token for state-changing requests
  let csrfTokenValue: string | null = null
  if (isStateChanging) {
    csrfTokenValue = await getCSRFToken()
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  // Only set JSON content-type when body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Add CSRF token for state-changing requests
  if (csrfTokenValue && isStateChanging) {
    headers["X-CSRF-Token"] = csrfTokenValue
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  })

  // Handle CSRF token errors - refresh and retry once
  if (response.status === 403) {
    const error = (await response.json().catch(() => ({}))) as {
      error?: { code?: string }
    }
    if (error.error?.code === "CSRF_TOKEN_MISSING" || error.error?.code === "CSRF_TOKEN_INVALID") {
      // Refresh CSRF token
      csrfToken = null
      csrfTokenExpiry = 0
      csrfTokenValue = await getCSRFToken()

      if (csrfTokenValue && isStateChanging) {
        headers["X-CSRF-Token"] = csrfTokenValue
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: "include",
        })

        if (retryResponse.ok) {
          return retryResponse.json()
        }
      }
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    throw new Error(error.message || error.error || `HTTP ${response.status}`)
  }

  return response.json()
}


export type TaskFilters = {
  status?: "pending" | "in_progress" | "completed"
  priority?: "low" | "medium" | "high" | "urgent"
  assignedTo?: string
  client?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: "dueDate" | "priority" | "createdAt"
  sortOrder?: "asc" | "desc"
}

export type BulkAssignRequest = {
  taskIds: string[]
  newAssigneeId: string
}

export type TaskUpdateRequest = {
  title?: string
  description?: string
  priority?: "low" | "medium" | "high" | "urgent"
  status?: "pending" | "in_progress" | "completed"
  dueDate?: string
  assignedTo?: string
}

export type TaskCommentRequest = {
  message: string
}

export type ClientAssignRequest = {
  pmId: string
  effectiveDate?: string
}

export type ReportGenerateRequest = {
  weekStart: string
  weekEnd: string
  pmId?: string
}

export type WorkloadStats = {
  pmId: string
  pmName: string
  activeTasks: number
  totalHours: number
  priorityWeight: number
  workloadPercentage: number
}

export const api = {
  // Auth/user
  getCurrentUser: () => apiRequest<{ user: unknown }>("/auth/me"),

  // PM Stats
  getMyStats: () => apiRequest<{ stats: unknown }>("/pm/stats"),
  getProductivityDashboard: () => apiRequest<{ dashboard: any }>("/pm/productivity"),

  // Tasks - List with filters, pagination, sorting
  getMyTasks: (filters?: TaskFilters) => {
    const params = new URLSearchParams()
    if (filters?.status) params.set("status", filters.status)
    if (filters?.priority) params.set("priority", filters.priority)
    if (filters?.assignedTo) params.set("assignedTo", filters.assignedTo)
    if (filters?.client) params.set("client", filters.client)
    if (filters?.search) params.set("search", filters.search)
    if (filters?.page) params.set("page", String(filters.page))
    if (filters?.pageSize) params.set("pageSize", String(filters.pageSize))
    if (filters?.sortBy) params.set("sortBy", filters.sortBy)
    if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder)
    const qs = params.toString()
    return apiRequest<{ tasks: PMTask[]; total: number; page: number; pageSize: number }>(
      `/pm/tasks${qs ? `?${qs}` : ""}`
    )
  },

  // Task - Get single
  getTask: (id: string) => apiRequest<{ task: PMTask }>(`/pm/tasks/${id}`),

  // Task - Update
  updateTask: (id: string, data: TaskUpdateRequest) =>
    apiRequest<{ task: PMTask }>(`/pm/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Task - Complete
  completeTask: (id: string, data?: { completedAt?: string; force?: boolean }) =>
    apiRequest<{ task: PMTask; compliance?: any; warning?: string }>(`/pm/tasks/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  // Task - Compliance check
  getTaskCompliance: (taskId: string) => apiRequest<{ compliance: any }>(`/pm/tasks/${taskId}/compliance`),

  // Task - Comments
  getTaskComments: (taskId: string) => apiRequest<{ comments: any[] }>(`/pm/tasks/${taskId}/comments`),
  addTaskComment: (taskId: string, data: TaskCommentRequest) =>
    apiRequest<{ comment: any }>(`/pm/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Tasks - Bulk operations
  bulkAssignTasks: (data: BulkAssignRequest) =>
    apiRequest<{ updated: number; tasks: PMTask[] }>(`/pm/tasks/bulk-assign`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  bulkCompleteTasks: (taskIds: string[]) =>
    apiRequest<{ updated: number; tasks: PMTask[] }>(`/pm/tasks/bulk-complete`, {
      method: "POST",
      body: JSON.stringify({ taskIds }),
    }),

  // Clients
  getMyClients: (query?: { active?: boolean; limit?: number }) => {
    const params = new URLSearchParams()
    if (query?.active !== undefined) params.set("active", String(query.active))
    if (query?.limit !== undefined) params.set("limit", String(query.limit))
    const qs = params.toString()
    return apiRequest<{ clients: PMClient[] }>(`/pm/clients${qs ? `?${qs}` : ""}`)
  },

  getClient: (id: string) => apiRequest<{ client: PMClient }>(`/pm/clients/${id}`),

  // Clients - Assignment
  getAvailableClients: () => apiRequest<{ clients: PMClient[] }>(`/pm/clients?unassigned=true`),
  getAvailablePMs: () => apiRequest<{ users: Array<{ id: string; name: string; email: string }> }>(`/users?role=pm`),
  assignClient: (clientId: string, data: ClientAssignRequest) =>
    apiRequest<{ client: PMClient }>(`/pm/clients/${clientId}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Workload Balancing
  getWorkloadStats: () => apiRequest<{ workloads: WorkloadStats[] }>(`/pm/workload`),

  // Reports
  generateWeeklyReport: (data: ReportGenerateRequest) =>
    apiRequest<{ report: any; pdfUrl?: string }>(`/pm/reports/generate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWeeklyReport: (weekStart?: string) => {
    const params = new URLSearchParams()
    if (weekStart) params.set("weekStart", weekStart)
    const qs = params.toString()
    return apiRequest<{ report: any }>(`/pm/reports/weekly${qs ? `?${qs}` : ""}`)
  },

  // Other PM operations
  getWorkflowStatus: (projectId: string, phase: string) =>
    apiRequest<{ status: any }>(`/workflow/status/${projectId}?phase=${phase}`),
  checkWorkflowGate: (phase: string, projectId: string) =>
    apiRequest<{ canProceed: boolean; gates: any[]; blockers: string[] }>(`/workflow/gate/${phase}/${projectId}`),
  canAdvanceToPhase: (projectId: string, phase: string) =>
    apiRequest<{ canAdvance: boolean; blockers: string[] }>(`/workflow/can-advance/${projectId}?phase=${phase}`),
  generateTasksFromSOW: (data: {
    sowText: string
    projectType: string
    projectId: string
    phase?: string
    includeDeliverables?: boolean
  }) =>
    apiRequest<{ result: any }>("/tasks/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadVoiceNote: (formData: FormData) =>
    apiRequest<{ id: string; url: string }>("/pm/voice-notes", {
      method: "POST",
      body: formData,
    }),
  scanMaterial: (barcode: string) =>
    apiRequest<{ material: any }>("/pm/materials/scan", {
      method: "POST",
      body: JSON.stringify({ barcode }),
    }),
}
