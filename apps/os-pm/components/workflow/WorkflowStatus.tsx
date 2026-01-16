"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, XCircle, AlertCircle, Clock, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { api } from "@/lib/api-client"

interface WorkflowStatusProps {
  projectId: string
  phase: "INITIATION" | "PLANNING" | "EXECUTION" | "MONITORING" | "CLOSEOUT"
}

export function WorkflowStatus({ projectId, phase }: WorkflowStatusProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["workflow-status", projectId, phase],
    queryFn: () => api.getWorkflowStatus?.(projectId, phase),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-neutral-600">Loading workflow status...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.status) {
    return null
  }

  const { status } = data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Workflow Status: {phase}</CardTitle>
          {status.canProceed ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Can Proceed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">Blocked</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mandatory Checks */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Mandatory Checks</h4>
          <div className="space-y-2">
            {status.checks.map((check, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded ${
                  check.passed ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {check.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{check.check}</div>
                  <div className="text-xs text-neutral-600">{check.message}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    Module: {check.module}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gates */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Phase Gates</h4>
          <div className="space-y-2">
            {status.gates.map((gateResult, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded ${
                  gateResult.passed ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                {gateResult.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Lock className="h-4 w-4 text-red-600" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{gateResult.gate.id}</div>
                  <div className="text-xs text-neutral-600">
                    {gateResult.gate.description || gateResult.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        {status.blockers.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Blockers</h4>
                <ul className="space-y-1">
                  {status.blockers.map((blocker, idx) => (
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
        {status.warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">Warnings</h4>
                <ul className="space-y-1">
                  {status.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-800">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-neutral-500 pt-2 border-t">
          Last updated: {new Date(status.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
