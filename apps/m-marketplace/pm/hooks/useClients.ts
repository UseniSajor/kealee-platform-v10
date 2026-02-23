"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
  })
}

export function useClient(clientId: string) {
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => api.clients.get(clientId),
    enabled: Boolean(clientId),
  })
}

export function useRefreshClients() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => true,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

