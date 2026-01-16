import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { cronManager } from '../cron/cron.manager'
import { executeDailyDigest } from '../jobs/daily-digest.job'
import { executePerformanceCalculation } from '../jobs/performance-calculation.job'

// Mock queues
vi.mock('../queues/email.queue', () => ({
  emailQueue: {
    sendEmail: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
  },
}))

vi.mock('../queues/reports.queue', () => ({
  reportsQueue: {
    generateWeeklySummary: vi.fn().mockResolvedValue({ id: 'test-report-id' }),
  },
}))

describe('Cron Jobs', () => {
  beforeAll(() => {
    // Stop all jobs before tests
    cronManager.stopAllJobs()
  })

  afterAll(() => {
    // Clean up
    cronManager.stopAllJobs()
  })

  it('should register cron jobs', () => {
    cronManager.registerAllJobs()
    const status = cronManager.getStatus()
    expect(status.length).toBeGreaterThan(0)
  })

  it('should execute daily digest job', async () => {
    const result = await executeDailyDigest()
    expect(result).toBeDefined()
    expect(result.jobType).toBe('daily_digest')
    expect(result.success).toBe(true)
    expect(result.executedAt).toBeInstanceOf(Date)
  })

  it('should execute performance calculation job', async () => {
    const result = await executePerformanceCalculation()
    expect(result).toBeDefined()
    expect(result.jobType).toBe('performance_calculation')
    expect(result.success).toBe(true)
    expect(result.executedAt).toBeInstanceOf(Date)
  })

  it('should start and stop cron jobs', () => {
    cronManager.registerAllJobs()
    const status = cronManager.getStatus()
    
    if (status.length > 0) {
      const jobName = status[0].name
      cronManager.stopJob(jobName)
      cronManager.startJob(jobName)
      expect(cronManager.getStatus().find((j) => j.name === jobName)?.running).toBe(true)
    }
  })

  it('should validate cron expressions', () => {
    // Valid expressions
    expect(() => {
      cronManager.registerJob({
        name: 'test',
        type: 'daily_digest',
        schedule: '0 9 * * *',
        enabled: true,
      })
    }).not.toThrow()

    // Invalid expressions should be handled gracefully
    expect(() => {
      cronManager.registerJob({
        name: 'invalid',
        type: 'daily_digest',
        schedule: 'invalid',
        enabled: true,
      })
    }).not.toThrow()
  })
})
