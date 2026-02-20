"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  MapPin,
  Send,
  User,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"
import {
  useFieldConflict,
  useUpdateFieldConflict,
  useCreateRfiFromConflict,
} from "@/hooks/useFieldConflicts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "critical" | "high" | "medium" | "low"
type ConflictStatus = "open" | "under_review" | "resolved"

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-700",
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

const STATUS_STYLES: Record<ConflictStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
}

const STATUS_LABELS: Record<ConflictStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FieldConflictDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading } = useFieldConflict(id)
  const updateConflict = useUpdateFieldConflict(id)
  const createRfi = useCreateRfiFromConflict()

  const [resolutionText, setResolutionText] = React.useState("")

  const conflict = data?.conflict ?? data?.item ?? data ?? null

  // ---------------------------------------------------------------------------
  // Loading / Not found
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!conflict) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-700">
          Field conflict not found
        </p>
        <Link href="/field-conflicts" className="text-blue-600 text-sm mt-2 inline-block">
          Back to Field Conflicts
        </Link>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const severity = (conflict.severity as Severity) || "medium"
  const status = (conflict.status as ConflictStatus) || "open"
  const photos: string[] = conflict.photos ?? conflict.photoUrls ?? []
  const hasGps = conflict.gpsLat != null && conflict.gpsLng != null
  const linkedRfiId = conflict.linkedRFIId || conflict.linkedRfiId || null
  const isResolved = status === "resolved"

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleStartReview() {
    updateConflict.mutate({ status: "under_review" })
  }

  function handleResolve() {
    if (!resolutionText.trim() && !isResolved) {
      alert("Please enter a resolution description.")
      return
    }
    updateConflict.mutate({
      status: "resolved",
      resolution: resolutionText.trim(),
      resolvedDate: new Date().toISOString(),
    })
  }

  function handleCreateRfi() {
    createRfi.mutate(id)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Back button ---- */}
      <div className="flex items-center gap-4">
        <Link href="/field-conflicts">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Field Conflicts
          </Button>
        </Link>
      </div>

      {/* ---- Header with badges ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                SEVERITY_STYLES[severity]
              )}
            >
              {SEVERITY_LABELS[severity]} Severity
            </span>
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                STATUS_STYLES[status]
              )}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MapPin size={18} className="text-gray-400" />
            {conflict.location || "No location specified"}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {status === "open" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleStartReview}
              disabled={updateConflict.isPending}
            >
              <Eye size={16} />
              {updateConflict.isPending ? "Updating..." : "Start Review"}
            </Button>
          )}
          {status !== "resolved" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleResolve}
              disabled={updateConflict.isPending}
            >
              <CheckCircle2 size={16} />
              {updateConflict.isPending ? "Updating..." : "Resolve"}
            </Button>
          )}
          {!linkedRfiId && (
            <Button
              className="gap-2"
              onClick={handleCreateRfi}
              disabled={createRfi.isPending}
            >
              <FileText size={16} />
              {createRfi.isPending ? "Creating..." : "Create RFI"}
            </Button>
          )}
        </div>
      </div>

      {/* ---- Two-column layout (stacked on mobile) ---- */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* ================ Left column (2/3) ================ */}
        <div className="md:col-span-2 space-y-6">
          {/* -- Description -- */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {conflict.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* -- Photo Gallery -- */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photoUrl: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50"
                    >
                      <img
                        src={photoUrl}
                        alt={`Conflict photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* -- Resolution section -- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isResolved ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 whitespace-pre-wrap">
                      {conflict.resolution || "Marked as resolved."}
                    </p>
                  </div>
                  {conflict.resolvedDate && (
                    <p className="text-xs text-gray-500">
                      Resolved on{" "}
                      {new Date(conflict.resolvedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="mb-1.5">Resolution Details</Label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe how this conflict was resolved, what corrective actions were taken, and any follow-up needed..."
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px] resize-y focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                  />
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleResolve}
                    disabled={
                      !resolutionText.trim() || updateConflict.isPending
                    }
                  >
                    {updateConflict.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {updateConflict.isPending
                      ? "Saving..."
                      : "Mark Resolved"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================ Right column (1/3) ================ */}
        <div className="space-y-6">
          {/* -- Details sidebar -- */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  icon: User,
                  label: "Reported By",
                  value:
                    conflict.reportedBy ||
                    conflict.createdBy ||
                    "Unknown",
                },
                {
                  icon: Calendar,
                  label: "Date Reported",
                  value:
                    conflict.createdAt || conflict.reportedDate
                      ? new Date(
                          conflict.createdAt || conflict.reportedDate
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A",
                },
                {
                  icon: FolderOpen,
                  label: "Project",
                  value:
                    conflict.projectName ||
                    conflict.project?.name ||
                    "N/A",
                },
                {
                  icon: AlertTriangle,
                  label: "Severity",
                  value: SEVERITY_LABELS[severity],
                },
                {
                  icon: Clock,
                  label: "Status",
                  value: STATUS_LABELS[status],
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon
                    size={16}
                    className="text-gray-400 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* -- GPS Coordinates -- */}
          {hasGps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={16} />
                  GPS Coordinates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-mono text-gray-700">
                    {Number(conflict.gpsLat).toFixed(6)},{" "}
                    {Number(conflict.gpsLng).toFixed(6)}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${conflict.gpsLat},${conflict.gpsLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink size={14} />
                  View on Google Maps
                </a>
              </CardContent>
            </Card>
          )}

          {/* -- Linked RFI -- */}
          {linkedRfiId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={16} />
                  Linked RFI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/rfis/${linkedRfiId}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <FileText size={14} />
                  {conflict.linkedRFINumber
                    ? `RFI ${conflict.linkedRFINumber}`
                    : "View Linked RFI"}
                  <ExternalLink size={12} />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
