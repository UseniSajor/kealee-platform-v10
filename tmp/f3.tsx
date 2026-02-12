"use client"

import * as React from "react"
import { useMemo } from "react"
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ClipboardList, FileText, HardHat, Plus, Shield } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"

const SEV_COLORS = {
  Critical: "bg-red-100 text-red-800",
  High: "bg-orange-100 text-orange-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
}

const MOCK_INCIDENTS = [
  { id: "INC-021", date: "2026-02-08", type: "Near Miss", description: "Unsecured ladder on level 3 scaffolding", status: "Under Review", severity: "High" as const },
  { id: "INC-020", date: "2026-02-05", type: "First Aid", description: "Minor cut from sheet metal edge - PPE reminder issued", status: "Closed", severity: "Low" as const },
  { id: "INC-019", date: "2026-01-30", type: "Near Miss", description: "Material fell from overhead hoist - area was barricaded", status: "Closed", severity: "Medium" as const },
  { id: "INC-018", date: "2026-01-22", type: "Recordable", description: "Sprained ankle from uneven ground in excavation area", status: "Closed", severity: "High" as const },
  { id: "INC-017", date: "2026-01-15", type: "First Aid", description: "Eye irritation from concrete dust - safety glasses enforced", status: "Closed", severity: "Low" as const },
]

export default function SafetyDashboardPage() {
  const safetyScore = 94
  const scoreTrend = 2.5
  const daysWithoutIncident = 14
  const sevCounts = useMemo(() => ({ Critical: 0, High: 2, Medium: 1, Low: 2 }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor safety metrics, incidents, and compliance.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Report Incident</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <Shield className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 text-4xl font-bold text-green-700">{safetyScore}</p>
            <p className="text-sm text-green-600">Safety Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <HardHat className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-2 text-4xl font-bold">{daysWithoutIncident}</p>
            <p className="text-sm text-gray-500">Days Without Incident</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="mt-2 text-4xl font-bold">5</p>
            <p className="text-sm text-gray-500">Total Incidents (YTD)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Incidents by Severity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(sevCounts) as [string, number][]).map(([sev, count]) => (
              <div key={sev} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", SEV_COLORS[sev as keyof typeof SEV_COLORS])}>{count}</span>
                  <span className="text-sm font-medium text-gray-700">{sev}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Incidents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_INCIDENTS.map((inc) => (
                <div key={inc.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV_COLORS[inc.severity])}>{inc.severity}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{inc.id}</span>
                      <span className="text-xs text-gray-400">{inc.date}</span>
                    </div>
                    <p className="truncate text-sm font-medium">{inc.description}</p>
                    <span className="text-xs text-gray-500">{inc.type}</span>
                  </div>
                  <span className={cn("text-xs font-medium", inc.status === "Closed" ? "text-green-600" : "text-amber-600")}>{inc.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <AlertTriangle className="h-6 w-6 text-red-500" /><span>Report Incident</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <FileText className="h-6 w-6 text-blue-500" /><span>Toolbox Talks</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <ClipboardList className="h-6 w-6 text-green-500" /><span>OSHA Checklists</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
