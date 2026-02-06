"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileX2,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubmittalStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Approved As Noted"
  | "Rejected"
  | "Resubmit"

type SubmittalType =
  | "Shop Drawing"
  | "Product Data"
  | "Sample"
  | "Design Data"
  | "Test Report"
  | "Certificate"
  | "Manufacturer Instructions"
  | "O&M Manual"

interface Submittal {
  id: string
  number: string
  title: string
  type: SubmittalType
  specSection: string
  status: SubmittalStatus
  submittedBy: string
  dueDate: string
  revision: number
}

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const statusStyles: Record<SubmittalStatus, string> = {
  Draft: "bg-gray-50 text-gray-700 border-gray-200",
  Submitted: "bg-blue-50 text-blue-700 border-blue-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  "Approved As Noted": "bg-lime-50 text-lime-700 border-lime-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Resubmit: "bg-orange-50 text-orange-700 border-orange-200",
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_SUBMITTALS: Submittal[] = [
  {
    id: "sub-001",
    number: "001",
    title: "Structural Steel Shop Drawings - Level 2",
    type: "Shop Drawing",
    specSection: "05 12 00",
    status: "Under Review",
    submittedBy: "Acme Steel Co.",
    dueDate: "2026-02-14",
    revision: 0,
  },
  {
    id: "sub-002",
    number: "002",
    title: "Concrete Mix Design - 5000 PSI",
    type: "Design Data",
    specSection: "03 30 00",
    status: "Approved",
    submittedBy: "Pacific Concrete",
    dueDate: "2026-01-28",
    revision: 1,
  },
  {
    id: "sub-003",
    number: "003",
    title: "Hollow Metal Door Frames",
    type: "Product Data",
    specSection: "08 11 13",
    status: "Approved As Noted",
    submittedBy: "Summit Door & Frame",
    dueDate: "2026-02-05",
    revision: 2,
  },
  {
    id: "sub-004",
    number: "004",
    title: "Exterior Stone Veneer Sample",
    type: "Sample",
    specSection: "04 42 00",
    status: "Submitted",
    submittedBy: "Horizon Masonry",
    dueDate: "2026-02-20",
    revision: 0,
  },
  {
    id: "sub-005",
    number: "005",
    title: "Fire Alarm System Wiring Diagrams",
    type: "Shop Drawing",
    specSection: "28 31 00",
    status: "Rejected",
    submittedBy: "National Fire & Safety",
    dueDate: "2026-01-30",
    revision: 1,
  },
  {
    id: "sub-006",
    number: "006",
    title: "HVAC Equipment Schedules",
    type: "Product Data",
    specSection: "23 05 00",
    status: "Draft",
    submittedBy: "Comfort Air Systems",
    dueDate: "2026-02-25",
    revision: 0,
  },
  {
    id: "sub-007",
    number: "007",
    title: "Waterproofing Membrane Test Report",
    type: "Test Report",
    specSection: "07 10 00",
    status: "Under Review",
    submittedBy: "Seal-Tight Waterproofing",
    dueDate: "2026-02-10",
    revision: 0,
  },
  {
    id: "sub-008",
    number: "008",
    title: "Elevator Manufacturer O&M Manual",
    type: "O&M Manual",
    specSection: "14 20 00",
    status: "Resubmit",
    submittedBy: "Vertical Transport Inc.",
    dueDate: "2026-02-18",
    revision: 3,
  },
  {
    id: "sub-009",
    number: "009",
    title: "Structural Steel Mill Certificates",
    type: "Certificate",
    specSection: "05 12 00",
    status: "Approved",
    submittedBy: "Acme Steel Co.",
    dueDate: "2026-01-22",
    revision: 0,
  },
  {
    id: "sub-010",
    number: "010",
    title: "Curtain Wall Installation Instructions",
    type: "Manufacturer Instructions",
    specSection: "08 44 00",
    status: "Submitted",
    submittedBy: "GlassCo Facades",
    dueDate: "2026-02-28",
    revision: 0,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatusFilterValue = "All" | SubmittalStatus
type TypeFilterValue = "All" | SubmittalType

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubmittalsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterValue>("All")
  const [typeFilter, setTypeFilter] = React.useState<TypeFilterValue>("All")

  // Filtered data
  const filtered = React.useMemo(() => {
    let items = MOCK_SUBMITTALS

    if (statusFilter !== "All") {
      items = items.filter((s) => s.status === statusFilter)
    }

    if (typeFilter !== "All") {
      items = items.filter((s) => s.type === typeFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.number.includes(q) ||
          s.specSection.toLowerCase().includes(q) ||
          s.submittedBy.toLowerCase().includes(q)
      )
    }

    return items
  }, [search, statusFilter, typeFilter])

  // Stats
  const stats = React.useMemo(() => {
    const total = MOCK_SUBMITTALS.length
    const underReview = MOCK_SUBMITTALS.filter((s) => s.status === "Under Review").length
    const approved = MOCK_SUBMITTALS.filter(
      (s) => s.status === "Approved" || s.status === "Approved As Noted"
    ).length
    const rejected = MOCK_SUBMITTALS.filter((s) => s.status === "Rejected").length
    return { total, underReview, approved, rejected }
  }, [])

  function handleView(submittal: Submittal) {
    toast.info(`Viewing submittal ${submittal.number}: ${submittal.title}`)
  }

  function exportCsv() {
    const rows = filtered.map((s) => ({
      Number: s.number,
      Title: s.title,
      Type: s.type,
      "Spec Section": s.specSection,
      Status: s.status,
      "Submitted By": s.submittedBy,
      "Due Date": s.dueDate,
      Revision: String(s.revision),
    }))

    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `submittals-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-neutral-600 mt-1">
            Track shop drawings, product data, and material submittals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Submittals</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-neutral-500" />
              <span className="text-2xl font-bold text-neutral-900">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Under Review</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-700">{stats.underReview}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Approved</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-700">{stats.approved}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center gap-2">
              <FileX2 className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-700">{stats.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, number, spec section, or submitter..."
              className="sm:w-96"
            />

            <div className="flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Approved As Noted">Approved As Noted</option>
                <option value="Rejected">Rejected</option>
                <option value="Resubmit">Resubmit</option>
              </select>

              <select
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilterValue)}
                aria-label="Filter by type"
              >
                <option value="All">All types</option>
                <option value="Shop Drawing">Shop Drawing</option>
                <option value="Product Data">Product Data</option>
                <option value="Sample">Sample</option>
                <option value="Design Data">Design Data</option>
                <option value="Test Report">Test Report</option>
                <option value="Certificate">Certificate</option>
                <option value="Manufacturer Instructions">Manufacturer Instructions</option>
                <option value="O&M Manual">O&amp;M Manual</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            Showing <span className="font-medium text-neutral-900">{filtered.length}</span> of{" "}
            <span className="font-medium text-neutral-900">{MOCK_SUBMITTALS.length}</span> submittals
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">#</th>
              <th className="text-left font-medium px-4 py-3">Title</th>
              <th className="text-left font-medium px-4 py-3">Type</th>
              <th className="text-left font-medium px-4 py-3">Spec Section</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Submitted By</th>
              <th className="text-left font-medium px-4 py-3">Due Date</th>
              <th className="text-left font-medium px-4 py-3">Revision #</th>
              <th className="text-right font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((s) => {
                const due = new Date(s.dueDate)
                const isOverdue = due.getTime() < Date.now() && s.status !== "Approved" && s.status !== "Approved As Noted"

                return (
                  <tr key={s.id} className="border-t hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-mono text-neutral-500">{s.number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{s.title}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{s.type}</td>
                    <td className="px-4 py-3 font-mono text-neutral-700">{s.specSection}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusStyles[s.status]
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{s.submittedBy}</td>
                    <td className={cn("px-4 py-3", isOverdue && "text-red-700 font-medium")}>
                      {format(due, "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-700">
                      {s.revision > 0 ? `Rev ${s.revision}` : "Original"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(s)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-10 w-10 text-neutral-300" />
                    <p className="text-neutral-600 font-medium">No submittals found</p>
                    <p className="text-sm text-neutral-500">
                      Try adjusting your search or filter criteria.
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
