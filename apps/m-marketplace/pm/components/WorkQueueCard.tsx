import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "./badge"
import type { PMTask } from "@pm/lib/types"

export function WorkQueueCard({ task }: { task: PMTask }) {
  const due = task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : null

  return (
    <Link
      href={`/pm/work-queue/${task.id}`}
      className="block rounded-xl border bg-white p-4 hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold truncate">{task.title}</div>
          {task.description ? (
            <div className="mt-1 text-sm text-neutral-600 line-clamp-2">{task.description}</div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>Status: {task.status}</span>
            {due ? <span>• Due {due}</span> : null}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Badge priority={task.priority} />
        </div>
      </div>
    </Link>
  )
}

