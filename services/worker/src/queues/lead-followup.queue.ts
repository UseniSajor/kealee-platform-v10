import { BaseQueue, BaseJobData } from './base.queue'

export interface LeadFollowupJobData extends BaseJobData {
  leadId: string
  email: string
  firstName?: string
  projectType?: string
  stage: string
  source?: string
  jobType: 'sms_1h' | 'email_24h' | 'reminder_72h'
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/**
 * Lead follow-up queue — handles delayed SMS and email sequences
 * after a lead event (intake start, ask bar submission, etc.)
 */
export class LeadFollowupQueue extends BaseQueue<LeadFollowupJobData> {
  constructor() {
    super('lead-followup', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30_000,
        },
        removeOnComplete: { age: 7 * 24 * 3600, count: 10_000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    })
  }

  /**
   * Enqueue the full 3-touch follow-up sequence for a new lead.
   * All jobs are delayed independently — they will fire even if earlier ones fail.
   */
  async enqueueSequence(data: Omit<LeadFollowupJobData, 'jobType'>) {
    const base = { ...data }

    const [sms, email24, reminder] = await Promise.all([
      this.add(
        'sms_1h',
        { ...base, jobType: 'sms_1h' },
        { delay: 1 * HOUR, jobId: `sms-1h-${data.leadId}` }
      ),
      this.add(
        'email_24h',
        { ...base, jobType: 'email_24h' },
        { delay: 1 * DAY, jobId: `email-24h-${data.leadId}` }
      ),
      this.add(
        'reminder_72h',
        { ...base, jobType: 'reminder_72h' },
        { delay: 3 * DAY, jobId: `reminder-72h-${data.leadId}` }
      ),
    ])

    return { sms, email24, reminder }
  }
}

export const leadFollowupQueue = new LeadFollowupQueue()
