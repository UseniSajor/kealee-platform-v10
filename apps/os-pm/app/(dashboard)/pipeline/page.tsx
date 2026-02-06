"use client"

import * as React from "react"
import {
  DollarSign,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Filter,
  Plus,
  Search,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  Star,
  Clock,
  MapPin,
  Building2,
  Target,
  Percent,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadSource =
  | "Referral"
  | "Website"
  | "Social Media"
  | "Advertising"
  | "Walk-in"
  | "Marketplace"

type PipelineStage =
  | "new_leads"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"

interface PipelineLead {
  id: number
  contact: string
  project: string
  value: number
  source: LeadSource
  daysInStage: number | null
  score: number | null
  followUp?: string
  statusNote?: string
  assignedPM: string
  closedDate?: string
}

interface PipelineColumn {
  key: PipelineStage
  label: string
  leads: PipelineLead[]
}

interface ActivityItem {
  id: number
  text: string
  time: string
  type: "move" | "overdue" | "proposal" | "won" | "lost" | "note" | "call" | "email"
}

// ---------------------------------------------------------------------------
// Source badge colors
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<LeadSource, string> = {
  Referral: "bg-purple-100 text-purple-700 border-purple-200",
  Website: "bg-blue-100 text-blue-700 border-blue-200",
  "Social Media": "bg-pink-100 text-pink-700 border-pink-200",
  Advertising: "bg-amber-100 text-amber-700 border-amber-200",
  "Walk-in": "bg-green-100 text-green-700 border-green-200",
  Marketplace: "bg-cyan-100 text-cyan-700 border-cyan-200",
}

// ---------------------------------------------------------------------------
// Stage header colors
// ---------------------------------------------------------------------------

const STAGE_HEADER_COLORS: Record<PipelineStage, string> = {
  new_leads: "border-blue-400 bg-blue-50 text-blue-800",
  contacted: "border-amber-400 bg-amber-50 text-amber-800",
  qualified: "border-purple-400 bg-purple-50 text-purple-800",
  proposal_sent: "border-orange-400 bg-orange-50 text-orange-800",
  negotiation: "border-cyan-400 bg-cyan-50 text-cyan-800",
  won: "border-emerald-400 bg-emerald-50 text-emerald-800",
}

const STAGE_DOT_COLORS: Record<PipelineStage, string> = {
  new_leads: "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-purple-500",
  proposal_sent: "bg-orange-500",
  negotiation: "bg-cyan-500",
  won: "bg-emerald-500",
}

const STAGE_BORDER_ACCENT: Record<PipelineStage, string> = {
  new_leads: "border-t-blue-400",
  contacted: "border-t-amber-400",
  qualified: "border-t-purple-400",
  proposal_sent: "border-t-orange-400",
  negotiation: "border-t-cyan-400",
  won: "border-t-emerald-400",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    key: "new_leads",
    label: "New Leads",
    leads: [
      { id: 1, contact: "Sarah Mitchell", project: "Kitchen & Bath Remodel", value: 65000, source: "Referral", daysInStage: 2, score: 82, assignedPM: "MR" },
      { id: 2, contact: "Tom Bradley", project: "Garage Conversion", value: 45000, source: "Website", daysInStage: 1, score: 71, assignedPM: "JL" },
      { id: 3, contact: "Rachel Green", project: "Landscape Overhaul", value: 35000, source: "Social Media", daysInStage: 3, score: 65, assignedPM: "KS" },
      { id: 4, contact: "Omar Hassan", project: "Office Build-Out", value: 190000, source: "Walk-in", daysInStage: 0, score: 88, assignedPM: "MR" },
      { id: 5, contact: "Linda Torres", project: "Bathroom Remodel", value: 150000, source: "Marketplace", daysInStage: 1, score: 79, assignedPM: "JL" },
    ],
  },
  {
    key: "contacted",
    label: "Contacted",
    leads: [
      { id: 6, contact: "James Patterson", project: "Whole Home Reno", value: 280000, source: "Referral", daysInStage: 5, score: null, followUp: "Tomorrow", assignedPM: "MR" },
      { id: 7, contact: "Nicole Rivera", project: "Master Suite Add", value: 120000, source: "Website", daysInStage: 4, score: null, followUp: "Today", assignedPM: "KS" },
      { id: 8, contact: "Steve Kim", project: "Deck & Patio", value: 42000, source: "Social Media", daysInStage: 7, score: null, followUp: "Overdue!", assignedPM: "JL" },
      { id: 9, contact: "Amy Chen", project: "Basement Finish", value: 78000, source: "Referral", daysInStage: 3, score: null, followUp: "Feb 8", assignedPM: "MR" },
    ],
  },
  {
    key: "qualified",
    label: "Qualified",
    leads: [
      { id: 10, contact: "Robert Hayes", project: "Custom Home", value: 425000, source: "Referral", daysInStage: 12, score: null, statusNote: "Site visit scheduled", assignedPM: "MR" },
      { id: 11, contact: "Maria Gonzalez", project: "Kitchen Reno", value: 55000, source: "Website", daysInStage: 8, score: null, statusNote: "Budget confirmed", assignedPM: "KS" },
      { id: 12, contact: "Paul Thompson", project: "Roof + Solar", value: 95000, source: "Advertising", daysInStage: 10, score: null, statusNote: "HOA approved", assignedPM: "JL" },
      { id: 13, contact: "Diane Foster", project: "ADU Build", value: 100000, source: "Marketplace", daysInStage: 6, score: null, statusNote: "Permits researched", assignedPM: "MR" },
    ],
  },
  {
    key: "proposal_sent",
    label: "Proposal Sent",
    leads: [
      { id: 14, contact: "Chris Morgan", project: "Home Addition", value: 175000, source: "Referral", daysInStage: 18, score: null, statusNote: "Sent Feb 1, awaiting response", assignedPM: "KS" },
      { id: 15, contact: "Jessica Wu", project: "Commercial TI", value: 145000, source: "Walk-in", daysInStage: 15, score: null, statusNote: "Client reviewing", assignedPM: "MR" },
      { id: 16, contact: "Brian O'Malley", project: "Bath Remodel", value: 92000, source: "Website", daysInStage: 20, score: null, statusNote: "2nd revision sent", assignedPM: "JL" },
    ],
  },
  {
    key: "negotiation",
    label: "Negotiation",
    leads: [
      { id: 17, contact: "Angela Davis", project: "New Build", value: 285000, source: "Referral", daysInStage: 25, score: null, statusNote: "Finalizing scope", assignedPM: "MR" },
      { id: 18, contact: "Kevin Park", project: "Office Remodel", value: 70000, source: "Walk-in", daysInStage: 22, score: null, statusNote: "Price negotiation", assignedPM: "KS" },
    ],
  },
  {
    key: "won",
    label: "Won This Month",
    leads: [
      { id: 19, contact: "Thompson Family Trust", project: "New Construction", value: 320000, source: "Referral", daysInStage: null, score: null, closedDate: "Closed Jan 28", assignedPM: "MR" },
      { id: 20, contact: "Williams Residence", project: "Roof", value: 80500, source: "Website", daysInStage: null, score: null, closedDate: "Closed Feb 2", assignedPM: "JL" },
    ],
  },
]

