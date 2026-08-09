import { randomUUID } from 'crypto'
import { createQueue, KEALEE_QUEUES, type BotJobData, type ChainJobData } from '@kealee/queue'
import { prismaAny } from '../../utils/prisma-helper'
import type { BotContext, BotId, BotInput } from './bots.types'

const botQueue = createQueue(KEALEE_QUEUES.BOT_JOBS)
const chainQueue = createQueue(KEALEE_QUEUES.CHAIN_JOBS)
export const ragIngestQueue = createQueue(KEALEE_QUEUES.RAG_INGEST)

async function persistWaitingJob(
  queueName: string,
  jobId: string,
  jobName: string,
  data: Record<string, unknown>,
): Promise<void> {
  await prismaAny.jobQueue.upsert({
    where: { queueName_jobId: { queueName, jobId } },
    create: {
      queueName,
      jobId,
      jobName,
      status: 'WAITING',
      data,
      maxAttempts: 3,
    },
    update: {
      status: 'WAITING',
      data,
      error: null,
      progress: 0,
    },
  })
}

async function markEnqueueFailed(queueName: string, jobId: string, error: unknown): Promise<void> {
  await prismaAny.jobQueue.update({
    where: { queueName_jobId: { queueName, jobId } },
    data: {
      status: 'FAILED',
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date(),
    },
  }).catch(() => undefined)
}

export async function enqueueBotJob(
  botId: BotId,
  input: BotInput<Record<string, unknown>>,
  context: Omit<BotContext, 'botId' | 'requestId'>,
): Promise<{ jobId: string; requestId: string }> {
  const requestId = randomUUID()
  const payload: BotJobData = {
    requestId,
    botId,
    input,
    context,
    timeoutMs: 60_000,
  }
  await persistWaitingJob(
    KEALEE_QUEUES.BOT_JOBS,
    requestId,
    botId,
    payload as unknown as Record<string, unknown>,
  )
  try {
    const job = await botQueue.add('execute-bot', payload, { jobId: requestId })
    return { jobId: String(job.id), requestId }
  } catch (error) {
    await markEnqueueFailed(KEALEE_QUEUES.BOT_JOBS, requestId, error)
    throw error
  }
}

export async function enqueueChainJob(
  input: Record<string, unknown>,
  context: { userId?: string; orgId?: string },
): Promise<{ jobId: string; requestId: string }> {
  const requestId = randomUUID()
  const payload: ChainJobData = { requestId, input, context, timeoutMs: 180_000 }
  await persistWaitingJob(
    KEALEE_QUEUES.CHAIN_JOBS,
    requestId,
    'design-estimate-permit-chain',
    payload as unknown as Record<string, unknown>,
  )
  try {
    const job = await chainQueue.add('execute-chain', payload, { jobId: requestId })
    return { jobId: String(job.id), requestId }
  } catch (error) {
    await markEnqueueFailed(KEALEE_QUEUES.CHAIN_JOBS, requestId, error)
    throw error
  }
}

export async function getBotJob(jobId: string): Promise<Record<string, unknown> | null> {
  const row = await prismaAny.jobQueue.findFirst({
    where: {
      jobId,
      queueName: { in: [KEALEE_QUEUES.BOT_JOBS, KEALEE_QUEUES.CHAIN_JOBS] },
    },
  })
  if (!row) return null
  return {
    jobId: row.jobId,
    queueName: row.queueName,
    status: row.status,
    progress: row.progress,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    result: row.result,
    error: row.error,
    createdAt: row.createdAt,
    processedAt: row.processedAt,
    completedAt: row.completedAt,
    failedAt: row.failedAt,
  }
}
