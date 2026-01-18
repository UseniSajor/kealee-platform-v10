"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Play, Pause, CheckCircle2, X, AlertCircle, ExternalLink, MessageSquare, HelpCircle } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { useTaskContext } from "@/hooks/useTaskContext"
import { RequirementCheck } from "./RequirementCheck"
import { api } from "@/lib/api-client"

interface FocusModeProps {
  taskId: string
  onExit?: () => void
}

const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds

export function FocusMode({ taskId, onExit }: FocusModeProps) {
  const [isActive, setIsActive] = React.useState(false)
  const [timeRemaining, setTimeRemaining] = React.useState(POMODORO_DURATION)
  const [isPaused, setIsPaused] = React.useState(false)
  const [startTime, setStartTime] = React.useState<Date | null>(null)
  const queryClient = useQueryClient()
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const { data: taskContextData, isLoading } = useTaskContext(taskId)
  const taskContext = taskContextData?.context

  // Enable focus mode
  const enableFocusMode = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/focus-mode/enable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            taskId,
            duration: 25,
            integrations: ["slack", "teams", "email"],
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to enable focus mode")
      }

      return response.json()
    },
    onSuccess: () => {
      setIsActive(true)
      setStartTime(new Date())
      startTimer()
      logFocusSession()
    },
  })

  // Log focus session
  const logFocusSession = async () => {
    if (!taskContext) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/focus-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          taskId,
          startTime: new Date().toISOString(),
          estimatedEffort: taskContext.estimatedMinutes,
        }),
      })
    } catch (error) {
      console.error("Failed to log focus session:", error)
    }
  }

  // Timer logic
  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPaused(true)
  }

  const resumeTimer = () => {
    setIsPaused(false)
    startTimer()
  }

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Timer completed - could auto-complete task or show notification
  }

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Complete task
  const completeTask = useMutation({
    mutationFn: async () => {
      return api.completeTask?.(taskId, { completedAt: new Date().toISOString() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task-context", taskId] })
      onExit?.()
    },
  })

  // Skip task
  const skipTask = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/tasks/${taskId}/skip`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ reason }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to skip task")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-tasks"] })
      onExit?.()
    },
  })

  // Check requirement
  const checkRequirement = async (requirementId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/tasks/${taskId}/requirements/${requirementId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      )

      queryClient.invalidateQueries({ queryKey: ["task-context", taskId] })
    } catch (error) {
      console.error("Failed to complete requirement:", error)
    }
  }

  // Open integrated module
  const openIntegratedModule = (integrationPoint: any) => {
    if (integrationPoint.url) {
      window.open(integrationPoint.url, "_blank")
    } else {
      // Navigate to module in-app
      window.location.href = `/modules/${integrationPoint.module}`
    }
  }

  // Log note
  const logNote = async () => {
    const note = prompt("Add a note for this task:")
    if (!note) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/tasks/${taskId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ note }),
        }
      )
    } catch (error) {
      console.error("Failed to log note:", error)
    }
  }

  // Request help
  const requestHelp = async () => {
    const message = prompt("What do you need help with?")
    if (!message) return

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/pm/tasks/${taskId}/help-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ message }),
        }
      )
    } catch (error) {
      console.error("Failed to request help:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((POMODORO_DURATION - timeRemaining) / POMODORO_DURATION) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-neutral-600">Loading task context...</div>
      </div>
    )
  }

  if (!taskContext) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-600">Task not found</div>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Focus Mode</h2>
          <p className="text-neutral-600">Enter distraction-free mode to focus on this task</p>
        </div>
        <Button onClick={() => enableFocusMode.mutate()} size="lg" disabled={enableFocusMode.isPending}>
          {enableFocusMode.isPending ? "Enabling..." : "Enable Focus Mode"}
        </Button>
      </div>
    )
  }

  return (
    <div className={`focus-mode ${isActive ? "active" : ""} min-h-screen bg-neutral-50`}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-600">Focus Mode Active</span>
          </div>
          <Button onClick={onExit} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Exit Focus Mode
          </Button>
        </div>

        {/* Current Task */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{taskContext.title}</h2>
            {taskContext.description && (
              <p className="text-neutral-600 mb-4">{taskContext.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span>
                <strong>Project:</strong> {taskContext.projectName}
              </span>
              <span>
                <strong>Source:</strong> {taskContext.sourceModule}
              </span>
              <span>
                <strong>Priority:</strong>{" "}
                <span
                  className={`font-medium ${
                    taskContext.priority === "CRITICAL"
                      ? "text-red-600"
                      : taskContext.priority === "HIGH"
                      ? "text-orange-600"
                      : taskContext.priority === "MEDIUM"
                      ? "text-yellow-600"
                      : "text-neutral-600"
                  }`}
                >
                  {taskContext.priority}
                </span>
              </span>
            </div>
          </div>

          {/* Required inputs before completion */}
          {taskContext.requirements && taskContext.requirements.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Completion Requirements</h3>
              {taskContext.requirements.map((req) => (
                <RequirementCheck
                  key={req.id}
                  requirement={req}
                  onComplete={() => checkRequirement(req.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Focus Timer */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Circular Progress */}
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-neutral-200"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  className="text-blue-600"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
                  <div className="text-sm text-neutral-500 mt-1">Focus Time</div>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Button onClick={resumeTimer} variant="default" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline" size="lg">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button
                onClick={() => completeTask.mutate()}
                variant="default"
                size="lg"
                disabled={completeTask.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Task
              </Button>
              <Button
                onClick={() => {
                  const reason = prompt("Why are you skipping this task?")
                  if (reason) skipTask.mutate(reason)
                }}
                variant="outline"
                size="lg"
                disabled={skipTask.isPending}
              >
                Skip (requires reason)
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {taskContext.integrationPoints && taskContext.integrationPoints.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openIntegratedModule(taskContext.integrationPoints[0])}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open {taskContext.integrationPoints[0].module}
              </Button>
              <Button onClick={logNote} variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button onClick={requestHelp} variant="outline" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Request Help
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function getAuthToken() {
  const { supabase } = await import("@/lib/supabase")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || ""
}
