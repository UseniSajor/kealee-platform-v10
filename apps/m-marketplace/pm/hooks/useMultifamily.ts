"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@pm/lib/api"

// ---------------------------------------------------------------------------
// Unit Tracker
// ---------------------------------------------------------------------------

export function useUnits(projectId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["multifamily", "units", projectId, filters ?? {}],
    queryFn: () => api.multifamily.units.list(projectId, filters),
    enabled: Boolean(projectId),
  })
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ["multifamily", "units", id],
    queryFn: () => api.multifamily.units.get(id),
    enabled: Boolean(id),
  })
}

export function useUnitStats(projectId: string) {
  return useQuery({
    queryKey: ["multifamily", "units", "stats", projectId],
    queryFn: () => api.multifamily.units.stats(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.multifamily.units.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "units"] }),
  })
}

export function useBulkCreateUnits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { projectId: string; units: any[] }) =>
      api.multifamily.units.bulkCreate(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "units"] }),
  })
}

export function useUpdateUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) =>
      api.multifamily.units.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "units"] }),
  })
}

export function useDeleteUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.multifamily.units.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "units"] }),
  })
}

// ---------------------------------------------------------------------------
// Lender Draws
// ---------------------------------------------------------------------------

export function useDraws(projectId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["multifamily", "draws", projectId, filters ?? {}],
    queryFn: () => api.multifamily.draws.list(projectId, filters),
    enabled: Boolean(projectId),
  })
}

export function useDraw(id: string) {
  return useQuery({
    queryKey: ["multifamily", "draws", id],
    queryFn: () => api.multifamily.draws.get(id),
    enabled: Boolean(id),
  })
}

export function useDrawStats(projectId: string) {
  return useQuery({
    queryKey: ["multifamily", "draws", "stats", projectId],
    queryFn: () => api.multifamily.draws.stats(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreateDraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.multifamily.draws.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "draws"] }),
  })
}

export function useUpdateDraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) =>
      api.multifamily.draws.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "draws"] }),
  })
}

export function useSubmitDraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.multifamily.draws.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "draws"] }),
  })
}

export function useApproveDraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.multifamily.draws.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "draws"] }),
  })
}

// ---------------------------------------------------------------------------
// Area Phasing
// ---------------------------------------------------------------------------

export function usePhases(projectId: string) {
  return useQuery({
    queryKey: ["multifamily", "phases", projectId],
    queryFn: () => api.multifamily.phases.list(projectId),
    enabled: Boolean(projectId),
  })
}

export function usePhase(id: string) {
  return useQuery({
    queryKey: ["multifamily", "phases", id],
    queryFn: () => api.multifamily.phases.get(id),
    enabled: Boolean(id),
  })
}

export function usePhaseTimeline(projectId: string) {
  return useQuery({
    queryKey: ["multifamily", "phases", "timeline", projectId],
    queryFn: () => api.multifamily.phases.timeline(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCreatePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: any) => api.multifamily.phases.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "phases"] }),
  })
}

export function useUpdatePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) =>
      api.multifamily.phases.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "phases"] }),
  })
}

export function useDeletePhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.multifamily.phases.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multifamily", "phases"] }),
  })
}

export function useAssignUnitsToPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ phaseId, unitIds }: { phaseId: string; unitIds: string[] }) =>
      api.multifamily.phases.assignUnits(phaseId, unitIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["multifamily", "phases"] })
      qc.invalidateQueries({ queryKey: ["multifamily", "units"] })
    },
  })
}
