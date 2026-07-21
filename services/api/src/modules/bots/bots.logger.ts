import { randomUUID } from 'crypto'
import { prismaAny } from '../../utils/prisma-helper'
import type { BotContext, BotExecutionTrace, BotId, BotStep } from './bots.types'

export const BOT_TRACE_QUEUE = 'bot-execution-traces'

export function newRequestId(): string {
  return randomUUID()
}

export function startStep(
  type: BotStep['type'],
  name: string,
  inputSummary?: string,
): { finish(outputSummary?: string, error?: string): BotStep } {
  const stepId = randomUUID()
  const start = Date.now()

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

function serializeTrace(trace: BotExecutionTrace): Record<string, unknown> {
  return {
    ...trace,
    startedAt: trace.startedAt.toISOString(),
    completedAt: trace.completedAt.toISOString(),
  }
}

function deserializeTrace(value: any): BotExecutionTrace {
  return {
    ...value,
    startedAt: new Date(value.startedAt),
    completedAt: new Date(value.completedAt),
  }
}

export function recordTrace(trace: BotExecutionTrace, ctx?: Partial<BotContext>): void {
  const failedStep = trace.steps.find(step => step.error)

  try {
    const write = prismaAny.jobQueue.upsert({
      where: {
        queueName_jobId: {
          queueName: BOT_TRACE_QUEUE,
          jobId: trace.requestId,
        },
      },
      create: {
        queueName: BOT_TRACE_QUEUE,
        jobId: trace.requestId,
        jobName: trace.botId,
        status: failedStep ? 'FAILED' : 'COMPLETED',
        data: {
          botId: trace.botId,
          userId: ctx?.userId,
          orgId: ctx?.orgId,
          sessionId: ctx?.sessionId,
        },
        result: serializeTrace(trace),
        error: failedStep?.error,
        attempts: 1,
        maxAttempts: 1,
        progress: 100,
        processedAt: trace.startedAt,
        completedAt: trace.completedAt,
        failedAt: failedStep ? trace.completedAt : undefined,
      },
      update: {
        status: failedStep ? 'FAILED' : 'COMPLETED',
        result: serializeTrace(trace),
        error: failedStep?.error,
        progress: 100,
        completedAt: trace.completedAt,
        failedAt: failedStep ? trace.completedAt : null,
      },
    })
    void write.catch((error: unknown) => {
      console.error('[bots.logger] Failed to persist trace:', error)
    })
  } catch (error) {
    console.error('[bots.logger] Failed to persist trace:', error)
  }

  console.log(JSON.stringify({
    level: 'info',
    event: 'bot.execution',
    botId: trace.botId,
    requestId: trace.requestId,
    durationMs: trace.durationMs,
    success: !failedStep,
    modelUsed: trace.modelUsed,
    inputTokens: trace.inputTokens,
    outputTokens: trace.outputTokens,
    costUSD: trace.cost?.estimatedUSD,
    deterministic: trace.deterministic,
  }))
}

export async function getRecentTraces(
  limit = 50,
  botId?: BotId,
): Promise<BotExecutionTrace[]> {
  const rows = await prismaAny.jobQueue.findMany({
    where: {
      queueName: BOT_TRACE_QUEUE,
      ...(botId ? { jobName: botId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { result: true },
  })

  return rows
    .filter((row: { result: unknown }) => row.result)
    .map((row: { result: unknown }) => deserializeTrace(row.result))
}

export async function getTrace(requestId: string): Promise<BotExecutionTrace | undefined> {
  const row = await prismaAny.jobQueue.findUnique({
    where: {
      queueName_jobId: {
        queueName: BOT_TRACE_QUEUE,
        jobId: requestId,
      },
    },
    select: { result: true },
  })

  return row?.result ? deserializeTrace(row.result) : undefined
}
