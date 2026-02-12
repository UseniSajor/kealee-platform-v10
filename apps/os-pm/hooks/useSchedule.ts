"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useScheduleItems(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["schedule", filters ?? {}],
    queryFn: () => api.schedule.list(filters),
  })
}

export function useScheduleItem(id: string) {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: () => api.schedule.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateScheduleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.schedule.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}

export function useUpdateScheduleItem(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.schedule.update(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule", id] })
      await qc.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}

export function useGanttData(projectId: string) {
  return useQuery({
    queryKey: ["schedule", "gantt", projectId],
    queryFn: () => api.schedule.gantt(projectId),
    enabled: Boolean(projectId),
  })
}
 