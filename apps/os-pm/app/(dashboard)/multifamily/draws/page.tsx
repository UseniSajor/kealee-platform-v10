"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Send,
  TrendingUp,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useCreateDraw, useUpdateDraw, useSubmitDraw, useApproveDraw } from "@/hooks/useMultifamily"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrawStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "FUNDED" | "REJECTED"

const STATUS_CONFIG: Record<DrawStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  SUBMITTED: { label: "Submitted", color: "text-blue-700", bg: "bg-blue-100" },
  IN_REVIEW: { label: "In Review", color: "text-yellow-700", bg: "bg-yellow-100" },
  APPROVED: { label: "Approved", color: "text-green-700", bg: "bg-green-100" },
  FUNDED: { label: "Funded", color: "text-emerald-800", bg: "bg-emerald-100" },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
}

interface Draw {
  id: string
  number: number
  periodEnd: string
  description: string
  scheduledAmount: number
  previouslyBilled: number
  currentBilling: number
  retainage: number
  status: DrawStatus
  submittedAt?: string
  fundedAt?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LenderDrawsPage() {
  const createDraw = useCreateDraw()
  const updateDraw = useUpdateDraw()
  const submitDraw = useSubmitDraw()
  const approveDraw = useApproveDraw()
  const [draws, setDraws] = React.useState<Draw[]>([])
  const [showNewDraw, setShowNewDraw] = React.useState(false)
  const [newDraw, setNewDraw] = React.useState({
    periodEnd: "",
    description: "",
    scheduledAmount: 0,
    previouslyBilled: 0,
    currentBilling: 0,
    retainage: 10,
  })

  // Computed stats
  const totalScheduled = draws.reduce((s, d) => s + d.scheduledAmount, 0)
  const totalBilled = draws.reduce((s, d) => s + d.previouslyBilled + d.currentBilling, 0)
  const totalFunded = draws
    .filter((d) => d.status === "FUNDED")
    .reduce((s, d) => s + d.currentBilling, 0)
  const pendingDraws = draws.filter((d) =>
    ["DRAFT", "SUBMITTED", "IN_REVIEW"].includes(d.status),
  ).length

  function addDraw() {
    const draw: Draw = {
      id: `draw-${Date.now()}`,
      number: draws.length + 1,
      periodEnd: newDraw.periodEnd,
      description: newDraw.description || `Draw #${draws.length + 1}`,
      scheduledAmount: newDraw.scheduledAmount,
      previouslyBilled: newDraw.previouslyBilled,
      currentBilling: newDraw.currentBilling,
      retainage: newDraw.retainage,
      status: "DRAFT",
    }
    setDraws((prev) => [...prev, draw])
    setShowNewDraw(false)
    setNewDraw({
      periodEnd: "",
      description: "",
      scheduledAmount: 0,
      previouslyBilled: 0,
      currentBilling: 0,
      retainage: 10,
    })
    // Persist to API
    createDraw.mutate({
      projectId: "current",
      periodEnd: newDraw.periodEnd,
      description: newDraw.description || `Draw #${draws.length + 1}`,
      scheduledAmount: newDraw.scheduledAmount,
      previouslyBilled: newDraw.previouslyBilled,
      currentBilling: newDraw.currentBilling,
      retainage: newDraw.retainage,
    })
  }

  function updateDrawStatus(id: string, status: DrawStatus) {
    // Optimistic local update
    setDraws((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              submittedAt:
                status === "SUBMITTED" ? new Date().toISOString() : d.submittedAt,
              fundedAt:
                status === "FUNDED" ? new Date().toISOString() : d.fundedAt,
            }
          : d,
      ),
    )
    // Persist to API
    if (status === "SUBMITTED") submitDraw.mutate(id)
    else if (status === "APPROVED") approveDraw.mutate(id)
    else updateDraw.mutate({ id, status })
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/multifamily">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Lender Draws</h1>
            <p className="text-sm text-gray-500">
              AIA G702/G703 draw request management
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewDraw(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Draw Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <FileText size={14} />
              Total Draws
            </div>
            <p className="text-2xl font-bold">{draws.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <DollarSign size={14} />
              Total Billed
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <CheckCircle2 size={14} />
              Total Funded
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalFunded)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Clock size={14} />
              Pending
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingDraws}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {totalScheduled > 0 && (
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Loan Draw Progress</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(totalBilled)} of {formatCurrency(totalScheduled)} (
                {Math.round((totalBilled / totalScheduled) * 100)}%)
              </p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (totalBilled / totalScheduled) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draw List */}
      {draws.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">
              No draw requests yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first draw request to start tracking lender
              disbursements.
            </p>
            <Button onClick={() => setShowNewDraw(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Draw Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => {
            const cfg = STATUS_CONFIG[draw.status]
            const pctComplete =
              draw.scheduledAmount > 0
                ? Math.round(
                    ((draw.previouslyBilled + draw.currentBilling) /
                      draw.scheduledAmount) *
                      100,
                  )
                : 0
            return (
              <Card key={draw.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">
                          Draw #{draw.number}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {draw.description}
                        {draw.periodEnd && ` — Period ending ${draw.periodEnd}`}
                      </p>
                      <div className="flex gap-6 mt-2 text-sm">
                        <div>
                          <span className="text-gray-400">Scheduled: </span>
                          <span className="font-medium">
                            {formatCurrency(draw.scheduledAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">This Period: </span>
                          <span className="font-medium">
                            {formatCurrency(draw.currentBilling)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Retainage: </span>
                          <span className="font-medium">{draw.retainage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Complete: </span>
                          <span className="font-medium">{pctComplete}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {draw.status === "DRAFT" && (
                        <Button
                          size="sm"
                          onClick={() => updateDrawStatus(draw.id, "SUBMITTED")}
                        >
                          <Send size={14} className="mr-1" />
                          Submit
                        </Button>
                      )}
                      {draw.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDrawStatus(draw.id, "IN_REVIEW")}
                        >
                          Mark In Review
                        </Button>
                      )}
                      {draw.status === "IN_REVIEW" && (
                        <Button
                          size="sm"
                          onClick={() => updateDrawStatus(draw.id, "APPROVED")}
                        >
                          <CheckCircle2 size={14} className="mr-1" />
                          Approve
                        </Button>
                      )}
                      {draw.status === "APPROVED" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateDrawStatus(draw.id, "FUNDED")}
                        >
                          <DollarSign size={14} className="mr-1" />
                          Mark Funded
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Draw Modal */}
      {showNewDraw && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>New Draw Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newDraw.description}
                  onChange={(e) =>
                    setNewDraw({ ...newDraw, description: e.target.value })
                  }
                  placeholder="e.g. Monthly Application #1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Period End Date</label>
                <Input
                  type="date"
                  value={newDraw.periodEnd}
                  onChange={(e) =>
                    setNewDraw({ ...newDraw, periodEnd: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Scheduled Value ($)
                  </label>
                  <Input
                    type="number"
                    value={newDraw.scheduledAmount || ""}
                    onChange={(e) =>
                      setNewDraw({
                        ...newDraw,
                        scheduledAmount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Current Billing ($)
                  </label>
                  <Input
                    type="number"
                    value={newDraw.currentBilling || ""}
                    onChange={(e) =>
                      setNewDraw({
                        ...newDraw,
                        currentBilling: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Previously Billed ($)
                  </label>
                  <Input
                    type="number"
                    value={newDraw.previouslyBilled || ""}
                    onChange={(e) =>
                      setNewDraw({
                        ...newDraw,
                        previouslyBilled: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Retainage (%)</label>
                  <Input
                    type="number"
                    value={newDraw.retainage}
                    onChange={(e) =>
                      setNewDraw({
                        ...newDraw,
                        retainage: parseInt(e.target.value) || 10,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewDraw(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addDraw}>Create Draw Request</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
