"use client"

import * as React from "react"
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  ArrowRightLeft,
  Webhook,
  Key,
  Clock,
  ExternalLink,
  Copy,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  CloudSun,
  CreditCard,
  FileSignature,
  Mail,
  HardHat,
  Ruler,
  MessageSquare,
  BarChart3,
  DollarSign,
  Users,
  Truck,
  Building2,
  CalendarDays,
  Layers,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type IntegrationStatus = "connected" | "available" | "coming_soon"

type SyncDirection = "bi-directional" | "inbound" | "outbound"

interface Integration {
  id: string
  name: string
  category: string
  description: string
  status: IntegrationStatus
  icon: React.ElementType
  iconBg: string
  iconColor: string
  lastSync?: string
  stats?: { label: string; value: string }[]
  syncDirection?: SyncDirection
  comingSoonDate?: string
}

interface WebhookEntry {
  method: string
  endpoint: string
  purpose: string
  callsThisWeek: number
}

interface OutgoingWebhook {
  trigger: string
  action: string
}

interface SyncEvent {
  id: string
  timestamp: string
  integration: string
  action: string
  records: string
  status: "success" | "warning" | "error"
}

/* -------------------------------------------------------------------------- */
/*  Data: Active Integrations (12)                                            */
/* -------------------------------------------------------------------------- */

