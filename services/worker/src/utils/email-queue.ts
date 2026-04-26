/**
 * services/worker/src/utils/email-queue.ts
 *
 * Re-exports emailQueue singleton as a getEmailQueue() factory.
 * Used by project-execution.processor and other processors.
 */

import { emailQueue } from '../queues/email.queue'
import type { EmailQueue } from '../queues/email.queue'

export function getEmailQueue(): EmailQueue {
  return emailQueue
}
