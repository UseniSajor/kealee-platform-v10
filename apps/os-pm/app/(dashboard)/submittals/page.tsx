"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  Inbox,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type SubmittalStatus =
  | "pending"
  | "under-review"
  | "approved"
  | "approved-as-noted"
  | "rejected"
  | "revise-resubmit"

interface Submittal {
  id: string
  number: string
  title: string
  specSection: string
  specTitle: string
  submittedBy: string
  reviewer: string
  status: SubmittalStatus
  submitDate: string
  requiredDate: string
  ballInCourt: string
}

const STATUS_STYLES: Record<SubmittalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  "under-review": "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  "approved-as-noted": "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  "revise-resubmit": "bg-orange-100 text-orange-800",
}

const STATUS_LABELS: Record<SubmittalStatus, string> = {
  pending: "Pending",
  "under-review": "Under Review",
  approved: "Approved",
  "approved-as-noted": "Approved as Noted",
  rejected: "Rejected",
  "revise-resubmit": "Revise & Resubmit",
}

const MOCK_SUBMITTALS: Submittal[] = [
  {
    id: "1",
    number: "SUB-001",
    title: "Concrete Mix Design - 5000 PSI",
    specSection: "03 30 00",
    specTitle: "Cast-in-Place Concrete",
    submittedBy: "Atlas Concrete Inc.",
    reviewer: "Martinez Structural Engineers",
    status: "approved",
    submitDate: "2026-01-15",
    requiredDate: "2026-01-29",
    ballInCourt: "Resolved",
  },
  {
    id: "2",
    number: "SUB-002",
    title: "Structural Steel Shop Drawings",
    specSection: "05 12 00",
    specTitle: "Structural Steel Framing",
    submittedBy: "Ironworks Fabricators LLC",
    reviewer: "Martinez Structural Engineers",
    status: "under-review",
    submitDate: "2026-01-22",
    requiredDate: "2026-02-12",
    ballInCourt: "Structural Engineer",
  },
  {
    id: "3",
    number: "SUB-003",
    title: "HVAC Rooftop Units - Carrier 50XC",
    specSection: "23 74 00",
    specTitle: "Packaged Outdoor HVAC Equipment",
    submittedBy: "ProAir Mechanical Corp.",
    reviewer: "Summit MEP Consultants",
    status: "approved-as-noted",
    submitDate: "2026-01-25",
    requiredDate: "2026-02-08",
    ballInCourt: "Contractor",
  },
  {
    id: "4",
    number: "SUB-004",
    title: "Plumbing Fixtures - Kohler Commercial",
    specSection: "22 40 00",
    specTitle: "Plumbing Fixtures",
    submittedBy: "Western Plumbing Solutions",
    reviewer: "Summit MEP Consultants",
    status: "pending",
    submitDate: "2026-02-01",
    requiredDate: "2026-02-15",
    ballInCourt: "MEP Engineer",
  },
  {
    id: "5",
    number: "SUB-005",
    title: "Electrical Distribution Panels",
    specSection: "26 24 16",
    specTitle: "Panelboards",
    submittedBy: "Apex Electrical Contractors",
    reviewer: "Summit MEP Consultants",
    status: "rejected",
    submitDate: "2026-01-28",
    requiredDate: "2026-02-11",
    ballInCourt: "Electrical Contractor",
  },
  {
    id: "6",
    number: "SUB-006",
    title: "TPO Roofing Membrane System",
    specSection: "07 54 23",
    specTitle: "Thermoplastic Polyolefin Roofing",
    submittedBy: "Summit Roofing Co.",
    reviewer: "Whitfield Architects",
    status: "under-review",
    submitDate: "2026-02-03",
    requiredDate: "2026-02-17",
    ballInCourt: "Architect",
  },
  {
    id: "7",
    number: "SUB-007",
    title: "Curtain Wall Shop Drawings - North Elevation",
    specSection: "08 44 13",
    specTitle: "Glazed Aluminum Curtain Walls",
    submittedBy: "Clearview Glass Systems",
    reviewer: "Whitfield Architects",
    status: "revise-resubmit",
    submitDate: "2026-01-20",
    requiredDate: "2026-02-03",
    ballInCourt: "Curtain Wall Sub",
  },
  {
    id: "8",
    number: "SUB-008",
    title: "Fire Suppression Sprinkler Layout",
    specSection: "21 13 13",
    specTitle: "Wet-Pipe Sprinkler Systems",
    submittedBy: "Guardian Fire Protection",
    reviewer: "Summit MEP Consultants",
    status: "approved",
    submitDate: "2026-01-18",
    requiredDate: "2026-02-01",
    ballInCourt: "Resolved",
  },
  {
    id: "9",
    number: "SUB-009",
    title: "Elevator Equipment - Otis Gen3",
    specSection: "14 21 00",
    specTitle: "Electric Traction Elevators",
    submittedBy: "Otis Elevator Company",
    reviewer: "Whitfield Architects",
    status: "pending",
    submitDate: "2026-02-05",
    requiredDate: "2026-02-19",
    ballInCourt: "Architect",
  },
  {
    id: "10",
    number: "SUB-010",
    title: "Door Hardware Schedule & Catalog Cuts",
    specSection: "08 71 00",
    specTitle: "Door Hardware",
    submittedBy: "Pacific Door & Hardware",
    reviewer: "Whitfield Architects",
    status: "under-review",
    submitDate: "2026-02-06",
    requiredDate: "2026-02-20",
    ballInCourt: "Architect",
  },
]

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "under-review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "approved-as-noted", label: "Approved as Noted" },
  { key: "rejected", label: "Rejected" },
  { key: "revise-resubmit", label: "Revise & Resubmit" },
] as const

export default function SubmittalsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filtered = React.useMemo(() => {
    return MOCK_SUBMITTALS.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.number.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.specSection.includes(q) ||
          s.submittedBy.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, statusFilter])

  const stats = React.useMemo(
    () => ({
      total: MOCK_SUBMITTALS.length,
      pending: MOCK_SUBMITTALS.filter(
        (s) => s.status === "pending" || s.status === "under-review"
      ).length,
      approved: MOCK_SUBMITTALS.filter(
        (s) => s.status === "approved" || s.status === "approved-as-noted"
      ).length,
      rejected: MOCK_SUBMITTALS.filter((s) => s.status === "rejected").length,
      revise: MOCK_SUBMITTALS.filter((s) => s.status === "revise-resubmit")
        .length,
    }),
    []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submittals</h1>
          <p className="text-gray-500 mt-1">
            Track and manage construction submittals and approvals
          </p>
        </div>
        <Link href="/submittals/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Submittal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Inbox,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: Clock,
            color: "text-yellow-600 bg-yellow-50",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Revise & Resubmit",
            value: stats.revise,
            icon: RotateCcw,
            color: "text-orange-600 bg-orange-50",
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

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search by number, title, spec section, or submitter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    statusFilter === tab.key
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

      {/* Submittals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Submittal #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Spec Section
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Submitted By
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Reviewer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Submit Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Required Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Ball-in-Court
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/submittals/${sub.id}`)
                    }
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">
                      {sub.number}
                    </td>
                    <td className="px-4 py-3 max-w-[240px] truncate">
                      {sub.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {sub.specSection}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {sub.submittedBy}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.reviewer}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          STATUS_STYLES[sub.status]
                        )}
                      >
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(
                        sub.submitDate + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(
                        sub.requiredDate + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {sub.ballInCourt}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No submittals match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
