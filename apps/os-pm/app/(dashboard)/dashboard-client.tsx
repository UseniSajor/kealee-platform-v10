"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { FolderKanban, ListTodo, AlertTriangle, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Button } from "@kealee/ui/button"
import { api } from "@/lib/api-client"
import { useRequirePmAuth } from "@/lib/use-pm-auth"
import type { PMClient, PMTask } from "@/lib/types"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { WorkQueueTable } from "@/components/dashboard/WorkQueueTable"
import { ClientList } from "@/components/dashboard/ClientList"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { UpcomingInspections } from "@/components/dashboard/UpcomingInspections"
import { BudgetOverview } from "@/components/dashboard/BudgetOverview"
import { PMProductivityDashboard } from "@/components/dashboard/PMProductivityDashboard"

function safeDue(dueDate?: string | null) {
  if (!dueDate) return null
  const d = new Date(dueDate)
  return Number.isNaN(d.getTime()) ? null : d
}

export function DashboardClient() {
  const { ready } = useRequirePmAuth()
  const [now, setNow] = React.useState<number | null>(null)

  React.useEffect(() => {
    setNow(Date.now())
  }, [])

  const { data: tasksResp } = useQuery({
    queryKey: ["pm-tasks"],
    queryFn: () => api.getMyTasks(),
  })

  const tasks = (tasksResp?.tasks ?? []) as PMTask[]

  const { data: clientsResp } = useQuery({
    queryKey: ["pm-clients"],
    queryFn: () => api.getMyClients(),
  })

  const clients = (clientsResp?.clients ?? []) as PMClient[]

  if (!ready) {
    return <div className="text-sm text-neutral-600">Loading…</div>
  }

  const activeProjects = clients.reduce((sum, c) => sum + (c.activeProjects ?? 0), 0)
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length
  const overdueItems = tasks.filter((t) => {
    const due = safeDue(t.dueDate)
    return Boolean(due && now !== null && due.getTime() < now && t.status !== "completed")
  }).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-neutral-600 mt-1">Here&apos;s an overview of your workload today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/work-queue">View work queue</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">View clients</Link>
          </Button>
        </div>
      </div>

      {/* PM Productivity Dashboard */}
      <PMProductivityDashboard />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Active projects"
          value={activeProjects}
          icon={FolderKanban}
          iconClassName="bg-indigo-50 text-indigo-700"
        />
        <StatsCard
          title="Pending tasks"
          value={pendingTasks}
          icon={ListTodo}
          iconClassName="bg-amber-50 text-amber-700"
        />
        <StatsCard
          title="Overdue items"
          value={overdueItems}
          icon={AlertTriangle}
          iconClassName="bg-red-50 text-red-700"
        />
        <StatsCard
          title="Total clients"
          value={clients.length}
          icon={Users}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
      </div>

      <Card className="py-0">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Work queue</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/work-queue">Open</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <WorkQueueTable tasks={tasks} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <RecentActivity />
          <UpcomingInspections />
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Clients</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/clients">Open</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ClientList clients={clients} />
            </CardContent>
          </Card>

          <BudgetOverview />
        </div>
      </div>
    </div>
  )
}
