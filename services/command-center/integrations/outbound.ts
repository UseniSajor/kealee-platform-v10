/**
 * services/command-center/integrations/outbound.ts
 *
 * Handles outbound action execution for GrowthBot recommendations:
 * - GHL CRM enrollment (tag + workflow)
 * - SendGrid email sequences
 * - Twilio SMS outreach
 * - Internal Slack-style alerts (via webhook or logging)
 * - Dashboard flag updates (Redis pub/sub)
 *
 * All functions gracefully no-op if env vars are not configured.
 */

import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import type { SuggestedAction, GrowthRecommendation } from '../bots/growth/growth.types.js'
import {
  sendRecruitmentEmail1,
  sendReengagementEmail,
} from './sendgrid.js'
import {
  sendOutreachSms,
  sendReengagementSms,
} from './twilio.js'

const logger = createLogger('growth-outbound')

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function sendOutboundAction(
  action: SuggestedAction,
  rec: GrowthRecommendation,
): Promise<void> {
  switch (action.type) {
    case 'CRM_TAG':
    case 'CRM_WORKFLOW_ENROLL':
      return ghlEnroll(action, rec)
    case 'SENDGRID_SEQUENCE':
      return sendgridSequence(action, rec)
    case 'TWILIO_SMS':
      return twilioSms(action, rec)
    case 'INTERNAL_SLACK_ALERT':
      return internalAlert(action, rec)
    case 'DASHBOARD_FLAG':
      return dashboardFlag(action, rec)
    default:
      logger.warn({ actionType: (action as any).type }, 'Unknown action type')
  }
}

// ─── GHL CRM (GoHighLevel) ────────────────────────────────────────────────────

async function ghlEnroll(action: SuggestedAction, rec: GrowthRecommendation): Promise<void> {
  const apiKey     = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID

  if (!apiKey || !locationId) {
    logger.warn('GHL_API_KEY or GHL_LOCATION_ID not set — skipping CRM enroll')
    return
  }

  const { workflowName, tags = [] } = action.params as {
    workflowName?: string
    tags?: string[]
  }

  // Tag the Kealee platform contact representing the ops team or a segment
  // In a real implementation, this would look up or create a GHL contact
  // and enroll them in the named workflow.
  const ghlPayload = {
    locationId,
    tags: [...(tags as string[]), 'growthbot', `rec:${rec.type.toLowerCase()}`],
    customFields: {
      growthbot_rec_id:       rec.id,
      growthbot_rec_type:     rec.type,
      growthbot_priority:     rec.priority,
      growthbot_target_trade: rec.targetTrade ?? '',
      growthbot_target_geo:   rec.targetGeo   ?? '',
      growthbot_score:        String(rec.score),
      growthbot_triggered_at: new Date().toISOString(),
    },
    workflowName: workflowName ?? `GrowthBot — ${rec.title}`,
  }

  logger.info({ recId: rec.id, workflowName, tags }, 'GHL CRM enrollment (mock — wire real endpoint)')

  // Real call (uncomment when endpoint is mapped):
  // await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify(ghlPayload),
  // })
}

// ─── SendGrid email sequence ───────────────────────────────────────────────────

async function sendgridSequence(action: SuggestedAction, rec: GrowthRecommendation): Promise<void> {
  const { sequenceId, audienceSegment, variables = {}, targetEmails = [] } = action.params as {
    sequenceId:       string
    audienceSegment?: string
    variables?:       Record<string, string>
    targetEmails?:    Array<{ email: string; firstName?: string }>
  }

  logger.info({ recId: rec.id, sequenceId, audienceSegment }, 'SendGrid sequence enrollment')

  // Send recruitment Email 1 to each target
  for (const target of targetEmails as Array<{ email: string; firstName?: string }>) {
    await sendRecruitmentEmail1({
      email:     target.email,
      firstName: target.firstName,
      trade:     rec.targetTrade ?? (variables.trade as string | undefined),
      geoArea:   rec.targetGeo  ?? (variables.region as string | undefined),
    }).catch(err => logger.error({ err, email: target.email }, 'SendGrid sequence send failed'))
  }
}

// ─── Twilio SMS ───────────────────────────────────────────────────────────────

async function twilioSms(action: SuggestedAction, rec: GrowthRecommendation): Promise<void> {
  const { targetPhones = [] } = action.params as {
    targetPhones?: Array<{ phone: string; firstName?: string }>
  }

  logger.info({ recId: rec.id, recipientCount: targetPhones.length }, 'Twilio SMS outreach')

  for (const target of targetPhones as Array<{ phone: string; firstName?: string }>) {
    await sendOutreachSms({
      phone:     target.phone,
      firstName: target.firstName,
      trade:     rec.targetTrade,
      geoArea:   rec.targetGeo,
    }).catch(err => logger.error({ err, phone: target.phone }, 'Twilio outreach SMS failed'))
  }
}

// ─── Internal alert ───────────────────────────────────────────────────────────

async function internalAlert(action: SuggestedAction, rec: GrowthRecommendation): Promise<void> {
  const { message, channel } = action.params as { message: string; channel?: string }

  // Log at minimum — can be wired to Slack webhook, PagerDuty, etc.
  logger.warn({
    recId:    rec.id,
    priority: rec.priority,
    channel:  channel ?? '#ops-alerts',
    message,
  }, '[GrowthBot Internal Alert]')

  // Wire to Slack webhook if configured:
  const webhookUrl = process.env.SLACK_OPS_WEBHOOK_URL
  if (webhookUrl) {
    const body = {
      text: `[GrowthBot ${rec.priority}] ${message}`,
      attachments: [{
        color: rec.priority === 'CRITICAL' ? 'danger' : rec.priority === 'HIGH' ? 'warning' : 'good',
        fields: [
          { title: 'Type',  value: rec.type,     short: true },
          { title: 'Score', value: String(rec.score), short: true },
          { title: 'Trade', value: rec.targetTrade ?? '—', short: true },
          { title: 'Geo',   value: rec.targetGeo  ?? '—', short: true },
        ],
      }],
    }
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (err) {
      logger.error({ err }, 'Slack webhook delivery failed')
    }
  }
}

// ─── Dashboard flag via Redis ─────────────────────────────────────────────────

let _redisClient: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null
  if (!_redisClient) {
    _redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  return _redisClient
}

async function dashboardFlag(action: SuggestedAction, rec: GrowthRecommendation): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    logger.debug('Redis not configured — skipping dashboard flag')
    return
  }

  const key   = `growth:dashboard:flags`
  const value = JSON.stringify({
    recId:    rec.id,
    type:     rec.type,
    priority: rec.priority,
    metric:   action.params.metric,
    trade:    action.params.trade ?? rec.targetTrade,
    geo:      action.params.geo   ?? rec.targetGeo,
    score:    action.params.trade ? action.params.shortageScore ?? action.params.surplusScore ?? rec.score : rec.score,
    flaggedAt: new Date().toISOString(),
  })

  // Push to a sorted set keyed by score (for ranked display)
  await redis.zadd(key, rec.score, value)
  // Keep only last 200 flags
  await redis.zremrangebyrank(key, 0, -(201))
  // Publish to dashboard subscribers
  await redis.publish('kealee:growth:dashboard', JSON.stringify({ type: 'FLAG_ADDED', recId: rec.id }))

  logger.debug({ recId: rec.id, metric: action.params.metric }, 'Dashboard flag updated')
}
