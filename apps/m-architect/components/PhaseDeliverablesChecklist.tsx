"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Circle, Clock } from "lucide-react"

import { api } from "@/lib/api"

interface Deliverable {
  id: string
  name: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  completedAt?: string
}

interface PhaseDeliverablesChecklistProps {
  phaseId: string
  deliverables: Deliverable[]
  projectId: string
}

export function PhaseDeliverablesChecklist({
  phaseId,
  deliverables: initialDeliverables,
  projectId,
}: PhaseDeliverablesChecklistProps) {
  const queryClient = useQueryClient()
  const [deliverables, setDeliverables] = React.useState<Deliverable[]>(initialDeliverables || [])

  const updateMutation = useMutation({
    mutationFn: (updated: Deliverable[]) => api.updatePhaseDeliverables(phaseId, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-timeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["design-project", projectId] })
    },
  })

  const handleStatusChange = (deliverableId: string, newStatus: Deliverable["status"]) => {
    const updated = deliverables.map((d) => {
      if (d.id === deliverableId) {
        return {
          ...d,
          status: newStatus,
          completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : undefined,
        }
      }
      return d
    })
    setDeliverables(updated)
    updateMutation.mutate(updated)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Circle className="h-5 w-5 text-neutral-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-neutral-700 mb-3">Deliverables Checklist</h4>
      {deliverables.length === 0 ? (
        <p className="text-sm text-neutral-500">No deliverables defined for this phase</p>
      ) : (
        <div className="space-y-2">
          {deliverables.map((deliverable) => (
            <div
              key={deliverable.id}
              className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
            >
              <button
                onClick={() => {
                  const nextStatus: Deliverable["status"] =
                    deliverable.status === "PENDING"
                      ? "IN_PROGRESS"
                      : deliverable.status === "IN_PROGRESS"
                        ? "COMPLETED"
                        : "PENDING"
                  handleStatusChange(deliverable.id, nextStatus)
                }}
                className="flex-shrink-0"
              >
                {getStatusIcon(deliverable.status)}
              </button>
              <div className="flex-1">
                <p className="font-medium text-neutral-900">{deliverable.name}</p>
                {deliverable.completedAt && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Completed: {new Date(deliverable.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span
                className={`text-xs rounded-full border px-2 py-1 ${getStatusColor(deliverable.status)}`}
              >
                {deliverable.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
