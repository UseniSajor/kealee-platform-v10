/**
 * Cost Tracker Service
 * Aggregates LLM API costs and cache savings across all bot executions
 * Tracks: API costs, cache hits, tokens used, savings
 *
 * Usage:
 *   import { getCostTracker } from '@kealee/automation'
 *   const tracker = getCostTracker()
 *   tracker.recordBotExecution('design', { cacheHit: true, inputTokens: 1000, outputTokens: 500 })
 *   const stats = await tracker.getStats('daily')
 */

import { getQueueConnection } from './redis'
import type { Redis } from 'ioredis'

/**
 * Pricing per 1M tokens (as of July 2026)
 * Updates required when Anthropic pricing changes
 */
const ANTHROPIC_PRICING = {
  'claude-opus-4-6': {
    input: 0.015,      // $15 per 1M input tokens
    output: 0.080,     // $80 per 1M output tokens
    cacheCreation: 0.00375,  // 25% of input cost
    cacheRead: 0.003,  // 20% of input cost
  },
  'claude-sonnet-4-6': {
    input: 0.003,
    output: 0.015,
    cacheCreation: 0.00075,
    cacheRead: 0.0006,
  },
  default: {
    input: 0.003,
    output: 0.015,
    cacheCreation: 0.00075,
    cacheRead: 0.0006,
  },
}

export interface BotExecutionRecord {
  botType: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  cacheHit: boolean
  savedTokens: number
  estimatedCostUsd: number
  timestamp: Date
  projectId?: string
  durationMs: number
}

export interface CostStats {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  totalExecutions: number
  cacheHitRate: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokensSaved: number
  totalCostUsd: number
  costSavedUsd: number
  costPerExecution: number
  avgCacheHitRate: number
  botBreakdown: Record<
    string,
    {
      executions: number
      cacheHits: number
      totalCost: number
      costSaved: number
    }
  >
}

