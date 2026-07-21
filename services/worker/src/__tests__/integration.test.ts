import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { emailQueue } from '../queues/email.queue'
import { webhookQueue } from '../queues/webhook.queue'
import { mlQueue } from '../queues/ml.queue'
import { reportsQueue } from '../queues/reports.queue'
import { cronManager } from '../cron/cron.manager'
import { executeDailyDigest } from '../jobs/daily-digest.job'
import { executePerformanceCalculation } from '../jobs/performance-calculation.job'
import { redis } from '../config/redis.config'

describe('Worker Integration Tests', () => {
  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, some tests will be skipped')
    }
  })

  afterAll(async () => {
    // Clean up
    try {
      await emailQueue.close()
      await webhookQueue.close()
      await mlQueue.close()
      await reportsQueue.close()
      cronManager.stopAllJobs()
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Queue Integration', () => {
    it('should add jobs to all queues', async () => {
      try {
        // Email queue
        const emailJob = await emailQueue.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
        expect(emailJob).toBeDefined()

        // Webhook queue
        const webhookJob = await webhookQueue.deliverWebhook({
          url: 'https://httpbin.org/post',
          method: 'POST',
          body: { test: true },
        })
        expect(webhookJob).toBeDefined()

        // ML queue
        const mlJob = await mlQueue.processMLJob({
          type: 'analyze_text',
          prompt: 'Test prompt',
        })
        expect(mlJob).toBeDefined()

        // Reports queue
        const reportJob = await reportsQueue.generateReport({
          type: 'weekly_summary',
          title: 'Test Report',
          data: { test: true },
        })
        expect(reportJob).toBeDefined()
      } catch (error: any) {
        if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
          console.warn('⚠️ Redis not available, skipping queue integration test')
          return
        }
        throw error
      }
    })

    it('should get metrics from all queues', async () => {
      try {
        const emailMetrics = await emailQueue.getQueueCounts()
        expect(emailMetrics).toBeDefined()

        const webhookMetrics = await webhookQueue.getQueueCounts()
        expect(webhookMetrics).toBeDefined()

        const mlMetrics = await mlQueue.getQueueCounts()
        expect(mlMetrics).toBeDefined()

        const reportsMetrics = await reportsQueue.getQueueCounts()
        expect(reportsMetrics).toBeDefined()
      } catch (error: any) {
        if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
          console.warn('⚠️ Redis not available, skipping metrics test')
          return
        }
        throw error
      }
    })
  })

  describe('Cron Job Integration', () => {
    it('should register all cron jobs', () => {
      cronManager.registerAllJobs()
      const status = cronManager.getStatus()
      expect(status.length).toBeGreaterThan(0)
    })

    it('should execute daily digest job', async () => {
      const result = await executeDailyDigest()
      expect(result).toBeDefined()
      expect(result.jobType).toBe('daily_digest')
      expect(result.success).toBe(true)
    })

    it('should execute performance calculation job', async () => {
      const result = await executePerformanceCalculation()
      expect(result).toBeDefined()
      expect(result.jobType).toBe('performance_calculation')
      expect(result.success).toBe(true)
    })

    it('should start and stop cron jobs', () => {
      cronManager.registerAllJobs()
      const status = cronManager.getStatus()

      if (status.length > 0) {
        const jobName = status[0].name
        cronManager.stopJob(jobName)
        const stoppedStatus = cronManager.getStatus().find((j) => j.name === jobName)
        expect(stoppedStatus?.running).toBe(false)

        cronManager.startJob(jobName)
        const startedStatus = cronManager.getStatus().find((j) => j.name === jobName)
        expect(startedStatus?.running).toBe(true)
      }
    })
  })
})
