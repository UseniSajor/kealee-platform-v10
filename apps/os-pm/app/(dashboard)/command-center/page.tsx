"use client"

import * as React from "react"
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Cable,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Cog,
  Database,
  Eye,
  FileText,
  Globe,
  Layers,
  ListChecks,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Send,
  Server,
  Settings,
  Shield,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type AgentStatus = "ACTIVE" | "WATCHING" | "IDLE" | "ERROR"

type AIAgent = {
  id: string
  name: string
  status: AgentStatus
  description: string
  lastRun: string
  nextRun?: string
  icon: React.ElementType
  metrics: { label: string; value: string }[]
}

type MiniApp = {
  id: string
  name: string
  code: string
  status: "Connected" | "Active" | "Degraded" | "Disconnected"
  lastSync: string
  dataFlow: "Bi-directional" | "Read-only" | "Hub"
  health: number
}

type JobItem = {
  id: string
  name: string
  status: "processing" | "pending" | "completed" | "failed"
  progress?: number
}

type ChatMessage = {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: string
}

type AutomationRule = {
  id: string
  name: string
  active: boolean
  triggeredToday: number
  lastTriggered?: string
}

type SystemMetric = {
  label: string
  value: string
  detail: string
  status: "green" | "amber" | "red"
  icon: React.ElementType
}

/* -------------------------------------------------------------------------- */
/*  Mock Data                                                                 */
/* -------------------------------------------------------------------------- */

const AI_AGENTS: AIAgent[] = [
  {
    id: "agent-scheduling",
    name: "Scheduling Agent",
    status: "ACTIVE",
    description: "Optimizing crew schedules for next week",
    lastRun: "5 min ago",
    nextRun: "30 min",
    icon: Clock,
    metrics: [
      { label: "Tasks completed today", value: "12" },
      { label: "Accuracy", value: "94%" },
    ],
  },
  {
    id: "agent-estimating",
    name: "Estimating Agent",
    status: "ACTIVE",
    description: "Processing 3 estimate requests in queue",
    lastRun: "2 min ago",
    icon: Target,
    metrics: [
      { label: "Estimates generated today", value: "5" },
      { label: "Avg accuracy", value: "91%" },
    ],
  },
  {
    id: "agent-rfi",
    name: "RFI Auto-Router",
    status: "ACTIVE",
    description: "Routing RFI-025 to appropriate reviewer",
    lastRun: "1 min ago",
    icon: ArrowRight,
    metrics: [
      { label: "RFIs routed today", value: "8" },
      { label: "Avg response time", value: "2.4 hrs" },
    ],
  },
  {
    id: "agent-budget",
    name: "Budget Monitor",
    status: "WATCHING",
    description: "Monitoring 24 project budgets for overruns",
    lastRun: "10 min ago",
    icon: Eye,
    metrics: [
      { label: "Alerts triggered today", value: "3" },
      { label: "False positive rate", value: "5%" },
    ],
  },
  {
    id: "agent-compliance",
    name: "Compliance Checker",
    status: "ACTIVE",
    description: "Scanning 12 daily logs for missing safety data",
    lastRun: "3 min ago",
    icon: Shield,
    metrics: [
      { label: "Violations detected today", value: "2" },
      { label: "Items reviewed", value: "45" },
    ],
  },
  {
    id: "agent-document",
    name: "Document Classifier",
    status: "IDLE",
    description: "Awaiting new document uploads",
    lastRun: "45 min ago",
    icon: FileText,
    metrics: [
      { label: "Documents classified today", value: "28" },
      { label: "Categories", value: "12" },
    ],
  },
  {
    id: "agent-lead",
    name: "Lead Scoring Agent",
    status: "ACTIVE",
    description: "Scoring 4 new leads from website",
    lastRun: "8 min ago",
    icon: Users,
    metrics: [
      { label: "Leads scored today", value: "15" },
      { label: "Conversion prediction", value: "34%" },
    ],
  },
  {
    id: "agent-invoice",
    name: "Invoice Matcher",
    status: "ACTIVE",
    description: "Matching PO-2847 against received invoice",
    lastRun: "4 min ago",
    icon: ListChecks,
    metrics: [
      { label: "Invoices matched today", value: "6" },
      { label: "Discrepancies found", value: "1" },
    ],
  },
]

