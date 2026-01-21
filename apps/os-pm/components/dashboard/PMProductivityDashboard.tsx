"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Home, 
  Building2,
  DollarSign,
  Target,
  Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { api } from "@/lib/api-client"
import type { PMDashboard } from "@/lib/types"
import { PomodoroTimer } from "./PomodoroTimer"
import { ComplianceAlert } from "./ComplianceAlert"

function ProductivityScore({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50"
    if (score >= 60) return "bg-amber-50"
    return "bg-red-50"
  }

  return (
    <div className={`rounded-lg p-6 ${getBgColor(score)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-600">Productivity Score</span>
        <Target className="h-5 w-5 text-neutral-400" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-sm text-neutral-500">/ 100</span>
      </div>
      <div className="mt-4 w-full bg-neutral-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            score >= 80 ? "bg-emerald-600" : score >= 60 ? "bg-amber-600" : "bg-red-600"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function ComplianceScores({ scores }: { scores: PMDashboard["complianceScore"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compliance Scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-600">SOP Adherence</span>
            <span className="text-sm font-semibold">{scores.sopAdherence}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${scores.sopAdherence}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-600">Gate Compliance</span>
            <span className="text-sm font-semibold">{scores.gateCompliance}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${scores.gateCompliance}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-600">Audit Score</span>
            <span className="text-sm font-semibold">{scores.auditScore}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${scores.auditScore}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkloadCard({ workload }: { workload: PMDashboard["workload"] }) {
  const items = [
    {
      label: "GC Projects",
      value: workload.gcProjects,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Homeowner Projects",
      value: workload.homeownerProjects,
      icon: Home,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Permits Pending",
      value: workload.permitsPending,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Escrow Releases",
      value: workload.escrowReleases,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workload Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`rounded-lg p-4 ${item.bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-neutral-600">{item.label}</span>
                </div>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityTasks({ 
  tasks, 
  onTaskSelect 
}: { 
  tasks: PMDashboard["priorityTasks"]
  onTaskSelect?: (task: PMDashboard["priorityTasks"][0]) => void
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-200"
      case "HIGH":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "GC":
        return Building2
      case "Homeowner":
        return Home
      case "Permit":
        return FileText
      case "Escrow":
        return DollarSign
      default:
        return FileText
    }
  }

  const formatDueTime = (dueTime: string) => {
    const due = new Date(dueTime)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d left`
    if (hours > 0) return `${hours}h left`
    return "Due soon"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Priority Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No priority tasks</p>
          ) : (
            tasks.map((task) => {
              const SourceIcon = getSourceIcon(task.source)
              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={() => onTaskSelect?.(task)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SourceIcon className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDueTime(task.dueTime)} • {task.estimatedEffort} min
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PMProductivityDashboard() {
  const [currentTask, setCurrentTask] = React.useState<PMDashboard["priorityTasks"][0] | undefined>()
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | undefined>()

  const { data, isLoading, error } = useQuery({
    queryKey: ["pm-productivity"],
    queryFn: () => api.getProductivityDashboard(),
    refetchInterval: 60000, // Refetch every minute
  })

  // Set up real-time updates via SSE
  React.useEffect(() => {
    if (!data?.dashboard) return

    // Set first priority task as current if none selected
    if (!currentTask && data.dashboard.priorityTasks.length > 0) {
      setCurrentTask(data.dashboard.priorityTasks[0])
      setSelectedTaskId(data.dashboard.priorityTasks[0].id)
    }

    // Connect to SSE for real-time updates
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/realtime/productivity`,
      {
        withCredentials: true,
      }
    )

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        if (update.type === "productivity_update") {
          // Update dashboard data in real-time
          // This would trigger a refetch or update local state
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [data, currentTask])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-neutral-600">Loading productivity dashboard...</div>
      </div>
    )
  }

  if (error || !data?.dashboard) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-red-600">
          Failed to load productivity dashboard. Please try again.
        </div>
      </div>
    )
  }

  const dashboard = data.dashboard

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Productivity Dashboard</h2>
        <p className="text-sm text-neutral-600">
          Real-time metrics and workload from all profit centers
        </p>
      </div>

      {/* Productivity Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityScore score={dashboard.productivityScore} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Active Hours Today</span>
                <Clock className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="text-3xl font-bold">{dashboard.activeHoursToday.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Focus Time Remaining</span>
                <Zap className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="text-3xl font-bold">{dashboard.focusTimeRemaining.toFixed(1)}h</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceScores scores={dashboard.complianceScore} />
        <WorkloadCard workload={dashboard.workload} />
      </div>

      {/* Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriorityTasks 
            tasks={dashboard.priorityTasks} 
            onTaskSelect={(task) => {
              setCurrentTask(task)
              setSelectedTaskId(task.id)
            }}
          />
          {selectedTaskId && (
            <div className="mt-6">
              <ComplianceAlert 
                taskId={selectedTaskId}
                onResolve={() => setSelectedTaskId(undefined)}
              />
            </div>
          )}
        </div>
        <div>
          <PomodoroTimer
            currentTask={currentTask}
            onTaskComplete={(taskId) => {
              // Handle task completion
              console.log("Task completed:", taskId)
            }}
            onTaskSwitch={() => {
              // Auto-switch to next priority task
              if (dashboard.priorityTasks.length > 1) {
                const currentIndex = dashboard.priorityTasks.findIndex((t) => t.id === currentTask?.id)
                const nextTask = dashboard.priorityTasks[currentIndex + 1] || dashboard.priorityTasks[0]
                setCurrentTask(nextTask)
                setSelectedTaskId(nextTask.id)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

