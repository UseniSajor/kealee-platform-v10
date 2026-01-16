"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/types/index"
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/types/index"

export function useTasks(query?: { status?: string; priority?: string; assignedTo?: string; projectId?: string }) {
  return useQuery({
    queryKey: ["tasks", query ?? {}],
    queryFn: () => api.tasks.list(query),
  })
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => api.tasks.get(taskId),
    enabled: Boolean(taskId),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const parsed = CreateTaskSchema.parse(input)
      return api.tasks.create(parsed)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useUpdateTask(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const parsed = UpdateTaskSchema.parse(input)
      return api.tasks.update(taskId, parsed)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks", taskId] })
      await qc.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => api.tasks.delete(taskId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] })
    },
  })
}

