"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Lock, AlertCircle } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { useComplianceCheck } from "@/hooks/useComplianceCheck"
import { api } from "@/lib/api-client"
import { ComplianceCheckpoint } from "./ComplianceCheckpoint"

interface TaskCompletionButtonProps {
  taskId: string
  projectId: string
  onComplete?: () => void
}

export function TaskCompletionButton({
  taskId,
  projectId,
  onComplete,
}: TaskCompletionButtonProps) {
  const [showComplianceDetails, setShowComplianceDetails] = React.useState(false)
  const queryClient = useQueryClient()

  // Check compliance before allowing completion
  const { data: complianceData, isLoading: complianceLoading } = useComplianceCheck(taskId, "POST_TASK")

  const completeMutation = useMutation({
    mutationFn: async () => {
      return api.completeTask?.(taskId, { completedAt: new Date().toISOString() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["compliance-check", taskId] })
      onComplete?.()
    },
  })

  const canComplete = complianceData?.canComplete !== false

  const handleComplete = async () => {
    if (!canComplete) {
      setShowComplianceDetails(true)
      return
    }

    // Run compliance checks one more time before completing
    try {
      const checks = await runComplianceChecks(taskId)
      if (checks.allPassed) {
        completeMutation.mutate()
      } else {
        setShowComplianceDetails(true)
      }
    } catch (error) {
      console.error("Compliance check failed:", error)
      setShowComplianceDetails(true)
    }
  }

  async function runComplianceChecks(taskId: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/compliance/task/${taskId}/check?type=POST_TASK`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to run compliance checks")
    }

    const data = await response.json()
    return data.checks
  }

  async function getAuthToken() {
    const { supabase } = await import("@/lib/supabase")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  if (complianceLoading) {
    return (
      <Button disabled>
        <Lock className="h-4 w-4 mr-2" />
        Checking Compliance...
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleComplete}
        disabled={!canComplete || completeMutation.isPending}
        variant={canComplete ? "default" : "destructive"}
        className="w-full"
      >
        {completeMutation.isPending ? (
          <>
            <Lock className="h-4 w-4 mr-2 animate-pulse" />
            Completing...
          </>
        ) : canComplete ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Task
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Cannot Complete (Compliance Blocked)
          </>
        )}
      </Button>

      {!canComplete && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900 mb-1">
                Task completion blocked by compliance requirements
              </div>
              <button
                onClick={() => setShowComplianceDetails(!showComplianceDetails)}
                className="text-xs text-red-700 underline"
              >
                {showComplianceDetails ? "Hide" : "Show"} compliance details
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplianceDetails && (
        <ComplianceCheckpoint
          checkpointId={`checkpoint-${taskId}-POST_TASK`}
          projectId={projectId}
          taskId={taskId}
          type="POST_TASK"
        />
      )}
    </div>
  )
}


