"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useSelections(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["selections", filters ?? {}],
    queryFn: () => api.selections.list(filters),
  })
}

export function useSelection(id: string) {
  return useQuery({
    queryKey: ["selections", id],
    queryFn: () => api.selections.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateSelection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.selections.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["selections"] })
    },
  })
}

export function useSelectOption() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ selectionId, optionId }: { selectionId: string; optionId: string }) =>
      api.selections.select(selectionId, optionId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["selections"] })
    },
  })
}

export function useApproveSelection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.selections.approve(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["selections"] })
    },
  })
}
