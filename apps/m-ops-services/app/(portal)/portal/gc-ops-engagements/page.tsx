"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select } from "@/components/ui"
import {
  Users,
  DollarSign,
  Search,
  Plus,
  CheckSquare,
  Clock,
  Shield,
  TrendingUp,
  Building2,
  Filter,
} from "lucide-react"

interface Engagement {
  id: string
  company: string
  contactName: string
  contactEmail: string
  packageTier: string
  status: string
  monthlyFee: number
  hoursLogged: number
  hoursAllotted: number
  tasksCompleted: number
  tasksTotal: number
  slaCompliance: number
  startDate: string
  nextReviewDate?: string
}

interface EngagementStats {
  activeClients: number
  totalMRR: number
  tasksThisWeek: number
  avgSlaCompliance: number
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "PAUSED", label: "Paused" },
  { value: "CHURNED", label: "Churned" },
  { value: "TRIAL", label: "Trial" },
]

const PACKAGE_OPTIONS = [
  { value: "", label: "All Packages" },
  { value: "STARTER", label: "Starter" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "ENTERPRISE", label: "Enterprise" },
]

export default function GCOpsEngagementsPage() {
  const router = useRouter()
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [stats, setStats] = useState<EngagementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [packageFilter, setPackageFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEngagements = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter) params.append("status", statusFilter)
      if (packageFilter) params.append("packageTier", packageFilter)

      const response = await fetch(`/api/gc-ops-engagements?${params}`)
      if (!response.ok) throw new Error("Failed to fetch engagements")
      const data = await response.json()

      setEngagements(data.engagements)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Error fetching engagements:", err)
      setError("Failed to load engagements.")
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, packageFilter])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/gc-ops-engagements/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }, [])

  useEffect(() => {
    fetchEngagements()
    fetchStats()
  }, [fetchEngagements, fetchStats])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      ONBOARDING: "bg-blue-100 text-blue-800",
      PAUSED: "bg-yellow-100 text-yellow-800",
      CHURNED: "bg-red-100 text-red-800",
      TRIAL: "bg-purple-100 text-purple-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPackageBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      STARTER: "bg-gray-100 text-gray-800",
      PROFESSIONAL: "bg-blue-100 text-blue-800",
      ENTERPRISE: "bg-purple-100 text-purple-800",
    }
    return colors[tier] || "bg-gray-100 text-gray-800"
  }

  const getSlaColor = (compliance: number) => {
    if (compliance >= 95) return "text-green-600"
    if (compliance >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading engagements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GC Operations Engagements
            </h1>
            <p className="text-gray-600">
              Manage active contractor operations service engagements
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Engagement
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Clients</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.activeClients}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.totalMRR)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasks This Week</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.tasksThisWeek}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <CheckSquare className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">SLA Compliance</p>
                    <p className={`text-2xl font-bold mt-1 ${getSlaColor(stats.avgSlaCompliance)}`}>
                      {stats.avgSlaCompliance.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
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
                  placeholder="Search by company name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full md:w-48"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Select
                value={packageFilter}
                onChange={(e) => {
                  setPackageFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full md:w-48"
              >
                {PACKAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                  setPackageFilter("")
                  setPage(1)
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchEngagements()}
              className="mt-2 text-red-700 border-red-300"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Engagements List */}
        <Card>
          <CardHeader>
            <CardTitle>All Engagements ({engagements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  onClick={() => router.push(`/portal/gc-ops-engagements/${engagement.id}`)}
                  className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {engagement.company}
                        </h3>
                        <Badge className={getStatusBadgeColor(engagement.status)}>
                          {engagement.status}
                        </Badge>
                        <Badge className={getPackageBadgeColor(engagement.packageTier)}>
                          {engagement.packageTier}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {engagement.contactName} -- Started {formatDate(engagement.startDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(engagement.monthlyFee)}
                      </p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4" />
                        Hours Logged
                      </div>
                      <p className="font-semibold text-gray-900">
                        {engagement.hoursLogged} / {engagement.hoursAllotted}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            engagement.hoursLogged / engagement.hoursAllotted > 0.9
                              ? "bg-red-500"
                              : engagement.hoursLogged / engagement.hoursAllotted > 0.7
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (engagement.hoursLogged / engagement.hoursAllotted) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <CheckSquare className="h-4 w-4" />
                        Tasks Done
                      </div>
                      <p className="font-semibold text-gray-900">
                        {engagement.tasksCompleted} / {engagement.tasksTotal}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-green-500"
                          style={{
                            width: `${
                              engagement.tasksTotal > 0
                                ? (engagement.tasksCompleted / engagement.tasksTotal) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Shield className="h-4 w-4" />
                        SLA Compliance
                      </div>
                      <p className={`font-semibold ${getSlaColor(engagement.slaCompliance)}`}>
                        {engagement.slaCompliance.toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        Next Review
                      </div>
                      <p className="font-semibold text-gray-900">
                        {engagement.nextReviewDate
                          ? formatDate(engagement.nextReviewDate)
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                </div>
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

            {engagements.length === 0 && !error && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No engagements found.</p>
                <p className="text-sm text-gray-500">
                  Create a new engagement or convert a lead to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
