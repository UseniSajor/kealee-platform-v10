"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Filter,
  Calendar,
} from "lucide-react"

import { api } from "@/lib/api"

export default function DeliverablesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showCreate, setShowCreate] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    status?: string
    deliverableType?: string
    phaseId?: string
  }>({})
  const [selectedDeliverable, setSelectedDeliverable] = React.useState<string | null>(null)

  // Fetch deliverables
  const { data: deliverablesData } = useQuery({
    queryKey: ["deliverables", projectId, filters],
    queryFn: () => api.listDeliverables(projectId, filters),
  })

  // Fetch overdue and due soon
  const { data: overdueData } = useQuery({
    queryKey: ["deliverables-overdue", projectId],
    queryFn: () => api.getOverdueDeliverables(projectId),
  })

  const { data: dueSoonData } = useQuery({
    queryKey: ["deliverables-due-soon", projectId],
    queryFn: () => api.getDeliverablesDueSoon(projectId, 7),
  })

  // Fetch phases for filter
  const { data: projectData } = useQuery({
    queryKey: ["design-project", projectId],
    queryFn: () => api.getDesignProject(projectId),
  })

  const deliverables = deliverablesData?.deliverables || []
  const overdue = overdueData?.deliverables || []
  const dueSoon = dueSoonData?.deliverables || []

  const approveMutation = useMutation({
    mutationFn: ({ deliverableId, approvalNotes }: { deliverableId: string; approvalNotes?: string }) =>
      api.approveDeliverable(deliverableId, approvalNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] })
    },
  })

  const issueMutation = useMutation({
    mutationFn: ({ deliverableId, issuedTo }: { deliverableId: string; issuedTo?: string }) =>
      api.issueDeliverable(deliverableId, issuedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "ISSUED":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "REVISED":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DRAWINGS":
        return "📐"
      case "SPECIFICATIONS":
        return "📋"
      case "REPORTS":
        return "📊"
      case "CALCULATIONS":
        return "🔢"
      case "MODELS":
        return "🎨"
      default:
        return "📄"
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Deliverables</h1>
              <p className="text-neutral-600">Track and manage project deliverables</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Deliverable
            </button>
          </div>

          {/* Alerts */}
          {(overdue.length > 0 || dueSoon.length > 0) && (
            <div className="mb-6 space-y-3">
              {overdue.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                    <AlertCircle className="h-5 w-5" />
                    {overdue.length} Overdue Deliverable{overdue.length > 1 ? "s" : ""}
                  </div>
                  <div className="space-y-1">
                    {overdue.slice(0, 3).map((d: any) => (
                      <div key={d.id} className="text-sm text-red-600">
                        • {d.name} (due {formatDate(d.dueDate)})
                      </div>
                    ))}
                    {overdue.length > 3 && (
                      <div className="text-sm text-red-600">
                        ...and {overdue.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {dueSoon.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 font-semibold mb-2">
                    <Clock className="h-5 w-5" />
                    {dueSoon.length} Deliverable{dueSoon.length > 1 ? "s" : ""} Due Soon
                  </div>
                  <div className="space-y-1">
                    {dueSoon.slice(0, 3).map((d: any) => (
                      <div key={d.id} className="text-sm text-yellow-600">
                        • {d.name} (due {formatDate(d.dueDate)})
                      </div>
                    ))}
                    {dueSoon.length > 3 && (
                      <div className="text-sm text-yellow-600">
                        ...and {dueSoon.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ISSUED">Issued</option>
                  <option value="REVISED">Revised</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                <select
                  value={filters.deliverableType || ""}
                  onChange={(e) => setFilters({ ...filters, deliverableType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="DRAWINGS">Drawings</option>
                  <option value="SPECIFICATIONS">Specifications</option>
                  <option value="REPORTS">Reports</option>
                  <option value="CALCULATIONS">Calculations</option>
                  <option value="MODELS">Models</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Phase</label>
                <select
                  value={filters.phaseId || ""}
                  onChange={(e) => setFilters({ ...filters, phaseId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Phases</option>
                  {projectData?.project?.phases?.map((phase: any) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.phase}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Deliverables List */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">All Deliverables ({deliverables.length})</h2>

            {deliverables.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No deliverables found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliverables.map((deliverable: any) => (
                  <div
                    key={deliverable.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getTypeIcon(deliverable.deliverableType)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900">{deliverable.name}</h3>
                            <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(deliverable.status)}`}>
                              {deliverable.status.replace("_", " ")}
                            </span>
                          </div>
                          {deliverable.description && (
                            <p className="text-sm text-neutral-600 mb-2">{deliverable.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(deliverable.dueDate)}
                              {isOverdue(deliverable.dueDate) && (
                                <span className="text-red-600 font-semibold">(Overdue)</span>
                              )}
                            </span>
                            {deliverable.phase && (
                              <span>Phase: {deliverable.phase.phase}</span>
                            )}
                            {deliverable.dependsOn && (
                              <span className="text-blue-600">Depends on: {deliverable.dependsOn.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {deliverable.status === "IN_REVIEW" && (
                          <button
                            onClick={() => {
                              const notes = prompt("Approval notes (optional):")
                              approveMutation.mutate({
                                deliverableId: deliverable.id,
                                approvalNotes: notes || undefined,
                              })
                            }}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {deliverable.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              const issuedTo = prompt("Issued to (optional):")
                              issueMutation.mutate({
                                deliverableId: deliverable.id,
                                issuedTo: issuedTo || undefined,
                              })
                            }}
                            disabled={issueMutation.isPending}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            Issue
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDeliverable(deliverable.id)}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Deliverable Modal (simplified - would be a proper modal in production) */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Deliverable</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Deliverable creation form would be implemented here with all fields.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("Create deliverable form would be implemented here")
                      setShowCreate(false)
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
