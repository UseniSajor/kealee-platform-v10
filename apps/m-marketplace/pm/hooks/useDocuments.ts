"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"
import { apiClient } from "@pm/lib/api/client"

export function useDocuments(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["documents", filters ?? {}],
    queryFn: () => api.documents.list(filters?.projectId),
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pm/documents/${id}`)
      return data
    },
    enabled: Boolean(id),
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, files, meta }: { projectId: string; files: File[]; meta?: { folder?: string } }) =>
      api.documents.upload(projectId, files, meta),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents"] })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.documents.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents"] })
    },
  })
}
