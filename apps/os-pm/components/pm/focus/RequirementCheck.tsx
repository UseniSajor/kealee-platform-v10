"use client"

import * as React from "react"
import { CheckCircle2, Circle, AlertCircle, FileText, CheckSquare, Link as LinkIcon } from "lucide-react"
import { Button } from "@kealee/ui/button"

interface Requirement {
  id: string
  type: "DOCUMENT" | "APPROVAL" | "CHECK" | "INTEGRATION"
  description: string
  completed: boolean
  blocking: boolean
}

interface RequirementCheckProps {
  requirement: Requirement
  onComplete: (requirementId: string) => void
}

export function RequirementCheck({ requirement, onComplete }: RequirementCheckProps) {
  const getIcon = () => {
    switch (requirement.type) {
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />
      case "APPROVAL":
        return <CheckSquare className="h-4 w-4" />
      case "INTEGRATION":
        return <LinkIcon className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        requirement.completed
          ? "bg-emerald-50 border-emerald-200"
          : requirement.blocking
          ? "bg-red-50 border-red-200"
          : "bg-neutral-50 border-neutral-200"
      }`}
    >
      <div className={`mt-0.5 ${requirement.completed ? "text-emerald-600" : "text-neutral-400"}`}>
        {requirement.completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`${requirement.completed ? "text-emerald-700" : "text-neutral-700"}`}>
            {getIcon()}
          </div>
          <span
            className={`text-sm font-medium ${
              requirement.completed ? "text-emerald-900" : "text-neutral-900"
            }`}
          >
            {requirement.type}
          </span>
          {requirement.blocking && !requirement.completed && (
            <span className="text-xs text-red-600 font-medium">(Required)</span>
          )}
        </div>
        <p
          className={`text-sm ${
            requirement.completed ? "text-emerald-800" : "text-neutral-700"
          }`}
        >
          {requirement.description}
        </p>
      </div>

      {!requirement.completed && (
        <Button
          onClick={() => onComplete(requirement.id)}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          Mark Complete
        </Button>
      )}
    </div>
  )
}

