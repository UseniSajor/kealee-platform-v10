/**
 * ML Prediction Queue
 * Queue for ML prediction jobs (timeline risks, resource allocation)
 */

import { BaseQueue } from './base.queue'
import type { MLPredictionJobData, MLPredictionJobResult } from '../types/ml-prediction.types'

export class MLPredictionQueue extends BaseQueue<MLPredictionJobData> {
  constructor() {
    super('ml-predictions', {
      defaultJobOptions: {
        attempts: 2, // Fewer retries for expensive ML jobs
        backoff: {
          type: 'exponential',
          delay: 15000, // Start with 15 second delay
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed predictions for 7 days
          count: 5000,
        },
        removeOnFail: {
          age: 3 * 24 * 3600, // Keep failed predictions for 3 days
        },
      },
    })
  }

  /**
   * Add a timeline risk prediction job
   */
  async predictTimelineRisks(
    projectId: string,
    options?: {
      includeHistoricalData?: boolean
      includePermitHistory?: boolean
    }
  ) {
    return this.add(
      'predict-timeline-risks',
      {
        type: 'TIMELINE_RISK',
        projectId,
        options: {
          includeHistoricalData: true,
          includePermitHistory: true,
          ...options,
        },
      },
      {
        priority: 5, // Medium priority
      }
    )
  }

  /**
   * Add a resource allocation suggestion job
   */
  async suggestResources(
    projectId: string,
    phase: string,
    options?: {
      includeContractorData?: boolean
    }
  ) {
    return this.add(
      'suggest-resources',
      {
        type: 'RESOURCE_ALLOCATION',
        projectId,
        phase,
        options: {
          includeContractorData: true,
          ...options,
        },
      },
      {
        priority: 5, // Medium priority
      }
    )
  }
}

// Singleton instance
export const mlPredictionQueue = new MLPredictionQueue()
