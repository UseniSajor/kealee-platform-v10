import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { reportsQueue } from '../queues/reports.queue'
import { redis } from '../config/redis.config'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

// Mock PDFKit
vi.mock('pdfkit', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      fontSize: vi.fn().mockReturnThis(),
      font: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      moveDown: vi.fn().mockReturnThis(),
      pipe: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      page: { count: 1 },
    })),
  }
})

describe('Reports Queue', () => {
  beforeAll(async () => {
    // Test Redis connection
    try {
      await redis.ping()
    } catch (error) {
      console.warn('⚠️ Redis not available, skipping reports queue tests')
    }
  })

  afterAll(async () => {
    if (reportsQueue) {
      await reportsQueue.close()
    }
  })

  it('should create reports queue instance', () => {
    expect(reportsQueue).toBeDefined()
    expect(reportsQueue.name).toBe('reports')
  })

  it('should add report job to queue', async () => {
    try {
      const job = await reportsQueue.generateReport({
        type: 'weekly_summary',
        title: 'Test Report',
        data: { test: 'data' },
        format: 'pdf',
      })

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.data.type).toBe('weekly_summary')
      expect(job.data.title).toBe('Test Report')
      expect(job.data.format).toBe('pdf')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping report job test')
        return
      }
      throw error
    }
  })

  it('should add weekly summary report job', async () => {
    try {
      const job = await reportsQueue.generateWeeklySummary({
        summary: 'Test summary',
        metrics: { active: 5 },
      })

      expect(job).toBeDefined()
      expect(job.data.type).toBe('weekly_summary')
      expect(job.data.title).toBe('Weekly Summary Report')
      expect(job.data.data.summary).toBe('Test summary')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping weekly summary test')
        return
      }
      throw error
    }
  })

  it('should add project status report job', async () => {
    try {
      const job = await reportsQueue.generateProjectStatus({
        status: 'In Progress',
        progress: 75,
      })

      expect(job).toBeDefined()
      expect(job.data.type).toBe('project_status')
      expect(job.data.title).toBe('Project Status Report')
      expect(job.data.data.status).toBe('In Progress')
    } catch (error: any) {
      // Skip if Redis is not available
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('Redis')) {
        console.warn('⚠️ Redis not available, skipping project status test')
        return
      }
      throw error
    }
  })

  it('should get reports queue metrics', async () => {
    try {
      const metrics = await reportsQueue.getQueueCounts()
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
