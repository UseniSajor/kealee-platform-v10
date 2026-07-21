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
  AlertTriangle,
  GitBranch,
  Calendar,
  User,
  Download,
} from "lucide-react"

import { api } from "@/lib/api"

export default function RevisionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const revisionId = params.revisionId as string

  // Fetch revision
  const { data: revisionData, isLoading } = useQuery({
    queryKey: ["revision", revisionId],
    queryFn: () => api.getRevision(revisionId),
  })

  const revision = revisionData?.revision

  const generateScheduleMutation = useMutation({
    mutationFn: (data: { scheduleType: string }) =>
      api.generateRevisionSchedule(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", revisionId] })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading revision...</div>
      </div>
    )
  }

  if (!revision) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Revision not found</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/revisions`)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Revisions
          </button>
        </div>
      </div>
    )
  }

  const sheetRevisions = revision.sheetRevisions || []
  const impacts = revision.impacts || []

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}/revisions`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Revisions
          </button>

          {/* Revision Header */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-neutral-900">Revision {revision.revisionLetter}</h1>
                  <span className="text-sm text-neutral-500">#{revision.revisionNumber}</span>
                  <span className={`text-xs border rounded-full px-3 py-1 ${getStatusColor(revision.status)}`}>
                    {revision.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-neutral-700 mb-4">{revision.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600">Revision Date:</span>
                    <span className="ml-2 font-medium">{formatDate(revision.revisionDate)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Type:</span>
                    <span className="ml-2 font-medium">{revision.revisionType.replace("_", " ")}</span>
                  </div>
                  {revision.issuanceType && (
                    <div>
                      <span className="text-neutral-600">Issuance:</span>
                      <span className="ml-2 font-medium">{revision.issuanceType.replace("_", " ")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    generateScheduleMutation.mutate({ scheduleType: "REVISION" })
                  }}
                  disabled={generateScheduleMutation.isPending}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate Schedule
                </button>
              </div>
            </div>

            {/* Approval/Issue Info */}
            {(revision.approvedAt || revision.issuedAt) && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {revision.approvedAt && (
                    <div>
                      <span className="text-neutral-600">Approved:</span>
                      <span className="ml-2">{formatDate(revision.approvedAt)}</span>
                      {revision.approvedBy && (
                        <span className="ml-2 text-neutral-500">by {revision.approvedBy.name}</span>
                      )}
                    </div>
                  )}
                  {revision.issuedAt && (
                    <div>
                      <span className="text-neutral-600">Issued:</span>
                      <span className="ml-2">{formatDate(revision.issuedAt)}</span>
                      {revision.issuedBy && (
                        <span className="ml-2 text-neutral-500">by {revision.issuedBy.name}</span>
                      )}
                      {revision.issuedTo && (
                        <span className="ml-2 text-neutral-500">to {revision.issuedTo}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Affected Sheets */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Affected Sheets ({sheetRevisions.length})
              </h2>
              {sheetRevisions.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No sheets in this revision</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sheetRevisions.map((sr: any) => (
                    <div key={sr.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{sr.sheet?.sheetNumber || "Unknown"}</div>
                          <div className="text-sm text-neutral-600">{sr.sheet?.sheetTitle || ""}</div>
                          {sr.revisionDescription && (
                            <p className="text-sm text-neutral-700 mt-1">{sr.revisionDescription}</p>
                          )}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 border border-blue-300 rounded-full px-2 py-1">
                          {sr.changeType.replace("_", " ")}
                        </span>
                      </div>
                      {sr.cloudAreas && sr.cloudAreas.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                          <Cloud className="h-3 w-3" />
                          {sr.cloudAreas.length} revision cloud{sr.cloudAreas.length !== 1 ? "s" : ""}
                        </div>
                      )}
                      {sr.affectedAreas && sr.affectedAreas.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-600">
                          Affected areas: {sr.affectedAreas.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Impact Analysis */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Impact Analysis
              </h2>
              {revision.requiresCoordination && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 font-semibold">
                    <GitBranch className="h-4 w-4" />
                    Requires Coordination
                  </div>
                </div>
              )}
              {impacts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                  <p>No impact analysis yet</p>
                  <button
                    onClick={() => {
                      api.analyzeRevisionImpact(revisionId).then(() => {
                        queryClient.invalidateQueries({ queryKey: ["revision", revisionId] })
                      })
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                  >
                    Analyze Impact
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {impacts.map((impact: any) => (
                    <div key={impact.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">Discipline: {impact.affectedDiscipline}</div>
                          <span className={`text-xs border rounded-full px-2 py-1 mt-1 inline-block ${
                            impact.impactLevel === "CRITICAL" ? "bg-red-100 text-red-700 border-red-300" :
                            impact.impactLevel === "HIGH" ? "bg-orange-100 text-orange-700 border-orange-300" :
                            impact.impactLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                            "bg-green-100 text-green-700 border-green-300"
                          }`}>
                            {impact.impactLevel} Impact
                          </span>
                        </div>
                        {impact.requiresCoordination && !impact.coordinatedAt && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full px-2 py-1">
                            Needs Coordination
                          </span>
                        )}
                        {impact.coordinatedAt && (
                          <span className="text-xs bg-green-100 text-green-700 border border-green-300 rounded-full px-2 py-1">
                            Coordinated
                          </span>
                        )}
                      </div>
                      {impact.impactDescription && (
                        <p className="text-sm text-neutral-600 mt-2">{impact.impactDescription}</p>
                      )}
                      {impact.coordinationNotes && (
                        <p className="text-sm text-neutral-500 mt-2 italic">Notes: {impact.coordinationNotes}</p>
                      )}
                      {impact.affectedSheetIds && impact.affectedSheetIds.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-500">
                          {impact.affectedSheetIds.length} sheet{impact.affectedSheetIds.length !== 1 ? "s" : ""} affected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revision Schedule */}
          {revision.revisionSchedule && (
            <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Revision Schedule
              </h2>
              <p className="text-sm text-neutral-600 mb-4">
                Generated on {formatDate(revision.revisionSchedule.generatedAt)}
              </p>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  Schedule data would be displayed here. PDF/Excel export would be available.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
