/**
 * Structured logger for BullMQ Worker
 */

import { createLogger as createBaseLogger, withContext } from '@kealee/observability'

export const logger = createBaseLogger('worker')

/**
 * Create a job-scoped logger with queue and jobId context
 */
export function createJobLogger(queueName: string, jobId: string) {
  return withContext(logger, {
    queue: queueName,
    jobId,
  })
}

/**
 * Create a queue-scoped logger
 */
export function createQueueLogger(queueName: string) {
  return withContext(logger, {
    queue: queueName,
  })
}
