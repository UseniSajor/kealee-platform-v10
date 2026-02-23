'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  SkipForward,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@kealee/ui/card'
import { Button } from '@kealee/ui/button'
import { Badge, Progress } from '@kealee/ui'
import { api } from '@pm/lib/api-client'
import { useRequirePmAuth } from '@pm/lib/use-pm-auth'
import type { SOPExecution, SOPStepExecution, SOPPhaseExecution } from '@pm/lib/types'

// ── Helpers ──

function stepStatusIcon(status: SOPStepExecution['status']) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
    case 'SKIPPED':
      return <SkipForward className="h-5 w-5 text-amber-500 shrink-0" />
    case 'IN_PROGRESS':
      return <Loader2 className="h-5 w-5 text-primary-600 animate-spin shrink-0" />
    default:
      return <Circle className="h-5 w-5 text-neutral-300 shrink-0" />
  }
}

function statusBadgeVariant(status: SOPExecution['status']): 'success' | 'warning' | 'primary' | 'error' {
  const map: Record<SOPExecution['status'], 'success' | 'warning' | 'primary' | 'error'> = {
    IN_PROGRESS: 'primary',
    PAUSED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
  }
  return map[status] ?? 'default'
}

function statusLabel(status: SOPExecution['status']) {
  return status.replace('_', ' ')
}

// ── Phase Accordion ──

