"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useDailyLogs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["dailyLogs", filters ?? {}],
    queryFn: () => api.dailyLogs.list(filters),
  })
}

export function useDailyLog(id: string) {
  return useQuery({
    queryKey: ["dailyLogs", id],
    queryFn: () => api.dailyLogs.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.dailyLogs.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dailyLogs"] })
    },
  })
}

export function useUpdateDailyLog(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.dailyLogs.update(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dailyLogs", id] })
      await qc.invalidateQueries({ queryKey: ["dailyLogs"] })
    },
  })
}

export function useSignOffDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.dailyLogs.signOff(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["dailyLogs"] })
    },
  })
}
 