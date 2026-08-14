import type { ExecutionPlan, GoalContract, RuntimeEvent, RuntimeMemory, RuntimeMemoryQuery, RuntimeSnapshot, RuntimeStore } from './types'

export class InMemoryRuntimeStore implements RuntimeStore {
  readonly runs = new Map<string, RuntimeSnapshot>()
  readonly events: RuntimeEvent[] = []
  private readonly idempotency = new Map<string, string>()
  readonly memories = new Map<string, RuntimeMemory>()

  async createOrLoadRun(goal: GoalContract, idempotencyKey: string, plan: ExecutionPlan): Promise<RuntimeSnapshot> {
    const existingId = this.idempotency.get(idempotencyKey)
    if (existingId) return structuredClone(this.runs.get(existingId)!)
    const runId = `run_${this.runs.size + 1}`
    const snapshot: RuntimeSnapshot = {
      runId, goal, plan, status: 'queued', tokensUsed: 0, costCents: 0,
      startedAt: new Date().toISOString(),
      steps: Object.fromEntries(plan.steps.map(step => [step.key, { status: 'pending', attempts: 0 }])),
    }
    this.idempotency.set(idempotencyKey, runId)
    this.runs.set(runId, structuredClone(snapshot))
    return snapshot
  }

  async save(snapshot: RuntimeSnapshot): Promise<void> { this.runs.set(snapshot.runId, structuredClone(snapshot)) }
  async append(event: RuntimeEvent): Promise<void> {
    if (event.idempotencyKey && await this.hasEvent(event.idempotencyKey)) return
    this.events.push(structuredClone(event))
  }
  async hasEvent(idempotencyKey: string): Promise<boolean> { return this.events.some(event => event.idempotencyKey === idempotencyKey) }
  async load(runId: string): Promise<RuntimeSnapshot | null> { return structuredClone(this.runs.get(runId) ?? null) }
  async cancel(runId: string): Promise<void> {
    const run = this.runs.get(runId)
    if (run) run.cancellationRequestedAt = new Date().toISOString()
  }
  async upsertMemory(memory: RuntimeMemory): Promise<void> {
    this.memories.set([memory.scope, memory.key, memory.projectId, memory.intakeId, memory.agentSlug].join(':'), structuredClone(memory))
  }
  async findMemory(query: RuntimeMemoryQuery): Promise<RuntimeMemory[]> {
    return [...this.memories.values()].filter(memory =>
      Object.entries(query).every(([key, value]) => value == null || memory[key as keyof RuntimeMemory] === value) &&
      (!memory.expiresAt || Date.parse(memory.expiresAt) > Date.now()),
    ).map(memory => structuredClone(memory))
  }
}
