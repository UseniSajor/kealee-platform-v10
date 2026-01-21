"use client"

import * as React from "react"
import { Play, Pause, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Button } from "@kealee/ui/button"
import type { PMDashboard } from "@/lib/types"

const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds
const SHORT_BREAK = 5 * 60 // 5 minutes
const LONG_BREAK = 15 * 60 // 15 minutes

type TimerState = "idle" | "running" | "paused" | "completed" | "break"

interface PomodoroTimerProps {
  currentTask?: PMDashboard["priorityTasks"][0]
  onTaskComplete?: (taskId: string) => void
  onTaskSwitch?: () => void
}

export function PomodoroTimer({ currentTask, onTaskComplete, onTaskSwitch }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState(POMODORO_DURATION)
  const [state, setState] = React.useState<TimerState>("idle")
  const [completedPomodoros, setCompletedPomodoros] = React.useState(0)
  const [isBreak, setIsBreak] = React.useState(false)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (state === "running" && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state, timeLeft])

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!isBreak) {
      // Pomodoro completed
      setCompletedPomodoros((prev) => prev + 1)
      setState("completed")

      // Auto-switch to break after 4 pomodoros
      if ((completedPomodoros + 1) % 4 === 0) {
        setIsBreak(true)
        setTimeLeft(LONG_BREAK)
      } else {
        setIsBreak(true)
        setTimeLeft(SHORT_BREAK)
      }

      // Auto-complete task if it matches estimated effort
      if (currentTask && onTaskComplete) {
        const estimatedMinutes = currentTask.estimatedEffort
        // If we've done enough pomodoros to cover the task
        if ((completedPomodoros + 1) * 25 >= estimatedMinutes) {
          setTimeout(() => {
            onTaskComplete(currentTask.id)
          }, 2000)
        }
      }
    } else {
      // Break completed - auto-switch to next task
      setIsBreak(false)
      setTimeLeft(POMODORO_DURATION)
      setState("idle")
      if (onTaskSwitch) {
        onTaskSwitch()
      }
    }
  }

  const startTimer = () => {
    setState("running")
  }

  const pauseTimer = () => {
    setState("paused")
  }

  const resetTimer = () => {
    setState("idle")
    setIsBreak(false)
    setTimeLeft(POMODORO_DURATION)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((POMODORO_DURATION - timeLeft) / POMODORO_DURATION) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pomodoro Timer</CardTitle>
          {currentTask && (
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span>Working on:</span>
              <span className="font-medium">{currentTask.title}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-6">
          <div
            className={`text-6xl font-bold mb-2 ${
              isBreak ? "text-emerald-600" : "text-blue-600"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-neutral-500">
            {isBreak
              ? completedPomodoros % 4 === 0
                ? "Long Break"
                : "Short Break"
              : "Focus Time"}
          </div>

          {/* Progress Ring */}
          <div className="relative w-32 h-32 mt-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-neutral-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                className={isBreak ? "text-emerald-600" : "text-blue-600"}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {state === "running" ? (
            <Button onClick={pauseTimer} variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button onClick={startTimer} variant="default" size="sm" disabled={state === "completed"}>
              <Play className="h-4 w-4 mr-2" />
              {state === "completed" ? "Completed" : "Start"}
            </Button>
          )}
          <Button onClick={resetTimer} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedPomodoros}</div>
            <div className="text-xs text-neutral-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.floor(completedPomodoros / 4)}</div>
            <div className="text-xs text-neutral-500">Long Breaks</div>
          </div>
        </div>

        {/* Auto-switch notification */}
        {state === "completed" && !isBreak && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Pomodoro completed! Starting break...</span>
          </div>
        )}

        {state === "completed" && isBreak && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
            <AlertCircle className="h-4 w-4" />
            <span>Break complete! Ready for next task.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

