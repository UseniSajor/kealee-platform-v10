"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select } from "@/components/ui"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  Plus,
  MessageSquare,
  Activity,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  PhoneCall,
} from "lucide-react"

interface GCOpsLead {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  role: string
  gcType: string
  teamSize: string
  annualRevenue: string
  projectsPerYear: string
  currentChallenges: string[]
  packageInterest: string
  message: string
  status: string
  priority: string
  source: string
  assignedTo?: string
  trialStartDate?: string
  trialEndDate?: string
  trialConverted: boolean
  monthlyFee?: number
  lastContactedAt?: string
  nextFollowUpAt?: string
  createdAt: string
  notes: Array<{
    id: string
    content: string
    createdBy: string
    createdAt: string
  }>
  activities: Array<{
    id: string
    activityType: string
    description: string
    createdBy: string
    createdAt: string
  }>
}

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "TRIAL_ACTIVE", label: "Trial Active" },
  { value: "TRIAL_ENDED", label: "Trial Ended" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
  { value: "ARCHIVED", label: "Archived" },
]

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
]

const PACKAGE_TIERS: Record<string, { name: string; features: string[]; upgradeTo?: string }> = {
  "starter": {
    name: "Starter",
    features: ["Weekly check-ins", "Basic reporting", "Email support"],
    upgradeTo: "professional",
  },
  "professional": {
    name: "Professional",
    features: ["Daily ops support", "Vendor coordination", "Permit tracking", "Weekly reports"],
    upgradeTo: "enterprise",
  },
  "enterprise": {
    name: "Enterprise",
    features: ["Dedicated ops manager", "Full vendor management", "Real-time dashboards", "SLA guarantee", "24/7 support"],
  },
}

