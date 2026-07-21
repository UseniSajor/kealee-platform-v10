import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { emailQueue } from '../queues/email.queue'
import { redis } from '../config/redis.config'

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([
      {
        statusCode: 202,
        headers: {
          'x-message-id': 'test-message-id',
        },
      },
    ]),
  },
}))

describe('Email Queue', () => {
  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping email queue tests')
    }
  })

  afterAll(async () => {
    if (emailQueue) {
      await emailQueue.close()
    }
  })

  it('should create email queue instance', () => {
    expect(emailQueue).toBeDefined()
    expect(emailQueue.name).toBe('email')
  })

  it('should add email job to queue', async () => {
    try {
      const job = await emailQueue.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.to).toBe('test@example.com')
      expect(job.data.subject).toBe('Test Email')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping email job test')
        return
      }
      throw error
    }
  })

  it('should add templated email job', async () => {
    try {
      const job = await emailQueue.sendTemplatedEmail(
        'user@example.com',
        'welcome',
        { name: 'John Doe' }
      )

      expect(job).toBeDefined()
      expect(job.data.template).toBe('welcome')
      expect(job.data.templateData).toEqual({ name: 'John Doe' })
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping templated email test')
        return
      }
      throw error
    }
  })

  it('should get email queue metrics', async () => {
    try {
      const metrics = await emailQueue.getQueueCounts()
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
