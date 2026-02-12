"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
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
// Mock data
// ---------------------------------------------------------------------------

const MOCK_RFI = {
  id: "1",
  number: "RFI-001",
  subject: "Column alignment discrepancy between grids C3 and C5",
  status: "open" as RFIStatus,
  priority: "high" as RFIPriority,
  projectName: "Riverside Commons",
  from: "Mike Torres",
  fromCompany: "Torres General Contractors",
  assignedTo: "Anderson Architects",
  createdDate: "2026-01-28",
  dueDate: "2026-02-14",
  drawingRef: "S-201, S-202",
  specRef: "Section 03 30 00 - Cast-in-Place Concrete",
  costImpact: "$18,500 estimated if columns require repositioning",
  scheduleImpact: "3-5 day delay to foundation pour if redesign required",
  question:
    "Drawing S-201 shows column grid line C3 at 24'-0\" on center from C2, but the architectural plan A-102 dimensions it at 22'-6\". The structural plan S-202 at Level 2 references the 24'-0\" dimension for the transfer beam above. We need clarification on the correct column spacing before we can proceed with the foundation formwork at Grid C3 through C5.\n\nAdditionally, if the 22'-6\" dimension on the architectural plan is correct, the transfer beam span on S-202 will need to be recalculated. Please advise which drawing governs and whether a revised structural calculation is required.",
}

const MOCK_RESPONSES = [
  {
    id: "r1",
    user: "Sarah Kim",
    initials: "SK",
    role: "Project Manager",
    company: "Kealee PM",
    date: "2026-01-29",
    avatarColor: "bg-purple-100 text-purple-700",
    content:
      "I have reviewed both drawings and can confirm the discrepancy between S-201 and A-102. I am forwarding this to the structural engineer for formal review. In the meantime, please hold off on forming the foundations at Grid C3 through C5. The rest of the foundation work on grids A through C2 can proceed as planned.",
  },
  {
    id: "r2",
    user: "James Chen",
    initials: "JC",
    role: "Structural Engineer",
    company: "Structural Solutions LLC",
    date: "2026-01-31",
    avatarColor: "bg-green-100 text-green-700",
    content:
      "After reviewing the original design intent and checking the transfer beam calculations, the correct dimension is 24'-0\" as shown on S-201. The A-102 architectural plan contains a drafting error that will be corrected in the next revision (ASI-007). You may proceed with formwork based on the S-201 structural dimensions. An updated A-102 will be issued within 48 hours. No structural recalculation is needed for the transfer beam.",
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RFIDetailPage() {
  const [response, setResponse] = React.useState("")
  const rfi = MOCK_RFI

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
                STATUS_STYLES[rfi.status]
              )}
            >
              {STATUS_LABELS[rfi.status]}
            </span>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                PRIORITY_STYLES[rfi.priority]
              )}
            >
              {PRIORITY_LABELS[rfi.priority]}
            </span>
          </div>
          <p className="text-lg text-gray-700">{rfi.subject}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-2">
            <CheckCircle2 size={16} />
            Close RFI
          </Button>
          <Button className="gap-2">
            <Send size={16} />
            Respond
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
                  MT
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {rfi.from}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rfi.fromCompany} &middot;{" "}
                    {new Date(rfi.createdDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {rfi.question}
              </p>
            </CardContent>
          </Card>

          {/* -- Threaded responses -- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                Responses ({MOCK_RESPONSES.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_RESPONSES.map((r) => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        r.avatarColor
                      )}
                    >
                      {r.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {r.user}
                        </p>
                        <span className="text-xs text-gray-400">
                          {r.role}, {r.company}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(r.date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" }
                        )}
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
                  <Button size="sm" className="gap-1.5">
                    <Send size={14} />
                    Send Response
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
                  value: rfi.projectName,
                },
                { icon: User, label: "From", value: `${rfi.from} (${rfi.fromCompany})` },
                {
                  icon: User,
                  label: "Assigned To",
                  value: rfi.assignedTo,
                },
                {
                  icon: Calendar,
                  label: "Created",
                  value: new Date(
                    rfi.createdDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }),
                },
                {
                  icon: Clock,
                  label: "Due Date",
                  value: new Date(
                    rfi.dueDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }),
                },
                {
                  icon: AlertTriangle,
                  label: "Priority",
                  value: PRIORITY_LABELS[rfi.priority],
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={16} />
                References
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Drawing Reference</p>
                <p className="text-sm font-medium text-gray-900">
                  {rfi.drawingRef}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Specification Reference
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {rfi.specRef}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* -- Impact Assessment -- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={16} />
                Impact Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-red-500" />
                  <p className="text-xs font-medium text-gray-700">
                    Cost Impact
                  </p>
                </div>
                <p className="text-sm text-gray-600 ml-6">{rfi.costImpact}</p>
              </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
