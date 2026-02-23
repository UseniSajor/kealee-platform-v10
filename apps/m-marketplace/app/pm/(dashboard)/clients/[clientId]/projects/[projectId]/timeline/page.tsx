"use client"

import * as React from "react"

import { TimelineView, type TimelineTask } from "@pm/components/pm/projects/TimelineView"

export default function ProjectTimelinePage({
  params,
}: {
  params: { clientId: string; projectId: string }
}) {
  const { clientId, projectId } = params

  const initialTasks = React.useMemo<TimelineTask[]>(
    () => [
      {
        id: "t1",
        name: "Kickoff & requirements",
        start: "2026-01-06",
        end: "2026-01-10",
        baselineStart: "2026-01-06",
        baselineEnd: "2026-01-09",
      },
      {
        id: "t2",
        name: "Permits submission",
        start: "2026-01-10",
        end: "2026-01-16",
        baselineStart: "2026-01-09",
        baselineEnd: "2026-01-15",
        dependencies: ["t1"],
      },
      {
        id: "t3",
        name: "Procurement (long lead)",
        start: "2026-01-12",
        end: "2026-01-26",
        baselineStart: "2026-01-12",
        baselineEnd: "2026-01-24",
        dependencies: ["t1"],
      },
      {
        id: "t4",
        name: "Site prep",
        start: "2026-01-17",
        end: "2026-01-20",
        baselineStart: "2026-01-16",
        baselineEnd: "2026-01-19",
        dependencies: ["t2"],
      },
      {
        id: "t5",
        name: "Framing",
        start: "2026-01-21",
        end: "2026-02-02",
        baselineStart: "2026-01-20",
        baselineEnd: "2026-01-31",
        dependencies: ["t4", "t3"],
      },
      {
        id: "t6",
        name: "Rough inspection (milestone)",
        start: "2026-02-03",
        end: "2026-02-03",
        baselineStart: "2026-02-01",
        baselineEnd: "2026-02-01",
        dependencies: ["t5"],
        isMilestone: true,
      },
      {
        id: "t7",
        name: "Drywall & finishes",
        start: "2026-02-04",
        end: "2026-02-14",
        baselineStart: "2026-02-02",
        baselineEnd: "2026-02-12",
        dependencies: ["t6"],
      },
      {
        id: "t8",
        name: "Final inspection (milestone)",
        start: "2026-02-18",
        end: "2026-02-18",
        baselineStart: "2026-02-16",
        baselineEnd: "2026-02-16",
        dependencies: ["t7"],
        isMilestone: true,
      },
    ],
    []
  )

  const [tasks, setTasks] = React.useState<TimelineTask[]>(initialTasks)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <TimelineView tasks={tasks} onTasksChange={setTasks} />
    </div>
  )
}

