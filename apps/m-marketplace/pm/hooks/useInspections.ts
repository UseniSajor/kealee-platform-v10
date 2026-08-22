"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

export type InspectionStatus = "scheduled" | "passed" | "failed" | "pending-reinspection" | "cancelled"
export type InspectionType = "foundation" | "framing" | "rough-electrical" | "rough-plumbing" | "rough-hvac" | "insulation" | "drywall" | "final"

export interface InspectionItem {
  id: string
  type: InspectionType
  description: string
  date: string
  time: string
  inspector: string
  status: InspectionStatus
  project: string
  location: string
  notes: string
}

export function useInspections(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["inspections", filters ?? {}],
    queryFn: async (): Promise<{ items: InspectionItem[] }> => api.inspections.list(filters),
  })
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ["inspections", id],
    queryFn: () => api.inspections.get(id),
    enabled: Boolean(id),
  })
}

export function useScheduleInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      return api.inspections.create(input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inspections"] })
    },
  })
}

export function useConductInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string
      [key: string]: unknown
    }) => {
      return api.inspections.conduct(id, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inspections"] })
    },
  })
}

export function useAddFinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      inspectionId,
      ...input
    }: {
      inspectionId: string
      [key: string]: unknown
    }) => {
      return api.inspections.addFinding(inspectionId, input)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["inspections"] })
    },
  })
}
