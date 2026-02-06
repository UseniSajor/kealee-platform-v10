"use client"

import * as React from "react"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TimeRange = "week" | "month" | "quarter" | "ytd" | "custom"
type TrendDirection = "up" | "down" | "flat"

type KpiCard = {
  label: string
  value: string
  change: string
  direction: TrendDirection
  icon: React.ElementType
}

type MonthlyRevCost = {
  month: string
  revenue: number
  cost: number
}

type ProjectStatus = {
  status: string
  count: number
  color: string
}

type BudgetProject = {
  name: string
  planned: number
  actual: number
}

type TeamUtilization = {
  team: string
  hoursWorked: number
  capacity: number
}

type ScheduleRiskProject = {
  name: string
  dueDate: string
  riskScore: number // 0-100
  risk: "red" | "amber" | "green"
}

type RecentReport = {
  id: string
  title: string
  generatedAt: string
  type: string
  size: string
}

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                 */
/* -------------------------------------------------------------------------- */

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "ytd", label: "YTD" },
  { key: "custom", label: "Custom" },
]

const KPI_DATA: KpiCard[] = [
  {
    label: "Revenue",
    value: "$1,245,000",
    change: "+12% vs last period",
    direction: "up",
    icon: DollarSign,
  },
  {
    label: "Profit Margin",
    value: "18.5%",
    change: "-2.1% vs last period",
    direction: "down",
    icon: TrendingDown,
  },
  {
    label: "Active Projects",
    value: "24",
    change: "+3 vs last period",
    direction: "up",
    icon: Briefcase,
  },
  {
    label: "Labor Utilization",
    value: "87%",
    change: "+5% vs last period",
    direction: "up",
    icon: Users,
  },
]

const MONTHLY_REV_COST: MonthlyRevCost[] = [
  { month: "Sep", revenue: 980000, cost: 790000 },
  { month: "Oct", revenue: 1050000, cost: 830000 },
  { month: "Nov", revenue: 1120000, cost: 870000 },
  { month: "Dec", revenue: 1010000, cost: 850000 },
  { month: "Jan", revenue: 1180000, cost: 920000 },
  { month: "Feb", revenue: 1245000, cost: 960000 },
]

const PROJECT_STATUSES: ProjectStatus[] = [
  { status: "Active", count: 18, color: "bg-emerald-500" },
  { status: "At Risk", count: 4, color: "bg-amber-500" },
  { status: "On Hold", count: 3, color: "bg-neutral-400" },
  { status: "Complete", count: 12, color: "bg-blue-500" },
]

const BUDGET_PROJECTS: BudgetProject[] = [
  { name: "Highland Office Tower", planned: 2400000, actual: 2280000 },
  { name: "Riverside Condos Ph-2", planned: 1800000, actual: 1950000 },
  { name: "Metro Transit Hub", planned: 3200000, actual: 2900000 },
  { name: "Greenfield School", planned: 950000, actual: 920000 },
  { name: "Harbor View Retail", planned: 1400000, actual: 1580000 },
]

const TEAM_UTILIZATION: TeamUtilization[] = [
  { team: "Structural", hoursWorked: 1420, capacity: 1600 },
  { team: "Electrical", hoursWorked: 1180, capacity: 1280 },
  { team: "Plumbing", hoursWorked: 890, capacity: 960 },
  { team: "HVAC", hoursWorked: 720, capacity: 800 },
  { team: "Finishing", hoursWorked: 1050, capacity: 1280 },
  { team: "Site Prep", hoursWorked: 680, capacity: 800 },
]

const SCHEDULE_RISK: ScheduleRiskProject[] = [
  { name: "Riverside Condos Ph-2", dueDate: "2026-03-15", riskScore: 82, risk: "red" },
  { name: "Harbor View Retail", dueDate: "2026-04-01", riskScore: 68, risk: "red" },
  { name: "Metro Transit Hub", dueDate: "2026-06-30", riskScore: 45, risk: "amber" },
  { name: "Highland Office Tower", dueDate: "2026-05-20", riskScore: 38, risk: "amber" },
  { name: "Greenfield School", dueDate: "2026-04-10", riskScore: 15, risk: "green" },
  { name: "Lakeside Medical Center", dueDate: "2026-07-01", riskScore: 10, risk: "green" },
]

