"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle,
  Circle,
  Clock,
  DollarSign,
  ExternalLink,
  FileCheck,
  FileQuestion,
  Image,
  Loader2,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"
import { useProjects } from "@pm/hooks/useProjects"

interface Milestone {
  id: string
  name: string
  date: string
  status: "completed" | "upcoming" | "in-progress"
}

interface ActivityItem {
  id: string
  type: "rfi" | "submittal" | "daily-log" | "change-order" | "photo"
  description: string
  date: string
  user: string
}

interface PendingApproval {
  id: string
  type: "submittal" | "change-order" | "selection"
  title: string
  description: string
  submittedDate: string
  amount: number | null
}

const ACTIVITY_ICONS: Record<ActivityItem["type"], React.ElementType> = {
  rfi: FileQuestion,
  submittal: FileCheck,
  "daily-log": Calendar,
  "change-order": DollarSign,
  photo: Camera,
}

const ACTIVITY_COLORS: Record<ActivityItem["type"], string> = {
  rfi: "text-blue-600 bg-blue-50",
  submittal: "text-green-600 bg-green-50",
  "daily-log": "text-purple-600 bg-purple-50",
  "change-order": "text-orange-600 bg-orange-50",
  photo: "text-pink-600 bg-pink-50",
}

function formatCurrency(n: number) {
  return "$" + n.toLocaleString()
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function ClientViewPage() {
  const { data, isLoading } = useProjects()
  const projects = data?.items ?? data ?? []
  const PROJECT = projects[0] ?? {
    name: "",
    address: "",
    overallProgress: 0,
    budgetTotal: 0,
    budgetSpent: 0,
    scheduledCompletion: "",
    openRFIs: 0,
    pendingApprovals: 0,
    milestones: [],
    photos: [],
    activity: [],
    pendingApprovalItems: [],
  }

  const milestones: Milestone[] = PROJECT.milestones ?? []
  const photos: { id: string; date: string; caption: string }[] = PROJECT.photos ?? []
  const activity: ActivityItem[] = PROJECT.activity ?? []
  const pendingApprovalItems: PendingApproval[] = PROJECT.pendingApprovalItems ?? PROJECT.pendingApprovals ?? []

  const budgetPercent = PROJECT.budgetTotal > 0 ? Math.round((PROJECT.budgetSpent / PROJECT.budgetTotal) * 100) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Overview</h1>
        <p className="text-gray-500 mt-1">{PROJECT.name} - {PROJECT.address}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{PROJECT.overallProgress}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: PROJECT.overallProgress + "%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Estimated completion: {formatFullDate(PROJECT.scheduledCompletion)}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg text-green-600 bg-green-50"><DollarSign size={20} /></div>
            <div>
              <p className="text-lg font-bold">{budgetPercent}%</p>
              <p className="text-xs text-gray-500">Budget Used</p>
              <p className="text-[10px] text-gray-400">{formatCurrency(PROJECT.budgetSpent)} of {formatCurrency(PROJECT.budgetTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg text-blue-600 bg-blue-50"><TrendingUp size={20} /></div>
            <div>
              <p className="text-lg font-bold">On Track</p>
              <p className="text-xs text-gray-500">Schedule Status</p>
              <p className="text-[10px] text-gray-400">2 days ahead</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg text-orange-600 bg-orange-50"><FileQuestion size={20} /></div>
            <div>
              <p className="text-lg font-bold">{PROJECT.openRFIs}</p>
              <p className="text-xs text-gray-500">Open RFIs</p>
              <p className="text-[10px] text-gray-400">2 awaiting response</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg text-purple-600 bg-purple-50"><Clock size={20} /></div>
            <div>
              <p className="text-lg font-bold">{PROJECT.pendingApprovals}</p>
              <p className="text-xs text-gray-500">Pending Approvals</p>
              <p className="text-[10px] text-gray-400">Action needed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Camera size={18} />Recent Photos</CardTitle>
              <Link href="/pm/photos"><Button variant="ghost" size="sm" className="gap-1 text-blue-600">View All Photos<ExternalLink size={14} /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="aspect-square bg-gray-200 rounded-lg flex flex-col items-center justify-center p-2 hover:bg-gray-300 transition-colors cursor-pointer">
                  <Image size={20} className="text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500 text-center leading-tight">{photo.caption}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(photo.date)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Calendar size={18} />Milestone Timeline</CardTitle>
              <Link href="/pm/schedule"><Button variant="ghost" size="sm" className="gap-1 text-blue-600">View Full Schedule<ExternalLink size={14} /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((ms, i) => (
                <div key={ms.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {ms.status === "completed" ? (
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                    ) : ms.status === "in-progress" ? (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-blue-500 bg-blue-100 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-gray-300 shrink-0" />
                    )}
                    {i < milestones.length - 1 && <div className={cn("w-0.5 h-6 mt-1", ms.status === "completed" ? "bg-green-300" : "bg-gray-200")} />}
                  </div>
                  <div className="min-w-0 -mt-0.5">
                    <p className={cn("text-sm font-medium", ms.status === "completed" ? "text-gray-500 line-through" : ms.status === "in-progress" ? "text-blue-700" : "text-gray-700")}>{ms.name}</p>
                    <p className="text-xs text-gray-400">{formatDate(ms.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare size={18} />Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((item) => {
            const Icon = ACTIVITY_ICONS[item.type]
            return (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={cn("p-1.5 rounded-lg shrink-0", ACTIVITY_COLORS[item.type])}><Icon size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.user} - {formatDate(item.date)}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock size={18} />Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingApprovalItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      item.type === "submittal" ? "bg-green-100 text-green-800" :
                      item.type === "change-order" ? "bg-orange-100 text-orange-800" :
                      "bg-purple-100 text-purple-800"
                    )}>
                      {item.type === "change-order" ? "Change Order" : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">Submitted {formatDate(item.submittedDate)}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  {item.amount !== null && (
                    <p className="text-sm font-medium text-orange-600 mt-1">{formatCurrency(item.amount)}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm">Review</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/pm/schedule">
          <Button variant="outline" className="w-full gap-2"><Calendar size={16} />View Full Schedule<ArrowRight size={14} /></Button>
        </Link>
        <Link href="/pm/budget">
          <Button variant="outline" className="w-full gap-2"><DollarSign size={16} />View Budget Detail<ArrowRight size={14} /></Button>
        </Link>
        <Link href="/pm/photos">
          <Button variant="outline" className="w-full gap-2"><Camera size={16} />View All Photos<ArrowRight size={14} /></Button>
        </Link>
      </div>
    </div>
  )
}

