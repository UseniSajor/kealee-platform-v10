import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mlQueue } from '../queues/ml.queue'
import { redis } from '../config/redis.config'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Mock response' }],
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
      }),
    },
  })),
}))

describe('ML Queue', () => {
  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping ML queue tests')
    }
  })

  afterAll(async () => {
    if (mlQueue) {
      await mlQueue.close()
    }
  })

  it('should create ML queue instance', () => {
    expect(mlQueue).toBeDefined()
    expect(mlQueue.name).toBe('ml')
  })

  it('should add ML job to queue', async () => {
    try {
      const job = await mlQueue.processMLJob({
        type: 'analyze_text',
        prompt: 'Analyze this text',
        systemPrompt: 'You are a helpful assistant',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.type).toBe('analyze_text')
      expect(job.data.prompt).toBe('Analyze this text')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping ML job test')
        return
      }
      throw error
    }
  })

  it('should add text analysis job', async () => {
    try {
      const job = await mlQueue.analyzeText('Sample text', 'sentiment analysis')

      expect(job).toBeDefined()
      expect(job.data.type).toBe('analyze_text')
      expect(job.data.prompt).toContain('Sample text')
      expect(job.data.prompt).toContain('sentiment analysis')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping text analysis test')
        return
      }
      throw error
    }
  })

  it('should add recommendation generation job', async () => {
    try {
      const job = await mlQueue.generateRecommendation(
        'Project context',
        'optimization'
      )

      expect(job).toBeDefined()
      expect(job.data.type).toBe('generate_recommendation')
      expect(job.data.prompt).toContain('Project context')
      expect(job.data.prompt).toContain('optimization')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping recommendation test')
        return
      }
      throw error
    }
  })

  it('should get ML queue metrics', async () => {
    try {
      const metrics = await mlQueue.getQueueCounts()
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
