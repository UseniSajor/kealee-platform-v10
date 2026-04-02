/**
 * services/api/src/modules/rag/rag-nightly-job.ts
 *
 * BullMQ job that runs nightly to re-index all documents into the RAG store.
 * Schedule: 2:00 AM ET daily.
 */

import { Queue, Worker, Job } from 'bullmq'
import { runFullIngestion } from './rag-ingester.js'

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) {
  console.warn('[RAG] REDIS_URL not set — nightly RAG job will not run')
}

const connection = REDIS_URL
  ? (() => {
      const url = new URL(REDIS_URL)
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
      }
    })()
  : null

export const ragIngestionQueue = connection
  ? new Queue('rag-ingestion', { connection })
  : null

/**
 * Register the nightly cron job (call once at API boot)
 */
export function scheduleRagNightlyJob(): void {
  if (!ragIngestionQueue) {
    console.warn('[RAG] Skipping nightly job scheduling — no Redis connection')
    return
  }

  // Schedule nightly at 2am ET (cron: 0 7 * * * UTC)
  ragIngestionQueue.add(
    'nightly-full-ingest',
    { triggeredBy: 'cron' },
    {
      repeat: { pattern: '0 7 * * *' },
      jobId: 'rag-nightly-job',
      removeOnComplete: { count: 7 },
      removeOnFail: { count: 30 },
    }
  ).then(() => {
    console.log('[RAG] Nightly ingestion job scheduled (2am ET)')
  }).catch(err => {
    console.warn('[RAG] Could not schedule nightly job:', err.message)
  })
}

/**
 * Start the RAG ingestion worker (call once at API boot)
 */
export function startRagIngestionWorker(): Worker | null {
  if (!connection) return null

  const worker = new Worker(
    'rag-ingestion',
    async (job: Job) => {
      console.log(`[RAG] Starting ingestion job: ${job.name}`)
      const result = await runFullIngestion()
      console.log(
        `[RAG] Ingestion complete: ${result.succeeded}/${result.total} succeeded, ` +
        `${result.failed} failed, ${result.durationMs}ms`
      )
      if (result.errors.length > 0) {
        console.error('[RAG] Errors:', result.errors.slice(0, 5))
      }
      return result
    },
    { connection }
  )

  worker.on('failed', (job, err) => {
    console.error(`[RAG] Job ${job?.name} failed: ${err.message}`)
  })

  console.log('[RAG] Ingestion worker started')
  return worker
}

/**
 * Trigger an immediate ingestion (e.g. after major data changes)
 */
export async function triggerImmediateIngestion(
  reason = 'manual'
): Promise<string | null> {
  if (!ragIngestionQueue) {
    console.warn('[RAG] Cannot trigger ingestion — no Redis connection')
    return null
  }
  const job = await ragIngestionQueue.add(
    'immediate-ingest',
    { triggeredBy: reason },
    { removeOnComplete: { count: 10 }, removeOnFail: { count: 30 } }
  )
  return job.id ?? null
}
