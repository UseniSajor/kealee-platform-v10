"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@pm/lib/api"

export function useMobilizationChecklists(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["mobilization", filters ?? {}],
    queryFn: () => api.mobilization.list(filters),
  })
}

export function useMobilizationChecklist(id: string) {
  return useQuery({
    queryKey: ["mobilization", id],
    queryFn: () => api.mobilization.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateMobilization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.mobilization.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["mobilization"] })
    },
  })
}

export function useUpdateMobilization(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.mobilization.update(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["mobilization"] })
    },
  })
}

export function useDeleteMobilization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.mobilization.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["mobilization"] })
    },
  })
}

export function useMobilizationTemplates() {
  return useQuery({
    queryKey: ["mobilization", "templates"],
    queryFn: () => api.mobilization.templates(),
  })
}

export function useExportMobilizationPdf() {
  return useMutation({
    mutationFn: (id: string) => api.mobilization.exportPdf(id),
  })
}
