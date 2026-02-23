"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"
import { apiClient } from "@pm/lib/api/client"

export function usePhotos(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["photos", filters ?? {}],
    queryFn: () => api.photos.list(filters?.projectId),
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, files, meta }: { projectId: string; files: File[]; meta?: { category?: string } }) =>
      api.photos.upload(projectId, files, meta),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["photos"] })
    },
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/pm/photos/${id}`)
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["photos"] })
    },
  })
}

export function usePhotoTimeline(projectId: string) {
  return useQuery({
    queryKey: ["photos", "timeline", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/pm/photos/timeline`, { params: { projectId } })
      return data
    },
  })
}
