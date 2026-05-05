import { BaseQueue, BaseJobData } from './base.queue'

export interface LeadFollowupJobData extends BaseJobData {
  leadId: string
  email: string
  firstName?: string
  projectType?: string
  stage: string
  source?: string
  jobType:
    | 'sms_1h'
    | 'email_24h'
    | 'reminder_72h'
    | 'nurture_1h'
    | 'nurture_24h'
    | 'nurture_72h'
    | 'nurture_7d'
    | 'upsell_7d'
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
   * Abandoned checkout: 3-touch sequence (1h → 24h → 72h).
   * Called after intake form submission (before payment).
   */
  async enqueueSequence(data: Omit<LeadFollowupJobData, 'jobType'>) {
    const mk = (jobType: LeadFollowupJobData['jobType']): LeadFollowupJobData => ({ ...data, jobType } as LeadFollowupJobData)

    const [sms, email24, reminder] = await Promise.all([
      this.add('sms_1h',       mk('sms_1h'),       { delay: 1 * HOUR, jobId: `sms-1h-${data.leadId}` }),
      this.add('email_24h',    mk('email_24h'),    { delay: 1 * DAY,  jobId: `email-24h-${data.leadId}` }),
      this.add('reminder_72h', mk('reminder_72h'), { delay: 3 * DAY,  jobId: `reminder-72h-${data.leadId}` }),
    ])

    return { sms, email24, reminder }
  }

  /**
   * Soft capture nurture: 4-touch sequence (1h → 24h → 72h → 7d).
   * Called for contact_inquiries with source='soft_capture'.
   */
  async enqueueNurtureSequence(data: Omit<LeadFollowupJobData, 'jobType'>) {
    const mk = (jobType: LeadFollowupJobData['jobType']): LeadFollowupJobData => ({ ...data, jobType } as LeadFollowupJobData)

    const [t1h, t24h, t72h, t7d] = await Promise.all([
      this.add('nurture_1h',  mk('nurture_1h'),  { delay: 1 * HOUR, jobId: `nurture-1h-${data.leadId}` }),
      this.add('nurture_24h', mk('nurture_24h'), { delay: 1 * DAY,  jobId: `nurture-24h-${data.leadId}` }),
      this.add('nurture_72h', mk('nurture_72h'), { delay: 3 * DAY,  jobId: `nurture-72h-${data.leadId}` }),
      this.add('nurture_7d',  mk('nurture_7d'),  { delay: 7 * DAY,  jobId: `nurture-7d-${data.leadId}` }),
    ])

    return { t1h, t24h, t72h, t7d }
  }

  /**
   * Post-purchase upsell: single touch at 7 days after delivery.
   * Called after concept/permit/estimate delivery.
   */
  async enqueueUpsellSequence(data: Omit<LeadFollowupJobData, 'jobType'>) {
    const mk = (jobType: LeadFollowupJobData['jobType']): LeadFollowupJobData => ({ ...data, jobType } as LeadFollowupJobData)

    const upsell7d = await this.add(
      'upsell_7d',
      mk('upsell_7d'),
      { delay: 7 * DAY, jobId: `upsell-7d-${data.leadId}` }
    )

    return { upsell7d }
  }
}

export const leadFollowupQueue = new LeadFollowupQueue()
