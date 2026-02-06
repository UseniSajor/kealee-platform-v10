"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Textarea, Select } from "@/components/ui"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Plus,
  MessageSquare,
  Activity,
  DollarSign,
} from "lucide-react"

interface Lead {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  role: string
  location: string
  assetType: string
  units: string
  notUnitBased: boolean
  projectStage: string
  budgetRange: string
  timeline: string
  needsHelp: string[]
  message: string
  status: string
  priority: string
  source: string
  assignedTo?: string
  estimatedValue?: number
  proposalSentAt?: string
  proposalAmount?: number
  closedAt?: string
  closedAmount?: number
  lostReason?: string
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

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({})
  const [newNote, setNewNote] = useState("")
  const [newActivity, setNewActivity] = useState({ type: "", description: "" })

  useEffect(() => {
    if (params.id) {
      fetchLead()
    }
  }, [params.id])

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/development-leads/${params.id}`)
      const data = await response.json()
      setLead(data)
      setEditedLead(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching lead:", error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/development-leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editedLead,
          updatedBy: "current-user", // Replace with actual user ID
        }),
      })

      if (response.ok) {
        await fetchLead()
        setEditing(false)
      }
    } catch (error) {
      console.error("Error updating lead:", error)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const response = await fetch(`/api/development-leads/${params.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote,
          createdBy: "current-user", // Replace with actual user ID
        }),
      })

      if (response.ok) {
        setNewNote("")
        await fetchLead()
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.type || !newActivity.description) return

    try {
      const response = await fetch(`/api/development-leads/${params.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: newActivity.type,
          description: newActivity.description,
          createdBy: "current-user", // Replace with actual user ID
        }),
      })

      if (response.ok) {
        setNewActivity({ type: "", description: "" })
        await fetchLead()
      }
    } catch (error) {
      console.error("Error adding activity:", error)
    }
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
      hour: '2-digit',
      minute: '2-digit',
    })
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

  if (loading || !lead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead...</p>
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
            onClick={() => router.push("/portal/development-leads")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {lead.fullName}
              </h1>
              <p className="text-lg text-gray-600">{lead.company}</p>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
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
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="PROPOSAL_SENT">Proposal Sent</option>
                        <option value="NEGOTIATING">Negotiating</option>
                        <option value="WON">Won</option>
                        <option value="LOST">Lost</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                    ) : (
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
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
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </Select>
                    ) : (
                      <p className="mt-1 text-gray-900">{lead.priority}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.email}`} className="text-orange-600 hover:underline">
                    {lead.email}
                  </a>
                </div>

                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${lead.phone}`} className="text-orange-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4" />
                  <span>{lead.location}</span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Estimated Value</label>
                  {editing ? (
                    <Input
                      type="number"
                      value={editedLead.estimatedValue || ""}
                      onChange={(e) => setEditedLead({ ...editedLead, estimatedValue: parseFloat(e.target.value) })}
                      placeholder="Enter estimated deal value"
                      className="mt-1"
                    />
                  ) : lead.estimatedValue ? (
                    <p className="mt-1 text-xl font-semibold text-green-600">
                      {formatCurrency(lead.estimatedValue)}
                    </p>
                  ) : (
                    <p className="mt-1 text-gray-500">Not set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Asset Type</label>
                    <p className="mt-1 text-gray-900">{lead.assetType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Units</label>
                    <p className="mt-1 text-gray-900">{lead.units}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project Stage</label>
                    <p className="mt-1 text-gray-900">{lead.projectStage.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Budget Range</label>
                    <p className="mt-1 text-gray-900">{lead.budgetRange}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timeline</label>
                    <p className="mt-1 text-gray-900">{lead.timeline}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-gray-900">{lead.role}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Needs Help With</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lead.needsHelp.map((need) => (
                      <Badge key={need} className="bg-blue-100 text-blue-800">
                        {need}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Project Summary</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{lead.message}</p>
                </div>
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
                  {lead.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <p className="text-xs text-gray-500">
                        By {note.createdBy} • {formatDate(note.createdAt)}
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
                    className="bg-orange-600 hover:bg-orange-700 text-white"
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
                <Button className="w-full" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button className="w-full" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Send Proposal
                </Button>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lead.activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-gray-200 pl-3 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.activityType.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <Select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  >
                    <option value="">Select activity type...</option>
                    <option value="EMAIL_SENT">Email Sent</option>
                    <option value="CALL_MADE">Call Made</option>
                    <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </Select>
                  <Input
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    placeholder="Activity description..."
                  />
                  <Button
                    onClick={handleAddActivity}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={!newActivity.type || !newActivity.description}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
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
