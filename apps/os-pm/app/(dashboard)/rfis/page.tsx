"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  FileQuestion,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RfiStatus = "Draft" | "Open" | "Pending Review" | "Answered" | "Closed"
type RfiPriority = "Low" | "Medium" | "High" | "Urgent"

interface Rfi {
  id: string
  number: number
  subject: string
  status: RfiStatus
  priority: RfiPriority
  assignedTo: string
  dueDate: string
  costImpact: number | null
  createdAt: string
  project: string
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const MOCK_RFIS: Rfi[] = [
  {
    id: "rfi-001",
    number: 1,
    subject: "Structural steel connection detail at grid line B-4",
    status: "Open",
    priority: "High",
    assignedTo: "Sarah Chen",
    dueDate: "2026-02-10",
    costImpact: 12500,
    createdAt: "2026-01-15",
    project: "Harbor View Tower",
  },
  {
    id: "rfi-002",
    number: 2,
    subject: "MEP routing conflict in ceiling plenum - Level 3",
    status: "Pending Review",
    priority: "Urgent",
    assignedTo: "James Miller",
    dueDate: "2026-02-08",
    costImpact: 8200,
    createdAt: "2026-01-18",
    project: "Harbor View Tower",
  },
  {
    id: "rfi-003",
    number: 3,
    subject: "Exterior cladding material substitution request",
    status: "Answered",
    priority: "Medium",
    assignedTo: "Maria Lopez",
    dueDate: "2026-02-05",
    costImpact: 45000,
    createdAt: "2026-01-20",
    project: "Riverside Commercial",
  },
  {
    id: "rfi-004",
    number: 4,
    subject: "Foundation waterproofing specification clarification",
    status: "Open",
    priority: "High",
    assignedTo: "David Park",
    dueDate: "2026-02-12",
    costImpact: null,
    createdAt: "2026-01-22",
    project: "Riverside Commercial",
  },
  {
    id: "rfi-005",
    number: 5,
    subject: "Fire-rated partition wall assembly at stairwell B",
    status: "Draft",
    priority: "Medium",
    assignedTo: "Sarah Chen",
    dueDate: "2026-02-18",
    costImpact: null,
    createdAt: "2026-01-25",
    project: "Harbor View Tower",
  },
  {
    id: "rfi-006",
    number: 6,
    subject: "Elevator pit depth discrepancy between architectural and structural drawings",
    status: "Open",
    priority: "Urgent",
    assignedTo: "James Miller",
    dueDate: "2026-02-07",
    costImpact: 22000,
    createdAt: "2026-01-26",
    project: "Maple Ridge School",
  },
  {
    id: "rfi-007",
    number: 7,
    subject: "Landscape irrigation system tie-in location",
    status: "Closed",
    priority: "Low",
    assignedTo: "Maria Lopez",
    dueDate: "2026-01-30",
    costImpact: 3500,
    createdAt: "2026-01-10",
    project: "Riverside Commercial",
  },
  {
    id: "rfi-008",
    number: 8,
    subject: "ADA compliance - parking lot slope exceeds maximum grade",
    status: "Pending Review",
    priority: "High",
    assignedTo: "David Park",
    dueDate: "2026-02-14",
    costImpact: 18700,
    createdAt: "2026-01-28",
    project: "Maple Ridge School",
  },
  {
    id: "rfi-009",
    number: 9,
    subject: "Rooftop mechanical unit structural support requirements",
    status: "Open",
    priority: "Medium",
    assignedTo: "Sarah Chen",
    dueDate: "2026-02-20",
    costImpact: 9800,
    createdAt: "2026-01-30",
    project: "Harbor View Tower",
  },
  {
    id: "rfi-010",
    number: 10,
    subject: "Concrete mix design for exposed aggregate finish at lobby",
    status: "Answered",
    priority: "Low",
    assignedTo: "James Miller",
    dueDate: "2026-02-03",
    costImpact: null,
    createdAt: "2026-02-01",
    project: "Harbor View Tower",
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: RfiStatus[] = ["Draft", "Open", "Pending Review", "Answered", "Closed"]
const PRIORITY_OPTIONS: RfiPriority[] = ["Low", "Medium", "High", "Urgent"]

function statusColor(status: RfiStatus): string {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "Open":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Pending Review":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Answered":
      return "bg-green-50 text-green-700 border-green-200"
    case "Closed":
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function priorityColor(priority: RfiPriority): string {
  switch (priority) {
    case "Low":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "Medium":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "Urgent":
      return "bg-red-50 text-red-700 border-red-200"
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RfisPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"All" | RfiStatus>("All")
  const [priorityFilter, setPriorityFilter] = React.useState<"All" | RfiPriority>("All")

  // Filtering
  const filtered = React.useMemo(() => {
    let items = MOCK_RFIS

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.assignedTo.toLowerCase().includes(q) ||
          r.project.toLowerCase().includes(q) ||
          String(r.number).includes(q)
      )
    }

    if (statusFilter !== "All") {
      items = items.filter((r) => r.status === statusFilter)
    }

    if (priorityFilter !== "All") {
      items = items.filter((r) => r.priority === priorityFilter)
    }

    return items
  }, [search, statusFilter, priorityFilter])

  // Stats computed from the full (unfiltered) dataset
  const stats = React.useMemo(() => {
    const now = new Date()
    const open = MOCK_RFIS.filter((r) => r.status === "Open").length
    const overdue = MOCK_RFIS.filter(
      (r) =>
        r.status !== "Closed" &&
        r.status !== "Answered" &&
        new Date(r.dueDate) < now
    ).length
    const pendingReview = MOCK_RFIS.filter((r) => r.status === "Pending Review").length
    const answered = MOCK_RFIS.filter((r) => r.status === "Answered").length
    return { open, overdue, pendingReview, answered }
  }, [])

  function handleRowClick(rfi: Rfi) {
    toast.info(`RFI #${rfi.number}: ${rfi.subject}`)
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-3xl font-bold">RFIs</h1>
        <p className="text-neutral-600 mt-1">
          Track and manage Requests for Information across all projects.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Stats row                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Open RFIs</CardTitle>
            <FileQuestion className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Answered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.answered}</div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Filters                                                           */}
      {/* ----------------------------------------------------------------- */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject, assignee, or project..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | RfiStatus)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as "All" | RfiPriority)}
                aria-label="Filter by priority"
              >
                <option value="All">All priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            Showing <span className="font-medium text-neutral-900">{filtered.length}</span> of{" "}
            <span className="font-medium text-neutral-900">{MOCK_RFIS.length}</span> RFIs
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Table                                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left font-medium px-4 py-3 w-16">#</th>
              <th className="text-left font-medium px-4 py-3">Subject</th>
              <th className="text-left font-medium px-4 py-3 w-32">Status</th>
              <th className="text-left font-medium px-4 py-3 w-24">Priority</th>
              <th className="text-left font-medium px-4 py-3 w-36">Assigned To</th>
              <th className="text-left font-medium px-4 py-3 w-28">Due Date</th>
              <th className="text-right font-medium px-4 py-3 w-28">Cost Impact</th>
              <th className="text-left font-medium px-4 py-3 w-28">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((rfi) => {
                const due = new Date(rfi.dueDate)
                const created = new Date(rfi.createdAt)
                const isOverdue =
                  rfi.status !== "Closed" &&
                  rfi.status !== "Answered" &&
                  due < new Date()

                return (
                  <tr
                    key={rfi.id}
                    className="border-t hover:bg-neutral-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(rfi)}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-500">
                      {rfi.number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{rfi.subject}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{rfi.project}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusColor(rfi.status)
                        )}
                      >
                        {rfi.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          priorityColor(rfi.priority)
                        )}
                      >
                        {rfi.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{rfi.assignedTo}</td>
                    <td
                      className={cn(
                        "px-4 py-3",
                        isOverdue ? "text-red-700 font-medium" : "text-neutral-700"
                      )}
                    >
                      {format(due, "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {rfi.costImpact !== null ? (
                        formatCurrency(rfi.costImpact)
                      ) : (
                        <span className="text-neutral-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {format(created, "MMM dd, yyyy")}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <MessageSquare className="h-10 w-10 text-neutral-300" />
                    <p className="text-neutral-600 font-medium">No RFIs found</p>
                    <p className="text-sm text-neutral-500">
                      {search || statusFilter !== "All" || priorityFilter !== "All"
                        ? "Try adjusting your filters to find what you are looking for."
                        : "No Requests for Information have been created yet."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
