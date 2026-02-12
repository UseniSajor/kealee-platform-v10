"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useDrawings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["drawings", filters ?? {}],
    queryFn: () => api.drawings.list(filters),
  })
}

export function useDrawing(id: string) {
  return useQuery({
    queryKey: ["drawings", id],
    queryFn: () => api.drawings.get(id),
    enabled: Boolean(id),
  })
}

export function useUploadDrawing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, files, meta }: { projectId: string; files: File[]; meta?: Record<string, any> }) =>
      api.drawings.upload(projectId, files, meta),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["drawings"] })
    },
  })
}

export function useDrawingSets(projectId: string) {
  return useQuery({
    queryKey: ["drawings", "sets", projectId],
    queryFn: () => api.drawings.sets(projectId),
  })
}
