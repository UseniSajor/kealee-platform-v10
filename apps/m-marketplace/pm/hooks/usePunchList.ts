"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function usePunchList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["punchList", filters ?? {}],
    queryFn: () => api.punchList.list(filters),
  })
}

export function usePunchItem(id: string) {
  return useQuery({
    queryKey: ["punchList", id],
    queryFn: () => api.punchList.get(id),
    enabled: Boolean(id),
  })
}

export function usePunchListStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["punchList", "stats", filters ?? {}],
    queryFn: () => api.punchList.stats(filters?.projectId as string | undefined),
  })
}

export function useCreatePunchItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.punchList.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["punchList"] })
    },
  })
}

export function useResolvePunchItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      resolution,
    }: {
      id: string
      resolution: string
    }) => {
      return api.punchList.resolve(id, { resolution })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["punchList"] })
    },
  })
}

export function useVerifyPunchItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.punchList.verify(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["punchList"] })
    },
  })
}
 