const MINI_APPS: MiniApp[] = [
  { id: "app-06", name: "Estimation Tool", code: "APP-06", status: "Connected", lastSync: "2 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-01", name: "Bid Engine", code: "APP-01", status: "Connected", lastSync: "5 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-02", name: "Cost Database", code: "APP-02", status: "Connected", lastSync: "1 min ago", dataFlow: "Read-only", health: 100 },
  { id: "app-03", name: "Permits Module", code: "APP-03", status: "Connected", lastSync: "10 min ago", dataFlow: "Bi-directional", health: 98 },
  { id: "app-04", name: "Finance/Trust", code: "APP-04", status: "Connected", lastSync: "3 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-05", name: "Marketplace", code: "APP-05", status: "Connected", lastSync: "15 min ago", dataFlow: "Bi-directional", health: 95 },
  { id: "app-07", name: "Architect Hub", code: "APP-07", status: "Connected", lastSync: "8 min ago", dataFlow: "Read-only", health: 100 },
  { id: "app-08", name: "Inspector Mobile", code: "APP-08", status: "Connected", lastSync: "1 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-09", name: "Scheduling Engine", code: "APP-09", status: "Connected", lastSync: "30 sec ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-10", name: "Document Manager", code: "APP-10", status: "Connected", lastSync: "2 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-11", name: "Communication Hub", code: "APP-11", status: "Connected", lastSync: "1 min ago", dataFlow: "Bi-directional", health: 99 },
  { id: "app-12", name: "Reporting Engine", code: "APP-12", status: "Connected", lastSync: "5 min ago", dataFlow: "Read-only", health: 100 },
  { id: "app-13", name: "CRM Module", code: "APP-13", status: "Connected", lastSync: "3 min ago", dataFlow: "Bi-directional", health: 100 },
  { id: "app-14", name: "Compliance Engine", code: "APP-14", status: "Connected", lastSync: "7 min ago", dataFlow: "Read-only", health: 100 },
  { id: "app-15", name: "Command Center", code: "APP-15", status: "Active", lastSync: "Real-time", dataFlow: "Hub", health: 100 },
]

const JOB_QUEUE: JobItem[] = [
  { id: "job-1", name: "Generate weekly report", status: "processing", progress: 45 },
  { id: "job-2", name: "Optimize schedules", status: "processing", progress: 78 },
  { id: "job-3", name: "Score new leads", status: "pending" },
  { id: "job-4", name: "Classify uploaded documents", status: "pending" },
  { id: "job-5", name: "Match invoices batch", status: "pending" },
]

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Which projects need attention this week?",
    timestamp: "2026-02-06T09:15:00Z",
  },
  {
    id: "msg-2",
    role: "ai",
    content:
      "Based on my analysis, 3 projects need attention:\n\n1) **Davis ADU Build** is 5 days behind schedule with 6 open issues. The framing crew is waiting on materials and the electrical permit is still under review.\n\n2) **Chen Master Bath** has 4 unresolved RFIs blocking plumbing rough-in. The longest outstanding RFI is 8 days old.\n\n3) **Park Whole Home Reno** budget is at 87% with only 35% completion. Change orders for structural work have consumed most of the contingency.",
    timestamp: "2026-02-06T09:15:05Z",
  },
  {
    id: "msg-3",
    role: "user",
    content: "Create action items for the Davis ADU",
    timestamp: "2026-02-06T09:16:00Z",
  },
  {
    id: "msg-4",
    role: "ai",
    content:
      'I\'ve created 4 action items for the Davis ADU Build:\n\n1. Schedule emergency meeting with framing crew (assigned to Mike Rodriguez, due tomorrow)\n2. Expedite permit review for electrical rough-in (assigned to Sarah Chen, due Feb 7)\n3. Request updated schedule from foundation subcontractor (assigned to James Park, due Feb 8)\n4. Send budget alert notification to project owner (auto-sent via Communication Hub)\n\nAll items have been added to your Work Queue and relevant team members have been notified.',
    timestamp: "2026-02-06T09:16:08Z",
  },
]

