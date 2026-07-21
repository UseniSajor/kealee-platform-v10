"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  Calendar,
  User,
  FileText,
} from "lucide-react"

import { api } from "@architect/lib/api"

export default function ReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showCreate, setShowCreate] = React.useState(false)
  const [filters, setFilters] = React.useState<{
    status?: string
  }>({})

  // Fetch review requests
  const { data: reviewsData } = useQuery({
    queryKey: ["review-requests", projectId, filters],
    queryFn: () => api.listReviewRequests(projectId, filters),
  })

  // Fetch overdue and due soon
  const { data: overdueData } = useQuery({
    queryKey: ["review-requests-overdue", projectId],
    queryFn: () => api.getOverdueReviewRequests(projectId),
  })

  const { data: dueSoonData } = useQuery({
    queryKey: ["review-requests-due-soon", projectId],
    queryFn: () => api.getReviewRequestsDueSoon(projectId, 3),
  })

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ["review-summary", projectId],
    queryFn: () => api.getReviewSummary(projectId),
  })

  const reviewRequests = reviewsData?.reviewRequests || []
  const overdue = overdueData?.reviewRequests || []
  const dueSoon = dueSoonData?.reviewRequests || []
  const summary = summaryData?.summary

  const submitMutation = useMutation({
    mutationFn: (reviewRequestId: string) => api.submitReviewRequest(reviewRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests", projectId] })
    },
  })

  const startMutation = useMutation({
    mutationFn: (reviewRequestId: string) => api.startReview(reviewRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests", projectId] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ reviewRequestId, notes }: { reviewRequestId: string; notes?: string }) =>
      api.completeReviewRequest(reviewRequestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests", projectId] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({ reviewRequestId, notes }: { reviewRequestId: string; notes?: string }) =>
      api.approveReviewRequest(reviewRequestId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-requests", projectId] })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300"
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-300"
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "NORMAL":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "LOW":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-blue-100 text-blue-700 border-blue-300"
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const isOverdue = (deadline: string | null | undefined) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
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

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Design Reviews</h1>
              <p className="text-neutral-600">Manage review requests and feedback</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Review Request
            </button>
          </div>

          {/* Summary */}
          {summary && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-neutral-900">{summary.total}</div>
                <div className="text-sm text-neutral-600">Total Reviews</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-yellow-600">{summary.byStatus.IN_REVIEW}</div>
                <div className="text-sm text-neutral-600">In Review</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-green-600">{summary.byStatus.COMPLETED}</div>
                <div className="text-sm text-neutral-600">Completed</div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
                <div className="text-sm text-neutral-600">Overdue</div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {(overdue.length > 0 || dueSoon.length > 0) && (
            <div className="mb-6 space-y-3">
              {overdue.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                    <AlertCircle className="h-5 w-5" />
                    {overdue.length} Overdue Review{overdue.length > 1 ? "s" : ""}
                  </div>
                  <div className="space-y-1">
                    {overdue.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="text-sm text-red-600">
                        • {r.title} (due {formatDate(r.reviewDeadline)})
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
                    {dueSoon.length} Review{dueSoon.length > 1 ? "s" : ""} Due Soon
                  </div>
                  <div className="space-y-1">
                    {dueSoon.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="text-sm text-yellow-600">
                        • {r.title} (due {formatDate(r.reviewDeadline)})
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
                  <option value="PENDING">Pending</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Review Requests List */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Review Requests ({reviewRequests.length})</h2>

            {reviewRequests.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No review requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewRequests.map((review: any) => (
                  <div
                    key={review.id}
                    className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-neutral-900">{review.title}</h3>
                          <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(review.status)}`}>
                            {review.status.replace("_", " ")}
                          </span>
                          {review.priority && (
                            <span className={`text-xs border rounded-full px-2 py-1 ${getPriorityColor(review.priority)}`}>
                              {review.priority}
                            </span>
                          )}
                        </div>
                        {review.description && (
                          <p className="text-sm text-neutral-600 mb-2">{review.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {review.reviewDeadline ? (
                              <>
                                Due: {formatDate(review.reviewDeadline)}
                                {isOverdue(review.reviewDeadline) && (
                                  <span className="text-red-600 font-semibold">(Overdue)</span>
                                )}
                              </>
                            ) : (
                              "No deadline"
                            )}
                          </span>
                          {review.reviewerIds && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {review.reviewerIds.length} reviewer{review.reviewerIds.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {review._count && review._count.comments > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {review._count.comments} comment{review._count.comments !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {review.status === "DRAFT" && (
                          <button
                            onClick={() => submitMutation.mutate(review.id)}
                            disabled={submitMutation.isPending}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Submit
                          </button>
                        )}
                        {review.status === "PENDING" && (
                          <button
                            onClick={() => startMutation.mutate(review.id)}
                            disabled={startMutation.isPending}
                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                          >
                            Start Review
                          </button>
                        )}
                        {review.status === "IN_REVIEW" && (
                          <button
                            onClick={() => {
                              const notes = prompt("Completion notes (optional):")
                              completeMutation.mutate({
                                reviewRequestId: review.id,
                                notes: notes || undefined,
                              })
                            }}
                            disabled={completeMutation.isPending}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        )}
                        {review.status === "COMPLETED" && !review.approvedAt && (
                          <button
                            onClick={() => {
                              const notes = prompt("Approval notes (optional):")
                              approveMutation.mutate({
                                reviewRequestId: review.id,
                                notes: notes || undefined,
                              })
                            }}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/architect/projects/${projectId}/reviews/${review.id}`)}
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

          {/* Create Review Request Modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Create Review Request</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  Review request creation form would be implemented here with title, description, reviewer selection, deliverable/file selection, and deadline setting.
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
                      alert("Create review request form would be implemented here")
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
