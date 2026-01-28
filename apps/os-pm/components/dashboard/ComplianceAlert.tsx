"use client"

import * as React from "react"

interface ComplianceAlertProps {
  message?: string
  type?: "warning" | "error" | "info"
  taskId?: string
  onResolve?: () => void
}

export function ComplianceAlert({ message, type = "warning", taskId, onResolve }: ComplianceAlertProps) {
  // If no message but taskId provided, show a default compliance message
  const displayMessage = message || (taskId ? `Task ${taskId} requires compliance review` : null)

  if (!displayMessage) return null

  const colors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  }

  return (
    <div className={`rounded-md border p-3 text-sm ${colors[type]}`}>
      <div className="flex items-center justify-between">
        <span>{displayMessage}</span>
        {onResolve && (
          <button
            onClick={onResolve}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export default ComplianceAlert
