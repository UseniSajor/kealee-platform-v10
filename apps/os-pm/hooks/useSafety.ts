"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useSafetyIncidents(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["safety", "incidents", filters ?? {}],
    queryFn: () => api.safety.incidents.list(filters),
  })
}

export function useSafetyIncident(id: string) {
  return useQuery({
    queryKey: ["safety", "incidents", id],
    queryFn: () => api.safety.incidents.get(id),
    enabled: Boolean(id),
  })
}

export function useReportIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.safety.incidents.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["safety"] })
    },
  })
}

export function useToolboxTalks(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["safety", "toolboxTalks", filters ?? {}],
    queryFn: () => api.safety.toolboxTalks.list(filters),
  })
}

export function useToolboxTalk(id: string) {
  return useQuery({
    queryKey: ["safety", "toolboxTalks", id],
    queryFn: () => api.safety.toolboxTalks.get(id),
  })
}

export function useCreateToolboxTalk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.safety.toolboxTalks.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["safety"] })
    },
  })
}

export function useSafetyDashboard(projectId?: string) {
  return useQuery({
    queryKey: ["safety", "dashboard", projectId],
    queryFn: () => api.safety.dashboard(projectId),
  })
}
