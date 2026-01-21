"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, XCircle, AlertTriangle, Lock, FileCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { api } from "@/lib/api-client"

interface ComplianceCheckpointProps {
  checkpointId: string
  projectId: string
  taskId?: string
  type: "PRE_TASK" | "POST_TASK" | "GATE" | "AUDIT"
}

export function ComplianceCheckpoint({
  checkpointId,
  projectId,
  taskId,
  type,
}: ComplianceCheckpointProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-checkpoint", checkpointId, projectId, taskId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/compliance/checkpoint/${checkpointId}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ projectId, taskId }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to run compliance checks")
      }

      return response.json()
    },
    refetchInterval: 30000,
  })

  async function getAuthToken() {
    const { supabase } = await import("@/lib/supabase")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-neutral-600">Checking compliance...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.result) {
    return null
  }

  const { result } = data

  return (
    <Card className={result.allPassed ? "border-emerald-200" : "border-red-200"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {result.allPassed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Lock className="h-5 w-5 text-red-600" />
            )}
            <CardTitle className="text-base">Compliance Checkpoint: {type}</CardTitle>
          </div>
          {result.allPassed ? (
            <span className="text-sm font-medium text-emerald-600">Passed</span>
          ) : (
            <span className="text-sm font-medium text-red-600">Blocked</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validations */}
        {result.validations && result.validations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Validations</h4>
            <div className="space-y-2">
              {result.validations.map((validation: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 rounded ${
                    validation.passed ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  {validation.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {validation.condition.source}: {validation.condition.condition}
                    </div>
                    <div className="text-xs text-neutral-600">{validation.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module Checks */}
        {result.moduleChecks && Object.keys(result.moduleChecks).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Module Checks</h4>
            <div className="space-y-2">
              {Object.entries(result.moduleChecks).map(([module, check]: [string, any]) => (
                <div
                  key={module}
                  className={`flex items-start gap-2 p-2 rounded ${
                    check.passed ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium capitalize">{module}</div>
                    <div className="text-xs text-neutral-600">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blockers */}
        {result.blockers && result.blockers.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Blockers</h4>
                <ul className="space-y-1">
                  {result.blockers.map((blocker: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-800">
                      • {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">Warnings</h4>
                <ul className="space-y-1">
                  {result.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="text-sm text-amber-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


