"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { usePunchItem } from "@pm/hooks/usePunchList"

type PunchStatus = "open" | "in-progress" | "completed" | "verified"

const STATUS_STYLES: Record<PunchStatus, string> = {
  open: "bg-red-100 text-red-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  verified: "bg-green-100 text-green-800",
}

const STATUS_LABELS: Record<PunchStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  completed: "Completed",
  verified: "Verified",
}


export default function PunchItemDetailPage({ params }: { params: { id: string } }) {
  const [comment, setComment] = React.useState("")
  const { data: item, isLoading } = usePunchItem(params.id)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )

  if (!item) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Punch list item not found</p>
    </div>
  )

  const photos = item.photos ?? []
  const activity = item.activity ?? []
  const statusHistory = item.statusHistory ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pm/punch-list">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Punch List
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{item.number}</h1>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[item.status])}>
              {STATUS_LABELS[item.status]}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
            </span>
          </div>
          <p className="text-lg text-gray-700">{item.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RotateCcw size={16} />
            Reopen
          </Button>
          <Button variant="outline" className="gap-2">
            <CheckCircle2 size={16} />
            Mark Complete
          </Button>
          <Button className="gap-2">
            <ShieldCheck size={16} />
            Verify
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera size={18} />
                  Photos ({photos.length})
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1">
                  <Camera size={14} />
                  Add Photo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo: any) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Camera size={24} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{photo.label}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(photo.date + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
            </CardContent>
          </Card>

          {/* Floor Plan Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={18} />
                Location on Floor Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <MapPin size={32} className="mb-2" />
                <p className="text-sm font-medium">Floor Plan View</p>
                <p className="text-xs">Drawing: {item.drawingRef}</p>
                <p className="text-xs mt-1">Pin location would be shown here</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                Activity Log ({activity.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.map((a: any) => (
                <div key={a.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                      {a.user
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.user}</p>
                      <p className="text-xs text-gray-400">
                        {a.role} -{" "}
                        {new Date(a.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "ml-auto px-2 py-0.5 rounded-full text-xs font-medium",
                        a.type === "created"
                          ? "bg-blue-50 text-blue-600"
                          : a.type === "assigned"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-gray-50 text-gray-600"
                      )}
                    >
                      {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{a.content}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <Send size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: MapPin, label: "Location", value: item.location },
                { icon: Wrench, label: "Trade", value: item.trade },
                { icon: User, label: "Assignee", value: `${item.assignee} (${item.assigneeCompany})` },
                { icon: User, label: "Created By", value: item.createdBy },
                {
                  icon: Calendar,
                  label: "Created Date",
                  value: new Date(item.createdDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                },
                {
                  icon: Clock,
                  label: "Due Date",
                  value: new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                },
                { icon: Wrench, label: "Spec Reference", value: item.specRef },
              ].map((detail) => (
                <div key={detail.label} className="flex items-start gap-3">
                  <detail.icon size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{detail.label}</p>
                    <p className="text-sm font-medium">{detail.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(["open", "in-progress", "completed", "verified"] as PunchStatus[]).map((status, i) => {
                  const isActive = status === item.status
                  const isPast =
                    (["open", "in-progress", "completed", "verified"] as PunchStatus[]).indexOf(status) <
                    (["open", "in-progress", "completed", "verified"] as PunchStatus[]).indexOf(item.status)
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                          isActive
                            ? "border-blue-600 bg-blue-600 text-white"
                            : isPast
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 bg-white text-gray-400"
                        )}
                      >
                        {isPast ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-blue-700" : isPast ? "text-green-700" : "text-gray-400"
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusHistory.map((h: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      {i < statusHistory.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium">{h.status}</p>
                      <p className="text-xs text-gray-400">
                        {h.by} -{" "}
                        {new Date(h.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
