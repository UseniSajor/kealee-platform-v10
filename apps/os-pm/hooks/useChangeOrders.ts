"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useChangeOrders(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["changeOrders", filters ?? {}],
    queryFn: () => api.changeOrders.list(filters),
  })
}

export function useChangeOrder(id: string) {
  return useQuery({
    queryKey: ["changeOrders", id],
    queryFn: () => api.changeOrders.get(id),
    enabled: Boolean(id),
  })
}

export function useChangeOrderStats(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["changeOrders", "stats", filters ?? {}],
    queryFn: () => api.changeOrders.stats(filters?.projectId as string | undefined),
  })
}

export function useCreateChangeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.changeOrders.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["changeOrders"] })
    },
  })
}

export function useUpdateChangeOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.changeOrders.update(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["changeOrders", id] })
      await qc.invalidateQueries({ queryKey: ["changeOrders"] })
    },
  })
}

export function useSubmitChangeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.changeOrders.submit(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["changeOrders"] })
    },
  })
}

export function useApproveChangeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      role,
      comments,
    }: {
      id: string
      role: string
      comments?: string
    }) => {
      return api.changeOrders.approve(id, { role, comments })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["changeOrders"] })
    },
  })
}

export function useRejectChangeOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      role,
      reason,
    }: {
      id: string
      role: string
      reason: string
    }) => {
      return api.changeOrders.reject(id, { role, reason })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["changeOrders"] })
    },
  })
}
 