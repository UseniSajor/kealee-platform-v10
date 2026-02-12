"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Calendar, CheckSquare, Clock, MapPin, Plus, Search, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type MeetingType = "OAC" | "Progress" | "Safety" | "Coordination"
type Tab = "Upcoming" | "Past"

interface Meeting {
  id: string; title: string; date: string; time: string; duration: string
  location: string; type: MeetingType; attendees: string[]; actionItems: number; isPast: boolean
}

const TC: Record<MeetingType, string> = {
  OAC: "bg-indigo-100 text-indigo-800", Progress: "bg-blue-100 text-blue-800",
  Safety: "bg-red-100 text-red-800", Coordination: "bg-emerald-100 text-emerald-800",
}

const DATA: Meeting[] = [
  { id: "MTG-030", title: "Weekly OAC Meeting #30", date: "2026-02-13", time: "10:00 AM", duration: "1.5 hrs", location: "Site Trailer", type: "OAC", attendees: ["Owner Rep", "Architect", "PM", "Super"], actionItems: 5, isPast: false },
  { id: "MTG-031", title: "MEP Coordination Meeting", date: "2026-02-14", time: "2:00 PM", duration: "1 hr", location: "Bldg A - Floor 3", type: "Coordination", attendees: ["PM", "Mech Sub", "Elec Sub", "Plumb Sub"], actionItems: 0, isPast: false },
  { id: "MTG-032", title: "Weekly Safety Meeting", date: "2026-02-14", time: "7:00 AM", duration: "30 min", location: "Site Yard", type: "Safety", attendees: ["Safety Mgr", "Super", "Foremen"], actionItems: 2, isPast: false },
  { id: "MTG-033", title: "Progress Meeting - Phase 2", date: "2026-02-18", time: "9:00 AM", duration: "2 hrs", location: "Site Trailer", type: "Progress", attendees: ["PM", "Super", "All Subs"], actionItems: 0, isPast: false },
  { id: "MTG-029", title: "Weekly OAC Meeting #29", date: "2026-02-06", time: "10:00 AM", duration: "1.5 hrs", location: "Site Trailer", type: "OAC", attendees: ["Owner Rep", "Architect", "PM", "Super"], actionItems: 4, isPast: true },
  { id: "MTG-028", title: "Concrete Pour Coordination", date: "2026-02-04", time: "3:00 PM", duration: "45 min", location: "Site Office", type: "Coordination", attendees: ["PM", "Concrete Sub", "Super"], actionItems: 3, isPast: true },
  { id: "MTG-027", title: "Weekly Safety Meeting", date: "2026-02-07", time: "7:00 AM", duration: "30 min", location: "Site Yard", type: "Safety", attendees: ["Safety Mgr", "Super", "Foremen"], actionItems: 1, isPast: true },
  { id: "MTG-026", title: "Owner Progress Presentation", date: "2026-01-31", time: "1:00 PM", duration: "1 hr", location: "Owner Office", type: "Progress", attendees: ["PM", "Owner", "Architect"], actionItems: 6, isPast: true },
]

export default function MeetingsPage() {
  const [tab, setTab] = useState<Tab>("Upcoming")
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => DATA.filter((m) => {
    const mt = tab === "Upcoming" ? !m.isPast : m.isPast
    return mt && (!query || m.title.toLowerCase().includes(query.toLowerCase()))
  }), [tab, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage project meetings.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Schedule Meeting</Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
          {(["Upcoming", "Past"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-md px-4 py-1.5 text-sm font-medium",
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>{t}</button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search meetings..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id} className="cursor-pointer hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100">
                <span className="text-xs font-medium text-gray-500">{new Date(m.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                <span className="text-lg font-bold text-gray-900">{new Date(m.date + "T12:00:00").getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TC[m.type])}>{m.type}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m.time} ({m.duration})</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{m.attendees.length}</span>
                </div>
              </div>
              {m.actionItems > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <CheckSquare className="h-3.5 w-3.5" />{m.actionItems} action items
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Calendar className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No {tab.toLowerCase()} meetings found</p>
        </div>
      )}
    </div>
  )
}
