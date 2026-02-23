"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Loader2, Minus, Plus, Send, Trash2, X } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@pm/lib/utils"
import { useCreateMeeting } from "@pm/hooks/useMeetings"
import { useProjects } from "@pm/hooks/useProjects"

const MEETING_TYPES = [
  { value: "owner-architect-contractor", label: "Owner-Architect-Contractor (OAC)" },
  { value: "progress", label: "Progress Meeting" },
  { value: "safety", label: "Safety Meeting" },
  { value: "coordination", label: "Coordination Meeting" },
  { value: "pre-construction", label: "Pre-Construction Meeting" },
  { value: "closeout", label: "Closeout Meeting" },
]

export default function NewMeetingPage() {
  const router = useRouter()
  const createMeeting = useCreateMeeting()
  const { data: projectsData } = useProjects()
  const projects = (projectsData as any)?.items ?? projectsData ?? []
  const teamMembers = (projectsData as any)?.team ?? []
  const [form, setForm] = React.useState({
    title: "",
    type: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    project: "",
  })
  const [agendaItems, setAgendaItems] = React.useState<string[]>([""])
  const [selectedAttendees, setSelectedAttendees] = React.useState<string[]>([])

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addAgendaItem() {
    setAgendaItems((prev) => [...prev, ""])
  }

  function removeAgendaItem(index: number) {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateAgendaItem(index: number, value: string) {
    setAgendaItems((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function toggleAttendee(contactId: string) {
    setSelectedAttendees((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/pm/meetings"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back to Meetings</Button></Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Meeting</h1>
        <p className="text-gray-500 mt-1">Create a new meeting and invite attendees</p>
      </div>

      {/* Meeting Details */}
      <Card>
        <CardHeader><CardTitle>Meeting Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g. Weekly OAC Meeting #15" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Meeting Type *</Label>
              <select id="type" value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="">Select type...</option>
                {MEETING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">Project *</Label>
              <select id="project" value={form.project} onChange={(e) => updateForm("project", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="">Select project...</option>
                {(Array.isArray(projects) ? projects : []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time *</Label>
              <Input id="startTime" type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time *</Label>
              <Input id="endTime" type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location *</Label>
            <Input id="location" value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Jobsite Trailer, Conference Room, Virtual - Teams" />
          </div>
        </CardContent>
      </Card>

      {/* Agenda Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agenda Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addAgendaItem} className="gap-1.5">
              <Plus size={14} />Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {agendaItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No agenda items yet. Click "Add Item" to get started.</p>
          )}
          {agendaItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </span>
              <Input
                value={item}
                onChange={(e) => updateAgendaItem(index, e.target.value)}
                placeholder={`Agenda item ${index + 1}...`}
                className="flex-1"
              />
              <button
                onClick={() => removeAgendaItem(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendees</CardTitle>
            {selectedAttendees.length > 0 && (
              <span className="text-sm text-gray-500">{selectedAttendees.length} selected</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(Array.isArray(teamMembers) && teamMembers.length > 0 ? teamMembers : [
              { id: "c1", name: "Sarah Kim", role: "Project Manager", company: "Kealee PM" },
              { id: "c2", name: "James Chen", role: "Structural Engineer", company: "Chen Structural" },
              { id: "c3", name: "Robert Anderson", role: "Lead Architect", company: "Anderson Architects" },
              { id: "c4", name: "Mike Torres", role: "Superintendent", company: "Torres Construction" },
              { id: "c5", name: "David Park", role: "Owner Representative", company: "Park Development" },
            ]).map((contact: any) => {
              const isSelected = selectedAttendees.includes(contact.id)
              return (
                <label
                  key={contact.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAttendee(contact.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role ?? ""} - {contact.company ?? ""}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/pm/meetings"><Button variant="outline">Cancel</Button></Link>
        <Button
          className="gap-2"
          disabled={createMeeting.isPending}
          onClick={() => {
            createMeeting.mutate(
              { ...form, agendaItems: agendaItems.filter(Boolean), attendees: selectedAttendees },
              { onSuccess: () => router.push("/pm/meetings") }
            )
          }}
        >
          {createMeeting.isPending ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
          {createMeeting.isPending ? "Scheduling..." : "Schedule Meeting"}
        </Button>
      </div>
    </div>
  )
}

