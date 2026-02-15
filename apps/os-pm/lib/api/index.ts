"use client"

import { apiClient } from "@/lib/api/client"
import type {
  ApiListResponse,
  ApiResponse,
  Client,
  CreateProjectInput,
  CreateTaskInput,
  DocumentItem,
  DocumentUploadResponse,
  Permit,
  PermitCheckStatusResponse,
  PermitScheduleInspectionInput,
  PhotoItem,
  Project,
  ProjectBudget,
  ProjectTimeline,
  Task,
  UpdateProjectInput,
  UpdateTaskInput,
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

  // ── PM Feature API Methods ──

  changeOrders: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/change-orders", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/change-orders/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/change-orders", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/change-orders/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/change-orders/${id}`)
      return data
    },
    submit: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/change-orders/${id}/submit`)
      return data
    },
    approve: async (id: string, input: { role: string; comments?: string }) => {
      const { data } = await apiClient.post<any>(`/pm/change-orders/${id}/approve`, input)
      return data
    },
    reject: async (id: string, input: { role: string; reason: string }) => {
      const { data } = await apiClient.post<any>(`/pm/change-orders/${id}/reject`, input)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/change-orders/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  dailyLogs: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/daily-logs", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/daily-logs/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/daily-logs", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/daily-logs/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/daily-logs/${id}`)
      return data
    },
    signOff: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/daily-logs/${id}/sign-off`)
      return data
    },
    summary: async (filters: { projectId: string; startDate: string; endDate: string }) => {
      const { data } = await apiClient.get<any>("/pm/daily-logs/summary", { params: filters })
      return data
    },
  },

  punchList: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/punch-list", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/punch-list/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/punch-list", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/punch-list/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/punch-list/${id}`)
      return data
    },
    resolve: async (id: string, input: { resolution: string }) => {
      const { data } = await apiClient.post<any>(`/pm/punch-list/${id}/resolve`, input)
      return data
    },
    verify: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/punch-list/${id}/verify`)
      return data
    },
    reopen: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/punch-list/${id}/reopen`)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/punch-list/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  inspections: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/inspections", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/inspections/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/inspections", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/inspections/${id}`, input)
      return data
    },
    conduct: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/inspections/${id}/conduct`, input)
      return data
    },
    addFinding: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/inspections/${id}/findings`, input)
      return data
    },
    updateFinding: async (id: string, findingId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/inspections/${id}/findings/${findingId}`, input)
      return data
    },
    resolveFinding: async (id: string, findingId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/inspections/${id}/findings/${findingId}/resolve`, input)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/inspections/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  schedule: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/schedule", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/schedule/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/schedule", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/schedule/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/schedule/${id}`)
      return data
    },
    updateProgress: async (id: string, progress: number) => {
      const { data } = await apiClient.patch<any>(`/pm/schedule/${id}/progress`, { progress })
      return data
    },
    bulkUpdate: async (items: any[]) => {
      const { data } = await apiClient.post<any>("/pm/schedule/bulk-update", { items })
      return data
    },
    gantt: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/schedule/gantt", { params: { projectId } })
      return data
    },
    criticalPath: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/schedule/critical-path", { params: { projectId } })
      return data
    },
    milestones: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/schedule/milestones", { params: { projectId } })
      return data
    },
  },

  budget: {
    overview: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/budget", { params: { projectId } })
      return data
    },
    listLines: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/budget/lines", { params: filters })
      return data
    },
    createLine: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/budget/lines", input)
      return data
    },
    updateLine: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/budget/lines/${id}`, input)
      return data
    },
    deleteLine: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/budget/lines/${id}`)
      return data
    },
    listEntries: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/budget/entries", { params: filters })
      return data
    },
    createEntry: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/budget/entries", input)
      return data
    },
    updateEntry: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/budget/entries/${id}`, input)
      return data
    },
    snapshots: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/budget/snapshots", { params: filters })
      return data
    },
    takeSnapshot: async (projectId: string) => {
      const { data } = await apiClient.post<any>("/pm/budget/snapshots", { projectId })
      return data
    },
    alerts: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/budget/alerts", { params: filters })
      return data
    },
    acknowledgeAlert: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/budget/alerts/${id}/acknowledge`)
      return data
    },
    variance: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/budget/variance", { params: { projectId } })
      return data
    },
    forecast: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/budget/forecast", { params: { projectId } })
      return data
    },
    importEstimate: async (input: { projectId: string; estimateId: string }) => {
      const { data } = await apiClient.post<any>("/pm/budget/import-estimate", input)
      return data
    },
  },

  rfis: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/rfis", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/rfis/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/rfis", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/rfis/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/rfis/${id}`)
      return data
    },
    addResponse: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/rfis/${id}/responses`, input)
      return data
    },
    editResponse: async (id: string, responseId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/rfis/${id}/responses/${responseId}`, input)
      return data
    },
    close: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/rfis/${id}/close`)
      return data
    },
    reopen: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/rfis/${id}/reopen`)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/rfis/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  submittals: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/submittals", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/submittals/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/submittals", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/submittals/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/submittals/${id}`)
      return data
    },
    submit: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/submittals/${id}/submit`)
      return data
    },
    review: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/submittals/${id}/review`, input)
      return data
    },
    resubmit: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/submittals/${id}/resubmit`)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/submittals/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
    log: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/submittals/log", { params: { projectId } })
      return data
    },
  },

  meetings: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/meetings", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/meetings/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/meetings", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/meetings/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/meetings/${id}`)
      return data
    },
    addAttendees: async (id: string, attendees: any[]) => {
      const { data } = await apiClient.post<any>(`/pm/meetings/${id}/attendees`, { attendees })
      return data
    },
    updateAttendee: async (id: string, attendeeId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/meetings/${id}/attendees/${attendeeId}`, input)
      return data
    },
    saveMinutes: async (id: string, minutes: string) => {
      const { data } = await apiClient.post<any>(`/pm/meetings/${id}/minutes`, { minutes })
      return data
    },
    addActionItem: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/meetings/${id}/action-items`, input)
      return data
    },
    updateActionItem: async (id: string, itemId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/meetings/${id}/action-items/${itemId}`, input)
      return data
    },
    complete: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/meetings/${id}/complete`)
      return data
    },
    openActionItems: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/meetings/action-items", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  safety: {
    incidents: {
      list: async (filters?: Record<string, any>) => {
        const { data } = await apiClient.get<any>("/pm/safety/incidents", { params: filters })
        return data
      },
      get: async (id: string) => {
        const { data } = await apiClient.get<any>(`/pm/safety/incidents/${id}`)
        return data
      },
      create: async (input: any) => {
        const { data } = await apiClient.post<any>("/pm/safety/incidents", input)
        return data
      },
      update: async (id: string, input: any) => {
        const { data } = await apiClient.patch<any>(`/pm/safety/incidents/${id}`, input)
        return data
      },
      investigate: async (id: string, input: any) => {
        const { data } = await apiClient.post<any>(`/pm/safety/incidents/${id}/investigate`, input)
        return data
      },
      correctiveAction: async (id: string, input: any) => {
        const { data } = await apiClient.post<any>(`/pm/safety/incidents/${id}/corrective-action`, input)
        return data
      },
      close: async (id: string) => {
        const { data } = await apiClient.post<any>(`/pm/safety/incidents/${id}/close`)
        return data
      },
      stats: async (projectId?: string) => {
        const { data } = await apiClient.get<any>("/pm/safety/incidents/stats", { params: projectId ? { projectId } : undefined })
        return data
      },
    },
    toolboxTalks: {
      list: async (filters?: Record<string, any>) => {
        const { data } = await apiClient.get<any>("/pm/safety/toolbox-talks", { params: filters })
        return data
      },
      get: async (id: string) => {
        const { data } = await apiClient.get<any>(`/pm/safety/toolbox-talks/${id}`)
        return data
      },
      create: async (input: any) => {
        const { data } = await apiClient.post<any>("/pm/safety/toolbox-talks", input)
        return data
      },
      update: async (id: string, input: any) => {
        const { data } = await apiClient.patch<any>(`/pm/safety/toolbox-talks/${id}`, input)
        return data
      },
      recordAttendance: async (id: string, attendees: any[]) => {
        const { data } = await apiClient.post<any>(`/pm/safety/toolbox-talks/${id}/attendance`, { attendees })
        return data
      },
    },
    dashboard: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/safety/dashboard", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  drawings: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/drawings", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/drawings/${id}`)
      return data
    },
    upload: async (projectId: string, files: File[], meta?: Record<string, any>) => {
      const form = new FormData()
      for (const f of files) form.append("files", f)
      if (meta) Object.entries(meta).forEach(([k, v]) => form.append(k, String(v)))
      form.append("projectId", projectId)
      const { data } = await apiClient.post<any>("/pm/drawings", form, { headers: { "Content-Type": "multipart/form-data" } })
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/drawings/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/drawings/${id}`)
      return data
    },
    addRevision: async (id: string, files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append("files", f)
      const { data } = await apiClient.post<any>(`/pm/drawings/${id}/revisions`, form, { headers: { "Content-Type": "multipart/form-data" } })
      return data
    },
    revisions: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/drawings/${id}/revisions`)
      return data
    },
    sets: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/drawings/sets", { params: { projectId } })
      return data
    },
    current: async (projectId: string) => {
      const { data } = await apiClient.get<any>("/pm/drawings/current", { params: { projectId } })
      return data
    },
  },

  selections: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/selections", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/selections/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/selections", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/selections/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/selections/${id}`)
      return data
    },
    addOption: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/selections/${id}/options`, input)
      return data
    },
    updateOption: async (id: string, optionId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/selections/${id}/options/${optionId}`, input)
      return data
    },
    removeOption: async (id: string, optionId: string) => {
      const { data } = await apiClient.delete<any>(`/pm/selections/${id}/options/${optionId}`)
      return data
    },
    select: async (id: string, optionId: string) => {
      const { data } = await apiClient.post<any>(`/pm/selections/${id}/select`, { optionId })
      return data
    },
    approve: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/selections/${id}/approve`)
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/selections/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  warranty: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/warranty", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/warranty/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/warranty", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/warranty/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/warranty/${id}`)
      return data
    },
    fileClaim: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/warranty/${id}/claims`, input)
      return data
    },
    updateClaim: async (id: string, claimId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/warranty/${id}/claims/${claimId}`, input)
      return data
    },
    resolveClaim: async (id: string, claimId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/warranty/${id}/claims/${claimId}/resolve`, input)
      return data
    },
    expiring: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/warranty/expiring", { params: projectId ? { projectId } : undefined })
      return data
    },
    stats: async (projectId?: string) => {
      const { data } = await apiClient.get<any>("/pm/warranty/stats", { params: projectId ? { projectId } : undefined })
      return data
    },
  },

  timeTracking: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/time-tracking", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/time-tracking/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/time-tracking", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/time-tracking/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/time-tracking/${id}`)
      return data
    },
    bulkCreate: async (entries: any[]) => {
      const { data } = await apiClient.post<any>("/pm/time-tracking/bulk", { entries })
      return data
    },
    approve: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/time-tracking/${id}/approve`)
      return data
    },
    bulkApprove: async (ids: string[]) => {
      const { data } = await apiClient.post<any>("/pm/time-tracking/bulk-approve", { ids })
      return data
    },
    summary: async (filters: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/time-tracking/summary", { params: filters })
      return data
    },
    timesheet: async (filters: { userId: string; weekStart: string }) => {
      const { data } = await apiClient.get<any>("/pm/time-tracking/timesheet", { params: filters })
      return data
    },
  },

  bids: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/bids", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/bids/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/bids", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/bids/${id}`, input)
      return data
    },
    invite: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/pm/bids/${id}/invite`, input)
      return data
    },
    close: async (id: string) => {
      const { data } = await apiClient.post<any>(`/pm/bids/${id}/close`)
      return data
    },
    comparison: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/bids/${id}/comparison`)
      return data
    },
    award: async (id: string, input: { submissionId: string }) => {
      const { data } = await apiClient.post<any>(`/pm/bids/${id}/award`, input)
      return data
    },
  },

  team: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/team", { params: filters })
      return data
    },
    add: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/team", input)
      return data
    },
    updateRole: async (memberId: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/team/${memberId}`, input)
      return data
    },
    remove: async (memberId: string) => {
      const { data } = await apiClient.delete<any>(`/pm/team/${memberId}`)
      return data
    },
    directory: async () => {
      const { data } = await apiClient.get<any>("/pm/team/directory")
      return data
    },
    workload: async () => {
      const { data } = await apiClient.get<any>("/pm/team/workload")
      return data
    },
  },

  pmProjects: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/pm/projects", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/projects/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/projects", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.patch<any>(`/pm/projects/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/pm/projects/${id}`)
      return data
    },
    overview: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/projects/${id}/overview`)
      return data
    },
    activity: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/projects/${id}/activity`)
      return data
    },
    statusReport: async (id: string) => {
      const { data } = await apiClient.get<any>(`/pm/projects/${id}/reports/status`)
      return data
    },
  },

  // ── Estimation ──
  estimates: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/estimation/project", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/estimation/estimate/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/estimate", input)
      return data
    },
    update: async (id: string, input: any) => {
      const { data } = await apiClient.put<any>(`/estimation/estimate/${id}`, input)
      return data
    },
    delete: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/estimation/estimate/${id}`)
      return data
    },
    duplicate: async (id: string) => {
      const { data } = await apiClient.post<any>(`/estimation/estimate/${id}/duplicate`)
      return data
    },
    summary: async (id: string) => {
      const { data } = await apiClient.get<any>(`/estimation/estimate/${id}/summary`)
      return data
    },
    calculate: async (id: string) => {
      const { data } = await apiClient.post<any>(`/estimation/estimate/${id}/calculate`)
      return data
    },
    export: async (id: string, format?: string) => {
      const { data } = await apiClient.post<any>(`/estimation/estimate/${id}/export`, { format: format || "pdf" })
      return data
    },
    // Sections
    sections: async (estimateId: string) => {
      const { data } = await apiClient.get<any>(`/estimation/estimates/${estimateId}/sections`)
      return data
    },
    createSection: async (estimateId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/sections`, input)
      return data
    },
    createCsiSections: async (estimateId: string) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/sections/csi`)
      return data
    },
    // Line items
    lineItems: async (estimateId: string, filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>(`/estimation/estimates/${estimateId}/items`, { params: filters })
      return data
    },
    createLineItem: async (estimateId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/items`, input)
      return data
    },
    bulkCreateLineItems: async (estimateId: string, items: any[]) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/items/bulk`, { items })
      return data
    },
    addFromAssembly: async (estimateId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/items/from-assembly`, input)
      return data
    },
    // Revisions
    revisions: async (estimateId: string) => {
      const { data } = await apiClient.get<any>(`/estimation/estimates/${estimateId}/revisions`)
      return data
    },
    createRevision: async (estimateId: string, input: any) => {
      const { data } = await apiClient.post<any>(`/estimation/estimates/${estimateId}/revisions`, input)
      return data
    },
    metrics: async () => {
      const { data } = await apiClient.get<any>("/estimation/metrics")
      return data
    },
    forProject: async (projectId: string) => {
      const { data } = await apiClient.get<any>(`/estimation/project/${projectId}`)
      return data
    },
  },

  // ── AI & Takeoff ──
  aiTakeoff: {
    run: async (input: { files: any[]; disciplines?: string[]; detailLevel?: string; autoLink?: boolean; projectName?: string }) => {
      const { data } = await apiClient.post<any>("/estimation/ai/takeoff", input)
      return data
    },
    analyzePhoto: async (input: { photoUrl: string; context?: string }) => {
      const { data } = await apiClient.post<any>("/estimation/ai/analyze-photo", input)
      return data
    },
    scopeAnalysis: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/ai/scope-analysis", input)
      return data
    },
    costPrediction: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/ai/cost-prediction", input)
      return data
    },
    suggestAssemblies: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/ai/suggest-assemblies", input)
      return data
    },
    valueEngineering: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/ai/value-engineering", input)
      return data
    },
    benchmark: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/ai/benchmark", input)
      return data
    },
  },

  // ── Cost Databases ──
  costDatabases: {
    list: async () => {
      const { data } = await apiClient.get<any>("/estimation/databases")
      return data
    },
    materials: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/estimation/data/materials", { params: filters })
      return data
    },
    laborRates: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/estimation/data/labor-rates", { params: filters })
      return data
    },
    equipmentRates: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/estimation/data/equipment-rates", { params: filters })
      return data
    },
    regionalIndices: async () => {
      const { data } = await apiClient.get<any>("/estimation/regional-indices")
      return data
    },
  },

  // ── Assemblies ──
  assemblies: {
    list: async (filters?: Record<string, any>) => {
      const { data } = await apiClient.get<any>("/estimation/assemblies", { params: filters })
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/estimation/assemblies/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/assemblies", input)
      return data
    },
    templates: async () => {
      const { data } = await apiClient.get<any>("/estimation/assembly-library/templates")
      return data
    },
  },

  // ── Takeoff Sessions ──
  takeoffs: {
    list: async () => {
      const { data } = await apiClient.get<any>("/estimation/takeoffs")
      return data
    },
    get: async (id: string) => {
      const { data } = await apiClient.get<any>(`/estimation/takeoffs/${id}`)
      return data
    },
    create: async (input: any) => {
      const { data } = await apiClient.post<any>("/estimation/takeoffs", input)
      return data
    },
    addMeasurement: async (id: string, input: any) => {
      const { data } = await apiClient.post<any>(`/estimation/takeoffs/${id}/measurements`, input)
      return data
    },
    summary: async (id: string) => {
      const { data } = await apiClient.get<any>(`/estimation/takeoffs/${id}/summary`)
      return data
    },
  },

  reports: {
    project: async (projectId: string) => {
      const { data } = await apiClient.get<any>(`/pm/reports/project/${projectId}`)
      return data
    },
    schedule: async (projectId: string) => {
      const { data } = await apiClient.get<any>(`/pm/reports/schedule/${projectId}`)
      return data
    },
    budget: async (projectId: string) => {
      const { data } = await apiClient.get<any>(`/pm/reports/budget/${projectId}`)
      return data
    },
    safety: async (projectId: string) => {
      const { data } = await apiClient.get<any>(`/pm/reports/safety/${projectId}`)
      return data
    },
    generate: async (input: any) => {
      const { data } = await apiClient.post<any>("/pm/reports/generate", input)
      return data
    },
  },
}

