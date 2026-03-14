/**
 * bots.logger.ts
 *
 * Execution trace store and structured logging for KeaBots.
 * - Keeps recent traces in memory (configurable ring buffer, 500 entries)
 * - Emits structured JSON to stdout so Railway log drains pick it up
 * - Exports helpers to build BotStep and BotExecutionTrace objects
 */

import { randomUUID } from 'crypto'
import type { BotExecutionTrace, BotStep, BotId } from './bots.types'

// ── In-memory ring buffer ─────────────────────────────────────────────────────

const MAX_TRACES = 500
const _traces: BotExecutionTrace[] = []

function store(trace: BotExecutionTrace): void {
  _traces.unshift(trace)
  if (_traces.length > MAX_TRACES) _traces.length = MAX_TRACES
}

// ── Public API ────────────────────────────────────────────────────────────────

export function newRequestId(): string {
  return randomUUID()
}

/** Create a pending step timer — call finish() to close it */
export function startStep(
  type: BotStep['type'],
  name: string,
  inputSummary?: string,
): { finish(outputSummary?: string, error?: string): BotStep } {
  const stepId = randomUUID()
  const start  = Date.now()

  return {
    finish(outputSummary?: string, error?: string): BotStep {
      return {
        stepId,
        type,
        name,
        inputSummary,
        outputSummary,
        durationMs: Date.now() - start,
        error,
      }
    },
  }
}

/** Finalise and store a trace. Also emits structured log. */
export function recordTrace(trace: BotExecutionTrace): void {
  store(trace)
  // Structured log — Railway / DataDog friendly
  console.log(JSON.stringify({
    level:       'info',
    event:       'bot.execution',
    botId:       trace.botId,
    requestId:   trace.requestId,
    durationMs:  trace.durationMs,
    success:     !trace.steps.some(s => s.error),
    modelUsed:   trace.modelUsed,
    inputTokens: trace.inputTokens,
    outputTokens: trace.outputTokens,
    costUSD:     trace.cost?.estimatedUSD,
    deterministic: trace.deterministic,
  }))
}

/** Get N most recent traces, optionally filtered by botId */
export function getRecentTraces(
  limit = 50,
  botId?: BotId,
): BotExecutionTrace[] {
  const filtered = botId ? _traces.filter(t => t.botId === botId) : _traces
  return filtered.slice(0, limit)
}

/** Get a single trace by requestId */
export function getTrace(requestId: string): BotExecutionTrace | undefined {
  return _traces.find(t => t.requestId === requestId)
}
