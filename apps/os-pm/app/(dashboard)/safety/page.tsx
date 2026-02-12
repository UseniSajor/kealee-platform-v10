"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  HardHat,
  MessageSquare,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"

type IncidentSeverity = "minor" | "moderate" | "serious" | "critical"

interface RecentIncident {
  id: string
  title: string
  date: string
  severity: IncidentSeverity
  status: string
  location: string
}

interface UpcomingTalk {
  id: string
  title: string
  date: string
  presenter: string
  category: string
  attendeeCount: number
}

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  serious: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
}

const RECENT_INCIDENTS: RecentIncident[] = [
  { id: "1", title: "Tripping hazard - unsecured extension cord", date: "2026-02-10", severity: "minor", status: "Resolved", location: "Building A - 2nd Floor" },
  { id: "2", title: "Worker struck by falling debris", date: "2026-02-07", severity: "moderate", status: "Investigating", location: "Building B - Roof" },
  { id: "3", title: "Near-miss: forklift close call in parking area", date: "2026-02-05", severity: "minor", status: "Closed", location: "Staging Area" },
  { id: "4", title: "Chemical spill - paint thinner in storage room", date: "2026-02-01", severity: "serious", status: "Resolved", location: "Building A - Storage" },
]

const UPCOMING_TALKS: UpcomingTalk[] = [
  { id: "1", title: "Fall Protection Refresher", date: "2026-02-14", presenter: "Dave Martinez", category: "Fall Protection", attendeeCount: 24 },
  { id: "2", title: "Electrical Safety - Lockout/Tagout", date: "2026-02-18", presenter: "Lisa Chen", category: "Electrical Safety", attendeeCount: 18 },
  { id: "3", title: "Excavation Safety & Trench Protocol", date: "2026-02-21", presenter: "Carlos Rivera", category: "Excavation", attendeeCount: 12 },
]

const COMPLIANCE_ITEMS = [
  { label: "PPE Compliance", value: 96, color: "bg-green-500" },
  { label: "Fall Protection", value: 92, color: "bg-green-500" },
  { label: "Housekeeping", value: 88, color: "bg-yellow-500" },
  { label: "Scaffolding Inspections", value: 85, color: "bg-yellow-500" },
  { label: "Equipment Certifications", value: 78, color: "bg-orange-500" },
]

export default function SafetyDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Safety Management</h1>
          <p className="text-gray-500 mt-1">Monitor safety performance and compliance</p>
        </div>
        <div className="flex gap-2">
          <Link href="/safety/incidents">
            <Button variant="outline" className="gap-2">
              <ShieldAlert size={16} />
              Report Incident
            </Button>
          </Link>
          <Link href="/safety/toolbox-talks">
            <Button className="gap-2">
              <Plus size={16} />
              Schedule Toolbox Talk
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Days Without Incident",
            value: "32",
            icon: Shield,
            color: "text-green-600 bg-green-50",
            subtitle: "Last: Feb 7, 2026",
          },
          {
            label: "Open Incidents",
            value: "1",
            icon: AlertTriangle,
            color: "text-orange-600 bg-orange-50",
            subtitle: "1 investigating",
          },
          {
            label: "Toolbox Talks This Month",
            value: "3",
            icon: MessageSquare,
            color: "text-blue-600 bg-blue-50",
            subtitle: "Target: 4/month",
          },
          {
            label: "Safety Score",
            value: "94",
            icon: ShieldCheck,
            color: "text-emerald-600 bg-emerald-50",
            subtitle: "Up from 91 last month",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", s.color)}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{s.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={18} />
                Recent Incidents
              </CardTitle>
              <Link href="/safety/incidents">
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                  View All <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_INCIDENTS.map((incident) => (
              <Link
                key={incident.id}
                href={`/safety/incidents`}
                className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 leading-tight">{incident.title}</h4>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium ml-2 shrink-0",
                      SEVERITY_STYLES[incident.severity]
                    )}
                  >
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    {new Date(incident.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>{incident.location}</span>
                  <span
                    className={cn(
                      "font-medium",
                      incident.status === "Investigating" ? "text-orange-600" : "text-green-600"
                    )}
                  >
                    {incident.status}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Toolbox Talks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={18} />
                Upcoming Toolbox Talks
              </CardTitle>
              <Link href="/safety/toolbox-talks">
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                  View All <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {UPCOMING_TALKS.map((talk) => (
              <Link
                key={talk.id}
                href={`/safety/toolbox-talks`}
                className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <h4 className="text-sm font-medium text-gray-900 mb-1">{talk.title}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(talk.date + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {talk.attendeeCount} attendees
                  </span>
                  <span>{talk.presenter}</span>
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {talk.category}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Safety Compliance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={18} />
            Safety Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {COMPLIANCE_ITEMS.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">{item.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", item.color)}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Report Incident",
            description: "Log a new safety incident or near-miss",
            icon: ShieldAlert,
            href: "/safety/incidents",
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Schedule Toolbox Talk",
            description: "Plan a new safety training session",
            icon: ClipboardList,
            href: "/safety/toolbox-talks",
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Safety Inspections",
            description: "View and manage site inspections",
            icon: CheckCircle2,
            href: "/safety/incidents",
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Training Records",
            description: "Worker certifications and training",
            icon: HardHat,
            href: "/safety/toolbox-talks",
            color: "text-purple-600 bg-purple-50",
          },
        ].map((link) => (
          <Link key={link.label} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className={cn("p-3 rounded-lg inline-flex mb-3", link.color)}>
                  <link.icon size={24} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{link.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
