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
  AlertCircle,
  Users,
  Shield,
  History,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function ApprovalRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const requestId = params.requestId as string

  const [showRejectModal, setShowRejectModal] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [approvalNotes, setApprovalNotes] = React.useState("")

  // Fetch approval request
  const { data: requestData } = useQuery({
    queryKey: ["approval-request", requestId],
    queryFn: () => api.getApprovalRequest(requestId),
  })

  // Fetch approval history
  const { data: historyData } = useQuery({
    queryKey: ["approval-history", requestId],
    queryFn: () => api.getApprovalHistory(requestId),
  })

  const request = requestData?.approvalRequest
  const history = historyData?.history || []

  const approveStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.approveStep(stepId, {
        approvalNotes: approvalNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-request", requestId] })
      setApprovalNotes("")
    },
  })

  const rejectStepMutation = useMutation({
    mutationFn: (stepId: string) =>
      api.rejectStep(stepId, {
        rejectionReason: rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-request", requestId] })
      setShowRejectModal(false)
      setRejectionReason("")
    },
  })

  const generateCertificateMutation = useMutation({
    mutationFn: () =>
      api.generateApprovalCertificate(requestId, {
        certificateTitle: `Approval Certificate - ${request?.requestTitle}`,
        issuedTo: request?.requestedBy?.name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-request", requestId] })
    },
  })

  if (!request) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading approval request...</div>
      </div>
    )
  }

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
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "DELEGATED":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "SKIPPED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const currentStep = request.approvalSteps?.find(
    (step: any) => step.stepStatus === "PENDING" && step.stepOrder === request.currentStepOrder
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/architect/projects/${projectId}/approvals`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Approvals
          </button>

          {/* Request Header */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{request.requestTitle}</h1>
                {request.requestDescription && (
                  <p className="text-neutral-600 mb-4">{request.requestDescription}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Requested by: {request.requestedBy?.name || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(request.requestedAt)}
                  </span>
                </div>
              </div>
              <span className={`text-xs border rounded-full px-3 py-1 ${getStatusColor(request.approvalStatus)}`}>
                {request.approvalStatus}
              </span>
            </div>

            {request.requestNotes && (
              <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-700">{request.requestNotes}</p>
              </div>
            )}

            {request.approvalStatus === "APPROVED" && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => generateCertificateMutation.mutate()}
                  disabled={generateCertificateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {generateCertificateMutation.isPending ? "Generating..." : "Generate Certificate"}
                </button>
                {request.certificates && request.certificates.length > 0 && (
                  <div className="text-sm text-neutral-600">
                    {request.certificates.length} certificate{request.certificates.length !== 1 ? "s" : ""} generated
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Approval Steps */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Approval Steps
            </h2>
            <div className="space-y-4">
              {request.approvalSteps?.map((step: any, index: number) => (
                <div
                  key={step.id}
                  className={`p-4 border rounded-lg ${
                    step.stepStatus === "PENDING" && step.stepOrder === request.currentStepOrder
                      ? "border-primary bg-primary/5"
                      : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Step {step.stepOrder}: {step.stepName}</span>
                        <span className={`text-xs border rounded-full px-2 py-1 ${getStepStatusColor(step.stepStatus)}`}>
                          {step.stepStatus}
                        </span>
                      </div>
                      {step.stepDescription && (
                        <p className="text-sm text-neutral-600 mb-2">{step.stepDescription}</p>
                      )}
                      <div className="text-xs text-neutral-500">
                        Required Role: {step.requiredRole.replace("_", " ")}
                      </div>
                      {step.approvedBy && (
                        <div className="mt-2 text-sm text-neutral-600">
                          Approved by: {step.approvedBy.name} on {formatDate(step.approvedAt)}
                        </div>
                      )}
                      {step.approvalNotes && (
                        <div className="mt-2 text-sm text-neutral-600 italic">
                          Notes: {step.approvalNotes}
                        </div>
                      )}
                      {step.rejectionReason && (
                        <div className="mt-2 text-sm text-red-600">
                          Rejection Reason: {step.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons for current pending step */}
                  {step.stepStatus === "PENDING" && step.stepOrder === request.currentStepOrder && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1">
                        <textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          placeholder="Approval notes (optional)"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={() => approveStepMutation.mutate(step.id)}
                        disabled={approveStepMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delegations */}
          {request.delegations && request.delegations.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Delegations
              </h2>
              <div className="space-y-3">
                {request.delegations.map((delegation: any) => (
                  <div key={delegation.id} className="p-3 border border-neutral-200 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">{delegation.fromUser?.name}</span> delegated to{" "}
                      <span className="font-medium">{delegation.toUser?.name}</span>
                    </div>
                    {delegation.delegationReason && (
                      <div className="text-xs text-neutral-500 mt-1">{delegation.delegationReason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {history.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Approval History
              </h2>
              <div className="space-y-3">
                {history.map((entry: any) => (
                  <div key={entry.id} className="p-3 border border-neutral-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{entry.actionDescription || entry.actionType}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {entry.performedBy?.name} • {formatDate(entry.performedAt)}
                        </div>
                        {entry.ipAddress && (
                          <div className="text-xs text-neutral-400 mt-1">IP: {entry.ipAddress}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Reject Approval Step</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (currentStep) {
                        rejectStepMutation.mutate(currentStep.id)
                      }
                    }}
                    disabled={!rejectionReason.trim() || rejectStepMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejectStepMutation.isPending ? "Rejecting..." : "Reject"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason("")
                    }}
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
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