const AUTOMATION_RULES: AutomationRule[] = [
  { id: "rule-1", name: "Auto-assign RFIs to trade-specific reviewers", active: true, triggeredToday: 8, lastTriggered: "12 min ago" },
  { id: "rule-2", name: "Send overdue task reminders at 8 AM", active: true, triggeredToday: 3, lastTriggered: "6 hrs ago" },
  { id: "rule-3", name: "Flag budgets exceeding 85% threshold", active: true, triggeredToday: 2, lastTriggered: "1 hr ago" },
  { id: "rule-4", name: "Auto-classify uploaded documents by type", active: true, triggeredToday: 28, lastTriggered: "45 min ago" },
  { id: "rule-5", name: "Notify PM when inspection scheduled", active: true, triggeredToday: 4, lastTriggered: "2 hrs ago" },
  { id: "rule-6", name: "Generate daily log reminders at 4 PM", active: true, triggeredToday: 0 },
  { id: "rule-7", name: "Score new leads within 15 minutes", active: true, triggeredToday: 4, lastTriggered: "8 min ago" },
]

const SYSTEM_METRICS: SystemMetric[] = [
  { label: "API Response Time", value: "45ms", detail: "avg (last 5 min)", status: "green", icon: Zap },
  { label: "Database", value: "2.3 GB / 10 GB", detail: "23% used", status: "green", icon: Database },
  { label: "Job Queue", value: "3 pending", detail: "normal throughput", status: "green", icon: Layers },
  { label: "WebSocket", value: "12 active", detail: "connections", status: "green", icon: Wifi },
  { label: "AI Token Usage", value: "45K / 100K", detail: "45% daily limit", status: "green", icon: Brain },
  { label: "Last Backup", value: "2 hrs ago", detail: "next in 4 hrs", status: "green", icon: Server },
  { label: "Uptime", value: "99.97%", detail: "30-day rolling", status: "green", icon: Activity },
]

const SAMPLE_QUERIES = [
  "What's the status of the Thompson build?",
  "Generate a weekly progress report",
  "Which projects are over budget?",
  "Suggest optimal crew assignments for next week",
  "Summarize all open RFIs",
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function statusColor(status: AgentStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500"
    case "WATCHING":
      return "bg-blue-500"
    case "IDLE":
      return "bg-neutral-400"
    case "ERROR":
      return "bg-red-500"
  }
}

function statusBadgeClasses(status: AgentStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    case "WATCHING":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    case "IDLE":
      return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
    case "ERROR":
      return "bg-red-500/10 text-red-400 border-red-500/20"
  }
}

function connectionStatusDot(status: MiniApp["status"]): string {
  switch (status) {
    case "Connected":
      return "bg-emerald-500"
    case "Active":
      return "bg-emerald-400"
    case "Degraded":
      return "bg-amber-500"
    case "Disconnected":
      return "bg-red-500"
  }
}

function healthBarColor(health: number): string {
  if (health >= 98) return "bg-emerald-500"
  if (health >= 90) return "bg-amber-500"
  return "bg-red-500"
}

function jobStatusBadge(status: JobItem["status"]): string {
  switch (status) {
    case "processing":
      return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "pending":
      return "bg-amber-500/10 text-amber-600 border-amber-200"
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
    case "failed":
      return "bg-red-500/10 text-red-600 border-red-200"
  }
}

function formatChatContent(content: string): React.ReactNode {
  // Simple markdown-like bold parsing
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

/* -------------------------------------------------------------------------- */
/*  Sub-Components                                                            */
/* -------------------------------------------------------------------------- */

function PulsingDot({ className, color }: { className?: string; color: string }) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          color
        )}
      />
      <span
        className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)}
      />
    </span>
  )
}

function StaticDot({ className, color }: { className?: string; color: string }) {
  return (
    <span
      className={cn("inline-flex h-2.5 w-2.5 rounded-full", color, className)}
    />
  )
}

