"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileQuestion,
  ClipboardList,
  Truck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FolderOpen,
  AlertTriangle,
  FileText,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronRight,
  Search,
  Bell,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  MessageSquare,
  CreditCard,
  Hammer,
  ShieldCheck,
  Eye,
  CalendarDays,
  Activity,
  Zap,
  ExternalLink,
  CircleDot,
  Star,
  Receipt,
  Milestone,
  Send,
  Timer,
  Wrench,
  Building2,
  Cpu,
  Store,
  PenTool,
  Smartphone,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const PM_NAME = "Alex"

const kpiCards = [
  {
    title: "Active Projects",
    value: "24",
    change: "+3",
    comparison: "vs last month",
    trend: "up" as const,
    icon: FolderOpen,
    accentColor: "emerald",
    sparkline: [40, 55, 45, 60, 50, 65, 70, 80],
  },
  {
    title: "Revenue MTD",
    value: "$487,250",
    change: "+12.3%",
    comparison: "vs last month",
    trend: "up" as const,
    icon: DollarSign,
    accentColor: "emerald",
    sparkline: [30, 40, 35, 50, 45, 55, 60, 75],
  },
  {
    title: "Profit Margin",
    value: "18.5%",
    change: "-2.1%",
    comparison: "vs last month",
    trend: "down" as const,
    icon: TrendingDown,
    accentColor: "red",
    sparkline: [70, 68, 65, 60, 58, 55, 52, 50],
  },
  {
    title: "Open RFIs",
    value: "12",
    change: "3 overdue",
    comparison: "",
    trend: "warning" as const,
    icon: FileQuestion,
    accentColor: "amber",
    sparkline: [5, 8, 6, 10, 9, 11, 14, 12],
  },
  {
    title: "Change Orders Pending",
    value: "8",
    change: "$142,500 total",
    comparison: "",
    trend: "warning" as const,
    icon: FileText,
    accentColor: "amber",
    sparkline: [3, 4, 5, 6, 5, 7, 8, 8],
  },
  {
    title: "Labor Utilization",
    value: "87%",
    change: "+5%",
    comparison: "vs last month",
    trend: "up" as const,
    icon: Users,
    accentColor: "emerald",
    sparkline: [60, 65, 70, 72, 75, 80, 82, 87],
  },
]

const projects = [
  {
    name: "Johnson Kitchen Remodel",
    client: "Robert Johnson",
    phase: "Interior Finishes",
    budget: 85000,
    spent: 62050,
    completion: 73,
    scheduleHealth: "on-track" as const,
    scheduleDelta: "",
    openIssues: 2,
    lastUpdate: "2 hours ago",
  },
  {
    name: "Chen Master Bath",
    client: "David Chen",
    phase: "Plumbing Rough",
    budget: 42000,
    spent: 22260,
    completion: 45,
    scheduleHealth: "behind" as const,
    scheduleDelta: "3 days",
    openIssues: 4,
    lastUpdate: "30 min ago",
  },
  {
    name: "Thompson New Construction",
    client: "Mark Thompson",
    phase: "Framing",
    budget: 1200000,
    spent: 336000,
    completion: 28,
    scheduleHealth: "on-track" as const,
    scheduleDelta: "",
    openIssues: 1,
    lastUpdate: "1 hour ago",
  },
  {
    name: "Garcia Pool & Patio",
    client: "Maria Garcia",
    phase: "Excavation",
    budget: 65000,
    spent: 9750,
    completion: 15,
    scheduleHealth: "ahead" as const,
    scheduleDelta: "2 days",
    openIssues: 0,
    lastUpdate: "4 hours ago",
  },
  {
    name: "Williams Roof Replace",
    client: "Mary Williams",
    phase: "Exterior",
    budget: 28000,
    spent: 25200,
    completion: 90,
    scheduleHealth: "on-track" as const,
    scheduleDelta: "",
    openIssues: 1,
    lastUpdate: "3 hours ago",
  },
  {
    name: "Davis ADU Build",
    client: "James Davis",
    phase: "Foundation",
    budget: 185000,
    spent: 40700,
    completion: 22,
    scheduleHealth: "behind" as const,
    scheduleDelta: "5 days",
    openIssues: 6,
    lastUpdate: "15 min ago",
  },
  {
    name: "Martinez HVAC Upgrade",
    client: "Elena Martinez",
    phase: "MEP Install",
    budget: 18000,
    spent: 10800,
    completion: 60,
    scheduleHealth: "on-track" as const,
    scheduleDelta: "",
    openIssues: 0,
    lastUpdate: "5 hours ago",
  },
  {
    name: "Park Whole Home Reno",
    client: "Soo-Jin Park",
    phase: "Demo/Rough",
    budget: 320000,
    spent: 112000,
    completion: 35,
    scheduleHealth: "at-risk" as const,
    scheduleDelta: "",
    openIssues: 3,
    lastUpdate: "45 min ago",
  },
]

