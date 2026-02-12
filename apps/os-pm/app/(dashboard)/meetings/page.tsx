"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, CheckSquare, Clock, Filter, Loader2, MapPin, Plus, Search, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { useMeetings } from "@/hooks/useMeetings"

type MeetingType = "owner-architect-contractor" | "progress" | "safety" | "coordination" | "pre-construction" | "closeout"
type MeetingStatus = "scheduled" | "in-progress" | "completed" | "cancelled"

interface Attendee {
  name: string
  initials: string
  color: string
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: MeetingType
  status: MeetingStatus
  attendees: Attendee[]
  actionItems: number
  project: string
}

const TYPE_LABELS: Record<MeetingType, string> = {
  "owner-architect-contractor": "OAC",
  progress: "Progress",
  safety: "Safety",
  coordination: "Coordination",
  "pre-construction": "Pre-Construction",
  closeout: "Closeout",
}

const TYPE_STYLES: Record<MeetingType, string> = {
  "owner-architect-contractor": "bg-purple-100 text-purple-800",
  progress: "bg-blue-100 text-blue-800",
  safety: "bg-orange-100 text-orange-800",
  coordination: "bg-teal-100 text-teal-800",
  "pre-construction": "bg-indigo-100 text-indigo-800",
  closeout: "bg-gray-100 text-gray-800",
}

const STATUS_STYLES: Record<MeetingStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const ATTENDEE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
]

export default function MeetingsPage() {
  const [search, setSearch] = React.useState("")
  const [tab, setTab] = React.useState<"upcoming" | "past" | "all">("upcoming")

  const typeFilter = tab === "upcoming" ? "upcoming" : tab === "past" ? "past" : undefined
  const { data, isLoading } = useMeetings({
    type: typeFilter,
    search: search || undefined,
  })
  const meetings: Meeting[] = data?.items ?? []

  const filtered = React.useMemo(() => {
    return meetings.filter((m) => {
      if (tab === "upcoming" && (m.status === "completed" || m.status === "cancelled")) return false
      if (tab === "past" && m.status !== "completed" && m.status !== "cancelled") return false
      return true
    })
  }, [meetings, tab])

  const stats = React.useMemo(() => ({
    total: meetings.length,
    upcoming: meetings.filter((m) => m.status === "scheduled" || m.status === "in-progress").length,
    completed: meetings.filter((m) => m.status === "completed").length,
    actionItems: meetings.reduce((sum, m) => sum + (m.actionItems ?? 0), 0),
  }), [meetings])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-500 mt-1">Meeting minutes and scheduling</p>
        </div>
        <Link href="/meetings/new">
          <Button className="gap-2"><Plus size={16} />Schedule Meeting</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Meetings", value: stats.total, icon: Calendar, color: "text-blue-600 bg-blue-50" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-orange-600 bg-orange-50" },
          { label: "Completed", value: stats.completed, icon: CheckSquare, color: "text-green-600 bg-green-50" },
          { label: "Action Items", value: stats.actionItems, icon: Users, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}><s.icon size={20} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search meetings by title, project, or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {(["upcoming", "past", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {t === "upcoming" ? "Upcoming" : t === "past" ? "Past" : "All"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((meeting) => (
          <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 leading-tight pr-2">{meeting.title}</h3>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", TYPE_STYLES[meeting.type])}>
                      {TYPE_LABELS[meeting.type]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", STATUS_STYLES[meeting.status])}>
                      {STATUS_LABELS[meeting.status]}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{new Date(meeting.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="text-gray-400">|</span>
                    <span>{meeting.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{meeting.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {meeting.attendees.slice(0, 4).map((a) => (
                        <div
                          key={a.initials}
                          className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white", a.color)}
                          title={a.name}
                        >
                          {a.initials}
                        </div>
                      ))}
                      {meeting.attendees.length > 4 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-100 text-gray-600 border-2 border-white">
                          +{meeting.attendees.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">{meeting.attendees.length} attendees</span>
                  </div>

                  {meeting.actionItems > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckSquare size={13} className="text-gray-400" />
                      <span className="text-gray-600 font-medium">{meeting.actionItems} action items</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-400">{meeting.project}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No meetings found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
