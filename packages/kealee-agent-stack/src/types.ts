export type AgentOpsMode = 'dry-run' | 'live'

export type ReadinessArea =
  | 'build-types'
  | 'website-funnel'
  | 'sales-copy'
  | 'trust-compliance'
  | 'agent-ops'

export type FindingSeverity = 'blocker' | 'high' | 'medium' | 'low'

export interface AgentRunRequest {
  name: string
  goal: string
  mode?: AgentOpsMode
  agents?: string[]
  metadata?: Record<string, unknown>
}

export interface AgentRunStep {
  agent: string
  area?: ReadinessArea
  status: 'planned' | 'running' | 'completed' | 'failed'
  summary: string
  startedAt?: string
  completedAt?: string
}

export interface ReadinessFinding {
  id: string
  area: ReadinessArea
  severity: FindingSeverity
  title: string
  evidence: string
  recommendation: string
  owner: string
  acceptanceCriteria: string
}

export interface AgentRunResult {
  id: string
  name: string
  goal: string
  mode: AgentOpsMode
  status: 'completed' | 'failed'
  startedAt: string
  completedAt: string
  steps: AgentRunStep[]
  findings: ReadinessFinding[]
  score: number
  markdownPath?: string
  jsonPath?: string
  metadata?: Record<string, unknown>
}

export interface HermesTask {
  id: string
  name: string
  goal: string
  agents: string[]
  mode: AgentOpsMode
  metadata?: Record<string, unknown>
}

export interface OrgoAction {
  type: 'open-url' | 'screenshot' | 'inspect' | 'smoke-flow'
  target: string
  metadata?: Record<string, unknown>
}

export interface OrgoActionResult {
  action: OrgoAction
  ok: boolean
  summary: string
  artifactUrl?: string
}

export interface KeaBotDescriptor {
  name: string
  displayName?: string
  stage?: string
  domain?: string
  version?: string
}