const scheduleItems = [
  {
    time: "7:00 AM",
    title: "Foundation Pour - Garcia Pool",
    detail: "Solid Ground Concrete crew (4 workers)",
    type: "work" as const,
  },
  {
    time: "8:00 AM",
    title: "Framing Inspection - Thompson Build",
    detail: "Inspector: John Smith",
    type: "inspection" as const,
  },
  {
    time: "9:30 AM",
    title: "Drywall Delivery - Johnson Kitchen",
    detail: "ProBuild Supply",
    type: "delivery" as const,
  },
  {
    time: "10:00 AM",
    title: "Client Walkthrough - Williams Roof",
    detail: "Mary Williams + PM",
    type: "meeting" as const,
  },
  {
    time: "1:00 PM",
    title: "Sub Meeting - Davis ADU",
    detail: "Rodriguez Electric, Premier Plumbing",
    type: "meeting" as const,
  },
  {
    time: "2:30 PM",
    title: "HVAC Rough Inspection - Martinez",
    detail: "Inspector: Lisa Chen",
    type: "inspection" as const,
  },
  {
    time: "4:00 PM",
    title: "End of Day Report Due",
    detail: "",
    type: "deadline" as const,
  },
]

const actionItems = [
  {
    category: "Change Orders",
    icon: FileText,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    items: [
      { label: "CO-006: Thompson Build - Steel beam upgrade", amount: "$18,400", days: 3 },
      { label: "CO-007: Park Reno - Electrical panel relocation", amount: "$4,200", days: 1 },
      { label: "CO-008: Johnson Kitchen - Cabinet upgrade", amount: "$7,850", days: 5 },
    ],
  },
  {
    category: "Submittals",
    icon: Send,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    items: [
      { label: "Roofing material specs - Williams", amount: "", days: 4 },
      { label: "Custom window shop drawings - Park Reno", amount: "", days: 7 },
    ],
  },
  {
    category: "RFIs Awaiting Response",
    icon: FileQuestion,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    items: [
      { label: "RFI-021: Foundation depth clarification - Davis ADU", amount: "", days: 8 },
      { label: "RFI-022: HVAC duct routing conflict - Martinez", amount: "", days: 5 },
      { label: "RFI-023: Header size at opening - Thompson", amount: "", days: 3 },
      { label: "RFI-024: Tile layout confirmation - Chen Bath", amount: "", days: 2 },
    ],
  },
  {
    category: "Daily Logs Pending",
    icon: ClipboardList,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    items: [
      { label: "Thompson Build - Yesterday", amount: "", days: 1 },
      { label: "Davis ADU - Yesterday", amount: "", days: 1 },
    ],
  },
  {
    category: "Invoice Approval",
    icon: Receipt,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    items: [
      { label: "Premier Plumbing - Rough-in progress payment", amount: "$12,450", days: 2 },
    ],
  },
]

