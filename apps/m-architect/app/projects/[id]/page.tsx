"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Users, Plus, CheckCircle2, XCircle } from "lucide-react"

import { api, type DesignProject, type DesignTeamRole } from "@/lib/api"

export default function DesignProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params.id as string

  const [showAddTeamMember, setShowAddTeamMember] = React.useState(false)
  const [newMemberUserId, setNewMemberUserId] = React.useState("")
  const [newMemberRole, setNewMemberRole] = React.useState<DesignTeamRole>("DESIGNER")
  const [error, setError] = React.useState<string | null>(null)

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ["design-project", projectId],
    queryFn: () => api.getDesignProject(projectId),
  })

  const designProject = data?.designProject

  const addTeamMemberMutation = useMutation({
    mutationFn: (data: { userId: string; role: DesignTeamRole }) =>
      api.addTeamMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-project", projectId] })
      setShowAddTeamMember(false)
      setNewMemberUserId("")
      setNewMemberRole("DESIGNER")
      setError(null)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "NOT_STARTED":
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "PRINCIPAL":
        return "Principal"
      case "PROJECT_ARCHITECT":
        return "Project Architect"
      case "DESIGNER":
        return "Designer"
      case "DRAFTER":
        return "Drafter"
      default:
        return role
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading project...</div>
      </div>
    )
  }

  if (fetchError || !designProject) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {fetchError instanceof Error ? fetchError.message : "Project not found"}
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>

          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">{designProject.name}</h1>
                {designProject.description && (
                  <p className="text-neutral-600">{designProject.description}</p>
                )}
              </div>
              <span
                className={`text-xs rounded-full border px-3 py-1 ${
                  designProject.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200"
                }`}
              >
                {designProject.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Project Type</p>
                <p className="font-medium">{designProject.projectType.replace("_", " ")}</p>
              </div>
              {designProject.budgetTotal && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Budget</p>
                  <p className="font-medium">${parseFloat(designProject.budgetTotal).toLocaleString()}</p>
                </div>
              )}
              {designProject.startDate && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Start Date</p>
                  <p className="font-medium">{new Date(designProject.startDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {designProject.project && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 mb-1">Linked Project Owner Project</p>
                <p className="text-sm text-neutral-600">{designProject.project.name}</p>
              </div>
            )}
          </div>

          {/* Phases */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Design Phases
              </h2>
              <Link
                href={`/projects/${projectId}/phases`}
                className="text-sm text-primary hover:underline"
              >
                View Timeline →
              </Link>
            </div>
            <div className="space-y-3">
              {designProject.phases.map((phase) => (
                <div
                  key={phase.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{phase.name}</h3>
                      {phase.description && (
                        <p className="text-sm text-neutral-600 mt-1">{phase.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                        {phase.plannedStartDate && (
                          <span>Planned: {new Date(phase.plannedStartDate).toLocaleDateString()}</span>
                        )}
                        {phase.actualStartDate && (
                          <span>Started: {new Date(phase.actualStartDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs rounded-full border px-2 py-1 ${getPhaseStatusColor(phase.status)}`}
                      >
                        {phase.status.replace("_", " ")}
                      </span>
                      {phase.requiresApproval && phase.approvedAt && (
                        <span title="Approved">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </h2>
              <button
                onClick={() => setShowAddTeamMember(!showAddTeamMember)}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            </div>

            {showAddTeamMember && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      User ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMemberUserId}
                      onChange={(e) => {
                        setNewMemberUserId(e.target.value)
                        setError(null)
                      }}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Enter user UUID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as DesignTeamRole)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="PRINCIPAL">Principal</option>
                      <option value="PROJECT_ARCHITECT">Project Architect</option>
                      <option value="DESIGNER">Designer</option>
                      <option value="DRAFTER">Drafter</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newMemberUserId.trim()) {
                          setError("Please enter a user ID")
                          return
                        }
                        addTeamMemberMutation.mutate({
                          userId: newMemberUserId.trim(),
                          role: newMemberRole,
                        })
                      }}
                      disabled={addTeamMemberMutation.isPending}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {addTeamMemberMutation.isPending ? "Adding..." : "Add Member"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTeamMember(false)
                        setNewMemberUserId("")
                        setError(null)
                      }}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {designProject.teamMembers.length === 0 ? (
              <p className="text-neutral-600 text-center py-8">No team members yet</p>
            ) : (
              <div className="space-y-3">
                {designProject.teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{member.user.name}</p>
                      <p className="text-sm text-neutral-600">{member.user.email}</p>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{getRoleLabel(member.role)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/projects/${projectId}/files`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">File Management</h3>
                <p className="text-sm text-neutral-600">Upload and organize design files</p>
              </Link>
              <Link
                href={`/projects/${projectId}/deliverables`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Deliverables</h3>
                <p className="text-sm text-neutral-600">Track and manage project deliverables</p>
              </Link>
              <Link
                href={`/projects/${projectId}/drawings`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Drawing Sets</h3>
                <p className="text-sm text-neutral-600">Manage drawing sheets and sets</p>
              </Link>
              <Link
                href={`/projects/${projectId}/models`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">3D/BIM Models</h3>
                <p className="text-sm text-neutral-600">View and manage 3D models</p>
              </Link>
              <Link
                href={`/projects/${projectId}/reviews`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Design Reviews</h3>
                <p className="text-sm text-neutral-600">Manage review requests and feedback</p>
              </Link>
              <Link
                href={`/projects/${projectId}/collaboration`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Collaboration Hub</h3>
                <p className="text-sm text-neutral-600">Real-time collaboration, meetings, and decisions</p>
              </Link>
              <Link
                href={`/projects/${projectId}/versions`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Version Control</h3>
                <p className="text-sm text-neutral-600">Git-like branching, versioning, and rollback</p>
              </Link>
              <Link
                href={`/projects/${projectId}/revisions`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Revision Management</h3>
                <p className="text-sm text-neutral-600">Track revisions, clouds, schedules, and impact</p>
              </Link>
              <Link
                href={`/projects/${projectId}/validation`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Design Validation</h3>
                <p className="text-sm text-neutral-600">Automated validation and code compliance</p>
              </Link>
              <Link
                href={`/projects/${projectId}/approvals`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Approval Workflows</h3>
                <p className="text-sm text-neutral-600">Multi-tier approvals with delegation and certificates</p>
              </Link>
              <Link
                href={`/projects/${projectId}/stamps`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Architect Stamps</h3>
                <p className="text-sm text-neutral-600">Digital seal management and stamp application</p>
              </Link>
              <Link
                href={`/projects/${projectId}/quality-control`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Quality Control</h3>
                <p className="text-sm text-neutral-600">QC checklists, error tracking, and improvement</p>
              </Link>
              <Link
                href={`/projects/${projectId}/permits`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Permit Packages</h3>
                <p className="text-sm text-neutral-600">Generate and submit permit packages</p>
              </Link>
              <Link
                href={`/projects/${projectId}/construction`}
                className="p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold mb-1">Construction Administration</h3>
                <p className="text-sm text-neutral-600">IFC packages, bids, RFIs, submittals, as-built</p>
              </Link>
              {designProject.clientAccessEnabled && designProject.clientAccessUrl && (
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <h3 className="font-semibold mb-1">Client Access Portal</h3>
                  <p className="text-sm text-neutral-600 mb-2">
                    Share this URL with your client:
                  </p>
                  <code className="text-xs text-neutral-900 break-all bg-neutral-50 p-2 rounded block">
                    {typeof window !== "undefined" ? `${window.location.origin}/client/${designProject.clientAccessUrl}` : designProject.clientAccessUrl}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
