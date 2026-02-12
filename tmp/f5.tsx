"use client"

import * as React from "react"
import { useState } from "react"
import { BookOpen, Calendar, CheckCircle2, ClipboardList, Plus, Search, Users } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

interface ToolboxTalk {
  id: string; topic: string; category: string; lastConducted: string | null
  attendanceCount: number; description: string
}

const DATA: ToolboxTalk[] = [
  { id: "TBT-01", topic: "Fall Protection", category: "Working at Heights", lastConducted: "2026-02-03", attendanceCount: 24, description: "Proper use of harnesses, guardrails, and fall arrest systems." },
  { id: "TBT-02", topic: "Electrical Safety", category: "Electrical", lastConducted: "2026-01-27", attendanceCount: 18, description: "Lockout/tagout procedures, arc flash awareness, and GFCIs." },
  { id: "TBT-03", topic: "Scaffolding Safety", category: "Working at Heights", lastConducted: "2026-01-20", attendanceCount: 15, description: "Scaffold inspection, load limits, and safe access." },
  { id: "TBT-04", topic: "PPE Requirements", category: "General Safety", lastConducted: "2026-02-07", attendanceCount: 32, description: "Hard hats, safety glasses, high-vis vests, steel-toe boots." },
  { id: "TBT-05", topic: "Heat Stress Prevention", category: "Health", lastConducted: "2025-09-15", attendanceCount: 28, description: "Recognizing heat exhaustion, hydration, and rest breaks." },
  { id: "TBT-06", topic: "Trenching & Excavation", category: "Earthwork", lastConducted: "2026-01-13", attendanceCount: 12, description: "Soil classification, shoring, sloping, and trench boxes." },
  { id: "TBT-07", topic: "Confined Space Entry", category: "Specialized", lastConducted: "2025-12-09", attendanceCount: 10, description: "Permit-required entry, atmospheric testing, and rescue plans." },
  { id: "TBT-08", topic: "Fire Prevention", category: "General Safety", lastConducted: "2026-01-06", attendanceCount: 22, description: "Hot work permits, extinguisher use, and evacuation routes." },
  { id: "TBT-09", topic: "Crane & Rigging Safety", category: "Heavy Equipment", lastConducted: "2025-11-22", attendanceCount: 14, description: "Signal person duties, load charts, and inspection requirements." },
  { id: "TBT-10", topic: "Silica Dust Exposure", category: "Health", lastConducted: "2026-02-01", attendanceCount: 20, description: "Wet methods, vacuum systems, and respiratory protection." },
]

export default function ToolboxTalksPage() {
  const [query, setQuery] = useState("")
  const [showSignIn, setShowSignIn] = useState<string | null>(null)
  const filtered = DATA.filter((t) =>
    !query || t.topic.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toolbox Talks</h1>
          <p className="mt-1 text-sm text-gray-500">Safety topic library and attendance tracking.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Conduct New Talk</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search topics..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((talk) => (
          <Card key={talk.id} className="group hover:shadow-md">
            <CardContent className="p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{talk.topic}</h3>
              <p className="mt-1 text-xs text-gray-500">{talk.category}</p>
              <p className="mt-2 text-xs text-gray-600 line-clamp-2">{talk.description}</p>
              <div className="mt-3 flex items-center gap-3 border-t pt-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />{talk.lastConducted || "Never"}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />{talk.attendanceCount}
                </div>
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="w-full text-xs"
                  onClick={() => setShowSignIn(showSignIn === talk.id ? null : talk.id)}>
                  <ClipboardList className="mr-1 h-3 w-3" />Sign-In Sheet
                </Button>
              </div>
              {showSignIn === talk.id && (
                <div className="mt-3 rounded-lg border bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">Recent Attendees:</p>
                  <div className="space-y-1">
                    {["John Martinez", "Carlos Ruiz", "Mike Torres"].map((name) => (
                      <div key={name} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />{name}
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">+{talk.attendanceCount - 3} more</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
