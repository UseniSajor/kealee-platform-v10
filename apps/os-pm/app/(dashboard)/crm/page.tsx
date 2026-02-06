"use client"

import * as React from "react"
import {
  Users,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Target,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeadStage = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "WON" | "LOST"

type LeadSource = "Website" | "Referral" | "Social Media" | "Advertising" | "Walk-in" | "Partner"

interface Lead {
  id: string
  contactName: string
  projectName: string
  email: string
  phone: string
  estimatedValue: number
  source: LeadSource
  stage: LeadStage
  daysInStage: number
  nextFollowUp: Date
  assignedPM: string
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Stage configuration
// ---------------------------------------------------------------------------

const STAGES: LeadStage[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"]

const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; color: string; headerBg: string; badgeBg: string; barColor: string }
> = {
  NEW: {
    label: "New Leads",
    color: "text-blue-700",
    headerBg: "bg-blue-50 border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    barColor: "bg-blue-500",
  },
  CONTACTED: {
    label: "Contacted",
    color: "text-amber-700",
    headerBg: "bg-amber-50 border-amber-200",
    badgeBg: "bg-amber-100 text-amber-700",
    barColor: "bg-amber-500",
  },
  QUALIFIED: {
    label: "Qualified",
    color: "text-purple-700",
    headerBg: "bg-purple-50 border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    barColor: "bg-purple-500",
  },
  PROPOSAL_SENT: {
    label: "Proposal Sent",
    color: "text-orange-700",
    headerBg: "bg-orange-50 border-orange-200",
    badgeBg: "bg-orange-100 text-orange-700",
    barColor: "bg-orange-500",
  },
  WON: {
    label: "Won",
    color: "text-green-700",
    headerBg: "bg-green-50 border-green-200",
    badgeBg: "bg-green-100 text-green-700",
    barColor: "bg-green-500",
  },
  LOST: {
    label: "Lost",
    color: "text-gray-700",
    headerBg: "bg-red-50 border-red-200",
    badgeBg: "bg-red-100 text-red-700",
    barColor: "bg-gray-400",
  },
}

// ---------------------------------------------------------------------------
// Source badge colors
// ---------------------------------------------------------------------------

const SOURCE_BADGE: Record<LeadSource, string> = {
  Website: "bg-sky-100 text-sky-700",
  Referral: "bg-emerald-100 text-emerald-700",
  "Social Media": "bg-pink-100 text-pink-700",
  Advertising: "bg-indigo-100 text-indigo-700",
  "Walk-in": "bg-amber-100 text-amber-700",
  Partner: "bg-violet-100 text-violet-700",
}

// ---------------------------------------------------------------------------
// Mock data (12 leads with realistic residential construction scenarios)
// ---------------------------------------------------------------------------

const MOCK_LEADS: Lead[] = [
  {
    id: "lead-01",
    contactName: "Sarah Johnson",
    projectName: "Kitchen Remodel",
    email: "sarah.johnson@email.com",
    phone: "(512) 555-0134",
    estimatedValue: 45000,
    source: "Website",
    stage: "NEW",
    daysInStage: 2,
    nextFollowUp: new Date("2026-02-08"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-02-04"),
  },
  {
    id: "lead-02",
    contactName: "Mike Chen",
    projectName: "Bathroom Addition",
    email: "mike.chen@email.com",
    phone: "(512) 555-0278",
    estimatedValue: 85000,
    source: "Referral",
    stage: "NEW",
    daysInStage: 1,
    nextFollowUp: new Date("2026-02-07"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-02-05"),
  },
  {
    id: "lead-03",
    contactName: "Lisa Patel",
    projectName: "Deck & Patio Build",
    email: "lisa.patel@email.com",
    phone: "(737) 555-0192",
    estimatedValue: 28000,
    source: "Social Media",
    stage: "NEW",
    daysInStage: 4,
    nextFollowUp: new Date("2026-02-09"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-02-02"),
  },
  {
    id: "lead-04",
    contactName: "James Wilson",
    projectName: "Garage Conversion",
    email: "james.wilson@email.com",
    phone: "(512) 555-0345",
    estimatedValue: 62000,
    source: "Advertising",
    stage: "CONTACTED",
    daysInStage: 5,
    nextFollowUp: new Date("2026-02-10"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-01-28"),
  },
  {
    id: "lead-05",
    contactName: "Amanda Torres",
    projectName: "Master Suite Renovation",
    email: "amanda.torres@email.com",
    phone: "(737) 555-0456",
    estimatedValue: 95000,
    source: "Referral",
    stage: "CONTACTED",
    daysInStage: 3,
    nextFollowUp: new Date("2026-02-11"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-01-30"),
  },
  {
    id: "lead-06",
    contactName: "Robert Kim",
    projectName: "Whole-Home Flooring",
    email: "robert.kim@email.com",
    phone: "(512) 555-0567",
    estimatedValue: 38000,
    source: "Walk-in",
    stage: "QUALIFIED",
    daysInStage: 8,
    nextFollowUp: new Date("2026-02-12"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-01-22"),
  },
  {
    id: "lead-07",
    contactName: "Thompson Family",
    projectName: "New Build",
    email: "thompson.family@email.com",
    phone: "(512) 555-0678",
    estimatedValue: 350000,
    source: "Partner",
    stage: "QUALIFIED",
    daysInStage: 12,
    nextFollowUp: new Date("2026-02-14"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-01-18"),
  },
  {
    id: "lead-08",
    contactName: "Diana Reeves",
    projectName: "Outdoor Kitchen & Pool",
    email: "diana.reeves@email.com",
    phone: "(737) 555-0789",
    estimatedValue: 120000,
    source: "Website",
    stage: "PROPOSAL_SENT",
    daysInStage: 6,
    nextFollowUp: new Date("2026-02-13"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-01-20"),
  },
  {
    id: "lead-09",
    contactName: "Carlos Mendez",
    projectName: "ADU / Guest House",
    email: "carlos.mendez@email.com",
    phone: "(512) 555-0890",
    estimatedValue: 185000,
    source: "Referral",
    stage: "PROPOSAL_SENT",
    daysInStage: 10,
    nextFollowUp: new Date("2026-02-15"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-01-15"),
  },
  {
    id: "lead-10",
    contactName: "Natalie Brooks",
    projectName: "Roof Replacement",
    email: "natalie.brooks@email.com",
    phone: "(737) 555-0912",
    estimatedValue: 22000,
    source: "Advertising",
    stage: "PROPOSAL_SENT",
    daysInStage: 4,
    nextFollowUp: new Date("2026-02-10"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-01-25"),
  },
  {
    id: "lead-11",
    contactName: "Greg & Paula Hoffman",
    projectName: "Full Home Renovation",
    email: "hoffmans@email.com",
    phone: "(512) 555-1023",
    estimatedValue: 275000,
    source: "Partner",
    stage: "WON",
    daysInStage: 0,
    nextFollowUp: new Date("2026-02-20"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-01-05"),
  },
  {
    id: "lead-12",
    contactName: "Priya Sharma",
    projectName: "Sunroom Addition",
    email: "priya.sharma@email.com",
    phone: "(737) 555-1134",
    estimatedValue: 55000,
    source: "Website",
    stage: "WON",
    daysInStage: 0,
    nextFollowUp: new Date("2026-02-18"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "lead-13",
    contactName: "Kevin O'Brien",
    projectName: "Basement Finish",
    email: "kevin.obrien@email.com",
    phone: "(512) 555-1245",
    estimatedValue: 68000,
    source: "Social Media",
    stage: "LOST",
    daysInStage: 0,
    nextFollowUp: new Date("2026-03-01"),
    assignedPM: "David Martinez",
    createdAt: new Date("2025-12-20"),
  },
  {
    id: "lead-14",
    contactName: "Maria Gonzalez",
    projectName: "Window Replacement",
    email: "maria.gonzalez@email.com",
    phone: "(737) 555-1356",
    estimatedValue: 18000,
    source: "Walk-in",
    stage: "LOST",
    daysInStage: 0,
    nextFollowUp: new Date("2026-03-15"),
    assignedPM: "Rachel Kim",
    createdAt: new Date("2025-12-15"),
  },
  {
    id: "lead-15",
    contactName: "Tom & Janet Ellis",
    projectName: "Second Story Addition",
    email: "ellis.family@email.com",
    phone: "(512) 555-1467",
    estimatedValue: 210000,
    source: "Referral",
    stage: "CONTACTED",
    daysInStage: 7,
    nextFollowUp: new Date("2026-02-09"),
    assignedPM: "David Martinez",
    createdAt: new Date("2026-01-26"),
  },
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

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
]

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Website", label: "Website" },
  { value: "Referral", label: "Referral" },
  { value: "Social Media", label: "Social Media" },
  { value: "Advertising", label: "Advertising" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Partner", label: "Partner" },
]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [sourceFilter, setSourceFilter] = React.useState("All")

  // ---- Filtering logic ----
  const filteredLeads = React.useMemo(() => {
    return MOCK_LEADS.filter((lead) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          lead.contactName.toLowerCase().includes(q) ||
          lead.projectName.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.includes(q)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "All" && lead.stage !== statusFilter) return false

      // Source filter
      if (sourceFilter !== "All" && lead.source !== sourceFilter) return false

      return true
    })
  }, [searchQuery, statusFilter, sourceFilter])

  // ---- Group leads by stage ----
  const leadsByStage = React.useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      PROPOSAL_SENT: [],
      WON: [],
      LOST: [],
    }
    filteredLeads.forEach((lead) => {
      if (lead.stage in grouped) {
        grouped[lead.stage].push(lead)
      }
    })
    return grouped
  }, [filteredLeads])

  // ---- Stats ----
  const stats = React.useMemo(() => {
    const totalLeads = MOCK_LEADS.length
    const newThisMonth = MOCK_LEADS.filter((l) => {
      const now = new Date()
      return (
        l.createdAt.getMonth() === now.getMonth() &&
        l.createdAt.getFullYear() === now.getFullYear()
      )
    }).length
    const wonLeads = MOCK_LEADS.filter((l) => l.stage === "WON").length
    const closedLeads = MOCK_LEADS.filter(
      (l) => l.stage === "WON" || l.stage === "LOST"
    ).length
    const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0
    const pipelineValue = MOCK_LEADS.filter(
      (l) => l.stage !== "WON" && l.stage !== "LOST"
    ).reduce((sum, l) => sum + l.estimatedValue, 0)

    return { totalLeads, newThisMonth, conversionRate, pipelineValue }
  }, [])

  // ---- Pipeline value by stage (for bar chart) ----
  const pipelineByStage = React.useMemo(() => {
    const values: { stage: LeadStage; label: string; value: number }[] = STAGES.map((stage) => ({
      stage,
      label: STAGE_CONFIG[stage].label,
      value: MOCK_LEADS.filter((l) => l.stage === stage).reduce(
        (sum, l) => sum + l.estimatedValue,
        0
      ),
    }))
    return values
  }, [])

  const maxPipelineValue = Math.max(...pipelineByStage.map((s) => s.value), 1)

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM & Lead Management</h1>
          <p className="text-neutral-600 mt-1">
            Track leads, manage campaigns, and convert prospects
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Lead
        </Button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Stats Row                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Leads</p>
                <p className="text-3xl font-bold">{stats.totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">New This Month</p>
                <p className="text-3xl font-bold">{stats.newThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Conversion Rate</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Pipeline Value</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.pipelineValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filters                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search leads..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <div>
              <select
                className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === "All" ? "All Statuses" : opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source filter */}
            <div>
              <select
                className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === "All" ? "All Sources" : opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Kanban Board                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage]
          const stageLeads = leadsByStage[stage]
          const stageTotal = stageLeads.reduce((sum, l) => sum + l.estimatedValue, 0)

          return (
            <Card key={stage} className="flex flex-col">
              <CardHeader className={cn("pb-3 border-b", config.headerBg)}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-sm font-semibold", config.color)}>
                    {config.label}
                  </CardTitle>
                  <span
                    className={cn(
                      "text-xs rounded-full px-2 py-0.5 font-medium",
                      config.badgeBg
                    )}
                  >
                    {stageLeads.length}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">{formatCurrency(stageTotal)}</p>
              </CardHeader>

              <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pt-3">
                {stageLeads.length === 0 ? (
                  <div className="text-sm text-neutral-500 text-center py-6">No leads</div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Pipeline Summary Bar Chart                                       */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neutral-600" />
            <CardTitle className="text-base">Pipeline Value by Stage</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pipelineByStage.map(({ stage, label, value }) => {
            const config = STAGE_CONFIG[stage]
            const pct = maxPipelineValue > 0 ? (value / maxPipelineValue) * 100 : 0

            return (
              <div key={stage} className="flex items-center gap-4">
                <span className="w-28 text-sm font-medium text-neutral-700 shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", config.barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-24 text-sm font-semibold text-neutral-800 text-right shrink-0">
                  {formatCurrency(value)}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lead Card sub-component
// ---------------------------------------------------------------------------

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="p-3 rounded-lg border bg-white hover:border-neutral-400 hover:shadow-sm transition-all cursor-pointer">
      <div className="space-y-2">
        {/* Contact name & project */}
        <div>
          <div className="font-medium text-sm text-neutral-900">{lead.contactName}</div>
          <div className="text-xs text-neutral-500">{lead.projectName}</div>
        </div>

        {/* Email & phone */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{lead.phone}</span>
          </div>
        </div>

        {/* Estimated value */}
        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800">
          <DollarSign className="h-3 w-3" />
          {formatCurrency(lead.estimatedValue)}
        </div>

        {/* Source badge */}
        <span
          className={cn(
            "inline-block text-[10px] font-medium rounded-full px-2 py-0.5",
            SOURCE_BADGE[lead.source]
          )}
        >
          {lead.source}
        </span>

        {/* Days in stage & follow-up */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            {lead.daysInStage === 0
              ? "Closed"
              : `${lead.daysInStage}d in stage`}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(lead.nextFollowUp, "MMM d")}
          </span>
        </div>

        {/* Assigned PM */}
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
          <Users className="h-3 w-3" />
          {lead.assignedPM}
        </div>
      </div>
    </div>
  )
}
