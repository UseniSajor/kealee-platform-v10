import { createWorker, KEALEE_QUEUES, type BotJobData, type ChainJobData } from '@kealee/queue'
import { prisma } from '@kealee/database'
import type { Job, Worker } from 'bullmq'

const db = prisma as any

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error(`Bot job timed out after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
}

async function markActive(queueName: string, job: Job): Promise<void> {
  await db.jobQueue.update({
    where: { queueName_jobId: { queueName, jobId: String(job.id) } },
    data: {
      status: 'ACTIVE',
      attempts: job.attemptsMade + 1,
      progress: 10,
      processedAt: new Date(),
    },
  })
}

async function markCompleted(queueName: string, job: Job, result: unknown): Promise<void> {
  await db.jobQueue.update({
    where: { queueName_jobId: { queueName, jobId: String(job.id) } },
    data: {
      status: 'COMPLETED',
      result,
      progress: 100,
      completedAt: new Date(),
      error: null,
    },
  })
}

export async function persistFailedBotJob(
  queueName: string,
  job: Job | undefined,
  error: Error,
): Promise<void> {
  if (!job?.id) return
  await db.jobQueue.update({
    where: { queueName_jobId: { queueName, jobId: String(job.id) } },
    data: {
      status: 'FAILED',
      attempts: job.attemptsMade,
      error: error.message,
      failedAt: new Date(),
    },
  }).catch(() => undefined)
}

function loadApiModule(modulePath: string): any {
  try {
    return require(`@kealee/api/dist/modules/bots/${modulePath}`)
  } catch {
    // Development fallback when worker runs through tsx before API build.
    return require(`../../../api/src/modules/bots/${modulePath}`)
  }
}

export function createBotJobsWorker(): Worker {
  const worker = createWorker(
    KEALEE_QUEUES.BOT_JOBS,
    job => processBotJob(job as Job<BotJobData>),
    Number(process.env.BOT_WORKER_CONCURRENCY ?? 5),
  )
  worker.on('failed', (job, error) => void persistFailedBotJob(KEALEE_QUEUES.BOT_JOBS, job, error))
  return worker
}

export function createChainJobsWorker(): Worker {
  const worker = createWorker(
    KEALEE_QUEUES.CHAIN_JOBS,
    job => processChainJob(job as Job<ChainJobData>),
    Number(process.env.CHAIN_WORKER_CONCURRENCY ?? 2),
  )
  worker.on('failed', (job, error) => void persistFailedBotJob(KEALEE_QUEUES.CHAIN_JOBS, job, error))
  return worker
}

export async function processBotJob(
  job: Job<BotJobData>,
  loader: (modulePath: string) => any = loadApiModule,
): Promise<unknown> {
  await markActive(KEALEE_QUEUES.BOT_JOBS, job)
  const { botRegistry } = loader('bots.registry')
  const bot = botRegistry.get(job.data.botId)
  if (!bot) throw new Error(`Unknown System C bot: ${job.data.botId}`)

  const result = await withTimeout(
    bot.execute(job.data.input, {
      botId: job.data.botId,
      requestId: job.data.requestId,
      ...job.data.context,
    }),
    job.data.timeoutMs ?? 60_000,
  )
  const { persistBotConversation } = loader('bots.conversations')
  await persistBotConversation(job.data.input.data, result, {
    botId: job.data.botId,
    requestId: job.data.requestId,
    ...job.data.context,
  })
  await markCompleted(KEALEE_QUEUES.BOT_JOBS, job, result)
  return result
}

export async function processChainJob(
  job: Job<ChainJobData>,
  loader: (modulePath: string) => any = loadApiModule,
): Promise<unknown> {
  await markActive(KEALEE_QUEUES.CHAIN_JOBS, job)
  const { runChain } = loader('bots.chain')
  const result = await withTimeout(
    runChain({ ...job.data.input, ...job.data.context }),
    job.data.timeoutMs ?? 180_000,
  )
  await markCompleted(KEALEE_QUEUES.CHAIN_JOBS, job, result)
  return result
}
