"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, CheckCircle, Circle, Clock, Download, Edit, Loader2, MapPin, Plus, User, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { useMeeting } from "@/hooks/useMeetings"

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

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const { data: meeting, isLoading } = useMeeting(params.id)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )

  if (!meeting) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Meeting not found</p>
    </div>
  )

  const attendees = (meeting.attendees ?? []).map((a: any, i: number) => ({
    ...a,
    color: a.color ?? ATTENDEE_COLORS[i % ATTENDEE_COLORS.length],
  }))
  const agendaItems = meeting.agendaItems ?? []
  const actionItems = meeting.actionItems ?? []
  const minutes = meeting.minutes ?? ""

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
            <CardHeader><CardTitle>Agenda ({agendaItems.length} items)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {agendaItems.map((item: any, index: number) => (
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
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{minutes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Action Items ({actionItems.length})</CardTitle>
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
                    {actionItems.map((item: any) => (
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
                <CardTitle>Attendees ({attendees.length})</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" />{attendees.filter((a: any) => a.present).length} present</span>
                  <span className="flex items-center gap-1"><Circle size={12} className="text-gray-300" />{attendees.filter((a: any) => !a.present).length} absent</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {attendees.map((attendee: any) => (
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