const RECENT_ACTIVITIES: ActivityItem[] = [
  { id: 1, text: "Omar Hassan moved to New Leads", time: "10 min ago", type: "move" },
  { id: 2, text: "Nicole Rivera follow-up overdue", time: "1 hr ago", type: "overdue" },
  { id: 3, text: "Proposal sent to Chris Morgan", time: "3 hrs ago", type: "proposal" },
  { id: 4, text: "Thompson deal WON - $320,000", time: "2 days ago", type: "won" },
  { id: 5, text: "Williams Residence moved to Won", time: "4 days ago", type: "won" },
  { id: 6, text: "Angela Davis entered Negotiation", time: "5 days ago", type: "move" },
  { id: 7, text: "Call with Kevin Park - scope discussed", time: "6 days ago", type: "call" },
  { id: 8, text: "Brian O'Malley - 2nd proposal revision sent", time: "7 days ago", type: "proposal" },
]

const FUNNEL_STAGES: { label: string; count: number; percent: string; colorBar: string; colorBg: string }[] = [
  { label: "New Leads", count: 5, percent: "100%", colorBar: "bg-blue-500", colorBg: "bg-blue-50" },
  { label: "Contacted", count: 4, percent: "80%", colorBar: "bg-amber-500", colorBg: "bg-amber-50" },
  { label: "Qualified", count: 4, percent: "80%", colorBar: "bg-purple-500", colorBg: "bg-purple-50" },
  { label: "Proposal", count: 3, percent: "75%", colorBar: "bg-orange-500", colorBg: "bg-orange-50" },
  { label: "Negotiation", count: 2, percent: "67%", colorBar: "bg-cyan-500", colorBg: "bg-cyan-50" },
  { label: "Won", count: 2, percent: "34%", colorBar: "bg-emerald-500", colorBg: "bg-emerald-50" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function columnTotal(leads: PipelineLead[]): number {
  return leads.reduce((sum, l) => sum + l.value, 0)
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "move":
      return <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
    case "overdue":
      return <Clock className="h-3.5 w-3.5 text-red-500" />
    case "proposal":
      return <Mail className="h-3.5 w-3.5 text-orange-500" />
    case "won":
      return <Star className="h-3.5 w-3.5 text-emerald-500" />
    case "lost":
      return <Target className="h-3.5 w-3.5 text-red-500" />
    case "call":
      return <Phone className="h-3.5 w-3.5 text-indigo-500" />
    case "email":
      return <Mail className="h-3.5 w-3.5 text-sky-500" />
    default:
      return <Clock className="h-3.5 w-3.5 text-neutral-400" />
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  iconBg: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            {sub && <p className="text-xs text-neutral-500">{sub}</p>}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-neutral-200">
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-neutral-600">{score}</span>
    </div>
  )
}

function LeadCard({ lead, stageKey }: { lead: PipelineLead; stageKey: PipelineStage }) {
  return (
    <div
      className={cn(
        "group cursor-grab rounded-lg border border-neutral-200 bg-white p-3.5 shadow-sm",
        "transition-all hover:shadow-md hover:border-neutral-300",
        "active:cursor-grabbing active:shadow-lg active:scale-[1.02]"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900 truncate">{lead.contact}</p>
          <p className="text-xs text-neutral-500 truncate">{lead.project}</p>
        </div>
        <button className="shrink-0 rounded p-0.5 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Value */}
      <p className="text-lg font-bold text-neutral-900 mb-2">{formatCurrency(lead.value)}</p>

      {/* Source badge */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
            SOURCE_COLORS[lead.source]
          )}
        >
          {lead.source}
        </span>
        {lead.daysInStage !== null && (
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <Clock className="h-3 w-3" />
            {lead.daysInStage === 0 ? "Today" : `${lead.daysInStage}d`}
          </span>
        )}
        {lead.closedDate && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <Star className="h-3 w-3" />
            {lead.closedDate}
          </span>
        )}
      </div>

      {/* Score bar (New Leads stage only) */}
      {lead.score !== null && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-medium text-neutral-500">Lead Score</span>
            <span className="text-[10px] font-semibold text-neutral-700">{lead.score}/100</span>
          </div>
          <ScoreBar score={lead.score} />
        </div>
      )}

      {/* Follow-up indicator (Contacted stage) */}
      {lead.followUp && (
        <div
          className={cn(
            "mb-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
            lead.followUp === "Overdue!"
              ? "bg-red-50 text-red-700"
              : lead.followUp === "Today"
                ? "bg-amber-50 text-amber-700"
                : lead.followUp === "Tomorrow"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-neutral-50 text-neutral-600"
          )}
        >
          <Calendar className="h-3 w-3" />
          Follow-up: {lead.followUp}
        </div>
      )}

      {/* Status note (Qualified / Proposal / Negotiation) */}
      {lead.statusNote && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-neutral-600">
          <Target className="h-3 w-3 shrink-0 text-neutral-400" />
          <span className="truncate">{lead.statusNote}</span>
        </div>
      )}

      {/* Bottom row: PM avatar + quick actions */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600"
          title={`Assigned PM: ${lead.assignedPM}`}
        >
          {lead.assignedPM}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600" title="Call">
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600" title="Email">
            <Mail className="h-3.5 w-3.5" />
          </button>
          {stageKey !== "won" && (
            <button
              className="rounded p-1 text-neutral-400 hover:bg-emerald-100 hover:text-emerald-600"
              title="Move to Next Stage"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const [stageFilter, setStageFilter] = React.useState("all")
  const [projectTypeFilter, setProjectTypeFilter] = React.useState("all")
  const [sourceFilter, setSourceFilter] = React.useState("all")
  const [pmFilter, setPmFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState("90")
  const [valueMin, setValueMin] = React.useState("")
  const [valueMax, setValueMax] = React.useState("")

  // Filtering logic
  const filteredColumns = React.useMemo(() => {
    return PIPELINE_COLUMNS.map((col) => {
      const filtered = col.leads.filter((lead) => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          const matchesSearch =
            lead.contact.toLowerCase().includes(q) ||
            lead.project.toLowerCase().includes(q) ||
            lead.source.toLowerCase().includes(q)
          if (!matchesSearch) return false
        }

        // Stage filter
        if (stageFilter !== "all" && col.key !== stageFilter) return false

        // Source
        if (sourceFilter !== "all" && lead.source !== sourceFilter) return false

        // PM
        if (pmFilter !== "all" && lead.assignedPM !== pmFilter) return false

        // Value range
        if (valueMin && lead.value < Number(valueMin)) return false
        if (valueMax && lead.value > Number(valueMax)) return false

        return true
      })
      return { ...col, leads: filtered }
    }).filter((col) => {
      if (stageFilter !== "all" && col.key !== stageFilter) return false
      return true
    })
  }, [searchQuery, stageFilter, sourceFilter, pmFilter, valueMin, valueMax])

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* 1. Header                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Sales Pipeline</h1>
          <p className="mt-1 text-neutral-500">
            Track deals from lead to close &mdash; manage proposals, follow-ups, and conversions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-4 w-4" />
            Import Leads
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Export Pipeline
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Pipeline Settings
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 2. KPI Cards                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          label="Pipeline Value"
          value="$2,847,500"
          sub="Total across all stages"
        />
        <KpiCard
          icon={<Target className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Weighted Value"
          value="$1,245,000"
          sub="Probability-adjusted"
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          label="Deals in Pipeline"
          value="28"
          sub="Active opportunities"
        />
        <KpiCard
          icon={<Percent className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
          label="Win Rate"
          value="34%"
          sub="Last 90 days"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-100"
          label="Avg Deal Size"
          value="$101,700"
          sub="Per closed deal"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-100"
          label="Avg Days to Close"
          value="42 days"
          sub="Lead to signed contract"
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 3. Advanced Filters                                              */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardContent className="p-4">
          {/* Always-visible search + toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search by lead name, company, or project type..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", showFilters && "rotate-180")}
              />
            </Button>
          </div>

          {/* Expandable filter row */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {/* Stage */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Stage</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="all">All Stages</option>
                  <option value="new_leads">New Leads</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal_sent">Proposal Sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                </select>
              </div>

              {/* Project Type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Project Type</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={projectTypeFilter}
                  onChange={(e) => setProjectTypeFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="new_construction">New Construction</option>
                  <option value="remodel">Remodel</option>
                  <option value="addition">Addition</option>
                  <option value="repair">Repair</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              {/* Value Min */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Min Value ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={valueMin}
                  onChange={(e) => setValueMin(e.target.value)}
                />
              </div>

              {/* Value Max */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Max Value ($)</label>
                <Input
                  type="number"
                  placeholder="500,000"
                  value={valueMax}
                  onChange={(e) => setValueMax(e.target.value)}
                />
              </div>

              {/* Source */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Source</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Marketplace">Marketplace</option>
                </select>
              </div>

              {/* Assigned PM */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Assigned PM</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={pmFilter}
                  onChange={(e) => setPmFilter(e.target.value)}
                >
                  <option value="all">All PMs</option>
                  <option value="MR">Mike Rodriguez (MR)</option>
                  <option value="JL">Jennifer Lee (JL)</option>
                  <option value="KS">Kevin Smith (KS)</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Date Range</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="30">Last 30 Days</option>
                  <option value="60">Last 60 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* 4. Kanban Pipeline Board                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none">
          {filteredColumns.map((col) => {
            const total = columnTotal(col.leads)
            return (
              <div
                key={col.key}
                className={cn(
                  "flex w-[300px] min-w-[300px] snap-start flex-col rounded-xl border-t-4 bg-neutral-50/70 border border-neutral-200",
                  STAGE_BORDER_ACCENT[col.key]
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", STAGE_DOT_COLORS[col.key])} />
                    <h3 className="text-sm font-semibold text-neutral-800">{col.label}</h3>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-200 px-1.5 text-[10px] font-bold text-neutral-600">
                      {col.leads.length}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-neutral-500">{formatCurrency(total)}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-3" style={{ maxHeight: "620px" }}>
                  {col.leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
                      <Building2 className="h-8 w-8 mb-2" />
                      <p className="text-xs">No deals in this stage</p>
                    </div>
                  ) : (
                    col.leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} stageKey={col.key} />
                    ))
                  )}
                </div>

                {/* Add deal button */}
                <div className="border-t border-neutral-200 px-3 py-2">
                  <button className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                    Add Deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 5. Pipeline Conversion Funnel + 6. Recent Activity (side by side) */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Funnel */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-neutral-500" />
              Pipeline Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FUNNEL_STAGES.map((stage, idx) => {
              // Compute bar width proportionally: first stage = 100%, then shrink
              const widths = [100, 80, 80, 60, 40, 34]
              const barWidth = widths[idx]
              return (
                <div key={stage.label} className="flex items-center gap-4">
                  <div className="w-28 shrink-0 text-right">
                    <p className="text-sm font-medium text-neutral-700">{stage.label}</p>
                    <p className="text-[10px] text-neutral-500">{stage.count} deals</p>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-9 w-full rounded-md bg-neutral-100">
                      <div
                        className={cn("h-9 rounded-md flex items-center transition-all", stage.colorBar)}
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="pl-3 text-xs font-bold text-white">{stage.percent}</span>
                      </div>
                    </div>
                  </div>
                  {idx < FUNNEL_STAGES.length - 1 && (
                    <div className="shrink-0">
                      <ChevronDown className="h-4 w-4 text-neutral-300" />
                    </div>
                  )}
                  {idx === FUNNEL_STAGES.length - 1 && (
                    <div className="shrink-0">
                      <Star className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                </div>
              )
            })}
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-sm font-semibold text-emerald-800">
                Overall Win Rate: 34%
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                2 of ~6 leads that enter the pipeline convert to a signed contract (last 90 days)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-neutral-500" />
              Recent Pipeline Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {RECENT_ACTIVITIES.map((activity, idx) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 py-3",
                    idx !== RECENT_ACTIVITIES.length - 1 && "border-b border-neutral-100"
                  )}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm text-neutral-700",
                        activity.type === "won" && "font-semibold text-emerald-700",
                        activity.type === "overdue" && "font-medium text-red-600"
                      )}
                    >
                      {activity.text}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacer for bottom scroll room */}
      <div className="h-4" />
    </div>
  )
}