function AgentCard({ agent }: { agent: AIAgent }) {
  const Icon = agent.icon
  const isPulsing = agent.status === "ACTIVE"

  return (
    <Card className="border-neutral-800 bg-neutral-900 py-0 overflow-hidden">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 ring-1 ring-neutral-700">
              <Icon className="h-4.5 w-4.5 text-neutral-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                {agent.name}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider mt-0.5",
                  statusBadgeClasses(agent.status)
                )}
              >
                {isPulsing ? (
                  <PulsingDot color={statusColor(agent.status)} />
                ) : (
                  <StaticDot color={statusColor(agent.status)} />
                )}
                {agent.status}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
          {agent.description}
        </p>

        {/* Timing */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Last: {agent.lastRun}
          </span>
          {agent.nextRun && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Next: {agent.nextRun}
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {agent.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-md bg-neutral-800/60 px-2.5 py-1.5 ring-1 ring-neutral-700/50"
            >
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">
                {m.label}
              </p>
              <p className="text-sm font-semibold text-neutral-200 tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <Cog className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <FileText className="h-3 w-3 mr-1" />
            Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function CommandCenterPage() {
  const [chatInput, setChatInput] = React.useState("")
  const [chatMessages, setChatMessages] =
    React.useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES)
  const now = new Date()

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    }
    setChatMessages((prev) => [...prev, newMsg])
    setChatInput("")
    // Simulate AI response after a brief delay
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content:
          "I'm processing your request. Let me analyze the relevant data across all connected systems and get back to you with a comprehensive answer.",
        timestamp: new Date().toISOString(),
      }
      setChatMessages((prev) => [...prev, aiMsg])
    }, 1200)
  }

  const handleSampleQuery = (query: string) => {
    setChatInput(query)
  }

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/*  SECTION 1 - Command Center Header                                 */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Command Center</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
              <PulsingDot color="bg-emerald-500" />
              AI Online
            </span>
          </div>
          <p className="text-neutral-600 mt-1.5">
            AI-powered operations hub &mdash; 15 automation tools, 8 active agents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-1.5" />
            Run Diagnostics
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1.5" />
            Generate Reports
          </Button>
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-1.5" />
            Schedule Optimization
          </Button>
          <Button size="sm">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            AI Chat
          </Button>
        </div>
      </div>

      {/* Timestamp bar */}
      <div className="flex items-center justify-between rounded-lg border bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
        <span className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Last refresh: {format(now, "MMM d, yyyy h:mm:ss a")}
        </span>
        <span className="flex items-center gap-2">
          <Cable className="h-3.5 w-3.5" />
          15/15 apps connected
          <span className="mx-1 text-neutral-300">|</span>
          <Bot className="h-3.5 w-3.5" />
          8 agents deployed
        </span>
      </div>

      {/* ================================================================== */}
      {/*  SECTION 2 - AI Agent Status Board                                 */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-neutral-700" />
          <h2 className="text-lg font-semibold">AI Agent Status Board</h2>
          <span className="ml-auto text-xs text-neutral-500">
            {AI_AGENTS.filter((a) => a.status === "ACTIVE").length} active /{" "}
            {AI_AGENTS.length} total
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {AI_AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  SECTION 3 - Mini-App Integration Hub                              */}
      {/* ================================================================== */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cable className="h-4 w-4 text-neutral-500" />
            Mini-App Integration Hub
            <span className="ml-auto text-xs font-normal text-neutral-500">
              {MINI_APPS.filter(
                (a) => a.status === "Connected" || a.status === "Active"
              ).length}
              /{MINI_APPS.length} online
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">App</th>
                  <th className="text-left font-medium px-4 py-3">Code</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">
                    Last Sync
                  </th>
                  <th className="text-left font-medium px-4 py-3">
                    Data Flow
                  </th>
                  <th className="text-left font-medium px-4 py-3">Health</th>
                </tr>
              </thead>
              <tbody>
                {MINI_APPS.map((app) => (
                  <tr
                    key={app.id}
                    className={cn(
                      "border-t",
                      app.status === "Active" && "bg-emerald-50/40"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {app.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-600">
                        {app.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {app.status === "Connected" || app.status === "Active" ? (
                          <PulsingDot color={connectionStatusDot(app.status)} />
                        ) : (
                          <StaticDot color={connectionStatusDot(app.status)} />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            app.status === "Connected" || app.status === "Active"
                              ? "text-emerald-700"
                              : app.status === "Degraded"
                                ? "text-amber-700"
                                : "text-red-700"
                          )}
                        >
                          {app.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums text-xs">
                      {app.lastSync}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          app.dataFlow === "Bi-directional"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : app.dataFlow === "Hub"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-neutral-50 text-neutral-600 border-neutral-200"
                        )}
                      >
                        {app.dataFlow}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              healthBarColor(app.health)
                            )}
                            style={{ width: `${app.health}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums text-neutral-700">
                          {app.health}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/*  SECTION 4 - Job Queue Monitor & System Health (side by side)      */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Job Queue Monitor */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-neutral-500" />
              Job Queue Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            {/* Queue summary bar */}
            <div className="flex items-center gap-4 rounded-lg bg-neutral-50 border px-4 py-2.5 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-neutral-600">
                  <strong className="text-neutral-900 tabular-nums">3</strong>{" "}
                  pending
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs text-neutral-600">
                  <strong className="text-neutral-900 tabular-nums">2</strong>{" "}
                  processing
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-neutral-600">
                  <strong className="text-neutral-900 tabular-nums">145</strong>{" "}
                  completed today
                </span>
              </div>
            </div>

            {/* Job list */}
            <div className="space-y-2">
              {JOB_QUEUE.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  {job.status === "processing" ? (
                    <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : job.status === "pending" ? (
                    <Circle className="h-4 w-4 text-amber-400" />
                  ) : job.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-red-500" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {job.name}
                    </p>
                    {job.status === "processing" && job.progress != null && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-blue-600 tabular-nums">
                          {job.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                      jobStatusBadge(job.status)
                    )}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health Dashboard */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-neutral-500" />
              System Health Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="space-y-2">
              {SYSTEM_METRICS.map((metric) => {
                const MetricIcon = metric.icon
                return (
                  <div
                    key={metric.label}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        metric.status === "green"
                          ? "bg-emerald-50"
                          : metric.status === "amber"
                            ? "bg-amber-50"
                            : "bg-red-50"
                      )}
                    >
                      <MetricIcon
                        className={cn(
                          "h-4 w-4",
                          metric.status === "green"
                            ? "text-emerald-600"
                            : metric.status === "amber"
                              ? "text-amber-600"
                              : "text-red-600"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800">
                        {metric.label}
                      </p>
                      <p className="text-xs text-neutral-500">{metric.detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                        {metric.value}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium",
                          metric.status === "green"
                            ? "text-emerald-600"
                            : metric.status === "amber"
                              ? "text-amber-600"
                              : "text-red-600"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            metric.status === "green"
                              ? "bg-emerald-500"
                              : metric.status === "amber"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          )}
                        />
                        {metric.status === "green"
                          ? "Healthy"
                          : metric.status === "amber"
                            ? "Warning"
                            : "Critical"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  SECTION 5 - Automation Rules                                      */}
      {/* ================================================================== */}
      <Card className="py-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-neutral-500" />
              Automation Rules
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                {AUTOMATION_RULES.filter((r) => r.active).length} active
              </span>
            </CardTitle>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Manage Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="space-y-2">
            {AUTOMATION_RULES.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    rule.active ? "bg-emerald-50" : "bg-neutral-50"
                  )}
                >
                  <Sparkles
                    className={cn(
                      "h-4 w-4",
                      rule.active ? "text-emerald-600" : "text-neutral-400"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    {rule.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {rule.triggeredToday > 0
                      ? `Triggered ${rule.triggeredToday}x today${rule.lastTriggered ? ` \u00B7 Last: ${rule.lastTriggered}` : ""}`
                      : "Not yet triggered today"}
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                    rule.active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-neutral-50 text-neutral-500 border-neutral-200"
                  )}
                >
                  {rule.active ? (
                    <PulsingDot color="bg-emerald-500" />
                  ) : (
                    <StaticDot color="bg-neutral-400" />
                  )}
                  {rule.active ? "Active" : "Paused"}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600"
                  >
                    {rule.active ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-600"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/*  SECTION 6 - AI Chat Interface                                     */}
      {/* ================================================================== */}
      <Card className="py-0 border-2 border-neutral-200">
        <CardHeader className="border-b bg-neutral-50/50">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            AI Assistant
            <PulsingDot color="bg-emerald-500" className="ml-1" />
            <span className="ml-auto text-xs font-normal text-neutral-500">
              Powered by Kealee AI &middot; Connected to all 15 apps
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Chat Messages */}
          <div className="max-h-[420px] overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "ai" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-800 border"
                  )}
                >
                  <div className="whitespace-pre-line">
                    {formatChatContent(msg.content)}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] mt-1.5",
                      msg.role === "user"
                        ? "text-neutral-400"
                        : "text-neutral-400"
                    )}
                  >
                    {format(new Date(msg.timestamp), "h:mm a")}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 mt-0.5">
                    <Users className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sample Query Chips */}
          <div className="border-t px-4 py-3">
            <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Suggested queries
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSampleQuery(query)}
                  className="rounded-full border bg-white px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors cursor-pointer"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ask the AI assistant anything about your projects..."
                className="flex-1"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendChat()
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
