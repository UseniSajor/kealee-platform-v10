"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Button } from "@kealee/ui/button"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Cpu,
  ExternalLink,
  Gavel,
  CalendarCheck,
  FileText,
  Receipt,
  Shield,
  Wallet,
  MessageSquare,
  ListChecks,
  FileOutput,
  BrainCircuit,
  CalendarClock,
  ScanSearch,
  Scale,
  LayoutDashboard,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────

interface AppStatus {
  appId: string
  name: string
  description: string
  status: "healthy" | "degraded" | "down"
  category: "core" | "operations" | "workflows" | "ai" | "monitoring"
  pmRoute?: string
  metrics: {
    jobsTotal: number
    jobsSuccess: number
    jobsFailed: number
    avgDuration: number
    queueDepth: number
    errorRate: number
  } | null
  lastActivity: string | null
}

interface Alert {
  appId: string
  appName: string
  type: "error_rate" | "queue_depth" | "no_activity"
  message: string
  timestamp: string
}

interface SystemStatus {
  apps: AppStatus[]
  alerts: Alert[]
  summary: {
    totalJobsToday: number
    avgProcessingTime: number
    successRate: number
    activeWorkers: number
  }
}

// ── App config ─────────────────────────────────────────────────

const APP_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: "core" | "operations" | "workflows" | "ai" | "monitoring"
  pmRoute?: string
}> = {
  "APP-01": { icon: Gavel, description: "Automate bid solicitation, comparison, and award", category: "core", pmRoute: "/bids" },
  "APP-02": { icon: CalendarCheck, description: "Smart scheduling for site visits and inspections", category: "core", pmRoute: "/inspections" },
  "APP-03": { icon: FileText, description: "Streamline change order creation and approval", category: "core", pmRoute: "/change-orders" },
  "APP-04": { icon: Receipt, description: "Auto-generate daily, weekly, and project reports", category: "core", pmRoute: "/reports" },
  "APP-05": { icon: Shield, description: "Track permit applications, status, and renewals", category: "operations", pmRoute: "/inspections" },
  "APP-06": { icon: ScanSearch, description: "Coordinate and schedule all project inspections", category: "operations", pmRoute: "/inspections" },
  "APP-07": { icon: Wallet, description: "Real-time budget tracking and cost forecasting", category: "operations", pmRoute: "/budget" },
  "APP-08": { icon: MessageSquare, description: "Centralized messaging, RFIs, and notifications", category: "operations", pmRoute: "/communication" },
  "APP-09": { icon: ListChecks, description: "Manage and prioritize task workflows", category: "workflows", pmRoute: "/tasks" },
  "APP-10": { icon: FileOutput, description: "Generate contracts, submittals, and forms", category: "workflows", pmRoute: "/documents" },
  "APP-11": { icon: BrainCircuit, description: "AI-powered project risk and cost predictions", category: "ai" },
  "APP-12": { icon: CalendarClock, description: "AI-optimized scheduling and resource allocation", category: "ai", pmRoute: "/schedule" },
  "APP-13": { icon: ScanSearch, description: "Automated quality inspection analysis", category: "ai", pmRoute: "/punch-list" },
  "APP-14": { icon: Scale, description: "Data-driven decision support for PMs", category: "ai" },
  "APP-15": { icon: LayoutDashboard, description: "Real-time dashboard and system monitoring", category: "monitoring" },
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: "Core Tools", color: "bg-blue-500" },
  operations: { label: "Operations", color: "bg-emerald-500" },
  workflows: { label: "Workflows", color: "bg-purple-500" },
  ai: { label: "AI Agents", color: "bg-amber-500" },
  monitoring: { label: "Monitoring", color: "bg-gray-500" },
}

// ── Helpers ─────────────────────────────────────────────────────

