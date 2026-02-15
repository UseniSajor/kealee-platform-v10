"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

// ── Estimates ──

export function useEstimates(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["estimates", filters ?? {}],
    queryFn: () => api.estimates.list(filters),
  })
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ["estimates", id],
    queryFn: () => api.estimates.get(id),
    enabled: Boolean(id),
  })
}

export function useEstimateForProject(projectId: string) {
  return useQuery({
    queryKey: ["estimates", "project", projectId],
    queryFn: () => api.estimates.forProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useEstimateMetrics() {
  return useQuery({
    queryKey: ["estimates", "metrics"],
    queryFn: () => api.estimates.metrics(),
  })
}

export function useCreateEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.estimates.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useUpdateEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; [key: string]: any }) =>
      api.estimates.update(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useDeleteEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.estimates.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useDuplicateEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.estimates.duplicate(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useCalculateEstimate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.estimates.calculate(id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: ["estimates", id] })
    },
  })
}

export function useExportEstimate() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format?: string }) =>
      api.estimates.export(id, format),
  })
}

// ── Line Items ──

export function useEstimateLineItems(estimateId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["estimates", estimateId, "items", filters ?? {}],
    queryFn: () => api.estimates.lineItems(estimateId, filters),
    enabled: Boolean(estimateId),
  })
}

export function useCreateLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ estimateId, ...input }: { estimateId: string; [key: string]: any }) =>
      api.estimates.createLineItem(estimateId, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useBulkCreateLineItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ estimateId, items }: { estimateId: string; items: any[] }) =>
      api.estimates.bulkCreateLineItems(estimateId, items),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

// ── AI Takeoff ──

export function useRunAITakeoff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      files: any[]
      disciplines?: string[]
      detailLevel?: string
      autoLink?: boolean
      projectName?: string
    }) => api.aiTakeoff.run(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["estimates"] })
    },
  })
}

export function useAnalyzePhoto() {
  return useMutation({
    mutationFn: (input: { photoUrl: string; context?: string }) =>
      api.aiTakeoff.analyzePhoto(input),
  })
}

export function useScopeAnalysis() {
  return useMutation({
    mutationFn: (input: any) => api.aiTakeoff.scopeAnalysis(input),
  })
}

export function useCostPrediction() {
  return useMutation({
    mutationFn: (input: any) => api.aiTakeoff.costPrediction(input),
  })
}

export function useSuggestAssemblies() {
  return useMutation({
    mutationFn: (input: any) => api.aiTakeoff.suggestAssemblies(input),
  })
}

export function useValueEngineering() {
  return useMutation({
    mutationFn: (input: any) => api.aiTakeoff.valueEngineering(input),
  })
}

// ── Cost Databases ──

export function useCostDatabases() {
  return useQuery({
    queryKey: ["costDatabases"],
    queryFn: () => api.costDatabases.list(),
  })
}

export function useMaterials(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["costDatabases", "materials", filters ?? {}],
    queryFn: () => api.costDatabases.materials(filters),
  })
}

export function useLaborRates(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["costDatabases", "laborRates", filters ?? {}],
    queryFn: () => api.costDatabases.laborRates(filters),
  })
}

// ── Assemblies ──

export function useAssemblies(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["assemblies", filters ?? {}],
    queryFn: () => api.assemblies.list(filters),
  })
}

export function useAssemblyTemplates() {
  return useQuery({
    queryKey: ["assemblies", "templates"],
    queryFn: () => api.assemblies.templates(),
  })
}

// ── Takeoff Sessions ──

export function useTakeoffs() {
  return useQuery({
    queryKey: ["takeoffs"],
    queryFn: () => api.takeoffs.list(),
  })
}

export function useTakeoff(id: string) {
  return useQuery({
    queryKey: ["takeoffs", id],
    queryFn: () => api.takeoffs.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateTakeoff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.takeoffs.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["takeoffs"] })
    },
  })
}
