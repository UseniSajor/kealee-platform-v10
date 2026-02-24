'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardCheck,
  Play,
  Pause,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@kealee/ui/card'
import { Button } from '@kealee/ui/button'
import { Badge, Progress } from '@kealee/ui'
import { api } from '@pm/lib/api-client'
import { useRequirePmAuth } from '@pm/lib/use-pm-auth'
import type { SOPExecution, SOPTemplate } from '@pm/lib/types'

// â”€â”€ Helpers â”€â”€

function statusBadge(status: SOPExecution['status']) {
  const map: Record<SOPExecution['status'], { label: string; variant: 'success' | 'warning' | 'primary' | 'error' }> = {
    IN_PROGRESS: { label: 'In Progress', variant: 'primary' },
    PAUSED: { label: 'Paused', variant: 'warning' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'error' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={variant} size="sm">{label}</Badge>
}

// â”€â”€ Main Page â”€â”€

export default function SOPTrackerPage() {
  const { ready } = useRequirePmAuth()
  const queryClient = useQueryClient()
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('')
  const [showStartDialog, setShowStartDialog] = React.useState(false)

  // Fetch user's projects from clients data
  const { data: clientsResp } = useQuery({
    queryKey: ['pm-clients'],
    queryFn: () => api.getMyClients(),
  })

  // Fetch SOP executions for selected project
  const { data: execResp, isLoading: execLoading } = useQuery({
    queryKey: ['sop-executions', selectedProjectId],
    queryFn: () => api.getSOPExecutions(selectedProjectId),
    enabled: !!selectedProjectId,
  })

  // Fetch available SOP templates
  const { data: templatesResp } = useQuery({
    queryKey: ['sop-templates'],
    queryFn: () => api.getSOPTemplates(),
    enabled: showStartDialog,
  })

  // Start new execution
  const startMutation = useMutation({
    mutationFn: ({ templateId, projectId }: { templateId: string; projectId: string }) =>
      api.startSOPExecution(templateId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-executions', selectedProjectId] })
      setShowStartDialog(false)
    },
  })

  // Seed templates
  const seedMutation = useMutation({
    mutationFn: () => api.seedSOPTemplates(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-templates'] })
    },
  })

  // Pause / Resume
  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseSOPExecution(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sop-executions', selectedProjectId] }),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeSOPExecution(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sop-executions', selectedProjectId] }),
  })

  const executions = execResp?.executions ?? []
  const templates = templatesResp?.templates ?? []

  if (!ready) {
    return <div className="text-sm text-neutral-600">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-primary-600" />
            SOP Tracker
          </h1>
          <p className="text-neutral-600 mt-1">Execute and track Standard Operating Procedures for your projects.</p>
        </div>
        {selectedProjectId && (
          <Button
            onClick={() => setShowStartDialog(true)}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start New SOP
          </Button>
        )}
      </div>

      {/* Project Selector */}
      <Card>
        <div className="flex items-center gap-4">
          <label htmlFor="project-select" className="text-sm font-medium text-neutral-700 whitespace-nowrap">
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Choose a project...</option>
            {(clientsResp?.clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.activeProjects} projects)
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Start SOP Dialog */}
      {showStartDialog && (
        <Card className="border-primary-200 bg-primary-50/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Start New SOP Execution</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowStartDialog(false)}>
                Cancel
              </Button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-sm text-neutral-600">No active SOP templates found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                >
                  {seedMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Seeding...</>
                  ) : (
                    'Seed Default Templates'
                  )}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <Card
                    key={tpl.id}
                    variant="interactive"
                    className="cursor-pointer"
                    onClick={() => startMutation.mutate({ templateId: tpl.id, projectId: selectedProjectId })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{tpl.name}</p>
                        <p className="text-xs text-neutral-500">{tpl.projectType} &middot; v{tpl.version}</p>
                      </div>
                      <Play className="h-4 w-4 text-primary-600" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No project selected */}
      {!selectedProjectId && (
        <Card className="text-center py-12">
          <ClipboardCheck className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">Select a project to view SOP executions</p>
        </Card>
      )}

      {/* Loading */}
      {selectedProjectId && execLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-neutral-600">Loading executions...</span>
        </div>
      )}

      {/* Executions List */}
      {selectedProjectId && !execLoading && executions.length === 0 && (
        <Card className="text-center py-12">
          <ClipboardCheck className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 mb-4">No SOP executions for this project yet.</p>
          <Button onClick={() => setShowStartDialog(true)} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Start First SOP
          </Button>
        </Card>
      )}

      {selectedProjectId && !execLoading && executions.length > 0 && (
        <div className="space-y-4">
          {executions.map((exec) => {
            const completedSteps = exec.stepExecutions?.filter(
              (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
            ).length ?? 0
            const totalSteps = exec.stepExecutions?.length ?? 0

            return (
              <Card key={exec.id} hover>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/pm/sop/${exec.id}`}
                        className="text-lg font-semibold hover:text-primary-600 truncate"
                      >
                        {exec.template?.name ?? 'SOP Execution'}
                      </Link>
                      {statusBadge(exec.status)}
                    </div>
                    <p className="text-sm text-neutral-500">
                      Started {new Date(exec.startedAt).toLocaleDateString()}
                      {exec.completedAt && ` Â· Completed ${new Date(exec.completedAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-full lg:w-48 space-y-1">
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>{completedSteps} / {totalSteps} steps</span>
                      <span>{Math.round(exec.progress)}%</span>
                    </div>
                    <Progress
                      value={exec.progress}
                      variant={exec.status === 'COMPLETED' ? 'success' : 'primary'}
                      size="sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {exec.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pauseMutation.mutate(exec.id)}
                        disabled={pauseMutation.isPending}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {exec.status === 'PAUSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeMutation.mutate(exec.id)}
                        disabled={resumeMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/pm/sop/${exec.id}`}>
                        Open <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

