"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select } from "@/components/ui"
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Send,
  Upload,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Building2,
  Milestone,
  Shield,
  FolderOpen,
} from "lucide-react"

interface ProjectDetail {
  id: string
  name: string
  clientName: string
  clientCompany: string
  clientEmail: string
  clientPhone?: string
  assetType: string
  status: string
  serviceTier: string
  totalBudget: number
  revenueCollected: number
  pmAssigned?: string
  teamMembers: string[]
  startDate: string
  estimatedCompletion?: string
  incentivePrograms: string[]
  description?: string
  createdAt: string
}

interface Milestone {
  id: string
  name: string
  status: string
  dueDate: string
  completedDate?: string
  percentComplete: number
  description?: string
}

interface Report {
  id: string
  title: string
  period: string
  status: string
  sentDate?: string
  createdAt: string
}

interface Risk {
  id: string
  title: string
  description: string
  severity: string
  status: string
  identifiedDate: string
  acknowledgedAt?: string
  resolvedAt?: string
}

interface Proposal {
  id: string
  title: string
  status: string
  tier: string
  amount: number
  sentDate?: string
  createdAt: string
}

interface Document {
  id: string
  name: string
  category: string
  uploadDate: string
  fileSize: string
  clientVisible: boolean
}

type TabKey = "overview" | "milestones" | "reports" | "risks" | "proposals" | "documents"

