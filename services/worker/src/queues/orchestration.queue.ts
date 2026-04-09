import { Queue } from 'bullmq'
import { redis } from '../config/redis.config'

export interface OrchestratorJobData {
  threadId: string
  userId?: string
  orgId?: string
  role?: string
  intent?: string
  phase?: string
  projectId?: string
  address?: string
  projectType?: string
  currentProductSku?: string
  paymentStatus?: string
  readiness?: Record<string, boolean>
  trigger: 'purchase_completed' | 'intake_submitted' | 'readiness_changed' | 'support_request' | 'manual'
  extra?: Record<string, unknown>
}

export const orchestrationQueue = new Queue<OrchestratorJobData>('orchestration', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
})

export async function enqueueOrchestratorRun(data: OrchestratorJobData, delayMs = 0) {
  const jobId = `orch_${data.threadId}_${data.trigger}_${Date.now()}`
  return orchestrationQueue.add('run', data, {
    jobId,
    delay: delayMs,
  })
}
