import { supabase } from "./supabase"
import type { PMClient, PMTask } from "./types"
import { createApiClient } from "@kealee/api-client"
import type { LeadStage } from "@kealee/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    throw new Error(error.message || error.error || "API request failed")
  }

  return response.json()
}

// Create shared API client for lead operations
const leadApiClient = createApiClient({
  baseUrl: API_URL,
  getAuthToken,
})

export const api = {
  // Auth/user
  getCurrentUser: () => apiRequest<{ user: unknown }>("/auth/me"),

  // PM stats + lists (these endpoints will be implemented under /pm/*)
  getMyStats: () => apiRequest<{ stats: unknown }>("/pm/stats"),
  getProductivityDashboard: () => apiRequest<{ dashboard: import("./types").PMDashboard }>("/pm/productivity"),
  getTaskCompliance: (taskId: string) => apiRequest<{ compliance: any }>(`/pm/tasks/${taskId}/compliance`),
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
  getMyClients: (query?: { active?: boolean; limit?: number }) => {
    const params = new URLSearchParams()
    if (query?.active !== undefined) params.set("active", String(query.active))
    if (query?.limit !== undefined) params.set("limit", String(query.limit))
    const qs = params.toString()
    return apiRequest<{ clients: PMClient[] }>(`/pm/clients${qs ? `?${qs}` : ""}`)
  },
  getClient: (id: string) => apiRequest<{ client: PMClient }>(`/pm/clients/${id}`),

  getMyTasks: (query?: { priority?: "low" | "medium" | "high"; limit?: number }) => {
    const params = new URLSearchParams()
    if (query?.priority) params.set("priority", query.priority)
    if (query?.limit !== undefined) params.set("limit", String(query.limit))
    const qs = params.toString()
    return apiRequest<{ tasks: PMTask[] }>(`/pm/tasks${qs ? `?${qs}` : ""}`)
  },
  getTask: (id: string) => apiRequest<{ task: PMTask }>(`/pm/tasks/${id}`),
  completeTask: (id: string, data: { completedAt: string }) =>
    apiRequest<{ task: PMTask }>(`/pm/tasks/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Sales Pipeline / Leads (using shared API client)
  listLeads: (query?: {
    stage?: LeadStage
    estimatedValueMin?: number
    estimatedValueMax?: number
    city?: string
    state?: string
    projectType?: string
    assignedSalesRepId?: string
    limit?: number
    offset?: number
  }) => leadApiClient.listLeads(query),
  getLead: (id: string) => leadApiClient.getLead(id),
  updateLeadStage: (id: string, stage: LeadStage) =>
    leadApiClient.updateLeadStage(id, stage),
  assignSalesRep: (id: string, salesRepId: string) =>
    leadApiClient.assignSalesRep(id, salesRepId),
  awardContractor: (id: string, profileId: string) =>
    leadApiClient.awardContractor(id, profileId),
  closeLost: (id: string, reason: string) => leadApiClient.closeLost(id, reason),
  distributeLead: (id: string, distributionCount?: number) =>
    leadApiClient.distributeLead(id, distributionCount),
}