function getStatusDot(status: string) {
  switch (status) {
    case "healthy": return "bg-green-500"
    case "degraded": return "bg-yellow-500"
    case "down": return "bg-red-500"
    default: return "bg-gray-400"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "healthy": return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" />Healthy</span>
    case "degraded": return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full"><AlertTriangle className="h-3 w-3" />Degraded</span>
    case "down": return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" />Down</span>
    default: return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">Unknown</span>
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

// ── Component ──────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [data, setData] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchData()
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30_000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchData() {
    try {
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${apiUrl}/command-center/status`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error("[CommandCenter] Fetch error:", err)
      setError(err.message || "Failed to fetch system status")
      if (!data) setData(getMockData())
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  const status = data ?? getMockData()
  const healthyCount = status.apps.filter(a => a.status === "healthy").length
  const degradedCount = status.apps.filter(a => a.status === "degraded").length
  const downCount = status.apps.filter(a => a.status === "down").length

  // Group by category
  const grouped = status.apps.reduce<Record<string, AppStatus[]>>((acc, app) => {
    const cat = APP_CONFIG[app.appId]?.category ?? "core"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(app)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Command Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and launch all 15 automation tools directly from your PM dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          API unavailable — showing cached data. {error}
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Jobs Today</p>
                <p className="text-xl font-bold">{status.summary.totalJobsToday.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-xl font-bold">{(status.summary.successRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Avg Processing</p>
                <p className="text-xl font-bold">{formatDuration(status.summary.avgProcessingTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Workers</p>
                <p className="text-xl font-bold">{status.summary.activeWorkers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Healthy</p>
                <p className="text-xl font-bold text-green-600">{healthyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-500">Issues</p>
                <p className="text-xl font-bold text-yellow-600">{degradedCount + downCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {status.alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts ({status.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.alerts.map((alert, i) => (
                <div
                  key={`${alert.appId}-${alert.type}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-white border p-3"
                >
                  <div className="flex items-center gap-3">
                    {alert.type === "error_rate" && <XCircle className="h-4 w-4 text-red-500" />}
                    {alert.type === "queue_depth" && <Clock className="h-4 w-4 text-yellow-500" />}
                    {alert.type === "no_activity" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    <div>
                      <span className="font-medium text-sm">{alert.appName}</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-sm text-gray-600">{alert.message}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Grid by Category */}
      {Object.entries(grouped).map(([cat, apps]) => {
        const catInfo = CATEGORY_LABELS[cat] ?? { label: cat, color: "bg-gray-500" }
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-2 w-2 rounded-full ${catInfo.color}`} />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                {catInfo.label}
              </h2>
              <span className="text-xs text-gray-400">({apps.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {apps.map((app) => {
                const config = APP_CONFIG[app.appId]
                const Icon = config?.icon ?? Activity
                const pmRoute = config?.pmRoute

                return (
                  <Card
                    key={app.appId}
                    className="hover:shadow-md transition-all duration-200 group relative"
                  >
                    <CardContent className="p-4">
                      {/* Top row: icon + name + status */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-blue-50 transition-colors">
                            <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                            <p className="text-[10px] text-gray-400">{app.appId}</p>
                          </div>
                        </div>
                        <div className={`h-2.5 w-2.5 rounded-full mt-1 ${getStatusDot(app.status)}`} />
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {config?.description ?? "Automation tool"}
                      </p>

                      {/* Metrics */}
                      {app.metrics ? (
                        <div className="grid grid-cols-3 gap-1 text-center mb-3 bg-gray-50 rounded-lg p-2">
                          <div>
                            <p className="text-sm font-bold">{app.metrics.jobsTotal}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Jobs</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-600">
                              {app.metrics.jobsTotal > 0
                                ? `${((app.metrics.jobsSuccess / app.metrics.jobsTotal) * 100).toFixed(0)}%`
                                : "---"}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase">Success</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold">{app.metrics.queueDepth}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Queue</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-2 text-center mb-3">
                          <p className="text-[10px] text-gray-400">Ready — no jobs processed yet</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/command-center/${app.appId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                            <Activity className="h-3 w-3" />
                            Details
                          </Button>
                        </Link>
                        {pmRoute && (
                          <Link href={pmRoute} className="flex-1">
                            <Button size="sm" className="w-full text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                              <ArrowUpRight className="h-3 w-3" />
                              Launch
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Last activity */}
                      {app.lastActivity && (
                        <p className="text-[10px] text-gray-400 text-right mt-2">
                          Last: {timeAgo(app.lastActivity)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gray-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/bids/new">
              <Button variant="outline" className="w-full text-xs h-auto py-3 flex flex-col gap-1">
                <Gavel className="h-4 w-4 text-blue-600" />
                New Bid Request
              </Button>
            </Link>
            <Link href="/change-orders/new">
              <Button variant="outline" className="w-full text-xs h-auto py-3 flex flex-col gap-1">
                <FileText className="h-4 w-4 text-purple-600" />
                New Change Order
              </Button>
            </Link>
            <Link href="/estimates/new">
              <Button variant="outline" className="w-full text-xs h-auto py-3 flex flex-col gap-1">
                <Receipt className="h-4 w-4 text-green-600" />
                New Estimate
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="outline" className="w-full text-xs h-auto py-3 flex flex-col gap-1">
                <CalendarClock className="h-4 w-4 text-orange-600" />
                View Schedule
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Mock Data ──────────────────────────────────────────────────

function getMockData(): SystemStatus {
  const appEntries: Record<string, string> = {
    "APP-01": "Bid Engine",
    "APP-02": "Visit Scheduler",
    "APP-03": "Change Order Processor",
    "APP-04": "Report Generator",
    "APP-05": "Permit Tracker",
    "APP-06": "Inspection Coordinator",
    "APP-07": "Budget Tracker",
    "APP-08": "Communication Hub",
    "APP-09": "Task Queue Manager",
    "APP-10": "Document Generator",
    "APP-11": "Predictive Engine",
    "APP-12": "Smart Scheduler",
    "APP-13": "QA Inspector",
    "APP-14": "Decision Support",
    "APP-15": "Dashboard Monitor",
  }

  return {
    apps: Object.entries(appEntries).map(([id, name]) => ({
      appId: id,
      name,
      description: APP_CONFIG[id]?.description ?? "",
      status: "healthy" as const,
      category: APP_CONFIG[id]?.category ?? "core",
      pmRoute: APP_CONFIG[id]?.pmRoute,
      metrics: null,
      lastActivity: null,
    })),
    alerts: [],
    summary: {
      totalJobsToday: 0,
      avgProcessingTime: 0,
      successRate: 1,
      activeWorkers: 0,
    },
  }
}
