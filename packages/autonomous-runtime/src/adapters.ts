import type { CapabilityExecutor, StepResult } from './types'

export interface ExistingBotAdapterOptions {
  execute: (input: {
    capability: string
    projectId?: string
    intakeId?: string
    payload: Record<string, unknown>
  }) => Promise<{ output: Record<string, unknown>; evidence?: StepResult['evidence']; tokensUsed?: number; costCents?: number }>
}

/** Adapts a Kealee V30 bot or existing domain agent into the canonical runtime. */
export function existingBotCapability(options: ExistingBotAdapterOptions): CapabilityExecutor {
  return async context => {
    const constraints = context.goal.constraints ?? {}
    const result = await options.execute({
      capability: context.step.capability,
      projectId: typeof constraints.projectId === 'string' ? constraints.projectId : undefined,
      intakeId: typeof constraints.intakeId === 'string' ? constraints.intakeId : undefined,
      payload: { ...context.step.input, priorOutputs: context.priorOutputs },
    })
    return {
      status: 'complete', output: result.output, evidence: result.evidence,
      tokensUsed: result.tokensUsed, costCents: result.costCents,
    }
  }
}

export interface ClawWorkerAdapterOptions {
  enqueue: (job: {
    idempotencyKey: string
    capability: string
    payload: Record<string, unknown>
  }) => Promise<{ jobId: string; accepted: boolean }>
}

/** Adapts a durable Claw/queue worker; completion is resumed by its job event. */
export function clawWorkerCapability(options: ClawWorkerAdapterOptions): CapabilityExecutor {
  return async context => {
    const job = await options.enqueue({
      idempotencyKey: `${context.runId}:${context.step.key}`,
      capability: context.step.capability,
      payload: { ...context.step.input, priorOutputs: context.priorOutputs },
    })
    return job.accepted
      ? { status: 'awaiting_input', output: { externalJobId: job.jobId } }
      : { status: 'retryable_failure', message: 'Worker did not accept the job' }
  }
}
