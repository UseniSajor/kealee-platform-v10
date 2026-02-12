"use client"

import * as React from "react"
import { useState } from "react"
import { ArrowLeft, Calendar, Clock, Download, Edit, MapPin, Paperclip, Plus, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ActionStatus = "Open" | "In Progress" | "Complete"
const ASC: Record<ActionStatus, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  Complete: "bg-green-100 text-green-800",
}

const MTG = {
  id: "MTG-029", title: "Weekly OAC Meeting #29", date: "2026-02-06", time: "10:00 AM",
  duration: "1.5 hrs", location: "Site Trailer - Conference Room", type: "OAC",
  attendees: [
    { name: "Patricia Wong", role: "Owner Representative" },
    { name: "Robert Kim", role: "Architect" },
    { name: "John Martinez", role: "Project Manager" },
    { name: "Steve Davis", role: "Superintendent" },
    { name: "Lisa Chang", role: "MEP Coordinator" },
  ],
}

const AGENDA = [
  "Review of previous meeting action items",
  "Schedule update and critical path discussion",
  "RFI status review (RFI-045 through RFI-052)",
  "Change Order #7 discussion - Owner decision needed",
  "Submittal log review - Outstanding items",
  "Safety report - Weekly incident summary",
  "Next milestone: Concrete pour Building B, Level 4",
]

const MINUTES_TEXT = `Meeting opened at 10:05 AM. All attendees present.

1. Action Items Review: 3 of 4 items from last meeting complete. Remaining item (RFI-042 response) expected by EOD Friday.

2. Schedule: Project currently 2 days ahead. Concrete pour for Building B Level 4 scheduled for Feb 12.

3. RFIs: 3 new RFIs submitted this week. RFI-050 (structural connection detail) is critical path - architect to respond by Feb 10.

4. CO #7: Owner reviewing revised pricing. Decision expected by Feb 13 meeting.

5. Submittals: 5 outstanding. Elevator shop drawings resubmission needed.

6. Safety: No recordable incidents this week. Toolbox talk on fall protection conducted Feb 3.

Meeting adjourned at 11:20 AM.`

interface ActionItem { id: string; description: string; assignee: string; dueDate: string; status: ActionStatus }
const ACTIONS: ActionItem[] = [
  { id: "AI-001", description: "Respond to RFI-050 structural connection detail", assignee: "Robert Kim", dueDate: "2026-02-10", status: "Open" },
  { id: "AI-002", description: "Resubmit elevator shop drawings with corrections", assignee: "John Martinez", dueDate: "2026-02-12", status: "In Progress" },
  { id: "AI-003", description: "Provide CO #7 decision to contractor", assignee: "Patricia Wong", dueDate: "2026-02-13", status: "Open" },
  { id: "AI-004", description: "Coordinate concrete pour logistics", assignee: "Steve Davis", dueDate: "2026-02-11", status: "Complete" },
]
const ATTACHMENTS = [
  { name: "OAC-29-Agenda.pdf", size: "124 KB" },
  { name: "Schedule-Update-Feb6.pdf", size: "2.1 MB" },
  { name: "RFI-Log-Feb6.xlsx", size: "89 KB" },
]

export default function MeetingDetailPage() {
  const [minutes, setMinutes] = useState(MINUTES_TEXT)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" />Back</Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{MTG.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{MTG.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{MTG.time} ({MTG.duration})</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{MTG.location}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1"><Download className="h-4 w-4" />Export PDF</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Agenda</CardTitle></CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-2">
                {AGENDA.map((item, i) => (<li key={i} className="text-sm text-gray-700">{item}</li>))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Meeting Minutes</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3.5 w-3.5" />Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">{minutes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Action Items</CardTitle>
              <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="border-b bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Assignee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Due</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr></thead>
                <tbody>
                  {ACTIONS.map((ai) => (
                    <tr key={ai.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{ai.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{ai.assignee}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{ai.dueDate}</td>
                      <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ASC[ai.status])}>{ai.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Attendees</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {MTG.attendees.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                    {a.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ATTACHMENTS.map((att) => (
                <div key={att.name} className="flex items-center gap-3 rounded-lg border p-2">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">{att.name}</p>
                    <p className="text-xs text-gray-400">{att.size}</p>
                  </div>
                  <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
