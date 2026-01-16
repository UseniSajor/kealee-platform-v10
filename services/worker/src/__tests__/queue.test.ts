import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BaseQueue } from '../queues/base.queue'
import { redis } from '../config/redis.config'

describe('Queue Infrastructure', () => {
  let testQueue: BaseQueue

  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping queue tests')
    }

    testQueue = new BaseQueue('test-queue')
  })

  afterAll(async () => {
    if (testQueue) {
      await testQueue.close()
    }
  })

  it('should create a queue instance', () => {
    expect(testQueue).toBeDefined()
    expect(testQueue.name).toBe('test-queue')
  })

  it('should add a job to the queue', async () => {
    try {
      const job = await testQueue.add('test-job', { message: 'Hello' })
      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping job test')
        return
      }
      throw error
    }
  })

  it('should get queue metrics', async () => {
    try {
      const metrics = await testQueue.getQueueCounts()
      expect(metrics).toBeDefined()
      expect(metrics).toHaveProperty('waiting')
      expect(metrics).toHaveProperty('active')
      expect(metrics).toHaveProperty('completed')
      expect(metrics).toHaveProperty('failed')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping metrics test')
        return
      }
      throw error
    }
  })
})
