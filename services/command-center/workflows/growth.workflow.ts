/**
 * services/command-center/workflows/growth.workflow.ts
 *
 * Orchestrates GrowthBot recommendation execution:
 * - Fans out approved recommendations to outbound integrations
 * - Routes by action type (CRM, email, SMS, internal alert)
 * - Tracks execution state to prevent duplicates
 */

import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import type { GrowthRecommendation, SuggestedAction } from '../bots/growth/growth.types.js'
import { sendOutboundAction } from '../integrations/outbound.js'

const logger = createLogger('growth-workflow')

const EXECUTED_KEY_TTL = 86_400 * 7 // 7 days

export class GrowthWorkflow {
  constructor(private readonly redis: Redis) {}

  /**
   * Execute a list of approved GrowthBot recommendations.
   * Skips already-executed actions (dedup via Redis).
   */
  async executeRecommendations(
    recommendations: GrowthRecommendation[],
    approvedIds: string[],         // recommendation IDs approved by ops
  ): Promise<ExecutionReport> {
    const report: ExecutionReport = {
      total: 0,
      executed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    }

    const approvedSet = new Set(approvedIds)

    for (const rec of recommendations) {
      if (!approvedSet.has(rec.id)) {
        logger.debug({ recId: rec.id }, 'Recommendation not approved, skipping')
        report.skipped++
        continue
      }

      for (const action of rec.suggestedActions) {
        report.total++
        const execKey = `growth-exec:${rec.id}:${action.type}`

        // Dedup check
        const already = await this.redis.set(execKey, '1', 'EX', EXECUTED_KEY_TTL, 'NX')
        if (already === null) {
          logger.warn({ recId: rec.id, actionType: action.type }, 'Action already executed, skipping')
          report.skipped++
          continue
        }

        try {
          await sendOutboundAction(action, rec)
          report.executed++
          logger.info({ recId: rec.id, actionType: action.type }, 'Outbound action sent')
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error({ recId: rec.id, actionType: action.type, err: msg }, 'Outbound action failed')
          report.failed++
          report.errors.push({ recId: rec.id, actionType: action.type, error: msg })
          // Clear dedup key so it can be retried
          await this.redis.del(execKey)
        }
      }
    }

    logger.info(report, 'GrowthWorkflow execution complete')
    return report
  }

  /**
   * Auto-execute actions that don't require approval (internal alerts, dashboard).
   */
  async autoExecute(recommendations: GrowthRecommendation[]): Promise<ExecutionReport> {
    const autoApproved = recommendations
      .filter(r => r.autoExecute)
      .map(r => r.id)

    return this.executeRecommendations(recommendations, autoApproved)
  }
}

export interface ExecutionReport {
  total: number
  executed: number
  skipped: number
  failed: number
  errors: Array<{ recId: string; actionType: string; error: string }>
}
