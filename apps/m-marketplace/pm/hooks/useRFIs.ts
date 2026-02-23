"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useRFIs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["rfis", filters ?? {}],
    queryFn: () => api.rfis.list(filters),
  })
}

export function useRFI(id: string) {
  return useQuery({
    queryKey: ["rfis", id],
    queryFn: () => api.rfis.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateRFI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.rfis.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rfis"] })
    },
  })
}

export function useUpdateRFI(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.rfis.update(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rfis", id] })
      await qc.invalidateQueries({ queryKey: ["rfis"] })
    },
  })
}

export function useAddRFIResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      rfiId,
      ...input
    }: {
      rfiId: string
      [key: string]: unknown
    }) => {
      return api.rfis.addResponse(rfiId, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rfis"] })
    },
  })
}

export function useRFIStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["rfis", "stats", filters ?? {}],
    queryFn: () => api.rfis.stats(filters?.projectId as string | undefined),
  })
}

export function useCloseRFI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.rfis.close(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rfis"] })
    },
  })
}
 