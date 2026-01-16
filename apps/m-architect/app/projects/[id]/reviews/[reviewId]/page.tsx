"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  FileText,
  Send,
  Reply,
} from "lucide-react"

import { api } from "@/lib/api"

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const reviewId = params.reviewId as string

  const [newComment, setNewComment] = React.useState("")
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null)

  // Fetch review request
  const { data: reviewData, isLoading } = useQuery({
    queryKey: ["review-request", reviewId],
    queryFn: () => api.getReviewRequest(reviewId),
  })

  const reviewRequest = reviewData?.reviewRequest

  const createCommentMutation = useMutation({
    mutationFn: (data: {
      commentText: string
      parentCommentId?: string
    }) => api.createReviewComment(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-request", reviewId] })
      setNewComment("")
      setReplyingTo(null)
    },
  })

  const updateCommentStatusMutation = useMutation({
    mutationFn: ({ commentId, status, notes }: { commentId: string; status: string; notes?: string }) =>
      api.updateCommentStatus(commentId, { status, addressedNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-request", reviewId] })
    },
  })

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "ADDRESSED":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CLOSED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "RESOLVED":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    createCommentMutation.mutate({
      commentText: newComment,
      parentCommentId: replyingTo || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading review...</div>
      </div>
    )
  }

  if (!reviewRequest) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Review request not found</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/reviews`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    )
  }

  const comments = reviewRequest.comments || []
  const reviewers = reviewRequest.reviewers || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}/reviews`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reviews
          </button>

          {/* Review Request Header */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{reviewRequest.title}</h1>
                {reviewRequest.description && (
                  <p className="text-neutral-600 mb-4">{reviewRequest.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {reviewRequest.reviewDeadline ? (
                      <>Due: {formatDate(reviewRequest.reviewDeadline)}</>
                    ) : (
                      "No deadline"
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {reviewers.length} reviewer{reviewers.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {comments.length} comment{comments.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <span className={`text-xs border rounded-full px-3 py-1 ${getStatusColor(reviewRequest.status)}`}>
                {reviewRequest.status.replace("_", " ")}
              </span>
            </div>

            {/* Reviewers */}
            {reviewers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Reviewers</h3>
                <div className="flex flex-wrap gap-2">
                  {reviewers.map((reviewer: any) => (
                    <span
                      key={reviewer.id}
                      className="text-sm bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-full px-3 py-1"
                    >
                      {reviewer.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p>No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {comments
                  .filter((c: any) => !c.parentCommentId)
                  .map((comment: any) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      allComments={comments}
                      onReply={(id) => setReplyingTo(id)}
                      onUpdateStatus={updateCommentStatusMutation.mutate}
                    />
                  ))}
              </div>
            )}

            {/* New Comment Form */}
            <div className="border-t border-neutral-200 pt-4">
              {replyingTo && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Replying to comment
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-2 text-blue-900 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg resize-none"
                  rows={3}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {createCommentMutation.isPending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  allComments,
  onReply,
  onUpdateStatus,
}: {
  comment: any
  allComments: any[]
  onReply: (id: string) => void
  onUpdateStatus: (data: { commentId: string; status: string; notes?: string }) => void
}) {
  const replies = allComments.filter((c: any) => c.parentCommentId === comment.id)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "ADDRESSED":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "CLOSED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      case "RESOLVED":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-neutral-900">{comment.createdBy?.name}</span>
            <span className="text-xs text-neutral-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
            <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(comment.status)}`}>
              {comment.status}
            </span>
          </div>
          <p className="text-neutral-700 mb-2">{comment.commentText}</p>
        </div>
        <div className="flex gap-2">
          {comment.status === "OPEN" && (
            <>
              <button
                onClick={() => {
                  const notes = prompt("Addressed notes (optional):")
                  onUpdateStatus({
                    commentId: comment.id,
                    status: "ADDRESSED",
                    notes: notes || undefined,
                  })
                }}
                className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Mark Addressed
              </button>
              <button
                onClick={() => {
                  onUpdateStatus({
                    commentId: comment.id,
                    status: "RESOLVED",
                  })
                }}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Resolve
              </button>
            </>
          )}
          <button
            onClick={() => onReply(comment.id)}
            className="px-2 py-1 text-xs border border-neutral-300 rounded hover:bg-neutral-50 flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-6 mt-3 space-y-3 border-l-2 border-neutral-200 pl-4">
          {replies.map((reply: any) => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-neutral-900">{reply.createdBy?.name}</span>
                <span className="text-xs text-neutral-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-neutral-700">{reply.commentText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
