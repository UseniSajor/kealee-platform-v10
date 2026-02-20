"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Search,
  Eye,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { useFieldConflicts } from "@/hooks/useFieldConflicts"

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
// Filter definitions
// ---------------------------------------------------------------------------

const SEVERITY_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
]

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Under Review", value: "under_review" },
  { label: "Resolved", value: "resolved" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FieldConflictsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [severityFilter, setSeverityFilter] = React.useState<string>("all")

  const { data, isLoading } = useFieldConflicts({
    status: statusFilter !== "all" ? statusFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
  })
  const items: any[] = data?.items ?? data ?? []

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = React.useMemo(() => {
    const allItems: any[] = data?.items ?? data ?? []
    return {
      open: allItems.filter((c: any) => c.status === "open").length,
      underReview: allItems.filter((c: any) => c.status === "under_review").length,
      resolved: allItems.filter((c: any) => c.status === "resolved").length,
    }
  }, [data])

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Conflicts</h1>
          <p className="text-gray-500 mt-1">
            Report and track conflicts discovered in the field
          </p>
        </div>
        <Link href="/field-conflicts/new">
          <Button className="gap-2">
            <Plus size={16} />
            Report Conflict
          </Button>
        </Link>
      </div>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Open",
            value: stats.open,
            icon: AlertTriangle,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Under Review",
            value: stats.underReview,
            icon: Eye,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---- Filters ---- */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Severity pills */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Severity</p>
            <div className="flex gap-2 flex-wrap">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSeverityFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    severityFilter === f.value
                      ? f.value === "critical"
                        ? "bg-red-600 text-white"
                        : f.value === "high"
                          ? "bg-orange-500 text-white"
                          : f.value === "medium"
                            ? "bg-yellow-500 text-white"
                            : f.value === "low"
                              ? "bg-gray-500 text-white"
                              : "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status tabs */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    statusFilter === tab.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Conflict cards ---- */}
      <div className="space-y-3">
        {items.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No field conflicts reported</p>
              <p className="text-sm mt-1">
                Use the Report Conflict button to document issues found in the
                field.
              </p>
            </CardContent>
          </Card>
        )}

        {items.map((conflict: any) => {
          const severity = (conflict.severity as Severity) || "medium"
          const status = (conflict.status as ConflictStatus) || "open"
          const photoCount = conflict.photos?.length ?? conflict.photoCount ?? 0
          const hasGps = conflict.gpsLat != null && conflict.gpsLng != null
          const hasLinkedRfi = Boolean(conflict.linkedRFIId || conflict.linkedRfiId)

          return (
            <Link
              key={conflict.id}
              href={`/field-conflicts/${conflict.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Top row: badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          SEVERITY_STYLES[severity]
                        )}
                      >
                        {SEVERITY_LABELS[severity]}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          STATUS_STYLES[status]
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                      {hasLinkedRfi && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          RFI Linked
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      <span className="font-medium">
                        {conflict.location || "No location specified"}
                      </span>
                      {hasGps && (
                        <span className="ml-1 text-green-600" title="GPS coordinates captured">
                          <MapPin size={12} />
                        </span>
                      )}
                    </div>

                    {/* Description (truncated to 2 lines) */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {conflict.description || "No description provided."}
                    </p>

                    {/* Footer: reported by, date, photo count */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t">
                      <div className="flex items-center gap-3">
                        <span>
                          {conflict.reportedBy || conflict.createdBy || "Unknown"}
                        </span>
                        <span>
                          {conflict.createdAt || conflict.reportedDate
                            ? new Date(
                                conflict.createdAt || conflict.reportedDate
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {photoCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera size={12} />
                            {photoCount}
                          </span>
                        )}
                        {hasLinkedRfi && (
                          <span className="flex items-center gap-1 text-purple-500">
                            <FileText size={12} />
                            RFI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
