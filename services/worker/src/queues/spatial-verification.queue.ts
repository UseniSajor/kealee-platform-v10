import { BaseQueue } from './base.queue'

export interface SpatialVerificationJobData {
  verificationId: string
  milestoneId: string
  scanId: string
  milestoneName: string
  milestoneDescription?: string
  scanType: string
  scanCoverage?: number
  scanPointCount?: number
  scanProcessingNotes?: string
}

export class SpatialVerificationQueue extends BaseQueue<SpatialVerificationJobData> {
  constructor() {
    super('spatial-verification', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // 10s initial delay (AI calls can be slow)
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
      },
    })
  }

  /**
   * Enqueue a spatial verification job
   */
  async enqueueVerification(data: SpatialVerificationJobData) {
    return this.add('verify-milestone', data, {
      priority: 1, // Higher priority than background tasks
    })
  }
}

export const spatialVerificationQueue = new SpatialVerificationQueue()