const ACTIVE_INTEGRATIONS: Integration[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "Accounting",
    description: "Auto-sync invoices, payments, and expenses",
    status: "connected",
    icon: DollarSign,
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    lastSync: "5 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Invoices synced", value: "1,245" },
      { label: "Payments synced", value: "890" },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payment Processing",
    description: "Process payments, manage subscriptions, handle refunds",
    status: "connected",
    icon: CreditCard,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    lastSync: "2 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Processed this month", value: "$245,000" },
      { label: "Connected accounts", value: "8 subcontractors" },
    ],
  },
  {
    id: "docusign",
    name: "DocuSign",
    category: "E-Signatures",
    description: "Send contracts, collect signatures, track status",
    status: "connected",
    icon: FileSignature,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-700",
    lastSync: "8 min ago",
    syncDirection: "outbound",
    stats: [
      { label: "Signed this month", value: "34 documents" },
      { label: "Pending signatures", value: "3" },
    ],
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "Email & Calendar",
    description: "Sync calendar events, send emails, share drive files",
    status: "connected",
    icon: Mail,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    lastSync: "10 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Events synced", value: "156" },
      { label: "Emails sent", value: "89" },
    ],
  },
  {
    id: "procore",
    name: "Procore",
    category: "Construction Management",
    description: "Import projects, sync daily logs, share RFIs",
    status: "connected",
    icon: HardHat,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
    lastSync: "2 hrs ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Projects synced", value: "8" },
      { label: "Last import", value: "2 hrs ago" },
    ],
  },
  {
    id: "plangrid",
    name: "PlanGrid",
    category: "Drawing Management",
    description: "Sync drawings, markups, and field reports",
    status: "connected",
    icon: Ruler,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    lastSync: "30 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Drawings synced", value: "234" },
      { label: "Active markups", value: "12" },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "SMS & Communications",
    description: "Send appointment reminders, crew notifications, client updates",
    status: "connected",
    icon: MessageSquare,
    iconBg: "bg-red-100",
    iconColor: "text-red-700",
    lastSync: "1 min ago",
    syncDirection: "outbound",
    stats: [
      { label: "Messages this month", value: "456" },
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Workflow Automation",
    description: "Connect 5,000+ apps with custom automations",
    status: "connected",
    icon: Zap,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    lastSync: "Just now",
    syncDirection: "bi-directional",
    stats: [
      { label: "Active Zaps", value: "12" },
      { label: "Runs this month", value: "1,890" },
    ],
  },
  {
    id: "xero",
    name: "Xero",
    category: "Accounting Alternative",
    description: "Sync invoices and financial data",
    status: "connected",
    icon: BarChart3,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    lastSync: "15 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Records synced", value: "890" },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Sync leads, contacts, and opportunities",
    status: "connected",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    lastSync: "20 min ago",
    syncDirection: "bi-directional",
    stats: [
      { label: "Records synced", value: "234 leads" },
    ],
  },
  {
    id: "gusto",
    name: "Gusto",
    category: "Payroll",
    description: "Sync time tracking data for payroll processing",
    status: "connected",
    icon: CalendarDays,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    lastSync: "1 hr ago",
    syncDirection: "outbound",
    stats: [
      { label: "Employees synced", value: "28" },
      { label: "Last payroll", value: "3 days ago" },
    ],
  },
  {
    id: "weather-api",
    name: "Weather API",
    category: "Weather Data",
    description: "Real-time weather for jobsite planning",
    status: "connected",
    icon: CloudSun,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-700",
    lastSync: "3 min ago",
    syncDirection: "inbound",
    stats: [
      { label: "Locations monitored", value: "8 active jobsites" },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Data: Available Integrations (3)                                          */
/* -------------------------------------------------------------------------- */

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    category: "Productivity Suite",
    description: "Connect Outlook, Teams, SharePoint",
    status: "available",
    icon: Layers,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "Marketing & CRM",
    description: "Marketing automation and CRM",
    status: "available",
    icon: BarChart3,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: "monday",
    name: "Monday.com",
    category: "Project Management",
    description: "Project management sync",
    status: "available",
    icon: CalendarDays,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
]

/* -------------------------------------------------------------------------- */
/*  Data: Coming Soon (2)                                                     */
/* -------------------------------------------------------------------------- */

const COMING_SOON_INTEGRATIONS: Integration[] = [
  {
    id: "buildertrend",
    name: "BuilderTrend",
    category: "Construction Software",
    description: "Native sync coming Q2 2026",
    status: "coming_soon",
    icon: Building2,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-400",
    comingSoonDate: "Q2 2026",
  },
  {
    id: "gps-fleet",
    name: "GPS Fleet Tracking",
    category: "Fleet Management",
    description: "Real-time vehicle tracking coming Q3 2026",
    status: "coming_soon",
    icon: Truck,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-400",
    comingSoonDate: "Q3 2026",
  },
]

/* -------------------------------------------------------------------------- */
/*  Data: Webhooks                                                            */
/* -------------------------------------------------------------------------- */

const INCOMING_WEBHOOKS: WebhookEntry[] = [
  { method: "POST", endpoint: "/webhooks/stripe", purpose: "payments", callsThisWeek: 234 },
  { method: "POST", endpoint: "/webhooks/docusign", purpose: "signatures", callsThisWeek: 12 },
  { method: "POST", endpoint: "/webhooks/procore", purpose: "project updates", callsThisWeek: 45 },
  { method: "POST", endpoint: "/webhooks/twilio", purpose: "message status", callsThisWeek: 156 },
  { method: "POST", endpoint: "/webhooks/zapier", purpose: "custom", callsThisWeek: 89 },
]

const OUTGOING_WEBHOOKS: OutgoingWebhook[] = [
  { trigger: "On new project", action: "Notify Slack channel" },
  { trigger: "On payment received", action: "Update QuickBooks" },
  { trigger: "On inspection pass", action: "Update permit status" },
]

/* -------------------------------------------------------------------------- */
/*  Data: Sync History                                                        */
/* -------------------------------------------------------------------------- */

const SYNC_HISTORY: SyncEvent[] = [
  { id: "ev-01", timestamp: "2 min ago", integration: "QuickBooks", action: "Sync invoices", records: "3 records", status: "success" },
  { id: "ev-02", timestamp: "5 min ago", integration: "Stripe", action: "Process payment", records: "1 record", status: "success" },
  { id: "ev-03", timestamp: "8 min ago", integration: "DocuSign", action: "Check status", records: "2 records", status: "success" },
  { id: "ev-04", timestamp: "10 min ago", integration: "Google Calendar", action: "Sync events", records: "5 records", status: "success" },
  { id: "ev-05", timestamp: "15 min ago", integration: "Procore", action: "Import daily log", records: "1 record", status: "success" },
  { id: "ev-06", timestamp: "22 min ago", integration: "PlanGrid", action: "Sync drawings", records: "4 records", status: "success" },
  { id: "ev-07", timestamp: "30 min ago", integration: "Twilio", action: "Send reminders", records: "8 records", status: "success" },
  { id: "ev-08", timestamp: "45 min ago", integration: "Zapier", action: "Run automation", records: "2 records", status: "warning" },
  { id: "ev-09", timestamp: "1 hr ago", integration: "Salesforce", action: "Sync contacts", records: "12 records", status: "success" },
  { id: "ev-10", timestamp: "1 hr ago", integration: "Gusto", action: "Sync time entries", records: "28 records", status: "success" },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function SyncDirectionBadge({ direction }: { direction: SyncDirection }) {
  const config = {
    "bi-directional": {
      label: "Bi-directional",
      icon: ArrowRightLeft,
      classes: "bg-blue-50 text-blue-700 border-blue-200",
    },
    inbound: {
      label: "Inbound",
      icon: ArrowDownLeft,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    outbound: {
      label: "Outbound",
      icon: ArrowUpRight,
      classes: "bg-amber-50 text-amber-700 border-amber-200",
    },
  }
  const c = config[direction]
  const Icon = c.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        c.classes
      )}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  )
}

