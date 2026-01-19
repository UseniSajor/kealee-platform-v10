"use client"

import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { api } from "@/lib/api-client"
import type { PMTask } from "@/lib/types"
import { Badge } from "@/components/badge"
import { toast } from "sonner"
import { useState } from "react"

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>()
  const router = useRouter()
  const taskId = params.taskId
  const qc = useQueryClient()

  const [comment, setComment] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<{
    title?: string
    description?: string
    priority?: string
    status?: string
    dueDate?: string
    assignedTo?: string
  }>({})

  const { data, isLoading } = useQuery({
    queryKey: ["pm-task", taskId],
    queryFn: () => api.getTask(taskId),
    enabled: !!taskId,
  })

  const { data: commentsData } = useQuery({
    queryKey: ["pm-task-comments", taskId],
    queryFn: () => api.getTaskComments(taskId),
    enabled: !!taskId,
  })

  const task = data?.task as PMTask | undefined
  const comments = commentsData?.comments || []

  const updateTask = useMutation({
    mutationFn: (data: typeof editData) => api.updateTask(taskId, data),
    onSuccess: async () => {
      toast.success("Task updated")
      setIsEditing(false)
      setEditData({})
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task")
    },
  })

  const complete = useMutation({
    mutationFn: () => api.completeTask(taskId, { completedAt: new Date().toISOString() }),
    onSuccess: async () => {
      toast.success("Task completed")
      await qc.invalidateQueries({ queryKey: ["pm-task", taskId] })
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete task")
    },
  })

  const addComment = useMutation({
    mutationFn: (message: string) => api.addTaskComment(taskId, { message }),
    onSuccess: async () => {
      toast.success("Comment added")
      setComment("")
      await qc.invalidateQueries({ queryKey: ["pm-task-comments", taskId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment")
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Task</h1>
          <p className="text-neutral-600 mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Task Not Found</h1>
          <p className="text-neutral-600 mt-1">The task you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/work-queue")} className="mt-4">
            Back to Work Queue
          </Button>
        </div>
      </div>
    )
  }

  const handleSave = () => {
    updateTask.mutate(editData)
  }

  const handleStartEdit = () => {
    setEditData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || "",
      assignedTo: task.assignedTo || "",
    })
    setIsEditing(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Details</h1>
          <p className="text-neutral-600 mt-1">Review and manage task details.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/work-queue")}>
          Back to Queue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isEditing ? "Edit Task" : task.title}</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editData.title || ""}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-1 min-h-[100px] w-full rounded-md border bg-white px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={editData.priority || ""}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={editData.status || ""}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={editData.dueDate ? editData.dueDate.split("T")[0] : ""}
                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <Input
                    value={editData.assignedTo || ""}
                    onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                    className="mt-1"
                    placeholder="PM ID"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateTask.isPending}>
                  {updateTask.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-600">Priority:</span>{" "}
                  <Badge priority={task.priority} />
                </div>
                <div>
                  <span className="font-medium text-neutral-600">Status:</span>{" "}
                  <span className="text-xs rounded-full border px-2 py-1 bg-neutral-50 text-neutral-700">
                    {task.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-neutral-600">Due Date:</span>{" "}
                  {task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : "—"}
                </div>
                <div>
                  <span className="font-medium text-neutral-600">Assigned To:</span> {task.assignedTo || "—"}
                </div>
                <div>
                  <span className="font-medium text-neutral-600">Created:</span>{" "}
                  {task.createdAt ? format(new Date(task.createdAt), "MMM dd, yyyy") : "—"}
                </div>
                {task.completedAt && (
                  <div>
                    <span className="font-medium text-neutral-600">Completed:</span>{" "}
                    {format(new Date(task.completedAt), "MMM dd, yyyy")}
                  </div>
                )}
              </div>
              {task.description && (
                <div>
                  <span className="text-sm font-medium text-neutral-600">Description:</span>
                  <p className="mt-1 text-sm text-neutral-900">{task.description}</p>
                </div>
              )}
              {task.status !== "completed" && (
                <div>
                  <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
                    {complete.isPending ? "Completing..." : "Mark Complete"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {comments.length > 0 ? (
              comments.map((c: any) => (
                <div key={c.id} className="rounded-lg border bg-neutral-50 p-3">
                  <div className="text-xs text-neutral-600">
                    {c.userId} • {c.createdAt ? format(new Date(c.createdAt), "MMM dd, yyyy HH:mm") : ""}
                  </div>
                  <div className="mt-1 text-sm text-neutral-900">{c.message}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-600">No comments yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="flex-1 min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm"
            />
            <Button
              onClick={() => addComment.mutate(comment)}
              disabled={!comment.trim() || addComment.isPending}
            >
              {addComment.isPending ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
