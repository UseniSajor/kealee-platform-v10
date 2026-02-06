"use client"

import { apiClient } from "@/lib/api/client"
import type {
  ApiListResponse,
  ApiResponse,
  ChangeOrderItem,
  Client,
  ClientPortalProject,
  CreateDailyLogInput,
  CreateDispatchInput,
  CreatePriceBookItemInput,
  CreateProjectInput,
  CreateRFIInput,
  CreateSubmittalInput,
  CreateTaskInput,
  CRMLeadItem,
  DailyLogItem,
  DashboardReport,
  DispatchItem,
  DocumentItem,
  DocumentUploadResponse,
  Permit,
  PermitCheckStatusResponse,
  PermitScheduleInspectionInput,
  PhotoItem,
  PriceBookItemType,
  Project,
  ProjectBudget,
  ProjectTimeline,
  RFIItem,
  ScheduleItemType,
  SubcontractorItem,
  SubmittalItem,
  Task,
  UpdateProjectInput,
  UpdateTaskInput,
  AIAgent,
  MiniAppConnection,
  AutomationRule,
  JobQueueItem,
  SystemHealthMetric,
  IntegrationItem,
  WebhookItem,
  SyncLogEntry,
} from "@/lib/types/index"

export const api = {
  auth: {
    me: async () => {
      const { data } = await apiClient.get<ApiResponse<{ user: { id: string; email?: string; name?: string } }>>("/auth/me")
      return data
    },
  },

  clients: {
    list: async () => {
      const { data } = await apiClient.get<ApiListResponse<Client>>("/pm/clients")
      return data
    },
    get: async (clientId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ client: Client }>>(`/pm/clients/${clientId}`)
      return data
    },
  },

  projects: {
    list: async (clientId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<Project>>("/pm/projects", { params: clientId ? { clientId } : undefined })
      return data
    },
    get: async (projectId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ project: Project }>>(`/pm/projects/${projectId}`)
      return data
    },
    create: async (input: CreateProjectInput) => {
      const { data } = await apiClient.post<ApiResponse<{ project: Project }>>("/pm/projects", input)
      return data
    },
    update: async (projectId: string, input: UpdateProjectInput) => {
      const { data } = await apiClient.patch<ApiResponse<{ project: Project }>>(`/pm/projects/${projectId}`, input)
      return data
    },
    delete: async (projectId: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ ok: true }>>(`/pm/projects/${projectId}`)
      return data
    },

    budget: {
      get: async (projectId: string) => {
        const { data } = await apiClient.get<ApiResponse<{ budget: ProjectBudget }>>(`/pm/projects/${projectId}/budget`)
        return data
      },
      update: async (projectId: string, budget: ProjectBudget) => {
        const { data } = await apiClient.put<ApiResponse<{ budget: ProjectBudget }>>(`/pm/projects/${projectId}/budget`, budget)
        return data
      },
    },

    timeline: {
      get: async (projectId: string) => {
        const { data } = await apiClient.get<ApiResponse<{ timeline: ProjectTimeline }>>(`/pm/projects/${projectId}/timeline`)
        return data
      },
      update: async (projectId: string, timeline: ProjectTimeline) => {
        const { data } = await apiClient.put<ApiResponse<{ timeline: ProjectTimeline }>>(`/pm/projects/${projectId}/timeline`, timeline)
        return data
      },
    },

    permits: {
      list: async (projectId: string) => {
        const { data } = await apiClient.get<ApiListResponse<Permit>>(`/pm/projects/${projectId}/permits`)
        return data
      },
    },

    documents: {
      list: async (projectId: string) => {
        const { data } = await apiClient.get<ApiListResponse<DocumentItem>>(`/pm/projects/${projectId}/documents`)
        return data
      },
    },

    photos: {
      list: async (projectId: string) => {
        const { data } = await apiClient.get<ApiListResponse<PhotoItem>>(`/pm/projects/${projectId}/photos`)
        return data
      },
    },
  },

  tasks: {
    list: async (query?: { status?: string; priority?: string; assignedTo?: string; projectId?: string }) => {
      const { data } = await apiClient.get<ApiListResponse<Task>>("/pm/tasks", { params: query })
      return data
    },
    get: async (taskId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ task: Task }>>(`/pm/tasks/${taskId}`)
      return data
    },
    create: async (input: CreateTaskInput) => {
      const { data } = await apiClient.post<ApiResponse<{ task: Task }>>("/pm/tasks", input)
      return data
    },
    update: async (taskId: string, input: UpdateTaskInput) => {
      const { data } = await apiClient.patch<ApiResponse<{ task: Task }>>(`/pm/tasks/${taskId}`, input)
      return data
    },
    delete: async (taskId: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ ok: true }>>(`/pm/tasks/${taskId}`)
      return data
    },
  },

  permits: {
    scheduleInspection: async (projectId: string, input: PermitScheduleInspectionInput) => {
      const { data } = await apiClient.post<ApiResponse<{ inspectionId: string }>>(
        `/pm/projects/${projectId}/inspections`,
        input
      )
      return data
    },
    uploadDocs: async (permitId: string, files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append("files", f)
      const { data } = await apiClient.post<DocumentUploadResponse>(`/pm/permits/${permitId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    checkStatus: async (permitId: string) => {
      const { data } = await apiClient.post<PermitCheckStatusResponse>(`/pm/permits/${permitId}/check-status`)
      return data
    },
  },

  documents: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<DocumentItem>>("/pm/documents", { params: projectId ? { projectId } : undefined })
      return data
    },
    upload: async (projectId: string, files: File[], meta?: { folder?: string }) => {
      const form = new FormData()
      for (const f of files) form.append("files", f)
      if (meta?.folder) form.append("folder", meta.folder)
      const { data } = await apiClient.post<DocumentUploadResponse>(`/pm/projects/${projectId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    delete: async (documentId: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ ok: true }>>(`/pm/documents/${documentId}`)
      return data
    },
  },

  photos: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<PhotoItem>>("/pm/photos", { params: projectId ? { projectId } : undefined })
      return data
    },
    upload: async (projectId: string, files: File[], meta?: { category?: string }) => {
      const form = new FormData()
      for (const f of files) form.append("files", f)
      if (meta?.category) form.append("category", meta.category)
      const { data } = await apiClient.post<ApiResponse<{ photos: PhotoItem[] }>>(`/pm/projects/${projectId}/photos`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    updateGps: async (photoId: string, gps: { lat: number; lon: number }) => {
      const { data } = await apiClient.patch<ApiResponse<{ photo: PhotoItem }>>(`/pm/photos/${photoId}`, {
        gpsLatitude: gps.lat,
        gpsLongitude: gps.lon,
      })
      return data
    },
  },

  rfis: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<RFIItem>>("/pm/rfis", { params: projectId ? { projectId } : undefined })
      return data
    },
    get: async (rfiId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ rfi: RFIItem }>>(`/pm/rfis/${rfiId}`)
      return data
    },
    create: async (input: CreateRFIInput) => {
      const { data } = await apiClient.post<ApiResponse<{ rfi: RFIItem }>>("/pm/rfis", input)
      return data
    },
    update: async (rfiId: string, input: Partial<CreateRFIInput> & { status?: string; answer?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<{ rfi: RFIItem }>>(`/pm/rfis/${rfiId}`, input)
      return data
    },
    delete: async (rfiId: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ ok: true }>>(`/pm/rfis/${rfiId}`)
      return data
    },
  },

  submittals: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<SubmittalItem>>("/pm/submittals", { params: projectId ? { projectId } : undefined })
      return data
    },
    get: async (submittalId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ submittal: SubmittalItem }>>(`/pm/submittals/${submittalId}`)
      return data
    },
    create: async (input: CreateSubmittalInput) => {
      const { data } = await apiClient.post<ApiResponse<{ submittal: SubmittalItem }>>("/pm/submittals", input)
      return data
    },
    update: async (submittalId: string, input: Partial<CreateSubmittalInput> & { status?: string; reviewComments?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<{ submittal: SubmittalItem }>>(`/pm/submittals/${submittalId}`, input)
      return data
    },
  },

  dailyLogs: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<DailyLogItem>>("/pm/daily-logs", { params: projectId ? { projectId } : undefined })
      return data
    },
    get: async (logId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ log: DailyLogItem }>>(`/pm/daily-logs/${logId}`)
      return data
    },
    create: async (input: CreateDailyLogInput) => {
      const { data } = await apiClient.post<ApiResponse<{ log: DailyLogItem }>>("/pm/daily-logs", input)
      return data
    },
    update: async (logId: string, input: Partial<CreateDailyLogInput>) => {
      const { data } = await apiClient.patch<ApiResponse<{ log: DailyLogItem }>>(`/pm/daily-logs/${logId}`, input)
      return data
    },
    submit: async (logId: string) => {
      const { data } = await apiClient.post<ApiResponse<{ log: DailyLogItem }>>(`/pm/daily-logs/${logId}/submit`)
      return data
    },
  },

  changeOrders: {
    list: async (projectId?: string) => {
      const { data } = await apiClient.get<ApiListResponse<ChangeOrderItem>>("/pm/change-orders", { params: projectId ? { projectId } : undefined })
      return data
    },
    get: async (coId: string) => {
      const { data } = await apiClient.get<ApiResponse<{ changeOrder: ChangeOrderItem }>>(`/pm/change-orders/${coId}`)
      return data
    },
    approve: async (coId: string) => {
      const { data } = await apiClient.post<ApiResponse<{ changeOrder: ChangeOrderItem }>>(`/pm/change-orders/${coId}/approve`)
      return data
    },
    reject: async (coId: string, reason: string) => {
      const { data } = await apiClient.post<ApiResponse<{ changeOrder: ChangeOrderItem }>>(`/pm/change-orders/${coId}/reject`, { reason })
      return data
    },
  },

  dispatch: {
    list: async (query?: { status?: string; date?: string; assignedTo?: string }) => {
      const { data } = await apiClient.get<ApiListResponse<DispatchItem>>("/pm/dispatch", { params: query })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<{ dispatch: DispatchItem }>>(`/pm/dispatch/${id}`)
      return data
    },
    create: async (input: CreateDispatchInput) => {
      const { data } = await apiClient.post<ApiResponse<{ dispatch: DispatchItem }>>("/pm/dispatch", input)
      return data
    },
    update: async (id: string, input: Partial<CreateDispatchInput> & { status?: string }) => {
      const { data } = await apiClient.patch<ApiResponse<{ dispatch: DispatchItem }>>(`/pm/dispatch/${id}`, input)
      return data
    },
  },

  priceBook: {
    list: async (query?: { category?: string; search?: string; active?: boolean }) => {
      const { data } = await apiClient.get<ApiListResponse<PriceBookItemType>>("/pm/price-book", { params: query })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<{ item: PriceBookItemType }>>(`/pm/price-book/${id}`)
      return data
    },
    create: async (input: CreatePriceBookItemInput) => {
      const { data } = await apiClient.post<ApiResponse<{ item: PriceBookItemType }>>("/pm/price-book", input)
      return data
    },
    update: async (id: string, input: Partial<CreatePriceBookItemInput>) => {
      const { data } = await apiClient.patch<ApiResponse<{ item: PriceBookItemType }>>(`/pm/price-book/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<{ ok: true }>>(`/pm/price-book/${id}`)
      return data
    },
  },

  scheduling: {
    list: async (projectId: string) => {
      const { data } = await apiClient.get<ApiListResponse<ScheduleItemType>>(`/pm/projects/${projectId}/schedule`)
      return data
    },
    update: async (projectId: string, items: ScheduleItemType[]) => {
      const { data } = await apiClient.put<ApiResponse<{ items: ScheduleItemType[] }>>(`/pm/projects/${projectId}/schedule`, { items })
      return data
    },
  },

  subcontractors: {
    list: async (query?: { trade?: string; search?: string }) => {
      const { data } = await apiClient.get<ApiListResponse<SubcontractorItem>>("/pm/subcontractors", { params: query })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<{ subcontractor: SubcontractorItem }>>(`/pm/subcontractors/${id}`)
      return data
    },
  },

  crm: {
    leads: async (query?: { status?: string; source?: string }) => {
      const { data } = await apiClient.get<ApiListResponse<CRMLeadItem>>("/pm/crm/leads", { params: query })
      return data
    },
  },

  clientPortal: {
    projects: async () => {
      const { data } = await apiClient.get<ApiListResponse<ClientPortalProject>>("/pm/client-portal/projects")
      return data
    },
  },

  dashboard: {
    kpis: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardReport>>("/pm/dashboard/kpis")
      return data
    },
  },

  // Command Center & AI Agents
  commandCenter: {
    agents: async () => {
      const { data } = await apiClient.get<ApiListResponse<AIAgent>>("/pm/command-center/agents")
      return data
    },
    agentAction: async (agentId: string, action: "pause" | "resume" | "restart") => {
      const { data } = await apiClient.post<ApiResponse<{ agent: AIAgent }>>(`/pm/command-center/agents/${agentId}/${action}`)
      return data
    },
    connections: async () => {
      const { data } = await apiClient.get<ApiListResponse<MiniAppConnection>>("/pm/command-center/connections")
      return data
    },
    automationRules: async () => {
      const { data } = await apiClient.get<ApiListResponse<AutomationRule>>("/pm/command-center/automation-rules")
      return data
    },
    toggleRule: async (ruleId: string, isActive: boolean) => {
      const { data } = await apiClient.patch<ApiResponse<{ rule: AutomationRule }>>(`/pm/command-center/automation-rules/${ruleId}`, { isActive })
      return data
    },
    jobQueue: async (query?: { status?: string }) => {
      const { data } = await apiClient.get<ApiListResponse<JobQueueItem>>("/pm/command-center/jobs", { params: query })
      return data
    },
    systemHealth: async () => {
      const { data } = await apiClient.get<ApiResponse<{ metrics: SystemHealthMetric[] }>>("/pm/command-center/health")
      return data
    },
    chat: async (message: string, context?: { projectId?: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ reply: string; actions?: Array<{ type: string; description: string }> }>>("/pm/command-center/chat", { message, context })
      return data
    },
    runDiagnostics: async () => {
      const { data } = await apiClient.post<ApiResponse<{ report: Record<string, unknown> }>>("/pm/command-center/diagnostics")
      return data
    },
  },

  // Integrations
  integrations: {
    list: async () => {
      const { data } = await apiClient.get<ApiListResponse<IntegrationItem>>("/pm/integrations")
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<ApiResponse<{ integration: IntegrationItem }>>(`/pm/integrations/${id}`)
      return data
    },
    connect: async (id: string, config?: Record<string, unknown>) => {
      const { data } = await apiClient.post<ApiResponse<{ integration: IntegrationItem }>>(`/pm/integrations/${id}/connect`, config)
      return data
    },
    disconnect: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<{ ok: true }>>(`/pm/integrations/${id}/disconnect`)
      return data
    },
    sync: async (id: string) => {
      const { data } = await apiClient.post<ApiResponse<{ syncId: string }>>(`/pm/integrations/${id}/sync`)
      return data
    },
    webhooks: async () => {
      const { data } = await apiClient.get<ApiListResponse<WebhookItem>>("/pm/integrations/webhooks")
      return data
    },
    createWebhook: async (webhook: { url: string; event: string; direction: "incoming" | "outgoing" }) => {
      const { data } = await apiClient.post<ApiResponse<{ webhook: WebhookItem }>>("/pm/integrations/webhooks", webhook)
      return data
    },
    syncLogs: async (query?: { integration?: string; limit?: number }) => {
      const { data } = await apiClient.get<ApiListResponse<SyncLogEntry>>("/pm/integrations/sync-logs", { params: query })
      return data
    },
    apiKeys: async () => {
      const { data } = await apiClient.get<ApiResponse<{ keys: Array<{ id: string; prefix: string; createdAt: string; lastUsedAt: string | null }> }>>("/pm/integrations/api-keys")
      return data
    },
    generateApiKey: async (name: string) => {
      const { data } = await apiClient.post<ApiResponse<{ key: string; id: string }>>("/pm/integrations/api-keys", { name })
      return data
    },
  },
}

