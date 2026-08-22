"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useBudgetOverview(projectId: string) {
  return useQuery({
    queryKey: ["budget", "overview", projectId],
    queryFn: () => api.budget.overview(projectId),
    enabled: Boolean(projectId),
  })
}

export function useBudgetLines(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["budget", "lines", filters ?? {}],
    queryFn: () => api.budget.listLines(filters),
  })
}

export function useCreateBudgetLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.budget.createLine(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["budget"] })
    },
  })
}

export function useBudgetVariance(projectId: string) {
  return useQuery({
    queryKey: ["budget", "variance", projectId],
    queryFn: () => api.budget.variance(projectId),
    enabled: Boolean(projectId),
  })
}

export function useBudgetAlerts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["budget", "alerts", filters ?? {}],
    queryFn: () => api.budget.alerts(filters),
  })
}