export default function GCOpsLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<GCOpsLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<GCOpsLead>>({})
  const [newNote, setNewNote] = useState("")
  const [newActivity, setNewActivity] = useState({ type: "", description: "" })
  const [saving, setSaving] = useState(false)

  const fetchLead = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/gc-ops-leads/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch lead")
      const data = await response.json()
      setLead(data)
      setEditedLead(data)
    } catch (err) {
      console.error("Error fetching lead:", err)
      setError("Failed to load lead details. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchLead()
    }
  }, [params.id, fetchLead])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/gc-ops-leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editedLead.status,
          priority: editedLead.priority,
          assignedTo: editedLead.assignedTo,
          monthlyFee: editedLead.monthlyFee,
          trialStartDate: editedLead.trialStartDate,
          trialEndDate: editedLead.trialEndDate,
          nextFollowUpAt: editedLead.nextFollowUpAt,
        }),
      })

      if (response.ok) {
        await fetchLead()
        setEditing(false)
      }
    } catch (err) {
      console.error("Error updating lead:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const response = await fetch(`/api/gc-ops-leads/${params.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote,
          createdBy: "current-user",
        }),
      })

      if (response.ok) {
        setNewNote("")
        await fetchLead()
      }
    } catch (err) {
      console.error("Error adding note:", err)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.type || !newActivity.description) return

    try {
      const response = await fetch(`/api/gc-ops-leads/${params.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: newActivity.type,
          description: newActivity.description,
          createdBy: "current-user",
        }),
      })

      if (response.ok) {
        setNewActivity({ type: "", description: "" })
        await fetchLead()
      }
    } catch (err) {
      console.error("Error adding activity:", err)
    }
  }

  const handleConvertToEngagement = async () => {
    try {
      const response = await fetch(`/api/gc-ops-leads/${params.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/portal/gc-ops-engagements/${data.engagementId}`)
      }
    } catch (err) {
      console.error("Error converting lead:", err)
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800",
      CONTACTED: "bg-purple-100 text-purple-800",
      QUALIFIED: "bg-green-100 text-green-800",
      TRIAL_ACTIVE: "bg-yellow-100 text-yellow-800",
      TRIAL_ENDED: "bg-orange-100 text-orange-800",
      NEGOTIATING: "bg-indigo-100 text-indigo-800",
      CONVERTED: "bg-emerald-100 text-emerald-800",
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

  const getPackageKey = (packageInterest: string) => {
    const lower = packageInterest.toLowerCase()
    if (lower.includes("enterprise")) return "enterprise"
    if (lower.includes("professional")) return "professional"
    return "starter"
  }

  const getTrialDaysRemaining = () => {
    if (!lead?.trialEndDate) return null
    const end = new Date(lead.trialEndDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Error Loading Lead</p>
          <p className="text-gray-600 mb-4">{error || "Lead not found"}</p>
          <Button
            onClick={() => router.push("/portal/gc-ops-leads")}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    )
  }

  const packageKey = getPackageKey(lead.packageInterest)
  const packageInfo = PACKAGE_TIERS[packageKey]
  const trialDays = getTrialDaysRemaining()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/portal/gc-ops-leads")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to GC Ops Leads
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {lead.fullName}
              </h1>
              <p className="text-lg text-gray-600">{lead.company}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusBadgeColor(lead.status)}>
                  {lead.status.replace(/_/g, " ")}
                </Badge>
                <Badge className={getPriorityBadgeColor(lead.priority)}>
                  {lead.priority}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false)
                      setEditedLead(lead)
                    }}
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    {editing ? (
                      <Select
                        value={editedLead.status}
                        onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value })}
                        className="mt-1"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(lead.status)}>
                          {lead.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    {editing ? (
                      <Select
                        value={editedLead.priority}
                        onChange={(e) => setEditedLead({ ...editedLead, priority: e.target.value })}
                        className="mt-1"
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <p className="mt-1 text-gray-900">{lead.priority}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>

                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Monthly Fee</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editedLead.monthlyFee || ""}
                      onChange={(e) => setEditedLead({ ...editedLead, monthlyFee: parseFloat(e.target.value) })}
                      placeholder="Enter monthly fee"
                      className="mt-1"
                    />
                  ) : lead.monthlyFee ? (
                    <p className="mt-1 text-xl font-semibold text-green-600">
                      {formatCurrency(lead.monthlyFee)}/mo
                    </p>
                  ) : (
                    <p className="mt-1 text-gray-500">Not set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">GC Type</label>
                    <p className="mt-1 text-gray-900">{lead.gcType.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-gray-900">{lead.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Team Size</label>
                    <p className="mt-1 text-gray-900">{lead.teamSize}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Annual Revenue</label>
                    <p className="mt-1 text-gray-900">{lead.annualRevenue}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Projects Per Year</label>
                    <p className="mt-1 text-gray-900">{lead.projectsPerYear}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-gray-900">{lead.source}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Current Challenges</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.currentChallenges.map((challenge) => (
                      <Badge key={challenge} className="bg-red-50 text-red-700">
                        {challenge}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{lead.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Trial Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Trial Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Trial Start Date</label>
                    {editing ? (
                      <Input
                        type="date"
                        value={editedLead.trialStartDate ? editedLead.trialStartDate.split("T")[0] : ""}
                        onChange={(e) => setEditedLead({ ...editedLead, trialStartDate: e.target.value })}
                        className="mt-1"
                      />
                    ) : lead.trialStartDate ? (
                      <p className="mt-1 text-gray-900">{formatDate(lead.trialStartDate)}</p>
                    ) : (
                      <p className="mt-1 text-gray-500">Not started</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Trial End Date</label>
                    {editing ? (
                      <Input
                        type="date"
                        value={editedLead.trialEndDate ? editedLead.trialEndDate.split("T")[0] : ""}
                        onChange={(e) => setEditedLead({ ...editedLead, trialEndDate: e.target.value })}
                        className="mt-1"
                      />
                    ) : lead.trialEndDate ? (
                      <p className="mt-1 text-gray-900">{formatDate(lead.trialEndDate)}</p>
                    ) : (
                      <p className="mt-1 text-gray-500">Not set</p>
                    )}
                  </div>
                </div>

                {trialDays !== null && (
                  <div className={`p-4 rounded-lg ${trialDays > 7 ? "bg-green-50" : trialDays > 0 ? "bg-yellow-50" : "bg-red-50"}`}>
                    <div className="flex items-center gap-2">
                      {trialDays > 0 ? (
                        <>
                          <Clock className={`h-5 w-5 ${trialDays > 7 ? "text-green-600" : "text-yellow-600"}`} />
                          <span className={`font-medium ${trialDays > 7 ? "text-green-800" : "text-yellow-800"}`}>
                            {trialDays} days remaining in trial
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">
                            Trial expired {Math.abs(trialDays)} days ago
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Conversion Status:</label>
                  {lead.trialConverted ? (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Converted
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      Pending Conversion
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Package Interest */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Interest
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-blue-900">
                      {lead.packageInterest}
                    </h3>
                    <Badge className="bg-blue-100 text-blue-800">Current Interest</Badge>
                  </div>
                  {packageInfo && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-800">Included Features:</p>
                      <ul className="space-y-1">
                        {packageInfo.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-blue-700">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {packageInfo?.upgradeTo && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {PACKAGE_TIERS[packageInfo.upgradeTo]?.name} Package
                      </h3>
                      <Badge className="bg-green-100 text-green-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Upgrade Path
                      </Badge>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {PACKAGE_TIERS[packageInfo.upgradeTo]?.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                          <Plus className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-50">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Propose Upgrade
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notes ({lead.notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4">
                  {lead.notes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notes yet. Add the first note below.</p>
                  )}
                  {lead.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <p className="text-xs text-gray-500">
                        By {note.createdBy} -- {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <Button
                    onClick={handleAddNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!newNote.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleConvertToEngagement}
                  disabled={lead.status === "CONVERTED"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Convert to Engagement
                </Button>
                <Button className="w-full" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full" variant="outline">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lead.activities.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No activities logged yet.</p>
                  )}
                  {lead.activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-blue-200 pl-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activityType.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t pt-4">
                  <Select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  >
                    <option value="">Select activity type...</option>
                    <option value="EMAIL_SENT">Email Sent</option>
                    <option value="CALL_MADE">Call Made</option>
                    <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                    <option value="DEMO_GIVEN">Demo Given</option>
                    <option value="TRIAL_STARTED">Trial Started</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </Select>
                  <Input
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    placeholder="Activity description..."
                  />
                  <Button
                    onClick={handleAddActivity}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!newActivity.type || !newActivity.description}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lead Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Source:</span>
                  <span className="ml-2 font-medium">{lead.source}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(lead.createdAt)}</span>
                </div>
                {lead.assignedTo && (
                  <div>
                    <span className="text-gray-600">Assigned To:</span>
                    <span className="ml-2 font-medium">{lead.assignedTo}</span>
                  </div>
                )}
                {lead.lastContactedAt && (
                  <div>
                    <span className="text-gray-600">Last Contact:</span>
                    <span className="ml-2 font-medium">{formatDate(lead.lastContactedAt)}</span>
                  </div>
                )}
                {lead.nextFollowUpAt && (
                  <div>
                    <span className="text-gray-600">Next Follow-up:</span>
                    <span className="ml-2 font-medium">{formatDate(lead.nextFollowUpAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
