import { assertBudget, criteriaSatisfied, goalSatisfied, RuntimePolicyError } from './policy'
import type {
  ApprovalResolver, CapabilityExecutor, ExecutionPlan, GoalContract, PlanStep,
  CapabilityDefinition, RuntimeEvent, RuntimeSnapshot, RuntimeStore, StepResult,
} from './types'

export interface AutonomousRuntimeOptions {
  store: RuntimeStore
  capabilities: Record<string, CapabilityExecutor | CapabilityExecutor[]>
  definitions?: Record<string, CapabilityDefinition>
  approvals?: ApprovalResolver
  now?: () => Date
}

export class AutonomousRuntime {
  private readonly now: () => Date
  constructor(private readonly options: AutonomousRuntimeOptions) {
    this.now = options.now ?? (() => new Date())
  }

  async start(goal: GoalContract, plan: ExecutionPlan, idempotencyKey: string): Promise<RuntimeSnapshot> {
    const denied = new Set(goal.authorityPolicy?.deniedCapabilities ?? [])
    const allowed = goal.authorityPolicy?.allowedCapabilities
    for (const step of plan.steps) {
      if (denied.has(step.capability) || (allowed && !allowed.includes(step.capability))) {
        throw new RuntimePolicyError('CAPABILITY_NOT_AUTHORIZED', `${step.capability} is outside goal authority`)
      }
    }
    this.validatePlan(plan)
    const snapshot = await this.options.store.createOrLoadRun(goal, idempotencyKey, plan)
    return this.resume(snapshot)
  }

  async resume(snapshot: RuntimeSnapshot): Promise<RuntimeSnapshot> {
    if (['complete', 'failed', 'cancelled'].includes(snapshot.status)) return snapshot
    snapshot.status = 'running'
    await this.emit(snapshot, 'run.started', {})

    try {
      for (;;) {
        const persisted = await this.options.store.load?.(snapshot.runId)
        if (persisted?.cancellationRequestedAt || snapshot.cancellationRequestedAt) {
          snapshot.status = 'cancelled'
          snapshot.cancellationRequestedAt = persisted?.cancellationRequestedAt ?? snapshot.cancellationRequestedAt
          for (const state of Object.values(snapshot.steps)) if (!['complete', 'failed'].includes(state.status)) state.status = 'cancelled'
          await this.emit(snapshot, 'run.cancelled', {})
          await this.options.store.save(snapshot)
          return snapshot
        }
        assertBudget(snapshot)
        const next = this.nextReadyStep(snapshot)
        if (!next) break
        const state = snapshot.steps[next.key]

        if (next.requiresApproval) {
          const decision = await this.options.approvals?.(snapshot, next)
          if (!decision) {
            state.status = 'awaiting_approval'
            snapshot.status = 'awaiting_approval'
            await this.emit(snapshot, 'step.awaiting_approval', {}, next.key)
            await this.options.store.save(snapshot)
            return snapshot
          }
          if (!decision.approved) {
            state.status = 'blocked'
            snapshot.status = 'blocked'
            await this.emit(snapshot, 'step.approval_rejected', { decidedBy: decision.decidedBy }, next.key)
            await this.options.store.save(snapshot)
            return snapshot
          }
        }

        const executor = this.options.capabilities[next.capability]
        if (!executor) {
          state.status = 'blocked'
          snapshot.status = 'blocked'
          await this.emit(snapshot, 'step.capability_missing', { capability: next.capability }, next.key)
          await this.options.store.save(snapshot)
          return snapshot
        }

        state.status = 'running'
        state.attempts += 1
        await this.emit(snapshot, 'step.started', { attempt: state.attempts }, next.key)
        const result = await this.execute(Array.isArray(executor) ? executor : [executor], snapshot, next)
        state.result = result
        snapshot.tokensUsed += result.tokensUsed ?? 0
        snapshot.costCents += result.costCents ?? 0

        if (result.status === 'complete' && criteriaSatisfied(next.completionCriteria ?? [], result, this.now())) {
          state.status = 'complete'
          await this.emit(snapshot, 'step.completed', { evidenceCount: result.evidence?.length ?? 0 }, next.key)
        } else if (result.status === 'awaiting_input') {
          state.status = 'awaiting_input'
          snapshot.status = 'awaiting_input'
          await this.options.store.save(snapshot)
          return snapshot
        } else if (result.status === 'awaiting_approval') {
          state.status = 'awaiting_approval'
          snapshot.status = 'awaiting_approval'
          await this.options.store.save(snapshot)
          return snapshot
        } else if (result.status === 'retryable_failure' && state.attempts < (next.maxAttempts ?? 3)) {
          state.status = 'retrying'
          await this.emit(snapshot, 'step.retrying', { message: result.message ?? '' }, next.key)
        } else if (next.required === false) {
          state.status = 'failed'
          await this.emit(snapshot, 'step.optional_failed', { message: result.message ?? '' }, next.key)
        } else {
          state.status = 'failed'
          snapshot.status = 'failed'
          await this.emit(snapshot, 'step.failed', { message: result.message ?? 'Completion criteria not met' }, next.key)
          await this.options.store.save(snapshot)
          return snapshot
        }
        await this.options.store.save(snapshot)
      }

      const allTerminal = Object.values(snapshot.steps).every(step =>
        ['complete', 'skipped', 'failed', 'cancelled'].includes(step.status),
      )
      const hasFailures = Object.values(snapshot.steps).some(step => step.status === 'failed')
      snapshot.status = goalSatisfied(snapshot, this.now()) ? (hasFailures ? 'partial' : 'complete') : allTerminal ? 'partial' : 'blocked'
      await this.emit(snapshot, `run.${snapshot.status}`, {})
      await this.options.store.save(snapshot)
      return snapshot
    } catch (error) {
      snapshot.status = error instanceof RuntimePolicyError ? 'blocked' : 'failed'
      await this.emit(snapshot, 'run.error', {
        code: error instanceof RuntimePolicyError ? error.code : 'UNHANDLED_ERROR',
        message: error instanceof Error ? error.message : String(error),
      })
      await this.options.store.save(snapshot)
      return snapshot
    }
  }

