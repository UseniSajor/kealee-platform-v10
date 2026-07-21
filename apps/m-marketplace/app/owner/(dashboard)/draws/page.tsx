"use client"

import * as React from "react"
import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@kealee/ui/card"
import { useOwnerProfile } from "@owner/lib/user-context"
import {
  getDraws,
  getDrawStats,
  type DrawRequest,
  type DrawStats,
} from "@owner/lib/client-api"
import { supabase } from "@owner/lib/supabase"

// ---------------------------------------------------------------------------
// Types & Config
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

function formatCurrency(value: number) {
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

export default function LenderDrawsPage() {
  const [draws, setDraws] = React.useState<DrawRequest[]>([])
  const [stats, setStats] = React.useState<DrawStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/owner/projects`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        )
        if (!res.ok) throw new Error("Failed to load projects")
        const data = await res.json()
        const projects = data.projects || []
        const mfProject = projects.find((p: any) =>
          ["Multifamily", "Mixed-Use", "MULTIFAMILY", "MIXED_USE"].includes(p.category || ""),
        ) || projects[0]

        if (mfProject) {
          const [drawsRes, statsRes] = await Promise.all([
            getDraws(mfProject.id),
            getDrawStats(mfProject.id),
          ])
          setDraws(drawsRes.draws || [])
          setStats(statsRes)
        }
      } catch (err) {
        console.warn("Failed to load draws:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalScheduled = stats?.totalScheduled ?? draws.reduce((s, d) => s + d.scheduledAmount, 0)
  const totalBilled = stats?.totalBilled ?? draws.reduce((s, d) => s + d.previouslyBilled + d.currentBilling, 0)
  const totalFunded = stats?.totalFunded ?? draws.filter(d => d.status === "FUNDED").reduce((s, d) => s + d.currentBilling, 0)
  const pendingDraws = stats?.pending ?? draws.filter(d => ["DRAFT", "SUBMITTED", "IN_REVIEW"].includes(d.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Lender Draws</h1>
        <p className="text-sm text-gray-500">
          Track draw requests and loan disbursements for your project
        </p>
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
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalFunded)}</p>
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

      {/* Progress Bar */}
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
                style={{ width: `${Math.min(100, (totalBilled / totalScheduled) * 100)}%` }}
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
            <h3 className="font-semibold text-gray-700 mb-1">No draw requests yet</h3>
            <p className="text-sm text-gray-500">
              Your project manager will create draw requests as construction progresses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => {
            const cfg = STATUS_CONFIG[draw.status as DrawStatus] ?? STATUS_CONFIG.DRAFT
            const pctComplete = draw.scheduledAmount > 0
              ? Math.round(((draw.previouslyBilled + draw.currentBilling) / draw.scheduledAmount) * 100)
              : 0

            return (
              <Card key={draw.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">Draw #{draw.drawNumber}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {draw.description}
                        {draw.periodEnd && ` — Period ending ${new Date(draw.periodEnd).toLocaleDateString()}`}
                      </p>
                      <div className="flex gap-6 mt-2 text-sm">
                        <div>
                          <span className="text-gray-400">Scheduled: </span>
                          <span className="font-medium">{formatCurrency(draw.scheduledAmount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">This Period: </span>
                          <span className="font-medium">{formatCurrency(draw.currentBilling)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Complete: </span>
                          <span className="font-medium">{pctComplete}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