const RECENT_REPORTS: RecentReport[] = [
  { id: "rpt-1", title: "Q4 2025 Revenue Summary", generatedAt: "2026-01-15T09:30:00Z", type: "PDF", size: "1.2 MB" },
  { id: "rpt-2", title: "January 2026 Labor Report", generatedAt: "2026-02-01T14:00:00Z", type: "Excel", size: "840 KB" },
  { id: "rpt-3", title: "Budget Variance Analysis", generatedAt: "2026-02-03T11:15:00Z", type: "PDF", size: "2.1 MB" },
  { id: "rpt-4", title: "Project Health Dashboard Export", generatedAt: "2026-02-04T16:45:00Z", type: "PDF", size: "980 KB" },
  { id: "rpt-5", title: "YTD Profit & Loss Statement", generatedAt: "2026-02-05T08:20:00Z", type: "Excel", size: "1.5 MB" },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === "up") return <ArrowUp className="h-4 w-4 text-emerald-600" />
  if (direction === "down") return <ArrowDown className="h-4 w-4 text-red-600" />
  return <Minus className="h-4 w-4 text-neutral-400" />
}

function trendColor(direction: TrendDirection): string {
  if (direction === "up") return "text-emerald-600"
  if (direction === "down") return "text-red-600"
  return "text-neutral-500"
}

function riskBadgeClasses(risk: "red" | "amber" | "green"): string {
  if (risk === "red") return "bg-red-50 text-red-700 border-red-200"
  if (risk === "amber") return "bg-amber-50 text-amber-700 border-amber-200"
  return "bg-emerald-50 text-emerald-700 border-emerald-200"
}