export default function DevelopmentProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Forms
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ name: "", dueDate: "", description: "" })
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [newRisk, setNewRisk] = useState({ title: "", description: "", severity: "MEDIUM" })

  const fetchProject = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/development-projects/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (err) {
      console.error("Error fetching project:", err)
      setError("Failed to load project details.")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const fetchMilestones = useCallback(async () => {
    try {
      const response = await fetch(`/api/development-projects/${params.id}/milestones`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (err) {
      console.error("Error fetching milestones:", err)
    }
  }, [params.id])

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`/api/development-projects/${params.id}/reports`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (err) {
      console.error("Error fetching reports:", err)
    }
  }, [params.id])

  const fetchRisks = useCallback(async () => {
    try {
      const response = await fetch(`/api/development-projects/${params.id}/risks`)
      if (response.ok) {
        const data = await response.json()
        setRisks(data.risks || [])
      }
    } catch (err) {
      console.error("Error fetching risks:", err)
    }
  }, [params.id])

  const fetchProposals = useCallback(async () => {
    try {
      const response = await fetch(`/api/development-projects/${params.id}/proposals`)
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      }
    } catch (err) {
      console.error("Error fetching proposals:", err)
    }
  }, [params.id])

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/development-projects/${params.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error("Error fetching documents:", err)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchProject()
      fetchMilestones()
      fetchReports()
      fetchRisks()
      fetchProposals()
      fetchDocuments()
    }
  }, [params.id, fetchProject, fetchMilestones, fetchReports, fetchRisks, fetchProposals, fetchDocuments])

  const handleAddMilestone = async () => {
    if (!newMilestone.name || !newMilestone.dueDate) return
    try {
      const response = await fetch(`/api/development-projects/${params.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMilestone),
      })
      if (response.ok) {
        setNewMilestone({ name: "", dueDate: "", description: "" })
        setShowMilestoneForm(false)
        await fetchMilestones()
      }
    } catch (err) {
      console.error("Error adding milestone:", err)
    }
  }

  const handleAddRisk = async () => {
    if (!newRisk.title || !newRisk.description) return
    try {
      const response = await fetch(`/api/development-projects/${params.id}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRisk),
      })
      if (response.ok) {
        setNewRisk({ title: "", description: "", severity: "MEDIUM" })
        setShowRiskForm(false)
        await fetchRisks()
      }
    } catch (err) {
      console.error("Error adding risk:", err)
    }
  }

  const handleAcknowledgeRisk = async (riskId: string) => {
    try {
      await fetch(`/api/development-projects/${params.id}/risks/${riskId}/acknowledge`, {
        method: "POST",
      })
      await fetchRisks()
    } catch (err) {
      console.error("Error acknowledging risk:", err)
    }
  }

  const handleResolveRisk = async (riskId: string) => {
    try {
      await fetch(`/api/development-projects/${params.id}/risks/${riskId}/resolve`, {
        method: "POST",
      })
      await fetchRisks()
    } catch (err) {
      console.error("Error resolving risk:", err)
    }
  }

  const handleGenerateReport = async () => {
    try {
      await fetch(`/api/development-projects/${params.id}/reports/generate`, {
        method: "POST",
      })
      await fetchReports()
    } catch (err) {
      console.error("Error generating report:", err)
    }
  }

  const handleToggleDocVisibility = async (docId: string, visible: boolean) => {
    try {
      await fetch(`/api/development-projects/${params.id}/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientVisible: visible }),
      })
      await fetchDocuments()
    } catch (err) {
      console.error("Error updating document:", err)
    }
  }

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
      PLANNING: "bg-blue-100 text-blue-800",
      PRE_DEVELOPMENT: "bg-purple-100 text-purple-800",
      ACTIVE: "bg-green-100 text-green-800",
      CONSTRUCTION: "bg-yellow-100 text-yellow-800",
      CLOSEOUT: "bg-indigo-100 text-indigo-800",
      COMPLETED: "bg-emerald-100 text-emerald-800",
      ON_HOLD: "bg-red-100 text-red-800",
      PENDING: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      DONE: "bg-green-100 text-green-800",
      OVERDUE: "bg-red-100 text-red-800",
      DRAFT: "bg-gray-100 text-gray-800",
      SENT: "bg-blue-100 text-blue-800",
      ACCEPTED: "bg-green-100 text-green-800",
      DECLINED: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getSeverityBadgeColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 className="h-4 w-4" /> },
    { key: "milestones", label: "Milestones", icon: <Target className="h-4 w-4" /> },
    { key: "reports", label: "Reports", icon: <FileText className="h-4 w-4" /> },
    { key: "risks", label: "Risks", icon: <AlertTriangle className="h-4 w-4" /> },
    { key: "proposals", label: "Proposals", icon: <DollarSign className="h-4 w-4" /> },
    { key: "documents", label: "Documents", icon: <FolderOpen className="h-4 w-4" /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Error Loading Project</p>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <Button
            onClick={() => router.push("/portal/development-projects")}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/portal/development-projects")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{project.name}</h1>
              <p className="text-lg text-gray-600">
                {project.clientName} - {project.clientCompany}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusBadgeColor(project.status)}>
                  {project.status.replace(/_/g, " ")}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {project.serviceTier.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(project.totalBudget)}</p>
              <p className="text-sm text-green-600">
                {formatCurrency(project.revenueCollected)} collected
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-0 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "risks" && risks.filter((r) => r.status === "ACTIVE").length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                    {risks.filter((r) => r.status === "ACTIVE").length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Asset Type</label>
                    <p className="mt-1 text-gray-900">{project.assetType.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Service Tier</label>
                    <p className="mt-1 text-gray-900">{project.serviceTier.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-gray-900">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Est. Completion</label>
                    <p className="mt-1 text-gray-900">
                      {project.estimatedCompletion ? formatDate(project.estimatedCompletion) : "TBD"}
                    </p>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Name</label>
                  <p className="mt-1 text-gray-900">{project.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <p className="mt-1 text-gray-900">{project.clientCompany}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1">
                    <a href={`mailto:${project.clientEmail}`} className="text-blue-600 hover:underline">
                      {project.clientEmail}
                    </a>
                  </p>
                </div>
                {project.clientPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1">
                      <a href={`tel:${project.clientPhone}`} className="text-blue-600 hover:underline">
                        {project.clientPhone}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incentive Programs */}
            <Card>
              <CardHeader>
                <CardTitle>Incentive Programs</CardTitle>
              </CardHeader>
              <CardContent>
                {project.incentivePrograms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.incentivePrograms.map((program) => (
                      <Badge key={program} className="bg-green-100 text-green-800">
                        {program}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No incentive programs applied.</p>
                )}
              </CardContent>
            </Card>

            {/* Assigned Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{project.pmAssigned || "Unassigned"}</p>
                      <p className="text-sm text-gray-600">Project Manager</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">PM</Badge>
                  </div>
                  {project.teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{member}</p>
                      <Badge className="bg-gray-100 text-gray-800">Team</Badge>
                    </div>
                  ))}
                  {project.teamMembers.length === 0 && !project.pmAssigned && (
                    <p className="text-gray-500">No team members assigned yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Milestones ({milestones.length})
              </h2>
              <Button
                onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            {showMilestoneForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Milestone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Milestone Name</label>
                      <Input
                        value={newMilestone.name}
                        onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                        placeholder="Enter milestone name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Due Date</label>
                      <Input
                        type="date"
                        value={newMilestone.dueDate}
                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      placeholder="Describe the milestone..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddMilestone}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!newMilestone.name || !newMilestone.dueDate}
                    >
                      Save Milestone
                    </Button>
                    <Button variant="outline" onClick={() => setShowMilestoneForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {milestones.map((milestone, idx) => (
                <Card key={milestone.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            milestone.status === "DONE"
                              ? "bg-green-500"
                              : milestone.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : milestone.status === "OVERDUE"
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {milestone.status === "DONE" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        {idx < milestones.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{milestone.name}</h3>
                          <Badge className={getStatusBadgeColor(milestone.status)}>
                            {milestone.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(milestone.dueDate)}
                          </span>
                          {milestone.completedDate && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Completed: {formatDate(milestone.completedDate)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{milestone.percentComplete}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                milestone.percentComplete === 100
                                  ? "bg-green-500"
                                  : milestone.percentComplete >= 50
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${milestone.percentComplete}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {milestones.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No milestones defined yet.</p>
                  <p className="text-sm text-gray-500">Add milestones to track project progress.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Reports ({reports.length})
              </h2>
              <Button
                onClick={handleGenerateReport}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 rounded-lg p-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.title}</p>
                          <p className="text-sm text-gray-500">Period: {report.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusBadgeColor(report.status)}>
                          {report.status}
                        </Badge>
                        {report.sentDate && (
                          <span className="text-sm text-gray-500">
                            Sent: {formatDate(report.sentDate)}
                          </span>
                        )}
                        <Button variant="outline" className="text-sm">
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  ))}

                  {reports.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No reports generated yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "risks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Risk Alerts ({risks.filter((r) => r.status === "ACTIVE").length} active)
              </h2>
              <Button
                onClick={() => setShowRiskForm(!showRiskForm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Risk
              </Button>
            </div>

            {showRiskForm && (
              <Card>
                <CardHeader>
                  <CardTitle>New Risk Alert</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Risk Title</label>
                    <Input
                      value={newRisk.title}
                      onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                      placeholder="Enter risk title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <Textarea
                      value={newRisk.description}
                      onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                      placeholder="Describe the risk..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severity</label>
                    <Select
                      value={newRisk.severity}
                      onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value })}
                      className="mt-1"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddRisk}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={!newRisk.title || !newRisk.description}
                    >
                      Add Risk
                    </Button>
                    <Button variant="outline" onClick={() => setShowRiskForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {risks.map((risk) => (
                <Card key={risk.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{risk.title}</h3>
                          <Badge className={getSeverityBadgeColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                          <Badge className={getStatusBadgeColor(risk.status)}>
                            {risk.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{risk.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Identified: {formatDate(risk.identifiedDate)}
                          {risk.acknowledgedAt && ` | Acknowledged: ${formatDate(risk.acknowledgedAt)}`}
                          {risk.resolvedAt && ` | Resolved: ${formatDate(risk.resolvedAt)}`}
                        </p>
                      </div>
                      {risk.status === "ACTIVE" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                            onClick={() => handleAcknowledgeRisk(risk.id)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => handleResolveRisk(risk.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {risks.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No risk alerts recorded.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "proposals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Proposals ({proposals.length})
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 rounded-lg p-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{proposal.title}</p>
                          <p className="text-sm text-gray-500">
                            Tier: {proposal.tier.replace(/_/g, " ")} | Created: {formatDate(proposal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(proposal.amount)}</p>
                        <Badge className={getStatusBadgeColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        {proposal.sentDate && (
                          <span className="text-sm text-gray-500">
                            Sent: {formatDate(proposal.sentDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {proposals.length === 0 && (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No proposals created yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Documents ({documents.length})
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Category
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Upload Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Size
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                          Client Visible
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{doc.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-gray-100 text-gray-800">
                              {doc.category.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(doc.uploadDate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {doc.fileSize}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleDocVisibility(doc.id, !doc.clientVisible)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                doc.clientVisible
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {doc.clientVisible ? (
                                <>
                                  <Eye className="h-3 w-3" /> Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" /> Hidden
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="outline" className="text-sm">
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {documents.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents uploaded yet.</p>
                    <p className="text-sm text-gray-500">Upload project documents to share with the team and client.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
