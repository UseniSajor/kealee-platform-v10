"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useSubmittals(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["submittals", filters ?? {}],
    queryFn: () => api.submittals.list(filters),
  })
}

export function useSubmittal(id: string) {
  return useQuery({
    queryKey: ["submittals", id],
    queryFn: () => api.submittals.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateSubmittal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.submittals.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["submittals"] })
    },
  })
}

export function useSubmitSubmittal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.submittals.submit(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["submittals"] })
    },
  })
}

export function useReviewSubmittal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string
      [key: string]: unknown
    }) => {
      return api.submittals.review(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["submittals"] })
    },
  })
}
 