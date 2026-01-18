"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@kealee/ui/card"
import { Button } from "@kealee/ui/button"
import { api } from "@/lib/api-client"

interface ComplianceAlertProps {
  taskId: string
  onResolve?: () => void
}

export function ComplianceAlert({ taskId, onResolve }: ComplianceAlertProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["task-compliance", taskId],
    queryFn: () => api.getTaskCompliance?.(taskId),
    enabled: !!taskId,
  })

  if (isLoading || !data?.compliance) {
    return null
  }

  const { compliance } = data

  if (compliance.canComplete) {
    // Show warnings if any
    if (compliance.warnings.length === 0) {
      return null
    }

    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-2">Compliance Warnings</h4>
              <ul className="space-y-1 text-sm text-amber-800">
                {compliance.warnings.map((warning: {type: string, message: string}, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>
                      <strong>{warning.type}:</strong> {warning.message}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-2">
                Task can be completed, but consider addressing these warnings first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show blockers
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-2">Task Completion Blocked</h4>
            <p className="text-sm text-red-800 mb-3">
              This task cannot be completed until the following compliance requirements are met:
            </p>
            <ul className="space-y-2 mb-4">
              {compliance.blockers.map((blocker: {message: string, actionRequired: string}, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">•</span>
                  <div>
                    <div className="font-medium text-red-900">{blocker.message}</div>
                    <div className="text-red-700 mt-1">
                      <strong>Action Required:</strong> {blocker.actionRequired}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to compliance page or show details
                  window.location.href = `/compliance?taskId=${taskId}`
                }}
              >
                View Details
              </Button>
              {onResolve && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResolve}
                  className="text-red-700 hover:text-red-900"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
