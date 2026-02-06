"use client"

import * as React from "react"
import {
  FileEdit,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Filter,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ChangeOrderStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Void"

type ChangeOrder = {
  id: string
  number: string
  title: string
  status: ChangeOrderStatus
  costImpact: number
  scheduleImpact: number
  requestedBy: string
  requestedDate: Date
  approvedBy: string | null
  description: string
}

const STATUS_STYLES: Record<ChangeOrderStatus, string> = {
  Draft: "bg-neutral-50 text-neutral-700 border-neutral-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Void: "bg-neutral-50 text-neutral-500 border-neutral-200",
}

const STATUSES: ChangeOrderStatus[] = ["Draft", "Pending", "Approved", "Rejected", "Void"]

const INITIAL_CHANGE_ORDERS: ChangeOrder[] = [
  {
    id: "co-1",
    number: "CO-001",
    title: "Additional structural reinforcement at grid line C",
    status: "Approved",
    costImpact: 24500,
    scheduleImpact: 5,
    requestedBy: "Mike Torres",
    requestedDate: new Date("2025-11-12"),
    approvedBy: "Sarah Chen",
    description: "Structural engineer requires additional rebar and concrete at grid line C due to revised soil report.",
  },
  {
    id: "co-2",
    number: "CO-002",
    title: "Upgrade HVAC units to high-efficiency models",
    status: "Approved",
    costImpact: 18750,
    scheduleImpact: 0,
    requestedBy: "Lisa Nguyen",
    requestedDate: new Date("2025-11-20"),
    approvedBy: "Sarah Chen",
    description: "Owner requested upgrade to SEER 20 units for LEED certification points.",
  },
  {
    id: "co-3",
    number: "CO-003",
    title: "Delete landscaping scope from Phase 1",
    status: "Approved",
    costImpact: -32000,
    scheduleImpact: -10,
    requestedBy: "Sarah Chen",
    requestedDate: new Date("2025-12-03"),
    approvedBy: "James Park",
    description: "Landscaping deferred to Phase 2 per owner directive. Credit issued.",
  },
  {
    id: "co-4",
    number: "CO-004",
    title: "Relocate electrical panel from Room 104 to Room 108",
    status: "Pending",
    costImpact: 8200,
    scheduleImpact: 3,
    requestedBy: "David Kim",
    requestedDate: new Date("2026-01-08"),
    approvedBy: null,
    description: "Architect revised floor plan; electrical panel must be relocated to accommodate new partition wall.",
  },
  {
    id: "co-5",
    number: "CO-005",
    title: "Add fire suppression to server room",
    status: "Pending",
    costImpact: 41200,
    scheduleImpact: 7,
    requestedBy: "Mike Torres",
    requestedDate: new Date("2026-01-14"),
    approvedBy: null,
    description: "Code review revealed server room requires FM-200 clean agent fire suppression system.",
  },
  {
    id: "co-6",
    number: "CO-006",
    title: "Substitute porcelain tile for ceramic in lobby",
    status: "Draft",
    costImpact: 5600,
    scheduleImpact: 0,
    requestedBy: "Lisa Nguyen",
    requestedDate: new Date("2026-01-22"),
    approvedBy: null,
    description: "Interior designer recommends porcelain for increased durability in high-traffic lobby area.",
  },
  {
    id: "co-7",
    number: "CO-007",
    title: "Remove contaminated soil at northeast corner",
    status: "Approved",
    costImpact: 67800,
    scheduleImpact: 12,
    requestedBy: "David Kim",
    requestedDate: new Date("2025-12-18"),
    approvedBy: "James Park",
    description: "Environmental testing discovered contaminated soil requiring hazmat removal and clean backfill.",
  },
  {
    id: "co-8",
    number: "CO-008",
    title: "Credit for owner-furnished kitchen equipment",
    status: "Rejected",
    costImpact: -15400,
    scheduleImpact: 0,
    requestedBy: "Sarah Chen",
    requestedDate: new Date("2026-01-05"),
    approvedBy: null,
    description: "Owner proposed furnishing kitchen equipment directly. Rejected due to warranty coordination concerns.",
  },
  {
    id: "co-9",
    number: "CO-009",
    title: "Add EV charging stations to parking garage",
    status: "Pending",
    costImpact: 28900,
    scheduleImpact: 4,
    requestedBy: "James Park",
    requestedDate: new Date("2026-01-28"),
    approvedBy: null,
    description: "Owner requests 8 Level 2 EV charging stations per updated tenant requirements.",
  },
  {
    id: "co-10",
    number: "CO-010",
    title: "Void duplicate waterproofing CO",
    status: "Void",
    costImpact: 12300,
    scheduleImpact: 2,
    requestedBy: "Mike Torres",
    requestedDate: new Date("2025-12-10"),
    approvedBy: null,
    description: "Duplicate entry for waterproofing scope already covered under CO-001. Voided.",
  },
]

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (value < 0) return `(${formatted})`
  return formatted
}

