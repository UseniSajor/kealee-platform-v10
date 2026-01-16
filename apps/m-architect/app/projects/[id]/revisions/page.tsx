"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  FileText,
  Cloud,
  CheckCircle2,
  Send,
  Archive,
  Search,
  Plus,
  AlertTriangle,
  GitBranch,
} from "lucide-react"

import { api } from "@/lib/api"

export default function RevisionsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showCreate, setShowCreate] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    status?: string
    issuanceType?: string
  }>({})

  // Fetch revisions
  const { data: revisionsData } = useQuery({
    queryKey: ["revisions", projectId, filters],
    queryFn: () => api.listRevisions(projectId, filters),
  })

  const revisions = revisionsData?.revisions || []

  const approveMutation = useMutation({
    mutationFn: ({ revisionId, notes }: { revisionId: string; notes?: string }) =>
      api.approveRevision(revisionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions", projectId] })
    },
  })

  const issueMutation = useMutation({
    mutationFn: ({ revisionId, issuedTo }: { revisionId: string; issuedTo?: string }) =>
      api.issueRevision(revisionId, issuedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions", projectId] })
    },
  })

  const analyzeImpactMutation = useMutation({
    mutationFn: (revisionId: string) => api.analyzeRevisionImpact(revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revisions", projectId] })
    },
  })

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "APPROVED":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "ISSUED":
        return "bg-green-100 text-green-700 border-green-300"
      case "SUPERSEDED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getIssuanceTypeColor = (type: string | null | undefined) => {
    if (!type) return "bg-neutral-100 text-neutral-700 border-neutral-300"
    switch (type) {
      case "PRELIMINARY":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "ADDENDUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CHANGE_ORDER":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "FINAL":
        return "bg-green-100 text-green-700 border-green-300"
      case "AS_BUILT":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getImpactLevelColor = (level: string) => {
    switch (level) {
      case "NONE":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "LOW":
        return "bg-green-100 text-green-700 border-green-300"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Revision Management</h1>
              <p className="text-neutral-600">Track revisions, clouds, schedules, and impact analysis</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Revision
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ISSUED">Issued</option>
                  <option value="SUPERSEDED">Superseded</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Issuance Type</label>
                <select
                  value={filters.issuanceType || ""}
                  onChange={(e) => setFilters({ ...filters, issuanceType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="PRELIMINARY">Preliminary</option>
                  <option value="ADDENDUM">Addendum</option>
                  <option value="CHANGE_ORDER">Change Order</option>
                  <option value="FINAL">Final</option>
                  <option value="AS_BUILT">As-Built</option>
                </select>
              </div>
            </div>
          </div>

          {/* Revisions List */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Revisions ({revisions.length})</h2>

            {revisions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No revisions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {revisions.map((revision: any) => (
                  <div
                    key={revision.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold text-neutral-900">Revision {revision.revisionLetter}</span>
                          <span className="text-sm text-neutral-500">#{revision.revisionNumber}</span>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(revision.status)}`}>
                            {revision.status.replace("_", " ")}
                          </span>
                          {revision.issuanceType && (
                            <span className={`text-xs border rounded-full px-2 py-1 ${getIssuanceTypeColor(revision.issuanceType)}`}>
                              {revision.issuanceType.replace("_", " ")}
                            </span>
                          )}
                          {revision.impactLevel && revision.impactLevel !== "NONE" && (
                            <span className={`text-xs border rounded-full px-2 py-1 ${getImpactLevelColor(revision.impactLevel)}`}>
                              {revision.impactLevel} Impact
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-700 mb-2">{revision.description}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span>Date: {formatDate(revision.revisionDate)}</span>
                          {revision._count && (
                            <>
                              <span>{revision._count.sheetRevisions || 0} sheet{revision._count.sheetRevisions !== 1 ? "s" : ""}</span>
                              {revision._count.impacts > 0 && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {revision._count.impacts} impact{revision._count.impacts !== 1 ? "s" : ""}
                                </span>
                              )}
                            </>
                          )}
                          {revision.requiresCoordination && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <GitBranch className="h-3 w-3" />
                              Requires Coordination
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {revision.status === "DRAFT" && (
                          <button
                            onClick={() => {
                              const notes = prompt("Approval notes (optional):")
                              approveMutation.mutate({
                                revisionId: revision.id,
                                notes: notes || undefined,
                              })
                            }}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        )}
                        {revision.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              const issuedTo = prompt("Issued to (optional):")
                              issueMutation.mutate({
                                revisionId: revision.id,
                                issuedTo: issuedTo || undefined,
                              })
                            }}
                            disabled={issueMutation.isPending}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            Issue
                          </button>
                        )}
                        <button
                          onClick={() => analyzeImpactMutation.mutate(revision.id)}
                          disabled={analyzeImpactMutation.isPending}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 flex items-center gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Analyze Impact
                        </button>
                        <button
                          onClick={() => router.push(`/projects/${projectId}/revisions/${revision.id}`)}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Revision Modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Revision</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Revision creation form would be implemented here with revision letter, date, description, type, issuance type, and affected disciplines.
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
                      alert("Create revision form would be implemented here")
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
