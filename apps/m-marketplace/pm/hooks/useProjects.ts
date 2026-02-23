"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"
import { CreateProjectSchema, UpdateProjectSchema } from "@pm/lib/types/index"
import type { CreateProjectInput, UpdateProjectInput } from "@pm/lib/types/index"

export function useProjects(clientId?: string) {
  return useQuery({
    queryKey: ["projects", { clientId: clientId ?? null }],
    queryFn: () => api.projects.list(clientId),
  })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const parsed = CreateProjectSchema.parse(input)
      return api.projects.create(parsed)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["projects"] })
      await qc.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const parsed = UpdateProjectSchema.parse(input)
      return api.projects.update(projectId, parsed)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["projects", projectId] })
      await qc.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => api.projects.delete(projectId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["projects"] })
      await qc.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

export function useProjectBudget(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "budget"],
    queryFn: () => api.projects.budget.get(projectId),
    enabled: Boolean(projectId),
  })
}

export function useProjectTimeline(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId, "timeline"],
    queryFn: () => api.projects.timeline.get(projectId),
    enabled: Boolean(projectId),
  })
}

