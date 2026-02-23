"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useBids(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["bids", filters ?? {}],
    queryFn: () => api.bids.list(filters),
  })
}

export function useBid(id: string) {
  return useQuery({
    queryKey: ["bids", id],
    queryFn: () => api.bids.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.bids.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bids"] })
    },
  })
}

export function useAwardBid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bidId, submissionId }: { bidId: string; submissionId: string }) =>
      api.bids.award(bidId, { submissionId }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bids"] })
    },
  })
}

export function useBidComparison(id: string) {
  return useQuery({
    queryKey: ["bids", id, "comparison"],
    queryFn: () => api.bids.comparison(id),
    enabled: Boolean(id),
  })
}