function PhaseSection({
  phase,
  stepExecutions,
  executionId,
  executionStatus,
  onStepComplete,
  onStepSkip,
}: {
  phase: SOPPhaseExecution
  stepExecutions: SOPStepExecution[]
  executionId: string
  executionStatus: SOPExecution['status']
  onStepComplete: (stepId: string, notes: string) => void
  onStepSkip: (stepId: string, reason: string) => void
}) {
  const [expanded, setExpanded] = React.useState(true)

  // Match step executions to this phase's steps
  const phaseStepExecs = phase.steps.map((step) => {
    const exec = stepExecutions.find((se) => se.stepId === step.step.id || se.step?.id === step.step.id)
    return exec ?? step
  })

  const completedCount = phaseStepExecs.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
  ).length
  const totalCount = phaseStepExecs.length
  const phaseProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card className="overflow-hidden">
      {/* Phase Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-neutral-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">
              Phase {phase.order}: {phase.name}
            </h3>
            {phaseProgress === 100 && (
              <Badge variant="success" size="sm">Complete</Badge>
            )}
          </div>
          {phase.description && (
            <p className="text-sm text-neutral-500 mt-0.5">{phase.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-medium">{completedCount}/{totalCount}</span>
          <Progress value={phaseProgress} variant={phaseProgress === 100 ? 'success' : 'primary'} size="sm" className="w-24 mt-1" />
        </div>
      </button>

      {/* Phase Conditions */}
      {expanded && (phase.entryCondition || phase.exitCondition) && (
        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-4 text-xs text-neutral-500">
          {phase.entryCondition && (
            <span><strong>Entry:</strong> {phase.entryCondition}</span>
          )}
          {phase.exitCondition && (
            <span><strong>Exit:</strong> {phase.exitCondition}</span>
          )}
        </div>
      )}

      {/* Steps */}
      {expanded && (
        <div className="mt-4 space-y-2">
          {phaseStepExecs.map((stepExec) => (
            <StepRow
              key={stepExec.step.id}
              stepExec={stepExec}
              executionId={executionId}
              executionStatus={executionStatus}
              onComplete={onStepComplete}
              onSkip={onStepSkip}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Step Row ──

function StepRow({
  stepExec,
  executionId,
  executionStatus,
  onComplete,
  onSkip,
}: {
  stepExec: SOPStepExecution
  executionId: string
  executionStatus: SOPExecution['status']
  onComplete: (stepId: string, notes: string) => void
  onSkip: (stepId: string, reason: string) => void
}) {
  const [showActions, setShowActions] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [skipReason, setSkipReason] = React.useState('')
  const [mode, setMode] = React.useState<'complete' | 'skip' | null>(null)

  const step = stepExec.step
  const isDone = stepExec.status === 'COMPLETED' || stepExec.status === 'SKIPPED'
  const canAct = executionStatus === 'IN_PROGRESS' && !isDone

  return (
    <div className={`rounded-lg border p-3 ${isDone ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-neutral-200'}`}>
      <div className="flex items-start gap-3">
        {stepStatusIcon(stepExec.status)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isDone ? 'text-neutral-500 line-through' : ''}`}>
              {step.name}
            </span>
            {step.mandatory && (
              <Badge variant="error" size="sm">Required</Badge>
            )}
            {step.estimatedMinutes && (
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {step.estimatedMinutes}m
              </span>
            )}
            {step.requiredIntegration && (
              <Badge variant="outline" size="sm">{step.requiredIntegration}</Badge>
            )}
          </div>

          {step.description && (
            <p className="text-xs text-neutral-500 mt-1">{step.description}</p>
          )}

          {/* Completion info */}
          {stepExec.status === 'COMPLETED' && stepExec.completedAt && (
            <p className="text-xs text-green-600 mt-1">
              Completed {new Date(stepExec.completedAt).toLocaleString()}
              {stepExec.notes && ` · ${stepExec.notes}`}
            </p>
          )}
          {stepExec.status === 'SKIPPED' && stepExec.skipReason && (
            <p className="text-xs text-amber-600 mt-1">
              Skipped: {stepExec.skipReason}
            </p>
          )}

          {/* Dependencies warning */}
          {step.dependencies && step.dependencies.length > 0 && !isDone && (
            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Depends on other steps
            </p>
          )}

          {/* Action panel */}
          {mode === 'complete' && (
            <div className="mt-2 space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Completion notes (optional)..."
                className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onComplete(step.id, notes)
                    setMode(null)
                    setNotes('')
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm Complete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {mode === 'skip' && (
            <div className="mt-2 space-y-2">
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Reason for skipping (required)..."
                className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!skipReason.trim()}
                  onClick={() => {
                    onSkip(step.id, skipReason)
                    setMode(null)
                    setSkipReason('')
                  }}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Confirm Skip
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMode(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Step action buttons */}
        {canAct && !mode && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              onClick={() => setMode('complete')}
              title="Complete step"
            >
              <Check className="h-4 w-4" />
            </Button>
            {!step.mandatory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode('skip')}
                title="Skip step"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──

export default function SOPExecutionDetailPage() {
  const { ready } = useRequirePmAuth()
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const executionId = params.executionId as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['sop-execution', executionId],
    queryFn: () => api.getSOPExecution(executionId),
    enabled: !!executionId,
    refetchInterval: 10000, // Poll every 10s for live updates
  })

  const completeMutation = useMutation({
    mutationFn: ({ stepId, notes }: { stepId: string; notes: string }) =>
      api.completeSOPStep(executionId, stepId, { notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-execution', executionId] })
    },
  })

  const skipMutation = useMutation({
    mutationFn: ({ stepId, reason }: { stepId: string; reason: string }) =>
      api.skipSOPStep(executionId, stepId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sop-execution', executionId] })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => api.pauseSOPExecution(executionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sop-execution', executionId] }),
  })

  const resumeMutation = useMutation({
    mutationFn: () => api.resumeSOPExecution(executionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sop-execution', executionId] }),
  })

  const execution = data?.execution

  if (!ready || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-sm text-neutral-600">Loading SOP execution...</span>
      </div>
    )
  }

  if (error || !execution) {
    return (
      <div className="text-center py-24">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-neutral-600">Failed to load SOP execution.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/pm/sop')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to SOP Tracker
        </Button>
      </div>
    )
  }

  const template = execution.template
  const phases: SOPPhaseExecution[] = template?.phases ?? []
  const stepExecutions = execution.stepExecutions ?? []
  const completedSteps = stepExecutions.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
  ).length
  const totalSteps = stepExecutions.length

  const handleComplete = (stepId: string, notes: string) => {
    completeMutation.mutate({ stepId, notes })
  }

  const handleSkip = (stepId: string, reason: string) => {
    skipMutation.mutate({ stepId, reason })
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/pm/sop">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to SOP Tracker
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{template?.name ?? 'SOP Execution'}</h1>
            {template?.description && (
              <p className="text-neutral-500 mt-1">{template.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={statusBadgeVariant(execution.status)} size="sm">
                {statusLabel(execution.status)}
              </Badge>
              <span className="text-sm text-neutral-500">
                Started {new Date(execution.startedAt).toLocaleDateString()}
              </span>
              {execution.completedAt && (
                <span className="text-sm text-green-600">
                  Completed {new Date(execution.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {execution.status === 'IN_PROGRESS' && (
              <Button
                variant="outline"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            {execution.status === 'PAUSED' && (
              <Button
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress Card */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="text-neutral-600">{completedSteps} / {totalSteps} steps &middot; {Math.round(execution.progress)}%</span>
            </div>
            <Progress
              value={execution.progress}
              variant={execution.status === 'COMPLETED' ? 'success' : 'primary'}
              size="lg"
            />
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-primary-700">{Math.round(execution.progress)}%</div>
            <div className="text-xs text-neutral-500">
              {phases.length} phases
            </div>
          </div>
        </div>
      </Card>

      {/* Mutation error feedback */}
      {(completeMutation.error || skipMutation.error) && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {(completeMutation.error as Error)?.message || (skipMutation.error as Error)?.message || 'Action failed'}
          </div>
        </Card>
      )}

      {/* Phase-by-Phase Breakdown */}
      <div className="space-y-4">
        {phases
          .sort((a, b) => a.order - b.order)
          .map((phase) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              stepExecutions={stepExecutions}
              executionId={executionId}
              executionStatus={execution.status}
              onStepComplete={handleComplete}
              onStepSkip={handleSkip}
            />
          ))}
      </div>

      {/* Completed state */}
      {execution.status === 'COMPLETED' && (
        <Card className="border-green-200 bg-green-50 text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800">SOP Completed</h3>
          <p className="text-sm text-green-600 mt-1">
            All steps have been completed or skipped. This execution is now closed.
          </p>
        </Card>
      )}
    </div>
  )
}
