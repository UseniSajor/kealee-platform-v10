"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, CheckCircle, Circle, Clock, Download, Edit, MapPin, Plus, User, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type ActionStatus = "open" | "in-progress" | "completed" | "overdue"

interface AgendaItem {
  id: string
  title: string
  presenter: string
  duration: string
  notes: string
}

interface ActionItem {
  id: string
  description: string
  assignee: string
  dueDate: string
  status: ActionStatus
}

interface MeetingAttendee {
  name: string
  initials: string
  role: string
  company: string
  present: boolean
  color: string
}

const ACTION_STATUS_STYLES: Record<ActionStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
}

const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  overdue: "Overdue",
}

const MOCK_MEETING = {
  id: "1",
  title: "Weekly OAC Meeting #14",
  date: "2026-02-16",
  time: "10:00 AM - 11:30 AM",
  location: "Riverside Commons - Jobsite Trailer",
  type: "owner-architect-contractor" as const,
  status: "scheduled" as const,
  organizer: "Sarah Kim",
  project: "Riverside Commons",
}

const MOCK_AGENDA: AgendaItem[] = [
  { id: "a1", title: "Review of Previous Action Items", presenter: "Sarah Kim", duration: "15 min", notes: "Follow up on 6 outstanding items from OAC #13. Three items resolved, three remain open including the foundation rebar clarification (RFI-001)." },
  { id: "a2", title: "Schedule Update and Two-Week Look-Ahead", presenter: "Mike Torres", duration: "20 min", notes: "North foundation pour rescheduled to 2/23 pending RFI resolution. Steel delivery on track for 3/1. Framing crew mobilization confirmed for 3/5." },
  { id: "a3", title: "Budget and Change Order Status", presenter: "Sarah Kim", duration: "15 min", notes: "Current budget tracking at 97.2% of baseline. Two pending change orders: CO-003 ($12,500 cladding substitution) and CO-004 ($4,200 added blocking)." },
  { id: "a4", title: "RFI and Submittal Log Review", presenter: "James Chen", duration: "15 min", notes: "5 open RFIs, 2 overdue. Submittal log shows 3 items pending review. Priority: structural steel shop drawings (SUB-002) due 2/20." },
  { id: "a5", title: "Safety Report and Site Conditions", presenter: "Mike Torres", duration: "10 min", notes: "Zero incidents this reporting period. New subcontractor safety orientation scheduled for 2/18. Reminder: hard hats required in all active work zones." },
]

const MOCK_ACTION_ITEMS: ActionItem[] = [
  { id: "ai1", description: "Provide formal response to RFI-001 regarding foundation rebar spacing", assignee: "James Chen", dueDate: "2026-02-18", status: "in-progress" },
  { id: "ai2", description: "Submit revised two-week look-ahead schedule with updated pour date", assignee: "Mike Torres", dueDate: "2026-02-17", status: "open" },
  { id: "ai3", description: "Review and approve CO-003 cladding substitution pricing", assignee: "Robert Anderson", dueDate: "2026-02-20", status: "open" },
  { id: "ai4", description: "Distribute updated submittal log to all parties", assignee: "Sarah Kim", dueDate: "2026-02-16", status: "overdue" },
]

const ATTENDEE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
]

const MOCK_ATTENDEES: MeetingAttendee[] = [
  { name: "Sarah Kim", initials: "SK", role: "Project Manager", company: "Kealee PM", present: true, color: ATTENDEE_COLORS[0] },
  { name: "James Chen", initials: "JC", role: "Structural Engineer", company: "Chen Structural", present: true, color: ATTENDEE_COLORS[1] },
  { name: "Robert Anderson", initials: "RA", role: "Lead Architect", company: "Anderson Architects", present: true, color: ATTENDEE_COLORS[2] },
  { name: "Mike Torres", initials: "MT", role: "Superintendent", company: "Torres Construction", present: true, color: ATTENDEE_COLORS[3] },
  { name: "David Park", initials: "DP", role: "Owner Representative", company: "Park Development", present: true, color: ATTENDEE_COLORS[4] },
  { name: "Lisa Wong", initials: "LW", role: "MEP Coordinator", company: "Pacific MEP", present: false, color: ATTENDEE_COLORS[5] },
  { name: "Carlos Ruiz", initials: "CR", role: "Safety Officer", company: "Torres Construction", present: true, color: ATTENDEE_COLORS[6] },
  { name: "Amy Liu", initials: "AL", role: "Cost Estimator", company: "Kealee PM", present: false, color: ATTENDEE_COLORS[7] },
]

