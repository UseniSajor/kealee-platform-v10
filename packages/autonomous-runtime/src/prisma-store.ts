import { prisma as defaultPrisma } from '@kealee/database'
import type {
  ExecutionPlan, GoalContract, RuntimeEvent, RuntimeEvidence, RuntimeMemory,
  RuntimeMemoryQuery, RuntimeSnapshot, RuntimeStore, StepResult,
} from './types'

type DatabaseClient = typeof defaultPrisma

const RUN_TO_DB: Record<RuntimeSnapshot['status'], string> = {
  queued: 'QUEUED', planning: 'PLANNING', running: 'RUNNING', awaiting_input: 'AWAITING_INPUT',
  awaiting_approval: 'AWAITING_APPROVAL', retrying: 'RETRYING', blocked: 'BLOCKED', complete: 'COMPLETE',
  partial: 'PARTIAL', failed: 'FAILED', cancelled: 'CANCELLED',
}
const STEP_TO_DB: Record<string, string> = {
  pending: 'PENDING', ready: 'READY', running: 'RUNNING', awaiting_input: 'AWAITING_INPUT',
  awaiting_approval: 'AWAITING_APPROVAL', retrying: 'RETRYING', complete: 'COMPLETE', skipped: 'SKIPPED',
  blocked: 'BLOCKED', failed: 'FAILED', cancelled: 'CANCELLED',
}
const fromRunStatus = (status: string) => status.toLowerCase() as RuntimeSnapshot['status']
const fromStepStatus = (status: string) => status.toLowerCase() as RuntimeSnapshot['steps'][string]['status']

/** Prisma-backed durable ledger. All mutations are intended for trusted server workers. */
export class PrismaRuntimeStore implements RuntimeStore {
  constructor(private readonly db: DatabaseClient = defaultPrisma) {}

