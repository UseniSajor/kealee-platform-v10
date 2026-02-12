"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"

export function useMeetings(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["meetings", filters ?? {}],
    queryFn: () => api.meetings.list(filters),
  })
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meetings", id],
    queryFn: () => api.meetings.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.meetings.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["meetings"] })
    },
  })
}

export function useUpdateMeeting(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.meetings.update(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["meetings", id] })
      await qc.invalidateQueries({ queryKey: ["meetings"] })
    },
  })
}

export function useAddActionItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      meetingId,
      ...input
    }: {
      meetingId: string
      [key: string]: unknown
    }) => {
      return api.meetings.addActionItem(meetingId, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["meetings"] })
    },
  })
}

export function useCompleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.meetings.complete(id)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["meetings"] })
    },
  })
}
 