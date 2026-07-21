"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select } from "@ops/components/ui"
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowUpDown,
} from "lucide-react"

interface Lead {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  location: string
  assetType: string
  units: string
  projectStage: string
  budgetRange: string
  status: string
  priority: string
  assignedTo?: string
  estimatedValue?: number
  createdAt: string
  nextFollowUpAt?: string
}

interface Stats {
  overview: {
    totalLeads: number
    recentLeads: number
    needsFollowUp: number
    conversionRate: number
  }
  pipeline: {
    totalValue: number
    totalClosed: number
    activeLeadsCount: number
    wonLeadsCount: number
  }
}

export default function DevelopmentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [searchTerm, statusFilter, priorityFilter, page])

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter) params.append("status", statusFilter)
      if (priorityFilter) params.append("priority", priorityFilter)

      const response = await fetch(`/api/development-leads?${params}`)
      const data = await response.json()
      
      setLeads(data.leads)
      setTotalPages(data.pagination.totalPages)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching leads:", error)
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/development-leads/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800",
      CONTACTED: "bg-purple-100 text-purple-800",
      QUALIFIED: "bg-green-100 text-green-800",
      PROPOSAL_SENT: "bg-yellow-100 text-yellow-800",
      NEGOTIATING: "bg-orange-100 text-orange-800",
      WON: "bg-emerald-100 text-emerald-800",
      LOST: "bg-red-100 text-red-800",
      ARCHIVED: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Development Leads
          </h1>
          <p className="text-gray-600">
            Manage owner's rep and development advisory leads
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.overview.totalLeads}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="text-green-600 font-medium">
                    +{stats.overview.recentLeads}
                  </span>{" "}
                  in last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pipeline Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.pipeline.totalValue)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.pipeline.activeLeadsCount} active leads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Needs Follow-up</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.overview.needsFollowUp}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Overdue follow-ups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.overview.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.pipeline.wonLeadsCount} deals won
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, company, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATING">Negotiating</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </Select>

              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>

              <Button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                  setPriorityFilter("")
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Leads ({leads.length})</CardTitle>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/portal/development-leads/${lead.id}`}
                  className="block"
                >
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {lead.fullName}
                          </h3>
                          <Badge className={getStatusBadgeColor(lead.status)}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityBadgeColor(lead.priority)}>
                            {lead.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-600 font-medium">{lead.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatDate(lead.createdAt)}
                        </p>
                        {lead.estimatedValue && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {formatCurrency(lead.estimatedValue)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{lead.location}</span>
                      </div>
                      {lead.nextFollowUpAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Follow-up: {formatDate(lead.nextFollowUpAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {lead.assetType.replace('_', ' ')}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {lead.units} units
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {lead.projectStage.replace(/_/g, ' ')}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Budget: {lead.budgetRange}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {leads.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No leads found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
