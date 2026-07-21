export type RunStatus =
  | 'queued' | 'planning' | 'running' | 'awaiting_input' | 'awaiting_approval'
  | 'retrying' | 'blocked' | 'complete' | 'partial' | 'failed' | 'cancelled'

export type StepStatus =
  | 'pending' | 'ready' | 'running' | 'awaiting_input' | 'awaiting_approval'
  | 'retrying' | 'complete' | 'skipped' | 'blocked' | 'failed' | 'cancelled'

export interface RuntimeBudget {
  tokenLimit?: number
  costLimitCents?: number
  timeLimitMs?: number
  maxSteps?: number
}

export interface GoalContract {
  id: string
  parentGoalId?: string
  objective: string
  successCriteria: CompletionCriterion[]
  constraints?: Record<string, unknown>
  budget?: RuntimeBudget
  authorityPolicy?: AuthorityPolicy
}

export interface AuthorityPolicy {
  allowedCapabilities?: string[]
  deniedCapabilities?: string[]
  professionalActionsRequireApproval?: boolean
}

export interface CompletionCriterion {
  key: string
  description: string
  required: boolean
  evidenceTypes?: string[]
}

export interface PlanStep {
  key: string
  title: string
  capability: string
  dependsOn: string[]
  input?: Record<string, unknown>
  completionCriteria?: CompletionCriterion[]
  requiresApproval?: boolean
  maxAttempts?: number
  required?: boolean
  retryBackoffMs?: number
  compensationCapability?: string
  professionalService?: boolean
}

export interface ExecutionPlan { version: number; steps: PlanStep[] }

export interface StepResult {
  status: 'complete' | 'awaiting_input' | 'awaiting_approval' | 'retryable_failure' | 'fatal_failure'
  output?: Record<string, unknown>
  evidence?: RuntimeEvidence[]
  message?: string
  tokensUsed?: number
  costCents?: number
}

export interface RuntimeEvidence {
  type: string
  sourceUri?: string
  contentHash?: string
  payload?: Record<string, unknown>
  confidence?: number
  validUntil?: string
}

export interface RuntimeEvent {
  type: string
  runId: string
  stepKey?: string
  payload: Record<string, unknown>
  at: string
  idempotencyKey?: string
}

export interface RuntimeSnapshot {
  runId: string
  goal: GoalContract
  status: RunStatus
  plan: ExecutionPlan
  steps: Record<string, { status: StepStatus; attempts: number; result?: StepResult }>
  tokensUsed: number
  costCents: number
  startedAt: string
  cancellationRequestedAt?: string
  deadLetterReason?: string
}

export interface RuntimeStore {
  createOrLoadRun(goal: GoalContract, idempotencyKey: string, plan: ExecutionPlan): Promise<RuntimeSnapshot>
  save(snapshot: RuntimeSnapshot): Promise<void>
  append(event: RuntimeEvent): Promise<void>
  hasEvent?(idempotencyKey: string): Promise<boolean>
  load?(runId: string): Promise<RuntimeSnapshot | null>
  cancel?(runId: string): Promise<void>
  upsertMemory?(memory: RuntimeMemory): Promise<void>
  findMemory?(query: RuntimeMemoryQuery): Promise<RuntimeMemory[]>
}

export interface RuntimeMemory {
  scope: 'run' | 'goal' | 'project' | 'intake' | 'agent' | 'tenant'
  key: string
  content: Record<string, unknown>
  projectId?: string
  intakeId?: string
  agentSlug?: string
  expiresAt?: string
}
export type RuntimeMemoryQuery = Partial<Pick<RuntimeMemory, 'scope' | 'key' | 'projectId' | 'intakeId' | 'agentSlug'>>

export interface CapabilityContext {
  runId: string
  goal: GoalContract
  step: PlanStep
  priorOutputs: Record<string, Record<string, unknown>>
}

export type CapabilityExecutor = (context: CapabilityContext) => Promise<StepResult>

export interface CapabilityDefinition {
  id: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  allowedTools: string[]
  authorityLevel: 'read' | 'prepare' | 'execute' | 'professional'
  requiredEvidence: string[]
  retryPolicy: { maxAttempts: number; backoffMs: number }
  approvalPolicy: 'none' | 'human' | 'professional'
  dataSensitivity: 'public' | 'internal' | 'customer' | 'restricted'
  modelPolicy: { primary?: string; fallbacks?: string[]; providerNeutral: boolean }
  tokenLimit?: number
  costLimitCents?: number
  timeoutMs: number
  professionalLimitations?: string[]
}

export interface ApprovalDecision { approved: boolean; decidedBy: string; comment?: string }
export type ApprovalResolver = (snapshot: RuntimeSnapshot, step: PlanStep) => Promise<ApprovalDecision | null>