export default function ChangeOrdersPage() {
  const [changeOrders, setChangeOrders] = React.useState<ChangeOrder[]>(INITIAL_CHANGE_ORDERS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"All" | ChangeOrderStatus>("All")

  const filteredOrders = React.useMemo(() => {
    let result = changeOrders
    if (statusFilter !== "All") {
      result = result.filter((co) => co.status === statusFilter)
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (co) =>
          co.number.toLowerCase().includes(q) ||
          co.title.toLowerCase().includes(q) ||
          co.requestedBy.toLowerCase().includes(q) ||
          co.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [changeOrders, searchQuery, statusFilter])

  const stats = React.useMemo(() => {
    const active = changeOrders.filter((co) => co.status !== "Void")
    const pending = changeOrders.filter((co) => co.status === "Pending")
    const totalCost = active.reduce((sum, co) => sum + co.costImpact, 0)
    const totalSchedule = active.reduce((sum, co) => sum + co.scheduleImpact, 0)
    return {
      total: changeOrders.length,
      pending: pending.length,
      totalCost,
      totalSchedule,
    }
  }, [changeOrders])

  const tableTotals = React.useMemo(() => {
    const costSum = filteredOrders.reduce((sum, co) => sum + co.costImpact, 0)
    const scheduleSum = filteredOrders.reduce((sum, co) => sum + co.scheduleImpact, 0)
    return { costSum, scheduleSum }
  }, [filteredOrders])

  function handleApprove(id: string) {
    setChangeOrders((prev) =>
      prev.map((co) =>
        co.id === id ? { ...co, status: "Approved" as ChangeOrderStatus, approvedBy: "Current User" } : co
      )
    )
  }

  function handleReject(id: string) {
    setChangeOrders((prev) =>
      prev.map((co) =>
        co.id === id ? { ...co, status: "Rejected" as ChangeOrderStatus } : co
      )
    )
  }

  function handleAddDraft() {
    const nextNum = changeOrders.length + 1
    const newCO: ChangeOrder = {
      id: `co-${nextNum}`,
      number: `CO-${String(nextNum).padStart(3, "0")}`,
      title: "New change order (draft)",
      status: "Draft",
      costImpact: 0,
      scheduleImpact: 0,
      requestedBy: "Current User",
      requestedDate: new Date(),
      approvedBy: null,
      description: "New change order created as draft.",
    }
    setChangeOrders((prev) => [...prev, newCO])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Orders</h1>
          <p className="text-neutral-600 mt-1">Track scope changes, approvals, and cost/schedule impacts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleAddDraft}>
            <Plus className="h-4 w-4" />
            New Change Order
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <FileEdit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Total COs</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Pending Approval</div>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Total Cost Impact</div>
                <div className={cn("text-2xl font-bold", stats.totalCost >= 0 ? "text-red-600" : "text-emerald-600")}>
                  {stats.totalCost >= 0 ? "+" : "-"}
                  {formatCurrency(stats.totalCost)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Schedule Impact</div>
                <div className="text-2xl font-bold">
                  {stats.totalSchedule >= 0 ? "+" : ""}
                  {stats.totalSchedule} days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search change orders..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-500" />
              <div className="flex flex-wrap gap-1">
                {(["All", ...STATUSES] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">CO #</th>
                  <th className="text-left font-medium px-4 py-3">Title</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Cost Impact</th>
                  <th className="text-right font-medium px-4 py-3">Schedule Impact (days)</th>
                  <th className="text-left font-medium px-4 py-3">Requested By</th>
                  <th className="text-left font-medium px-4 py-3">Requested Date</th>
                  <th className="text-left font-medium px-4 py-3">Approved By</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((co) => (
                  <tr key={co.id} className="border-t hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{co.number}</td>
                    <td className="px-4 py-3 text-neutral-700 max-w-[280px] truncate" title={co.title}>
                      {co.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          STATUS_STYLES[co.status]
                        )}
                      >
                        {co.status}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-medium tabular-nums",
                        co.costImpact > 0
                          ? "text-red-600"
                          : co.costImpact < 0
                            ? "text-emerald-600"
                            : "text-neutral-700"
                      )}
                    >
                      {co.costImpact > 0 && "+"}
                      {formatCurrency(co.costImpact)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        co.scheduleImpact > 0
                          ? "text-red-600"
                          : co.scheduleImpact < 0
                            ? "text-emerald-600"
                            : "text-neutral-700"
                      )}
                    >
                      {co.scheduleImpact > 0 && "+"}
                      {co.scheduleImpact}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{co.requestedBy}</td>
                    <td className="px-4 py-3 text-neutral-700">{format(co.requestedDate, "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-neutral-700">{co.approvedBy ?? "\u2014"}</td>
                    <td className="px-4 py-3 text-right">
                      {co.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(co.id)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(co.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => alert(`View details for ${co.number}`)}>
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!filteredOrders.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-neutral-600">
                      No change orders match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {filteredOrders.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-neutral-300 bg-neutral-50 font-semibold">
                    <td className="px-4 py-3" colSpan={3}>
                      Totals ({filteredOrders.length} items)
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        tableTotals.costSum > 0
                          ? "text-red-600"
                          : tableTotals.costSum < 0
                            ? "text-emerald-600"
                            : "text-neutral-700"
                      )}
                    >
                      {tableTotals.costSum > 0 && "+"}
                      {formatCurrency(tableTotals.costSum)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        tableTotals.scheduleSum > 0
                          ? "text-red-600"
                          : tableTotals.scheduleSum < 0
                            ? "text-emerald-600"
                            : "text-neutral-700"
                      )}
                    >
                      {tableTotals.scheduleSum > 0 && "+"}
                      {tableTotals.scheduleSum}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