function StatusDot({ status }: { status: "success" | "warning" | "error" }) {
  const colors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  }
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[status])} />
}

function StatusBadge({ status }: { status: "success" | "warning" | "error" }) {
  const config = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
  }
  const labels = { success: "Success", warning: "Warning", error: "Error" }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config[status]
      )}
    >
      <StatusDot status={status} />
      {labels[status]}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = React.useState(false)

  const filteredActive = React.useMemo(() => {
    if (!searchQuery) return ACTIVE_INTEGRATIONS
    const q = searchQuery.toLowerCase()
    return ACTIVE_INTEGRATIONS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const filteredAvailable = React.useMemo(() => {
    if (!searchQuery) return AVAILABLE_INTEGRATIONS
    const q = searchQuery.toLowerCase()
    return AVAILABLE_INTEGRATIONS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/*  Header                                                           */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations & Connected Services</h1>
          <p className="text-neutral-600 mt-1">
            Connect your tools, sync data, and automate workflows across your tech stack
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold">12</span>
              <span className="text-xs text-neutral-500">Connected</span>
            </div>
            <span className="text-neutral-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold">3</span>
              <span className="text-xs text-neutral-500">Available</span>
            </div>
            <span className="text-neutral-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="text-sm font-semibold">2</span>
              <span className="text-xs text-neutral-500">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search integrations..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ================================================================== */}
      {/*  Section 2: Active Integrations                                    */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Plug className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Active Integrations</h2>
          <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
            {filteredActive.length} connected
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredActive.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id} className="py-0 hover:shadow-md transition-shadow">
                <CardContent className="py-5">
                  {/* Top row: icon + name + status */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        integration.iconBg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", integration.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {integration.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{integration.category}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 mt-3">{integration.description}</p>

                  {/* Stats */}
                  {integration.stats && integration.stats.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {integration.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-neutral-500">{stat.label}</span>
                          <span className="font-semibold text-neutral-800">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: last sync, sync direction, actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {integration.lastSync && (
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                            <RefreshCw className="h-3 w-3" />
                            {integration.lastSync}
                          </span>
                        )}
                        {integration.syncDirection && (
                          <SyncDirectionBadge direction={integration.syncDirection} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3.5 w-3.5" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1">
                        <XCircle className="h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  Section 3: Available Integrations                                 */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold">Available Integrations</h2>
          <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-semibold">
            {filteredAvailable.length} available
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {filteredAvailable.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id} className="py-0 hover:shadow-md transition-shadow border-dashed border-2">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        integration.iconBg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", integration.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900">{integration.name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{integration.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mt-3">{integration.description}</p>
                  <div className="mt-4">
                    <Button size="sm" className="w-full">
                      <Plug className="h-3.5 w-3.5" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  Section 4: Coming Soon                                            */}
      {/* ================================================================== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-neutral-400" />
          <h2 className="text-xl font-bold text-neutral-500">Coming Soon</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {COMING_SOON_INTEGRATIONS.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id} className="py-0 opacity-60">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        integration.iconBg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", integration.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-neutral-600">{integration.name}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500 shrink-0">
                          <Clock className="h-3 w-3" />
                          {integration.comingSoonDate}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{integration.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 mt-3">{integration.description}</p>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  Section 5: Webhook Management                                     */}
      {/* ================================================================== */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-5 w-5 text-neutral-600" />
            Webhook Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Incoming Webhooks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Incoming Webhooks</h3>
                <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                  5 active
                </span>
              </div>
              <div className="rounded-xl border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5 text-xs">Endpoint</th>
                      <th className="text-left font-medium px-4 py-2.5 text-xs">Purpose</th>
                      <th className="text-right font-medium px-4 py-2.5 text-xs">Calls/Week</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INCOMING_WEBHOOKS.map((wh) => (
                      <tr key={wh.endpoint} className="border-t border-neutral-100">
                        <td className="px-4 py-2.5">
                          <code className="text-xs font-mono bg-neutral-100 rounded px-1.5 py-0.5 text-neutral-700">
                            {wh.method} {wh.endpoint}
                          </code>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-neutral-600">{wh.purpose}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-xs font-semibold tabular-nums text-neutral-800">
                            {wh.callsThisWeek.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outgoing Webhooks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-neutral-900">Outgoing Webhooks</h3>
                <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">
                  3 active
                </span>
              </div>
              <div className="space-y-2">
                {OUTGOING_WEBHOOKS.map((wh) => (
                  <div
                    key={wh.trigger}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900">{wh.trigger}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{wh.action}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <Settings className="h-3.5 w-3.5 text-neutral-400" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add Outgoing Webhook
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/*  Section 6: API Keys & Developer Access                            */}
      {/* ================================================================== */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5 text-neutral-600" />
            API Keys & Developer Access
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="space-y-4">
            {/* API Key */}
            <div className="rounded-xl border bg-neutral-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-neutral-900">API Key</span>
                <span className="text-[10px] text-neutral-500">Created Jan 15, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-mono text-neutral-700">
                  {showApiKey
                    ? "kea_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z7f2d"
                    : "kea_live_****\u2026****7f2d"}
                </code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button variant="outline" size="icon-sm">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div className="rounded-xl border bg-neutral-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-neutral-900">Webhook Secret</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                  <Lock className="h-3 w-3" />
                  Encrypted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-mono text-neutral-700">
                  {showWebhookSecret
                    ? "whsec_t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s3a1b"
                    : "whsec_****\u2026****3a1b"}
                </code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                >
                  {showWebhookSecret ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button variant="outline" size="icon-sm">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Rate Limit & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl border bg-neutral-50 px-4 py-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Rate Limit
                  </p>
                  <p className="text-sm font-bold text-neutral-900 mt-0.5">1,000 req/min</p>
                </div>
                <div className="rounded-xl border bg-neutral-50 px-4 py-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Current Usage
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-bold text-neutral-900">145/min</p>
                    <div className="h-2 w-20 rounded-full bg-neutral-200 overflow-hidden">
                      <div className="h-full w-[14.5%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  API Docs
                </Button>
                <Button size="sm">
                  <Key className="h-3.5 w-3.5" />
                  Generate New Key
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/*  Section 7: Sync History Log                                       */}
      {/* ================================================================== */}
      <Card className="py-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-neutral-600" />
              Sync History
            </CardTitle>
            <span className="text-xs text-neutral-500">Last 10 events</span>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3 text-xs">Timestamp</th>
                  <th className="text-left font-medium px-4 py-3 text-xs">Integration</th>
                  <th className="text-left font-medium px-4 py-3 text-xs">Action</th>
                  <th className="text-left font-medium px-4 py-3 text-xs">Records</th>
                  <th className="text-left font-medium px-4 py-3 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {SYNC_HISTORY.map((event) => (
                  <tr key={event.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 text-neutral-500 tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {event.timestamp}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{event.integration}</td>
                    <td className="px-4 py-3 text-neutral-700">{event.action}</td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{event.records}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={event.status} />
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
