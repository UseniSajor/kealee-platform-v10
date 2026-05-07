/**
 * In-memory execution trace store shared across bot API routes.
 * Resets on server restart — suitable for admin tooling.
 */

export interface TraceStep {
  stepId:         string
  type:           'llm' | 'rule'
  name:           string
  inputSummary?:  string
  outputSummary?: string
  durationMs:     number
  error?:         string
}

export interface ExecutionTrace {
  requestId:     string
  botId:         string
  startedAt:     string
  completedAt:   string
  durationMs:    number
  modelUsed?:    string
  inputTokens?:  number
  outputTokens?: number
  deterministic: boolean
  steps:         TraceStep[]
  cost?:         { estimatedUSD: number }
}

const traces: ExecutionTrace[] = []

export const executionStore = {
  add(trace: ExecutionTrace) {
    traces.push(trace)
    // Keep last 200
    if (traces.length > 200) traces.splice(0, traces.length - 200)
  },
  getAll(): ExecutionTrace[] {
    return [...traces]
  },
}