const teamMembers = [
  {
    name: "Mike Rodriguez",
    role: "Project Manager",
    activeProjects: 12,
    metric: "87% on-time",
    rating: 4.8,
    avatar: "MR",
    color: "bg-blue-500",
  },
  {
    name: "Sarah Kim",
    role: "Superintendent",
    activeProjects: 8,
    metric: "92% on-time",
    rating: 4.9,
    avatar: "SK",
    color: "bg-emerald-500",
  },
  {
    name: "James O'Brien",
    role: "Project Manager",
    activeProjects: 10,
    metric: "78% on-time",
    rating: 4.5,
    avatar: "JO",
    color: "bg-amber-500",
  },
  {
    name: "Lisa Chen",
    role: "Coordinator",
    activeProjects: 15,
    metric: "95% on-time",
    rating: 4.7,
    avatar: "LC",
    color: "bg-purple-500",
  },
  {
    name: "Carlos Mendez",
    role: "Estimator",
    activeProjects: 6,
    metric: "$1.2M pipeline",
    rating: 0,
    avatar: "CM",
    color: "bg-indigo-500",
  },
]

const activityFeed = [
  {
    icon: MessageSquare,
    text: "RFI-024 answered by Rodriguez Electric",
    time: "2 min ago",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: CheckCircle2,
    text: "CO-008 approved by Sarah Johnson",
    time: "15 min ago",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: ClipboardList,
    text: "Daily log submitted for Thompson Build",
    time: "1 hr ago",
    color: "text-slate-500",
    bgColor: "bg-slate-50",
  },
  {
    icon: Star,
    text: "New lead: $185K bathroom addition",
    time: "2 hr ago",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    icon: ShieldCheck,
    text: "Inspection PASSED: Framing - Garcia Pool",
    time: "3 hr ago",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: CreditCard,
    text: "Payment received: $12,450 from Williams",
    time: "4 hr ago",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    icon: CheckCircle2,
    text: "Submittal approved: Cabinet shop drawings",
    time: "5 hr ago",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Truck,
    text: "Crew dispatched: HVAC team to Martinez",
    time: "6 hr ago",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: AlertTriangle,
    text: "Budget alert: Davis ADU at 92% budget used",
    time: "Yesterday",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    icon: Milestone,
    text: "Milestone completed: Thompson Build - Foundation",
    time: "Yesterday",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
  },
]

const miniApps = [
  { name: "Estimation Tool", icon: BarChart3, status: "online", detail: "3 active estimates", color: "emerald" },
  { name: "Bid Engine", icon: Hammer, status: "online", detail: "5 active bids", color: "emerald" },
  { name: "Permits & Inspections", icon: ShieldCheck, status: "online", detail: "4 pending", color: "emerald" },
  { name: "Finance & Trust", icon: DollarSign, status: "online", detail: "2 pending releases", color: "emerald" },
  { name: "Marketplace", icon: Store, status: "online", detail: "12 active vendors", color: "emerald" },
  { name: "Architect Hub", icon: PenTool, status: "online", detail: "2 active designs", color: "emerald" },
  { name: "Inspector Mobile", icon: Smartphone, status: "online", detail: "3 inspectors active", color: "emerald" },
  { name: "Command Center", icon: Cpu, status: "online", detail: "AI ready", color: "emerald" },
]

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const height = 32
  const width = 80
  const step = width / (data.length - 1)

  const points = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  const gradientId = `spark-${color}-${data.join("")}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            className={cn(
              color === "emerald" && "text-emerald-400",
              color === "red" && "text-red-400",
              color === "amber" && "text-amber-400"
            )}
            stopColor="currentColor"
            stopOpacity={0.3}
          />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradientId})`}
        className={cn(
          color === "emerald" && "text-emerald-400",
          color === "red" && "text-red-400",
          color === "amber" && "text-amber-400"
        )}
      />
      <polyline
        points={points}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "stroke-current",
          color === "emerald" && "text-emerald-500",
          color === "red" && "text-red-500",
          color === "amber" && "text-amber-500"
        )}
      />
    </svg>
  )
}

function ScheduleTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "work":
      return <Hammer className="h-4 w-4 text-blue-500" />
    case "inspection":
      return <ShieldCheck className="h-4 w-4 text-amber-500" />
    case "delivery":
      return <Truck className="h-4 w-4 text-emerald-500" />
    case "meeting":
      return <Users className="h-4 w-4 text-purple-500" />
    case "deadline":
      return <Timer className="h-4 w-4 text-red-500" />
    default:
      return <Circle className="h-4 w-4 text-neutral-400" />
  }
}

function ProgressBar({
  value,
  max,
  color = "blue",
  className,
}: {
  value: number
  max: number
  color?: string
  className?: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={cn("w-full bg-neutral-100 rounded-full h-2", className)}>
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-500",
          color === "blue" && "bg-blue-500",
          color === "emerald" && "bg-emerald-500",
          color === "amber" && "bg-amber-500",
          color === "red" && "bg-red-500",
          color === "purple" && "bg-purple-500",
          color === "indigo" && "bg-indigo-500"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function HorizontalBar({
  label,
  value,
  maxValue,
  color,
  displayValue,
}: {
  label: string
  value: number
  maxValue: number
  color: string
  displayValue: string
}) {
  const pct = (value / maxValue) * 100
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold text-neutral-900">{displayValue}</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-3">
        <div
          className={cn(
            "h-3 rounded-full transition-all duration-700",
            color === "blue" && "bg-blue-500",
            color === "emerald" && "bg-emerald-500",
            color === "amber" && "bg-amber-500",
            color === "red" && "bg-red-500",
            color === "purple" && "bg-purple-500",
            color === "indigo" && "bg-indigo-500",
            color === "sky" && "bg-sky-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  if (rating === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3",
            star <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-neutral-200"
          )}
        />
      ))}
      <span className="text-xs text-neutral-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function WelcomeBar() {
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
            {PM_NAME}
          </h1>
          <p className="text-slate-300 mt-1 text-sm">
            {format(now, "EEEE, MMMM d, yyyy")} &middot; {format(now, "h:mm a")}
          </p>
          <p className="text-slate-400 mt-2 text-sm">
            You have{" "}
            <span className="text-amber-300 font-semibold">6 tasks</span> due today,{" "}
            <span className="text-red-400 font-semibold">2 overdue</span>, and{" "}
            <span className="text-sky-300 font-semibold">4 pending approvals</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
            <FileQuestion className="h-4 w-4" />
            New RFI
          </Button>
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
            <ClipboardList className="h-4 w-4" />
            Log Daily
          </Button>
          <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0">
            <Truck className="h-4 w-4" />
            Create Dispatch
          </Button>
        </div>
      </div>
    </div>
  )
}

function KPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.title}
            className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    kpi.accentColor === "emerald" && "bg-emerald-50",
                    kpi.accentColor === "red" && "bg-red-50",
                    kpi.accentColor === "amber" && "bg-amber-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      kpi.accentColor === "emerald" && "text-emerald-600",
                      kpi.accentColor === "red" && "text-red-600",
                      kpi.accentColor === "amber" && "text-amber-600"
                    )}
                  />
                </div>
                <MiniSparkline data={kpi.sparkline} color={kpi.accentColor} />
              </div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                {kpi.title}
              </p>
              <p className="text-2xl font-bold text-neutral-900">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {kpi.trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                {kpi.trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                {kpi.trend === "warning" && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    kpi.trend === "up" && "text-emerald-600",
                    kpi.trend === "down" && "text-red-600",
                    kpi.trend === "warning" && "text-amber-600"
                  )}
                >
                  {kpi.change}
                </span>
                {kpi.comparison && (
                  <span className="text-xs text-neutral-400">{kpi.comparison}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ProjectHealthMatrix() {
  const [search, setSearch] = React.useState("")

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
  )

  const scheduleLabel = (project: (typeof projects)[0]) => {
    switch (project.scheduleHealth) {
      case "ahead":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight className="h-3 w-3" />
            Ahead {project.scheduleDelta}
          </span>
        )
      case "on-track":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            On Track
          </span>
        )
      case "behind":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            <ArrowDownRight className="h-3 w-3" />
            Behind {project.scheduleDelta}
          </span>
        )
      case "at-risk":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            At Risk
          </span>
        )
    }
  }

  const budgetColor = (project: (typeof projects)[0]) => {
    const pct = (project.spent / project.budget) * 100
    const ratio = pct / project.completion
    if (ratio > 1.15) return "red"
    if (ratio > 1.0) return "amber"
    return "emerald"
  }

  const rowBg = (project: (typeof projects)[0]) => {
    if (project.scheduleHealth === "behind") return "bg-red-50/40"
    if (project.scheduleHealth === "at-risk") return "bg-amber-50/40"
    return ""
  }

  const formatBudget = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    return `$${(v / 1_000).toFixed(0)}K`
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">Project Health Matrix</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left font-medium text-neutral-500 px-6 py-3">Project</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3 hidden lg:table-cell">
                  Client
                </th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3 hidden md:table-cell">
                  Phase
                </th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3">Budget Health</th>
                <th className="text-left font-medium text-neutral-500 px-4 py-3">Schedule</th>
                <th className="text-center font-medium text-neutral-500 px-4 py-3 hidden sm:table-cell">
                  Issues
                </th>
                <th className="text-right font-medium text-neutral-500 px-6 py-3 hidden xl:table-cell">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr
                  key={project.name}
                  className={cn(
                    "border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors cursor-pointer",
                    rowBg(project)
                  )}
                >
                  <td className="px-6 py-3">
                    <div className="font-medium text-neutral-900">{project.name}</div>
                    <div className="text-xs text-neutral-400 lg:hidden">{project.client}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell">{project.client}</td>
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                    <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{project.phase}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1">
                        <ProgressBar
                          value={project.spent}
                          max={project.budget}
                          color={budgetColor(project)}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 whitespace-nowrap">
                        {formatBudget(project.spent)}/{formatBudget(project.budget)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{project.completion}% complete</div>
                  </td>
                  <td className="px-4 py-3">{scheduleLabel(project)}</td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {project.openIssues > 0 ? (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                          project.openIssues >= 4
                            ? "bg-red-100 text-red-700"
                            : project.openIssues >= 2
                              ? "bg-amber-100 text-amber-700"
                              : "bg-neutral-100 text-neutral-600"
                        )}
                      >
                        {project.openIssues}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-neutral-400 hidden xl:table-cell">
                    {project.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function TodaySchedule() {
  const currentHour = new Date().getHours()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-neutral-500">
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            Full Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {scheduleItems.map((item, index) => {
            const hour = parseInt(item.time)
            const isPM = item.time.includes("PM")
            const itemHour = isPM && hour !== 12 ? hour + 12 : hour
            const isPast = itemHour < currentHour
            const isCurrent = itemHour === currentHour

            return (
              <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 z-10 shrink-0",
                      isCurrent
                        ? "border-blue-500 bg-blue-500 ring-4 ring-blue-100"
                        : isPast
                          ? "border-neutral-300 bg-neutral-300"
                          : "border-neutral-300 bg-white"
                    )}
                  />
                  {index < scheduleItems.length - 1 && (
                    <div className="w-px flex-1 bg-neutral-200 mt-1" />
                  )}
                </div>
                {/* Content */}
                <div
                  className={cn(
                    "flex-1 -mt-0.5 rounded-lg px-3 py-2 transition-colors",
                    isCurrent && "bg-blue-50 ring-1 ring-blue-200",
                    isPast && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-mono font-semibold",
                        isCurrent ? "text-blue-600" : "text-neutral-500"
                      )}
                    >
                      {item.time}
                    </span>
                    <ScheduleTypeIcon type={item.type} />
                  </div>
                  <p className="text-sm font-medium text-neutral-900 mt-0.5">{item.title}</p>
                  {item.detail && (
                    <p className="text-xs text-neutral-500 mt-0.5">{item.detail}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionItemsList() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Action Items &amp; Approvals Pending</CardTitle>
          <span className="inline-flex items-center justify-center bg-red-100 text-red-700 text-xs font-bold rounded-full px-2 py-0.5">
            12
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {actionItems.map((group) => {
          const Icon = group.icon
          return (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("rounded-md p-1", group.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", group.color)} />
                </div>
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  {group.category}
                </h4>
                <span className="text-xs text-neutral-400">({group.items.length})</span>
              </div>
              <div className="space-y-1.5 ml-7">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-neutral-50 transition-colors cursor-pointer group"
                  >
                    <span className="text-sm text-neutral-700 group-hover:text-neutral-900 truncate mr-2">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.amount && (
                        <span className="text-xs font-semibold text-neutral-900">{item.amount}</span>
                      )}
                      {item.days > 0 && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            item.days >= 7
                              ? "bg-red-50 text-red-600"
                              : item.days >= 3
                                ? "bg-amber-50 text-amber-600"
                                : "bg-neutral-100 text-neutral-500"
                          )}
                        >
                          {item.days}d
                        </span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function FinancialSnapshot() {
  const budgetVsActual = [
    { name: "Thompson Build", budget: 1200000, actual: 336000, completion: 28 },
    { name: "Davis ADU", budget: 185000, actual: 170200, completion: 22 },
    { name: "Park Reno", budget: 320000, actual: 112000, completion: 35 },
    { name: "Johnson Kitchen", budget: 85000, actual: 62050, completion: 73 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Financial Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cash Flow */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Cash Flow This Month
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs w-16 text-neutral-500">Inflows</span>
              <div className="flex-1 bg-neutral-100 rounded h-6 relative overflow-hidden">
                <div
                  className="h-6 rounded bg-emerald-500 flex items-center justify-end pr-2 transition-all duration-700"
                  style={{ width: "100%" }}
                >
                  <span className="text-xs font-semibold text-white">$245K</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs w-16 text-neutral-500">Outflows</span>
              <div className="flex-1 bg-neutral-100 rounded h-6 relative overflow-hidden">
                <div
                  className="h-6 rounded bg-red-400 flex items-center justify-end pr-2 transition-all duration-700"
                  style={{ width: `${(198 / 245) * 100}%` }}
                >
                  <span className="text-xs font-semibold text-white">$198K</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-600 font-semibold">Net: +$47K</span>
            </div>
          </div>
        </div>

        {/* Revenue by Project Type */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Revenue by Project Type
          </h4>
          <div className="space-y-2.5">
            <HorizontalBar label="New Construction" value={420} maxValue={420} color="blue" displayValue="$420K" />
            <HorizontalBar label="Remodels" value={310} maxValue={420} color="emerald" displayValue="$310K" />
            <HorizontalBar label="Commercial" value={190} maxValue={420} color="purple" displayValue="$190K" />
            <HorizontalBar label="Repairs" value={85} maxValue={420} color="amber" displayValue="$85K" />
          </div>
        </div>

        {/* Budget vs Actual */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Budget vs Actual
          </h4>
          <div className="space-y-3">
            {budgetVsActual.map((proj) => {
              const budgetPct = (proj.actual / proj.budget) * 100
              const isOverBudget = budgetPct > proj.completion * 1.15
              return (
                <div key={proj.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-700 font-medium truncate mr-2">{proj.name}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        isOverBudget ? "text-red-600" : "text-neutral-600"
                      )}
                    >
                      {budgetPct.toFixed(0)}% spent ({proj.completion}% done)
                    </span>
                  </div>
                  <div className="relative w-full bg-neutral-100 rounded-full h-2.5">
                    {/* Budget bar (background) */}
                    <div
                      className="absolute top-0 left-0 h-2.5 rounded-full bg-blue-200"
                      style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    />
                    {/* Actual spend overlay */}
                    <div
                      className={cn(
                        "absolute top-0 left-0 h-2.5 rounded-full",
                        isOverBudget ? "bg-red-500" : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(proj.completion, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AR Aging */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Accounts Receivable Aging
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Current", value: "$125K", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "30 Days", value: "$45K", color: "text-amber-600", bg: "bg-amber-50" },
              { label: "60 Days", value: "$18K", color: "text-orange-600", bg: "bg-orange-50" },
              { label: "90+ Days", value: "$8K", color: "text-red-600", bg: "bg-red-50" },
            ].map((ar) => (
              <div key={ar.label} className={cn("rounded-lg p-2.5 text-center", ar.bg)}>
                <p className={cn("text-sm font-bold", ar.color)}>{ar.value}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{ar.label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamPerformance() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Team Performance</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-neutral-500">
            <Users className="h-3.5 w-3.5 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0",
                  member.color
                )}
              >
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-900 truncate">{member.name}</p>
                  <StarRating rating={member.rating} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-500">{member.role}</span>
                  <span className="text-neutral-300">&middot;</span>
                  <span className="text-xs text-neutral-500">
                    {member.activeProjects} {member.role === "Estimator" ? "estimates/mo" : "projects"}
                  </span>
                  <span className="text-neutral-300">&middot;</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      member.metric.includes("$")
                        ? "text-blue-600"
                        : parseInt(member.metric) >= 90
                          ? "text-emerald-600"
                          : parseInt(member.metric) >= 80
                            ? "text-amber-600"
                            : "text-red-600"
                    )}
                  >
                    {member.metric}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-neutral-500">
            <Activity className="h-3.5 w-3.5 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activityFeed.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer group"
              >
                <div className={cn("rounded-lg p-1.5 shrink-0 mt-0.5", item.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 group-hover:text-neutral-900 leading-snug">
                    {item.text}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function WeatherWidget() {
  return (
    <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weather</CardTitle>
          <Cloud className="h-5 w-5 text-sky-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Sun className="h-12 w-12 text-amber-400" />
          <div>
            <p className="text-3xl font-bold text-neutral-900">72&deg;F</p>
            <p className="text-sm text-neutral-600">Partly Cloudy</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-500" />
            <span className="text-xs text-neutral-600">8 mph NW</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-500" />
            <span className="text-xs text-neutral-600">10% precip</span>
          </div>
        </div>
        <div className="border-t border-sky-200/60 pt-3 mb-3">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs font-medium text-neutral-700">Tomorrow: 68&deg;F, Rain likely (40%)</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">2 outdoor jobs may be affected</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniAppQuickLinks() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Connected Apps</CardTitle>
          <LayoutDashboard className="h-4 w-4 text-neutral-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {miniApps.map((app) => {
            const Icon = app.icon
            return (
              <div
                key={app.name}
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer group"
              >
                <div className="rounded-lg bg-neutral-100 p-2 group-hover:bg-white transition-colors">
                  <Icon className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{app.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-neutral-500">{app.detail}</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Welcome Bar */}
        <WelcomeBar />

        {/* 2. KPI Cards */}
        <KPICards />

        {/* 3. Project Health Matrix */}
        <ProjectHealthMatrix />

        {/* 4-5. Schedule + Action Items Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <TodaySchedule />
          </div>
          <div className="lg:col-span-7">
            <ActionItemsList />
          </div>
        </div>

        {/* 6-7. Financial Snapshot + Team Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <FinancialSnapshot />
          </div>
          <div className="lg:col-span-5">
            <TeamPerformance />
          </div>
        </div>

        {/* 8-9-10. Activity Feed + Weather + Mini Apps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <RecentActivityFeed />
          </div>
          <div className="lg:col-span-3">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-4">
            <MiniAppQuickLinks />
          </div>
        </div>
      </div>
    </div>
  )
}
