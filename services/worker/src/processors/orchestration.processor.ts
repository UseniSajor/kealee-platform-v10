import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import type { OrchestratorJobData } from '../queues/orchestration.queue'

async function processOrchestratorJob(job: Job<OrchestratorJobData>) {
  const { threadId, trigger } = job.data
  console.log(`[orchestration] Processing job ${job.id} — threadId=${threadId} trigger=${trigger}`)

  try {
    // Dynamic import to avoid circular deps at startup
    const { runOrchestrator } = await import('@kealee/ai-orchestrator')
    const result = await runOrchestrator({
      threadId,
      userId: job.data.userId,
      orgId: job.data.orgId,
      role: job.data.role as Parameters<typeof runOrchestrator>[0]['role'],
      intent: job.data.intent as Parameters<typeof runOrchestrator>[0]['intent'],
      phase: job.data.phase as Parameters<typeof runOrchestrator>[0]['phase'],
      projectId: job.data.projectId,
      address: job.data.address,
      projectType: job.data.projectType,
      currentProductSku: job.data.currentProductSku as Parameters<typeof runOrchestrator>[0]['currentProductSku'],
      paymentStatus: job.data.paymentStatus as Parameters<typeof runOrchestrator>[0]['paymentStatus'],
      readiness: job.data.readiness,
      extra: job.data.extra,
    })

    console.log(
      `[orchestration] Job ${job.id} completed — phase=${result.phase} subgraph=${result.activeSubgraph ?? 'none'}`
    )

    return {
      threadId: result.threadId,
      phase: result.phase,
      subgraph: result.activeSubgraph,
      recommendedNextProduct: result.recommendedNextProduct?.sku,
    }
  } catch (error: unknown) {
    console.error(`[orchestration] Job ${job.id} failed:`, error)
    throw error
  }
}

export function createOrchestrationWorker() {
  const worker = new Worker<OrchestratorJobData>(
    'orchestration',
    processOrchestratorJob,
    {
      connection: redis,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[orchestration] ✅ Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[orchestration] ❌ Job ${job?.id} failed:`, err.message)
  })

  return worker
}
