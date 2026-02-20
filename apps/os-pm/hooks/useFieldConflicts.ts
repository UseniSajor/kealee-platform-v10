"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useFieldConflicts(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["fieldConflicts", filters ?? {}],
    queryFn: () => api.fieldConflicts.list(filters),
  })
}

export function useFieldConflict(id: string) {
  return useQuery({
    queryKey: ["fieldConflicts", id],
    queryFn: () => api.fieldConflicts.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateFieldConflict() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.fieldConflicts.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fieldConflicts"] })
    },
  })
}

export function useUpdateFieldConflict(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.fieldConflicts.update(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fieldConflicts"] })
    },
  })
}

export function useCreateRfiFromConflict() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.fieldConflicts.createRfiFromConflict(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fieldConflicts"] })
      await qc.invalidateQueries({ queryKey: ["rfis"] })
    },
  })
}
