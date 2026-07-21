"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { api, type WorkloadStats } from "@pm/lib/api-client"
import { toast } from "sonner"

type BulkReassignProps = {
  taskIds: string[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function BulkReassign({ taskIds, onSuccess, onCancel }: BulkReassignProps) {
  const qc = useQueryClient()
  const [selectedPM, setSelectedPM] = React.useState<string>("")

  const { data: workloadData } = useQuery({
    queryKey: ["pm-workload"],
    queryFn: () => api.getWorkloadStats(),
  })

  const { data: pmsData } = useQuery({
    queryKey: ["available-pms"],
    queryFn: () => api.getAvailablePMs(),
  })

  const workloads = workloadData?.workloads || []
  const pms = pmsData?.users || []

  const bulkAssign = useMutation({
    mutationFn: (data: { taskIds: string[]; newAssigneeId: string }) => api.bulkAssignTasks(data),
    onSuccess: async (result) => {
      toast.success(`Reassigned ${result.updated} tasks`)
      await qc.invalidateQueries({ queryKey: ["pm-tasks"] })
      await qc.invalidateQueries({ queryKey: ["pm-workload"] })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reassign tasks")
    },
  })

  const handleReassign = () => {
    if (!selectedPM.trim()) {
      toast.error("Please select a PM")
      return
    }

    bulkAssign.mutate({
      taskIds,
      newAssigneeId: selectedPM.trim(),
    })
  }

  // Find best PM (lowest workload)
  const bestPM = workloads.length > 0 ? workloads[0] : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Reassign Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-neutral-600">
          Reassigning <span className="font-medium">{taskIds.length}</span> task{taskIds.length !== 1 ? "s" : ""}
        </div>

        {bestPM && (
          <div className="rounded-lg border bg-emerald-50 p-3">
            <div className="text-sm font-medium text-emerald-900">Suggested PM</div>
            <div className="text-sm text-emerald-700 mt-1">
              {bestPM.pmName} (Workload: {bestPM.workloadPercentage}%)
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Select PM</label>
          <select
            className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
            value={selectedPM}
            onChange={(e) => setSelectedPM(e.target.value)}
          >
            <option value="">Choose a PM...</option>
            {pms.map((pm: any) => {
              const workload = workloads.find((w) => w.pmId === pm.id)
              return (
                <option key={pm.id} value={pm.id}>
                  {pm.name} {workload ? `(${workload.workloadPercentage}% workload)` : ""}
                </option>
              )
            })}
          </select>
        </div>

        {workloads.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Workload Overview</div>
            <div className="space-y-2">
              {workloads.slice(0, 5).map((w: WorkloadStats) => (
                <div key={w.pmId} className="flex items-center justify-between text-sm">
                  <span>{w.pmName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-neutral-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          w.workloadPercentage < 50
                            ? "bg-emerald-500"
                            : w.workloadPercentage < 80
                              ? "bg-amber-500"
                              : "bg-red-500"
                        )}
                        style={{ width: `${w.workloadPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-600 w-12 text-right">
                      {w.workloadPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleReassign}
            disabled={!selectedPM.trim() || bulkAssign.isPending}
          >
            {bulkAssign.isPending ? "Reassigning..." : "Reassign Tasks"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
