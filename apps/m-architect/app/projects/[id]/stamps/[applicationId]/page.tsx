"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Stamp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  History,
  Download,
} from "lucide-react"

import { api } from "@/lib/api"

export default function StampApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const applicationId = params.applicationId as string

  const [showVerifyModal, setShowVerifyModal] = React.useState(false)
  const [verificationNotes, setVerificationNotes] = React.useState("")
  const [isVerified, setIsVerified] = React.useState(true)

  // Fetch stamp application
  const { data: applicationData } = useQuery({
    queryKey: ["stamp-application", applicationId],
    queryFn: () => api.getStampApplication(applicationId),
  })

  // Fetch stamp log
  const { data: logData } = useQuery({
    queryKey: ["stamp-log", applicationId],
    queryFn: () => api.getStampLog(applicationId),
  })

  const application = applicationData?.application
  const logEntries = logData?.logEntries || []

  const verifyApplicationMutation = useMutation({
    mutationFn: () =>
      api.verifyStampApplication(applicationId, {
        isVerified: isVerified,
        verificationNotes: verificationNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stamp-application", applicationId] })
      setShowVerifyModal(false)
      setVerificationNotes("")
    },
  })

  if (!application) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading stamp application...</div>
      </div>
    )
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "APPLIED":
        return "bg-green-100 text-green-700 border-green-300"
      case "PENDING":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "REJECTED":
      case "EXPIRED":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-300"
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/projects/${projectId}/stamps`)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stamps
          </button>

          {/* Application Header */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">Stamp Application</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{application.stampTemplate?.stampName || "Unknown Stamp"}</span>
                  <span className={`text-xs border rounded-full px-3 py-1 ${getStatusColor(application.applicationStatus)}`}>
                    {application.applicationStatus}
                  </span>
                </div>
                <div className="text-sm text-neutral-600">
                  {application.targetType}: {application.targetId}
                </div>
              </div>
            </div>

            {/* Stamp Template Info */}
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-semibold mb-2">Stamp Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-neutral-600">Type:</span>{" "}
                  <span className="font-medium">{application.stampTemplate?.stampType?.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-neutral-600">License:</span>{" "}
                  <span className="font-medium">
                    {application.stampTemplate?.licenseState} #{application.stampTemplate?.licenseNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Position Information */}
            {(application.positionX || application.positionY) && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Position</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {application.positionX && (
                    <div>
                      <span className="text-neutral-600">X:</span>{" "}
                      <span className="font-medium">{application.positionX}</span>
                    </div>
                  )}
                  {application.positionY && (
                    <div>
                      <span className="text-neutral-600">Y:</span>{" "}
                      <span className="font-medium">{application.positionY}</span>
                    </div>
                  )}
                  {application.scale && (
                    <div>
                      <span className="text-neutral-600">Scale:</span>{" "}
                      <span className="font-medium">{application.scale}x</span>
                    </div>
                  )}
                  {application.rotation && (
                    <div>
                      <span className="text-neutral-600">Rotation:</span>{" "}
                      <span className="font-medium">{application.rotation}°</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tamper Detection */}
            {application.tamperEvidentHash && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Tamper-Evident Protection</h3>
                </div>
                <div className="text-sm text-neutral-600">
                  Document hash: {application.tamperEvidentHash.substring(0, 16)}...
                </div>
              </div>
            )}

            {/* Actions */}
            {application.applicationStatus === "APPLIED" && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Application
                </button>
                <button
                  onClick={() => {
                    // TODO: Check tampering
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  <Shield className="h-4 w-4" />
                  Check Tampering
                </button>
              </div>
            )}
          </div>

          {/* Stamp Log */}
          {logEntries.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                Stamp Log
              </h2>
              <div className="space-y-3">
                {logEntries.map((entry: any) => (
                  <div key={entry.id} className="p-3 border border-neutral-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{entry.actionDescription || entry.actionType}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {entry.performedBy?.name} • {formatDate(entry.performedAt)}
                        </div>
                        {entry.tamperDetected && (
                          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Tampering detected: {entry.tamperDetails}
                          </div>
                        )}
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

          {/* Verify Modal */}
          {showVerifyModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Verify Stamp Application</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Verification Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isVerified}
                        onChange={() => setIsVerified(true)}
                        className="w-4 h-4"
                      />
                      <span>Verified</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!isVerified}
                        onChange={() => setIsVerified(false)}
                        className="w-4 h-4"
                      />
                      <span>Rejected</span>
                    </label>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add verification notes (optional)"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => verifyApplicationMutation.mutate()}
                    disabled={verifyApplicationMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {verifyApplicationMutation.isPending ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    onClick={() => {
                      setShowVerifyModal(false)
                      setVerificationNotes("")
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
