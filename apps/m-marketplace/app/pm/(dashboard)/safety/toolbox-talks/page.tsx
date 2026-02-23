"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  Search,
  User,
  Users,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { useToolboxTalks } from "@pm/hooks/useSafety"

type TalkCategory =
  | "fall-protection"
  | "electrical-safety"
  | "excavation"
  | "ppe"
  | "heat-stress"
  | "scaffolding"

type TalkStatus = "scheduled" | "completed" | "cancelled"

interface ToolboxTalk {
  id: string
  title: string
  date: string
  time: string
  presenter: string
  attendeeCount: number
  category: TalkCategory
  status: TalkStatus
  duration: string
  location: string
  description: string
}

const CATEGORY_LABELS: Record<TalkCategory, string> = {
  "fall-protection": "Fall Protection",
  "electrical-safety": "Electrical Safety",
  excavation: "Excavation",
  ppe: "PPE",
  "heat-stress": "Heat Stress",
  scaffolding: "Scaffolding",
}

const CATEGORY_STYLES: Record<TalkCategory, string> = {
  "fall-protection": "bg-red-50 text-red-700",
  "electrical-safety": "bg-yellow-50 text-yellow-700",
  excavation: "bg-orange-50 text-orange-700",
  ppe: "bg-blue-50 text-blue-700",
  "heat-stress": "bg-amber-50 text-amber-700",
  scaffolding: "bg-purple-50 text-purple-700",
}

const STATUS_STYLES: Record<TalkStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function ToolboxTalksPage() {
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [selectedTalkId, setSelectedTalkId] = React.useState<string | null>(null)

  const { data, isLoading } = useToolboxTalks({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  })
  const talks: ToolboxTalk[] = data?.items ?? []
  const signIn: { name: string; company: string; signed: boolean; time: string }[] = data?.signIn ?? []

  const filtered = React.useMemo(() => {
    return talks
  }, [talks])

  const stats = React.useMemo(
    () => ({
      total: talks.length,
      completed: talks.filter((t) => t.status === "completed").length,
      upcoming: talks.filter((t) => t.status === "scheduled").length,
      totalAttendees: talks.filter((t) => t.status === "completed").reduce(
        (sum, t) => sum + t.attendeeCount,
        0
      ),
    }),
    [talks]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pm/safety">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Safety
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Toolbox Talks</h1>
          <p className="text-gray-500 mt-1">Safety training sessions and sign-in records</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Schedule Talk
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Talks", value: stats.total, icon: ClipboardList, color: "text-blue-600 bg-blue-50" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Upcoming", value: stats.upcoming, icon: Calendar, color: "text-orange-600 bg-orange-50" },
          { label: "Total Attendees", value: stats.totalAttendees, icon: Users, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search talks by title, presenter, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Categories</option>
              {(Object.keys(CATEGORY_LABELS) as TalkCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((talk) => (
            <Card
              key={talk.id}
              className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                selectedTalkId === talk.id && "ring-2 ring-blue-500"
              )}
              onClick={() => setSelectedTalkId(selectedTalkId === talk.id ? null : talk.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CATEGORY_STYLES[talk.category])}>
                      {CATEGORY_LABELS[talk.category]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[talk.status])}>
                      {talk.status.charAt(0).toUpperCase() + talk.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {talk.duration}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{talk.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{talk.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(talk.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {" at "}
                    {talk.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {talk.presenter}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {talk.attendeeCount} attendees
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No toolbox talks found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sign-in Sheet */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck size={18} />
                Sign-in Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTalkId ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    {talks.find((t) => t.id === selectedTalkId)?.title}
                  </p>
                  {signIn.length > 0 ? signIn.map((worker, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            worker.signed
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {worker.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{worker.name}</p>
                          <p className="text-xs text-gray-500">{worker.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {worker.signed ? (
                          <div>
                            <CheckCircle2 size={16} className="text-green-500 inline" />
                            <p className="text-xs text-gray-400">{worker.time}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not signed</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-4">Select a talk to view sign-in records</p>
                  )}
                  {signIn.length > 0 && (
                    <div className="pt-2 border-t mt-3">
                      <p className="text-xs text-gray-500">
                        {signIn.filter((w) => w.signed).length} of {signIn.length} signed in
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardCheck size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Select a talk to view the sign-in sheet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

