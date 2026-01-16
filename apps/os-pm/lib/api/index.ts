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
}

