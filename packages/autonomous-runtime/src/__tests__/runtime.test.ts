import { describe, expect, it, vi } from 'vitest'
import { AutonomousRuntime } from '../runtime'
import { InMemoryRuntimeStore } from '../memory-store'
import type { ExecutionPlan, GoalContract } from '../types'

const goal: GoalContract = {
  id: 'goal-1', objective: 'Deliver a homeowner-ready feasibility package',
  successCriteria: [{ key: 'package', description: 'Package persisted', required: true, evidenceTypes: ['deliverable'] }],
  budget: { maxSteps: 5, tokenLimit: 10_000, costLimitCents: 1000 },
}

const plan: ExecutionPlan = { version: 1, steps: [
  { key: 'intake', title: 'Validate intake', capability: 'intake.validate', dependsOn: [] },
  { key: 'deliver', title: 'Assemble package', capability: 'package.assemble', dependsOn: ['intake'], completionCriteria: goal.successCriteria },
] }

describe('AutonomousRuntime', () => {
  it('executes dependencies and requires evidence for completion', async () => {
    const store = new InMemoryRuntimeStore()
    const runtime = new AutonomousRuntime({ store, capabilities: {
      'intake.validate': vi.fn(async () => ({ status: 'complete', output: { valid: true } })),
      'package.assemble': vi.fn(async context => ({ status: 'complete', output: { prior: context.priorOutputs }, evidence: [{ type: 'deliverable', contentHash: 'sha256:test' }] })),
    } })
    const result = await runtime.start(goal, plan, 'checkout:cs_test')
    expect(result.status).toBe('complete')
    expect(result.steps.intake.status).toBe('complete')
    expect(result.steps.deliver.status).toBe('complete')
  })

  it('is idempotent and retries transient failures', async () => {
    const store = new InMemoryRuntimeStore()
    let calls = 0
    const runtime = new AutonomousRuntime({ store, capabilities: {
      'intake.validate': async () => (++calls === 1 ? { status: 'retryable_failure' } : { status: 'complete' }),
      'package.assemble': async () => ({ status: 'complete', evidence: [{ type: 'deliverable' }] }),
    } })
    const first = await runtime.start(goal, plan, 'same-key')
    const second = await runtime.start(goal, plan, 'same-key')
    expect(first.runId).toBe(second.runId)
    expect(calls).toBe(2)
  })

  it('pauses at human approval gates', async () => {
    const store = new InMemoryRuntimeStore()
    const gated: ExecutionPlan = { version: 1, steps: [{ key: 'permit', title: 'Authorize filing', capability: 'permit.file', dependsOn: [], requiresApproval: true }] }
    const runtime = new AutonomousRuntime({ store, capabilities: { 'permit.file': async () => ({ status: 'complete' }) }, approvals: async () => null })
    const result = await runtime.start({ ...goal, successCriteria: [] }, gated, 'approval-key')
    expect(result.status).toBe('awaiting_approval')
    expect(result.steps.permit.status).toBe('awaiting_approval')
  })

  it('rejects dependency cycles', async () => {
    const cyclic: ExecutionPlan = { version: 1, steps: [
      { key: 'a', title: 'A', capability: 'a', dependsOn: ['b'] },
      { key: 'b', title: 'B', capability: 'b', dependsOn: ['a'] },
    ] }
    const runtime = new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: async () => ({ status: 'complete' }), b: async () => ({ status: 'complete' }) } })
    await expect(runtime.start({ ...goal, successCriteria: [] }, cyclic, 'cycle')).rejects.toThrow('dependency cycle')
  })

  it('durably blocks missing capabilities', async () => {
    const runtime = new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: {} })
    const result = await runtime.start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'x', title: 'X', capability: 'missing', dependsOn: [] }] }, 'missing')
    expect(result.status).toBe('blocked')
  })

  it('stops when a step budget is exhausted', async () => {
    const runtime = new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: async () => ({ status: 'retryable_failure' }) } })
    const result = await runtime.start({ ...goal, successCriteria: [], budget: { maxSteps: 1 } }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [], maxAttempts: 3 }] }, 'budget')
    expect(result.status).toBe('blocked')
  })

  it('does not retry fatal failures', async () => {
    const executor = vi.fn(async () => ({ status: 'fatal_failure' as const }))
    const result = await new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: executor } }).start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [] }] }, 'fatal')
    expect(result.status).toBe('failed'); expect(executor).toHaveBeenCalledTimes(1)
  })

  it('fails after retry exhaustion', async () => {
    const executor = vi.fn(async () => ({ status: 'retryable_failure' as const }))
    const result = await new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: executor } }).start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [], maxAttempts: 2 }] }, 'retry-exhausted')
    expect(result.status).toBe('failed'); expect(executor).toHaveBeenCalledTimes(2)
  })

  it('cancels a persisted run', async () => {
    const store = new InMemoryRuntimeStore()
    const runtime = new AutonomousRuntime({ store, capabilities: { a: async () => ({ status: 'awaiting_input' }) } })
    const started = await runtime.start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [] }] }, 'cancel')
    const result = await runtime.cancel(started.runId)
    expect(result?.status).toBe('cancelled')
  })

  it('resumes after approval', async () => {
    let approved = false
    const store = new InMemoryRuntimeStore()
    const runtime = new AutonomousRuntime({ store, capabilities: { a: async () => ({ status: 'complete' }) }, approvals: async () => approved ? { approved: true, decidedBy: 'reviewer' } : null })
    const first = await runtime.start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [], requiresApproval: true }] }, 'resume-approval')
    approved = true
    const result = await runtime.resume((await store.load(first.runId))!)
    expect(result.status).toBe('complete')
  })

  it('resumes after customer input', async () => {
    const store = new InMemoryRuntimeStore(); let calls = 0
    const runtime = new AutonomousRuntime({ store, capabilities: { a: async context => ++calls === 1 ? { status: 'awaiting_input' } : { status: 'complete', output: context.step.input } } })
    const first = await runtime.start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [] }] }, 'resume-input')
    const result = await runtime.provideInput(first.runId, 'a', { answer: 42 })
    expect(result.status).toBe('complete'); expect(result.steps.a.result?.output).toEqual({ answer: 42 })
  })

  it('preserves parent goal identity and duplicate start idempotency', async () => {
    const store = new InMemoryRuntimeStore()
    const runtime = new AutonomousRuntime({ store, capabilities: { a: async () => ({ status: 'complete' }) } })
    const child = { ...goal, parentGoalId: 'parent-1', successCriteria: [] }
    const one = await runtime.start(child, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [] }] }, 'duplicate')
    const two = await runtime.start(child, one.plan, 'duplicate')
    expect(two.runId).toBe(one.runId); expect(two.goal.parentGoalId).toBe('parent-1')
  })

  it('reports partial completion for an optional failed step', async () => {
    const runtime = new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { ok: async () => ({ status: 'complete', evidence: [{ type: 'deliverable' }] }), optional: async () => ({ status: 'fatal_failure' }) } })
    const result = await runtime.start(goal, { version: 1, steps: [
      { key: 'ok', title: 'Required', capability: 'ok', dependsOn: [], completionCriteria: goal.successCriteria },
      { key: 'optional', title: 'Optional', capability: 'optional', dependsOn: ['ok'], required: false },
    ] }, 'partial')
    expect(result.status).toBe('partial')
  })

  it('rejects expired evidence', async () => {
    const runtime = new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: async () => ({ status: 'complete', evidence: [{ type: 'deliverable', validUntil: '2020-01-01T00:00:00Z' }] }) }, now: () => new Date('2026-01-01T00:00:00Z') })
    const result = await runtime.start(goal, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [], completionCriteria: goal.successCriteria }] }, 'expired')
    expect(result.status).toBe('failed')
  })

  it('fails over to a secondary provider', async () => {
    const primary = vi.fn(async () => ({ status: 'retryable_failure' as const }))
    const fallback = vi.fn(async () => ({ status: 'complete' as const }))
    const result = await new AutonomousRuntime({ store: new InMemoryRuntimeStore(), capabilities: { a: [primary, fallback] } }).start({ ...goal, successCriteria: [] }, { version: 1, steps: [{ key: 'a', title: 'A', capability: 'a', dependsOn: [] }] }, 'failover')
    expect(result.status).toBe('complete'); expect(fallback).toHaveBeenCalledOnce()
  })

  it('upserts scoped memory and omits expired entries', async () => {
    const store = new InMemoryRuntimeStore()
    await store.upsertMemory({ scope: 'project', key: 'brief', projectId: 'p1', content: { v: 1 } })
    await store.upsertMemory({ scope: 'project', key: 'old', projectId: 'p1', content: {}, expiresAt: '2020-01-01T00:00:00Z' })
    expect(await store.findMemory({ scope: 'project', projectId: 'p1' })).toHaveLength(1)
  })
})
