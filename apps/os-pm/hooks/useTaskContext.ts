"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export interface TaskContext {
  id: string
  title: string
  description?: string
  projectId: string
  projectName: string
  sourceModule: "GC" | "Homeowner" | "Permit" | "Escrow" | "Workflow"
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  estimatedMinutes: number
  status: string
  requirements: Array<{
    id: string
    type: "DOCUMENT" | "APPROVAL" | "CHECK" | "INTEGRATION"
    description: string
    completed: boolean
    blocking: boolean
  }>
  integrationPoints: Array<{
    module: string
    action: string
    url?: string
    params?: Record<string, any>
  }>
  metadata?: Record<string, any>
}

export function useTaskContext(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-context", taskId],
    queryFn: async () => {
      if (!taskId) return null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/tasks/${taskId}/context`,
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch task context")
      }

      return response.json() as Promise<{ context: TaskContext }>
    },
    enabled: !!taskId,
  })
}

async function getAuthToken() {
  const { supabase } = await import("@/lib/supabase")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || ""
}
