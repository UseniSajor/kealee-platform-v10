"use client"

import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { api } from "@/lib/api-client"
import type { PMTask } from "@/lib/types"

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>()
  const taskId = params.taskId
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ["pm-task", taskId],
    queryFn: () => api.getTask(taskId),
  })

  const task = data?.task as PMTask | undefined

  const complete = useMutation({
    mutationFn: () => api.completeTask(taskId, { completedAt: new Date().toISOString() }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task</h1>
        <p className="text-neutral-600 mt-1">Review details and mark complete.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{task?.title || "Loading..."}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-neutral-600">{task?.description || "—"}</div>
          <div className="text-sm">
            <span className="font-medium">Priority:</span> {task?.priority || "—"}
          </div>
          <div className="text-sm">
            <span className="font-medium">Status:</span> {task?.status || "—"}
          </div>

          <div className="pt-2">
            <Button onClick={() => complete.mutate()} disabled={complete.isPending || task?.status === "completed"}>
              {task?.status === "completed"
                ? "Completed"
                : complete.isPending
                  ? "Completing..."
                  : "Mark complete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

