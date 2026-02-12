"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useWarranties(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["warranty", filters ?? {}],
    queryFn: () => api.warranty.list(filters),
  })
}

export function useWarranty(id: string) {
  return useQuery({
    queryKey: ["warranty", id],
    queryFn: () => api.warranty.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateWarranty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.warranty.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["warranty"] })
    },
  })
}

export function useFileClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ warrantyId, ...input }: { warrantyId: string; [key: string]: any }) =>
      api.warranty.fileClaim(warrantyId, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["warranty"] })
    },
  })
}

export function useExpiringWarranties(projectId?: string) {
  return useQuery({
    queryKey: ["warranty", "expiring", projectId],
    queryFn: () => api.warranty.expiring(projectId),
  })
}
