"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react"
import { useSubmittals } from "@pm/hooks/useSubmittals"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"

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

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "under-review", label: "Under Review" },
  { key: "approved", label: "Approved" },
  { key: "approved-as-noted", label: "Approved as Noted" },
  { key: "rejected", label: "Rejected" },
  { key: "revise-resubmit", label: "Revise & Resubmit" },
] as const

// ---------------------------------------------------------------------------
// Aging helpers
// ---------------------------------------------------------------------------

function getDaysOpen(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  )
}

function getAgingBorder(daysOpen: number): string {
  if (daysOpen >= 15) return "border-l-4 border-red-500"
  if (daysOpen >= 7) return "border-l-4 border-amber-500"
  return "border-l-4 border-green-500"
}

function isSubmittalAgingApplicable(status: SubmittalStatus): boolean {
  return status === "pending" || status === "under-review"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubmittalsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const { data, isLoading } = useSubmittals({ status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined })
  const submittals = data?.items ?? []

  if (isLoading) return (<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>)

  const filtered = submittals

  const stats = {
    total: submittals.length,
    pending: submittals.filter(
      (s) => s.status === "pending" || s.status === "under-review"
    ).length,
    approved: submittals.filter(
      (s) => s.status === "approved" || s.status === "approved-as-noted"
    ).length,
    rejected: submittals.filter((s) => s.status === "rejected").length,
    revise: submittals.filter((s) => s.status === "revise-resubmit")
      .length,
    overdue: submittals.filter(
      (s) =>
        isSubmittalAgingApplicable(s.status) &&
        getDaysOpen(s.submitDate ?? (s as any).createdAt) >= 15
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submittals</h1>
          <p className="text-gray-500 mt-1">
            Track and manage submittals and approvals
          </p>
        </div>
        <Link href="/pm/submittals/new">
          <Button className="gap-2">
            <Plus size={16} />
            New Submittal
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          {
            label: "Overdue",
            value: stats.overdue,
            icon: AlertTriangle,
            color: "text-red-600 bg-red-50",
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
                {filtered.map((sub) => {
                  const daysOpen = getDaysOpen(sub.submitDate ?? (sub as any).createdAt)
                  const agingClass = isSubmittalAgingApplicable(sub.status)
                    ? getAgingBorder(daysOpen)
                    : ""

                  return (
                  <tr
                    key={sub.id}
                    className={cn("border-b hover:bg-gray-50 cursor-pointer", agingClass)}
                    onClick={() =>
                      (window.location.href = `/pm/submittals/${sub.id}`)
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
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                            STATUS_STYLES[sub.status]
                          )}
                        >
                          {STATUS_LABELS[sub.status]}
                        </span>
                        {isSubmittalAgingApplicable(sub.status) && daysOpen >= 15 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                            Overdue
                          </span>
                        )}
                      </div>
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
                  )
                })}
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

