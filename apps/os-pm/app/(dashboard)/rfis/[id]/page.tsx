"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  TrendingUp,
  User,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"
import { useRFI, useAddRFIResponse, useCloseRFI } from "@/hooks/useRFIs"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RFIStatus = "draft" | "open" | "answered" | "closed"
type RFIPriority = "low" | "medium" | "high" | "critical"

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<RFIStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  open: "bg-blue-100 text-blue-800",
  answered: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
}

const STATUS_LABELS: Record<RFIStatus, string> = {
  draft: "Draft",
  open: "Open",
  answered: "Answered",
  closed: "Closed",
}

const PRIORITY_STYLES: Record<RFIPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

const PRIORITY_LABELS: Record<RFIPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RFIDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data, isLoading } = useRFI(id)
  const addResponse = useAddRFIResponse()
  const closeRFI = useCloseRFI()
  const [response, setResponse] = React.useState("")

  const rfi = data?.rfi ?? data?.item ?? data ?? null

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!rfi) return <div className="text-center py-12">RFI not found</div>

  const status = (rfi.status as RFIStatus) || "open"
  const priority = (rfi.priority as RFIPriority) || "medium"
  const responses = rfi.responses || []

  function handleSendResponse() {
    if (!response.trim()) return
    addResponse.mutate(
      { rfiId: id, content: response },
      { onSuccess: () => setResponse("") }
    )
  }

  function handleCloseRFI() {
    closeRFI.mutate(id)
  }

  return (
    <div className="space-y-6">
      {/* ---- Back button ---- */}
      <div className="flex items-center gap-4">
        <Link href="/rfis">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to RFIs
          </Button>
        </Link>
      </div>

      {/* ---- RFI header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{rfi.number}</h1>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                STATUS_STYLES[status] || STATUS_STYLES.open
              )}
            >
              {STATUS_LABELS[status] || status}
            </span>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
              )}
            >
              {PRIORITY_LABELS[priority] || priority}
            </span>
          </div>
          <p className="text-lg text-gray-700">{rfi.subject}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCloseRFI}
            disabled={closeRFI.isPending}
          >
            <CheckCircle2 size={16} />
            {closeRFI.isPending ? "Closing..." : "Close RFI"}
          </Button>
          <Button className="gap-2" onClick={handleSendResponse} disabled={!response.trim() || addResponse.isPending}>
            <Send size={16} />
            {addResponse.isPending ? "Sending..." : "Respond"}
          </Button>
        </div>
      </div>

      {/* ---- Two-column layout ---- */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* ================ Left column (2/3) ================ */}
        <div className="md:col-span-2 space-y-6">
          {/* -- Original question -- */}
          <Card>
            <CardHeader>
              <CardTitle>Original Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                  {(rfi.from || rfi.fromUser || "??")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {rfi.from || rfi.fromUser || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rfi.fromCompany || ""} {rfi.fromCompany ? "\u00B7 " : ""}
                    {rfi.createdDate || rfi.createdAt
                      ? new Date((rfi.createdDate || rfi.createdAt) + (String(rfi.createdDate || rfi.createdAt).includes("T") ? "" : "T00:00:00")).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" }
                        )
                      : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {rfi.question || rfi.description || ""}
              </p>
            </CardContent>
          </Card>

          {/* -- Threaded responses -- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                Responses ({responses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {responses.map((r: any) => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        r.avatarColor || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {r.initials ||
                        (r.user || "?")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {r.user || r.userName || "Unknown"}
                        </p>
                        <span className="text-xs text-gray-400">
                          {r.role ? `${r.role}, ` : ""}{r.company || ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {r.date || r.createdAt
                          ? new Date((r.date || r.createdAt) + (String(r.date || r.createdAt).includes("T") ? "" : "T00:00:00")).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {r.content}
                  </p>
                </div>
              ))}

              {/* -- Add Response -- */}
              <div className="border-t pt-4 mt-4">
                <Label className="mb-2">Add Response</Label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response to this RFI..."
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px] resize-y focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Paperclip size={14} />
                    Attach File
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleSendResponse}
                    disabled={!response.trim() || addResponse.isPending}
                  >
                    <Send size={14} />
                    {addResponse.isPending ? "Sending..." : "Send Response"}
                  </Button>
                </div>
              </div>
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
                  icon: FolderOpen,
                  label: "Project",
                  value: rfi.projectName || rfi.project || "N/A",
                },
                { icon: User, label: "From", value: `${rfi.from || rfi.fromUser || "N/A"}${rfi.fromCompany ? ` (${rfi.fromCompany})` : ""}` },
                {
                  icon: User,
                  label: "Assigned To",
                  value: rfi.assignedTo || "N/A",
                },
                {
                  icon: Calendar,
                  label: "Created",
                  value: rfi.createdDate || rfi.createdAt
                    ? new Date(
                        (rfi.createdDate || rfi.createdAt) + (String(rfi.createdDate || rfi.createdAt).includes("T") ? "" : "T00:00:00")
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A",
                },
                {
                  icon: Clock,
                  label: "Due Date",
                  value: rfi.dueDate
                    ? new Date(
                        rfi.dueDate + (String(rfi.dueDate).includes("T") ? "" : "T00:00:00")
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A",
                },
                {
                  icon: AlertTriangle,
                  label: "Priority",
                  value: PRIORITY_LABELS[priority] || priority,
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

          {/* -- References -- */}
          {(rfi.drawingRef || rfi.specRef) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={16} />
                  References
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rfi.drawingRef && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Drawing Reference</p>
                    <p className="text-sm font-medium text-gray-900">
                      {rfi.drawingRef}
                    </p>
                  </div>
                )}
                {rfi.specRef && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Specification Reference
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {rfi.specRef}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* -- Impact Assessment -- */}
          {(rfi.costImpact || rfi.scheduleImpact) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Impact Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rfi.costImpact && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={14} className="text-red-500" />
                      <p className="text-xs font-medium text-gray-700">
                        Cost Impact
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{rfi.costImpact}</p>
                  </div>
                )}
                {rfi.scheduleImpact && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-orange-500" />
                      <p className="text-xs font-medium text-gray-700">
                        Schedule Impact
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">
                      {rfi.scheduleImpact}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
