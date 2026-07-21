"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
  Lightbulb,
  Calendar,
  Plus,
} from "lucide-react"

import { api } from "@/lib/api"

export default function CollaborationPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  // Inline form toggles
  const [showActionItemForm, setShowActionItemForm] = React.useState(false)
  const [showDecisionForm, setShowDecisionForm] = React.useState(false)
  const [showMeetingForm, setShowMeetingForm] = React.useState(false)

  // Inline form field state
  const [actionItemTitle, setActionItemTitle] = React.useState("")
  const [actionItemDesc, setActionItemDesc] = React.useState("")
  const [decisionTitle, setDecisionTitle] = React.useState("")
  const [decisionText, setDecisionText] = React.useState("")
  const [meetingTitle, setMeetingTitle] = React.useState("")
  const [meetingDate, setMeetingDate] = React.useState("")

  // Fetch action items
  const { data: actionItemsData } = useQuery({
    queryKey: ["action-items", projectId],
    queryFn: () => api.listActionItems(projectId, { status: "OPEN" }),
  })

  // Fetch design decisions
  const { data: decisionsData } = useQuery({
    queryKey: ["design-decisions", projectId],
    queryFn: () => api.listDesignDecisions(projectId),
  })

  // Fetch meeting minutes
  const { data: meetingsData } = useQuery({
    queryKey: ["meeting-minutes", projectId],
    queryFn: () => api.listMeetingMinutes(projectId),
  })

  const actionItems = actionItemsData?.actionItems || []
  const decisions = decisionsData?.decisions || []
  const meetings = meetingsData?.meetings || []

  // Mutations
  const createActionItemMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      api.createActionItem(projectId, {
        sourceType: "COLLABORATION",
        title: data.title,
        description: data.description,
        assignedById: "", // server will use current user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items", projectId] })
      setShowActionItemForm(false)
      setActionItemTitle("")
      setActionItemDesc("")
    },
  })

  const createDecisionMutation = useMutation({
    mutationFn: (data: { title: string; decisionText: string }) =>
      api.createDesignDecision(projectId, {
        title: data.title,
        decisionText: data.decisionText,
        proposedById: "", // server will use current user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-decisions", projectId] })
      setShowDecisionForm(false)
      setDecisionTitle("")
      setDecisionText("")
    },
  })

  const createMeetingMutation = useMutation({
    mutationFn: (data: { title: string; meetingDate: string }) =>
      api.createMeetingMinute(projectId, {
        title: data.title,
        meetingDate: data.meetingDate,
        attendeeIds: [], // can be populated later
        organizerId: "", // server will use current user
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", projectId] })
      setShowMeetingForm(false)
      setMeetingTitle("")
      setMeetingDate("")
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
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300"
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  const getDecisionStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
      case "PROPOSED":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-300"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-300"
      case "IMPLEMENTED":
        return "bg-purple-100 text-purple-700 border-purple-300"
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Collaboration Hub</h1>
              <p className="text-neutral-600">Real-time collaboration, meetings, decisions, and action items</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{actionItems.filter((a: any) => a.status === "OPEN").length}</div>
              <div className="text-sm text-neutral-600">Open Action Items</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{decisions.length}</div>
              <div className="text-sm text-neutral-600">Design Decisions</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{meetings.length}</div>
              <div className="text-sm text-neutral-600">Meetings</div>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <div className="text-2xl font-bold text-neutral-900">{decisions.filter((d: any) => d.status === "APPROVED").length}</div>
              <div className="text-sm text-neutral-600">Approved Decisions</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Action Items
                </h2>
                <button
                  onClick={() => setShowActionItemForm(!showActionItemForm)}
                  className="flex items-center gap-2 px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Plus className="h-4 w-4" />
                  {showActionItemForm ? "Cancel" : "Add"}
                </button>
              </div>
              {showActionItemForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (actionItemTitle.trim()) {
                      createActionItemMutation.mutate({
                        title: actionItemTitle.trim(),
                        description: actionItemDesc.trim() || undefined,
                      })
                    }
                  }}
                  className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Action item title *"
                    value={actionItemTitle}
                    onChange={(e) => setActionItemTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={actionItemDesc}
                    onChange={(e) => setActionItemDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowActionItemForm(false)}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createActionItemMutation.isPending || !actionItemTitle.trim()}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createActionItemMutation.isPending ? "Creating..." : "Create"}
                    </button>
                  </div>
                  {createActionItemMutation.isError && (
                    <p className="text-xs text-red-600">
                      {createActionItemMutation.error?.message || "Failed to create action item"}
                    </p>
                  )}
                </form>
              )}
              {actionItems.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No open action items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionItems.slice(0, 5).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-neutral-900">{item.title}</h3>
                        <span className={`text-xs border rounded-full px-2 py-1 ${getStatusColor(item.status)}`}>
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-neutral-600 mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        {item.assignedTo && (
                          <span>Assigned to: {item.assignedTo.name}</span>
                        )}
                        {item.dueDate && (
                          <span>Due: {formatDate(item.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {actionItems.length > 5 && (
                    <Link
                      href={`/projects/${projectId}/collaboration/action-items`}
                      className="block text-center text-sm text-primary hover:underline"
                    >
                      View all {actionItems.length} action items →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Design Decisions */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Design Decisions
                </h2>
                <button
                  onClick={() => setShowDecisionForm(!showDecisionForm)}
                  className="flex items-center gap-2 px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Plus className="h-4 w-4" />
                  {showDecisionForm ? "Cancel" : "Add"}
                </button>
              </div>
              {showDecisionForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (decisionTitle.trim() && decisionText.trim()) {
                      createDecisionMutation.mutate({
                        title: decisionTitle.trim(),
                        decisionText: decisionText.trim(),
                      })
                    }
                  }}
                  className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Decision title *"
                    value={decisionTitle}
                    onChange={(e) => setDecisionTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    required
                  />
                  <textarea
                    placeholder="Decision text *"
                    value={decisionText}
                    onChange={(e) => setDecisionText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDecisionForm(false)}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createDecisionMutation.isPending || !decisionTitle.trim() || !decisionText.trim()}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createDecisionMutation.isPending ? "Creating..." : "Create"}
                    </button>
                  </div>
                  {createDecisionMutation.isError && (
                    <p className="text-xs text-red-600">
                      {createDecisionMutation.error?.message || "Failed to create design decision"}
                    </p>
                  )}
                </form>
              )}
              {decisions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No design decisions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.slice(0, 5).map((decision: any) => (
                    <div
                      key={decision.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-neutral-900">{decision.title}</h3>
                        <span className={`text-xs border rounded-full px-2 py-1 ${getDecisionStatusColor(decision.status)}`}>
                          {decision.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">{decision.decisionText}</p>
                      <div className="text-xs text-neutral-500">
                        Proposed by {decision.proposedBy?.name} on {formatDate(decision.createdAt)}
                      </div>
                    </div>
                  ))}
                  {decisions.length > 5 && (
                    <Link
                      href={`/projects/${projectId}/collaboration/decisions`}
                      className="block text-center text-sm text-primary hover:underline"
                    >
                      View all {decisions.length} decisions →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Meeting Minutes */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Meetings
                </h2>
                <button
                  onClick={() => setShowMeetingForm(!showMeetingForm)}
                  className="flex items-center gap-2 px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Plus className="h-4 w-4" />
                  {showMeetingForm ? "Cancel" : "Add Meeting"}
                </button>
              </div>
              {showMeetingForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (meetingTitle.trim() && meetingDate) {
                      createMeetingMutation.mutate({
                        title: meetingTitle.trim(),
                        meetingDate: meetingDate,
                      })
                    }
                  }}
                  className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50 space-y-3"
                >
                  <input
                    type="text"
                    placeholder="Meeting title *"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    required
                  />
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMeetingForm(false)}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMeetingMutation.isPending || !meetingTitle.trim() || !meetingDate}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createMeetingMutation.isPending ? "Creating..." : "Create"}
                    </button>
                  </div>
                  {createMeetingMutation.isError && (
                    <p className="text-xs text-red-600">
                      {createMeetingMutation.error?.message || "Failed to create meeting"}
                    </p>
                  )}
                </form>
              )}
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No meetings recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.slice(0, 5).map((meeting: any) => (
                    <div
                      key={meeting.id}
                      className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-neutral-900">{meeting.title}</h3>
                        <span className="text-xs text-neutral-500">{formatDate(meeting.meetingDate)}</span>
                      </div>
                      {meeting.agenda && (
                        <p className="text-sm text-neutral-600 mb-2">{meeting.agenda}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{meeting.attendeeIds?.length || 0} attendees</span>
                        {meeting._count && meeting._count.actionItems > 0 && (
                          <span>{meeting._count.actionItems} action items</span>
                        )}
                        {meeting.location && (
                          <span>{meeting.location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {meetings.length > 5 && (
                    <Link
                      href={`/projects/${projectId}/collaboration/meetings`}
                      className="block text-center text-sm text-primary hover:underline"
                    >
                      View all {meetings.length} meetings →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Features Info */}
          <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Collaboration Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Live Presence
                </h3>
                <p className="text-sm text-neutral-600">
                  See who's viewing or editing documents in real-time. Presence indicators show active collaborators.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Change Tracking
                </h3>
                <p className="text-sm text-neutral-600">
                  Track all document changes with visual diff capabilities. See what changed, when, and by whom.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Digital Signatures
                </h3>
                <p className="text-sm text-neutral-600">
                  Request and collect digital signatures for approvals. Track signature status and expiration.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comment Threads
                </h3>
                <p className="text-sm text-neutral-600">
                  Threaded comments with @mentions. Link comments to specific locations in documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
