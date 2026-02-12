"use client"

import * as React from "react"
import { useState } from "react"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  dueTime?: string
  estimatedEffort?: number
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface SwipeableTaskListProps {
  tasks: Task[]
  onTaskUpdate?: () => void
}

export function SwipeableTaskList({ tasks, onTaskUpdate }: SwipeableTaskListProps) {
  const [swipedTask, setSwipedTask] = useState<string | null>(null)

  const handleSwipe = async (taskId: string, direction: "left" | "right") => {
    setSwipedTask(taskId)

    if (direction === "right") {
      // Mark as complete via API
      try {
        const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'completed' }),
        })
        if (!res.ok) {
          console.error("Failed to complete task:", await res.text())
        } else {
          onTaskUpdate?.()
        }
      } catch (err) {
        console.error("Error completing task:", err)
      }
    } else {
      // Snooze: push due date forward by 1 day
      try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ dueDate: tomorrow.toISOString() }),
        })
        if (!res.ok) {
          console.error("Failed to snooze task:", await res.text())
        } else {
          onTaskUpdate?.()
        }
      } catch (err) {
        console.error("Error snoozing task:", err)
      }
    }

    // Reset after animation
    setTimeout(() => setSwipedTask(null), 300)
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return "border-red-500 bg-red-50"
      case "HIGH":
        return "border-orange-500 bg-orange-50"
      case "MEDIUM":
        return "border-yellow-500 bg-yellow-50"
      default:
        return "border-neutral-300 bg-neutral-50"
    }
  }

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "HIGH":
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-neutral-600" />
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <SwipeableTaskCard
          key={task.id}
          task={task}
          isSwiped={swipedTask === task.id}
          onSwipe={handleSwipe}
          priorityColor={getPriorityColor(task.priority)}
          priorityIcon={getPriorityIcon(task.priority)}
        />
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No priority tasks for today
        </div>
      )}
    </div>
  )
}

interface SwipeableTaskCardProps {
  task: Task
  isSwiped: boolean
  onSwipe: (taskId: string, direction: "left" | "right") => void
  priorityColor: string
  priorityIcon: React.ReactNode
}

function SwipeableTaskCard({
  task,
  isSwiped,
  onSwipe,
  priorityColor,
  priorityIcon,
}: SwipeableTaskCardProps) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const threshold = 100
    if (currentX > threshold) {
      onSwipe(task.id, "right") // Complete
    } else if (currentX < -threshold) {
      onSwipe(task.id, "left") // Snooze
    }

    setCurrentX(0)
    setIsDragging(false)
  }

  return (
    <div className="relative">
      {/* Action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <div className={`text-green-600 font-semibold ${currentX < -50 ? "opacity-100" : "opacity-0"} transition-opacity`}>
          Snooze
        </div>
        <div className={`text-blue-600 font-semibold ${currentX > 50 ? "opacity-100" : "opacity-0"} transition-opacity`}>
          Complete
        </div>
      </div>

      <Card
        className={`${priorityColor} border-l-4 transition-transform ${isSwiped ? "scale-95 opacity-50" : ""}`}
        style={{
          transform: `translateX(${currentX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{priorityIcon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
              {task.dueTime && (
                <p className="text-xs text-neutral-600">Due: {task.dueTime}</p>
              )}
              {task.estimatedEffort && (
                <p className="text-xs text-neutral-500">
                  Est: {task.estimatedEffort} min
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