class CostTracker {
  private redis: Redis
  private buffer: BotExecutionRecord[] = []
  private bufferFlushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.redis = getQueueConnection()
    this.startBufferFlush()
  }

  /**
   * Periodically flush buffer to Redis (every 10 seconds)
   */
  private startBufferFlush(): void {
    this.bufferFlushInterval = setInterval(
      () => this.flushBuffer(),
      10_000
    )
  }

  /**
   * Calculate cost for an API call
   */
  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cacheCreationTokens: number = 0,
    cacheReadTokens: number = 0,
  ): number {
    const pricing = (ANTHROPIC_PRICING as any)[model] || ANTHROPIC_PRICING.default
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    const cacheCreationCost = (cacheCreationTokens / 1_000_000) * pricing.cacheCreation
    const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cacheRead

    return inputCost + outputCost + cacheCreationCost + cacheReadCost
  }

  /**
   * Record a bot execution
   */
  recordBotExecution(record: BotExecutionRecord): void {
    this.buffer.push(record)

    // Auto-flush on large buffer
    if (this.buffer.length >= 100) {
      this.flushBuffer()
    }
  }

  /**
   * Flush buffer to Redis
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return

    try {
      const records = [...this.buffer]
      this.buffer = []

      // Store each record with timestamp-based key
      for (const record of records) {
        const timestamp = record.timestamp.getTime()
        const key = `cost:execution:${timestamp}:${Math.random().toString(36).slice(2)}`
        const ttl = 90 * 24 * 60 * 60 // 90 days retention
        await this.redis.setex(key, ttl, JSON.stringify(record))
      }

      // Update aggregates
      const now = new Date()
      const dayKey = `cost:daily:${now.toISOString().split('T')[0]}`
      const hourKey = `cost:hourly:${now.toISOString().split(':')[0]}:00`

      for (const record of records) {
        // Increment counters
        await this.redis.hincrby(dayKey, 'executions', 1)
        await this.redis.hincrby(dayKey, 'cacheHits', record.cacheHit ? 1 : 0)
        await this.redis.hincrbyfloat(dayKey, 'totalCost', record.estimatedCostUsd)
        await this.redis.hincrbyfloat(dayKey, 'tokensSaved', record.savedTokens)

        // Bot-specific tracking
        const botKey = `${dayKey}:${record.botType}`
        await this.redis.hincrby(botKey, 'executions', 1)
        await this.redis.hincrbyfloat(botKey, 'cost', record.estimatedCostUsd)
      }

      // Set expiry on aggregate keys
      const ttl = 90 * 24 * 60 * 60
      await this.redis.expire(dayKey, ttl)
    } catch (err) {
      console.error('[CostTracker] Failed to flush buffer:', err)
    }
  }

  /**
   * Get cost statistics for a time period
   */
  async getStats(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<CostStats> {
    try {
      const now = new Date()
      let days = 1

      if (period === 'hourly') {
        days = 1
      } else if (period === 'daily') {
        days = 1
      } else if (period === 'weekly') {
        days = 7
      } else if (period === 'monthly') {
        days = 30
      }

      const stats: CostStats = {
        period,
        totalExecutions: 0,
        cacheHitRate: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokensSaved: 0,
        totalCostUsd: 0,
        costSavedUsd: 0,
        costPerExecution: 0,
        avgCacheHitRate: 0,
        botBreakdown: {},
      }

      // Scan for keys in date range
      const keys: string[] = []
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const pattern = `cost:daily:${dateStr}`

        const cursor = '0'
        let result = await this.redis.scan(cursor, 'MATCH', `${pattern}*`, 'COUNT', 100)
        keys.push(...result[1])
      }

      // Aggregate stats
      let cacheHits = 0
      for (const key of keys) {
        if (!key.includes(':') || key.includes('execution')) continue

        const data = await this.redis.hgetall(key)
        const executions = parseInt(data.executions || '0', 10)
        const hits = parseInt(data.cacheHits || '0', 10)
        const cost = parseFloat(data.totalCost || '0')
        const tokensSaved = parseFloat(data.tokensSaved || '0')

        stats.totalExecutions += executions
        cacheHits += hits
        stats.totalCostUsd += cost
        stats.totalTokensSaved += tokensSaved

        // Extract bot type if present
        const botMatch = key.match(/:(\w+)$/)
        if (botMatch) {
          const botType = botMatch[1]
          if (!stats.botBreakdown[botType]) {
            stats.botBreakdown[botType] = {
              executions: 0,
              cacheHits: 0,
              totalCost: 0,
              costSaved: 0,
            }
          }
          stats.botBreakdown[botType].executions += executions
          stats.botBreakdown[botType].cacheHits += hits
          stats.botBreakdown[botType].totalCost += cost
        }
      }

      // Calculate rates and averages
      if (stats.totalExecutions > 0) {
        stats.cacheHitRate = cacheHits / stats.totalExecutions
        stats.avgCacheHitRate = stats.cacheHitRate
        stats.costPerExecution = stats.totalCostUsd / stats.totalExecutions
        // Rough estimate: cache hit saves ~50% of cost
        stats.costSavedUsd = (cacheHits * stats.costPerExecution) * 0.5
      }

      return stats
    } catch (err) {
      console.error('[CostTracker] Failed to get stats:', err)
      return {
        period,
        totalExecutions: 0,
        cacheHitRate: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokensSaved: 0,
        totalCostUsd: 0,
        costSavedUsd: 0,
        costPerExecution: 0,
        avgCacheHitRate: 0,
        botBreakdown: {},
      }
    }
  }

  /**
   * Get cost forecast for next N days
   */
  async forecast(daysAhead: number = 7): Promise<{ date: string; projectedCostUsd: number }[]> {
    try {
      const dailyStats = await this.getStats('daily')
      const avgDailyCost = dailyStats.totalCostUsd
      const forecast = []

      for (let i = 0; i < daysAhead; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        forecast.push({
          date: date.toISOString().split('T')[0],
          projectedCostUsd: avgDailyCost,
        })
      }

      return forecast
    } catch (err) {
      console.error('[CostTracker] Failed to forecast:', err)
      return []
    }
  }

  /**
   * Cleanup old records (90+ days)
   */
  async cleanup(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const cutoffTimestamp = ninetyDaysAgo.getTime()

      // Scan and delete old keys
      let deleted = 0
      const cursor = '0'
      let result = await this.redis.scan(cursor, 'MATCH', 'cost:*', 'COUNT', 1000)
      const keys = result[1]

      for (const key of keys) {
        if (key.includes('execution')) {
          const match = key.match(/:(\d+):/)
          if (match && parseInt(match[1], 10) < cutoffTimestamp) {
            await this.redis.del(key)
            deleted++
          }
        }
      }

      return deleted
    } catch (err) {
      console.error('[CostTracker] Cleanup failed:', err)
      return 0
    }
  }

  /**
   * Shutdown tracker
   */
  shutdown(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval)
    }
    this.flushBuffer()
  }
}

// Singleton instance
let trackerInstance: CostTracker | null = null

export function getCostTracker(): CostTracker {
  if (!trackerInstance) {
    trackerInstance = new CostTracker()
  }
  return trackerInstance
}