const MOCK_MINUTES = `Meeting called to order at 10:02 AM by Sarah Kim.

All parties present except Lisa Wong (MEP Coordinator) and Amy Liu (Cost Estimator), both excused due to prior commitments.

Sarah opened with a review of action items from OAC Meeting #13. Three of six items have been resolved. The outstanding items include the foundation rebar spacing clarification (RFI-001), the updated two-week look-ahead, and the cladding substitution approval.

Mike Torres presented the schedule update. The north foundation pour has been rescheduled from 2/19 to 2/23 to allow time for the RFI-001 resolution. Steel delivery remains on track for March 1st. The framing crew from Valley Framing has confirmed mobilization for March 5th. No other critical path impacts at this time.

Sarah reviewed the budget status. The project is currently tracking at 97.2% of baseline budget. Two change orders are pending: CO-003 for the exterior cladding material substitution at $12,500, and CO-004 for additional blocking at $4,200. Robert Anderson noted the cladding substitution needs owner approval by 2/20 to avoid schedule impact.

James Chen reviewed the RFI and submittal log. There are currently 5 open RFIs with 2 overdue. The structural steel shop drawings (SUB-002) are due for review by 2/20. James committed to providing a formal response to RFI-001 by end of week.

Mike Torres delivered the safety report. Zero recordable incidents during this reporting period. A new subcontractor safety orientation is scheduled for February 18th. Hard hat compliance has been 100% during the past two weeks.

Meeting adjourned at 11:25 AM. Next meeting scheduled for February 23, 2026.`

export default function MeetingDetailPage() {
  const meeting = MOCK_MEETING

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/meetings"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back to Meetings</Button></Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">OAC</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>
          </div>
          <p className="text-gray-500">{meeting.project} - {new Date(meeting.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Edit size={16} />Edit Minutes</Button>
          <Button variant="outline" className="gap-2"><Plus size={16} />Add Action Item</Button>
          <Button className="gap-2"><Download size={16} />Export PDF</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Agenda Items */}
          <Card>
            <CardHeader><CardTitle>Agenda ({MOCK_AGENDA.length} items)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {MOCK_AGENDA.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{item.duration}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Presenter: {item.presenter}</p>
                      <p className="text-sm text-gray-700">{item.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Minutes */}
          <Card>
            <CardHeader><CardTitle>Meeting Minutes</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{MOCK_MINUTES}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Action Items ({MOCK_ACTION_ITEMS.length})</CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5"><Plus size={14} />Add Item</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Assignee</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ACTION_ITEMS.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{item.description}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.assignee}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ACTION_STATUS_STYLES[item.status])}>
                            {ACTION_STATUS_LABELS[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Meeting Details */}
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Calendar, label: "Date", value: new Date(meeting.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) },
                { icon: Clock, label: "Time", value: meeting.time },
                { icon: MapPin, label: "Location", value: meeting.location },
                { icon: Users, label: "Type", value: "Owner-Architect-Contractor" },
                { icon: User, label: "Organizer", value: meeting.organizer },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Attendees */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendees ({MOCK_ATTENDEES.length})</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" />{MOCK_ATTENDEES.filter((a) => a.present).length} present</span>
                  <span className="flex items-center gap-1"><Circle size={12} className="text-gray-300" />{MOCK_ATTENDEES.filter((a) => !a.present).length} absent</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_ATTENDEES.map((attendee) => (
                <div key={attendee.name} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", attendee.color)}>
                    {attendee.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{attendee.name}</p>
                      {attendee.present ? (
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle size={13} className="text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{attendee.role} - {attendee.company}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