function riskBarColor(risk: "red" | "amber" | "green"): string {
  if (risk === "red") return "bg-red-500"
  if (risk === "amber") return "bg-amber-500"
  return "bg-emerald-500"
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("quarter")
  const [customStart, setCustomStart] = React.useState("")
  const [customEnd, setCustomEnd] = React.useState("")

  const revMax = Math.max(...MONTHLY_REV_COST.map((m) => Math.max(m.revenue, m.cost)))
  const statusMax = Math.max(...PROJECT_STATUSES.map((s) => s.count))
  const utilizationMax = Math.max(...TEAM_UTILIZATION.map((t) => t.capacity))
  const budgetMax = Math.max(...BUDGET_PROJECTS.flatMap((p) => [p.planned, p.actual]))

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/*  Header                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-neutral-600 mt-1">
            Revenue, profit, project health, labor utilization, and schedule risk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-600 hidden sm:inline">Range:</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Time Range Selector                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2">
        {TIME_RANGES.map((tr) => (
          <Button
            key={tr.key}
            variant={timeRange === tr.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(tr.key)}
          >
            {tr.label}
          </Button>
        ))}
        {timeRange === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              className="w-36 h-8 text-sm"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className="text-neutral-500 text-sm">to</span>
            <Input
              type="date"
              className="w-36 h-8 text-sm"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  KPI Cards                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="py-0">
              <CardContent className="py-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-neutral-600">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-100 p-2">
                    <Icon className="h-5 w-5 text-neutral-700" />
                  </div>
                </div>
                <div className={cn("mt-3 flex items-center gap-1 text-sm", trendColor(kpi.direction))}>
                  <TrendArrow direction={kpi.direction} />
                  <span>{kpi.change}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Charts Row 1: Revenue vs Cost  |  Projects by Status              */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue vs Cost by Month */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-500" />
              Revenue vs Cost by Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5 space-y-3">
            {MONTHLY_REV_COST.map((m) => (
              <div key={m.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700 w-10">{m.month}</span>
                  <span className="text-xs text-neutral-500">
                    Rev {fmtCurrency(m.revenue)} / Cost {fmtCurrency(m.cost)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 rounded bg-emerald-500" style={{ width: `${pct(m.revenue, revMax)}%` }} />
                    <span className="text-xs text-emerald-700 font-medium whitespace-nowrap">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 rounded bg-blue-400" style={{ width: `${pct(m.cost, revMax)}%` }} />
                    <span className="text-xs text-blue-600 font-medium whitespace-nowrap">Cost</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-blue-400" /> Cost
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-neutral-500" />
              Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5 space-y-4">
            {PROJECT_STATUSES.map((s) => (
              <div key={s.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700">{s.status}</span>
                  <span className="text-neutral-900 font-semibold tabular-nums">{s.count}</span>
                </div>
                <div className="h-5 w-full rounded bg-neutral-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded", s.color)}
                    style={{ width: `${pct(s.count, statusMax)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-neutral-500">
              Total: {PROJECT_STATUSES.reduce((s, p) => s + p.count, 0)} projects
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Charts Row 2: Budget Performance  |  Labor Utilization            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Budget Performance */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neutral-500" />
              Budget Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5 space-y-4">
            {BUDGET_PROJECTS.map((p) => {
              const overBudget = p.actual > p.planned
              const variance = p.actual - p.planned
              return (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-800 truncate max-w-[200px]">{p.name}</span>
                    <span className={cn("text-xs font-medium tabular-nums", overBudget ? "text-red-600" : "text-emerald-600")}>
                      {overBudget ? "+" : ""}
                      {fmtCurrency(Math.abs(variance))} {overBudget ? "over" : "under"}
                    </span>
                  </div>
                  <div className="relative h-5 w-full rounded bg-neutral-100 overflow-hidden">
                    {/* Planned bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-blue-200"
                      style={{ width: `${pct(p.planned, budgetMax)}%` }}
                    />
                    {/* Actual bar */}
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded",
                        overBudget ? "bg-red-400" : "bg-emerald-500"
                      )}
                      style={{ width: `${pct(p.actual, budgetMax)}%`, opacity: 0.85 }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Planned: {fmtCurrency(p.planned)}</span>
                    <span>Actual: {fmtCurrency(p.actual)}</span>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-4 pt-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-blue-200" /> Planned
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Actual (under)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-400" /> Actual (over)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Labor Utilization by Team */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              Labor Utilization by Team
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5 space-y-4">
            {TEAM_UTILIZATION.map((t) => {
              const utilPct = pct(t.hoursWorked, t.capacity)
              return (
                <div key={t.team} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">{t.team}</span>
                    <span className="text-neutral-900 font-semibold tabular-nums">{utilPct}%</span>
                  </div>
                  <div className="h-5 w-full rounded bg-neutral-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded",
                        utilPct >= 90 ? "bg-emerald-500" : utilPct >= 70 ? "bg-blue-500" : "bg-amber-500"
                      )}
                      style={{ width: `${pct(t.hoursWorked, utilizationMax)}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500">
                    {t.hoursWorked.toLocaleString()} hrs / {t.capacity.toLocaleString()} hrs capacity
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Schedule Risk                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neutral-500" />
            Schedule Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Project</th>
                  <th className="text-left font-medium px-4 py-3">Due Date</th>
                  <th className="text-left font-medium px-4 py-3">Risk Score</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_RISK.map((p) => (
                  <tr key={p.name} className="border-t">
                    <td className="px-4 py-3 font-medium text-neutral-900">{p.name}</td>
                    <td className="px-4 py-3 text-neutral-700 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {format(new Date(p.dueDate), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-24 rounded bg-neutral-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded", riskBarColor(p.risk))}
                            style={{ width: `${p.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-neutral-700">{p.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          riskBadgeClasses(p.risk)
                        )}
                      >
                        {p.risk === "red" && <ArrowUp className="h-3 w-3" />}
                        {p.risk === "amber" && <Minus className="h-3 w-3" />}
                        {p.risk === "green" && <ArrowDown className="h-3 w-3" />}
                        {p.risk === "red" ? "High" : p.risk === "amber" ? "Medium" : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/*  Recent Reports                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Card className="py-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-500" />
              Recent Reports
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Report</th>
                  <th className="text-left font-medium px-4 py-3">Generated</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Size</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_REPORTS.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-neutral-900">{r.title}</td>
                    <td className="px-4 py-3 text-neutral-700 tabular-nums">
                      {format(new Date(r.generatedAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          r.type === "PDF"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{r.size}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
