"use client"

import * as React from "react"
import { CalendarClock, Download, FileText, Wand2 } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format, startOfWeek, endOfWeek } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { api } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function ReportsPage() {
  const [weekStart, setWeekStart] = React.useState(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 })
    return format(start, "yyyy-MM-dd")
  })

  const [weekEnd, setWeekEnd] = React.useState(() => {
    const end = endOfWeek(new Date(), { weekStartsOn: 0 })
    return format(end, "yyyy-MM-dd")
  })

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["pm-weekly-report", weekStart],
    queryFn: () => api.getWeeklyReport(weekStart),
    enabled: !!weekStart,
  })

  const generateReport = useMutation({
    mutationFn: () =>
      api.generateWeeklyReport({
        weekStart,
        weekEnd,
      }),
    onSuccess: (result) => {
      toast.success("Report generated successfully")
      if (result.pdfUrl) {
        window.open(result.pdfUrl, "_blank")
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate report")
    },
  })

  const report = reportData?.report

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-neutral-600 mt-1">Generate and view weekly PM reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => generateReport.mutate()}
            disabled={generateReport.isPending}
          >
            <Wand2 className="h-4 w-4" />
            {generateReport.isPending ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Report Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Week Start</label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Week End</label>
              <Input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-neutral-600">Loading report...</div>
          ) : report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">Total Tasks</div>
                  <div className="text-2xl font-bold mt-1">{report.summary?.totalTasks || 0}</div>
                </div>
                <div className="rounded-lg border bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">Completed</div>
                  <div className="text-2xl font-bold mt-1">{report.summary?.completedTasks || 0}</div>
                </div>
                <div className="rounded-lg border bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">Completion Rate</div>
                  <div className="text-2xl font-bold mt-1">{report.summary?.completionRate || 0}%</div>
                </div>
                <div className="rounded-lg border bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">Total Hours</div>
                  <div className="text-2xl font-bold mt-1">{report.summary?.totalHours || 0}</div>
                </div>
              </div>

              {report.clients && report.clients.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Client Breakdown</h3>
                  <div className="rounded-xl border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Client</th>
                          <th className="text-right px-4 py-2 font-medium">Requests</th>
                          <th className="text-right px-4 py-2 font-medium">Completed</th>
                          <th className="text-right px-4 py-2 font-medium">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.clients.map((client: any) => (
                          <tr key={client.orgId} className="border-t">
                            <td className="px-4 py-2">{client.orgName}</td>
                            <td className="text-right px-4 py-2">{client.requests}</td>
                            <td className="text-right px-4 py-2">{client.completed}</td>
                            <td className="text-right px-4 py-2">{client.hours.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.tasks && report.tasks.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tasks</h3>
                  <div className="rounded-xl border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Title</th>
                          <th className="text-left px-4 py-2 font-medium">Status</th>
                          <th className="text-left px-4 py-2 font-medium">Priority</th>
                          <th className="text-left px-4 py-2 font-medium">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tasks.slice(0, 10).map((task: any) => (
                          <tr key={task.id} className="border-t">
                            <td className="px-4 py-2">{task.title}</td>
                            <td className="px-4 py-2">
                              <span className="text-xs rounded-full border px-2 py-1 bg-neutral-50 text-neutral-700">
                                {task.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">{task.priority}</td>
                            <td className="px-4 py-2">
                              {task.completedAt ? format(new Date(task.completedAt), "MMM dd, yyyy") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => generateReport.mutate()}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-600">
              No report data available. Generate a report to view details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
