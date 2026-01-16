import { BaseQueue, BaseJobData } from './base.queue'
import { MLJobData } from '../types/ml.types'

/**
 * ML processing queue for Claude API jobs
 */
export class MLQueue extends BaseQueue<MLJobData> {
  constructor() {
    super('ml', {
      defaultJobOptions: {
        attempts: 3, // ML jobs are expensive, fewer retries
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10 second delay
        },
        removeOnComplete: {
          age: 30 * 24 * 3600, // Keep completed ML jobs for 30 days
          count: 10000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed ML jobs for 7 days
        },
      },
    })
  }

  /**
   * Add an ML processing job to the queue
   */
  async processMLJob(data: MLJobData) {
    return this.add('process-ml', data, {
      priority: data.metadata?.priority || 0,
    })
  }

  /**
   * Add a text analysis job
   */
  async analyzeText(
    text: string,
    analysisType: string,
    options?: Partial<MLJobData>
  ) {
    return this.processMLJob({
      type: 'analyze_text',
      prompt: `Analyze the following text and provide ${analysisType}:\n\n${text}`,
      systemPrompt: 'You are a helpful assistant that analyzes text and provides insights.',
      ...options,
    })
  }

  /**
   * Add a recommendation generation job
   */
  async generateRecommendation(
    context: string,
    recommendationType: string,
    options?: Partial<MLJobData>
  ) {
    return this.processMLJob({
      type: 'generate_recommendation',
      prompt: `Based on the following context, generate ${recommendationType} recommendations:\n\n${context}`,
      systemPrompt: 'You are a helpful assistant that provides actionable recommendations.',
      ...options,
    })
  }
}

// Singleton instance
export const mlQueue = new MLQueue()
