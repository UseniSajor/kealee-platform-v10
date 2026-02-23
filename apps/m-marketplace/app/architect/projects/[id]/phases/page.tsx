"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Calendar, CheckCircle2, Clock, AlertTriangle, Play } from "lucide-react"

import { api } from "@architect/lib/api"

export default function PhasesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ["phase-timeline", projectId],
    queryFn: () => api.getPhaseTimeline(projectId),
  })

  const { data: delaysData } = useQuery({
    queryKey: ["phase-delays", projectId],
    queryFn: () => api.checkPhaseDelays(projectId),
    refetchInterval: 60000,
  })

  const timeline = timelineData?.timeline || []
  const delays = delaysData?.delays || []

  const startPhaseMutation = useMutation({
    mutationFn: (phaseId: string) => api.startPhase(phaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-timeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["design-project", projectId] })
    },
  })

  const approvePhaseMutation = useMutation({
    mutationFn: ({ phaseId, notes }: { phaseId: string; notes?: string }) =>
      api.approvePhase(phaseId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-timeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["design-project", projectId] })
    },
  })

  const completePhaseMutation = useMutation({
    mutationFn: ({
      phaseId,
      completionNotes,
      signOffDocumentUrl,
    }: {
      phaseId: string
      completionNotes?: string
      signOffDocumentUrl?: string
    }) => api.completePhase(phaseId, { completionNotes, signOffDocumentUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-timeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["design-project", projectId] })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "NOT_STARTED":
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading phases...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Design Phases Timeline</h1>
            <p className="text-neutral-600">Track phase progress, approvals, and completion</p>
          </div>

          {delays.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">Phase Delays Detected</h3>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {delays.map((delay: any) => (
                      <li key={delay.phaseId}>
                        <strong>{delay.phaseName}</strong>: {delay.delayDays} day(s) past planned end date (
                        {formatDate(delay.plannedEndDate)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Phase Timeline
            </h2>

            <div className="space-y-6">
              {timeline.map((phase: any, index: number) => {
                const isLast = index === timeline.length - 1
                const isDelayed =
                  phase.plannedEndDate &&
                  phase.actualEndDate &&
                  new Date(phase.actualEndDate) > new Date(phase.plannedEndDate)

                return (
                  <div key={phase.id} className="relative">
                    {!isLast && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-neutral-200" />
                    )}

                    <div className="flex gap-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          phase.status === "COMPLETED"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : phase.status === "IN_PROGRESS"
                              ? "bg-blue-50 border-blue-500 text-blue-700"
                              : "bg-neutral-50 border-neutral-300 text-neutral-600"
                        }`}
                      >
                        {phase.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : phase.status === "IN_PROGRESS" ? (
                          <Play className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">{phase.name}</h3>
                            <p className="text-sm text-neutral-600 mt-1">{phase.phase.replace("_", " ")}</p>
                          </div>
                          <span className={`text-xs rounded-full border px-3 py-1 ${getStatusColor(phase.status)}`}>
                            {phase.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-neutral-600 mb-1">Planned Start</p>
                            <p className="font-medium">{formatDate(phase.plannedStartDate)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-600 mb-1">Planned End</p>
                            <p className="font-medium">{formatDate(phase.plannedEndDate)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-600 mb-1">Actual Start</p>
                            <p className="font-medium">{formatDate(phase.actualStartDate)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-600 mb-1">Actual End</p>
                            <p className="font-medium">{formatDate(phase.actualEndDate)}</p>
                          </div>
                        </div>

                        {(phase.estimatedDurationDays || phase.actualDurationDays) && (
                          <div className="mt-3 flex items-center gap-4 text-sm">
                            {phase.estimatedDurationDays && (
                              <span className="text-neutral-600">
                                Estimated: <strong>{phase.estimatedDurationDays} days</strong>
                              </span>
                            )}
                            {phase.actualDurationDays && (
                              <span className={isDelayed ? "text-yellow-700" : "text-neutral-700"}>
                                Actual: <strong>{phase.actualDurationDays} days</strong>
                                {isDelayed && " (Delayed)"}
                              </span>
                            )}
                          </div>
                        )}

                        {phase.delayReason && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Delay:</strong> {phase.delayReason}
                            </p>
                          </div>
                        )}

                        {phase.approvedAt && phase.approvedBy && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>
                              Approved by {phase.approvedBy.name} on {formatDate(phase.approvedAt)}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          {phase.status === "NOT_STARTED" && (
                            <button
                              onClick={() => startPhaseMutation.mutate(phase.id)}
                              disabled={startPhaseMutation.isPending}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                            >
                              Start Phase
                            </button>
                          )}

                          {phase.status === "IN_PROGRESS" && (
                            <>
                              <button
                                onClick={() => {
                                  const notes = prompt("Approval notes (optional):")
                                  if (notes !== null) {
                                    approvePhaseMutation.mutate({ phaseId: phase.id, notes: notes || undefined })
                                  }
                                }}
                                disabled={approvePhaseMutation.isPending || !!phase.approvedAt}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                              >
                                {phase.approvedAt ? "Approved" : "Approve Phase"}
                              </button>
                              <button
                                onClick={() => {
                                  const notes = prompt("Completion notes (optional):")
                                  const url = prompt("Sign-off document URL (optional):")
                                  if (notes !== null || url !== null) {
                                    completePhaseMutation.mutate({
                                      phaseId: phase.id,
                                      completionNotes: notes || undefined,
                                      signOffDocumentUrl: url || undefined,
                                    })
                                  }
                                }}
                                disabled={completePhaseMutation.isPending || !!phase.completedAt}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                              >
                                {phase.completedAt ? "Completed" : "Complete Phase"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
