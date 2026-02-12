"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useTimeEntries(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["timeTracking", filters ?? {}],
    queryFn: () => api.timeTracking.list(filters),
  })
}

export function useTimeEntry(id: string) {
  return useQuery({
    queryKey: ["timeTracking", id],
    queryFn: () => api.timeTracking.get(id),
    enabled: Boolean(id),
  })
}

export function useLogTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.timeTracking.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["timeTracking"] })
    },
  })
}

export function useApproveTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.timeTracking.approve(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["timeTracking"] })
    },
  })
}

export function useTimesheet(filters: { userId: string; weekStart: string }) {
  return useQuery({
    queryKey: ["timeTracking", "timesheet", filters],
    queryFn: () => api.timeTracking.timesheet(filters),
  })
}
