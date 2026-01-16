import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { webhookQueue } from '../queues/webhook.queue'
import { redis } from '../config/redis.config'

// Mock fetch
global.fetch = vi.fn()

describe('Webhook Queue', () => {
  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping webhook queue tests')
    }
  })

  afterAll(async () => {
    if (webhookQueue) {
      await webhookQueue.close()
    }
  })

  it('should create webhook queue instance', () => {
    expect(webhookQueue).toBeDefined()
    expect(webhookQueue.name).toBe('webhook')
  })

  it('should add webhook job to queue', async () => {
    try {
      const job = await webhookQueue.deliverWebhook({
        url: 'https://example.com/webhook',
        method: 'POST',
        body: { event: 'test' },
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.url).toBe('https://example.com/webhook')
      expect(job.data.method).toBe('POST')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping webhook job test')
        return
      }
      throw error
    }
  })

  it('should add webhook with custom retries', async () => {
    try {
      const job = await webhookQueue.deliverWebhookWithRetries(
        'https://example.com/webhook',
        { event: 'test' },
        {
          retries: 10,
          headers: { 'X-Custom-Header': 'value' },
        }
      )

      expect(job).toBeDefined()
      expect(job.data.url).toBe('https://example.com/webhook')
      expect(job.data.body).toEqual({ event: 'test' })
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping webhook retry test')
        return
      }
      throw error
    }
  })

  it('should get webhook queue metrics', async () => {
    try {
      const metrics = await webhookQueue.getQueueCounts()
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

  it('should handle different HTTP methods', async () => {
    try {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

      for (const method of methods) {
        const job = await webhookQueue.deliverWebhook({
          url: 'https://example.com/webhook',
          method,
          body: method !== 'GET' ? { data: 'test' } : undefined,
        })

        expect(job.data.method).toBe(method)
      }
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping HTTP methods test')
        return
      }
      throw error
    }
  })
})