  async createOrLoadRun(goal: GoalContract, idempotencyKey: string, plan: ExecutionPlan): Promise<RuntimeSnapshot> {
    const existing = await this.db.autonomousRun.findUnique({ where: { idempotencyKey }, include: { goal: true, steps: { orderBy: { sequence: 'asc' } } } })
    if (existing) return this.toSnapshot(existing)
    try {
      const created = await this.db.$transaction(async (tx: any) => {
        await tx.autonomousGoal.upsert({
          where: { id: goal.id },
          update: {},
          create: {
            id: goal.id, parentGoalId: goal.parentGoalId, objective: goal.objective,
            successCriteria: goal.successCriteria as any, constraints: goal.constraints as any,
            tokenBudget: goal.budget?.tokenLimit, costBudgetCents: goal.budget?.costLimitCents,
            timeBudgetMs: goal.budget?.timeLimitMs, status: 'ACTIVE',
          },
        })
        return tx.autonomousRun.create({
          data: {
            goalId: goal.id, idempotencyKey, status: 'QUEUED', plan: plan as any,
            context: { authorityPolicy: goal.authorityPolicy ?? null } as any,
            steps: { create: plan.steps.map((step, sequence) => ({
              stepKey: step.key, sequence, capability: step.capability, title: step.title,
              dependsOn: step.dependsOn, input: step.input as any,
              completionCriteria: step.completionCriteria as any,
              retryPolicy: { maxAttempts: step.maxAttempts ?? 3, backoffMs: step.retryBackoffMs ?? 0 } as any,
              approvalPolicy: step.requiresApproval ? { required: true } as any : undefined,
              maxAttempts: step.maxAttempts ?? 3,
            })) },
          },
          include: { goal: true, steps: { orderBy: { sequence: 'asc' } } },
        })
      })
      return this.toSnapshot(created)
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'P2002') throw error
      const raced = await this.db.autonomousRun.findUniqueOrThrow({ where: { idempotencyKey }, include: { goal: true, steps: { orderBy: { sequence: 'asc' } } } })
      return this.toSnapshot(raced)
    }
  }

  async save(snapshot: RuntimeSnapshot): Promise<void> {
    await this.db.$transaction(async (tx: any) => {
      await tx.autonomousRun.update({ where: { id: snapshot.runId }, data: {
        status: RUN_TO_DB[snapshot.status] as any, plan: snapshot.plan as any,
        tokensUsed: snapshot.tokensUsed, costCents: snapshot.costCents,
        startedAt: new Date(snapshot.startedAt), completedAt: ['complete','partial','failed','cancelled'].includes(snapshot.status) ? new Date() : undefined,
      } })
      for (const [stepKey, state] of Object.entries(snapshot.steps)) {
        await tx.autonomousStep.update({ where: { runId_stepKey: { runId: snapshot.runId, stepKey } }, data: {
          status: STEP_TO_DB[state.status] as any, attempt: state.attempts,
          output: state.result?.output as any, tokensUsed: state.result?.tokensUsed ?? 0,
          costCents: state.result?.costCents ?? 0, errorMessage: state.result?.message,
          completedAt: ['complete','failed','cancelled','skipped'].includes(state.status) ? new Date() : undefined,
        } })
      }
    })
  }

  async load(runId: string): Promise<RuntimeSnapshot | null> {
    const run = await this.db.autonomousRun.findUnique({ where: { id: runId }, include: { goal: true, steps: { orderBy: { sequence: 'asc' } } } })
    return run ? this.toSnapshot(run) : null
  }

  async append(event: RuntimeEvent): Promise<void> {
    if (event.idempotencyKey && await this.hasEvent(event.idempotencyKey)) return
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await this.db.$transaction(async (tx: any) => {
          const last = await tx.autonomousEvent.findFirst({ where: { runId: event.runId }, orderBy: { sequence: 'desc' }, select: { sequence: true } })
          await tx.autonomousEvent.create({ data: { runId: event.runId, sequence: (last?.sequence ?? 0) + 1, idempotencyKey: event.idempotencyKey, eventType: event.type, actorType: 'runtime', payload: event.payload as any, createdAt: new Date(event.at) } })
        })
        return
      } catch (error: unknown) {
        if ((error as { code?: string }).code !== 'P2002' || attempt === 3) throw error
      }
    }
  }

  async hasEvent(idempotencyKey: string): Promise<boolean> {
    return Boolean(await this.db.autonomousEvent.findUnique({ where: { idempotencyKey }, select: { id: true } }))
  }

  async cancel(runId: string): Promise<void> {
    await this.db.autonomousRun.updateMany({ where: { id: runId, status: { notIn: ['COMPLETE','FAILED','CANCELLED'] } }, data: { status: 'CANCELLED', completedAt: new Date(), leaseOwner: null, leaseExpiresAt: null } })
  }

  /** Atomically leases one runnable run. updateMany is the compare-and-swap. */
  async claimRun(runId: string, workerId: string, leaseMs: number, now = new Date()): Promise<boolean> {
    const result = await this.db.autonomousRun.updateMany({ where: {
      id: runId, status: { in: ['QUEUED','RETRYING','RUNNING'] },
      OR: [{ leaseOwner: null }, { leaseExpiresAt: { lt: now } }, { leaseOwner: workerId }],
    }, data: { status: 'RUNNING', leaseOwner: workerId, heartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + leaseMs), startedAt: now } })
    return result.count === 1
  }

  async heartbeat(runId: string, workerId: string, leaseMs: number, now = new Date()): Promise<boolean> {
    const result = await this.db.autonomousRun.updateMany({ where: { id: runId, leaseOwner: workerId, leaseExpiresAt: { gte: now } }, data: { heartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + leaseMs) } })
    return result.count === 1
  }

  async reclaimExpiredLeases(now = new Date()): Promise<number> {
    const result = await this.db.autonomousRun.updateMany({ where: { status: 'RUNNING', leaseExpiresAt: { lt: now } }, data: { status: 'QUEUED', leaseOwner: null, leaseExpiresAt: null } })
    return result.count
  }

  /** Atomically transitions a single step; only one competing worker can win. */
  async claimStep(runId: string, stepKey: string, now = new Date()): Promise<boolean> {
    const result = await this.db.autonomousStep.updateMany({ where: { runId, stepKey, status: { in: ['PENDING','READY','RETRYING'] }, availableAt: { lte: now } }, data: { status: 'RUNNING', startedAt: now, attempt: { increment: 1 } } })
    return result.count === 1
  }

  async recordInvocation(input: { stepId: string; idempotencyKey: string; toolName: string; payload?: Record<string, unknown> }) {
    return this.db.autonomousToolInvocation.upsert({ where: { idempotencyKey: input.idempotencyKey }, update: {}, create: { stepId: input.stepId, idempotencyKey: input.idempotencyKey, toolName: input.toolName, input: input.payload as any } })
  }

  async completeInvocation(idempotencyKey: string, result: StepResult, durationMs: number) {
    return this.db.autonomousToolInvocation.update({ where: { idempotencyKey }, data: {
      status: result.status === 'complete' ? 'SUCCEEDED' : result.status === 'retryable_failure' ? 'RETRYABLE_FAILURE' : 'FATAL_FAILURE',
      output: result.output as any, errorMessage: result.message, durationMs, tokensUsed: result.tokensUsed ?? 0,
      costCents: result.costCents ?? 0, completedAt: new Date(),
    } })
  }

  async persistEvidence(runId: string, stepId: string | undefined, evidence: RuntimeEvidence[]) {
    if (!evidence.length) return
    await this.db.autonomousEvidence.createMany({ data: evidence.map(item => ({ runId, stepId, evidenceType: item.type, sourceUri: item.sourceUri, contentHash: item.contentHash, payload: item.payload as any, confidence: item.confidence, validUntil: item.validUntil ? new Date(item.validUntil) : undefined, verifiedAt: new Date() })) })
  }

  async upsertMemory(memory: RuntimeMemory): Promise<void> {
    await this.db.$transaction(async (tx: any) => {
      const existing = await tx.autonomousMemory.findFirst({ where: { scope: memory.scope, memoryKey: memory.key, projectId: memory.projectId ?? null, intakeId: memory.intakeId ?? null, agentSlug: memory.agentSlug ?? null } })
      const data = { content: memory.content as any, expiresAt: memory.expiresAt ? new Date(memory.expiresAt) : null }
      if (existing) await tx.autonomousMemory.update({ where: { id: existing.id }, data })
      else await tx.autonomousMemory.create({ data: { scope: memory.scope, memoryKey: memory.key, projectId: memory.projectId, intakeId: memory.intakeId, agentSlug: memory.agentSlug, ...data } })
    })
  }

  async findMemory(query: RuntimeMemoryQuery): Promise<RuntimeMemory[]> {
    const rows = await this.db.autonomousMemory.findMany({ where: { scope: query.scope, memoryKey: query.key, projectId: query.projectId, intakeId: query.intakeId, agentSlug: query.agentSlug, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }] })
    return rows.map((row: any) => ({ scope: row.scope as RuntimeMemory['scope'], key: row.memoryKey, content: row.content as Record<string, unknown>, projectId: row.projectId ?? undefined, intakeId: row.intakeId ?? undefined, agentSlug: row.agentSlug ?? undefined, expiresAt: row.expiresAt?.toISOString() }))
  }

  private toSnapshot(run: any): RuntimeSnapshot {
    const goal: GoalContract = {
      id: run.goal.id, parentGoalId: run.goal.parentGoalId ?? undefined, objective: run.goal.objective,
      successCriteria: run.goal.successCriteria as GoalContract['successCriteria'], constraints: run.goal.constraints ?? undefined,
      budget: { tokenLimit: run.goal.tokenBudget ?? undefined, costLimitCents: run.goal.costBudgetCents ?? undefined, timeLimitMs: run.goal.timeBudgetMs ?? undefined },
      authorityPolicy: run.context?.authorityPolicy ?? undefined,
    }
    return {
      runId: run.id, goal, status: fromRunStatus(run.status), plan: run.plan as ExecutionPlan,
      steps: Object.fromEntries(run.steps.map((step: any) => [step.stepKey, { status: fromStepStatus(step.status), attempts: step.attempt, result: step.output || step.errorMessage ? { status: step.status === 'COMPLETE' ? 'complete' : 'fatal_failure', output: step.output ?? undefined, message: step.errorMessage ?? undefined, tokensUsed: step.tokensUsed, costCents: step.costCents } : undefined }])),
      tokensUsed: run.tokensUsed, costCents: run.costCents, startedAt: (run.startedAt ?? run.createdAt).toISOString(),
      cancellationRequestedAt: run.status === 'CANCELLED' ? (run.completedAt ?? run.updatedAt).toISOString() : undefined,
    }
  }
}
