"use client"

import * as React from "react"
import { useState } from "react"
import { ArrowLeft, Calendar, Camera, CheckCircle2, Clock, Edit, MapPin, MessageSquare, User, Wrench } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"

type Status = "Open" | "In Progress" | "Ready for Review" | "Closed"

const SC: Record<Status, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Ready for Review": "bg-purple-100 text-purple-800",
  Closed: "bg-gray-100 text-gray-600",
}

const MOCK_ITEM = {
  id: "PI-004",
  title: "Fire caulking missing at penetration",
  location: "Building A, Floor 1, Electrical Room",
  description: "Fire caulking is missing at the electrical conduit penetration through the 2-hour rated wall. This is a life-safety deficiency that must be corrected before final inspection.",
  status: "Open" as Status,
  priority: "Critical" as const,
  assignee: "SafeGuard Firestop",
  trade: "Firestopping",
  dueDate: "2026-02-14",
  createdAt: "2026-02-07",
  createdBy: "John Martinez, PM",
  photoCount: 4,
}

const MOCK_ACTIVITY = [
  { id: "a1", timestamp: "2026-02-07 09:15 AM", user: "John Martinez", action: "Created punch item", detail: "Identified during walkthrough with fire marshal." },
  { id: "a2", timestamp: "2026-02-07 09:30 AM", user: "System", action: "Notification sent", detail: "Email sent to SafeGuard Firestop." },
  { id: "a3", timestamp: "2026-02-07 02:45 PM", user: "Mike Torres (SafeGuard)", action: "Acknowledged", detail: "Will schedule crew for next Tuesday." },
  { id: "a4", timestamp: "2026-02-10 08:00 AM", user: "John Martinez", action: "Added comment", detail: "Fire marshal follow-up scheduled for Feb 15." },
]

export default function PunchItemDetailPage() {
  const [status, setStatus] = useState<Status>(MOCK_ITEM.status)
  const nextStatuses: Record<Status, Status[]> = {
    Open: ["In Progress"],
    "In Progress": ["Ready for Review", "Open"],
    "Ready for Review": ["Closed", "In Progress"],
    Closed: ["Open"],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" />Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">{MOCK_ITEM.id}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SC[status])}>{status}</span>
            <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">{MOCK_ITEM.priority}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{MOCK_ITEM.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Photo Gallery</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: MOCK_ITEM.photoCount }).map((_, i) => (
                  <div key={i} className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                    <Camera className="h-8 w-8 text-gray-300" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Before / After Comparison</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-red-200 bg-red-50">
                  <div className="text-center"><Camera className="mx-auto h-8 w-8 text-red-300" /><span className="text-xs text-red-400">Before</span></div>
                </div>
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-green-200 bg-green-50">
                  <div className="text-center"><Camera className="mx-auto h-8 w-8 text-green-300" /><span className="text-xs text-green-400">After</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_ACTIVITY.map((a) => (
                  <div key={a.id} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{a.user}</span>
                        <span className="text-xs text-gray-400">{a.timestamp}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{a.action}</p>
                      <p className="text-sm text-gray-500">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-500">Location</p><p className="text-sm">{MOCK_ITEM.location}</p></div></div>
              <div className="flex items-start gap-2"><User className="mt-0.5 h-4 w-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-500">Assigned Trade</p><p className="text-sm">{MOCK_ITEM.assignee}</p></div></div>
              <div className="flex items-start gap-2"><Wrench className="mt-0.5 h-4 w-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-500">Trade</p><p className="text-sm">{MOCK_ITEM.trade}</p></div></div>
              <div className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-500">Due Date</p><p className="text-sm">{MOCK_ITEM.dueDate}</p></div></div>
              <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-500">Created</p><p className="text-sm">{MOCK_ITEM.createdAt} by {MOCK_ITEM.createdBy}</p></div></div>
              <div><p className="text-xs font-medium text-gray-500">Description</p><p className="mt-1 text-sm text-gray-700">{MOCK_ITEM.description}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Change Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nextStatuses[status]?.map((s) => (
                <Button key={s} variant="outline" className="w-full justify-start gap-2" onClick={() => setStatus(s)}>
                  <CheckCircle2 className="h-4 w-4" />Move to {s}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
