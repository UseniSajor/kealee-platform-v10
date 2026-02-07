"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select } from "@/components/ui"
import {
  TrendingUp,
  DollarSign,
  Search,
  Plus,
  FolderOpen,
  AlertTriangle,
  Building2,
  ArrowUpDown,
  Users,
  Filter,
} from "lucide-react"

interface Project {
  id: string
  name: string
  clientName: string
  clientCompany: string
  assetType: string
  status: string
  serviceTier: string
  totalBudget: number
  revenueCollected: number
  pmAssigned?: string
  startDate: string
  estimatedCompletion?: string
  createdAt: string
}

interface ProjectStats {
  activeProjects: number
  totalBudget: number
  totalRevenue: number
  openRisks: number
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PLANNING", label: "Planning" },
  { value: "PRE_DEVELOPMENT", label: "Pre-Development" },
  { value: "ACTIVE", label: "Active" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "CLOSEOUT", label: "Closeout" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
]

const TIER_OPTIONS = [
  { value: "", label: "All Tiers" },
  { value: "ADVISORY", label: "Advisory" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "FULL_SERVICE", label: "Full Service" },
]

export default function DevelopmentProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [tierFilter, setTierFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const fetchProjects = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortField,
        sortOrder,
      })

      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter) params.append("status", statusFilter)
      if (tierFilter) params.append("serviceTier", tierFilter)

      const response = await fetch(`/api/development-projects?${params}`)
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()

      setProjects(data.projects)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects.")
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, tierFilter, sortField, sortOrder])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/development-projects/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchStats()
  }, [fetchProjects, fetchStats])

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatFullCurrency = (value: number) => {
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
      PLANNING: "bg-blue-100 text-blue-800",
      PRE_DEVELOPMENT: "bg-purple-100 text-purple-800",
      ACTIVE: "bg-green-100 text-green-800",
      CONSTRUCTION: "bg-yellow-100 text-yellow-800",
      CLOSEOUT: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-emerald-100 text-emerald-800",
      ON_HOLD: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      ADVISORY: "bg-gray-100 text-gray-800",
      STANDARD: "bg-blue-100 text-blue-800",
      PREMIUM: "bg-purple-100 text-purple-800",
      FULL_SERVICE: "bg-orange-100 text-orange-800",
    }
    return colors[tier] || "bg-gray-100 text-gray-800"
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
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
              Development Projects
            </h1>
            <p className="text-gray-600">
              Manage owner's rep and development advisory projects
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/portal/development-leads")}
            >
              <Users className="h-4 w-4 mr-2" />
              Convert Lead
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.activeProjects}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Budget Under Management</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.totalBudget)}
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
                    <p className="text-sm text-gray-600">Revenue Collected</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-emerald-100 rounded-full p-3">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Risks</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.openRisks}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
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
                  placeholder="Search by project name or client..."
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
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full md:w-48"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>

              <Button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                  setTierFilter("")
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
              onClick={() => fetchProjects()}
              className="mt-2 text-red-700 border-red-300"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Projects ({projects.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th
                      className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Asset Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Service Tier
                    </th>
                    <th
                      className="text-right py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort("totalBudget")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Budget
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      PM Assigned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/portal/development-projects/${project.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">Started {formatDate(project.startDate)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900">{project.clientName}</p>
                          <p className="text-xs text-gray-500">{project.clientCompany}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {project.assetType.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getTierBadgeColor(project.serviceTier)}>
                          {project.serviceTier.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-medium text-gray-900">
                          {formatFullCurrency(project.totalBudget)}
                        </p>
                        <p className="text-xs text-green-600">
                          {formatFullCurrency(project.revenueCollected)} collected
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {project.pmAssigned || "Unassigned"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

            {projects.length === 0 && !error && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No projects found matching your filters.</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
