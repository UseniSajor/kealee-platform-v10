"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

/**
 * Hook to check if a task can be completed based on compliance
 */
export function useComplianceCheck(
  taskId: string | undefined,
  type: "PRE_TASK" | "POST_TASK" = "POST_TASK"
) {
  return useQuery({
    queryKey: ["compliance-check", taskId, type],
    queryFn: async () => {
      if (!taskId) return { canComplete: false, checks: null }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/compliance/task/${taskId}/check?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to check compliance")
      }

      return response.json()
    },
    enabled: !!taskId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

async function getAuthToken() {
  const { supabase } = await import("@/lib/supabase")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || ""
}




