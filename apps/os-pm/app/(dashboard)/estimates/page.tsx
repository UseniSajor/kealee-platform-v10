"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calculator,
  DollarSign,
  FileText,
  Plus,
  Search,
  TrendingUp,
  Upload,
  Wand2,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type EstimateStatus = "draft" | "in-progress" | "review" | "approved" | "sent"
type EstimateType = "quick" | "detailed" | "bid" | "change-order"

interface Estimate {
  id: string
  name: string
  projectName: string
  type: EstimateType
  status: EstimateStatus
  totalCost: number
  sqft: number
  costPerSqFt: number
  preparedBy: string
  createdAt: string
  updatedAt: string
  aiGenerated: boolean
}

const STATUS_STYLES: Record<EstimateStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  sent: "bg-purple-100 text-purple-800",
}

const TYPE_LABELS: Record<EstimateType, string> = {
  quick: "Quick Budget",
  detailed: "Detailed",
  bid: "Bid Estimate",
  "change-order": "Change Order",
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
}

export default function EstimatesPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [estimates, setEstimates] = React.useState<Estimate[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // In production, this would use React Query to fetch from estimation API
  // For now, show empty state encouraging users to create their first estimate

  const stats = React.useMemo(() => ({
    total: estimates.length,
    totalValue: estimates.reduce((s, e) => s + e.totalCost, 0),
    pending: estimates.filter(e => e.status === "review" || e.status === "in-progress").length,
    aiGenerated: estimates.filter(e => e.aiGenerated).length,
  }), [estimates])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-500 mt-1">Construction cost estimation and AI-powered takeoffs</p>
        </div>
        <div className="flex gap-2">
          <Link href="/estimates/ai-takeoff">
            <Button variant="outline" className="gap-2">
              <Wand2 size={16} />
              AI Takeoff
            </Button>
          </Link>
          <Link href="/estimates/new">
            <Button className="gap-2">
              <Plus size={16} />
              New Estimate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Estimates", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "Total Value", value: fmt(stats.totalValue), icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Pending Review", value: stats.pending, icon: TrendingUp, color: "text-yellow-600 bg-yellow-50" },
          { label: "AI Generated", value: stats.aiGenerated, icon: Wand2, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}><s.icon size={20} /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search estimates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "draft", "in-progress", "review", "approved", "sent"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {estimates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calculator size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No estimates yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first estimate manually or use AI-powered takeoff to automatically extract quantities from your construction plans and photos.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/estimates/ai-takeoff">
                <Button variant="outline" className="gap-2">
                  <Wand2 size={16} />
                  Upload Plans for AI Takeoff
                </Button>
              </Link>
              <Link href="/estimates/new">
                <Button className="gap-2">
                  <Plus size={16} />
                  Create Manual Estimate
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium">Estimate</th>
                    <th className="text-left px-4 py-3 font-medium">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-right px-4 py-3 font-medium">$/SF</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((est) => (
                    <tr key={est.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/estimates/${est.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{est.name}</span>
                          {est.aiGenerated && <Wand2 size={14} className="text-purple-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{est.projectName}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{TYPE_LABELS[est.type]}</span></td>
                      <td className="px-4 py-3 text-right font-medium">{fmt(est.totalCost)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(est.costPerSqFt)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[est.status])}>
                          {est.status.charAt(0).toUpperCase() + est.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(est.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
