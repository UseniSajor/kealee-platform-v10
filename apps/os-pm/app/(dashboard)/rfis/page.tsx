"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileQuestion,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RFIStatus = "draft" | "open" | "answered" | "closed"
type RFIPriority = "low" | "medium" | "high" | "critical"

interface RFI {
  id: string
  number: string
  subject: string
  projectName: string
  from: string
  to: string
  status: RFIStatus
  priority: RFIPriority
  costImpact: boolean
  scheduleImpact: boolean
  responseCount: number
  attachmentCount: number
  createdDate: string
  dueDate: string
  drawingRef: string
}

// ---------------------------------------------------------------------------
// Status & priority style maps
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
// Mock data  8 realistic construction RFIs
// ---------------------------------------------------------------------------

const MOCK_RFIS: RFI[] = [
  {
    id: "1",
    number: "RFI-001",
    subject: "Column alignment discrepancy between grids C3 and C5",
    projectName: "Riverside Commons",
    from: "Mike Torres - Torres GC",
    to: "Anderson Architects",
    status: "open",
    priority: "high",
    costImpact: true,
    scheduleImpact: true,
    responseCount: 2,
    attachmentCount: 3,
    createdDate: "2026-01-28",
    dueDate: "2026-02-14",
    drawingRef: "S-201",
  },
  {
    id: "2",
    number: "RFI-002",
    subject: "Window head height and sill detail clarification at east elevation",
    projectName: "Riverside Commons",
    from: "Sarah Kim - Kealee PM",
    to: "Anderson Architects",
    status: "answered",
    priority: "medium",
    costImpact: false,
    scheduleImpact: true,
    responseCount: 4,
    attachmentCount: 2,
    createdDate: "2026-01-22",
    dueDate: "2026-02-05",
    drawingRef: "A-301",
  },
  {
    id: "3",
    number: "RFI-003",
    subject: "MEP routing conflict at Level 3 corridor ceiling plenum",
    projectName: "Oakwood Office Park",
    from: "James Chen - Valley Mechanical",
    to: "MEP Engineers LLC",
    status: "open",
    priority: "critical",
    costImpact: true,
    scheduleImpact: true,
    responseCount: 1,
    attachmentCount: 5,
    createdDate: "2026-02-03",
    dueDate: "2026-02-17",
    drawingRef: "M-301, E-301, P-301",
  },
  {
    id: "4",
    number: "RFI-004",
    subject: "Exterior cladding attachment detail at parapet condition",
    projectName: "Summit Residences",
    from: "Carlos Rivera - Premier Facades",
    to: "Anderson Architects",
    status: "closed",
    priority: "high",
    costImpact: true,
    scheduleImpact: false,
    responseCount: 3,
    attachmentCount: 4,
    createdDate: "2026-01-15",
    dueDate: "2026-01-29",
    drawingRef: "A-501, A-502",
  },
  {
    id: "5",
    number: "RFI-005",
    subject: "Foundation rebar spacing vs. structural notes discrepancy",
    projectName: "Riverside Commons",
    from: "Mike Torres - Torres GC",
    to: "Structural Engineer",
    status: "open",
    priority: "high",
    costImpact: false,
    scheduleImpact: true,
    responseCount: 2,
    attachmentCount: 2,
    createdDate: "2026-02-06",
    dueDate: "2026-02-18",
    drawingRef: "S-201, S-001",
  },
  {
    id: "6",
    number: "RFI-006",
    subject: "Fire rating requirements for corridor partition walls at Building B",
    projectName: "Oakwood Office Park",
    from: "Interior Solutions Inc",
    to: "Anderson Architects",
    status: "draft",
    priority: "medium",
    costImpact: true,
    scheduleImpact: false,
    responseCount: 0,
    attachmentCount: 1,
    createdDate: "2026-02-10",
    dueDate: "2026-02-24",
    drawingRef: "A-210",
  },
  {
    id: "7",
    number: "RFI-007",
    subject: "Elevator pit waterproofing membrane specification and detail",
    projectName: "Summit Residences",
    from: "Sarah Kim - Kealee PM",
    to: "Anderson Architects",
    status: "answered",
    priority: "critical",
    costImpact: true,
    scheduleImpact: true,
    responseCount: 5,
    attachmentCount: 3,
    createdDate: "2026-01-20",
    dueDate: "2026-02-03",
    drawingRef: "S-101, A-010",
  },
  {
    id: "8",
    number: "RFI-008",
    subject: "ADA-compliant restroom clearance dimensions at Level 1",
    projectName: "Riverside Commons",
    from: "Valley Plumbing Co",
    to: "Anderson Architects",
    status: "closed",
    priority: "low",
    costImpact: false,
    scheduleImpact: false,
    responseCount: 2,
    attachmentCount: 1,
    createdDate: "2026-01-10",
    dueDate: "2026-01-24",
    drawingRef: "A-120",
  },
]

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Answered", value: "answered" },
  { label: "Closed", value: "closed" },
  { label: "Draft", value: "draft" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RFIsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return MOCK_RFIS.filter((rfi) => {
      if (statusFilter !== "all" && rfi.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          rfi.number.toLowerCase().includes(q) ||
          rfi.subject.toLowerCase().includes(q) ||
          rfi.projectName.toLowerCase().includes(q) ||
          rfi.from.toLowerCase().includes(q) ||
          rfi.to.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, statusFilter])

  const stats = React.useMemo(() => {
    const open = MOCK_RFIS.filter((r) => r.status === "open").length
    const answered = MOCK_RFIS.filter((r) => r.status === "answered").length
    const closed = MOCK_RFIS.filter((r) => r.status === "closed").length
    return { open, answered, closed, avgResponse: 6.2 }
  }, [])

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFIs</h1>
          <p className="text-gray-500 mt-1">
            Request for Information tracking and management
          </p>
        </div>
        <Link href="/rfis/new">
          <Button className="gap-2">
            <Plus size={16} />
            New RFI
          </Button>
        </Link>
      </div>

      {/* ---- Stats cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Open",
            value: stats.open,
            icon: FileQuestion,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Answered",
            value: stats.answered,
            icon: MessageSquare,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Closed",
            value: stats.closed,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Avg Response Time",
            value: `${stats.avgResponse} days`,
            icon: Clock,
            color: "text-purple-600 bg-purple-50",
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

      {/* ---- Search + filter tabs ---- */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by RFI number, subject, project, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTER_TABS.map((tab) => (
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

      {/* ---- RFI cards list ---- */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              No RFIs match your current filters.
            </CardContent>
          </Card>
        )}

        {filtered.map((rfi) => (
          <Link key={rfi.id} href={`/rfis/${rfi.id}`} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Left: main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-blue-600">
                        {rfi.number}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          STATUS_STYLES[rfi.status]
                        )}
                      >
                        {STATUS_LABELS[rfi.status]}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          PRIORITY_STYLES[rfi.priority]
                        )}
                      >
                        {PRIORITY_LABELS[rfi.priority]}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {rfi.subject}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {rfi.projectName}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        From: <span className="text-gray-700">{rfi.from}</span>
                      </span>
                      <span>
                        To: <span className="text-gray-700">{rfi.to}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: meta badges */}
                  <div className="flex flex-row md:flex-col items-end gap-2 shrink-0">
                    {/* Impact tags */}
                    <div className="flex gap-1.5">
                      {rfi.costImpact && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">
                          <TrendingUp size={10} />
                          Cost
                        </span>
                      )}
                      {rfi.scheduleImpact && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600">
                          <AlertTriangle size={10} />
                          Schedule
                        </span>
                      )}
                    </div>

                    {/* Response & attachment counts */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare size={12} />
                        {rfi.responseCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Paperclip size={12} />
                        {rfi.attachmentCount}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="text-[11px] text-gray-400 text-right">
                      <div>
                        Created{" "}
                        {new Date(
                          rfi.createdDate + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div>
                        Due{" "}
                        {new Date(
                          rfi.dueDate + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