  private async execute(executors: CapabilityExecutor[], snapshot: RuntimeSnapshot, step: PlanStep): Promise<StepResult> {
    let last: StepResult = { status: 'retryable_failure', message: 'No provider succeeded' }
    for (let index = 0; index < executors.length; index++) try {
      const priorOutputs = Object.fromEntries(Object.entries(snapshot.steps)
        .filter(([, value]) => value.result?.output)
        .map(([key, value]) => [key, value.result!.output!]))
      const result = await executors[index]({ runId: snapshot.runId, goal: snapshot.goal, step, priorOutputs })
      last = result
      if (result.status !== 'retryable_failure') return result
      await this.emit(snapshot, 'provider.failed_over', { capability: step.capability, providerIndex: index }, step.key)
    } catch (error) {
      last = { status: 'retryable_failure', message: error instanceof Error ? error.message : String(error) }
    }
    return last
  }

  private nextReadyStep(snapshot: RuntimeSnapshot): PlanStep | undefined {
    return snapshot.plan.steps.find(step => {
      const state = snapshot.steps[step.key]
      if (!['pending', 'ready', 'retrying'].includes(state.status)) return false
      return step.dependsOn.every(key => snapshot.steps[key]?.status === 'complete')
    })
  }

  private validatePlan(plan: ExecutionPlan): void {
    const keys = new Set(plan.steps.map(step => step.key))
    if (keys.size !== plan.steps.length) throw new Error('Plan step keys must be unique')
    for (const step of plan.steps) {
      if (this.options.definitions && !this.options.definitions[step.capability]) throw new Error(`Capability ${step.capability} is not registered`)
      const authority = this.options.definitions?.[step.capability]?.authorityLevel
      if (authority === 'professional' && !step.requiresApproval) throw new Error(`Professional capability ${step.capability} requires approval`)
      for (const dependency of step.dependsOn) {
        if (!keys.has(dependency)) throw new Error(`Unknown dependency ${dependency} for ${step.key}`)
      }
    }
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (key: string) => {
      if (visiting.has(key)) throw new Error(`Plan contains a dependency cycle at ${key}`)
      if (visited.has(key)) return
      visiting.add(key)
      plan.steps.find(step => step.key === key)!.dependsOn.forEach(visit)
      visiting.delete(key); visited.add(key)
    }
    plan.steps.forEach(step => visit(step.key))
    const maxSteps = plan.steps.length
    if (maxSteps > 0 && this.options && plan.steps.some(step => !this.options.capabilities[step.capability])) {
      // Missing executors are reported as a durable blocked state at runtime.
    }
  }

  async cancel(runId: string): Promise<RuntimeSnapshot | null> {
    await this.options.store.cancel?.(runId)
    const snapshot = await this.options.store.load?.(runId)
    return snapshot ? this.resume(snapshot) : null
  }

  async provideInput(runId: string, stepKey: string, input: Record<string, unknown>): Promise<RuntimeSnapshot> {
    const snapshot = await this.options.store.load?.(runId)
    if (!snapshot) throw new Error('Run not found')
    const step = snapshot.plan.steps.find(item => item.key === stepKey)
    if (!step || snapshot.steps[stepKey].status !== 'awaiting_input') throw new Error('Step is not awaiting input')
    step.input = { ...step.input, ...input }
    snapshot.steps[stepKey].status = 'ready'
    snapshot.status = 'running'
    await this.emit(snapshot, 'step.input_received', {}, stepKey)
    await this.options.store.save(snapshot)
    return this.resume(snapshot)
  }

  private async emit(snapshot: RuntimeSnapshot, type: string, payload: Record<string, unknown>, stepKey?: string) {
    const event: RuntimeEvent = { type, runId: snapshot.runId, stepKey, payload, at: this.now().toISOString() }
    await this.options.store.append(event)
  }
}
