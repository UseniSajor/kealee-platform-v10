"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Download,
  Plus,
  Filter,
  AlertCircle,
  Users,
  X,
} from "lucide-react"

import { api } from "@/lib/api"

export default function ApprovalsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [filters, setFilters] = React.useState<{
    approvalStatus?: string
    entityType?: string
  }>({})

  // Create approval request modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [requestTitle, setRequestTitle] = React.useState("")
  const [requestDescription, setRequestDescription] = React.useState("")
  const [entityType, setEntityType] = React.useState("DELIVERABLE")
  const [entityId, setEntityId] = React.useState("")
  const [priority, setPriority] = React.useState("MEDIUM")
  const [deadline, setDeadline] = React.useState("")

  const createApprovalMutation = useMutation({
    mutationFn: () => api.createApprovalRequest(projectId, {
      entityType,
      entityId,
      requestTitle,
      requestDescription: requestDescription || undefined,
      priority,
      deadline: deadline || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-requests", projectId] })
      setShowCreateModal(false)
      setRequestTitle("")
      setRequestDescription("")
      setEntityType("DELIVERABLE")
      setEntityId("")
      setPriority("MEDIUM")
      setDeadline("")
    },
  })

  // Fetch approval requests
  const { data: requestsData } = useQuery({
    queryKey: ["approval-requests", projectId, filters],
    queryFn: () => api.listApprovalRequests(projectId, filters),
  })

  const requests = requestsData?.requests || []

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "DELEGATED":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "EXPIRED":
        return "bg-orange-100 text-orange-700 border-orange-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return "bg-neutral-100 text-neutral-700 border-neutral-300"
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-300"
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "LOW":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const summary = {
    total: requests.length,
    approved: requests.filter((r: any) => r.approvalStatus === "APPROVED").length,
    pending: requests.filter((r: any) => r.approvalStatus === "PENDING" || r.approvalStatus === "IN_PROGRESS").length,
    rejected: requests.filter((r: any) => r.approvalStatus === "REJECTED").length,
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Approval Workflows</h1>
              <p className="text-neutral-600">Multi-tier approval workflows with delegation and certificates</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Approval Request
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
              <div className="text-sm text-neutral-600">Total Requests</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-green-600">{summary.approved}</div>
              <div className="text-sm text-neutral-600">Approved</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
              <div className="text-sm text-neutral-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
              <div className="text-sm text-neutral-600">Rejected</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="font-medium text-neutral-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <select
                  value={filters.approvalStatus || ""}
                  onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DELEGATED">Delegated</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Entity Type</label>
                <select
                  value={filters.entityType || ""}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="SHEET">Sheet</option>
                  <option value="DELIVERABLE">Deliverable</option>
                  <option value="PHASE">Phase</option>
                  <option value="PROJECT">Project</option>
                  <option value="VALIDATION">Validation</option>
                  <option value="REVISION">Revision</option>
                </select>
              </div>
            </div>
          </div>

          {/* Approval Requests List */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Approval Requests ({requests.length})
            </h2>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No approval requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request: any) => (
                  <div
                    key={request.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
                    onClick={() => router.push(`/projects/${projectId}/approvals/${request.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-neutral-900">{request.requestTitle}</h3>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(request.approvalStatus)}`}>
                            {request.approvalStatus}
                          </span>
                          {request.priority && (
                            <span className={`text-xs border rounded-full px-2 py-1 ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          )}
                        </div>
                        {request.requestDescription && (
                          <p className="text-sm text-neutral-600 mb-2">{request.requestDescription}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.requestedBy?.name || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(request.requestedAt)}
                          </span>
                          <span className="capitalize">{request.entityType.toLowerCase()}</span>
                          {request._count && (
                            <span>{request._count.approvalSteps || 0} step{request._count.approvalSteps !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                      {request.deadline && (
                        <div className="text-right">
                          <div className="text-xs text-neutral-500">Deadline</div>
                          <div className={`text-sm font-medium ${
                            new Date(request.deadline) < new Date() ? "text-red-600" : "text-neutral-700"
                          }`}>
                            {formatDate(request.deadline)}
                          </div>
                        </div>
                      )}
                    </div>
                    {request.workflow && (
                      <div className="mt-2 text-xs text-neutral-500">
                        Workflow: {request.workflow.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Approval Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Approval Request</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Request Title *</label>
                <input
                  type="text"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="e.g. Phase 2 Deliverable Approval"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Describe the approval request..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Entity Type *</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="DELIVERABLE">Deliverable</option>
                  <option value="SHEET">Sheet</option>
                  <option value="PHASE">Phase</option>
                  <option value="PROJECT">Project</option>
                  <option value="VALIDATION">Validation</option>
                  <option value="REVISION">Revision</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Entity ID *</label>
                <input
                  type="text"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder="Enter the ID of the entity to approve"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => createApprovalMutation.mutate()}
                  disabled={!requestTitle || !entityId || createApprovalMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createApprovalMutation.isPending ? "Creating..." : "Create Request"}
                </button>
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
              {createApprovalMutation.isError && (
                <p className="text-sm text-red-600">Failed to create approval request. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
