"use client"

export const dynamic = 'force-dynamic';

import * as React from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Filter, X, DollarSign, MapPin, User, Building2 } from "lucide-react"

import { api } from "@/lib/api-client"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import type { Lead, LeadStage } from "@/lib/types"

const STAGES: LeadStage[] = ["INTAKE", "QUALIFIED", "SCOPED", "QUOTED", "WON", "LOST"]

const STAGE_LABELS: Record<LeadStage, string> = {
  INTAKE: "Intake",
  QUALIFIED: "Qualified",
  SCOPED: "Scoped",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
}

const STAGE_COLORS: Record<LeadStage, string> = {
  INTAKE: "bg-blue-50 text-blue-700 border-blue-200",
  QUALIFIED: "bg-purple-50 text-purple-700 border-purple-200",
  SCOPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  QUOTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
}

type Filters = {
  estimatedValueMin?: number
  estimatedValueMax?: number
  city?: string
  state?: string
  projectType?: string
  assignedSalesRepId?: string
}

export default function PipelinePage() {
  const [filters, setFilters] = React.useState<Filters>({})
  const [showFilters, setShowFilters] = React.useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["pipeline-leads", filters],
    queryFn: () => api.listLeads(filters),
  })

  const leads = (data?.leads ?? []) as Lead[]

  // Group leads by stage
  const leadsByStage = React.useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      INTAKE: [],
      QUALIFIED: [],
      SCOPED: [],
      QUOTED: [],
      WON: [],
      LOST: [],
    }

    leads.forEach((lead) => {
      if (lead.stage in grouped) {
        grouped[lead.stage].push(lead)
      }
    })

    return grouped
  }, [leads])

  function formatCurrency(value: string | null | undefined): string {
    if (!value) return "—"
    const num = parseFloat(value)
    if (isNaN(num)) return "—"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  function clearFilters() {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-neutral-600 mt-1">Manage leads through the sales pipeline stages.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4" />
            Filters {hasActiveFilters && `(${Object.values(filters).filter((v) => v).length})`}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Min Value ($)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.estimatedValueMin || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      estimatedValueMin: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Max Value ($)</label>
                <Input
                  type="number"
                  placeholder="500000"
                  value={filters.estimatedValueMax || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      estimatedValueMax: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={filters.city || ""}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">State</label>
                <Input
                  placeholder="State"
                  value={filters.state || ""}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Project Type</label>
                <Input
                  placeholder="Project type"
                  value={filters.projectType || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, projectType: e.target.value || undefined })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Sales Rep ID</label>
                <Input
                  placeholder="User UUID"
                  value={filters.assignedSalesRepId || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      assignedSalesRepId: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-neutral-600">Loading leads...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            Error loading leads: {error instanceof Error ? error.message : "Unknown error"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage]
            return (
              <Card key={stage} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{STAGE_LABELS[stage]}</CardTitle>
                    <span
                      className={cn(
                        "text-xs rounded-full border px-2 py-1",
                        STAGE_COLORS[stage]
                      )}
                    >
                      {stageLeads.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[600px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-sm text-neutral-500 text-center py-4">No leads</div>
                  ) : (
                    stageLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/pipeline/${lead.id}`}
                        className="block p-3 rounded-lg border bg-white hover:border-primary hover:shadow-sm transition-all"
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm text-neutral-900">{lead.name}</div>
                          {lead.estimatedValue && (
                            <div className="flex items-center gap-1 text-xs text-neutral-600">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(lead.estimatedValue)}
                            </div>
                          )}
                          {(lead.city || lead.state) && (
                            <div className="flex items-center gap-1 text-xs text-neutral-600">
                              <MapPin className="h-3 w-3" />
                              {[lead.city, lead.state].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {lead.assignedSalesRep && (
                            <div className="flex items-center gap-1 text-xs text-neutral-600">
                              <User className="h-3 w-3" />
                              {lead.assignedSalesRep.name}
                            </div>
                          )}
                          {lead.projectType && (
                            <div className="flex items-center gap-1 text-xs text-neutral-600">
                              <Building2 className="h-3 w-3" />
                              {lead.projectType}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {data && (
        <div className="text-sm text-neutral-600">
          Showing {leads.length} of {data.total} leads
        </div>
      )}
    </div>
  )
}
